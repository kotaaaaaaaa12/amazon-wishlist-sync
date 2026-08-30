const AMAZON_HOSTS = new Set([
  "amazon.jp",
  "www.amazon.jp",
  "amazon.co.jp",
  "www.amazon.co.jp"
]);

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function getAuthState(request, env) {
  const expected = String(env.SYNC_TOKEN ?? "").trim();
  const authorization = String(request.headers.get("authorization") ?? "").trim();
  const bearer = authorization.replace(/^Bearer\s+/i, "").trim();
  const custom = String(request.headers.get("x-sync-token") ?? "").trim();
  const received = custom || bearer;

  return {
    expected,
    received,
    matches: Boolean(expected) && received === expected
  };
}

function isAuthorized(request, env) {
  return getAuthState(request, env).matches;
}

function parseAmazonUrl(rawUrl) {
  if (typeof rawUrl !== "string") return null;

  try {
    const url = new URL(rawUrl);
    if (!AMAZON_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url;
  } catch {
    return null;
  }
}

function extractAsin(rawUrl) {
  const url = parseAmazonUrl(rawUrl);
  if (!url) return null;

  const patterns = [
    /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})(?:[/?]|$)/i
  ];

  for (const pattern of patterns) {
    const match = url.pathname.match(pattern);
    if (match) return match[1].toUpperCase();
  }

  return null;
}

function extractWishlistId(rawUrl) {
  const url = parseAmazonUrl(rawUrl);
  if (!url) return null;

  const match = url.pathname.match(/\/hz\/wishlist\/ls\/([A-Z0-9]+)/i);
  return match ? match[1].toUpperCase() : null;
}

function extractProductWishlistId(rawUrl) {
  const url = parseAmazonUrl(rawUrl);
  if (!url) return null;

  const colid = url.searchParams.get("colid");
  return colid ? colid.trim().toUpperCase() : null;
}

function canonicalAmazonProductUrl(asin) {
  return `https://www.amazon.co.jp/dp/${asin}`;
}

function canonicalAmazonWishlistUrl(listId) {
  return `https://www.amazon.jp/hz/wishlist/ls/${listId}`;
}

function normalizeSlug(value) {
  if (typeof value !== "string") return null;

  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || null;
}

function normalizeTitle(value) {
  if (typeof value !== "string") return null;
  const title = value.trim();
  return title ? title.slice(0, 1000) : null;
}

function normalizePrice(value) {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.round(number);
}

function normalizeCurrency(value) {
  if (typeof value !== "string") return "JPY";
  return value.trim().toUpperCase() || "JPY";
}

const PRIORITIES = new Set(["none", "low", "medium", "high"]);

function normalizePriority(value, fallback = "none") {
  if (typeof value !== "string") return fallback;
  const priority = value.trim().toLowerCase();
  return PRIORITIES.has(priority) ? priority : fallback;
}

function normalizePriorityList(value) {
  if (!Array.isArray(value)) return [];

  return [...new Set(
    value
      .map((item) => normalizePriority(item, null))
      .filter(Boolean)
  )];
}

let itemPreferencesReady = false;

async function ensureItemPreferencesTable(env) {
  if (itemPreferencesReady) return;

  await env.DB.batch([
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS item_preferences (
        item_id INTEGER PRIMARY KEY,
        priority TEXT NOT NULL DEFAULT 'none'
          CHECK (priority IN ('none', 'low', 'medium', 'high')),
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (item_id)
          REFERENCES items(id)
          ON DELETE CASCADE
      )
    `),
    env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_item_preferences_priority
      ON item_preferences(priority)
    `)
  ]);

  itemPreferencesReady = true;
}

function normalizeImageUrl(value) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;

    const host = url.hostname.toLowerCase();
    const allowed =
      host === "m.media-amazon.com" ||
      host.endsWith(".media-amazon.com") ||
      host.endsWith(".ssl-images-amazon.com");

    return allowed ? url.toString() : null;
  } catch {
    return null;
  }
}

