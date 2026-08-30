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
const priorityFiltersElement = document.querySelector("#priority-filters");
const viewModeControl = document.querySelector("#view-mode-control");
const pricePresetsElement = document.querySelector("#price-presets");
const resetFiltersButton = document.querySelector("#reset-filters");
const controlsElement = document.querySelector(".controls");
const stickyToolbar = document.querySelector("#sticky-toolbar");
const stickySearchInput = document.querySelector("#sticky-search-input");
const stickyFiltersButton = document.querySelector("#sticky-filters-button");
const stickySettingsButton = document.querySelector("#sticky-settings-button");
const stickyFilterCount = document.querySelector("#sticky-filter-count");
const scrollTopButton = document.querySelector("#scroll-top-button");

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
const historyPrevButton = document.querySelector("#history-prev");
const historyNextButton = document.querySelector("#history-next");
const historyPositionElement = document.querySelector("#history-position");
const productDialogContent = document.querySelector("#product-dialog-content");

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
  imageStatus: "all",
  priorities: [],
  view: "comfortable"
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
const PRIORITY_ORDER = ["high", "medium", "low", "none"];
const VALID_PRIORITIES = new Set(PRIORITY_ORDER);
const VALID_VIEW_MODES = new Set(["comfortable", "compact"]);

let allItems = [];
let state = { ...DEFAULT_STATE };
let budgetMode = false;
let budgetAmount = null;
const selectedBudgetKeys = new Set();
let lastRandomKeys = new Set();
let returnDialogAfterDetails = null;
let activeDetailKey = null;
let detailHistoryPushed = false;
let filtersOpen = false;
let detailRequestSequence = 0;
let detailSwapSequence = 0;
let detailSwapInProgress = false;
let detailMorphInProgress = false;
let pendingDetailMorphCloseKey = null;
let scrollTicking = false;
let itemLayoutSequence = 0;
let viewModeTransitionTimer = null;
let detailRevealAnimations = [];

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
const DIALOG_ANIMATION_MS = 260;
const PRODUCT_DIALOG_CLOSE_MS = 330;
const DETAIL_SWAP_OUT_MS = 160;
const DETAIL_SWAP_IN_MS = 230;
const DETAIL_MORPH_MS = 560;
const DETAIL_CLOSE_MORPH_MS = 640;
const DETAIL_OPEN_BRIDGE_OFFSET = 0.24;
const DETAIL_CLOSE_BRIDGE_OFFSET = 0.76;
const DETAIL_SHRINK_MS = 430;

function cancelDetailRevealAnimations() {
  for (const animation of detailRevealAnimations) animation.cancel();
  detailRevealAnimations = [];
}

function animateDetailSectionsIn(dialog) {
  if (!dialog || dialog.id !== "history-dialog" || REDUCED_MOTION.matches) return;

  cancelDetailRevealAnimations();

  const selectors = [
    ".product-dialog-hero",
    ".product-info-grid",
    ".product-section-heading",
    ".history-stats",
    ".history-chart",
    ".history-list",
    ".product-dialog-footer"
  ];

  const elements = selectors
    .map((selector) => dialog.querySelector(selector))
    .filter(Boolean);

  detailRevealAnimations = elements.map((element, index) =>
    element.animate(
      [
        { opacity: 0, transform: "translate3d(0, 10px, 0)" },
        { opacity: 1, transform: "translate3d(0, 0, 0)" }
      ],
      {
        duration: 300,
        delay: 55 + index * 42,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "backwards"
      }
    )
  );
}

function setDetailBackgroundActive(active) {
  document.body.classList.toggle("detail-background-active", Boolean(active));
}

function openDialogAnimated(dialog) {
  if (!dialog || dialog.open) return;

  const isHistoryDialog = dialog.id === "history-dialog";
  dialog.classList.remove("dialog-closing", "dialog-visible");
  if (isHistoryDialog) setDetailBackgroundActive(true);

  // Native <dialog> focuses its first interactive control on open.
  // On Safari that made the close button show a blue focus ring immediately.
  // Focus the dialog shell itself before the first painted frame instead.
  dialog.tabIndex = -1;
  dialog.showModal();
  dialog.focus({ preventScroll: true });

  if (REDUCED_MOTION.matches) {
    dialog.classList.add("dialog-visible");
    return;
  }

  // Give Safari a painted initial frame before transitioning in.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!dialog.open) return;
      dialog.classList.add("dialog-visible");
      if (isHistoryDialog) animateDetailSectionsIn(dialog);
    });
  });
}

function closeDialogAnimated(dialog, afterClose = null) {
  if (!dialog || !dialog.open) {
    if (dialog?.id === "history-dialog") setDetailBackgroundActive(false);
    if (afterClose) afterClose();
    return;
  }

  const isHistoryDialog = dialog.id === "history-dialog";
  if (isHistoryDialog) {
    setDetailBackgroundActive(false);
    cancelDetailRevealAnimations();
  }

  if (REDUCED_MOTION.matches) {
    dialog.close();
    dialog.classList.remove("dialog-closing", "dialog-visible");
    if (afterClose) afterClose();
    return;
  }

  if (dialog.classList.contains("dialog-closing")) return;

  dialog.classList.add("dialog-closing");
  dialog.classList.remove("dialog-visible");

  const closeDuration =
    dialog.id === "history-dialog" ? PRODUCT_DIALOG_CLOSE_MS : DIALOG_ANIMATION_MS;

  window.setTimeout(() => {
    if (dialog.open) dialog.close();
    dialog.classList.remove("dialog-closing", "dialog-visible");
    if (afterClose) afterClose();
  }, closeDuration);
}

function getVisibleSortedItems() {
  return sortItems(filterItems());
}

function updateProductNavigation(item) {
  const visible = getVisibleSortedItems();
  const key = getItemKey(item);
  let index = visible.findIndex((candidate) => getItemKey(candidate) === key);

  if (index === -1) {
    historyPrevButton.disabled = true;
    historyNextButton.disabled = true;
    historyPositionElement.textContent = "Outside current results";
    return;
  }

  historyPrevButton.disabled = index <= 0;
  historyNextButton.disabled = index >= visible.length - 1;
  historyPositionElement.textContent = `${index + 1} / ${visible.length}`;
}

function clearProductDetailSwapClasses() {
  if (!productDialogContent) return;

  productDialogContent.classList.remove(
    "detail-swap-out-next",
    "detail-swap-out-previous",
    "detail-swap-in-next",
    "detail-swap-in-previous"
  );
}

function waitForUi(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function moveProductDetails(direction) {
  if (!activeDetailKey || detailSwapInProgress) return;

  const visible = getVisibleSortedItems();
  const index = visible.findIndex((item) => getItemKey(item) === activeDetailKey);
  if (index === -1) return;

  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= visible.length) return;

  const nextItem = visible[nextIndex];
  if (nextItem.image_url) {
    const preload = new Image();
    preload.decoding = "async";
    preload.src = nextItem.image_url;
  }

  const swapSequence = ++detailSwapSequence;
  const outClass = direction > 0
    ? "detail-swap-out-next"
    : "detail-swap-out-previous";
  const inClass = direction > 0
    ? "detail-swap-in-next"
    : "detail-swap-in-previous";

  detailSwapInProgress = true;
  historyDialog.classList.add("detail-switching");

  try {
    if (!REDUCED_MOTION.matches && productDialogContent) {
      clearProductDetailSwapClasses();
      productDialogContent.classList.add(outClass);
      await waitForUi(DETAIL_SWAP_OUT_MS);

      if (swapSequence !== detailSwapSequence || !historyDialog.open) return;

      productDialogContent.classList.remove(outClass);
      productDialogContent.classList.add(inClass);
    }

    await openProductDetails(nextItem, {
      returnTo: returnDialogAfterDetails,
      historyMode: returnDialogAfterDetails ? "none" : "replace"
    });

    if (swapSequence !== detailSwapSequence || !historyDialog.open) return;

    if (!REDUCED_MOTION.matches && productDialogContent) {
      void productDialogContent.offsetWidth;

      requestAnimationFrame(() => {
        if (swapSequence !== detailSwapSequence) return;
        productDialogContent.classList.remove(inClass);
      });

      await waitForUi(DETAIL_SWAP_IN_MS);
    }
  } finally {
    if (swapSequence === detailSwapSequence) {
      clearProductDetailSwapClasses();
      historyDialog.classList.remove("detail-switching");
      detailSwapInProgress = false;
    }
  }
}

