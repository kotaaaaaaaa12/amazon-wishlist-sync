const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const scriptPath = process.env.WISHLIST_SCRIPT_SOURCE ||
  path.join(__dirname, "../scriptable/Wishlist Sync.js");
const original = fs.readFileSync(scriptPath, "utf8");
const source = original.replace(/^await main\(\);\s*finishRun\(\);/m, "");
assert.notEqual(source, original, "Remove only the Scriptable entry point before loading test functions.");
const ASIN = "B012345678";
const ITEM = { asin: ASIN, wishlist_slug: "main", url: `https://www.amazon.co.jp/dp/${ASIN}` };

function metadata(overrides = {}) {
  const { debug = {}, ...fields } = overrides;
  return {
    price: 1000, availability: "available", priceSource: "dom:main", ...fields,
    debug: {
      validProduct: true, priceMissing: false, priceAmbiguous: false, attempts: [],
      page: { identityMatches: true, readyState: "complete" }, ...debug
    }
  };
}

function loadScript(data = metadata(), { choices = [], reviewedPrice = 1000, response } = {}) {
  const requests = [];
  const alerts = [];
  const context = vm.createContext({
    console,
    Alert: class {
      constructor() { alerts.push(this); }
      addAction() {}
      addCancelAction() {}
      async presentAlert() { return choices.shift() ?? 0; }
    }
  });
  vm.runInContext(source, context);
  context.recordRunStage = () => {};
  context.fetchAmazonMetadata = async () => data;
  context.apiRequest = async (endpoint, method, body, token) => {
    requests.push({ endpoint, method, body, token });
    return response || { ok: true, status: 201, data: {} };
  };
  context.confirmDetectedPrice = async () => ({ cancelled: false, price: reviewedPrice });
  return { context, requests, alerts, run: (options = {}) => context.refreshOneItem("test-token", ITEM,
    { review: false, shouldStop: () => false, ...options }) };
}

function assertClearRequest(request) {
  assert.equal(request.endpoint, "/api/items");
  assert.equal(request.method, "POST");
  assert.equal(request.body.list, "main");
  assert.equal(request.body.price, null);
  assert.equal(request.body.currency, null);
  assert.equal(request.body.clearPrice, true);
}

test("available products save their detected price", async () => {
  const app = loadScript();
  const result = await app.run();
  assert.equal(result.kind, "updated");
  assert.equal(result.cleared, false);
  assert.equal(app.requests[0].body.price, 1000);
  assert.equal(app.requests[0].body.clearPrice, false);
});

test("verified unavailable products clear the old price", async () => {
  const app = loadScript(metadata({ price: null, availability: "unavailable" }));
  const result = await app.run();
  assert.equal(result.kind, "updated");
  assert.equal(result.cleared, true);
  assert.match(result.message, /history was kept/);
  assertClearRequest(app.requests[0]);
});

test("an unavailable product never saves an incidental 30000 price", async () => {
  const app = loadScript(metadata({ price: 30000, availability: "unavailable" }));
  assert.equal((await app.run()).cleared, true);
  assertClearRequest(app.requests[0]);
});

test("a complete matching product page with no candidates clears its price", async () => {
  const app = loadScript(metadata({ price: null, availability: "unknown", debug: { priceMissing: true } }));
  assert.equal((await app.run()).kind, "updated");
  assertClearRequest(app.requests[0]);
});

for (const [name, data, expected] of [
  ["incomplete product page", metadata({ price: null, availability: "unknown", debug: { priceMissing: true, page: { identityMatches: true, readyState: "loading" } } }), "skipped"],
  ["unverified identity", metadata({ price: null, availability: "unavailable", debug: { page: { identityMatches: false, readyState: "complete" } } }), "skipped"],
  ["a price from an unverified product", metadata({ price: 30000, debug: { page: { identityMatches: false, readyState: "complete" } } }), "skipped"],
  ["unparseable price", metadata({ price: null, availability: "unknown" }), "skipped"],
  ["conflicting prices", metadata({ price: null, debug: { priceMissing: true, priceAmbiguous: true } }), "skipped"],
  ["failed page", metadata({ price: null, availability: "unavailable", debug: { validProduct: false } }), "skipped"],
  ["network failure", metadata({ price: null, availability: "unavailable", debug: { browserError: "Network failed" } }), "skipped"],
  ["timeout", metadata({ price: null, availability: "unavailable", debug: { timedOut: true } }), "paused"],
  ["CAPTCHA", metadata({ price: null, availability: "unavailable", debug: { attempts: [{ captchaFound: true }] } }), "paused"],
  ["failed WebView cleanup", metadata({ price: null, availability: "unavailable", debug: { cleanupFailed: true } }), "paused"]
]) {
  test(`${name} preserves the saved price without a write`, async () => {
    const app = loadScript(data);
    assert.equal((await app.run()).kind, expected);
    assert.equal(app.requests.length, 0);
  });
}

test("review mode confirms a missing price before clearing it", async () => {
  const app = loadScript(metadata({ price: null, availability: "unavailable" }), { choices: [0] });
  assert.equal((await app.run({ review: true })).cleared, true);
  assert.equal(app.alerts.length, 1);
  assertClearRequest(app.requests[0]);
});