async function getWishlists(env) {
  const result = await env.DB.prepare(`
    SELECT
      id,
      name,
      slug,
      amazon_list_id,
      amazon_url,
      created_at
    FROM wishlists
    ORDER BY id ASC
  `).all();

  return result.results ?? [];
}

async function listWishlists(env) {
  const wishlists = await getWishlists(env);

  return json({
    wishlists: wishlists.map((wishlist) => ({
      name: wishlist.name,
      slug: wishlist.slug,
      amazonListId: wishlist.amazon_list_id,
      amazonUrl: wishlist.amazon_url
    }))
  });
}

async function createWishlist(request, env) {
  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const slug = normalizeSlug(body?.slug || body?.name);
  const amazonListId = extractWishlistId(body?.amazonUrl);

  if (!name) {
    return json({ error: "Wishlist name is required." }, { status: 400 });
  }

  if (!slug) {
    return json({ error: "A valid wishlist slug is required." }, { status: 400 });
  }

  if (!amazonListId) {
    return json({ error: "Send a valid Amazon wishlist URL." }, { status: 400 });
  }

  const amazonUrl = canonicalAmazonWishlistUrl(amazonListId);

  await env.DB.prepare(`
    INSERT INTO wishlists (
      name,
      slug,
      amazon_list_id,
      amazon_url
    )
    VALUES (?, ?, ?, ?)

    ON CONFLICT(slug)
    DO UPDATE SET
      name = excluded.name,
      amazon_list_id = excluded.amazon_list_id,
      amazon_url = excluded.amazon_url
  `).bind(name, slug, amazonListId, amazonUrl).run();

  return json(
    {
      wishlist: {
        name,
        slug,
        amazonListId,
        amazonUrl
      }
    },
    { status: 201 }
  );
}

async function findWishlistBySlug(env, slug) {
  if (!slug) return null;

  return env.DB.prepare(`
    SELECT
      id,
      name,
      slug,
      amazon_list_id
    FROM wishlists
    WHERE slug = ?
    LIMIT 1
  `).bind(slug).first();
}

async function findWishlistByAmazonId(env, amazonListId) {
  if (!amazonListId) return null;

  return env.DB.prepare(`
    SELECT
      id,
      name,
      slug,
      amazon_list_id
    FROM wishlists
    WHERE amazon_list_id = ?
    LIMIT 1
  `).bind(amazonListId).first();
}

async function getOnlyWishlist(env) {
  const result = await env.DB.prepare(`
    SELECT
      id,
      name,
      slug,
      amazon_list_id
    FROM wishlists
    ORDER BY id ASC
    LIMIT 2
  `).all();

  const wishlists = result.results ?? [];
  return wishlists.length === 1 ? wishlists[0] : null;
}

async function resolveWishlist(env, { requestedSlug, amazonListId }) {
  if (requestedSlug) {
    const wishlist = await findWishlistBySlug(env, requestedSlug);
    if (wishlist) return wishlist;
  }

  if (amazonListId) {
    const wishlist = await findWishlistByAmazonId(env, amazonListId);
    if (wishlist) return wishlist;
  }

  return getOnlyWishlist(env);
}