function updateStickyUi() {
  if (!controlsElement || !stickyToolbar || !scrollTopButton) return;

  const controlsBottom = controlsElement.getBoundingClientRect().bottom;
  const showSticky = controlsBottom < 8 && window.scrollY > 120;
  stickyToolbar.hidden = !showSticky;

  const showScrollTop = window.scrollY > Math.max(700, window.innerHeight * 0.9);
  scrollTopButton.hidden = !showScrollTop;
  document.body.classList.toggle("has-scroll-top", showScrollTop);
}

function scheduleScrollUiUpdate() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    scrollTicking = false;
    updateStickyUi();
  });
}

function setupPwa() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The site still works normally when service workers are unavailable.
    });
  });
}

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

function getWishlistTheme(slug) {
  const value = String(slug ?? "wishlist");
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }

  const hue = ((Math.abs(hash) * 47) % 300) + 18;
  return {
    accent: `hsl(${hue} 62% 52%)`,
    soft: `hsl(${hue} 70% 52% / 0.12)`
  };
}

function applyWishlistTheme(element, slug) {
  if (!element) return;
  const theme = getWishlistTheme(slug);
  element.style.setProperty("--wishlist-accent", theme.accent);
  element.style.setProperty("--wishlist-accent-soft", theme.soft);
}

function normalizePriority(value) {
  const priority = String(value ?? "none").toLowerCase();
  return ["high", "medium", "low"].includes(priority) ? priority : "none";
}

function normalizePrioritySelection(values) {
  const requested = new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value ?? "").trim().toLowerCase())
      .filter((value) => VALID_PRIORITIES.has(value))
  );

  return PRIORITY_ORDER.filter((priority) => requested.has(priority));
}

