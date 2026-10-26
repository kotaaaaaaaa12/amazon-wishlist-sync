const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../scriptable/Wishlist Sync.js"), "utf8")
  .replace(/^await main\(\);\s*finishRun\(\);/m, "");
const ITEM = { asin: "B012345678", wishlist_slug: "main", title: "Test Item" };
const SECOND = { asin: "B098765432", wishlist_slug: "other", title: "Other Item" };
const RECORDS = [
  { id: 2, price: 30000, currency: "JPY", recorded_at: "2026-10-02 12:00:00" },
  { id: 1, price: 1000, currency: "JPY", recorded_at: "2026-10-01 12:00:00" }
];

function fixture({ language = "en", tableChoices = [], alertChoices = [], records = RECORDS, failure = false } = {}) {
  let history = records.map((record) => ({ ...record }));
  const requests = [], tables = [], alerts = [], messages = [];
  const context = vm.createContext({
    Device: { language: () => language },
    UITable: class {
      constructor() { this.rows = []; tables.push(this); }
      addRow(row) { this.rows.push(row); }
      async present() {
        const choice = tableChoices.shift();
        if (choice !== undefined) await this.rows[choice].onSelect?.();
      }
    },
    UITableRow: class {
      addText(...texts) { this.texts = texts; }
    },
    Alert: class {
      constructor() { this.actions = []; alerts.push(this); }
      addAction(label) { this.actions.push(label); }
      addDestructiveAction(label) { this.actions.push(label); }
      addCancelAction(label) { this.cancel = label; }
      async presentAlert() { return alertChoices.shift() ?? -1; }
      async presentSheet() { return alertChoices.shift() ?? -1; }
    }
  });
  vm.runInContext(script, context);
  context.showMessage = async (title, text) => { messages.push({ title, text }); };
  context.apiRequest = async (endpoint, method, body, token) => {
    requests.push({ endpoint, method, body, token });
    const url = new URL(endpoint, "https://example.test");
    if (method === "GET") return {
      ok: true, status: 200, data: { item: { title: "Test Item", price: 2000 }, history: history.map((record) => ({ ...record })) }
    };
    if (failure) return { ok: false, status: 500, data: { error: "Database failed" } };
    const entry = url.searchParams.get("entry");
    const before = history.length;
    history = entry === null ? [] : history.filter((record) => record.id !== Number(entry));
    return { ok: true, status: 200, data: { ok: true, deleted: before - history.length } };
  };
  return { context, requests, tables, alerts, messages, history: () => history };
}

test("the management menu keeps history and product deletion as distinct actions", async () => {
  const app = fixture({ alertChoices: [3, 4] });
  assert.equal(await app.context.chooseBulkAction(), "history");
  assert.equal(await app.context.chooseBulkAction(), "delete");
  assert.equal(app.alerts[0].actions[3], "Manage Price History");
  assert.equal(app.alerts[0].actions[4], "Delete Items");
});

test("a selected historical record sends only its scoped delete request", async () => {
  const app = fixture({ tableChoices: [2], alertChoices: [0] });
  await app.context.runBulkAction("secret-test-token", [ITEM], "history", []);
  const writes = app.requests.filter((request) => request.method === "DELETE");
  assert.equal(writes.length, 1);
  const url = new URL(writes[0].endpoint, "https://example.test");
  assert.equal(url.pathname, `/api/items/${ITEM.asin}/history`);
  assert.equal(url.searchParams.get("list"), "main");
  assert.equal(url.searchParams.get("entry"), "2");
  assert.equal(writes[0].token, "secret-test-token");
  assert.equal(writes[0].body, null);
  assert.deepEqual(app.history().map((record) => record.id), [1]);
  assert.match(app.alerts[0].message, /current saved price and the item will be kept/i);
});

test("clearing one item's history requires confirmation and omits the entry parameter", async () => {
  const app = fixture({ tableChoices: [1], alertChoices: [0] });
  await app.context.manageItemPriceHistory("token", ITEM);
  const writes = app.requests.filter((request) => request.method === "DELETE");
  assert.equal(writes.length, 1);
  assert.equal(new URL(writes[0].endpoint, "https://example.test").searchParams.has("entry"), false);
  assert.equal(app.alerts[0].title, "Clear All Price History?");
  assert.deepEqual(app.history(), []);
  assert.equal(app.messages.at(-1).title, "Price History Cleared");
});