async function listItems(env, requestUrl) {
  const listSlug = normalizeSlug(requestUrl.searchParams.get("list"));

  let statement = env.DB.prepare(`
    SELECT
      i.asin,
      i.url,
      i.title,
      i.image_url,
      i.price,
      i.currency,
      i.price_updated_at,
      COALESCE(i.price_updated_at, i.created_at) AS last_checked_at,
      i.created_at,
      COALESCE(p.priority, 'none') AS priority,

      w.name AS wishlist_name,
      w.slug AS wishlist_slug,

      (
        SELECT COUNT(*)
        FROM price_history AS ph
        WHERE ph.item_id = i.id
      ) AS price_history_count,

      (
        SELECT ph.price
        FROM price_history AS ph
        WHERE ph.item_id = i.id
        ORDER BY datetime(ph.recorded_at) DESC, ph.id DESC
        LIMIT 1
        OFFSET 1
      ) AS previous_price,

      (
        SELECT MIN(ph.price)
        FROM price_history AS ph
        WHERE ph.item_id = i.id
      ) AS lowest_price,

      (
        SELECT MAX(ph.price)
        FROM price_history AS ph
        WHERE ph.item_id = i.id
      ) AS highest_price

    FROM items AS i
    INNER JOIN wishlists AS w
      ON w.id = i.wishlist_id
    LEFT JOIN item_preferences AS p
      ON p.item_id = i.id

    ${listSlug ? "WHERE w.slug = ?" : ""}

    ORDER BY datetime(i.created_at) DESC, i.id DESC
  `);

  if (listSlug) statement = statement.bind(listSlug);

  const result = await statement.all();

  return json({
    items: result.results ?? [],
    setupRequired: false
  });
}

async function findExistingItem(env, wishlistId, asin) {
  return env.DB.prepare(`
    SELECT
      id,
      price,
      currency
    FROM items
    WHERE wishlist_id = ? AND asin = ?
    LIMIT 1
  `).bind(wishlistId, asin).first();
}

function hasPriceChanged(existing, price, currency) {
  if (price === null) return false;
  if (!existing) return true;
  if (existing.price === null || existing.price === undefined) return true;
  if (Number(existing.price) !== price) return true;

  return normalizeCurrency(existing.currency) !== normalizeCurrency(currency);
}

async function recordPriceHistory(env, itemId, price, currency) {
  if (!itemId || price === null) return;

  await env.DB.prepare(`
    INSERT INTO price_history (
      item_id,
      price,
      currency
    )
    VALUES (?, ?, ?)
  `).bind(itemId, price, normalizeCurrency(currency)).run();
}

async function getSavedItem(env, wishlistId, asin) {
  return env.DB.prepare(`
    SELECT
      i.id,
      i.asin,
      i.url,
      i.title,
      i.image_url,
      i.price,
      i.currency,
      i.price_updated_at,
      COALESCE(i.price_updated_at, i.created_at) AS last_checked_at,
      i.created_at,
      COALESCE(p.priority, 'none') AS priority
    FROM items AS i
    LEFT JOIN item_preferences AS p
      ON p.item_id = i.id
    WHERE i.wishlist_id = ? AND i.asin = ?
    LIMIT 1
  `).bind(wishlistId, asin).first();
}

async function setItemPriority(env, itemId, priority) {
  if (!itemId) return;

  const normalized = normalizePriority(priority);

  await env.DB.prepare(`
    INSERT INTO item_preferences (
      item_id,
      priority,
      updated_at
    )
    VALUES (?, ?, CURRENT_TIMESTAMP)

    ON CONFLICT(item_id)
    DO UPDATE SET
      priority = excluded.priority,
      updated_at = CURRENT_TIMESTAMP
  `).bind(itemId, normalized).run();
}

async function getPriceHistorySummary(env, itemId) {
  if (!itemId) {
    return {
      price_history_count: 0,
      previous_price: null,
      lowest_price: null,
      highest_price: null
    };
  }

  const summary = await env.DB.prepare(`
    SELECT
      COUNT(*) AS price_history_count,
      MIN(price) AS lowest_price,
      MAX(price) AS highest_price
    FROM price_history
    WHERE item_id = ?
  `).bind(itemId).first();

  const previous = await env.DB.prepare(`
    SELECT price
    FROM price_history
    WHERE item_id = ?
    ORDER BY datetime(recorded_at) DESC, id DESC
    LIMIT 1
    OFFSET 1
  `).bind(itemId).first();

  return {
    price_history_count: Number(summary?.price_history_count ?? 0),
    previous_price: previous?.price ?? null,
    lowest_price: summary?.lowest_price ?? null,
    highest_price: summary?.highest_price ?? null
  };
}

