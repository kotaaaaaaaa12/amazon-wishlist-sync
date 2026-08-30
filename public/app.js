const itemsElement = document.querySelector("#items");
const statusElement = document.querySelector("#status");
const wishlistFiltersElement = document.querySelector("#wishlist-filters");
const activeListElement = document.querySelector("#active-list");
const resultsSummaryElement = document.querySelector("#results-summary");
const searchInput = document.querySelector("#search-input");
const sortSelect = document.querySelector("#sort-select");
const filtersToggle = document.querySelector("#filters-toggle");
const advancedFiltersElement = document.querySelector("#advanced-filters");
const filterCountElement = document.querySelector("#filter-count");
const minPriceInput = document.querySelector("#min-price");
const maxPriceInput = document.querySelector("#max-price");
const priceStatusSelect = document.querySelector("#price-status");
const imageStatusSelect = document.querySelector("#image-status");
const pricePresetsElement = document.querySelector("#price-presets");
const resetFiltersButton = document.querySelector("#reset-filters");

const settingsButton = document.querySelector("#settings-button");
const settingsDialog = document.querySelector("#settings-dialog");
const settingsCloseButton = document.querySelector("#settings-close");

const randomButton = document.querySelector("#random-button");
const randomCountInput = document.querySelector("#random-count");
const randomDialog = document.querySelector("#random-dialog");
const randomCloseButton = document.querySelector("#random-close");
const randomAgainButton = document.querySelector("#random-again");
const randomResultsElement = document.querySelector("#random-results");
const randomContextElement = document.querySelector("#random-context");
const randomSummaryElement = document.querySelector("#random-summary");

const historyDialog = document.querySelector("#history-dialog");
const historyCloseButton = document.querySelector("#history-close");
const historyTitleElement = document.querySelector("#history-title");
const historyMetaElement = document.querySelector("#history-meta");
const historyCurrentElement = document.querySelector("#history-current");
const historyLowestElement = document.querySelector("#history-lowest");
const historyHighestElement = document.querySelector("#history-highest");
const historyChartElement = document.querySelector("#history-chart");
const historyListElement = document.querySelector("#history-list");
const historyCheckedElement = document.querySelector("#history-checked");
const historyAmazonLink = document.querySelector("#history-amazon");
const historyBackRandomButton = document.querySelector("#history-back-random");
const historyProductVisual = document.querySelector("#history-product-visual");
const historyProductImage = document.querySelector("#history-product-image");
const historyProductInitials = document.querySelector("#history-product-initials");
const historyProductPrice = document.querySelector("#history-product-price");
const historyProductChange = document.querySelector("#history-product-change");
const historyAsinElement = document.querySelector("#history-asin");

const statItems = document.querySelector("#stat-items");
const statTotal = document.querySelector("#stat-total");
const statAverage = document.querySelector("#stat-average");
const statRange = document.querySelector("#stat-range");
const dashboardNote = document.querySelector("#dashboard-note");
const summaryTicker = document.querySelector(".summary-ticker");
const summaryTickerMarquee = document.querySelector("#summary-ticker-marquee");
const summaryTickerGroup = document.querySelector("#summary-ticker-group");

const budgetInput = document.querySelector("#budget-input");
const budgetModeToggle = document.querySelector("#budget-mode-toggle");
const budgetClearButton = document.querySelector("#budget-clear");
const budgetTotalElement = document.querySelector("#budget-total");
const budgetStatusElement = document.querySelector("#budget-status");
const budgetProgressBar = document.querySelector("#budget-progress-bar");
const budgetFloatingElement = document.querySelector("#budget-floating");
const budgetFloatingTotal = document.querySelector("#budget-floating-total");
const budgetFloatingStatus = document.querySelector("#budget-floating-status");
const budgetFloatingDone = document.querySelector("#budget-floating-done");
const budgetAutoOpenButton = document.querySelector("#budget-auto-open");
const budgetAutoDialog = document.querySelector("#budget-auto-dialog");
const budgetAutoCloseButton = document.querySelector("#budget-auto-close");
const budgetAutoBudgetInput = document.querySelector("#budget-auto-budget");
const budgetAutoCountInput = document.querySelector("#budget-auto-count");
const budgetAutoSourceSelect = document.querySelector("#budget-auto-source");
const budgetAutoPrioritySelect = document.querySelector("#budget-auto-priority");
const budgetAutoRunButton = document.querySelector("#budget-auto-run");
const budgetAutoStatusElement = document.querySelector("#budget-auto-status");
const budgetAutoResultsElement = document.querySelector("#budget-auto-results");
const budgetAutoSummaryElement = document.querySelector("#budget-auto-summary");

const DEFAULT_STATE = {
  list: "all",
  query: "",
  sort: "newest",
  minPrice: null,
  maxPrice: null,
  priceStatus: "all",
  imageStatus: "all"
};

const VALID_SORTS = new Set([
  "newest",
  "oldest",
  "price-asc",
  "price-desc",
  "title-asc",
  "title-desc",
  "priority",
  "wishlist"
]);

const VALID_PRICE_STATUSES = new Set(["all", "priced", "missing"]);
const VALID_IMAGE_STATUSES = new Set(["all", "image", "missing"]);

let allItems = [];
let state = { ...DEFAULT_STATE };
let budgetMode = false;
let budgetAmount = null;
const selectedBudgetKeys = new Set();
let lastRandomKeys = new Set();
let returnDialogAfterDetails = null;

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.round(number);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function hasPrice(item) {
  return (
    item.price !== null &&
    item.price !== undefined &&
    Number.isFinite(Number(item.price))
  );
}

function getPrice(item) {
  return hasPrice(item) ? Number(item.price) : null;
}

function getOptionalPrice(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseDateTime(value) {
  if (!value) return 0;

  let normalized = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
    normalized = normalized.replace(" ", "T");
  }

  if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(normalized)) {
    normalized = `${normalized}Z`;
  }

  const timestamp = new Date(normalized).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDate(value) {
  const timestamp = parseDateTime(value);
  if (!timestamp) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(timestamp));
}

function formatDateTime(value) {
  const timestamp = parseDateTime(value);
  if (!timestamp) return "Unknown";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function formatRelativeChecked(value) {
  const timestamp = parseDateTime(value);
  if (!timestamp) return "Not checked yet";

  const difference = Math.max(0, Date.now() - timestamp);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (difference < minute) return "Checked just now";
  if (difference < hour) {
    const minutes = Math.floor(difference / minute);
    return `Checked ${minutes}m ago`;
  }
  if (difference < day) {
    const hours = Math.floor(difference / hour);
    return `Checked ${hours}h ago`;
  }
  if (difference < 7 * day) {
    const days = Math.floor(difference / day);
    return `Checked ${days}d ago`;
  }

  return `Checked ${formatDate(value)}`;
}

function formatPrice(price, currency = "JPY") {
  if (price === null || price === undefined) return null;

  try {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: currency || "JPY",
      maximumFractionDigits: 0
    }).format(Number(price));
  } catch {
    return `¥${Number(price).toLocaleString("ja-JP")}`;
  }
}