function itemMatchesPriority(item) {
  if (state.priorities.length === 0) return true;
  return state.priorities.includes(normalizePriority(item.priority));
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

function createCardPriceChange(item) {
  const info = getPriceHistoryInfo(item);
  if (info.change === null || info.change === 0) return null;

  const change = document.createElement("span");
  change.className = "card-price-change";

  if (info.change < 0) {
    change.classList.add("price-drop");
    change.textContent = `↓ ${formatCompactPrice(Math.abs(info.change))}`;
  } else {
    change.classList.add("price-rise");
    change.textContent = `↑ ${formatCompactPrice(info.change)}`;
  }

  return change;
}

function createPriceHistoryRow(item) {
  const info = getPriceHistoryInfo(item);
  if (info.historyCount < 2) return null;

  const row = document.createElement("div");
  row.className = "price-history-row";

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
  const priority = normalizePriority(item.priority);
  card.dataset.priority = priority;
  card.classList.add(`priority-card-${priority}`);
  applyWishlistTheme(card, item.wishlist_slug);
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
  priceRow.append(price);
  const cardPriceChange = createCardPriceChange(item);
  if (cardPriceChange) priceRow.append(cardPriceChange);
  priceRow.append(priceLabel);

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
    openProductDetails(item, { historyMode: "push", sourceCard: card });
  });

  card.addEventListener("keydown", (event) => {
    if (event.target !== card) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openProductDetails(item, { historyMode: "push", sourceCard: card });
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
    if (!itemMatchesPriority(item)) return false;
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

function captureItemLayout() {
  const layout = new Map();

  for (const card of itemsElement.querySelectorAll(".item-card")) {
    const key = card.dataset.itemKey;
    if (!key) continue;
    layout.set(key, {
      rect: card.getBoundingClientRect(),
      node: card
    });
  }

  return layout;
}

function clearItemLayoutGhosts() {
  document.querySelectorAll(".item-layout-ghost").forEach((ghost) => ghost.remove());
}

function animateRemovedItemCards(previousLayout, nextKeys, sequence) {
  if (REDUCED_MOTION.matches || previousLayout.size === 0) return;

  const candidates = [];
  for (const [key, snapshot] of previousLayout) {
    if (nextKeys.has(key)) continue;
    const { rect } = snapshot;
    const visible = rect.bottom > 0 && rect.top < window.innerHeight;
    if (visible) candidates.push(snapshot);
    if (candidates.length >= 10) break;
  }

  for (const snapshot of candidates) {
    const ghost = snapshot.node.cloneNode(true);
    ghost.classList.add("item-layout-ghost");
    ghost.removeAttribute("role");
    ghost.removeAttribute("tabindex");
    ghost.setAttribute("aria-hidden", "true");
    ghost.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
    syncRenderedImages(snapshot.node, ghost);

    Object.assign(ghost.style, {
      left: `${snapshot.rect.left}px`,
      top: `${snapshot.rect.top}px`,
      width: `${snapshot.rect.width}px`,
      height: `${snapshot.rect.height}px`
    });

    document.body.append(ghost);
    const animation = ghost.animate(
      [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(0.965)" }
      ],
      { duration: 190, easing: "ease-out", fill: "forwards" }
    );

    animation.finished
      .catch(() => undefined)
      .finally(() => {
        if (sequence === itemLayoutSequence || ghost.isConnected) ghost.remove();
      });
  }
}

function animateCurrentItemLayout(previousLayout) {
  if (REDUCED_MOTION.matches) return;

  const cards = Array.from(itemsElement.querySelectorAll(".item-card"));
  cards.forEach((card, index) => {
    const current = card.getBoundingClientRect();
    const nearViewport =
      current.bottom > -120 && current.top < window.innerHeight + 120;
    if (!nearViewport) return;

    const previous = previousLayout.get(card.dataset.itemKey);

    if (!previous) {
      const delay = Math.min(index, 12) * 18;
      card.animate(
        [
          { opacity: 0, transform: "translate3d(0, 8px, 0) scale(0.992)" },
          { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }
        ],
        {
          duration: 260,
          delay,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "backwards"
        }
      );
      return;
    }

    const deltaX = previous.rect.left - current.left;
    const deltaY = previous.rect.top - current.top;

    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;

    card.animate(
      [
        { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
        { transform: "translate3d(0, 0, 0)" }
      ],
      {
        duration: 300,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "none"
      }
    );
  });
}

function renderItems({ previousLayout = null } = {}) {
  const layoutBefore = previousLayout ?? captureItemLayout();
  const sequence = ++itemLayoutSequence;
  clearItemLayoutGhosts();
  itemsElement.innerHTML = "";

  const filtered = filterItems();
  const sorted = sortItems(filtered);

  updateDashboard(sorted);
  updateResultsSummary(sorted);
  updateRandomControls(filtered.length);
  activeListElement.textContent = getActiveListName();

  if (sorted.length === 0) {
    renderEmpty("No items match these filters.");
    animateRemovedItemCards(layoutBefore, new Set(), sequence);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of sorted) fragment.append(createItemCard(item));
  itemsElement.append(fragment);

  const nextKeys = new Set(sorted.map((item) => getItemKey(item)));
  animateRemovedItemCards(layoutBefore, nextKeys, sequence);
  animateCurrentItemLayout(layoutBefore);
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
    applyWishlistTheme(button, option.slug);

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
  if (state.priorities.length > 0) count += 1;
  return count;
}

function renderFilterCount() {
  const count = getAdvancedFilterCount();
  filterCountElement.hidden = count === 0;
  filterCountElement.textContent = String(count);

  if (stickyFilterCount) {
    stickyFilterCount.hidden = count === 0;
    stickyFilterCount.textContent = String(count);
  }

  if (stickyFiltersButton) {
    stickyFiltersButton.classList.toggle("active", filtersOpen || count > 0);
  }
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

function renderPriorityFilters() {
  if (!priorityFiltersElement) return;

  const selected = new Set(state.priorities);
  const buttons = priorityFiltersElement.querySelectorAll(".priority-filter-chip");

  for (const button of buttons) {
    const priority = button.dataset.priority;
    const active = priority === "all"
      ? selected.size === 0
      : selected.has(priority);

    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

function syncControlsFromState() {
  searchInput.value = state.query;
  sortSelect.value = state.sort;
  minPriceInput.value = state.minPrice === null ? "" : String(state.minPrice);
  maxPriceInput.value = state.maxPrice === null ? "" : String(state.maxPrice);
  priceStatusSelect.value = state.priceStatus;
  imageStatusSelect.value = state.imageStatus;
  document.body.dataset.view = state.view;
  if (viewModeControl) {
    for (const button of viewModeControl.querySelectorAll(".view-mode-button")) {
      const active = button.dataset.view === state.view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }
  if (stickySearchInput) stickySearchInput.value = state.query;
  advancedFiltersElement.hidden = !filtersOpen;
  filtersToggle.setAttribute("aria-expanded", String(filtersOpen));
  renderFilterCount();
  renderPricePresets();
  renderPriorityFilters();
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
  const view = params.get("view");
  const priorities = normalizePrioritySelection(
    String(params.get("priority") ?? "")
      .split(",")
      .filter(Boolean)
  );

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
      : DEFAULT_STATE.imageStatus,
    priorities,
    view: VALID_VIEW_MODES.has(view) ? view : DEFAULT_STATE.view
  };

  filtersOpen = params.get("filters") === "1";
  activeDetailKey = params.get("item") || null;
  normalizePriceRange();
}

function validateWishlistState() {
  if (state.list === "all") return;
  if (!getWishlistMap().has(state.list)) state.list = "all";
}

function buildStateUrl() {
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
  if (state.priorities.length > 0) {
    params.set("priority", state.priorities.join(","));
  }
  if (state.view !== DEFAULT_STATE.view) params.set("view", state.view);
  if (filtersOpen) params.set("filters", "1");
  if (activeDetailKey) params.set("item", activeDetailKey);

  const query = params.toString();
  return query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
}

function writeStateToUrl({ mode = "replace" } = {}) {
  const nextUrl = buildStateUrl();

  if (mode === "push") {
    window.history.pushState(null, "", nextUrl);
  } else {
    window.history.replaceState(null, "", nextUrl);
  }
}

function commitState({ previousLayout = null } = {}) {
  normalizePriceRange();
  syncControlsFromState();
  writeStateToUrl();
  renderItems({ previousLayout });
}

function setViewModeAnimated(nextView) {
  if (!VALID_VIEW_MODES.has(nextView) || nextView === state.view) return;

  state.view = nextView;
  document.body.classList.add("view-mode-transitioning");
  syncControlsFromState();
  writeStateToUrl();

  if (viewModeTransitionTimer) window.clearTimeout(viewModeTransitionTimer);
  viewModeTransitionTimer = window.setTimeout(() => {
    document.body.classList.remove("view-mode-transitioning");
    viewModeTransitionTimer = null;
  }, REDUCED_MOTION.matches ? 0 : 380);
}

function resetState() {
  state = { ...DEFAULT_STATE, priorities: [] };
  filtersOpen = false;
  lastRandomKeys = new Set();
  renderWishlistFilters();
  commitState();
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
    case "medium":
      return new Set(["medium"]);
    case "low":
      return new Set(["low"]);
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

  if (settingsDialog.open) {
    closeDialogAnimated(settingsDialog, () => openDialogAnimated(budgetAutoDialog));
  } else {
    openDialogAnimated(budgetAutoDialog);
  }
}

function closeBudgetAutoDialog() {
  closeDialogAnimated(budgetAutoDialog);
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
  const priorityContext = state.priorities.length > 0
    ? ` Priority: ${state.priorities.map((priority) =>
        priority === "none"
          ? "None"
          : `${priority[0].toUpperCase()}${priority.slice(1)}`
      ).join(" + ")}.`
    : "";
  const context = state.list === "all"
    ? `Picked ${items.length} from ${filteredCount} currently visible items.${priorityContext}`
    : `Picked ${items.length} from ${filteredCount} currently visible items in ${listName}.${priorityContext}`;

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

  if (settingsDialog.open) {
    closeDialogAnimated(settingsDialog, () => openDialogAnimated(randomDialog));
  } else {
    openDialogAnimated(randomDialog);
  }
}

function closeRandomDialog() {
  closeDialogAnimated(randomDialog);
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
    requestAnimationFrame(() => {
      historyProductVisual.classList.add("has-image");
    });
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
  const loadingLowest = getOptionalPrice(item.lowest_price);
  const loadingHighest = getOptionalPrice(item.highest_price);
  historyLowestElement.textContent = loadingLowest !== null
    ? formatCompactPrice(loadingLowest)
    : "—";
  historyHighestElement.textContent = loadingHighest !== null
    ? formatCompactPrice(loadingHighest)
    : "—";
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

  updateProductNavigation(item);
}

function createHistoryChart(history) {
  const entries = history
    .slice()
    .reverse()
    .map((entry) => ({ ...entry, numericPrice: Number(entry.price) }))
    .filter((entry) => Number.isFinite(entry.numericPrice));

  if (entries.length === 0) {
    return '<div class="history-empty-chart">No recorded prices yet.</div>';
  }

  if (entries.length === 1) {
    return `
      <div class="history-single-point">
        <span></span>
        <strong>${formatCompactPrice(entries[0].numericPrice)}</strong>
        <small>${formatDateTime(entries[0].recorded_at)}</small>
      </div>
    `;
  }

  const width = 600;
  const height = 190;
  const paddingX = 32;
  const paddingY = 26;
  const values = entries.map((entry) => entry.numericPrice);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;

  const points = entries.map((entry, index) => {
    const x = paddingX + (index / (entries.length - 1)) * (width - paddingX * 2);
    const y =
      height -
      paddingY -
      ((entry.numericPrice - minimum) / range) * (height - paddingY * 2);

    return { x, y, entry, index };
  });

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const gridLines = [0.25, 0.5, 0.75]
    .map((ratio) => {
      const y = paddingY + ratio * (height - paddingY * 2);
      return `<line class="history-grid-line" x1="${paddingX}" x2="${width - paddingX}" y1="${y}" y2="${y}"></line>`;
    })
    .join("");
  const circles = points
    .map((point) => {
      const classes = ["history-point"];
      if (point.entry.numericPrice === minimum) classes.push("is-low");
      if (point.entry.numericPrice === maximum) classes.push("is-high");

      const label = `${formatDateTime(point.entry.recorded_at)} · ${formatCompactPrice(point.entry.numericPrice)}`;
      return `
        <circle
          class="${classes.join(" ")}"
          cx="${point.x}"
          cy="${point.y}"
          r="4.5"
          tabindex="0"
          role="button"
          aria-label="${escapeHtml(label)}"
          data-chart-index="${point.index}"
        ></circle>
      `;
    })
    .join("");

  return `
    <div class="history-chart-stage">
      <svg
        viewBox="0 0 ${width} ${height}"
        role="img"
        aria-label="Price history line chart. Tap a point for its date and price."
        preserveAspectRatio="none"
      >
        ${gridLines}
        <line class="history-selection-guide" x1="0" x2="0" y1="${paddingY}" y2="${height - paddingY}" hidden></line>
        <polyline class="history-line" points="${polyline}"></polyline>
        ${circles}
      </svg>
      <div class="history-chart-tooltip" id="history-chart-tooltip" hidden></div>
      <div class="history-chart-legend" aria-hidden="true">
        <span><i class="legend-low"></i>Low</span>
        <span><i class="legend-high"></i>High</span>
      </div>
    </div>
  `;
}

function bindHistoryChartInteractions(history) {
  const points = historyChartElement.querySelectorAll(".history-point");
  const tooltip = historyChartElement.querySelector("#history-chart-tooltip");
  const guide = historyChartElement.querySelector(".history-selection-guide");
  if (!points.length || !tooltip) return;

  const entries = history
    .slice()
    .reverse()
    .map((entry) => ({ ...entry, numericPrice: Number(entry.price) }))
    .filter((entry) => Number.isFinite(entry.numericPrice));

  let pinnedIndex = null;

  const showPoint = (point, pin = false) => {
    const index = Number(point.dataset.chartIndex);
    const entry = entries[index];
    if (!entry) return;

    if (pin) pinnedIndex = index;

    for (const candidate of points) {
      candidate.classList.toggle(
        "is-selected",
        Number(candidate.dataset.chartIndex) === index
      );
    }

    const svg = point.ownerSVGElement;
    const svgRect = svg.getBoundingClientRect();
    const chartRect = historyChartElement.getBoundingClientRect();
    const cx = Number(point.getAttribute("cx"));
    const cy = Number(point.getAttribute("cy"));
    const viewBox = svg.viewBox.baseVal;
    const left = svgRect.left - chartRect.left + (cx / viewBox.width) * svgRect.width;
    const top = svgRect.top - chartRect.top + (cy / viewBox.height) * svgRect.height;

    tooltip.innerHTML = `
      <strong>${formatCompactPrice(entry.numericPrice)}</strong>
      <span>${formatDateTime(entry.recorded_at)}</span>
    `;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.hidden = false;

    if (guide) {
      guide.setAttribute("x1", String(cx));
      guide.setAttribute("x2", String(cx));
      guide.hidden = false;
    }
  };

  const hidePoint = () => {
    if (pinnedIndex !== null && points[pinnedIndex]) {
      showPoint(points[pinnedIndex]);
      return;
    }

    tooltip.hidden = true;
    if (guide) guide.hidden = true;
    for (const candidate of points) candidate.classList.remove("is-selected");
  };

  points.forEach((point) => {
    point.addEventListener("pointerenter", () => showPoint(point));
    point.addEventListener("pointerleave", hidePoint);
    point.addEventListener("focus", () => showPoint(point));
    point.addEventListener("blur", hidePoint);
    point.addEventListener("click", (event) => {
      event.stopPropagation();
      const index = Number(point.dataset.chartIndex);
      if (pinnedIndex === index) {
        pinnedIndex = null;
        hidePoint();
        return;
      }
      showPoint(point, true);
    });
  });

  showPoint(points[points.length - 1], true);
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

function getItemCardByKey(key) {
  if (!key) return null;
  return Array.from(document.querySelectorAll(".item-card"))
    .find((card) => card.dataset.itemKey === key) ?? null;
}

function isCardMorphTargetUsable(card) {
  if (!card || !card.isConnected) return false;

  const rect = card.getBoundingClientRect();
  if (rect.width < 40 || rect.height < 40) return false;

  const visibleWidth = Math.max(
    0,
    Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0)
  );
  const visibleHeight = Math.max(
    0,
    Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
  );
  const visibleArea = visibleWidth * visibleHeight;
  const totalArea = rect.width * rect.height;

  return totalArea > 0 && visibleArea / totalArea >= 0.28;
}

function syncRenderedImages(sourceRoot, cloneRoot) {
  const sourceImages = Array.from(sourceRoot?.querySelectorAll?.("img") ?? []);
  const cloneImages = Array.from(cloneRoot?.querySelectorAll?.("img") ?? []);

  cloneImages.forEach((cloneImage, index) => {
    const sourceImage = sourceImages[index];
    if (!sourceImage) return;

    const sourceUrl = sourceImage.currentSrc || sourceImage.src;
    const sourceReady = sourceImage.complete && sourceImage.naturalWidth > 0;
    if (!sourceUrl || !sourceReady) return;

    cloneImage.loading = "eager";
    cloneImage.decoding = "sync";
    cloneImage.src = sourceUrl;
    cloneImage.hidden = false;
    cloneImage.classList.add("morph-clone-image-ready");

    const cloneVisual = cloneImage.closest(
      ".item-visual, .random-result-visual, .product-dialog-visual"
    );
    if (cloneVisual) {
      cloneVisual.classList.add("has-image");
      const fallback = cloneVisual.querySelector(".item-initials");
      if (fallback) fallback.classList.add("morph-clone-fallback-hidden");
    }
  });
}

function getCompressedMorphRect(cardRect, modalRect) {
  const extraWidth = clamp(cardRect.width * 0.065, 16, 36);
  const extraHeight = clamp(cardRect.height * 0.14, 26, 48);
  const width = Math.min(modalRect.width, cardRect.width + extraWidth);
  const height = Math.min(modalRect.height, cardRect.height + extraHeight);

  const centerX = cardRect.left + cardRect.width / 2;
  const centerY = cardRect.top + cardRect.height / 2;
  const viewportMargin = 8;
  const maxLeft = Math.max(viewportMargin, window.innerWidth - viewportMargin - width);
  const maxTop = Math.max(viewportMargin, window.innerHeight - viewportMargin - height);

  // The bridge grows in place around the card. It does not start travelling
  // toward the centered dialog until it already looks like a compressed modal.
  return {
    left: clamp(centerX - width / 2, viewportMargin, maxLeft),
    top: clamp(centerY - height / 2, viewportMargin, maxTop),
    width,
    height
  };
}

function getCompressedDetailScale(bridgeRect, modalRect) {
  const widthScale = bridgeRect.width / modalRect.width;
  const heightScale = bridgeRect.height / modalRect.height;
  return clamp(Math.min(widthScale, heightScale), 0.30, 0.82);
}

function createMorphDetailStage(originalInner, modalRect) {
  const detailCopy = originalInner?.cloneNode(true) ?? null;
  if (!detailCopy) return null;

  const stage = document.createElement("div");
  stage.className = "card-morph-detail-stage";
  stage.setAttribute("aria-hidden", "true");

  detailCopy.classList.add("card-morph-overlay-detail");
  detailCopy.setAttribute("aria-hidden", "true");
  detailCopy.querySelectorAll("[id]").forEach((element) => {
    element.removeAttribute("id");
  });
  detailCopy.querySelectorAll("button, a, input, select, textarea").forEach((element) => {
    element.setAttribute("tabindex", "-1");
  });
  syncRenderedImages(originalInner, detailCopy);

  // Keep the modal snapshot at its full, final geometry for the entire morph.
  // The surrounding stage tracks the moving shell and centers the snapshot, so
  // Safari never gets a chance to reflow or re-anchor the compressed content.
  detailCopy.style.width = `${modalRect.width}px`;
  detailCopy.style.height = `${modalRect.height}px`;
  detailCopy.style.transformOrigin = "50% 50%";
  detailCopy.scrollTop = originalInner?.scrollTop ?? 0;

  stage.append(detailCopy);
  return { stage, detailCopy };
}

function createCardMorphOverlay(sourceCard, { closing = false } = {}) {
  const sourceRect = sourceCard.getBoundingClientRect();
  const sourceStyle = getComputedStyle(sourceCard);
  const overlay = document.createElement("div");
  overlay.className = "card-morph-overlay-v2";
  if (closing) overlay.classList.add("card-morph-overlay-v2-closing");
  overlay.setAttribute("aria-hidden", "true");

  overlay.style.left = `${sourceRect.left}px`;
  overlay.style.top = `${sourceRect.top}px`;
  overlay.style.width = `${sourceRect.width}px`;
  overlay.style.height = `${sourceRect.height}px`;
  overlay.style.borderRadius = sourceStyle.borderRadius || "28px";
  overlay.style.setProperty("--morph-surface", sourceStyle.backgroundColor || "var(--surface-solid)");
  overlay.style.setProperty("--morph-border", sourceStyle.borderColor || "var(--border)");

  const clone = sourceCard.cloneNode(true);
  clone.classList.add("card-morph-overlay-card");
  clone.classList.remove(
    "opening-details",
    "morph-source-hidden",
    "morph-target-lock",
    "morph-handoff-target",
    "budget-selected"
  );
  clone.removeAttribute("role");
  clone.removeAttribute("tabindex");
  clone.removeAttribute("aria-label");
  clone.setAttribute("aria-hidden", "true");

  clone.querySelectorAll("[id]").forEach((element) => {
    element.removeAttribute("id");
  });

  clone.querySelectorAll("button, a, input, select, textarea").forEach((element) => {
    element.tabIndex = -1;
  });

  // Keep already-decoded images visible inside the moving clone on iOS Safari.
  syncRenderedImages(sourceCard, clone);

  overlay.append(clone);
  historyDialog.prepend(overlay);
  return overlay;
}

function removeCardMorphOverlay() {
  historyDialog.querySelector(":scope > .card-morph-overlay-v2")?.remove();
  historyDialog.querySelector(":scope > .card-morph-transform-host")?.remove();
  document.querySelectorAll(
    ".card-morph-portal-host, .card-morph-portal-backdrop"
  ).forEach((element) => element.remove());
}

function getDialogMorphTarget() {
  const rect = historyDialog.getBoundingClientRect();
  const style = getComputedStyle(historyDialog);
  const rootStyle = getComputedStyle(document.documentElement);

  return {
    rect,
    borderRadius: style.borderRadius || "30px",
    backgroundColor:
      rootStyle.getPropertyValue("--surface-solid").trim() ||
      style.backgroundColor ||
      "#fff",
    borderColor:
      rootStyle.getPropertyValue("--border").trim() ||
      style.borderColor ||
      "transparent"
  };
}

function waitForAnimation(animation) {
  return animation.finished.catch(() => undefined);
}

function cleanupOverlayMorph(
  sourceCard = null,
  { preserveTargetLock = false } = {}
) {
  removeCardMorphOverlay();
  historyDialog.classList.remove(
    "morph-overlay-active",
    "morph-overlay-backdrop-visible",
    "morph-overlay-revealing",
    "morph-overlay-closing"
  );

  if (sourceCard) {
    sourceCard.classList.remove("morph-source-hidden");
    if (!preserveTargetLock) {
      sourceCard.classList.remove("morph-target-lock", "morph-handoff-target");
    }
  }

  detailMorphInProgress = false;
}


function getRectTransform(fromRect, toRect) {
  const scaleX = toRect.width / Math.max(1, fromRect.width);
  const scaleY = toRect.height / Math.max(1, fromRect.height);
  const translateX = toRect.left - fromRect.left;
  const translateY = toRect.top - fromRect.top;

  return `matrix(${scaleX}, 0, 0, ${scaleY}, ${translateX}, ${translateY})`;
}

function sanitizeMorphClone(root) {
  if (!root) return;
  root.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
  root.querySelectorAll("button, a, input, select, textarea").forEach((element) => {
    element.setAttribute("tabindex", "-1");
  });
  root.setAttribute("aria-hidden", "true");
}

function syncCardImageIntoModalLayer(sourceCard, modalLayer) {
  const sourceImage = sourceCard?.querySelector(".item-image");
  const modalImage = modalLayer?.querySelector(".product-dialog-image");
  const modalVisual = modalImage?.closest(".product-dialog-visual");
  if (!sourceImage || !modalImage || !modalVisual) return;

  const sourceUrl = sourceImage.currentSrc || sourceImage.src;
  if (!sourceUrl || !(sourceImage.complete && sourceImage.naturalWidth > 0)) return;

  modalImage.loading = "eager";
  modalImage.decoding = "sync";
  modalImage.src = sourceUrl;
  modalImage.hidden = false;
  modalImage.classList.add("morph-clone-image-ready");
  modalVisual.classList.add("has-image");
  const fallback = modalVisual.querySelector(".item-initials");
  if (fallback) fallback.classList.add("morph-clone-fallback-hidden");
}

function createPortalCardLayer(sourceCard, cardRect) {
  const layer = document.createElement("div");
  layer.className = "card-morph-portal-card";
  layer.setAttribute("aria-hidden", "true");
  layer.style.left = `${cardRect.left}px`;
  layer.style.top = `${cardRect.top}px`;
  layer.style.width = `${cardRect.width}px`;
  layer.style.height = `${cardRect.height}px`;
  layer.style.borderRadius = getComputedStyle(sourceCard).borderRadius || "28px";

  const clone = sourceCard.cloneNode(true);
  clone.classList.add("card-morph-portal-card-copy");
  clone.classList.remove(
    "opening-details",
    "morph-source-hidden",
    "morph-target-lock",
    "morph-handoff-target",
    "morph-live-hidden",
    "morph-live-lock",
    "budget-selected"
  );
  clone.removeAttribute("role");
  clone.removeAttribute("tabindex");
  clone.removeAttribute("aria-label");
  sanitizeMorphClone(clone);
  syncRenderedImages(sourceCard, clone);

  layer.append(clone);
  return layer;
}

function createPortalModalLayer(originalInner, modalTarget, sourceCard = null) {
  const layer = document.createElement("div");
  layer.className = "card-morph-portal-modal";
  layer.setAttribute("aria-hidden", "true");
  layer.style.left = `${modalTarget.rect.left}px`;
  layer.style.top = `${modalTarget.rect.top}px`;
  layer.style.width = `${modalTarget.rect.width}px`;
  layer.style.height = `${modalTarget.rect.height}px`;
  layer.style.borderRadius = modalTarget.borderRadius;
  layer.style.backgroundColor = modalTarget.backgroundColor;
  layer.style.borderColor = modalTarget.borderColor;

  const detailCopy = originalInner?.cloneNode(true) ?? null;
  if (detailCopy) {
    detailCopy.classList.add("card-morph-portal-modal-inner");
    sanitizeMorphClone(detailCopy);
    syncRenderedImages(originalInner, detailCopy);
    detailCopy.scrollTop = originalInner?.scrollTop ?? 0;
    layer.append(detailCopy);
  }

  syncCardImageIntoModalLayer(sourceCard, layer);
  return layer;
}

function createMorphPortal(sourceCard, cardRect, originalInner, modalTarget) {
  const backdrop = document.createElement("div");
  backdrop.className = "card-morph-portal-backdrop";
  backdrop.setAttribute("aria-hidden", "true");

  const host = document.createElement("div");
  host.className = "card-morph-portal-host";
  host.setAttribute("aria-hidden", "true");

  const cardLayer = createPortalCardLayer(sourceCard, cardRect);
  const modalLayer = createPortalModalLayer(originalInner, modalTarget, sourceCard);
  host.append(cardLayer, modalLayer);

  // Body-level fixed layers use the viewport as their coordinate space. Keeping
  // them out of <dialog>'s top-layer coordinate system avoids iOS Safari drift.
  document.body.append(backdrop, host);
  return { backdrop, host, cardLayer, modalLayer };
}

async function crossfadePortalBackdropToNative(backdrop) {
  historyDialog.classList.add("dialog-visible", "morph-portal-handoff");
  historyDialog.classList.remove("morph-portal-active");

  const fade = backdrop?.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: 180, easing: "ease", fill: "forwards" }
  );
  if (fade) await waitForAnimation(fade);
  fade?.cancel();
  backdrop?.remove();
  historyDialog.classList.remove("morph-portal-handoff");
}

async function openProductDialogFromCard(sourceCard) {
  if (
    REDUCED_MOTION.matches ||
    detailMorphInProgress ||
    historyDialog.open ||
    !isCardMorphTargetUsable(sourceCard)
  ) {
    openDialogAnimated(historyDialog);
    return;
  }

  detailMorphInProgress = true;

  // Measure exactly what the user is looking at. Do not normalize hover/press
  // transforms before taking this rect; that was the source of the end snap.
  const sourceRect = sourceCard.getBoundingClientRect();
  sourceCard.classList.add("morph-live-lock", "morph-live-hidden");

  historyDialog.classList.remove(
    "dialog-closing",
    "dialog-visible",
    "morph-portal-handoff"
  );
  historyDialog.classList.add("morph-portal-active");
  historyDialog.tabIndex = -1;
  historyDialog.showModal();
  historyDialog.focus({ preventScroll: true });

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  if (!historyDialog.open) {
    sourceCard.classList.remove("morph-live-lock", "morph-live-hidden");
    cleanupOverlayMorph(sourceCard);
    return;
  }

  const target = getDialogMorphTarget();
  if (target.rect.width < 80 || target.rect.height < 80) {
    sourceCard.classList.remove("morph-live-lock", "morph-live-hidden");
    historyDialog.classList.remove("morph-portal-active");
    historyDialog.classList.add("dialog-visible");
    detailMorphInProgress = false;
    return;
  }

  const bridge = getCompressedMorphRect(sourceRect, target.rect);
  const originalInner = historyDialog.querySelector(":scope > .dialog-inner");
  const { backdrop, host, cardLayer, modalLayer } = createMorphPortal(
    sourceCard,
    sourceRect,
    originalInner,
    target
  );

  const identity = "matrix(1, 0, 0, 1, 0, 0)";
  const cardToBridge = getRectTransform(sourceRect, bridge);
  const modalToCard = getRectTransform(target.rect, sourceRect);
  const modalToBridge = getRectTransform(target.rect, bridge);

  // The compressed modal exists from the very first frame, exactly underneath
  // the card. The card only masks it for the first beat, then fades away while
  // both layers occupy the exact same bridge geometry.
  modalLayer.style.transform = modalToCard;
  modalLayer.style.opacity = "0.08";
  cardLayer.style.transform = identity;
  cardLayer.style.opacity = "1";
  backdrop.style.opacity = "0";

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const backdropAnimation = backdrop.animate(
    [
      { opacity: 0, offset: 0 },
      { opacity: 0.42, offset: 0.18 },
      { opacity: 1, offset: 0.58 },
      { opacity: 1, offset: 1 }
    ],
    { duration: DETAIL_MORPH_MS, easing: "ease", fill: "forwards" }
  );

  const cardAnimation = cardLayer.animate(
    [
      { transform: identity, opacity: 1, offset: 0 },
      { transform: cardToBridge, opacity: 1, offset: 0.10 },
      { transform: cardToBridge, opacity: 0.48, offset: 0.18 },
      { transform: cardToBridge, opacity: 0, offset: DETAIL_OPEN_BRIDGE_OFFSET },
      { transform: cardToBridge, opacity: 0, offset: 1 }
    ],
    {
      duration: DETAIL_MORPH_MS,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      fill: "forwards"
    }
  );

  const modalAnimation = modalLayer.animate(
    [
      { transform: modalToCard, opacity: 0.08, offset: 0 },
      { transform: modalToBridge, opacity: 0.32, offset: 0.08 },
      { transform: modalToBridge, opacity: 0.76, offset: 0.16 },
      { transform: modalToBridge, opacity: 1, offset: DETAIL_OPEN_BRIDGE_OFFSET },
      { transform: identity, opacity: 1, offset: 1 }
    ],
    {
      duration: DETAIL_MORPH_MS,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      fill: "forwards"
    }
  );

  await waitForAnimation(modalAnimation);

  if (!historyDialog.open) {
    cardAnimation.cancel();
    backdropAnimation.cancel();
    sourceCard.classList.remove("morph-live-lock", "morph-live-hidden");
    removeCardMorphOverlay();
    detailMorphInProgress = false;
    return;
  }

  // Native modal is already at the exact same final geometry. Reveal it under
  // the portal, then remove only opacity — no positional handoff is involved.
  historyDialog.classList.add("morph-portal-handoff", "dialog-visible");
  const hostHandoff = host.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: 120, easing: "ease-out", fill: "forwards" }
  );
  await waitForAnimation(hostHandoff);

  hostHandoff.cancel();
  cardAnimation.cancel();
  modalAnimation.cancel();
  backdropAnimation.cancel();
  host.remove();
  sourceCard.classList.remove("morph-live-lock", "morph-live-hidden");

  await crossfadePortalBackdropToNative(backdrop);
  detailMorphInProgress = false;
}

async function closeProductDialogStylish(afterClose = null) {
  if (!historyDialog.open) {
    if (afterClose) afterClose();
    return;
  }

  if (REDUCED_MOTION.matches || detailMorphInProgress) {
    closeDialogAnimated(historyDialog, afterClose);
    return;
  }

  detailMorphInProgress = true;
  removeCardMorphOverlay();
  historyDialog.classList.remove(
    "morph-overlay-active",
    "morph-overlay-backdrop-visible",
    "morph-overlay-revealing",
    "morph-overlay-closing"
  );

  const originalInner = historyDialog.querySelector(".dialog-inner");
  const snapshot = document.createElement("div");
  snapshot.className = "detail-close-snapshot";
  snapshot.setAttribute("aria-hidden", "true");

  const snapshotInner = originalInner?.cloneNode(true);
  if (snapshotInner) {
    snapshotInner.classList.add("detail-close-snapshot-inner");
    snapshotInner.querySelectorAll("[id]").forEach((element) => {
      element.removeAttribute("id");
    });
    snapshot.append(snapshotInner);
  }

  historyDialog.prepend(snapshot);
  if (snapshotInner && originalInner) {
    snapshotInner.scrollTop = originalInner.scrollTop;
  }

  historyDialog.classList.add("detail-snapshot-closing");

  // Paint the snapshot at full size first so Safari cannot skip straight to fade-out.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const snapshotAnimation = snapshot.animate(
    [
      {
        opacity: 1,
        transform: "translate3d(0, 0, 0) scale(1)",
        offset: 0
      },
      {
        opacity: 1,
        transform: "translate3d(0, 0, 0) scale(0.985)",
        offset: 0.34
      },
      {
        opacity: 0.96,
        transform: "translate3d(0, 3px, 0) scale(0.92)",
        offset: 0.68
      },
      {
        opacity: 0,
        transform: "translate3d(0, 9px, 0) scale(0.82)",
        offset: 1
      }
    ],
    {
      duration: 500,
      easing: "cubic-bezier(0.22, 0.8, 0.2, 1)",
      fill: "forwards"
    }
  );

  await waitForAnimation(snapshotAnimation);

  if (historyDialog.open) historyDialog.close();
  snapshotAnimation.cancel();
  snapshot.remove();
  historyDialog.classList.remove(
    "detail-snapshot-closing",
    "detail-shrink-closing",
    "dialog-visible",
    "dialog-closing"
  );
  detailMorphInProgress = false;

  if (afterClose) afterClose();
}

async function closeProductDialogToCard(targetCard, afterClose = null) {
  if (
    REDUCED_MOTION.matches ||
    detailMorphInProgress ||
    !historyDialog.open ||
    !isCardMorphTargetUsable(targetCard)
  ) {
    void closeProductDialogStylish(afterClose);
    return;
  }

  detailMorphInProgress = true;
  removeCardMorphOverlay();

  // Capture the exact on-screen card geometry before applying any helper class.
  // The live card is then hidden with opacity only, so its visual anchor cannot move.
  const targetRect = targetCard.getBoundingClientRect();
  const modal = getDialogMorphTarget();
  const originalInner = historyDialog.querySelector(":scope > .dialog-inner");

  if (targetRect.width < 40 || targetRect.height < 40) {
    detailMorphInProgress = false;
    void closeProductDialogStylish(afterClose);
    return;
  }

  targetCard.classList.add("morph-live-lock", "morph-live-hidden");
  const bridge = getCompressedMorphRect(targetRect, modal.rect);
  const { backdrop, host, cardLayer, modalLayer } = createMorphPortal(
    targetCard,
    targetRect,
    originalInner,
    modal
  );

  const identity = "matrix(1, 0, 0, 1, 0, 0)";
  const modalToBridge = getRectTransform(modal.rect, bridge);
  const modalToCard = getRectTransform(modal.rect, targetRect);
  const targetRadius = getComputedStyle(targetCard).borderRadius || "28px";

  modalLayer.style.transform = identity;
  modalLayer.style.opacity = "1";
  cardLayer.style.transform = identity;
  cardLayer.style.opacity = "0";
  backdrop.style.opacity = "1";

  // Body portal is now a pixel-matched visual copy of the modal. Only after it
  // has painted do we make the native top-layer transparent.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  historyDialog.classList.remove(
    "morph-overlay-active",
    "morph-overlay-revealing",
    "detail-snapshot-closing",
    "detail-shrink-closing",
    "morph-portal-handoff"
  );
  historyDialog.classList.add("morph-portal-active", "morph-overlay-closing");

  await new Promise((resolve) => requestAnimationFrame(resolve));

  if (!historyDialog.open) {
    targetCard.classList.remove("morph-live-lock", "morph-live-hidden");
    removeCardMorphOverlay();
    detailMorphInProgress = false;
    return;
  }

  const backdropAnimation = backdrop.animate(
    [
      { opacity: 1, offset: 0 },
      { opacity: 1, offset: 0.70 },
      { opacity: 0.72, offset: 0.86 },
      { opacity: 0.28, offset: 0.95 },
      { opacity: 0, offset: 1 }
    ],
    { duration: DETAIL_CLOSE_MORPH_MS, easing: "ease", fill: "forwards" }
  );

  // Keep the modal visual alive for the whole trip. It continues compressing
  // past the bridge all the way into the exact card rect. The card UI is only
  // cross-faded during the final beat, after both visuals already share the
  // same destination. This removes the visible "modal -> card" switch.
  const modalAnimation = modalLayer.animate(
    [
      {
        transform: identity,
        opacity: 1,
        borderRadius: modal.borderRadius,
        offset: 0
      },
      {
        transform: modalToBridge,
        opacity: 1,
        borderRadius: "26px",
        offset: DETAIL_CLOSE_BRIDGE_OFFSET
      },
      {
        transform: modalToCard,
        opacity: 1,
        borderRadius: targetRadius,
        offset: 0.88
      },
      {
        transform: modalToCard,
        opacity: 0.78,
        borderRadius: targetRadius,
        offset: 0.93
      },
      {
        transform: modalToCard,
        opacity: 0.34,
        borderRadius: targetRadius,
        offset: 0.975
      },
      {
        transform: modalToCard,
        opacity: 0,
        borderRadius: targetRadius,
        offset: 1
      }
    ],
    {
      duration: DETAIL_CLOSE_MORPH_MS,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      fill: "forwards"
    }
  );

  // The card clone never moves. It already sits on the real card's exact rect,
  // and only becomes visible as the compressed modal reaches that same rect.
  const cardAnimation = cardLayer.animate(
    [
      { transform: identity, opacity: 0, offset: 0 },
      { transform: identity, opacity: 0, offset: 0.88 },
      { transform: identity, opacity: 0.22, offset: 0.93 },
      { transform: identity, opacity: 0.66, offset: 0.975 },
      { transform: identity, opacity: 1, offset: 1 }
    ],
    {
      duration: DETAIL_CLOSE_MORPH_MS,
      easing: "ease",
      fill: "forwards"
    }
  );

  await waitForAnimation(cardAnimation);

  if (!historyDialog.open) {
    modalAnimation.cancel();
    backdropAnimation.cancel();
    targetCard.classList.remove("morph-live-lock", "morph-live-hidden");
    removeCardMorphOverlay();
    detailMorphInProgress = false;
    return;
  }

  // Card clone and live card are now the same rect. Reveal the live card without
  // changing transform or layout, then fade the portal clone away.
  targetCard.classList.remove("morph-live-hidden");
  const handoff = host.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: 80, easing: "ease-out", fill: "forwards" }
  );
  await waitForAnimation(handoff);

  if (historyDialog.open) historyDialog.close();
  modalAnimation.cancel();
  cardAnimation.cancel();
  backdropAnimation.cancel();
  handoff.cancel();
  host.remove();
  backdrop.remove();
  historyDialog.classList.remove(
    "dialog-visible",
    "dialog-closing",
    "morph-portal-active",
    "morph-portal-handoff",
    "morph-overlay-closing"
  );
  targetCard.classList.remove("morph-live-lock", "morph-live-hidden");
  detailMorphInProgress = false;

  if (afterClose) afterClose();
}