async function addItem(request, env) {
  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const rawUrl = body?.url;
  const asin = extractAsin(rawUrl);

  if (!asin) {
    return json({ error: "Send a valid Amazon product URL." }, { status: 400 });
  }

  const title = normalizeTitle(body?.title);
  const imageUrl = normalizeImageUrl(body?.imageUrl);
  const clearPrice = body?.clearPrice === true;
  const hasPriority = Object.prototype.hasOwnProperty.call(body ?? {}, "priority");
  const priority = hasPriority ? normalizePriority(body?.priority) : null;

  const hasPrice =
    !clearPrice &&
    body?.price !== null &&
    body?.price !== undefined &&
    body?.price !== "";

  const price = clearPrice ? null : normalizePrice(body?.price);

  if (hasPrice && price === null) {
    return json(
      { error: "Price must be a valid non-negative number." },
      { status: 400 }
    );
  }

  const currency = price !== null ? normalizeCurrency(body?.currency) : null;
  const requestedSlug = normalizeSlug(body?.list);
  const amazonListId = extractProductWishlistId(rawUrl);

  const wishlist = await resolveWishlist(env, {
    requestedSlug,
    amazonListId
  });

  if (!wishlist) {
    const wishlists = await getWishlists(env);

    return json(
      {
        error: "Choose a wishlist.",
        needsWishlist: true,
        wishlists: wishlists.map((item) => ({
          name: item.name,
          slug: item.slug
        }))
      },
      { status: 409 }
    );
  }

  const url = canonicalAmazonProductUrl(asin);
  const existing = await findExistingItem(env, wishlist.id, asin);
  const priceChanged = !clearPrice && hasPriceChanged(existing, price, currency);
  const clearPriceFlag = clearPrice ? 1 : 0;

  await env.DB.prepare(`
    INSERT INTO items (
      wishlist_id,
      asin,
      url,
      title,
      image_url,
      price,
      currency,
      price_updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)

    ON CONFLICT(wishlist_id, asin)
    DO UPDATE SET
      url = excluded.url,
      title = COALESCE(excluded.title, items.title),
      image_url = COALESCE(excluded.image_url, items.image_url),
      price = CASE
        WHEN ? = 1 THEN NULL
        ELSE COALESCE(excluded.price, items.price)
      END,
      currency = CASE
        WHEN ? = 1 THEN NULL
        ELSE COALESCE(excluded.currency, items.currency)
      END,
      price_updated_at = CURRENT_TIMESTAMP
  `).bind(
    wishlist.id,
    asin,
    url,
    title,
    imageUrl,
    price,
    currency,
    clearPriceFlag,
    clearPriceFlag
  ).run();

  let saved = await getSavedItem(env, wishlist.id, asin);

  if (hasPriority && saved?.id) {
    await setItemPriority(env, saved.id, priority);
    saved = await getSavedItem(env, wishlist.id, asin);
  }

  if (priceChanged && saved?.id) {
    await recordPriceHistory(env, saved.id, price, currency);
  }

  const history = await getPriceHistorySummary(env, saved?.id);
  const { id, ...publicSaved } = saved ?? {};

  return json(
    {
      ...publicSaved,
      ...history,
      priceCleared: clearPrice,
      detectedAmazonListId: amazonListId,
      wishlist: {
        name: wishlist.name,
        slug: wishlist.slug
      }
    },
    { status: 201 }
  );
}