function formatCompactPrice(price) {
  if (price === null || price === undefined) return "—";
  return `¥${Math.round(Number(price)).toLocaleString("ja-JP")}`;
}

function normalizeSearchText(value) {
  return String(value ?? "").toLocaleLowerCase().trim();
}

function getInitials(title) {
  if (!title) return "A";

  const words = String(title).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "A";

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getItemKey(item) {
  return `${item.wishlist_slug ?? ""}:${item.asin ?? ""}`;
}

function getItemByKey(key) {
  return allItems.find((item) => getItemKey(item) === key) ?? null;
}

function normalizePriority(value) {
  const priority = String(value ?? "none").toLowerCase();
  return ["high", "medium", "low"].includes(priority) ? priority : "none";
}

function getPriorityRank(value) {
  switch (normalizePriority(value)) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

function formatPriorityLabel(value) {
  const priority = normalizePriority(value);
  if (priority === "none") return "";
  return `${priority[0].toUpperCase()}${priority.slice(1)} priority`;
}

function renderEmpty(message) {
  itemsElement.innerHTML = "";

  const empty = document.createElement("div");
  empty.className = "empty-state";

  const icon = document.createElement("div");
  icon.className = "empty-icon";
  icon.textContent = "♡";

  const text = document.createElement("p");
  text.textContent = message;

  empty.append(icon, text);
  itemsElement.append(empty);
}

function createVisual(item, className = "item-visual") {
  const visual = document.createElement("div");
  visual.className = className;

  const fallback = document.createElement("span");
  fallback.className = "item-initials";
  fallback.textContent = getInitials(item.title);
  visual.append(fallback);

  if (!item.image_url) return visual;

  const image = document.createElement("img");
  image.className = "item-image";
  image.src = item.image_url;
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";

  image.addEventListener("load", () => {
    visual.classList.add("has-image");
  });

  image.addEventListener("error", () => {
    image.remove();
    visual.classList.remove("has-image");
  });

  visual.prepend(image);
  return visual;
}

function getPriceHistoryInfo(item) {
  const current = getPrice(item);
  const previous = getOptionalPrice(item.previous_price);
  const lowest = getOptionalPrice(item.lowest_price);
  const historyCount = Number(item.price_history_count ?? 0);

  const hasHistory =
    historyCount >= 2 && current !== null && previous !== null;

  const change = hasHistory ? current - previous : null;
  const isLowest =
    historyCount >= 2 &&
    current !== null &&
    lowest !== null &&
    current === lowest;

  return {
    current,
    previous,
    lowest,
    historyCount,
    change,
    isLowest
  };
}

function createPriceHistoryRow(item) {
  const info = getPriceHistoryInfo(item);
  if (info.historyCount < 2) return null;

  const row = document.createElement("div");
  row.className = "price-history-row";

  if (info.change !== null && info.change !== 0) {
    const change = document.createElement("span");
    change.className = "price-change";

    if (info.change < 0) {
      change.classList.add("price-drop");
      change.textContent = `↓ ${formatCompactPrice(Math.abs(info.change))}`;
    } else {
      change.classList.add("price-rise");
      change.textContent = `↑ ${formatCompactPrice(info.change)}`;
    }

    row.append(change);
  }

  if (info.isLowest) {
    const lowest = document.createElement("span");
    lowest.className = "lowest-badge";
    lowest.textContent = "Lowest";
    row.append(lowest);
  }

  const points = document.createElement("span");
  points.className = "price-points";
  points.textContent = `${info.historyCount} price points`;
  row.append(points);

  return row;
}

function createBudgetSelectButton(item) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "budget-select-button";

  const key = getItemKey(item);
  const selected = selectedBudgetKeys.has(key);
  const priced = hasPrice(item);

  button.disabled = !priced;
  button.classList.toggle("selected", selected);
  button.setAttribute("aria-pressed", String(selected));

  if (!priced) {
    button.textContent = "No price";
  } else if (selected) {
    button.textContent = "Selected";
  } else {
    button.textContent = "Add to budget";
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!hasPrice(item)) return;

    if (selectedBudgetKeys.has(key)) {
      selectedBudgetKeys.delete(key);
    } else {
      selectedBudgetKeys.add(key);
    }

    renderBudgetPlanner();
    renderItems();
  });

  return button;
}

function createItemCard(item) {
  const card = document.createElement("article");
  card.className = "item-card";
  card.dataset.itemKey = getItemKey(item);
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute(
    "aria-label",
    `View details for ${item.title || item.asin || "Amazon item"}`
  );

  if (selectedBudgetKeys.has(getItemKey(item))) {
    card.classList.add("budget-selected");
  }

  const main = document.createElement("div");
  main.className = "item-link";

  const visual = createVisual(item);

  const content = document.createElement("div");
  content.className = "item-content";

  const top = document.createElement("div");
  top.className = "item-top";

  const topLeft = document.createElement("div");
  topLeft.className = "item-top-left";

  const wishlist = document.createElement("span");
  wishlist.className = "wishlist-badge";
  wishlist.textContent = item.wishlist_name || "Wishlist";
  topLeft.append(wishlist);

  const priority = normalizePriority(item.priority);
  if (priority !== "none") {
    const priorityBadge = document.createElement("span");
    priorityBadge.className = `priority-badge priority-${priority}`;
    priorityBadge.textContent = priority;
    topLeft.append(priorityBadge);
  }

  const date = document.createElement("span");
  date.className = "date";
  date.textContent = formatDate(item.created_at);

  top.append(topLeft, date);

  const title = document.createElement("h3");
  title.className = "item-title";
  title.textContent = item.title || item.asin || "Amazon item";

  const priceRow = document.createElement("div");
  priceRow.className = "price-row";

  const price = document.createElement("span");
  price.className = "item-price";
  const formattedPrice = formatPrice(item.price, item.currency);

  if (formattedPrice) {
    price.textContent = formattedPrice;
  } else {
    price.textContent = "Price unavailable";
    price.classList.add("price-unavailable");
  }

  const priceLabel = document.createElement("span");
  priceLabel.className = "price-label";
  priceLabel.textContent = formattedPrice ? "saved price" : "";
  priceRow.append(price, priceLabel);

  const historyRow = createPriceHistoryRow(item);

  const checked = document.createElement("div");
  checked.className = "last-checked";
  checked.textContent = formatRelativeChecked(
    item.last_checked_at ?? item.price_updated_at ?? item.created_at
  );

  const bottom = document.createElement("div");
  bottom.className = "item-bottom";

  const asin = document.createElement("span");
  asin.className = "asin";
  asin.textContent = item.asin || "";

  const detailsAction = document.createElement("span");
  detailsAction.className = "amazon-action details-action";
  detailsAction.innerHTML = `
    <span>Details</span>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></path>
    </svg>
  `;

  bottom.append(asin, detailsAction);
  content.append(top, title, priceRow);
  if (historyRow) content.append(historyRow);
  content.append(checked, bottom);
  main.append(visual, content);
  card.append(main);

  if (budgetMode) {
    const actions = document.createElement("div");
    actions.className = "item-card-actions";
    actions.append(createBudgetSelectButton(item));
    card.append(actions);
  }

  card.addEventListener("click", () => {
    openProductDetails(item);
  });

  card.addEventListener("keydown", (event) => {
    if (event.target !== card) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openProductDetails(item);
  });

  return card;
}

