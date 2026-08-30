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
      id,
      asin,
      url,
      title,
      image_url,
      price,
      currency,
      price_updated_at,
      COALESCE(price_updated_at, created_at) AS last_checked_at,
      created_at
    FROM items
    WHERE wishlist_id = ? AND asin = ?
    LIMIT 1
  `).bind(wishlistId, asin).first();
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

  const saved = await getSavedItem(env, wishlist.id, asin);

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
      w.name AS wishlist_name,
      w.slug AS wishlist_slug
    FROM items AS i
    INNER JOIN wishlists AS w
      ON w.id = i.wishlist_id
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