async function getItemPriceHistory(env, asin, requestUrl) {
  if (!/^[A-Z0-9]{10}$/i.test(asin)) {
    return json({ error: "Invalid ASIN." }, { status: 400 });
  }

  const listSlug = normalizeSlug(requestUrl.searchParams.get("list"));
  if (!listSlug) {
    return json(
      { error: "Specify the wishlist with ?list=slug." },
      { status: 400 }
    );
  }

  const item = await env.DB.prepare(`
    SELECT
      i.id,
      i.asin,
      i.url,
      i.title,
      i.image_url,
      i.price,
      i.currency,
      i.created_at,
      COALESCE(i.price_updated_at, i.created_at) AS last_checked_at,
      COALESCE(p.priority, 'none') AS priority,
      w.name AS wishlist_name,
      w.slug AS wishlist_slug
    FROM items AS i
    INNER JOIN wishlists AS w
      ON w.id = i.wishlist_id
    LEFT JOIN item_preferences AS p
      ON p.item_id = i.id
    WHERE i.asin = ? AND w.slug = ?
    LIMIT 1
  `).bind(asin.toUpperCase(), listSlug).first();

  if (!item) {
    return json({ error: "Item was not found." }, { status: 404 });
  }

  const result = await env.DB.prepare(`
    SELECT
      price,
      currency,
      recorded_at
    FROM price_history
    WHERE item_id = ?
    ORDER BY datetime(recorded_at) DESC, id DESC
  `).bind(item.id).all();

  const { id, ...publicItem } = item;

  return json({
    item: publicItem,
    history: result.results ?? []
  });
}