function getWishlistMap() {
  const lists = new Map();

  for (const item of allItems) {
    if (!item.wishlist_slug || !item.wishlist_name) continue;
    lists.set(item.wishlist_slug, item.wishlist_name);
  }

  return lists;
}

function getActiveListName() {
  if (state.list === "all") return "All";
  return getWishlistMap().get(state.list) || "All";
}

function itemMatchesSearch(item) {
  const query = normalizeSearchText(state.query);
  if (!query) return true;

  const searchable = [
    item.title,
    item.asin,
    item.wishlist_name,
    item.wishlist_slug
  ]
    .map(normalizeSearchText)
    .join(" ");

  return searchable.includes(query);
}

function itemMatchesPriceRange(item) {
  const hasMinimum = state.minPrice !== null;
  const hasMaximum = state.maxPrice !== null;

  if (!hasMinimum && !hasMaximum) return true;

  const price = getPrice(item);
  if (price === null) return false;
  if (hasMinimum && price < state.minPrice) return false;
  if (hasMaximum && price > state.maxPrice) return false;
  return true;
}

function itemMatchesPriceStatus(item) {
  if (state.priceStatus === "priced") return hasPrice(item);
  if (state.priceStatus === "missing") return !hasPrice(item);
  return true;
}

function itemMatchesImageStatus(item) {
  const hasImage = Boolean(item.image_url);
  if (state.imageStatus === "image") return hasImage;
  if (state.imageStatus === "missing") return !hasImage;
  return true;
}

function filterItems() {
  return allItems.filter((item) => {
    if (state.list !== "all" && item.wishlist_slug !== state.list) return false;
    if (!itemMatchesSearch(item)) return false;
    if (!itemMatchesPriceRange(item)) return false;
    if (!itemMatchesPriceStatus(item)) return false;
    if (!itemMatchesImageStatus(item)) return false;
    return true;
  });
}

function comparePrices(first, second, direction) {
  const firstPrice = getPrice(first);
  const secondPrice = getPrice(second);

  if (firstPrice === null && secondPrice === null) {
    return parseDateTime(second.created_at) - parseDateTime(first.created_at);
  }

  if (firstPrice === null) return 1;
  if (secondPrice === null) return -1;
  return (firstPrice - secondPrice) * direction;
}

function sortItems(items) {
  const sorted = [...items];

  switch (state.sort) {
    case "oldest":
      sorted.sort(
        (first, second) =>
          parseDateTime(first.created_at) - parseDateTime(second.created_at)
      );
      break;

    case "price-asc":
      sorted.sort((first, second) => comparePrices(first, second, 1));
      break;

    case "price-desc":
      sorted.sort((first, second) => comparePrices(first, second, -1));
      break;

    case "title-asc":
      sorted.sort((first, second) =>
        String(first.title ?? first.asin ?? "").localeCompare(
          String(second.title ?? second.asin ?? ""),
          undefined,
          { sensitivity: "base" }
        )
      );
      break;

    case "title-desc":
      sorted.sort((first, second) =>
        String(second.title ?? second.asin ?? "").localeCompare(
          String(first.title ?? first.asin ?? ""),
          undefined,
          { sensitivity: "base" }
        )
      );
      break;

    case "priority":
      sorted.sort((first, second) => {
        const rankDifference =
          getPriorityRank(second.priority) - getPriorityRank(first.priority);

        if (rankDifference !== 0) return rankDifference;

        return (
          parseDateTime(second.created_at) - parseDateTime(first.created_at)
        );
      });
      break;

    case "wishlist":
      sorted.sort((first, second) => {
        const listComparison = String(first.wishlist_name ?? "").localeCompare(
          String(second.wishlist_name ?? ""),
          undefined,
          { sensitivity: "base" }
        );

        if (listComparison !== 0) return listComparison;

        return String(first.title ?? first.asin ?? "").localeCompare(
          String(second.title ?? second.asin ?? ""),
          undefined,
          { sensitivity: "base" }
        );
      });
      break;

    case "newest":
    default:
      sorted.sort(
        (first, second) =>
          parseDateTime(second.created_at) - parseDateTime(first.created_at)
      );
      break;
  }

  return sorted;
}

function getVisibleStats(items) {
  const prices = items.map(getPrice).filter((price) => price !== null);
  const total = prices.reduce((sum, price) => sum + price, 0);
  const average = prices.length > 0 ? total / prices.length : null;
  const minimum = prices.length > 0 ? Math.min(...prices) : null;
  const maximum = prices.length > 0 ? Math.max(...prices) : null;

  return {
    count: items.length,
    pricedCount: prices.length,
    missingPriceCount: items.length - prices.length,
    total,
    average,
    minimum,
    maximum
  };
}

function removeIdsFromClone(element) {
  element.removeAttribute("id");

  for (const child of element.querySelectorAll("[id]")) {
    child.removeAttribute("id");
  }
}