for (const [choice, expected] of [[1, "skipped"], [-1, "paused"]]) {
  test(`review choice ${choice} keeps the missing-price item unchanged`, async () => {
    const app = loadScript(metadata({ price: null, availability: "unavailable" }), { choices: [choice] });
    assert.equal((await app.run({ review: true })).kind, expected);
    assert.equal(app.requests.length, 0);
  });
}

test("leaving a reviewed price empty explicitly clears it", async () => {
  const app = loadScript(metadata(), { reviewedPrice: null });
  assert.equal((await app.run({ review: true })).cleared, true);
  assertClearRequest(app.requests[0]);
});

test("pausing prevents a no-price update", async () => {
  const app = loadScript(metadata({ price: null, availability: "unavailable" }));
  assert.equal((await app.run({ shouldStop: () => true })).kind, "paused");
  assert.equal(app.requests.length, 0);
});

test("failed clear requests are not reported as successful updates", async () => {
  const app = loadScript(metadata({ price: null, availability: "unavailable" }), {
    response: { ok: false, status: 500, data: { error: "Server failed" } }
  });
  assert.equal((await app.run()).kind, "paused");
  assertClearRequest(app.requests[0]);
});

// Minimal DOM doubles exercise the real parser's availability/price precedence.
// They represent selectors and visibility, without fetching live Amazon pages.
function node(text, { hidden = false, excluded = false, ...attributes } = {}) {
  return {
    textContent: text, nodeType: 1, parentElement: null, hidden,
    className: attributes.class || "", ...attributes,
    getAttribute(name) { return attributes[name] ?? null; },
    closest() { return excluded ? {} : null; },
    querySelector(selector) { return selector === ".a-offscreen" ? { textContent: text } : null; }
  };
}

function productDocument({ availability = "", prices = [], fallback = false, identity = ASIN, readyState = "complete", hiddenAvailability = false } = {}) {
  const availabilityNode = node(availability, { hidden: hiddenAvailability });
  return {
    title: "Test Product", readyState, location: { pathname: `/dp/${identity}` },
    defaultView: { getComputedStyle: () => ({ display: "block", visibility: "visible" }) },
    querySelector(selector) {
      if (selector === "#productTitle, #title #titleText, #btAsinTitle") return node("Test Product");
      if (selector === 'input#ASIN, input[name="ASIN"]') return { value: identity };
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "#availability, #availabilityInsideBuyBox_feature_div, #outOfStock") return availability ? [availabilityNode] : [];
      if (selector === (fallback ? "#apex_price .apex-pricetopay-value" : "#corePrice_feature_div .a-price")) return prices;
      return [];
    }
  };
}

test("explicit unavailability overrides a price in a primary product region", () => {
  const { context } = loadScript();
  const result = context.readAmazonProductDocument(productDocument({ availability: "現在在庫切れです。", prices: [node("￥30,000")] }), ASIN, true);
  assert.equal(result.price, null);
  assert.equal(result.priceSource, null);
  assert.equal(result.availability, "unavailable");
  assert.equal(result.diagnostics.ignoredUnavailablePrice, 30000);
});

test("explicit unavailability also overrides a fallback price", () => {
  const { context } = loadScript();
  const result = context.readAmazonProductDocument(productDocument({ availability: "Currently unavailable", prices: [node("￥30,000")], fallback: true }), ASIN, true);
  assert.equal(result.price, null);
  assert.equal(result.availability, "unavailable");
});

test("hidden unavailability does not override an available product price", () => {
  const { context } = loadScript();
  const result = context.readAmazonProductDocument(productDocument({ availability: "Currently unavailable", hiddenAvailability: true, prices: [node("￥1,234")] }), ASIN, true);
  assert.equal(result.price, 1234);
  assert.equal(result.availability, "available");
});

test("unparseable price candidates are not labeled as missing prices", () => {
  const { context } = loadScript();
  const result = context.readAmazonProductDocument(productDocument({ prices: [node("￥2,000.50")] }), ASIN, true);
  assert.equal(result.price, null);
  assert.equal(result.priceMissing, false);
});

test("conflicting candidates are not labeled as missing prices", () => {
  const { context } = loadScript();
  const result = context.readAmazonProductDocument(productDocument({ prices: [node("￥1,000"), node("￥2,000")] }), ASIN, true);
  assert.equal(result.price, null);
  assert.equal(result.priceMissing, false);
  assert.equal(result.diagnostics.priceAmbiguous, true);
});

test("parser, metadata finalizer, and batch refresh clear a confirmed unpriced product", async () => {
  const app = loadScript();
  const parsed = app.context.readAmazonProductDocument(productDocument(), ASIN, true);
  assert.equal(parsed.priceMissing, true);
  const finalized = app.context.finalizeAmazonMetadata(parsed);
  assert.equal(finalized.debug.page.identityMatches, true);
  app.context.fetchAmazonMetadata = async () => finalized;
  assert.equal((await app.run()).cleared, true);
  assertClearRequest(app.requests[0]);
});

test("a mismatched product is never treated as verified no-price data", () => {
  const { context } = loadScript();
  const result = context.readAmazonProductDocument(productDocument({ identity: "B098765432", availability: "Currently unavailable" }), ASIN, true);
  assert.equal(result.validProduct, false);
});