async function openProductDetails(
  item,
  { returnTo = null, historyMode = "none", sourceCard = null } = {}
) {
  const itemKey = getItemKey(item);
  const requestSequence = ++detailRequestSequence;
  returnDialogAfterDetails = returnTo;
  activeDetailKey = itemKey;

  if (historyMode === "push") {
    detailHistoryPushed = true;
    writeStateToUrl({ mode: "push" });
  } else if (historyMode === "replace") {
    writeStateToUrl({ mode: "replace" });
  }

  if (returnTo === "random" && randomDialog.open) randomDialog.close();
  if (returnTo === "budget-auto" && budgetAutoDialog.open) budgetAutoDialog.close();

  setHistoryLoading(item, returnTo);

  // v6.6: Item Details is now a standalone modal animation.
  // Do not visually connect it to the source card; this avoids Safari geometry
  // handoff jumps and keeps the animation identical from every entry point.
  removeCardMorphOverlay();
  detailMorphInProgress = false;
  historyDialog.classList.remove(
    "morph-overlay-active",
    "morph-overlay-backdrop-visible",
    "morph-overlay-revealing",
    "morph-overlay-closing",
    "detail-snapshot-closing",
    "detail-shrink-closing"
  );
  document.querySelectorAll(".item-card").forEach((card) => {
    card.classList.remove(
      "morph-source-hidden",
      "morph-target-lock",
      "morph-handoff-target",
      "morph-live-lock",
      "morph-live-hidden"
    );
  });

  openDialogAnimated(historyDialog);
  const openingPromise = Promise.resolve();

  try {
    const params = new URLSearchParams({ list: item.wishlist_slug });
    const response = await fetch(
      `/api/items/${encodeURIComponent(item.asin)}/history?${params.toString()}`
    );
    const data = await response.json();

    if (requestSequence !== detailRequestSequence) return;

    if (!response.ok) {
      throw new Error(data.error || "Could not load item details.");
    }

    // Keep the morph snapshot stable. If the API returns during the animation,
    // apply the detailed data only after the native modal has taken over.
    await openingPromise;
    if (requestSequence !== detailRequestSequence) return;

    const history = Array.isArray(data.history) ? data.history : [];
    const detailItem = data.item ?? item;
    const mergedItem = { ...item, ...detailItem };
    const current = getOptionalPrice(detailItem.price);
    const historicalPrices = history
      .map((entry) => getOptionalPrice(entry.price))
      .filter((price) => price !== null);

    const lowest = historicalPrices.length > 0 ? Math.min(...historicalPrices) : null;
    const highest = historicalPrices.length > 0 ? Math.max(...historicalPrices) : null;

    setProductVisual(mergedItem);
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
    bindHistoryChartInteractions(history);
    renderHistoryList(history);
    historyCheckedElement.textContent = formatDateTime(
      detailItem.last_checked_at ?? item.last_checked_at ?? item.price_updated_at ?? item.created_at
    );
    historyAmazonLink.href = detailItem.url || item.url;
    updateProductNavigation(mergedItem);

    const detailInfo = getPriceHistoryInfo(mergedItem);
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
    await openingPromise;
    if (requestSequence !== detailRequestSequence) return;
    historyChartElement.innerHTML = "";
    historyListElement.innerHTML = "";

    const message = document.createElement("p");
    message.className = "history-empty";
    message.textContent = error.message;
    historyListElement.append(message);
  }
}