function restartSummaryTicker() {
  if (!summaryTicker || !summaryTickerMarquee || !summaryTickerGroup) return;

  summaryTickerMarquee.classList.remove("ticker-running");

  for (const clone of summaryTickerMarquee.querySelectorAll(
    ".summary-ticker-group-clone"
  )) {
    clone.remove();
  }

  summaryTickerMarquee.style.transform = "translate3d(0, 0, 0)";

  const viewportWidth = Math.max(1, summaryTicker.clientWidth);
  const groupWidth = Math.max(1, Math.ceil(summaryTickerGroup.getBoundingClientRect().width));
  const gap = window.innerWidth <= 720 ? 48 : 68;
  const unitWidth = groupWidth + gap;

  // Keep enough copies in the train that the viewport is never left empty.
  const groupCount = Math.max(
    2,
    Math.ceil((viewportWidth + unitWidth) / unitWidth) + 1
  );

  for (let index = 1; index < groupCount; index += 1) {
    const clone = summaryTickerGroup.cloneNode(true);
    clone.classList.add("summary-ticker-group-clone");
    clone.setAttribute("aria-hidden", "true");
    removeIdsFromClone(clone);
    summaryTickerMarquee.append(clone);
  }

  const pixelsPerSecond = window.innerWidth <= 720 ? 40 : 34;
  const duration = Math.max(12, unitWidth / pixelsPerSecond);

  summaryTickerMarquee.style.setProperty("--ticker-gap", `${gap}px`);
  summaryTickerMarquee.style.setProperty("--ticker-shift", `${unitWidth}px`);
  summaryTickerMarquee.style.animationDuration = `${duration}s`;

  void summaryTickerMarquee.offsetWidth;
  summaryTickerMarquee.classList.add("ticker-running");
}

function updateDashboard(visibleItems) {
  const stats = getVisibleStats(visibleItems);

  statItems.textContent = String(stats.count);
  statTotal.textContent = stats.pricedCount > 0 ? formatCompactPrice(stats.total) : "—";
  statAverage.textContent =
    stats.average !== null ? formatCompactPrice(stats.average) : "—";

  if (stats.minimum === null || stats.maximum === null) {
    statRange.textContent = "—";
  } else if (stats.minimum === stats.maximum) {
    statRange.textContent = formatCompactPrice(stats.minimum);
  } else {
    statRange.textContent = `${formatCompactPrice(stats.minimum)} – ${formatCompactPrice(
      stats.maximum
    )}`;
  }

  if (stats.count === 0) {
    dashboardNote.textContent = "No items match the current filters.";
  } else if (stats.missingPriceCount > 0) {
    dashboardNote.textContent = `${stats.pricedCount} priced · ${stats.missingPriceCount} without price`;
  } else {
    dashboardNote.textContent = `${stats.pricedCount} priced`;
  }

  requestAnimationFrame(restartSummaryTicker);
}

function updateResultsSummary(visibleItems) {
  const stats = getVisibleStats(visibleItems);
  const parts = [`${stats.count} ${stats.count === 1 ? "item" : "items"}`];

  if (stats.pricedCount > 0) parts.push(`${stats.pricedCount} priced`);
  resultsSummaryElement.textContent = parts.join(" · ");

  statusElement.textContent =
    visibleItems.length === allItems.length
      ? `${allItems.length} ${allItems.length === 1 ? "item" : "items"}`
      : `${visibleItems.length} / ${allItems.length}`;
}

function updateRandomControls(visibleCount) {
  const maximum = Math.max(1, Math.min(10, visibleCount));
  randomCountInput.max = String(maximum);

  const current = parseNumber(randomCountInput.value) ?? 1;
  if (current > maximum) randomCountInput.value = String(maximum);
  if (current < 1) randomCountInput.value = "1";

  randomCountInput.disabled = visibleCount === 0;
  randomButton.disabled = visibleCount === 0;
}

function renderItems() {
  itemsElement.innerHTML = "";

  const filtered = filterItems();
  const sorted = sortItems(filtered);

  updateDashboard(sorted);
  updateResultsSummary(sorted);
  updateRandomControls(filtered.length);
  activeListElement.textContent = getActiveListName();

  if (sorted.length === 0) {
    renderEmpty("No items match these filters.");
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of sorted) fragment.append(createItemCard(item));
  itemsElement.append(fragment);
}

function renderWishlistFilters() {
  wishlistFiltersElement.innerHTML = "";
  const lists = getWishlistMap();

  const options = [
    { slug: "all", name: "All", count: allItems.length },
    ...Array.from(lists, ([slug, name]) => ({
      slug,
      name,
      count: allItems.filter((item) => item.wishlist_slug === slug).length
    }))
  ];

  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wishlist-filter-button";
    button.classList.toggle("active", option.slug === state.list);

    const name = document.createElement("span");
    name.textContent = option.name;

    const count = document.createElement("span");
    count.className = "wishlist-filter-count";
    count.textContent = String(option.count);

    button.append(name, count);
    button.addEventListener("click", () => {
      state.list = option.slug;
      lastRandomKeys = new Set();
      renderWishlistFilters();
      commitState();
    });

    wishlistFiltersElement.append(button);
  }
}

function getAdvancedFilterCount() {
  let count = 0;
  if (state.minPrice !== null || state.maxPrice !== null) count += 1;
  if (state.priceStatus !== "all") count += 1;
  if (state.imageStatus !== "all") count += 1;
  return count;
}

function renderFilterCount() {
  const count = getAdvancedFilterCount();
  filterCountElement.hidden = count === 0;
  filterCountElement.textContent = String(count);
}

function renderPricePresets() {
  const buttons = pricePresetsElement.querySelectorAll(".price-preset");

  for (const button of buttons) {
    const min = parseNumber(button.dataset.min);
    const max = parseNumber(button.dataset.max);
    button.classList.toggle(
      "active",
      min === state.minPrice && max === state.maxPrice
    );
  }
}

function syncControlsFromState() {
  searchInput.value = state.query;
  sortSelect.value = state.sort;
  minPriceInput.value = state.minPrice === null ? "" : String(state.minPrice);
  maxPriceInput.value = state.maxPrice === null ? "" : String(state.maxPrice);
  priceStatusSelect.value = state.priceStatus;
  imageStatusSelect.value = state.imageStatus;
  renderFilterCount();
  renderPricePresets();
}

function normalizePriceRange() {
  if (state.minPrice === null || state.maxPrice === null) return;
  if (state.minPrice <= state.maxPrice) return;

  const minimum = state.maxPrice;
  state.maxPrice = state.minPrice;
  state.minPrice = minimum;
}

function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const sort = params.get("sort");
  const priceStatus = params.get("price");
  const imageStatus = params.get("image");

  state = {
    list: params.get("list") || DEFAULT_STATE.list,
    query: params.get("q") || DEFAULT_STATE.query,
    sort: VALID_SORTS.has(sort) ? sort : DEFAULT_STATE.sort,
    minPrice: parseNumber(params.get("min")),
    maxPrice: parseNumber(params.get("max")),
    priceStatus: VALID_PRICE_STATUSES.has(priceStatus)
      ? priceStatus
      : DEFAULT_STATE.priceStatus,
    imageStatus: VALID_IMAGE_STATUSES.has(imageStatus)
      ? imageStatus
      : DEFAULT_STATE.imageStatus
  };

  normalizePriceRange();
}

