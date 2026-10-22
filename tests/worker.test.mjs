import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import worker from "../src/worker.js";

const TOKEN = "worker-test-token";
const ASIN = "B012345678";
const PRODUCT_URL = `https://www.amazon.co.jp/dp/${ASIN}`;

function createFixture(t) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  sqlite.exec("PRAGMA foreign_keys = ON");
  for (const name of ["0001_create_items.sql", "0002_multi_wishlist.sql"]) {
    sqlite.exec(readFileSync(new URL(`../migrations/${name}`, import.meta.url), "utf8"));
  }
  // Existing installations have these columns. Repairing the historical
  // migration sequence is separate from the Worker transaction regression tests.
  for (const column of [
    "title TEXT", "image_url TEXT", "price INTEGER", "currency TEXT", "price_updated_at TEXT"
  ]) {
    sqlite.exec(`ALTER TABLE items ADD COLUMN ${column}`);
  }
  for (const name of ["0003_price_history.sql", "0004_item_preferences.sql"]) {
    sqlite.exec(readFileSync(new URL(`../migrations/${name}`, import.meta.url), "utf8"));
  }
  sqlite.exec(`
    INSERT INTO wishlists (id, name, slug, amazon_list_id)
    VALUES (1, 'Main', 'main', 'MAIN123');
  `);

  // Use real SQLite statements and serialize batches as whole transactions,
  // matching the D1 binding's documented ordering and rollback behavior.
  let pending = Promise.resolve();
  function enqueue(operation) {
    const result = pending.then(operation);
    pending = result.catch(() => {});
    return result;
  }
  const db = {
    failReads: false,
    prepare(sql, values = []) {
      return {
        sql,
        values,
        bind(...bindings) { return db.prepare(sql, bindings); },
        first() {
          return enqueue(() => {
            if (db.failReads) throw new Error("Injected database read failure");
            return sqlite.prepare(sql).get(...values) ?? null;
          });
        },
        all() {
          return enqueue(() => {
            if (db.failReads) throw new Error("Injected database read failure");
            return { results: sqlite.prepare(sql).all(...values) };
          });
        },
        run() { return enqueue(() => sqlite.prepare(sql).run(...values)); }
      };
    },
    batch(statements) {
      return enqueue(() => {
        sqlite.exec("BEGIN");
        try {
          const results = statements.map(({ sql, values }) => sqlite.prepare(sql).run(...values));
          sqlite.exec("COMMIT");
          return results;
        } catch (error) {
          sqlite.exec("ROLLBACK");
          throw error;
        }
      });
    }
  };
  const env = { DB: db, SYNC_TOKEN: TOKEN };
  function request(path, { method = "GET", body, authorized = true } = {}) {
    return worker.fetch(new Request(`https://example.test${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...(authorized ? { authorization: `Bearer ${TOKEN}` } : {})
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    }), env);
  }
  function save(fields = {}) {
    return request("/api/items", {
      method: "POST", body: { url: PRODUCT_URL, list: "main", ...fields }
    });
  }
  function history() {
    return sqlite.prepare("SELECT price, currency FROM price_history ORDER BY id")
      .all().map((row) => ({ ...row }));
  }
  function rejectPrice(price) {
    sqlite.exec(`
      CREATE TRIGGER reject_history BEFORE INSERT ON price_history
      WHEN NEW.price = ${price}
      BEGIN SELECT RAISE(ABORT, 'Injected history failure'); END;
    `);
  }
  function silenceExpectedErrors() {
    t.mock.method(console, "error", () => {});
  }
  return { sqlite, db, request, save, history, rejectPrice, silenceExpectedErrors };
}

async function assertInternalError(response) {
  assert.equal(response.status, 500);
  assert.match(response.headers.get("content-type"), /application\/json/);
  assert.deepEqual(await response.json(), { error: "Internal server error." });
}

test("new items save their price, history, and priority together", async (t) => {
  const f = createFixture(t);
  const response = await f.save({ price: 100, priority: "high" });
  assert.equal(response.status, 201);
  const item = await response.json();
  assert.equal(item.price, 100);
  assert.equal(item.priority, "high");
  assert.equal(item.price_history_count, 1);
  assert.deepEqual(f.history(), [{ price: 100, currency: "JPY" }]);
});

test("unchanged prices do not create repeated points; real changes do", async (t) => {
  const f = createFixture(t);
  for (const price of [100, 100, 200, 100, 100]) {
    assert.equal((await f.save({ price })).status, 201);
  }
  assert.deepEqual(f.history().map((row) => row.price), [100, 200, 100]);
});

test("a history failure rolls back an existing item's price and metadata", async (t) => {
  const f = createFixture(t);
  f.silenceExpectedErrors();
  await f.save({ price: 100, priority: "low", title: "Original" });
  f.rejectPrice(200);
  await assertInternalError(await f.save({ price: 200, priority: "high", title: "Changed" }));
  const item = f.sqlite.prepare("SELECT price, title FROM items").get();
  assert.equal(item.price, 100);
  assert.equal(item.title, "Original");
  assert.equal(f.sqlite.prepare("SELECT priority FROM item_preferences").get().priority, "low");
  assert.deepEqual(f.history(), [{ price: 100, currency: "JPY" }]);
  f.sqlite.exec("DROP TRIGGER reject_history");
  assert.equal((await f.save({ price: 200, priority: "high" })).status, 201);
  assert.deepEqual(f.history().map((row) => row.price), [100, 200]);
});

test("a history failure rolls back a newly inserted item", async (t) => {
  const f = createFixture(t);
  f.silenceExpectedErrors();
  f.rejectPrice(200);
  await assertInternalError(await f.save({ price: 200, priority: "high" }));
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS count FROM items").get().count, 0);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS count FROM item_preferences").get().count, 0);
  assert.deepEqual(f.history(), []);
});

test("a priority failure also rolls back price and history writes", async (t) => {
  const f = createFixture(t);
  f.silenceExpectedErrors();
  await f.save({ price: 100, priority: "low" });
  f.sqlite.exec(`
    CREATE TRIGGER reject_priority BEFORE INSERT ON item_preferences
    WHEN NEW.priority = 'high'
    BEGIN SELECT RAISE(ABORT, 'Injected priority failure'); END;
  `);
  await assertInternalError(await f.save({ price: 200, priority: "high" }));
  assert.equal(f.sqlite.prepare("SELECT price FROM items").get().price, 100);
  assert.deepEqual(f.history().map((row) => row.price), [100]);
  assert.equal(f.sqlite.prepare("SELECT priority FROM item_preferences").get().priority, "low");
});

test("concurrent identical updates append only one changed-price point", async (t) => {
  const f = createFixture(t);
  await f.save({ price: 100 });
  const responses = await Promise.all(Array.from({ length: 8 }, () => f.save({ price: 200 })));
  assert.ok(responses.every((response) => response.status === 201));
  assert.deepEqual(f.history().map((row) => row.price), [100, 200]);
  const data = await (await f.request("/api/items")).json();
  assert.equal(data.items[0].previous_price, 100);
});

test("concurrent first-time saves create one item and one baseline", async (t) => {
  const f = createFixture(t);
  const responses = await Promise.all(Array.from({ length: 8 }, () => f.save({ price: 100 })));
  assert.ok(responses.every((response) => response.status === 201));
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS count FROM items").get().count, 1);
  assert.deepEqual(f.history().map((row) => row.price), [100]);
});

test("concurrent distinct updates keep the latest history aligned with the item", async (t) => {
  const f = createFixture(t);
  await f.save({ price: 100 });
  const responses = await Promise.all([200, 300, 400].map((price) => f.save({ price })));
  assert.ok(responses.every((response) => response.status === 201));
  const points = f.history().map((row) => row.price);
  assert.equal(points.length, 4);
  assert.deepEqual(new Set(points), new Set([100, 200, 300, 400]));
  assert.equal(points.at(-1), f.sqlite.prepare("SELECT price FROM items").get().price);
});

test("retrying a previously missing history point repairs it once", async (t) => {
  const f = createFixture(t);
  await f.save({ price: 100 });
  f.sqlite.exec("UPDATE items SET price = 200");
  await f.save({ price: 200 });
  await f.save({ price: 200 });
  assert.deepEqual(f.history().map((row) => row.price), [100, 200]);
});

test("clearing prices preserves history and metadata-only updates add no point", async (t) => {
  const f = createFixture(t);
  await f.save({ price: 100 });
  await f.save({ title: "Metadata only", priority: "medium" });
  assert.deepEqual(f.history().map((row) => row.price), [100]);
  const cleared = await (await f.save({ clearPrice: true })).json();
  assert.equal(cleared.price, null);
  assert.equal(cleared.currency, null);
  assert.deepEqual(f.history().map((row) => row.price), [100]);
  await f.save({ price: 100 });
  assert.deepEqual(f.history().map((row) => row.price), [100]);
  await f.save({ price: 200 });
  assert.deepEqual(f.history().map((row) => row.price), [100, 200]);
});

test("zero prices and currency changes remain valid history changes", async (t) => {
  const f = createFixture(t);
  for (const currency of ["JPY", "USD", "USD"]) {
    assert.equal((await f.save({ price: 0, currency })).status, 201);
  }
  assert.deepEqual(f.history(), [{ price: 0, currency: "JPY" }, { price: 0, currency: "USD" }]);
});

test("the same ASIN in separate wishlists keeps independent histories", async (t) => {
  const f = createFixture(t);
  f.sqlite.exec("INSERT INTO wishlists (id, name, slug, amazon_list_id) VALUES (2, 'Other', 'other', 'OTHER123')");
  await f.save({ price: 100 });
  await f.save({ list: "other", price: 200 });
  assert.deepEqual(f.sqlite.prepare(`
    SELECT i.wishlist_id, ph.price
    FROM price_history AS ph JOIN items AS i ON i.id = ph.item_id
    ORDER BY i.wishlist_id
  `).all().map((row) => ({ ...row })), [{ wishlist_id: 1, price: 100 }, { wishlist_id: 2, price: 200 }]);
});

const routes = [
  ["GET", "/api/wishlists"],
  ["POST", "/api/wishlists", { name: "Main", slug: "main", amazonUrl: "https://www.amazon.co.jp/hz/wishlist/ls/MAIN123" }],
  ["GET", "/api/items"],
  ["POST", "/api/items", { url: PRODUCT_URL, list: "main", price: 200 }],
  ["POST", "/api/items/bulk", { action: "priority", priority: "high", items: [{ asin: ASIN, list: "main" }] }],
  ["GET", "/api/export"],
  ["POST", "/api/budget-pick", { budget: 1000, count: 1 }],
  ["GET", `/api/items/${ASIN}/history?list=main`],
  ["DELETE", `/api/items/${ASIN}?list=main`]
];
for (const [method, path, body] of routes) {
  test(`${method} ${path} converts asynchronous database failures to JSON 500`, async (t) => {
    const f = createFixture(t);
    f.silenceExpectedErrors();
    if (method === "POST" && path === "/api/wishlists") {
      // This handler only writes, so use a real uniqueness violation.
      f.sqlite.exec("INSERT INTO wishlists (name, slug, amazon_list_id) VALUES ('Other', 'other', 'OTHER123')");
      await assertInternalError(await f.request(path, { method, body: { ...body, slug: "other" } }));
    } else {
      f.db.failReads = true;
      await assertInternalError(await f.request(path, { method, body }));
    }
  });
}

test("validation and authorization errors keep their existing status codes", async (t) => {
  const f = createFixture(t);
  assert.equal((await f.request("/api/items", { method: "POST", body: { url: PRODUCT_URL }, authorized: false })).status, 401);
  assert.equal((await f.save({ price: -1 })).status, 400);
  assert.equal((await f.request("/api/unknown")).status, 404);
  assert.deepEqual(f.history(), []);
});