function closeProductDetails({ returnToSource = true, fromHistory = false } = {}) {
  const closingItemKey = pendingDetailMorphCloseKey || activeDetailKey;

  detailRequestSequence += 1;
  detailSwapSequence += 1;
  detailSwapInProgress = false;
  historyDialog.classList.remove("detail-switching");
  clearProductDetailSwapClasses();

  if (!fromHistory && detailHistoryPushed && !returnDialogAfterDetails) {
    pendingDetailMorphCloseKey = closingItemKey;
    detailHistoryPushed = false;
    window.history.back();
    return;
  }

  const target = returnToSource ? returnDialogAfterDetails : null;
  returnDialogAfterDetails = null;
  activeDetailKey = null;

  if (!fromHistory) writeStateToUrl({ mode: "replace" });

  const afterClose = () => {
    if (target === "random") openDialogAnimated(randomDialog);
    if (target === "budget-auto") openDialogAnimated(budgetAutoDialog);
  };

  pendingDetailMorphCloseKey = null;
  removeCardMorphOverlay();
  detailMorphInProgress = false;

  // v6.6: close the Item Details modal in place. No Card handoff.
  closeDialogAnimated(historyDialog, afterClose);
}

function openSettingsDialog() {
  renderBudgetPlanner();
  updateRandomControls(filterItems().length);
  openDialogAnimated(settingsDialog);
}