function validateWishlistState() {
  if (state.list === "all") return;
  if (!getWishlistMap().has(state.list)) state.list = "all";
}

function writeStateToUrl() {
  const params = new URLSearchParams();

  if (state.list !== DEFAULT_STATE.list) params.set("list", state.list);
  if (state.query) params.set("q", state.query);
  if (state.sort !== DEFAULT_STATE.sort) params.set("sort", state.sort);
  if (state.minPrice !== null) params.set("min", String(state.minPrice));
  if (state.maxPrice !== null) params.set("max", String(state.maxPrice));
  if (state.priceStatus !== DEFAULT_STATE.priceStatus) {
    params.set("price", state.priceStatus);
  }
  if (state.imageStatus !== DEFAULT_STATE.imageStatus) {
    params.set("image", state.imageStatus);
  }

  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;

  window.history.replaceState(null, "", nextUrl);
}

function commitState() {
  normalizePriceRange();
  syncControlsFromState();
  writeStateToUrl();
  renderItems();
}

function resetState() {
  state = { ...DEFAULT_STATE };
  lastRandomKeys = new Set();
  renderWishlistFilters();
  commitState();
  advancedFiltersElement.hidden = true;
  filtersToggle.setAttribute("aria-expanded", "false");
}

function setBudgetMode(enabled) {
  budgetMode = enabled;
  document.body.classList.toggle("budget-mode", budgetMode);
  budgetModeToggle.setAttribute("aria-pressed", String(budgetMode));
  budgetModeToggle.textContent = budgetMode ? "Done selecting" : "Select items";
  renderItems();
}

function getBudgetSelection() {
  const selected = [];

  for (const key of selectedBudgetKeys) {
    const item = getItemByKey(key);
    if (item && hasPrice(item)) selected.push(item);
  }

  return selected;
}

function renderBudgetPlanner() {
  const selected = getBudgetSelection();
  const total = selected.reduce((sum, item) => sum + getPrice(item), 0);

  const totalText = formatCompactPrice(total);
  budgetTotalElement.textContent = totalText;
  budgetFloatingTotal.textContent = totalText;
  budgetClearButton.disabled = selected.length === 0;

  let statusText;

  if (selected.length === 0) {
    statusText = budgetAmount
      ? `${formatCompactPrice(budgetAmount)} budget available`
      : "0 items selected";
  } else if (budgetAmount === null) {
    statusText = `${selected.length} ${
      selected.length === 1 ? "item" : "items"
    } selected`;
  } else {
    const remaining = budgetAmount - total;

    statusText = remaining >= 0
      ? `${formatCompactPrice(remaining)} remaining · ${selected.length} selected`
      : `${formatCompactPrice(Math.abs(remaining))} over budget · ${selected.length} selected`;
  }

  budgetStatusElement.textContent = statusText;
  budgetFloatingStatus.textContent = statusText;

  if (budgetAmount && budgetAmount > 0) {
    const percent = clamp((total / budgetAmount) * 100, 0, 100);
    budgetProgressBar.style.width = `${percent}%`;
    budgetProgressBar.classList.toggle("over", total > budgetAmount);
  } else {
    budgetProgressBar.style.width = selected.length > 0 ? "12%" : "0%";
    budgetProgressBar.classList.remove("over");
  }

  budgetFloatingElement.classList.toggle("has-selection", selected.length > 0);
}

function clearBudgetSelection() {
  selectedBudgetKeys.clear();
  renderBudgetPlanner();
  renderItems();
}

function populateBudgetAutoSources() {
  const previous = budgetAutoSourceSelect.value || "current";
  budgetAutoSourceSelect.innerHTML = "";

  const currentOption = document.createElement("option");
  currentOption.value = "current";
  currentOption.textContent = "Current results";
  budgetAutoSourceSelect.append(currentOption);

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All wishlists";
  budgetAutoSourceSelect.append(allOption);

  for (const [slug, name] of getWishlistMap()) {
    const option = document.createElement("option");
    option.value = `list:${slug}`;
    option.textContent = name;
    budgetAutoSourceSelect.append(option);
  }

  const validValues = new Set(
    Array.from(budgetAutoSourceSelect.options).map((option) => option.value)
  );
  budgetAutoSourceSelect.value = validValues.has(previous) ? previous : "current";
}

function getBudgetAutoPrioritySet() {
  switch (budgetAutoPrioritySelect.value) {
    case "high":
      return new Set(["high"]);
    case "high-medium":
      return new Set(["high", "medium"]);
    case "assigned":
      return new Set(["high", "medium", "low"]);
    case "none":
      return new Set(["none"]);
    default:
      return null;
  }
}

function getBudgetAutoCandidates() {
  const source = budgetAutoSourceSelect.value;
  let candidates;

  if (source === "current") {
    candidates = filterItems();
  } else if (source === "all") {
    candidates = allItems;
  } else if (source.startsWith("list:")) {
    const slug = source.slice("list:".length);
    candidates = allItems.filter((item) => item.wishlist_slug === slug);
  } else {
    candidates = filterItems();
  }

  const allowedPriorities = getBudgetAutoPrioritySet();

  return candidates.filter((item) => {
    const price = getPrice(item);
    if (price === null || price <= 0) return false;

    if (allowedPriorities && !allowedPriorities.has(normalizePriority(item.priority))) {
      return false;
    }

    return true;
  });
}

function sumItemPrices(items) {
  return items.reduce((sum, item) => sum + (getPrice(item) ?? 0), 0);
}

function findBudgetAutoSet(candidates, budget, count) {
  if (candidates.length < count) {
    return {
      error: `Only ${candidates.length} priced ${candidates.length === 1 ? "item" : "items"} match those conditions.`
    };
  }

  const cheapest = [...candidates]
    .sort((first, second) => getPrice(first) - getPrice(second))
    .slice(0, count);

  const minimumRequired = sumItemPrices(cheapest);

  if (minimumRequired > budget) {
    return {
      error: `That budget is too low for ${count} ${count === 1 ? "item" : "items"}.`,
      minimumRequired
    };
  }

  let best = cheapest;
  let bestTotal = minimumRequired;
  const attempts = Math.min(1600, Math.max(450, candidates.length * 12));

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const pool = shuffle(candidates);
    const selected = [];
    let remaining = budget;

    for (const item of pool) {
      if (selected.length >= count) break;

      const price = getPrice(item);
      if (price !== null && price <= remaining) {
        selected.push(item);
        remaining -= price;
      }
    }

    if (selected.length !== count) continue;

    const total = budget - remaining;
    if (total > bestTotal) {
      best = selected;
      bestTotal = total;
      if (bestTotal === budget) break;
    }
  }

  return {
    items: best,
    total: bestTotal,
    remaining: budget - bestTotal,
    candidateCount: candidates.length
  };
}