function normalizeBulkItemRefs(value) {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const refs = [];

  for (const item of value) {
    const asin = typeof item?.asin === "string"
      ? item.asin.trim().toUpperCase()
      : "";
    const list = normalizeSlug(item?.list);

    if (!/^[A-Z0-9]{10}$/.test(asin) || !list) continue;

    const key = `${list}:${asin}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ asin, list });

    if (refs.length >= 200) break;
  }

  return refs;
}

async function findItemsByRefs(env, refs) {
  if (refs.length === 0) return [];

  const clauses = refs.map(() => "(i.asin = ? AND w.slug = ?)");
  const bindings = refs.flatMap((item) => [item.asin, item.list]);

  const result = await env.DB.prepare(`
    SELECT
      i.id,
      i.asin,
      i.wishlist_id,
      w.slug AS wishlist_slug,
      w.name AS wishlist_name
    FROM items AS i
    INNER JOIN wishlists AS w
      ON w.id = i.wishlist_id
    WHERE ${clauses.join(" OR ")}
  `).bind(...bindings).all();

  return result.results ?? [];
}

function mapFoundItems(refs, found) {
  const byKey = new Map(
    found.map((item) => [`${item.wishlist_slug}:${item.asin}`, item])
  );

  const matched = [];
  const skipped = [];

  for (const ref of refs) {
    const key = `${ref.list}:${ref.asin}`;
    const item = byKey.get(key);

    if (item) matched.push(item);
    else skipped.push({ ...ref, reason: "Item was not found." });
  }

  return { matched, skipped };
}

async function bulkUpdateItems(request, env) {
  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const refs = normalizeBulkItemRefs(body?.items);
  if (refs.length === 0) {
    return json({ error: "Select at least one valid item." }, { status: 400 });
  }

  const action = String(body?.action ?? "").trim().toLowerCase();
  const found = await findItemsByRefs(env, refs);
  const { matched, skipped } = mapFoundItems(refs, found);

  if (matched.length === 0) {
    return json({
      ok: true,
      action,
      requested: refs.length,
      updated: 0,
      skipped
    });
  }

  let statements = [];

  if (action === "priority") {
    const priority = normalizePriority(body?.priority, null);
    if (!priority) {
      return json({ error: "Invalid priority." }, { status: 400 });
    }

    statements = matched.map((item) =>
      env.DB.prepare(`
        INSERT INTO item_preferences (
          item_id,
          priority,
          updated_at
        )
        VALUES (?, ?, CURRENT_TIMESTAMP)

        ON CONFLICT(item_id)
        DO UPDATE SET
          priority = excluded.priority,
          updated_at = CURRENT_TIMESTAMP
      `).bind(item.id, priority)
    );
  } else if (action === "clear-price") {
    statements = matched.map((item) =>
      env.DB.prepare(`
        UPDATE items
        SET
          price = NULL,
          currency = NULL,
          price_updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(item.id)
    );
  } else if (action === "delete") {
    statements = matched.map((item) =>
      env.DB.prepare("DELETE FROM items WHERE id = ?").bind(item.id)
    );
  } else if (action === "move") {
    const targetSlug = normalizeSlug(body?.targetList);
    if (!targetSlug) {
      return json({ error: "Choose a target wishlist." }, { status: 400 });
    }

    const target = await findWishlistBySlug(env, targetSlug);
    if (!target) {
      return json({ error: "Target wishlist was not found." }, { status: 404 });
    }

    const movable = matched.filter((item) => item.wishlist_id !== target.id);
    const alreadyThere = matched.filter((item) => item.wishlist_id === target.id);

    for (const item of alreadyThere) {
      skipped.push({
        asin: item.asin,
        list: item.wishlist_slug,
        reason: "Item is already in the target wishlist."
      });
    }

    if (movable.length > 0) {
      const placeholders = movable.map(() => "?").join(", ");
      const existingResult = await env.DB.prepare(`
        SELECT asin
        FROM items
        WHERE wishlist_id = ?
          AND asin IN (${placeholders})
      `).bind(target.id, ...movable.map((item) => item.asin)).all();

      const existingAsins = new Set(
        (existingResult.results ?? []).map((item) => item.asin)
      );

      const safeToMove = [];
      for (const item of movable) {
        if (existingAsins.has(item.asin)) {
          skipped.push({
            asin: item.asin,
            list: item.wishlist_slug,
            reason: "The target wishlist already contains this item."
          });
        } else {
          safeToMove.push(item);
        }
      }

      statements = safeToMove.map((item) =>
        env.DB.prepare(`
          UPDATE items
          SET wishlist_id = ?
          WHERE id = ?
        `).bind(target.id, item.id)
      );
    }
  } else {
    return json({ error: "Unsupported bulk action." }, { status: 400 });
  }

  if (statements.length > 0) {
    await env.DB.batch(statements);
  }

  return json({
    ok: true,
    action,
    requested: refs.length,
    updated: statements.length,
    skipped
  });
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function buildItemsCsv(items) {
  const headers = [
    "wishlist",
    "asin",
    "title",
    "url",
    "price",
    "currency",
    "priority",
    "last_checked_at",
    "created_at",
    "image_url"
  ];

  const rows = items.map((item) => [
    item.wishlist_slug,
    item.asin,
    item.title,
    item.url,
    item.price,
    item.currency,
    item.priority,
    item.last_checked_at,
    item.created_at,
    item.image_url
  ]);

  return [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
}

async function exportData(request, env, requestUrl) {
  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  const format = String(requestUrl.searchParams.get("format") ?? "json")
    .trim()
    .toLowerCase();

  const wishlistsResult = await env.DB.prepare(`
    SELECT
      name,
      slug,
      amazon_list_id,
      amazon_url,
      created_at
    FROM wishlists
    ORDER BY id ASC
  `).all();

  const itemsResult = await env.DB.prepare(`
    SELECT
      i.id,
      i.asin,
      i.url,
      i.title,
      i.image_url,
      i.price,
      i.currency,
      i.created_at,
      COALESCE(i.price_updated_at, i.created_at) AS last_checked_at,
      COALESCE(p.priority, 'none') AS priority,
      w.slug AS wishlist_slug,
      w.name AS wishlist_name
    FROM items AS i
    INNER JOIN wishlists AS w
      ON w.id = i.wishlist_id
    LEFT JOIN item_preferences AS p
      ON p.item_id = i.id
    ORDER BY w.id ASC, datetime(i.created_at) DESC, i.id DESC
  `).all();

  const rawItems = itemsResult.results ?? [];

  if (format === "csv") {
    const csv = buildItemsCsv(rawItems);
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="wishlist-items.csv"'
      }
    });
  }

  if (format !== "json") {
    return json({ error: "Format must be json or csv." }, { status: 400 });
  }

  const historyResult = await env.DB.prepare(`
    SELECT
      i.id AS item_id,
      ph.price,
      ph.currency,
      ph.recorded_at
    FROM price_history AS ph
    INNER JOIN items AS i
      ON i.id = ph.item_id
    ORDER BY i.id ASC, datetime(ph.recorded_at) ASC, ph.id ASC
  `).all();

  const historyByItem = new Map();
  for (const entry of historyResult.results ?? []) {
    const entries = historyByItem.get(entry.item_id) ?? [];
    entries.push({
      price: entry.price,
      currency: entry.currency,
      recordedAt: entry.recorded_at
    });
    historyByItem.set(entry.item_id, entries);
  }

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    wishlists: (wishlistsResult.results ?? []).map((wishlist) => ({
      name: wishlist.name,
      slug: wishlist.slug,
      amazonListId: wishlist.amazon_list_id,
      amazonUrl: wishlist.amazon_url,
      createdAt: wishlist.created_at
    })),
    items: rawItems.map((item) => ({
      wishlistSlug: item.wishlist_slug,
      wishlistName: item.wishlist_name,
      asin: item.asin,
      url: item.url,
      title: item.title,
      imageUrl: item.image_url,
      price: item.price,
      currency: item.currency,
      priority: item.priority,
      lastCheckedAt: item.last_checked_at,
      createdAt: item.created_at,
      priceHistory: historyByItem.get(item.id) ?? []
    }))
  };

  return json(backup, {
    headers: {
      "content-disposition": 'attachment; filename="wishlist-backup.json"'
    }
  });
}