test("canceling a deletion leaves every record unchanged", async () => {
  const app = fixture({ tableChoices: [1], alertChoices: [-1] });
  await app.context.manageItemPriceHistory("token", ITEM);
  assert.equal(app.requests.some((request) => request.method === "DELETE"), false);
  assert.equal(app.history().length, 2);
});

test("closing the history table does not delete anything", async () => {
  const app = fixture();
  await app.context.manageItemPriceHistory("token", ITEM);
  assert.equal(app.requests.some((request) => request.method === "DELETE"), false);
  assert.equal(app.alerts.length, 0);
});

test("the custom Done row closes without deleting any history", async () => {
  const app = fixture({ tableChoices: [4] });
  await app.context.manageItemPriceHistory("token", ITEM);
  assert.equal(typeof app.tables[0].rows[4].onSelect, "function");
  assert.equal(app.requests.some((request) => request.method === "DELETE"), false);
  assert.equal(app.alerts.length, 0);
});

test("multiple selected products can be opened one at a time", async () => {
  const app = fixture({ tableChoices: [2, 1], alertChoices: [0] });
  await app.context.manageSelectedPriceHistory("token", [ITEM, SECOND]);
  const deletion = app.requests.find((request) => request.method === "DELETE");
  const url = new URL(deletion.endpoint, "https://example.test");
  assert.equal(url.pathname, `/api/items/${SECOND.asin}/history`);
  assert.equal(url.searchParams.get("list"), "other");
});

test("a failed delete displays an error without claiming that history was cleared", async () => {
  const app = fixture({ tableChoices: [1], alertChoices: [0], failure: true });
  await app.context.manageItemPriceHistory("token", ITEM);
  assert.equal(app.history().length, 2);
  assert.equal(app.messages.at(-1).title, "Could Not Delete History");
  assert.equal(app.messages.some((message) => message.title === "Price History Cleared"), false);
});

test("Japanese devices receive Japanese menu, list, and confirmation labels", async () => {
  const app = fixture({ language: "ja-JP", tableChoices: [1], alertChoices: [3, 0] });
  assert.equal(await app.context.chooseBulkAction(), "history");
  assert.equal(app.alerts[0].actions[3], "価格履歴を管理");
  await app.context.manageItemPriceHistory("token", ITEM);
  assert.equal(app.tables[0].rows[1].texts[0], "この商品の履歴をすべて削除");
  assert.equal(app.alerts[1].title, "価格履歴をすべて削除しますか？");
  assert.equal(app.alerts[1].actions[0], "削除");
  assert.match(app.alerts[1].message, /現在価格と商品は削除されません/);
  assert.equal(app.messages.at(-1).title, "価格履歴を削除しました");
});

test("missing IDs from an older Worker do not create ambiguous record actions", async () => {
  const records = [{ price: 100, currency: "JPY", recorded_at: "2026-10-01 12:00:00" }];
  const app = fixture({ records });
  await app.context.manageItemPriceHistory("token", ITEM);
  assert.equal(app.tables[0].rows.length, 3);
  assert.equal(app.requests.some((request) => request.method === "DELETE"), false);
});

test("an empty history shows a message and sends no delete request", async () => {
  const app = fixture({ records: [] });
  await app.context.manageItemPriceHistory("token", ITEM);
  assert.equal(app.tables.length, 0);
  assert.equal(app.messages[0].title, "No Price History");
  assert.equal(app.requests.some((request) => request.method === "DELETE"), false);
});

test("record dates are parsed as UTC and invalid dates remain readable", () => {
  const app = fixture();
  assert.equal(app.context.formatHistoryDate("not-a-date"), "not-a-date");
  assert.equal(app.context.formatHistoryDate("2026-10-01 12:00:00"), app.context.formatHistoryDate("2026-10-01T12:00:00Z"));
});