function createBudgetAutoResult(item, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "random-result budget-auto-result";

  const number = document.createElement("span");
  number.className = "random-result-number";
  number.textContent = String(index + 1);

  const visual = createVisual(item, "random-result-visual");

  const content = document.createElement("div");
  content.className = "random-result-content";

  const wishlist = document.createElement("span");
  wishlist.className = "random-result-wishlist";
  wishlist.textContent = item.wishlist_name || "Wishlist";

  const title = document.createElement("strong");
  title.className = "random-result-title";
  title.textContent = item.title || item.asin || "Amazon item";

  const metadata = document.createElement("span");
  metadata.className = "random-result-price";
  const priorityLabel = formatPriorityLabel(item.priority);
  metadata.textContent = [
    formatPrice(item.price, item.currency),
    priorityLabel
  ].filter(Boolean).join(" · ");

  content.append(wishlist, title, metadata);

  const arrow = document.createElement("span");
  arrow.className = "random-result-arrow";
  arrow.textContent = "›";

  button.append(number, visual, content, arrow);
  button.addEventListener("click", () => {
    openProductDetails(item, { returnTo: "budget-auto" });
  });

  return button;
}

function renderBudgetAutoResult(result, budget) {
  budgetAutoResultsElement.innerHTML = "";

  for (const [index, item] of result.items.entries()) {
    budgetAutoResultsElement.append(createBudgetAutoResult(item, index));
  }

  budgetAutoStatusElement.textContent =
    `${result.candidateCount} priced candidates · ${result.items.length} picked`;
  budgetAutoSummaryElement.textContent =
    `${formatCompactPrice(result.total)} of ${formatCompactPrice(budget)} · ${formatCompactPrice(result.remaining)} remaining`;
}

function runBudgetAutoPick() {
  const budget = parseNumber(budgetAutoBudgetInput.value);
  const count = parseNumber(budgetAutoCountInput.value);

  budgetAutoResultsElement.innerHTML = "";
  budgetAutoSummaryElement.textContent = "";

  if (budget === null || budget <= 0) {
    budgetAutoStatusElement.textContent = "Enter a budget greater than ¥0.";
    return;
  }

  if (count === null || count < 1 || count > 20) {
    budgetAutoStatusElement.textContent = "Choose between 1 and 20 items.";
    return;
  }

  budgetAutoCountInput.value = String(count);

  const candidates = getBudgetAutoCandidates();
  const result = findBudgetAutoSet(candidates, budget, count);

  if (result.error) {
    budgetAutoStatusElement.textContent = result.minimumRequired
      ? `${result.error} Minimum needed: ${formatCompactPrice(result.minimumRequired)}.`
      : result.error;
    return;
  }

  renderBudgetAutoResult(result, budget);
}

function openBudgetAutoDialog() {
  populateBudgetAutoSources();

  const currentBudget = parseNumber(budgetInput.value);
  if (!budgetAutoBudgetInput.value) {
    budgetAutoBudgetInput.value = String(currentBudget ?? 20000);
  } else if (currentBudget !== null) {
    budgetAutoBudgetInput.value = String(currentBudget);
  }

  budgetAutoStatusElement.textContent = "";
  budgetAutoResultsElement.innerHTML = "";
  budgetAutoSummaryElement.textContent = "";

  closeSettingsDialog();
  if (!budgetAutoDialog.open) budgetAutoDialog.showModal();
}

function closeBudgetAutoDialog() {
  if (budgetAutoDialog.open) budgetAutoDialog.close();
}

function shuffle(items) {
  const array = [...items];

  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }

  return array;
}

function getRandomCount() {
  const visibleCount = filterItems().length;
  if (visibleCount === 0) return 0;

  const requested = parseNumber(randomCountInput.value) ?? 1;
  return clamp(requested, 1, Math.min(10, visibleCount));
}

function pickRandomItems() {
  const filtered = filterItems();
  if (filtered.length === 0) return [];

  const count = getRandomCount();
  let pool = filtered;

  if (filtered.length > count && lastRandomKeys.size > 0) {
    const fresh = filtered.filter((item) => !lastRandomKeys.has(getItemKey(item)));
    if (fresh.length >= count) pool = fresh;
  }

  const picks = shuffle(pool).slice(0, count);
  lastRandomKeys = new Set(picks.map(getItemKey));
  return picks;
}

function createRandomResult(item, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "random-result";

  const number = document.createElement("span");
  number.className = "random-result-number";
  number.textContent = String(index + 1);

  const visual = createVisual(item, "random-result-visual");

  const content = document.createElement("div");
  content.className = "random-result-content";

  const wishlist = document.createElement("span");
  wishlist.className = "random-result-wishlist";
  wishlist.textContent = item.wishlist_name || "Wishlist";

  const title = document.createElement("strong");
  title.className = "random-result-title";
  title.textContent = item.title || item.asin || "Amazon item";

  const price = document.createElement("span");
  price.className = "random-result-price";
  price.textContent = formatPrice(item.price, item.currency) || "Price unavailable";
  if (!hasPrice(item)) price.classList.add("price-unavailable");

  content.append(wishlist, title, price);

  const arrow = document.createElement("span");
  arrow.className = "random-result-arrow";
  arrow.textContent = "›";

  button.append(number, visual, content, arrow);
  button.addEventListener("click", () => {
    openProductDetails(item, { returnTo: "random" });
  });

  return button;
}

function renderRandomPicks(items) {
  randomResultsElement.innerHTML = "";

  items.forEach((item, index) => {
    randomResultsElement.append(createRandomResult(item, index));
  });

  const filteredCount = filterItems().length;
  const listName = getActiveListName();
  const context = state.list === "all"
    ? `Picked ${items.length} from ${filteredCount} currently visible items.`
    : `Picked ${items.length} from ${filteredCount} currently visible items in ${listName}.`;

  randomContextElement.textContent = context;

  const prices = items.map(getPrice).filter((price) => price !== null);
  const total = prices.reduce((sum, price) => sum + price, 0);

  randomSummaryElement.textContent = prices.length === 0
    ? "No saved prices in this selection."
    : `${prices.length} priced · ${formatCompactPrice(total)} total`;
}