function shuffleCopy(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function sumPrices(items) {
  return items.reduce((sum, item) => sum + Number(item.price), 0);
}

async function budgetAutoPick(request, env) {
  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const budget = normalizePrice(body?.budget);
  const count = Number(body?.count);
  const listSlug = body?.list ? normalizeSlug(body.list) : null;
  const priorities = normalizePriorityList(body?.priorities);

  if (budget === null || budget <= 0) {
    return json({ error: "Budget must be greater than zero." }, { status: 400 });
  }

  if (!Number.isInteger(count) || count < 1 || count > 20) {
    return json({ error: "Count must be between 1 and 20." }, { status: 400 });
  }

  if (body?.list && !listSlug) {
    return json({ error: "Invalid wishlist." }, { status: 400 });
  }

  const conditions = ["i.price IS NOT NULL", "i.price > 0"];
  const bindings = [];

  if (listSlug) {
    conditions.push("w.slug = ?");
    bindings.push(listSlug);
  }

  if (priorities.length > 0) {
    const placeholders = priorities.map(() => "?").join(", ");
    conditions.push(`COALESCE(p.priority, 'none') IN (${placeholders})`);
    bindings.push(...priorities);
  }

  const result = await env.DB.prepare(`
    SELECT
      i.asin,
      i.url,
      i.title,
      i.image_url,
      i.price,
      i.currency,
      COALESCE(p.priority, 'none') AS priority,
      w.name AS wishlist_name,
      w.slug AS wishlist_slug
    FROM items AS i
    INNER JOIN wishlists AS w
      ON w.id = i.wishlist_id
    LEFT JOIN item_preferences AS p
      ON p.item_id = i.id
    WHERE ${conditions.join(" AND ")}
  `).bind(...bindings).all();

  const candidates = result.results ?? [];
  if (candidates.length < count) {
    return json(
      {
        error: "Not enough priced items match those conditions.",
        available: candidates.length
      },
      { status: 422 }
    );
  }

  const cheapest = [...candidates]
    .sort((first, second) => Number(first.price) - Number(second.price))
    .slice(0, count);

  const minimumRequired = sumPrices(cheapest);
  if (minimumRequired > budget) {
    return json(
      {
        error: "The budget is too low for that many items.",
        minimumRequired
      },
      { status: 422 }
    );
  }

  let best = cheapest;
  let bestTotal = minimumRequired;
  const attempts = Math.min(800, Math.max(250, candidates.length * 5));

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const shuffled = shuffleCopy(candidates);
    const selected = [];
    let remaining = budget;

    for (const item of shuffled) {
      if (selected.length >= count) break;
      const price = Number(item.price);
      if (price <= remaining) {
        selected.push(item);
        remaining -= price;
      }
    }

    if (selected.length !== count) continue;

    const total = budget - remaining;
    if (total > bestTotal && total <= budget) {
      best = selected;
      bestTotal = total;
      if (bestTotal === budget) break;
    }
  }

  return json({
    budget,
    count,
    total: bestTotal,
    remaining: budget - bestTotal,
    candidateCount: candidates.length,
    items: best
  });
}

