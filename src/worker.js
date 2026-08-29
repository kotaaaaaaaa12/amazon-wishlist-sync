const AMAZON_HOSTS = new Set([
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

function extractAsin(rawUrl) {
  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (!AMAZON_HOSTS.has(url.hostname.toLowerCase())) {
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

function canonicalAmazonUrl(asin) {
  return `https://www.amazon.co.jp/dp/${asin}`;
}

function isAuthorized(request, env) {
  if (!env.SYNC_TOKEN) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${env.SYNC_TOKEN}`;
}

async function listItems(env) {
  if (!env.DB) {
    return json({
      items: [],
      setupRequired: true,
      message: "D1 is not configured yet."
    });
  }

  const result = await env.DB.prepare(`
    SELECT asin, url, created_at
    FROM items
    ORDER BY datetime(created_at) DESC, id DESC
  `).all();

  return json({
    items: result.results ?? [],
    setupRequired: false
  });
}

async function addItem(request, env) {
  if (!env.DB) {
    return json(
      { error: "D1 is not configured yet." },
      { status: 503 }
    );
  }

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
      { error: "Send a valid Amazon.co.jp product URL." },
      { status: 400 }
    );
  }

  const url = canonicalAmazonUrl(asin);

  await env.DB.prepare(`
    INSERT INTO items (asin, url)
    VALUES (?, ?)
    ON CONFLICT(asin) DO UPDATE SET
      url = excluded.url
  `).bind(asin, url).run();

  return json({ asin, url }, { status: 201 });
}

async function deleteItem(request, env, asin) {
  if (!env.DB) {
    return json(
      { error: "D1 is not configured yet." },
      { status: 503 }
    );
  }

  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!/^[A-Z0-9]{10}$/i.test(asin)) {
    return json({ error: "Invalid ASIN." }, { status: 400 });
  }

  await env.DB.prepare(`
    DELETE FROM items
    WHERE asin = ?
  `).bind(asin.toUpperCase()).run();

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({
        ok: true,
        databaseConfigured: Boolean(env.DB)
      });
    }

    if (url.pathname === "/api/items" && request.method === "GET") {
      return listItems(env);
    }

    if (url.pathname === "/api/items" && request.method === "POST") {
      return addItem(request, env);
    }

    if (url.pathname.startsWith("/api/items/") && request.method === "DELETE") {
      const asin = decodeURIComponent(url.pathname.slice("/api/items/".length));
      return deleteItem(request, env, asin);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found." }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  }
};