function showRandomPicks() {
  const picks = pickRandomItems();
  if (picks.length === 0) return;

  renderRandomPicks(picks);
  closeSettingsDialog();
  if (!randomDialog.open) randomDialog.showModal();
}

function closeRandomDialog() {
  if (randomDialog.open) randomDialog.close();
}

function setProductVisual(item) {
  historyProductInitials.textContent = getInitials(item.title);
  historyProductInitials.hidden = false;
  historyProductImage.hidden = true;
  historyProductImage.removeAttribute("src");
  historyProductVisual.classList.remove("has-image");

  if (!item.image_url) return;

  historyProductImage.onload = () => {
    historyProductImage.hidden = false;
    historyProductInitials.hidden = true;
    historyProductVisual.classList.add("has-image");
  };

  historyProductImage.onerror = () => {
    historyProductImage.hidden = true;
    historyProductInitials.hidden = false;
    historyProductVisual.classList.remove("has-image");
  };

  historyProductImage.src = item.image_url;
}

function setHistoryLoading(item, returnTo = null) {
  setProductVisual(item);

  historyTitleElement.textContent = item.title || item.asin || "Amazon item";
  historyMetaElement.textContent = [
    item.wishlist_name || "Wishlist",
    formatPriorityLabel(item.priority)
  ].filter(Boolean).join(" · ");
  historyAsinElement.textContent = item.asin || "—";

  const formattedPrice = formatPrice(item.price, item.currency);
  historyProductPrice.textContent = formattedPrice || "Price unavailable";
  historyProductPrice.classList.toggle("price-unavailable", !formattedPrice);

  const priceInfo = getPriceHistoryInfo(item);
  historyProductChange.className = "product-dialog-change";

  if (priceInfo.change === null || priceInfo.change === 0) {
    historyProductChange.textContent = "";
  } else if (priceInfo.change < 0) {
    historyProductChange.textContent = `↓ ${formatCompactPrice(Math.abs(priceInfo.change))}`;
    historyProductChange.classList.add("price-drop");
  } else {
    historyProductChange.textContent = `↑ ${formatCompactPrice(priceInfo.change)}`;
    historyProductChange.classList.add("price-rise");
  }

  historyCurrentElement.textContent = formattedPrice || "No price";
  historyLowestElement.textContent = "—";
  historyHighestElement.textContent = "—";
  historyChartElement.innerHTML = '<div class="history-loading">Loading history…</div>';
  historyListElement.innerHTML = "";
  historyCheckedElement.textContent = formatDateTime(
    item.last_checked_at ?? item.price_updated_at ?? item.created_at
  );
  historyAmazonLink.href = item.url;
  historyBackRandomButton.hidden = !returnTo;
  historyBackRandomButton.textContent =
    returnTo === "random"
      ? "← Random picks"
      : returnTo === "budget-auto"
        ? "← Budget Auto Pick"
        : "← Back";
}

function createHistoryChart(history) {
  const values = history
    .slice()
    .reverse()
    .map((entry) => Number(entry.price))
    .filter(Number.isFinite);

  if (values.length === 0) {
    return '<div class="history-empty-chart">No recorded prices yet.</div>';
  }

  if (values.length === 1) {
    return `
      <div class="history-single-point">
        <span></span>
        <strong>${formatCompactPrice(values[0])}</strong>
      </div>
    `;
  }

  const width = 600;
  const height = 180;
  const padding = 20;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;

  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      ((value - minimum) / range) * (height - padding * 2);

    return { x, y, value };
  });

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const circles = points
    .map(
      (point) =>
        `<circle cx="${point.x}" cy="${point.y}" r="4"></circle>`
    )
    .join("");

  return `
    <svg
      viewBox="0 0 ${width} ${height}"
      role="img"
      aria-label="Price history chart"
      preserveAspectRatio="none"
    >
      <polyline points="${polyline}"></polyline>
      ${circles}
    </svg>
  `;
}

function renderHistoryList(history) {
  historyListElement.innerHTML = "";

  if (history.length === 0) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "No price points have been recorded yet.";
    historyListElement.append(empty);
    return;
  }

  history.forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "history-entry";

    const left = document.createElement("div");
    left.className = "history-entry-left";

    const date = document.createElement("strong");
    date.textContent = formatDateTime(entry.recorded_at);

    const label = document.createElement("span");
    label.textContent = index === 0 ? "Latest recorded price" : "Recorded price";

    left.append(date, label);

    const price = document.createElement("strong");
    price.className = "history-entry-price";
    price.textContent = formatPrice(entry.price, entry.currency) || "—";

    row.append(left, price);
    historyListElement.append(row);
  });
}