async function deleteItem(request, env, asin, requestUrl) {
  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!/^[A-Z0-9]{10}$/i.test(asin)) {
    return json({ error: "Invalid ASIN." }, { status: 400 });
  }

  const listSlug = normalizeSlug(requestUrl.searchParams.get("list"));
  if (!listSlug) {
    return json(
      { error: "Specify the wishlist with ?list=slug." },
      { status: 400 }
    );
  }

  const wishlist = await findWishlistBySlug(env, listSlug);
  if (!wishlist) {
    return json({ error: "Wishlist was not found." }, { status: 404 });
  }

  await env.DB.prepare(`
    DELETE FROM items
    WHERE wishlist_id = ? AND asin = ?
  `).bind(wishlist.id, asin.toUpperCase()).run();

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({
        ok: true,
        databaseConfigured: Boolean(env.DB),
        syncTokenConfigured: Boolean(String(env.SYNC_TOKEN ?? "").trim())
      });
    }

    if (url.pathname.startsWith("/api/") && !env.DB) {
      return json({ error: "D1 is not configured." }, { status: 503 });
    }

    try {
      if (url.pathname.startsWith("/api/")) {
        await ensureItemPreferencesTable(env);
      }

      if (url.pathname === "/api/wishlists" && request.method === "GET") {
        return listWishlists(env);
      }

      if (url.pathname === "/api/wishlists" && request.method === "POST") {
        return createWishlist(request, env);
      }

      if (url.pathname === "/api/items" && request.method === "GET") {
        return listItems(env, url);
      }

      if (url.pathname === "/api/items" && request.method === "POST") {
        return addItem(request, env);
      }

      if (url.pathname === "/api/items/bulk" && request.method === "POST") {
        return bulkUpdateItems(request, env);
      }

      if (url.pathname === "/api/export" && request.method === "GET") {
        return exportData(request, env, url);
      }

      if (url.pathname === "/api/budget-pick" && request.method === "POST") {
        return budgetAutoPick(request, env);
      }

      const historyMatch = url.pathname.match(
        /^\/api\/items\/([^/]+)\/history$/
      );

      if (historyMatch && request.method === "GET") {
        const asin = decodeURIComponent(historyMatch[1]);
        return getItemPriceHistory(env, asin, url);
      }

      if (url.pathname.startsWith("/api/items/") && request.method === "DELETE") {
        const asin = decodeURIComponent(url.pathname.slice("/api/items/".length));
        return deleteItem(request, env, asin, url);
      }

      if (url.pathname.startsWith("/api/")) {
        return json({ error: "Not found." }, { status: 404 });
      }
    } catch (error) {
      console.error(error);
      return json({ error: "Internal server error." }, { status: 500 });
    }

    return env.ASSETS.fetch(request);
  }
};