function closeSettingsDialog() {
  closeDialogAnimated(settingsDialog);
}

function bindEvents() {
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value;
    if (stickySearchInput) stickySearchInput.value = state.query;
    lastRandomKeys = new Set();
    commitState();
  });

  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    commitState();
  });

  filtersToggle.addEventListener("click", () => {
    filtersOpen = !filtersOpen;
    syncControlsFromState();
    writeStateToUrl();
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

  priorityFiltersElement.addEventListener("click", (event) => {
    const button = event.target.closest(".priority-filter-chip");
    if (!button) return;

    const priority = button.dataset.priority;

    if (priority === "all") {
      state.priorities = [];
    } else if (VALID_PRIORITIES.has(priority)) {
      const selected = new Set(state.priorities);

      if (selected.has(priority)) {
        selected.delete(priority);
      } else {
        selected.add(priority);
      }

      state.priorities = normalizePrioritySelection([...selected]);
    }

    lastRandomKeys = new Set();
    commitState();
  });

  if (viewModeControl) {
    viewModeControl.addEventListener("click", (event) => {
      const button = event.target.closest(".view-mode-button");
      if (!button || !VALID_VIEW_MODES.has(button.dataset.view)) return;
      setViewModeAnimated(button.dataset.view);
    });
  }

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

  stickySearchInput.addEventListener("input", () => {
    state.query = stickySearchInput.value;
    searchInput.value = state.query;
    lastRandomKeys = new Set();
    commitState();
  });

  stickyFiltersButton.addEventListener("click", () => {
    filtersOpen = true;
    syncControlsFromState();
    writeStateToUrl();
    controlsElement.scrollIntoView({
      behavior: REDUCED_MOTION.matches ? "auto" : "smooth",
      block: "start"
    });
  });

  stickySettingsButton.addEventListener("click", openSettingsDialog);

  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: REDUCED_MOTION.matches ? "auto" : "smooth"
    });
  });

  historyPrevButton.addEventListener("click", () => moveProductDetails(-1));
  historyNextButton.addEventListener("click", () => moveProductDetails(1));

  let detailSwipe = null;
  productDialogContent.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) {
      detailSwipe = null;
      return;
    }

    if (event.target.closest("#history-chart, button, a, input, select, textarea")) {
      detailSwipe = null;
      return;
    }

    const touch = event.touches[0];
    detailSwipe = { x: touch.clientX, y: touch.clientY, time: performance.now() };
  }, { passive: true });

  productDialogContent.addEventListener("touchend", (event) => {
    if (!detailSwipe || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - detailSwipe.x;
    const deltaY = touch.clientY - detailSwipe.y;
    const elapsed = performance.now() - detailSwipe.time;
    detailSwipe = null;

    if (elapsed > 800) return;
    if (Math.abs(deltaX) < 52 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) return;
    moveProductDetails(deltaX < 0 ? 1 : -1);
  }, { passive: true });

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

  window.addEventListener("scroll", scheduleScrollUiUpdate, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (historyDialog.open && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveProductDetails(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveProductDetails(1);
      }
    }

    if (
      event.key === "/" &&
      !historyDialog.open &&
      !settingsDialog.open &&
      !randomDialog.open &&
      !budgetAutoDialog.open &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
    ) {
      event.preventDefault();
      searchInput.focus();
    }
  });

  for (const [dialog, closer] of [
    [settingsDialog, closeSettingsDialog],
    [randomDialog, closeRandomDialog],
    [budgetAutoDialog, closeBudgetAutoDialog]
  ]) {
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closer();
    });
  }

  historyDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeProductDetails();
  });

  window.addEventListener("popstate", () => {
    const previousDetailKey = activeDetailKey;
    readStateFromUrl();
    validateWishlistState();
    lastRandomKeys = new Set();
    renderWishlistFilters();
    syncControlsFromState();
    renderItems();

    if (activeDetailKey) {
      const item = getItemByKey(activeDetailKey);
      if (item && (previousDetailKey !== activeDetailKey || !historyDialog.open)) {
        detailHistoryPushed = false;
        openProductDetails(item, { historyMode: "none" });
      }
    } else if (historyDialog.open) {
      detailHistoryPushed = false;
      if (!pendingDetailMorphCloseKey) pendingDetailMorphCloseKey = previousDetailKey;
      closeProductDetails({ returnToSource: false, fromHistory: true });
    }

    updateStickyUi();
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
    updateStickyUi();

    if (activeDetailKey) {
      const item = getItemByKey(activeDetailKey);
      if (item) openProductDetails(item, { historyMode: "none" });
    }
  } catch (error) {
    statusElement.textContent = "Error";
    resultsSummaryElement.textContent = "";
    updateDashboard([]);
    renderEmpty(error.message);
  }
}

window.addEventListener("resize", () => {
  requestAnimationFrame(() => {
    restartSummaryTicker();
    updateStickyUi();
  });
});

setupPwa();
loadItems();