async function openProductDetails(item, { returnTo = null } = {}) {
  returnDialogAfterDetails = returnTo;

  if (returnTo === "random" && randomDialog.open) {
    randomDialog.close();
  }

  if (returnTo === "budget-auto" && budgetAutoDialog.open) {
    budgetAutoDialog.close();
  }

  setHistoryLoading(item, returnTo);
  if (!historyDialog.open) historyDialog.showModal();

  try {
    const params = new URLSearchParams({ list: item.wishlist_slug });
    const response = await fetch(
      `/api/items/${encodeURIComponent(item.asin)}/history?${params.toString()}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not load item details.");
    }

    const history = Array.isArray(data.history) ? data.history : [];
    const detailItem = data.item ?? item;
    const current = getOptionalPrice(detailItem.price);
    const historicalPrices = history
      .map((entry) => getOptionalPrice(entry.price))
      .filter((price) => price !== null);

    const lowest = historicalPrices.length > 0 ? Math.min(...historicalPrices) : null;
    const highest = historicalPrices.length > 0 ? Math.max(...historicalPrices) : null;

    setProductVisual({ ...item, ...detailItem });
    historyTitleElement.textContent =
      detailItem.title || detailItem.asin || "Amazon item";
    historyMetaElement.textContent = [
      detailItem.wishlist_name || item.wishlist_name || "Wishlist",
      formatPriorityLabel(detailItem.priority ?? item.priority)
    ].filter(Boolean).join(" · ");
    historyAsinElement.textContent = detailItem.asin || item.asin || "—";

    const currentText = current !== null
      ? formatPrice(current, detailItem.currency)
      : null;

    historyProductPrice.textContent = currentText || "Price unavailable";
    historyProductPrice.classList.toggle("price-unavailable", !currentText);
    historyCurrentElement.textContent = current !== null ? formatCompactPrice(current) : "No price";
    historyLowestElement.textContent = lowest !== null ? formatCompactPrice(lowest) : "—";
    historyHighestElement.textContent = highest !== null ? formatCompactPrice(highest) : "—";
    historyChartElement.innerHTML = createHistoryChart(history);
    renderHistoryList(history);
    historyCheckedElement.textContent = formatDateTime(
      detailItem.last_checked_at ?? item.last_checked_at ?? item.price_updated_at ?? item.created_at
    );
    historyAmazonLink.href = detailItem.url || item.url;

    const detailInfo = getPriceHistoryInfo({ ...item, ...detailItem });
    historyProductChange.className = "product-dialog-change";
    if (detailInfo.change === null || detailInfo.change === 0) {
      historyProductChange.textContent = "";
    } else if (detailInfo.change < 0) {
      historyProductChange.textContent = `↓ ${formatCompactPrice(Math.abs(detailInfo.change))}`;
      historyProductChange.classList.add("price-drop");
    } else {
      historyProductChange.textContent = `↑ ${formatCompactPrice(detailInfo.change)}`;
      historyProductChange.classList.add("price-rise");
    }
  } catch (error) {
    historyChartElement.innerHTML = "";
    historyListElement.innerHTML = "";

    const message = document.createElement("p");
    message.className = "history-empty";
    message.textContent = error.message;
    historyListElement.append(message);
  }
}

function closeProductDetails({ returnToSource = true } = {}) {
  if (historyDialog.open) historyDialog.close();

  const target = returnToSource ? returnDialogAfterDetails : null;
  returnDialogAfterDetails = null;

  if (target === "random" && !randomDialog.open) {
    setTimeout(() => randomDialog.showModal(), 0);
  }

  if (target === "budget-auto" && !budgetAutoDialog.open) {
    setTimeout(() => budgetAutoDialog.showModal(), 0);
  }
}

function openSettingsDialog() {
  renderBudgetPlanner();
  updateRandomControls(filterItems().length);
  if (!settingsDialog.open) settingsDialog.showModal();
}

function closeSettingsDialog() {
  if (settingsDialog.open) settingsDialog.close();
}

function bindEvents() {
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value;
    lastRandomKeys = new Set();
    commitState();
  });

  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    commitState();
  });

  filtersToggle.addEventListener("click", () => {
    const isOpen = !advancedFiltersElement.hidden;
    advancedFiltersElement.hidden = isOpen;
    filtersToggle.setAttribute("aria-expanded", String(!isOpen));
  });

  minPriceInput.addEventListener("change", () => {
    state.minPrice = parseNumber(minPriceInput.value);
    lastRandomKeys = new Set();
    commitState();
  });

  maxPriceInput.addEventListener("change", () => {
    state.maxPrice = parseNumber(maxPriceInput.value);
    lastRandomKeys = new Set();
    commitState();
  });

  priceStatusSelect.addEventListener("change", () => {
    state.priceStatus = priceStatusSelect.value;
    lastRandomKeys = new Set();
    commitState();
  });

  imageStatusSelect.addEventListener("change", () => {
    state.imageStatus = imageStatusSelect.value;
    lastRandomKeys = new Set();
    commitState();
  });

  pricePresetsElement.addEventListener("click", (event) => {
    const button = event.target.closest(".price-preset");
    if (!button) return;

    const min = parseNumber(button.dataset.min);
    const max = parseNumber(button.dataset.max);
    const alreadyActive = min === state.minPrice && max === state.maxPrice;

    if (alreadyActive) {
      state.minPrice = null;
      state.maxPrice = null;
    } else {
      state.minPrice = min;
      state.maxPrice = max;
    }

    lastRandomKeys = new Set();
    commitState();
  });

  resetFiltersButton.addEventListener("click", resetState);

  settingsButton.addEventListener("click", openSettingsDialog);
  settingsCloseButton.addEventListener("click", closeSettingsDialog);
  settingsDialog.addEventListener("click", (event) => {
    if (event.target === settingsDialog) closeSettingsDialog();
  });

  randomCountInput.addEventListener("change", () => {
    const count = getRandomCount();
    if (count > 0) randomCountInput.value = String(count);
  });

  randomButton.addEventListener("click", showRandomPicks);
  randomAgainButton.addEventListener("click", showRandomPicks);
  randomCloseButton.addEventListener("click", closeRandomDialog);

  randomDialog.addEventListener("click", (event) => {
    if (event.target === randomDialog) closeRandomDialog();
  });

  historyCloseButton.addEventListener("click", () => closeProductDetails());
  historyBackRandomButton.addEventListener("click", () => closeProductDetails());
  historyDialog.addEventListener("click", (event) => {
    if (event.target === historyDialog) closeProductDetails();
  });

  budgetInput.addEventListener("input", () => {
    budgetAmount = parseNumber(budgetInput.value);
    renderBudgetPlanner();
  });

  budgetModeToggle.addEventListener("click", () => {
    const enabling = !budgetMode;
    setBudgetMode(enabling);
    if (enabling) closeSettingsDialog();
  });

  budgetFloatingDone.addEventListener("click", () => {
    setBudgetMode(false);
  });

  budgetClearButton.addEventListener("click", clearBudgetSelection);

  budgetAutoOpenButton.addEventListener("click", openBudgetAutoDialog);
  budgetAutoCloseButton.addEventListener("click", closeBudgetAutoDialog);
  budgetAutoRunButton.addEventListener("click", runBudgetAutoPick);
  budgetAutoDialog.addEventListener("click", (event) => {
    if (event.target === budgetAutoDialog) closeBudgetAutoDialog();
  });

  budgetAutoCountInput.addEventListener("change", () => {
    const count = parseNumber(budgetAutoCountInput.value) ?? 3;
    budgetAutoCountInput.value = String(clamp(count, 1, 20));
  });

  window.addEventListener("popstate", () => {
    readStateFromUrl();
    validateWishlistState();
    lastRandomKeys = new Set();
    renderWishlistFilters();
    syncControlsFromState();
    renderItems();
  });
}

async function loadItems() {
  try {
    const response = await fetch("/api/items");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not load items.");
    }

    allItems = Array.isArray(data.items) ? data.items : [];

    readStateFromUrl();
    validateWishlistState();
    renderWishlistFilters();
    syncControlsFromState();
    renderBudgetPlanner();
    bindEvents();
    renderItems();
  } catch (error) {
    statusElement.textContent = "Error";
    resultsSummaryElement.textContent = "";
    updateDashboard([]);
    renderEmpty(error.message);
  }
}

window.addEventListener("resize", () => {
  requestAnimationFrame(restartSummaryTicker);
});

loadItems();
