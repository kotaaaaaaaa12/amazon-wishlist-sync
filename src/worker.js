const AMAZON_HOSTS = new Set([
  "amazon.jp",
  "www.amazon.jp",
  "amazon.co.jp",
  "www.amazon.co.jp"
]);

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

function isAuthorized(request, env) {
  if (!env.SYNC_TOKEN) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${env.SYNC_TOKEN}`;
}

function parseAmazonUrl(rawUrl) {
  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (!AMAZON_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  return url;
}

function extractAsin(rawUrl) {
  const url = parseAmazonUrl(rawUrl);

  if (!url) {
    return null;
  }

  const patterns = [
    /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})(?:[/?]|$)/i
  ];

  for (const pattern of patterns) {
    const match = url.pathname.match(pattern);

    if (match) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

function extractWishlistId(rawUrl) {
  const url = parseAmazonUrl(rawUrl);

  if (!url) {
    return null;
  }

  const match = url.pathname.match(/\/hz\/wishlist\/ls\/([A-Z0-9]+)/i);
  return match ? match[1].toUpperCase() : null;
}

function canonicalAmazonProductUrl(asin) {
  return `https://www.amazon.co.jp/dp/${asin}`;
}

function canonicalAmazonWishlistUrl(listId) {
  return `https://www.amazon.jp/hz/wishlist/ls/${listId}`;
}

function normalizeSlug(value) {
  if (typeof value !== "string") {
    return null;
  }

  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || null;
}

async function listWishlists(env) {
  const result = await env.DB.prepare(`
    SELECT name, slug
    FROM wishlists
    ORDER BY id ASC
  `).all();

  return json({
    wishlists: result.results ?? []
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
    return json(
      { error: "Send a valid Amazon wishlist URL." },
      { status: 400 }
    );
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
    ON CONFLICT(slug) DO UPDATE SET
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

async function resolveWishlist(env, listSlug) {
  if (listSlug) {
    return env.DB.prepare(`
      SELECT id, name, slug
      FROM wishlists
      WHERE slug = ?
    `).bind(listSlug).first();
  }

  const result = await env.DB.prepare(`
    SELECT id, name, slug
    FROM wishlists
    ORDER BY id ASC
    LIMIT 2
  `).all();

  const wishlists = result.results ?? [];

  if (wishlists.length === 1) {
    return wishlists[0];
  }

  return null;
}

async function listItems(env, requestUrl) {
  const listSlug = requestUrl.searchParams.get("list");

  let statement = env.DB.prepare(`
    SELECT
      i.asin,
      i.url,
      i.created_at,
      w.name AS wishlist_name,
      w.slug AS wishlist_slug
    FROM items AS i
    INNER JOIN wishlists AS w
      ON w.id = i.wishlist_id
    ${listSlug ? "WHERE w.slug = ?" : ""}
    ORDER BY datetime(i.created_at) DESC, i.id DESC
  `);

  if (listSlug) {
    statement = statement.bind(listSlug);
  }

  const result = await statement.all();

  return json({
    items: result.results ?? [],
    setupRequired: false
  });
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

  const asin = extractAsin(body?.url);

  if (!asin) {
    return json(
      { error: "Send a valid Amazon.jp or Amazon.co.jp product URL." },
      { status: 400 }
    );
  }

  const requestedList = normalizeSlug(body?.list);
  const wishlist = await resolveWishlist(env, requestedList);

  if (!wishlist) {
    return json(
      {
        error: requestedList
          ? `Wishlist '${requestedList}' was not found.`
          : "Choose a wishlist by sending its slug in the 'list' field."
      },
      { status: 400 }
    );
  }

  const url = canonicalAmazonProductUrl(asin);

  await env.DB.prepare(`
    INSERT INTO items (
      wishlist_id,
      asin,
      url
    )
    VALUES (?, ?, ?)
    ON CONFLICT(wishlist_id, asin) DO UPDATE SET
      url = excluded.url
  `).bind(wishlist.id, asin, url).run();

  return json(
    {
      asin,
      url,
      wishlist: {
        name: wishlist.name,
        slug: wishlist.slug
      }
    },
    { status: 201 }
  );
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

  const wishlist = await resolveWishlist(env, listSlug);

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
        syncTokenConfigured: Boolean(env.SYNC_TOKEN)
      });
    }

    if (url.pathname.startsWith("/api/") && !env.DB) {
      return json(
        { error: "D1 is not configured yet." },
        { status: 503 }
      );
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

      if (
        url.pathname.startsWith("/api/items/") &&
        request.method === "DELETE"
      ) {
        const asin = decodeURIComponent(
          url.pathname.slice("/api/items/".length)
        );

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
