import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

function loadFilters() {
  const context = vm.createContext({
    URLSearchParams,
    APP_INTL_LOCALE: "en-US",
    window: { location: { pathname: "/", search: "" } },
    TEXT_COLLATOR: new Intl.Collator("en-US", { sensitivity: "base" }),
    itemSearchTextCache: new Map()
  });
  const stateStart = source.indexOf("const DEFAULT_STATE = {");
  const stateEnd = source.indexOf("let budgetMode = false;", stateStart);
  vm.runInContext(source.slice(stateStart, stateEnd), context);
  // Exercise the dashboard's actual functions without loading browser UI.
  for (const name of [
    "parseNumber", "hasPrice", "getPrice", "getOptionalPrice", "getPriceHistoryInfo",
    "normalizeSearchText", "getItemKey", "getItemSearchText", "itemMatchesSearch",
    "itemMatchesPriceRange", "itemMatchesPriceStatus", "itemMatchesImageStatus",
    "normalizePriority", "normalizePrioritySelection", "itemMatchesPriority", "getPriorityRank",
    "filterItems", "parseDateTime", "comparePrices", "comparePriceChanges", "sortItems",
    "getAdvancedFilterCount", "normalizePriceRange", "readStateFromUrl", "buildStateUrl"
  ]) {
    const start = source.indexOf(`function ${name}(`);
    assert.notEqual(start, -1, `${name} exists`);
    const end = source.indexOf("\n}", start) + 2;
    vm.runInContext(source.slice(start, end), context);
  }
  vm.runInContext(`
    function setItems(items) { allItems = items; }
    function setState(values) { state = { ...DEFAULT_STATE, priorities: [], ...values }; }
    function readState() { return state; }
    let filtersOpen = false;
    let activeDetailKey = null;
  `, context);
  return context;
}

function item(asin, price, previous, overrides = {}) {
  return {
    asin, price, previous_price: previous,
    price_history_count: 3, lowest_price: 100, highest_price: 300,
    wishlist_slug: "main", wishlist_name: "Main", title: asin,
    priority: "high", image_url: "https://m.media-amazon.com/images/I/test.jpg",
    created_at: "2026-10-01 00:00:00", ...overrides
  };
}

const ids = (items) => Array.from(items, (entry) => entry.asin);

test("recorded-low and recorded-high filters require comparable history", () => {
  const app = loadFilters();
  app.setItems([
    item("low", 100, 200), item("high", 300, 200), item("middle", 200, 300),
    item("flat", 100, 100, { highest_price: 100 }),
    item("first", 100, null, { price_history_count: 1, highest_price: 100 }),
    item("cleared", null, 100), item("no-history", 100, null, { price_history_count: 0 })
  ]);
  app.setState({ priceStatus: "lowest" });
  assert.deepEqual(ids(app.filterItems()), ["low", "flat"]);
  app.setState({ priceStatus: "highest" });
  assert.deepEqual(ids(app.filterItems()), ["high", "flat"]);
});

test("a zero saved price can match the recorded low", () => {
  const app = loadFilters();
  app.setState({ priceStatus: "lowest" });
  app.setItems([item("free", 0, 100, { lowest_price: 0 })]);
  assert.deepEqual(ids(app.filterItems()), ["free"]);
});

test("history filters combine with search, wishlist, priority, and price range", () => {
  const app = loadFilters();
  app.setItems([
    item("matching", 100, 200),
    item("other-list", 100, 200, { wishlist_slug: "other" }),
    item("other-priority", 100, 200, { priority: "low" }),
    item("too-expensive", 300, 400, { lowest_price: 300 }),
    item("no-image", 100, 200, { image_url: null })
  ]);
  app.setState({ priceStatus: "lowest", list: "main", priorities: ["high"], maxPrice: 150, imageStatus: "image" });
  assert.deepEqual(ids(app.filterItems()), ["matching"]);
  app.setState({ priceStatus: "lowest", query: "matching" });
  assert.deepEqual(ids(app.filterItems()), ["matching"]);
});

test("price-change sorts use absolute amounts and keep unknown changes last", () => {
  const app = loadFilters();
  const items = [
    item("large-drop", 5000, 10000), item("large-percent-drop", 1, 100),
    item("flat", 100, 100), item("small-rise", 120, 100), item("large-rise", 9000, 100),
    item("first", 100, null, { price_history_count: 1, created_at: "2026-10-22 00:00:00" }),
    item("cleared", null, 100)
  ];
  app.setState({ sort: "price-drop" });
  assert.deepEqual(ids(app.sortItems(items)), ["large-drop", "large-percent-drop", "flat", "small-rise", "large-rise", "first", "cleared"]);
  app.setState({ sort: "price-rise" });
  assert.deepEqual(ids(app.sortItems(items)), ["large-rise", "small-rise", "flat", "large-percent-drop", "large-drop", "first", "cleared"]);
  assert.equal(items[0].asin, "large-drop");
});

test("equal price changes sort by most recently added", () => {
  const app = loadFilters();
  const items = [item("old", 100, 200), item("new", 300, 400, { created_at: "2026-10-22 00:00:00" })];
  for (const sort of ["price-drop", "price-rise"]) {
    app.setState({ sort });
    assert.deepEqual(ids(app.sortItems(items)), ["new", "old"]);
  }
});

test("history filter and sort survive URL serialization and count as one filter", () => {
  const app = loadFilters();
  for (const [price, sort] of [["lowest", "price-drop"], ["highest", "price-rise"]]) {
    app.window.location.search = `?price=${price}&sort=${sort}&filters=1`;
    app.readStateFromUrl();
    assert.equal(app.readState().priceStatus, price);
    assert.equal(app.readState().sort, sort);
    assert.equal(app.getAdvancedFilterCount(), 1);
    const params = new URLSearchParams(app.buildStateUrl().split("?")[1]);
    assert.equal(params.get("price"), price);
    assert.equal(params.get("sort"), sort);
    app.setState({});
    const defaults = new URLSearchParams(app.buildStateUrl().split("?")[1]);
    assert.equal(defaults.has("price"), false);
    assert.equal(defaults.has("sort"), false);
    assert.equal(app.getAdvancedFilterCount(), 0);
  }
});

test("invalid URL choices fall back to existing defaults", () => {
  const app = loadFilters();
  app.window.location.search = "?price=invalid&sort=invalid";
  app.readStateFromUrl();
  assert.equal(app.readState().priceStatus, "all");
  assert.equal(app.readState().sort, "newest");
});

test("all new filter and sort choices have matching English and Japanese labels", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const start = source.indexOf("const STATIC_JA_TRANSLATIONS = new Map([");
  const end = source.indexOf("function localizeStaticUi()", start);
  const translations = vm.runInNewContext(`${source.slice(start, end)}\nSTATIC_JA_TRANSLATIONS;`);
  for (const [value, english, japanese] of [
    ["lowest", "At recorded low", "記録上の最安値"],
    ["highest", "At recorded high", "記録上の最高値"],
    ["price-drop", "Biggest price drop", "値下がり額が大きい順"],
    ["price-rise", "Biggest price increase", "値上がり額が大きい順"]
  ]) {
    assert.ok(html.includes(`<option value="${value}">${english}</option>`));
    assert.equal(translations.get(english), japanese);
  }
  const hint = html.match(/id="price-history-filter-hint"[^>]*>([^<]+)</)?.[1].trim();
  assert.ok(hint);
  assert.ok(translations.get(hint));
});

