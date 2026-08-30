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


const UI_LANGUAGE_STORAGE_KEY = "wishlist-ui-language-v1";
const UI_THEME_STORAGE_KEY = "wishlist-ui-theme-v1";
const VALID_UI_LANGUAGE_PREFERENCES = new Set(["auto", "ja", "en"]);
const VALID_UI_THEME_PREFERENCES = new Set(["auto", "light", "dark"]);

function readStoredUiPreference(key, validValues, fallback = "auto") {
  try {
    const value = String(localStorage.getItem(key) ?? "").trim();
    return validValues.has(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredUiPreference(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

// Auto follows the browser's primary language, which normally mirrors the
// OS/app language on iOS. Japanese is the only localized language; every
// other locale intentionally falls back to English. A manual preference can
// override that automatic choice.
const APP_LANGUAGE_PREFERENCE = readStoredUiPreference(
  UI_LANGUAGE_STORAGE_KEY,
  VALID_UI_LANGUAGE_PREFERENCES
);
const SYSTEM_LANGUAGE_SOURCE = String(
  (Array.isArray(navigator.languages) && navigator.languages[0]) || navigator.language || "en"
).trim();
const APP_LANGUAGE_SOURCE = APP_LANGUAGE_PREFERENCE === "auto"
  ? SYSTEM_LANGUAGE_SOURCE
  : APP_LANGUAGE_PREFERENCE;
const APP_LANGUAGE = /^ja(?:-|$)/i.test(APP_LANGUAGE_SOURCE) ? "ja" : "en";
const IS_JAPANESE = APP_LANGUAGE === "ja";
const APP_INTL_LOCALE = IS_JAPANESE ? "ja-JP" : "en-US";

let appThemePreference = readStoredUiPreference(
  UI_THEME_STORAGE_KEY,
  VALID_UI_THEME_PREFERENCES
);
const SYSTEM_DARK_MODE = window.matchMedia("(prefers-color-scheme: dark)");

function applyThemePreference() {
  document.documentElement.dataset.theme = appThemePreference;

  let override = document.querySelector('meta[name="theme-color"][data-app-theme-override]');
  if (appThemePreference === "auto") {
    override?.remove();
    return;
  }

  if (!override) {
    override = document.createElement("meta");
    override.name = "theme-color";
    override.dataset.appThemeOverride = "true";
    document.head.append(override);
  }
  override.content = appThemePreference === "dark" ? "#0d0d0f" : "#f5f5f7";
}

document.documentElement.lang = APP_LANGUAGE;
document.documentElement.dataset.appLanguage = APP_LANGUAGE;
applyThemePreference();

function i18n(english, japanese) {
  return IS_JAPANESE ? japanese : english;
}

function formatUiItemCount(count) {
  return IS_JAPANESE
    ? `${count}件`
    : `${count} ${count === 1 ? "item" : "items"}`;
}

function formatUiPlanCount(count) {
  return IS_JAPANESE
    ? `${count}件のプラン`
    : `${count} ${count === 1 ? "plan" : "plans"}`;
}

function formatPriorityName(value, { includeNone = true } = {}) {
  const priority = normalizePriority(value);
  if (IS_JAPANESE) {
    if (priority === "high") return "高";
    if (priority === "medium") return "中";
    if (priority === "low") return "低";
    return includeNone ? "なし" : "";
  }
  if (priority === "none") return includeNone ? "None" : "";
  return `${priority[0].toUpperCase()}${priority.slice(1)}`;
}

const STATIC_JA_TRANSLATIONS = new Map([
  ["Wishlist", "欲しいものリスト"],
  ["AMAZON WISHLIST", "AMAZON 欲しいものリスト"],
  ["Things I want.", "欲しいもの。"],
  ["Loading", "読み込み中"],
  ["Settings", "設定"],
  ["A collection of things saved from Amazon.", "Amazonで保存したものをまとめています。"],
  ["Sort", "並び替え"],
  ["Recently added", "追加が新しい順"],
  ["Oldest added", "追加が古い順"],
  ["Price: low to high", "価格が安い順"],
  ["Price: high to low", "価格が高い順"],
  ["Name: A to Z", "名前 A→Z"],
  ["Name: Z to A", "名前 Z→A"],
  ["Priority", "優先度"],
  ["Filters", "フィルター"],
  ["Price range", "価格帯"],
  ["Show items within a saved-price range.", "保存価格の範囲で絞り込みます。"],
  ["Minimum", "最小"],
  ["Maximum", "最大"],
  ["Choose one or more priorities. Random Picker uses the same selection.", "優先度を複数選べます。ランダム選択にも反映されます。"],
  ["All", "すべて"],
  ["High", "高"],
  ["Medium", "中"],
  ["Low", "低"],
  ["None", "なし"],
  ["Item data", "商品データ"],
  ["Filter by saved price or product image.", "保存価格や商品画像の有無で絞り込みます。"],
  ["Price", "価格"],
  ["Any price", "すべて"],
  ["Price available", "価格あり"],
  ["No saved price", "価格なし"],
  ["Image", "画像"],
  ["Any image", "すべて"],
  ["Image available", "画像あり"],
  ["No image", "画像なし"],
  ["Reset all", "すべてリセット"],
  ["Items", "アイテム"],
  ["Total", "合計"],
  ["Average", "平均"],
  ["Range", "範囲"],
  ["Synced with Amazon", "Amazonと同期済み"],
  ["Budget selection", "予算選択"],
  ["0 items selected", "0件選択中"],
  ["Done", "完了"],
  ["SETTINGS & TOOLS", "設定・ツール"],
  ["Keep the main view clean.", "メイン画面はすっきり。"],
  ["Random picks, view preferences, and budget tools live here when you need them.", "ランダム選択、表示設定、予算ツールはここにまとめています。"],
  ["VIEW MODE", "表示モード"],
  ["Choose how much fits on screen.", "画面に表示する情報量を選びます。"],
  ["Comfortable keeps the roomy cards. Compact fits more items without hiding useful details.", "ゆったり表示は見やすさ重視、コンパクト表示は情報を保ったまま多く表示します。"],
  ["Comfortable", "ゆったり"],
  ["Compact", "コンパクト"],
  ["RANDOM PICKER", "ランダム選択"],
  ["Pick from what is visible.", "表示中のアイテムから選びます。"],
  ["Current wishlist, search, price range, priority, and filters are all respected.", "現在のリスト、検索、価格帯、優先度、フィルターをすべて反映します。"],
  ["Pick random items", "ランダムに選ぶ"],
  ["BUDGET AUTO PICK", "予算自動選択"],
  ["Build a set automatically.", "予算内の組み合わせを自動で作ります。"],
  ["Choose a budget, item count, wishlist, and priority. The site finds a priced set for you.", "予算、個数、リスト、優先度を指定すると、価格のある商品から組み合わせを探します。"],
  ["Open Budget Auto Pick", "予算自動選択を開く"],
  ["BUDGET PLANNER", "予算プランナー"],
  ["Build a set within your budget.", "予算内で購入候補を組みます。"],
  ["For manual planning, enter a budget, enable selection mode, then choose priced items from the cards.", "手動で組む場合は予算を入力し、選択モードを有効にしてカードから商品を選びます。"],
  ["Budget", "予算"],
  ["Select items", "アイテムを選ぶ"],
  ["Clear selection", "選択をクリア"],
  ["Choose a budget and item count. The picker uses saved prices already loaded in the dashboard.", "予算と個数を指定します。ダッシュボードに読み込み済みの保存価格を使います。"],
  ["Source", "対象"],
  ["Current results", "現在の結果"],
  ["All wishlists", "すべてのリスト"],
  ["Any priority", "すべての優先度"],
  ["High only", "高のみ"],
  ["Medium only", "中のみ"],
  ["Low only", "低のみ"],
  ["High + Medium", "高 + 中"],
  ["Any assigned priority", "優先度あり"],
  ["No priority only", "優先度なしのみ"],
  ["Find a set", "組み合わせを探す"],
  ["RANDOM PICKS", "ランダム選択"],
  ["Your picks", "選ばれたアイテム"],
  ["Tap a pick to view details before opening Amazon.", "タップするとAmazonを開く前に詳細を確認できます。"],
  ["Pick again", "もう一度選ぶ"],
  ["Previous", "前へ"],
  ["Next", "次へ"],
  ["← Random picks", "← ランダム選択"],
  ["ITEM DETAILS", "商品詳細"],
  ["Loading…", "読み込み中…"],
  ["Last checked", "最終確認"],
  ["PRICE HISTORY", "価格履歴"],
  ["Recorded prices", "記録された価格"],
  ["Current", "現在価格"],
  ["Lowest", "最安値"],
  ["Highest", "最高値"],
  ["Amazon opens only when you choose it here.", "Amazonはここで選んだ時だけ開きます。"],
  ["Open on Amazon", "Amazonで開く"],
  ["Search", "検索"],
  ["Search wishlist", "欲しいものリストを検索"],
  ["Open filters", "フィルターを開く"],
  ["Open settings and tools", "設定・ツールを開く"],
  ["Wishlist filters", "欲しいものリストのフィルター"],
  ["Search and filters", "検索とフィルター"],
  ["Search items, ASINs, or wishlists", "商品名・ASIN・リストを検索"],
  ["No limit", "上限なし"],
  ["Quick price ranges", "価格帯プリセット"],
  ["Priority filters", "優先度フィルター"],
  ["Wishlist summary", "欲しいものリストの概要"],
  ["Scroll to top", "一番上へ戻る"],
  ["Close settings and tools", "設定・ツールを閉じる"],
  ["Card view mode", "カード表示モード"],
  ["Close budget auto pick", "予算自動選択を閉じる"],
  ["Close random picks", "ランダム選択を閉じる"],
  ["Browse visible items", "表示中のアイテムを移動"],
  ["Previous item", "前のアイテム"],
  ["Next item", "次のアイテム"],
  ["Close item details", "商品詳細を閉じる"],
  ["Interactive price history chart", "操作できる価格履歴グラフ"]
]);

function localizeStaticUi() {
  document.documentElement.lang = APP_LANGUAGE;
  document.title = i18n("Wishlist", "欲しいものリスト");
  const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitle) appleTitle.setAttribute("content", i18n("Wishlist", "欲しいものリスト"));
  if (!IS_JAPANESE || !document.body) return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  for (const node of textNodes) {
    const raw = node.nodeValue ?? "";
    const trimmed = raw.trim();
    const translated = STATIC_JA_TRANSLATIONS.get(trimmed);
    if (!translated) continue;
    node.nodeValue = raw.replace(trimmed, translated);
  }

  for (const element of document.body.querySelectorAll("[placeholder], [aria-label], [title]")) {
    for (const attribute of ["placeholder", "aria-label", "title"]) {
      const current = element.getAttribute(attribute);
      const translated = current ? STATIC_JA_TRANSLATIONS.get(current.trim()) : null;
      if (translated) element.setAttribute(attribute, translated);
    }
  }
}

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
const budgetItemStages = new Map();
let lastRandomKeys = new Set();
let returnDialogAfterDetails = null;
let activeDetailKey = null;
let detailHistoryPushed = false;
let filtersOpen = false;
let detailRequestSequence = 0;
let detailSwapSequence = 0;
let detailSwapInProgress = false;
let scrollTicking = false;
let itemLayoutSequence = 0;
let viewModeTransitionTimer = null;
let detailRevealAnimations = [];
let pendingPointerDetailCard = null;
let activePointerDetailCard = null;
let searchCommitFrame = 0;
let detailAbortController = null;
const detailResponseCache = new Map();
const itemCardCache = new Map();
const itemSearchTextCache = new Map();
const TEXT_COLLATOR = new Intl.Collator(APP_INTL_LOCALE, { sensitivity: "base" });
const DETAIL_CACHE_TTL_MS = 120_000;
const MAX_LAYOUT_EXIT_GHOSTS = 6;
const BUDGET_PLANS_STORAGE_KEY = "wishlist-budget-plans-v1";
const MAX_SAVED_BUDGET_PLANS = 12;
let budgetPlanDialog = null;
let budgetPlanContent = null;
let budgetPlanActiveTab = "summary";
let budgetPlanSmartResult = null;
let budgetPlanNoticeTimer = null;
let savedPlansDialog = null;
let preferencesSettingsCard = null;
let savedPlansSettingsButton = null;
let savedPlansSettingsCount = null;
let savedPlansNoticeTimer = null;
let actionConfirmDialog = null;
let actionConfirmResolver = null;

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
const DIALOG_ANIMATION_MS = 260;
const PRODUCT_DIALOG_CLOSE_MS = 330;
const DETAIL_SWAP_OUT_MS = 160;
const DETAIL_SWAP_IN_MS = 230;

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

  // Open the native dialog before touching the page behind it. On iOS Safari,
  // changing compositor state on the background in the same task as showModal()
  // can delay painting the top-layer dialog until the next navigation/reload.
  dialog.tabIndex = -1;
  dialog.showModal();
  dialog.focus({ preventScroll: true });

  if (REDUCED_MOTION.matches) {
    dialog.classList.add("dialog-visible");
    if (isHistoryDialog) setDetailBackgroundActive(true);
    return;
  }

  // First let Safari commit the native top layer, then animate the dialog and
  // only after that activate the background treatment.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!dialog.open) return;
      dialog.classList.add("dialog-visible");

      if (isHistoryDialog) {
        requestAnimationFrame(() => {
          if (!dialog.open) return;
          setDetailBackgroundActive(true);
          try {
            animateDetailSectionsIn(dialog);
          } catch (error) {
            // Section polish must never be able to block the modal itself.
            console.warn("Detail reveal animation skipped:", error);
          }
        });
      }
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
    historyPositionElement.textContent = i18n("Outside current results", "現在の結果外");
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

  return new Intl.DateTimeFormat(APP_INTL_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(timestamp));
}

function formatDateTime(value) {
  const timestamp = parseDateTime(value);
  if (!timestamp) return i18n("Unknown", "不明");

  return new Intl.DateTimeFormat(APP_INTL_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function formatRelativeChecked(value) {
  const timestamp = parseDateTime(value);
  if (!timestamp) return i18n("Not checked yet", "未確認");

  const difference = Math.max(0, Date.now() - timestamp);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (difference < minute) return i18n("Checked just now", "たった今確認");
  if (difference < hour) {
    const minutes = Math.floor(difference / minute);
    return IS_JAPANESE ? `${minutes}分前に確認` : `Checked ${minutes}m ago`;
  }
  if (difference < day) {
    const hours = Math.floor(difference / hour);
    return IS_JAPANESE ? `${hours}時間前に確認` : `Checked ${hours}h ago`;
  }
  if (difference < 7 * day) {
    const days = Math.floor(difference / day);
    return IS_JAPANESE ? `${days}日前に確認` : `Checked ${days}d ago`;
  }

  return IS_JAPANESE ? `${formatDate(value)}に確認` : `Checked ${formatDate(value)}`;
}

function formatPrice(price, currency = "JPY") {
  if (price === null || price === undefined) return null;

  try {
    return new Intl.NumberFormat(APP_INTL_LOCALE, {
      style: "currency",
      currency: currency || "JPY",
      maximumFractionDigits: 0
    }).format(Number(price));
  } catch {
    return `¥${Number(price).toLocaleString(APP_INTL_LOCALE)}`;
  }
}

function formatCompactPrice(price) {
  if (price === null || price === undefined) return "—";
  return `¥${Math.round(Number(price)).toLocaleString(APP_INTL_LOCALE)}`;
}

function normalizeSearchText(value) {
  return String(value ?? "").toLocaleLowerCase(APP_INTL_LOCALE).trim();
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
  return IS_JAPANESE ? `優先度：${formatPriorityName(priority)}` : `${priority[0].toUpperCase()}${priority.slice(1)} priority`;
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
    lowest.textContent = i18n("Lowest", "最安値");
    row.append(lowest);
  }

  const points = document.createElement("span");
  points.className = "price-points";
  points.textContent = IS_JAPANESE ? `価格履歴 ${info.historyCount}件` : `${info.historyCount} price points`;
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
    button.textContent = i18n("No price", "価格なし");
  } else if (selected) {
    button.textContent = i18n("Selected", "選択済み");
  } else {
    button.textContent = i18n("Add to budget", "予算に追加");
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!hasPrice(item)) return;

    if (selectedBudgetKeys.has(key)) {
      selectedBudgetKeys.delete(key);
      budgetItemStages.delete(key);
    } else {
      selectedBudgetKeys.add(key);
      budgetItemStages.set(key, "now");
    }

    budgetPlanSmartResult = null;
    renderBudgetPlanner();
    renderItems({ animateExits: false });
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
    IS_JAPANESE ? `${item.title || item.asin || i18n("Amazon item", "Amazon商品")}の詳細を表示` : `View details for ${item.title || item.asin || i18n("Amazon item", "Amazon商品")}`
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
  wishlist.textContent = item.wishlist_name || i18n("Wishlist", "欲しいものリスト");
  topLeft.append(wishlist);

  if (priority !== "none") {
    const priorityBadge = document.createElement("span");
    priorityBadge.className = `priority-badge priority-${priority}`;
    priorityBadge.textContent = formatPriorityName(priority);
    topLeft.append(priorityBadge);
  }

  const date = document.createElement("span");
  date.className = "date";
  date.textContent = formatDate(item.created_at);

  top.append(topLeft, date);

  const title = document.createElement("h3");
  title.className = "item-title";
  title.textContent = item.title || item.asin || i18n("Amazon item", "Amazon商品");

  const priceRow = document.createElement("div");
  priceRow.className = "price-row";

  const price = document.createElement("span");
  price.className = "item-price";
  const formattedPrice = formatPrice(item.price, item.currency);

  if (formattedPrice) {
    price.textContent = formattedPrice;
  } else {
    price.textContent = i18n("Price unavailable", "価格情報なし");
    price.classList.add("price-unavailable");
  }

  const priceLabel = document.createElement("span");
  priceLabel.className = "price-label";
  priceLabel.textContent = formattedPrice ? i18n("saved price", "保存価格") : "";
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
    <span>${i18n("Details", "詳細")}</span>
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

  return card;
}

function getReusableItemCard(item) {
  if (budgetMode) return createItemCard(item);

  const key = getItemKey(item);
  let card = itemCardCache.get(key);
  if (!card) {
    card = createItemCard(item);
    itemCardCache.set(key, card);
  }

  card.classList.toggle("budget-selected", selectedBudgetKeys.has(key));
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
  if (state.list === "all") return i18n("All", "すべて");
  return getWishlistMap().get(state.list) || i18n("All", "すべて");
}

function getItemSearchText(item) {
  const key = getItemKey(item);
  const cached = itemSearchTextCache.get(key);
  if (cached !== undefined) return cached;

  const searchable = [
    item.title,
    item.asin,
    item.wishlist_name,
    item.wishlist_slug
  ]
    .map(normalizeSearchText)
    .join(" ");

  itemSearchTextCache.set(key, searchable);
  return searchable;
}

function itemMatchesSearch(item, query) {
  if (!query) return true;
  return getItemSearchText(item).includes(query);
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
  const normalizedQuery = normalizeSearchText(state.query);

  return allItems.filter((item) => {
    if (state.list !== "all" && item.wishlist_slug !== state.list) return false;
    if (!itemMatchesSearch(item, normalizedQuery)) return false;
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
        TEXT_COLLATOR.compare(
          String(first.title ?? first.asin ?? ""),
          String(second.title ?? second.asin ?? "")
        )
      );
      break;

    case "title-desc":
      sorted.sort((first, second) =>
        TEXT_COLLATOR.compare(
          String(second.title ?? second.asin ?? ""),
          String(first.title ?? first.asin ?? "")
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
        const listComparison = TEXT_COLLATOR.compare(
          String(first.wishlist_name ?? ""),
          String(second.wishlist_name ?? "")
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
    dashboardNote.textContent = i18n("No items match the current filters.", "現在の条件に一致するアイテムはありません。");
  } else if (stats.missingPriceCount > 0) {
    dashboardNote.textContent = IS_JAPANESE ? `価格あり ${stats.pricedCount}件 · 価格なし ${stats.missingPriceCount}件` : `${stats.pricedCount} priced · ${stats.missingPriceCount} without price`;
  } else {
    dashboardNote.textContent = IS_JAPANESE ? `価格あり ${stats.pricedCount}件` : `${stats.pricedCount} priced`;
  }

  requestAnimationFrame(restartSummaryTicker);
}

function updateResultsSummary(visibleItems) {
  const stats = getVisibleStats(visibleItems);
  const parts = [IS_JAPANESE ? `${stats.count}件` : `${stats.count} ${stats.count === 1 ? "item" : "items"}`];

  if (stats.pricedCount > 0) parts.push(IS_JAPANESE ? `価格あり ${stats.pricedCount}件` : `${stats.pricedCount} priced`);
  resultsSummaryElement.textContent = parts.join(" · ");

  statusElement.textContent =
    visibleItems.length === allItems.length
      ? (IS_JAPANESE ? `${allItems.length}件` : `${allItems.length} ${allItems.length === 1 ? "item" : "items"}`)
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
    if (candidates.length >= MAX_LAYOUT_EXIT_GHOSTS) break;
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

function renderItems({ previousLayout = null, animateExits = true } = {}) {
  const layoutBefore = previousLayout ?? captureItemLayout();
  const sequence = ++itemLayoutSequence;
  clearItemLayoutGhosts();
  itemsElement.replaceChildren();

  const filtered = filterItems();
  const sorted = sortItems(filtered);

  updateDashboard(sorted);
  updateResultsSummary(sorted);
  updateRandomControls(filtered.length);
  activeListElement.textContent = getActiveListName();

  if (sorted.length === 0) {
    renderEmpty(i18n("No items match these filters.", "この条件に一致するアイテムはありません。"));
    if (animateExits) animateRemovedItemCards(layoutBefore, new Set(), sequence);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of sorted) fragment.append(getReusableItemCard(item));
  itemsElement.replaceChildren(fragment);

  const nextKeys = new Set(sorted.map((item) => getItemKey(item)));
  if (animateExits) animateRemovedItemCards(layoutBefore, nextKeys, sequence);
  animateCurrentItemLayout(layoutBefore);
}

function renderWishlistFilters() {
  wishlistFiltersElement.innerHTML = "";
  const lists = getWishlistMap();

  const counts = new Map();
  for (const item of allItems) {
    if (!item.wishlist_slug) continue;
    counts.set(item.wishlist_slug, (counts.get(item.wishlist_slug) ?? 0) + 1);
  }

  const options = [
    { slug: "all", name: i18n("All", "すべて"), count: allItems.length },
    ...Array.from(lists, ([slug, name]) => ({
      slug,
      name,
      count: counts.get(slug) ?? 0
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

function commitState({ previousLayout = null, animateExits = true } = {}) {
  normalizePriceRange();
  syncControlsFromState();
  writeStateToUrl();
  renderItems({ previousLayout, animateExits });
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

function scheduleSearchCommit() {
  if (searchCommitFrame) cancelAnimationFrame(searchCommitFrame);
  searchCommitFrame = requestAnimationFrame(() => {
    searchCommitFrame = 0;
    commitState({ animateExits: false });
  });
}

function resetState() {
  state = { ...DEFAULT_STATE, priorities: [] };
  filtersOpen = false;
  lastRandomKeys = new Set();
  renderWishlistFilters();
  commitState();
}

function updateBudgetModeButton() {
  if (!budgetModeToggle) return;

  const selectedCount = selectedBudgetKeys.size;
  budgetModeToggle.setAttribute("aria-pressed", String(budgetMode));

  if (budgetMode) {
    budgetModeToggle.textContent = i18n("Done selecting", "選択を完了");
  } else if (selectedCount > 0) {
    budgetModeToggle.textContent = IS_JAPANESE ? `プランを確認 (${selectedCount})` : `Review plan (${selectedCount})`;
  } else {
    budgetModeToggle.textContent = i18n("Select items", "アイテムを選ぶ");
  }
}

function setBudgetMode(enabled) {
  budgetMode = Boolean(enabled);
  budgetPlanSmartResult = null;
  document.body.classList.toggle("budget-mode", budgetMode);
  updateBudgetModeButton();
  renderItems({ animateExits: false });
}

function getBudgetSelection() {
  const selected = [];

  for (const key of selectedBudgetKeys) {
    const item = getItemByKey(key);
    if (item && hasPrice(item)) selected.push(item);
  }

  return selected;
}

function ensureBudgetItemStages() {
  for (const key of selectedBudgetKeys) {
    if (!budgetItemStages.has(key)) budgetItemStages.set(key, "now");
  }

  for (const key of Array.from(budgetItemStages.keys())) {
    if (!selectedBudgetKeys.has(key)) budgetItemStages.delete(key);
  }
}

function getBudgetStage(key) {
  return budgetItemStages.get(key) === "later" ? "later" : "now";
}

function setBudgetStage(key, stage) {
  if (!selectedBudgetKeys.has(key)) return;
  budgetItemStages.set(key, stage === "later" ? "later" : "now");
}

function getBudgetPlanTotals(selected = getBudgetSelection()) {
  ensureBudgetItemStages();

  const total = sumItemPrices(selected);
  const nowItems = selected.filter((item) => getBudgetStage(getItemKey(item)) === "now");
  const laterItems = selected.filter((item) => getBudgetStage(getItemKey(item)) === "later");
  const nowTotal = sumItemPrices(nowItems);
  const laterTotal = sumItemPrices(laterItems);
  const remaining = budgetAmount === null ? null : budgetAmount - total;
  const average = selected.length > 0 ? Math.round(total / selected.length) : 0;

  return {
    total,
    nowItems,
    laterItems,
    nowTotal,
    laterTotal,
    remaining,
    average
  };
}

function renderBudgetPlanner() {
  ensureBudgetItemStages();
  const selected = getBudgetSelection();
  const totals = getBudgetPlanTotals(selected);

  const totalText = formatCompactPrice(totals.total);
  budgetTotalElement.textContent = totalText;
  budgetFloatingTotal.textContent = totalText;
  budgetClearButton.disabled = selected.length === 0;

  let statusText;

  if (selected.length === 0) {
    statusText = budgetAmount
      ? (IS_JAPANESE ? `予算 ${formatCompactPrice(budgetAmount)}` : `${formatCompactPrice(budgetAmount)} budget available`)
      : i18n("0 items selected", "0件選択中");
  } else if (budgetAmount === null) {
    statusText = IS_JAPANESE ? `${selected.length}件選択中` : `${selected.length} ${selected.length === 1 ? "item" : "items"} selected`;
  } else if (totals.remaining >= 0) {
    statusText = IS_JAPANESE ? `残り ${formatCompactPrice(totals.remaining)} · ${selected.length}件選択中` : `${formatCompactPrice(totals.remaining)} remaining · ${selected.length} selected`;
  } else {
    statusText = IS_JAPANESE ? `${formatCompactPrice(Math.abs(totals.remaining))} 予算超過 · ${selected.length}件選択中` : `${formatCompactPrice(Math.abs(totals.remaining))} over budget · ${selected.length} selected`;
  }

  budgetStatusElement.textContent = statusText;
  budgetFloatingStatus.textContent = statusText;

  if (budgetAmount && budgetAmount > 0) {
    const percent = clamp((totals.total / budgetAmount) * 100, 0, 100);
    budgetProgressBar.style.width = `${percent}%`;
    budgetProgressBar.classList.toggle("over", totals.total > budgetAmount);
  } else {
    budgetProgressBar.style.width = selected.length > 0 ? "12%" : "0%";
    budgetProgressBar.classList.remove("over");
  }

  budgetFloatingElement.classList.toggle("has-selection", selected.length > 0);
  updateBudgetModeButton();

  if (budgetPlanDialog?.open) renderBudgetPlanDialog();
}

function clearBudgetSelection() {
  selectedBudgetKeys.clear();
  budgetItemStages.clear();
  budgetPlanSmartResult = null;
  renderBudgetPlanner();
  renderItems({ animateExits: false });

  if (budgetPlanDialog?.open) renderBudgetPlanDialog();
}

function getBudgetPriorityCounts(items) {
  const counts = { high: 0, medium: 0, low: 0, none: 0 };
  for (const item of items) counts[normalizePriority(item.priority)] += 1;
  return counts;
}

function getBudgetWishlistBreakdown(items) {
  const map = new Map();

  for (const item of items) {
    const name = item.wishlist_name || i18n("Wishlist", "欲しいものリスト");
    const current = map.get(name) ?? { name, count: 0, total: 0 };
    current.count += 1;
    current.total += getPrice(item) ?? 0;
    map.set(name, current);
  }

  return Array.from(map.values()).sort((first, second) => second.total - first.total);
}

function compareBudgetCandidates(first, second) {
  const priorityDifference = getPriorityRank(second.priority) - getPriorityRank(first.priority);
  if (priorityDifference !== 0) return priorityDifference;

  const firstInfo = getPriceHistoryInfo(first);
  const secondInfo = getPriceHistoryInfo(second);
  if (firstInfo.isLowest !== secondInfo.isLowest) return secondInfo.isLowest ? 1 : -1;

  const firstDropping = firstInfo.change !== null && firstInfo.change < 0;
  const secondDropping = secondInfo.change !== null && secondInfo.change < 0;
  if (firstDropping !== secondDropping) return secondDropping ? 1 : -1;

  const priceDifference = (getPrice(second) ?? 0) - (getPrice(first) ?? 0);
  if (priceDifference !== 0) return priceDifference;

  return TEXT_COLLATOR.compare(first.title ?? first.asin ?? "", second.title ?? second.asin ?? "");
}

function getBudgetFillSuggestions(limit = 8) {
  if (budgetAmount === null) return [];

  const selected = getBudgetSelection();
  const remaining = budgetAmount - sumItemPrices(selected);
  if (remaining <= 0) return [];

  return allItems
    .filter((item) => {
      const key = getItemKey(item);
      const price = getPrice(item);
      return !selectedBudgetKeys.has(key) && price !== null && price > 0 && price <= remaining;
    })
    .sort(compareBudgetCandidates)
    .slice(0, limit);
}

function getBudgetUnderRecommendation() {
  if (budgetAmount === null) return null;

  const selected = getBudgetSelection();
  const total = sumItemPrices(selected);
  const overage = total - budgetAmount;
  if (overage <= 0) return null;

  const ordered = [...selected].sort((first, second) => {
    const priorityDifference = getPriorityRank(first.priority) - getPriorityRank(second.priority);
    if (priorityDifference !== 0) return priorityDifference;

    const firstInfo = getPriceHistoryInfo(first);
    const secondInfo = getPriceHistoryInfo(second);
    if (firstInfo.isLowest !== secondInfo.isLowest) return firstInfo.isLowest ? 1 : -1;

    return (getPrice(second) ?? 0) - (getPrice(first) ?? 0);
  });

  const removed = [];
  let saved = 0;

  for (const item of ordered) {
    removed.push(item);
    saved += getPrice(item) ?? 0;
    if (saved >= overage) break;
  }

  return {
    items: removed,
    overage,
    saved,
    finalTotal: total - saved,
    remaining: budgetAmount - (total - saved)
  };
}

function buildOptimizedBudgetPlan() {
  if (budgetAmount === null || budgetAmount <= 0) {
    return { error: i18n("Set a budget before optimizing.", "最適化する前に予算を設定してください。") };
  }

  const original = getBudgetSelection();
  if (original.length === 0) return { error: i18n("Select at least one item first.", "先に1件以上選択してください。") };

  const originalKeys = new Set(original.map((item) => getItemKey(item)));
  const targetCount = original.length;
  const working = [...original];
  const removed = [];

  let total = sumItemPrices(working);

  if (total > budgetAmount) {
    const recommendation = getBudgetUnderRecommendation();
    if (recommendation) {
      const removeKeys = new Set(recommendation.items.map((item) => getItemKey(item)));
      for (let index = working.length - 1; index >= 0; index -= 1) {
        if (!removeKeys.has(getItemKey(working[index]))) continue;
        removed.push(working[index]);
        total -= getPrice(working[index]) ?? 0;
        working.splice(index, 1);
      }
    }
  }

  const workingKeys = new Set(working.map((item) => getItemKey(item)));
  const removedKeys = new Set(removed.map((item) => getItemKey(item)));
  const candidates = allItems
    .filter((item) => {
      const key = getItemKey(item);
      const price = getPrice(item);
      return price !== null && price > 0 && !workingKeys.has(key) && !removedKeys.has(key);
    })
    .sort(compareBudgetCandidates);

  const added = [];

  for (const candidate of candidates) {
    if (working.length >= targetCount) break;
    const price = getPrice(candidate) ?? 0;
    if (total + price > budgetAmount) continue;

    working.push(candidate);
    workingKeys.add(getItemKey(candidate));
    added.push(candidate);
    total += price;
  }

  // When the count is already satisfied, try higher-priority one-for-one upgrades
  // without changing the number of planned purchases or exceeding the budget.
  const upgradeCandidates = allItems
    .filter((item) => {
      const key = getItemKey(item);
      const price = getPrice(item);
      return price !== null && price > 0 && !workingKeys.has(key) && !removedKeys.has(key);
    })
    .sort(compareBudgetCandidates);

  const replaceable = [...working].sort((first, second) => {
    const priorityDifference = getPriorityRank(first.priority) - getPriorityRank(second.priority);
    if (priorityDifference !== 0) return priorityDifference;
    return (getPrice(second) ?? 0) - (getPrice(first) ?? 0);
  });

  for (const current of replaceable) {
    const currentRank = getPriorityRank(current.priority);
    const currentPrice = getPrice(current) ?? 0;

    const better = upgradeCandidates.find((candidate) => {
      if (workingKeys.has(getItemKey(candidate))) return false;
      if (getPriorityRank(candidate.priority) <= currentRank) return false;
      const candidatePrice = getPrice(candidate) ?? 0;
      return total - currentPrice + candidatePrice <= budgetAmount;
    });

    if (!better) continue;

    const currentIndex = working.findIndex((item) => getItemKey(item) === getItemKey(current));
    if (currentIndex === -1) continue;

    working[currentIndex] = better;
    workingKeys.delete(getItemKey(current));
    workingKeys.add(getItemKey(better));
    removed.push(current);
    added.push(better);
    total = total - currentPrice + (getPrice(better) ?? 0);
  }

  const finalKeys = working.map((item) => getItemKey(item));
  const kept = working.filter((item) => originalKeys.has(getItemKey(item)));

  return {
    items: working,
    finalKeys,
    kept,
    removed,
    added,
    total,
    remaining: budgetAmount - total,
    originalTotal: sumItemPrices(original)
  };
}

function applyBudgetKeys(keys) {
  const previousStages = new Map(budgetItemStages);
  selectedBudgetKeys.clear();
  budgetItemStages.clear();

  for (const key of keys) {
    const item = getItemByKey(key);
    if (!item || !hasPrice(item)) continue;
    selectedBudgetKeys.add(key);
    budgetItemStages.set(key, previousStages.get(key) === "later" ? "later" : "now");
  }

  budgetPlanSmartResult = null;
  renderBudgetPlanner();
  renderItems({ animateExits: false });
}

function autoFillBudgetRemaining() {
  if (budgetAmount === null) return 0;

  let remaining = budgetAmount - sumItemPrices(getBudgetSelection());
  if (remaining <= 0) return 0;

  const candidates = allItems
    .filter((item) => {
      const price = getPrice(item);
      return price !== null && price > 0 && !selectedBudgetKeys.has(getItemKey(item));
    })
    .sort(compareBudgetCandidates);

  let addedCount = 0;
  for (const item of candidates) {
    if (addedCount >= 8) break;
    const price = getPrice(item) ?? 0;
    if (price > remaining) continue;
    const key = getItemKey(item);
    selectedBudgetKeys.add(key);
    budgetItemStages.set(key, "now");
    remaining -= price;
    addedCount += 1;
  }

  if (addedCount > 0) {
    budgetPlanSmartResult = null;
    renderBudgetPlanner();
    renderItems({ animateExits: false });
  }

  return addedCount;
}

function getSavedBudgetPlans() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BUDGET_PLANS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedBudgetPlans(plans) {
  try {
    localStorage.setItem(BUDGET_PLANS_STORAGE_KEY, JSON.stringify(plans.slice(0, MAX_SAVED_BUDGET_PLANS)));
    updateSavedPlansSettingsEntry();
    if (savedPlansDialog?.open) renderSavedPlansDialog();
    return true;
  } catch {
    return false;
  }
}

function saveCurrentBudgetPlan(name) {
  const selected = getBudgetSelection();
  if (selected.length === 0) return { error: i18n("There is nothing to save yet.", "保存するアイテムがまだありません。") };

  const cleanName = String(name ?? "").trim() || `${i18n("Budget plan", "予算プラン")} ${new Date().toLocaleDateString(APP_INTL_LOCALE)}`;
  const plan = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: cleanName.slice(0, 80),
    budget: budgetAmount,
    createdAt: new Date().toISOString(),
    items: selected.map((item) => {
      const key = getItemKey(item);
      return { key, stage: getBudgetStage(key) };
    })
  };

  const plans = getSavedBudgetPlans();
  plans.unshift(plan);
  if (!writeSavedBudgetPlans(plans)) return { error: i18n("Could not save this plan on this device.", "この端末にプランを保存できませんでした。") };
  return { plan };
}

function restoreSavedBudgetPlan(planId) {
  const plan = getSavedBudgetPlans().find((candidate) => candidate.id === planId);
  if (!plan) return { error: i18n("That saved plan could not be found.", "保存済みプランが見つかりません。") };

  selectedBudgetKeys.clear();
  budgetItemStages.clear();

  let restored = 0;
  let missing = 0;
  for (const entry of Array.isArray(plan.items) ? plan.items : []) {
    const item = getItemByKey(entry.key);
    if (!item || !hasPrice(item)) {
      missing += 1;
      continue;
    }
    selectedBudgetKeys.add(entry.key);
    budgetItemStages.set(entry.key, entry.stage === "later" ? "later" : "now");
    restored += 1;
  }

  budgetAmount = parseNumber(plan.budget);
  budgetInput.value = budgetAmount === null ? "" : String(budgetAmount);
  budgetPlanSmartResult = null;
  renderBudgetPlanner();
  renderItems({ animateExits: false });

  return { restored, missing, name: plan.name };
}

function deleteSavedBudgetPlan(planId) {
  const plans = getSavedBudgetPlans();
  const next = plans.filter((plan) => plan.id !== planId);
  if (next.length === plans.length) return false;
  return writeSavedBudgetPlans(next);
}

function getSavedBudgetPlanSnapshot(plan) {
  const available = [];
  let missing = 0;

  for (const entry of Array.isArray(plan?.items) ? plan.items : []) {
    const item = getItemByKey(entry.key);
    if (!item || !hasPrice(item)) {
      missing += 1;
      continue;
    }

    available.push({
      item,
      stage: entry.stage === "later" ? "later" : "now"
    });
  }

  const now = available.filter((entry) => entry.stage === "now");
  const later = available.filter((entry) => entry.stage === "later");

  return {
    available,
    missing,
    total: sumItemPrices(available.map((entry) => entry.item)),
    nowTotal: sumItemPrices(now.map((entry) => entry.item)),
    laterTotal: sumItemPrices(later.map((entry) => entry.item)),
    nowCount: now.length,
    laterCount: later.length
  };
}

function ensurePreferencesSettingsEntry() {
  if (!settingsDialog) return null;

  let card = settingsDialog.querySelector("#preferences-settings-card");
  if (!card) {
    card = document.createElement("section");
    card.id = "preferences-settings-card";
    card.className = "settings-tool-card settings-preferences-card";
    card.innerHTML = `
      <div class="settings-tool-heading">
        <div>
          <p class="settings-tool-eyebrow">${i18n("LANGUAGE & APPEARANCE", "言語・外観")}</p>
          <h3>${i18n("Choose how the app looks and reads.", "表示と言語を選ぶ。")}</h3>
          <p>${i18n("Auto follows your device. Manual choices are saved in this browser.", "自動は端末設定に従います。手動で選んだ設定はこのブラウザに保存されます。")}</p>
        </div>
      </div>

      <div class="settings-preferences-grid">
        <div class="settings-preference-block">
          <div class="settings-preference-label">
            <span>${i18n("Language", "言語")}</span>
            <small id="settings-language-current"></small>
          </div>
          <div class="settings-segmented-control" role="group" aria-label="${i18n("Interface language", "表示言語")}">
            <button type="button" data-language-preference="auto">${i18n("Auto", "自動")}</button>
            <button type="button" data-language-preference="ja">日本語</button>
            <button type="button" data-language-preference="en">English</button>
          </div>
        </div>

        <div class="settings-preference-block">
          <div class="settings-preference-label">
            <span>${i18n("Appearance", "外観")}</span>
            <small id="settings-theme-current"></small>
          </div>
          <div class="settings-segmented-control" role="group" aria-label="${i18n("Appearance mode", "外観モード")}">
            <button type="button" data-theme-preference="auto">${i18n("Auto", "自動")}</button>
            <button type="button" data-theme-preference="light">${i18n("Light", "ライト")}</button>
            <button type="button" data-theme-preference="dark">${i18n("Dark", "ダーク")}</button>
          </div>
        </div>
      </div>
    `;

    const viewCard = settingsDialog.querySelector(".settings-view-card");
    if (viewCard) {
      viewCard.insertAdjacentElement("beforebegin", card);
    } else {
      settingsDialog.querySelector(".settings-dialog-inner")?.append(card);
    }

    card.addEventListener("click", (event) => {
      const languageButton = event.target.closest("[data-language-preference]");
      if (languageButton) {
        const preference = languageButton.dataset.languagePreference;
        if (!VALID_UI_LANGUAGE_PREFERENCES.has(preference)) return;
        if (preference === APP_LANGUAGE_PREFERENCE) return;
        if (!writeStoredUiPreference(UI_LANGUAGE_STORAGE_KEY, preference)) return;
        window.location.reload();
        return;
      }

      const themeButton = event.target.closest("[data-theme-preference]");
      if (!themeButton) return;
      const preference = themeButton.dataset.themePreference;
      if (!VALID_UI_THEME_PREFERENCES.has(preference)) return;

      appThemePreference = preference;
      writeStoredUiPreference(UI_THEME_STORAGE_KEY, preference);
      applyThemePreference();
      updatePreferencesSettingsEntry();
    });
  }

  preferencesSettingsCard = card;
  updatePreferencesSettingsEntry();
  return card;
}

function updatePreferencesSettingsEntry() {
  if (!preferencesSettingsCard?.isConnected) return;

  for (const button of preferencesSettingsCard.querySelectorAll("[data-language-preference]")) {
    const active = button.dataset.languagePreference === APP_LANGUAGE_PREFERENCE;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }

  for (const button of preferencesSettingsCard.querySelectorAll("[data-theme-preference]")) {
    const active = button.dataset.themePreference === appThemePreference;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }

  const languageCurrent = preferencesSettingsCard.querySelector("#settings-language-current");
  if (languageCurrent) {
    languageCurrent.textContent = APP_LANGUAGE_PREFERENCE === "auto"
      ? i18n(
          `Auto · ${APP_LANGUAGE === "ja" ? "日本語" : "English"}`,
          `自動 · ${APP_LANGUAGE === "ja" ? "日本語" : "English"}`
        )
      : i18n("Manual", "手動");
  }

  const themeCurrent = preferencesSettingsCard.querySelector("#settings-theme-current");
  if (themeCurrent) {
    if (appThemePreference === "auto") {
      const systemDark = SYSTEM_DARK_MODE.matches;
      themeCurrent.textContent = i18n(
        `Auto · ${systemDark ? "Dark" : "Light"}`,
        `自動 · ${systemDark ? "ダーク" : "ライト"}`
      );
    } else {
      themeCurrent.textContent = i18n("Manual", "手動");
    }
  }
}

SYSTEM_DARK_MODE.addEventListener?.("change", () => {
  if (appThemePreference === "auto") updatePreferencesSettingsEntry();
});

window.addEventListener("storage", (event) => {
  if (event.key === UI_LANGUAGE_STORAGE_KEY) {
    window.location.reload();
    return;
  }

  if (event.key === UI_THEME_STORAGE_KEY) {
    appThemePreference = readStoredUiPreference(
      UI_THEME_STORAGE_KEY,
      VALID_UI_THEME_PREFERENCES
    );
    applyThemePreference();
    updatePreferencesSettingsEntry();
  }
});

function ensureSavedPlansSettingsEntry() {
  if (!settingsDialog || !budgetModeToggle) return null;

  let card = settingsDialog.querySelector("#saved-plans-settings-card");
  if (!card) {
    card = document.createElement("section");
    card.id = "saved-plans-settings-card";
    card.className = "settings-tool-card settings-saved-plans-card";
    card.innerHTML = `
      <div class="settings-tool-heading">
        <div>
          <p class="settings-tool-eyebrow">${i18n("SAVED PLANS", "保存済みプラン")}</p>
          <h3>${i18n("Open saved purchase plans.", "保存した購入プランを見る。")}</h3>
          <p id="saved-plans-settings-count">${i18n("Saved locally on this device.", "この端末に保存されます。")}</p>
        </div>
      </div>
      <button id="saved-plans-open" class="primary-button settings-tool-primary" type="button">
        ${i18n("Open Saved Plans", "保存済みプランを開く")}
      </button>
    `;

    const budgetPlannerCard = budgetModeToggle.closest(".settings-tool-card");
    if (budgetPlannerCard) {
      budgetPlannerCard.insertAdjacentElement("afterend", card);
    } else {
      settingsDialog.querySelector(".settings-dialog-inner")?.append(card);
    }

    savedPlansSettingsButton = card.querySelector("#saved-plans-open");
    savedPlansSettingsCount = card.querySelector("#saved-plans-settings-count");
    savedPlansSettingsButton?.addEventListener("click", openSavedPlansDialog);
  } else {
    savedPlansSettingsButton = card.querySelector("#saved-plans-open");
    savedPlansSettingsCount = card.querySelector("#saved-plans-settings-count");
  }

  updateSavedPlansSettingsEntry();
  return card;
}

function updateSavedPlansSettingsEntry() {
  if (!savedPlansSettingsButton || !savedPlansSettingsCount) return;
  const count = getSavedBudgetPlans().length;
  savedPlansSettingsButton.textContent = count > 0
    ? (IS_JAPANESE ? `保存済みプランを開く (${count})` : `Open Saved Plans (${count})`)
    : i18n("Open Saved Plans", "保存済みプランを開く");
  savedPlansSettingsCount.textContent = count > 0
    ? (IS_JAPANESE ? `この端末に${count}件のプランを保存済み。` : `${count} saved ${count === 1 ? "plan" : "plans"} on this device.`)
    : i18n("No saved plans yet. Plans are stored only on this device.", "保存済みプランはまだありません。この端末内に保存されます。");
}

function buildSavedBudgetPlanSummaryText(plan) {
  const snapshot = getSavedBudgetPlanSnapshot(plan);
  const budget = parseNumber(plan?.budget);
  const lines = [plan?.name || i18n("Saved Budget Plan", "保存済み予算プラン")];

  if (budget !== null) lines.push(IS_JAPANESE ? `予算: ${formatCompactPrice(budget)}` : `Budget: ${formatCompactPrice(budget)}`);
  lines.push(IS_JAPANESE ? `アイテム: ${snapshot.available.length}件` : `Items: ${snapshot.available.length}`);
  lines.push(IS_JAPANESE ? `合計: ${formatCompactPrice(snapshot.total)}` : `Total: ${formatCompactPrice(snapshot.total)}`);
  if (budget !== null) {
    const remaining = budget - snapshot.total;
    lines.push(
      remaining >= 0
        ? (IS_JAPANESE ? `残り: ${formatCompactPrice(remaining)}` : `Remaining: ${formatCompactPrice(remaining)}`)
        : (IS_JAPANESE ? `予算超過: ${formatCompactPrice(Math.abs(remaining))}` : `Over budget: ${formatCompactPrice(Math.abs(remaining))}`)
    );
  }
  lines.push(IS_JAPANESE ? `今買う: ${formatCompactPrice(snapshot.nowTotal)} (${snapshot.nowCount}件)` : `Buy now: ${formatCompactPrice(snapshot.nowTotal)} (${snapshot.nowCount})`);
  lines.push(IS_JAPANESE ? `後で買う: ${formatCompactPrice(snapshot.laterTotal)} (${snapshot.laterCount}件)` : `Later: ${formatCompactPrice(snapshot.laterTotal)} (${snapshot.laterCount})`);
  if (snapshot.missing > 0) lines.push(IS_JAPANESE ? `利用不可: ${snapshot.missing}件` : `Unavailable: ${snapshot.missing}`);
  lines.push("");

  for (const entry of snapshot.available) {
    const item = entry.item;
    const stage = entry.stage === "later" ? i18n("Later", "後で買う") : i18n("Buy now", "今買う");
    const priority = formatPriorityLabel(item.priority) || i18n("No priority", "優先度なし");
    lines.push(`- [${stage}] ${item.title || item.asin || i18n("Amazon item", "Amazon商品")} — ${formatPrice(item.price, item.currency) || i18n("No price", "価格なし")} — ${priority} — ${item.wishlist_name || i18n("Wishlist", "欲しいものリスト")}`);
  }

  return lines.join("\n");
}

function renderSavedPlansDialog() {
  const dialog = ensureSavedPlansDialog();
  const plans = getSavedBudgetPlans();
  const count = dialog.querySelector("#saved-plans-count");
  const list = dialog.querySelector("#saved-plans-list");

  if (count) {
    count.textContent = plans.length > 0
      ? (IS_JAPANESE ? `${plans.length}件のプラン · この端末に保存` : `${plans.length} saved ${plans.length === 1 ? "plan" : "plans"} · stored on this device`)
      : i18n("No saved plans yet · stored on this device", "保存済みプランはまだありません · この端末に保存");
  }

  if (!list) return;

  list.innerHTML = plans.map((plan) => {
    const snapshot = getSavedBudgetPlanSnapshot(plan);
    const budget = parseNumber(plan.budget);
    const created = plan.createdAt ? formatDateTime(plan.createdAt) : i18n("Saved plan", "保存済みプラン");
    const itemRows = snapshot.available.map(({ item, stage }) => `
      <div class="saved-plan-item-row">
        <span class="saved-plan-stage ${stage}">${stage === "later" ? i18n("Later", "後で買う") : i18n("Buy now", "今買う")}</span>
        <div>
          <strong>${escapeHtml(item.title || item.asin || i18n("Amazon item", "Amazon商品"))}</strong>
          <small>${formatPrice(item.price, item.currency) || i18n("Price unavailable", "価格情報なし")} · ${escapeHtml(item.wishlist_name || i18n("Wishlist", "欲しいものリスト"))}</small>
        </div>
      </div>
    `).join("");

    return `
      <article class="saved-plan-card" data-plan-id="${escapeHtml(plan.id)}">
        <div class="saved-plan-card-head">
          <div>
            <strong>${escapeHtml(plan.name || i18n("Saved plan", "保存済みプラン"))}</strong>
            <small>${escapeHtml(created)}</small>
          </div>
          <span>${formatUiItemCount(snapshot.available.length)}</span>
        </div>

        <div class="saved-plan-card-metrics">
          <div><span>${i18n("Total", "合計")}</span><strong>${formatCompactPrice(snapshot.total)}</strong></div>
          <div><span>${i18n("Budget", "予算")}</span><strong>${budget === null ? "—" : formatCompactPrice(budget)}</strong></div>
          <div><span>${i18n("Buy now", "今買う")}</span><strong>${snapshot.nowCount}</strong></div>
          <div><span>${i18n("Later", "後で買う")}</span><strong>${snapshot.laterCount}</strong></div>
        </div>

        ${snapshot.missing > 0 ? `<p class="saved-plan-missing">${IS_JAPANESE ? `保存時のアイテム${snapshot.missing}件は現在利用できません。` : `${snapshot.missing} saved ${snapshot.missing === 1 ? "item is" : "items are"} no longer available.`}</p>` : ""}

        <details class="saved-plan-details">
          <summary>${i18n("View items", "アイテムを見る")}</summary>
          <div class="saved-plan-item-list">${itemRows || `<p class="budget-plan-empty">${i18n("No available items in this plan.", "このプランで利用できるアイテムはありません。")}</p>`}</div>
        </details>

        <div class="saved-plan-actions">
          <button type="button" class="primary saved-plan-open-button" data-saved-plan-action="open" data-plan-id="${escapeHtml(plan.id)}"><span>${i18n("Open plan", "プランを開く")}</span><span aria-hidden="true">→</span></button>
          <button type="button" data-saved-plan-action="copy" data-plan-id="${escapeHtml(plan.id)}">${i18n("Copy", "コピー")}</button>
          <button type="button" class="danger" data-saved-plan-action="delete" data-plan-id="${escapeHtml(plan.id)}">${i18n("Delete", "削除")}</button>
        </div>
      </article>
    `;
  }).join("") || `
    <div class="saved-plans-empty">
      <strong>${i18n("No saved plans yet.", "保存済みプランはまだありません。")}</strong>
      <p>${i18n("Build a Purchase Plan once and save it. It will appear here automatically.", "購入プランを作って保存すると、ここに表示されます。")}</p>
    </div>
  `;
}

function ensureActionConfirmDialog() {
  if (actionConfirmDialog?.isConnected) return actionConfirmDialog;

  actionConfirmDialog = document.createElement("dialog");
  actionConfirmDialog.id = "action-confirm-dialog";
  actionConfirmDialog.className = "app-dialog action-confirm-dialog";
  actionConfirmDialog.setAttribute("aria-labelledby", "action-confirm-title");
  actionConfirmDialog.setAttribute("aria-describedby", "action-confirm-message");
  actionConfirmDialog.innerHTML = `
    <div class="dialog-inner action-confirm-inner">
      <span class="eyebrow">${i18n("CONFIRM ACTION", "操作の確認")}</span>
      <h2 id="action-confirm-title">${i18n("Are you sure?", "本当に実行しますか？")}</h2>
      <p id="action-confirm-message"></p>
      <div class="action-confirm-actions">
        <button type="button" data-confirm-action="cancel">${i18n("Cancel", "キャンセル")}</button>
        <button type="button" class="danger" data-confirm-action="confirm">${i18n("Confirm", "実行")}</button>
      </div>
    </div>
  `;

  const settle = (confirmed) => {
    if (!actionConfirmDialog?.open) {
      const resolver = actionConfirmResolver;
      actionConfirmResolver = null;
      if (resolver) resolver(Boolean(confirmed));
      return;
    }

    const resolver = actionConfirmResolver;
    actionConfirmResolver = null;
    closeDialogAnimated(actionConfirmDialog, () => {
      if (resolver) resolver(Boolean(confirmed));
    });
  };

  actionConfirmDialog.addEventListener("click", (event) => {
    if (event.target === actionConfirmDialog) {
      settle(false);
      return;
    }

    const button = event.target.closest("[data-confirm-action]");
    if (!button) return;
    settle(button.dataset.confirmAction === "confirm");
  });

  actionConfirmDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    settle(false);
  });

  document.body.append(actionConfirmDialog);
  return actionConfirmDialog;
}

function showActionConfirm({ title, message, confirmLabel, tone = "danger" }) {
  const dialog = ensureActionConfirmDialog();
  if (dialog.open || actionConfirmResolver) return Promise.resolve(false);

  const titleElement = dialog.querySelector("#action-confirm-title");
  const messageElement = dialog.querySelector("#action-confirm-message");
  const confirmButton = dialog.querySelector('[data-confirm-action="confirm"]');

  if (titleElement) titleElement.textContent = title || i18n("Are you sure?", "本当に実行しますか？");
  if (messageElement) messageElement.textContent = message || i18n("This action cannot be undone.", "この操作は元に戻せません。");
  if (confirmButton) {
    confirmButton.textContent = confirmLabel || i18n("Confirm", "実行");
    confirmButton.classList.toggle("danger", tone === "danger");
  }

  return new Promise((resolve) => {
    actionConfirmResolver = resolve;
    openDialogAnimated(dialog);
  });
}

function ensureSavedPlansDialog() {
  if (savedPlansDialog?.isConnected) return savedPlansDialog;

  savedPlansDialog = document.createElement("dialog");
  savedPlansDialog.id = "saved-plans-dialog";
  savedPlansDialog.className = "app-dialog saved-plans-dialog";
  savedPlansDialog.innerHTML = `
    <div class="dialog-inner saved-plans-inner">
      <header class="saved-plans-header">
        <div>
          <span class="eyebrow">${i18n("SAVED PLANS", "保存済みプラン")}</span>
          <h2>${i18n("Purchase plans", "購入プラン")}</h2>
          <p id="saved-plans-count">${i18n("Stored on this device", "この端末に保存")}</p>
        </div>
        <button type="button" class="dialog-close" data-saved-plan-action="close" aria-label="${i18n("Close saved plans", "保存済みプランを閉じる")}">×</button>
      </header>
      <div id="saved-plans-notice" class="budget-plan-notice" hidden></div>
      <div id="saved-plans-list" class="saved-plans-list"></div>
    </div>
  `;

  savedPlansDialog.addEventListener("click", async (event) => {
    if (event.target === savedPlansDialog) {
      closeSavedPlansDialog();
      return;
    }

    const button = event.target.closest("[data-saved-plan-action]");
    if (!button) return;

    const action = button.dataset.savedPlanAction;
    const planId = button.dataset.planId;

    if (action === "close") {
      closeSavedPlansDialog();
      return;
    }

    if (action === "open" && planId) {
      const result = restoreSavedBudgetPlan(planId);
      if (result.error) {
        showSavedPlansNotice(result.error, "warning");
        return;
      }

      closeSavedPlansDialog(() => {
        budgetPlanActiveTab = "summary";
        openBudgetPlanDialog();
        showBudgetPlanNotice(
          result.missing > 0
            ? (IS_JAPANESE ? `「${result.name}」から${result.restored}件読み込みました。${result.missing}件は現在利用できません。` : `Loaded ${result.restored} items from “${result.name}”; ${result.missing} are no longer available.`)
            : (IS_JAPANESE ? `「${result.name}」を読み込みました。` : `Loaded “${result.name}”.`),
          result.missing > 0 ? "warning" : "success"
        );
      });
      return;
    }

    if (action === "copy" && planId) {
      const plan = getSavedBudgetPlans().find((candidate) => candidate.id === planId);
      if (!plan) {
        showSavedPlansNotice(i18n("That saved plan could not be found.", "保存済みプランが見つかりません。"), "warning");
        return;
      }

      const original = button.textContent;
      const copied = await copyTextToClipboard(buildSavedBudgetPlanSummaryText(plan), savedPlansDialog);
      button.textContent = copied ? i18n("Copied ✓", "コピーしました ✓") : i18n("Copy failed", "コピー失敗");
      button.classList.toggle("copy-success", copied);
      showSavedPlansNotice(copied ? (IS_JAPANESE ? `「${plan.name || "保存済みプラン"}」をコピーしました。` : `Copied “${plan.name || "Saved plan"}”.`) : i18n("Could not copy this plan.", "このプランをコピーできませんでした。"), copied ? "success" : "warning");
      window.setTimeout(() => {
        if (!button.isConnected) return;
        button.textContent = original;
        button.classList.remove("copy-success");
      }, 1400);
      return;
    }

    if (action === "delete" && planId) {
      const plan = getSavedBudgetPlans().find((candidate) => candidate.id === planId);
      const confirmed = await showActionConfirm({
        title: i18n("Delete saved plan?", "保存済みプランを削除？"),
        message: IS_JAPANESE ? `「${plan?.name || "保存済みプラン"}」をこのブラウザから削除します。欲しいものリストのアイテム自体には影響しません。` : `“${plan?.name || "Saved plan"}” will be removed from this browser. Your wishlist items are not affected.`,
        confirmLabel: i18n("Delete plan", "プランを削除")
      });
      if (!confirmed) return;

      if (deleteSavedBudgetPlan(planId)) {
        renderSavedPlansDialog();
        showSavedPlansNotice(i18n("Saved plan deleted.", "保存済みプランを削除しました。"), "neutral");
      }
    }
  });

  savedPlansDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeSavedPlansDialog();
  });

  document.body.append(savedPlansDialog);
  return savedPlansDialog;
}

function showSavedPlansNotice(message, tone = "neutral") {
  const dialog = ensureSavedPlansDialog();
  const notice = dialog.querySelector("#saved-plans-notice");
  if (!notice) return;

  if (savedPlansNoticeTimer) window.clearTimeout(savedPlansNoticeTimer);
  notice.hidden = false;
  notice.className = `budget-plan-notice ${tone}`;
  notice.textContent = message;

  savedPlansNoticeTimer = window.setTimeout(() => {
    notice.hidden = true;
    savedPlansNoticeTimer = null;
  }, 2400);
}

function openSavedPlansDialog() {
  const dialog = ensureSavedPlansDialog();
  renderSavedPlansDialog();
  const inner = dialog.querySelector(".saved-plans-inner");
  if (inner) inner.scrollTop = 0;

  if (settingsDialog.open) {
    closeDialogAnimated(settingsDialog, () => openDialogAnimated(dialog));
  } else {
    openDialogAnimated(dialog);
  }
}

function closeSavedPlansDialog(afterClose = null) {
  if (!savedPlansDialog) {
    if (afterClose) afterClose();
    return;
  }
  closeDialogAnimated(savedPlansDialog, afterClose);
}

function formatBudgetChange(item) {
  const info = getPriceHistoryInfo(item);
  if (info.change === null || info.change === 0) return "—";
  const sign = info.change < 0 ? "↓" : "↑";
  return `${sign} ${formatCompactPrice(Math.abs(info.change))}`;
}

function createBudgetPlanItemHtml(item, { compact = false, action = "selected" } = {}) {
  const key = getItemKey(item);
  const title = escapeHtml(item.title || item.asin || i18n("Amazon item", "Amazon商品"));
  const wishlist = escapeHtml(item.wishlist_name || i18n("Wishlist", "欲しいものリスト"));
  const priority = normalizePriority(item.priority);
  const stage = getBudgetStage(key);
  const image = item.image_url
    ? `<img src="${escapeHtml(item.image_url)}" alt="" loading="lazy" decoding="async">`
    : `<span>${escapeHtml(getInitials(item.title))}</span>`;

  let controls = "";
  if (action === "selected") {
    controls = `
      <div class="budget-plan-stage-control" role="group" aria-label="${IS_JAPANESE ? `${title}の購入タイミング` : `Purchase timing for ${title}`}">
        <button
          class="budget-plan-stage-option${stage === "now" ? " active" : ""}"
          type="button"
          data-budget-action="set-stage"
          data-stage="now"
          data-key="${escapeHtml(key)}"
          aria-pressed="${stage === "now"}"
        >${i18n("Buy now", "今買う")}</button>
        <button
          class="budget-plan-stage-option${stage === "later" ? " active" : ""}"
          type="button"
          data-budget-action="set-stage"
          data-stage="later"
          data-key="${escapeHtml(key)}"
          aria-pressed="${stage === "later"}"
        >${i18n("Later", "後で買う")}</button>
      </div>
      <button class="budget-plan-remove" type="button" data-budget-action="remove-item" data-key="${escapeHtml(key)}" aria-label="${IS_JAPANESE ? `${title}を削除` : `Remove ${title}`}">×</button>
    `;
  } else if (action === "add") {
    controls = `<button class="budget-plan-add" type="button" data-budget-action="add-item" data-key="${escapeHtml(key)}">${i18n("+ Add", "+ 追加")}</button>`;
  }

  return `
    <div class="budget-plan-item${compact ? " compact" : ""}" data-key="${escapeHtml(key)}">
      <div class="budget-plan-item-visual">${image}</div>
      <div class="budget-plan-item-copy">
        <div class="budget-plan-item-meta">
          <span>${wishlist}</span>
          <span class="budget-plan-priority priority-${priority}">${priority === "none" ? i18n("No priority", "優先度なし") : formatPriorityName(priority)}</span>
        </div>
        <strong>${title}</strong>
        <small>${formatPrice(item.price, item.currency) || i18n("Price unavailable", "価格情報なし")}${getPriceHistoryInfo(item).isLowest ? i18n(" · Lowest", " · 最安値") : ""}</small>
      </div>
      <div class="budget-plan-item-controls">${controls}</div>
    </div>
  `;
}

function renderBudgetSmartResultHtml() {
  const result = budgetPlanSmartResult;
  if (!result) return "";

  if (result.kind === "fill") {
    const suggestions = getBudgetFillSuggestions();
    if (suggestions.length === 0) {
      return `
        <section class="budget-plan-smart-result">
          <div class="budget-plan-section-heading"><div><span>${i18n("SMART RESULT", "自動提案")}</span><h3>${i18n("Fill remaining", "残り予算で追加")}</h3></div></div>
          <p class="budget-plan-empty">${i18n("No additional priced item fits the remaining budget right now.", "残り予算に収まる価格付きアイテムはありません。")}</p>
        </section>
      `;
    }

    return `
      <section class="budget-plan-smart-result">
        <div class="budget-plan-section-heading">
          <div><span>${i18n("SMART RESULT", "自動提案")}</span><h3>${i18n("Best fits for the remaining budget", "残り予算に合う候補")}</h3></div>
          <button type="button" class="budget-plan-inline-button" data-budget-action="auto-fill">${i18n("Auto fill", "自動で追加")}</button>
        </div>
        <div class="budget-plan-suggestion-list">
          ${suggestions.map((item) => createBudgetPlanItemHtml(item, { compact: true, action: "add" })).join("")}
        </div>
      </section>
    `;
  }

  if (result.kind === "under") {
    const recommendation = getBudgetUnderRecommendation();
    if (!recommendation) {
      return `
        <section class="budget-plan-smart-result">
          <div class="budget-plan-section-heading"><div><span>${i18n("SMART RESULT", "自動提案")}</span><h3>${i18n("Get under budget", "予算内に収める")}</h3></div></div>
          <p class="budget-plan-empty">${i18n("This plan is already within budget.", "このプランはすでに予算内です。")}</p>
        </section>
      `;
    }

    return `
      <section class="budget-plan-smart-result danger-soft">
        <div class="budget-plan-section-heading">
          <div><span>${i18n("SMART RESULT", "自動提案")}</span><h3>${IS_JAPANESE ? `${recommendation.items.length}件外す` : `Remove ${recommendation.items.length} ${recommendation.items.length === 1 ? "item" : "items"}`}</h3></div>
          <button type="button" class="budget-plan-inline-button" data-budget-action="apply-under">${i18n("Apply", "適用")}</button>
        </div>
        <p class="budget-plan-smart-copy">
          ${IS_JAPANESE
            ? `${formatCompactPrice(recommendation.saved)}分を外し、残り${formatCompactPrice(recommendation.remaining)}にします。優先度の低いアイテムから外します。`
            : `Saves ${formatCompactPrice(recommendation.saved)} and leaves ${formatCompactPrice(recommendation.remaining)} available, while removing lower-priority items first.`}
        </p>
        <div class="budget-plan-suggestion-list">
          ${recommendation.items.map((item) => createBudgetPlanItemHtml(item, { compact: true, action: "none" })).join("")}
        </div>
      </section>
    `;
  }

  if (result.kind === "optimize") {
    const optimized = buildOptimizedBudgetPlan();
    if (optimized.error) {
      return `
        <section class="budget-plan-smart-result">
          <div class="budget-plan-section-heading"><div><span>${i18n("SMART RESULT", "自動提案")}</span><h3>${i18n("Optimize", "最適化")}</h3></div></div>
          <p class="budget-plan-empty">${escapeHtml(optimized.error)}</p>
        </section>
      `;
    }

    const removed = optimized.removed.filter(
      (item, index, array) => array.findIndex((other) => getItemKey(other) === getItemKey(item)) === index
    );
    const added = optimized.added.filter(
      (item, index, array) => array.findIndex((other) => getItemKey(other) === getItemKey(item)) === index
    );

    return `
      <section class="budget-plan-smart-result optimize-result">
        <div class="budget-plan-section-heading">
          <div><span>${i18n("SMART RESULT", "自動提案")}</span><h3>${i18n("Optimized plan", "最適化プラン")}</h3></div>
          <button type="button" class="budget-plan-inline-button primary" data-budget-action="apply-optimize">${i18n("Apply optimized plan", "最適化プランを適用")}</button>
        </div>
        <div class="budget-plan-optimization-stats">
          <span><strong>${formatCompactPrice(optimized.total)}</strong> ${i18n("final total", "合計")}</span>
          <span><strong>${formatCompactPrice(optimized.remaining)}</strong> ${i18n("remaining", "残り")}</span>
          <span><strong>${optimized.kept.length}</strong> ${i18n("kept", "維持")}</span>
          <span><strong>${added.length}</strong> ${i18n("added", "追加")}</span>
        </div>
        ${removed.length > 0 ? `<p class="budget-plan-smart-copy">${i18n("Remove:", "外す:")} ${removed.map((item) => escapeHtml(item.title || item.asin)).join(" · ")}</p>` : ""}
        ${added.length > 0 ? `<p class="budget-plan-smart-copy">${i18n("Add:", "追加:")} ${added.map((item) => escapeHtml(item.title || item.asin)).join(" · ")}</p>` : ""}
      </section>
    `;
  }

  return "";
}

function renderBudgetSummaryTab(selected) {
  const totals = getBudgetPlanTotals(selected);
  const counts = getBudgetPriorityCounts(selected);
  const wishlists = getBudgetWishlistBreakdown(selected);
  const isOver = totals.remaining !== null && totals.remaining < 0;

  return `
    <div class="budget-plan-summary-tab">
      <section class="budget-plan-smart-actions">
        <div class="budget-plan-section-heading">
          <div><span>${i18n("SMART ACTIONS", "スマート操作")}</span><h3>${i18n("Make the selection useful", "選択を活用する")}</h3></div>
        </div>
        <div class="budget-plan-action-grid">
          <button type="button" data-budget-action="show-fill" ${budgetAmount === null || (totals.remaining ?? 0) <= 0 ? "disabled" : ""}>
            <span>＋</span><strong>${i18n("Fill remaining", "残り予算で追加")}</strong><small>${i18n("Find items that fit", "予算に収まる商品を探す")}</small>
          </button>
          <button type="button" data-budget-action="show-under" ${!isOver ? "disabled" : ""}>
            <span>−</span><strong>${i18n("Get under budget", "予算内に収める")}</strong><small>${i18n("Remove lower priority first", "優先度の低いものから外す")}</small>
          </button>
          <button type="button" data-budget-action="show-optimize" ${budgetAmount === null || selected.length === 0 ? "disabled" : ""}>
            <span>↗</span><strong>${i18n("Optimize", "最適化")}</strong><small>${i18n("Keep priority, improve fit", "優先度を保って調整")}</small>
          </button>
        </div>
      </section>

      ${renderBudgetSmartResultHtml()}

      <section class="budget-plan-split-section">
        <div class="budget-plan-section-heading">
          <div><span>${i18n("SHOPPING PLAN", "購入計画")}</span><h3>${i18n("Buy now vs later", "今買う / 後で買う")}</h3></div>
        </div>
        <div class="budget-plan-split-grid">
          <div><span>${i18n("Buy now", "今買う")}</span><strong>${formatCompactPrice(totals.nowTotal)}</strong><small>${formatUiItemCount(totals.nowItems.length)}</small></div>
          <div><span>${i18n("Later", "後で買う")}</span><strong>${formatCompactPrice(totals.laterTotal)}</strong><small>${formatUiItemCount(totals.laterItems.length)}</small></div>
        </div>
      </section>

      <section class="budget-plan-breakdown-section">
        <div class="budget-plan-section-heading">
          <div><span>${i18n("BREAKDOWN", "内訳")}</span><h3>${i18n("Priority and wishlists", "優先度とリスト")}</h3></div>
        </div>
        <div class="budget-plan-priority-breakdown">
          <span class="high"><strong>${counts.high}</strong> ${i18n("High", "高")}</span>
          <span class="medium"><strong>${counts.medium}</strong> ${i18n("Medium", "中")}</span>
          <span class="low"><strong>${counts.low}</strong> ${i18n("Low", "低")}</span>
          <span><strong>${counts.none}</strong> ${i18n("None", "なし")}</span>
        </div>
        <div class="budget-plan-wishlist-breakdown">
          ${wishlists.map((entry) => `<div><span>${escapeHtml(entry.name)} · ${entry.count}</span><strong>${formatCompactPrice(entry.total)}</strong></div>`).join("") || `<p class="budget-plan-empty">${i18n("No selected items yet.", "まだ選択されていません。")}</p>`}
        </div>
      </section>

      <section class="budget-plan-selected-section">
        <div class="budget-plan-section-heading">
          <div><span>${i18n("SELECTED ITEMS", "選択中のアイテム")}</span><h3>${IS_JAPANESE ? `${selected.length}件` : `${selected.length} planned`}</h3></div>
        </div>
        <div class="budget-plan-selected-list">
          ${selected.map((item) => createBudgetPlanItemHtml(item)).join("") || `<p class="budget-plan-empty">${i18n("Select items to build a plan.", "アイテムを選んでプランを作成してください。")}</p>`}
        </div>
      </section>
    </div>
  `;
}

function renderBudgetCompareTab(selected) {
  if (selected.length === 0) return `<p class="budget-plan-empty large">${i18n("Select items before comparing them.", "比較する前にアイテムを選択してください。")}</p>`;

  const prices = selected.map((item) => getPrice(item) ?? 0);
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);

  const comparisonItems = [...selected]
    .sort((first, second) => (getPrice(second) ?? 0) - (getPrice(first) ?? 0))
    .map((item) => {
      const price = getPrice(item) ?? 0;
      const historyInfo = getPriceHistoryInfo(item);
      const badges = [
        price === maximum ? i18n("Highest", "最高額") : "",
        price === minimum ? i18n("Lowest", "最安額") : "",
        historyInfo.isLowest ? i18n("Price low", "価格最安") : ""
      ].filter(Boolean);
      const stage = getBudgetStage(getItemKey(item)) === "later" ? i18n("Later", "後で買う") : i18n("Buy now", "今買う");
      const changeClass = historyInfo.change < 0
        ? "price-drop"
        : historyInfo.change > 0
          ? "price-rise"
          : "";
      const title = escapeHtml(item.title || item.asin || i18n("Amazon item", "Amazon商品"));
      const asin = escapeHtml(item.asin || "");
      const priceText = formatPrice(item.price, item.currency) || "—";
      const changeText = formatBudgetChange(item);
      const priority = escapeHtml(formatPriorityLabel(item.priority) || i18n("None", "なし"));
      const wishlist = escapeHtml(item.wishlist_name || i18n("Wishlist", "欲しいものリスト"));
      const checked = escapeHtml(formatRelativeChecked(item.last_checked_at ?? item.price_updated_at ?? item.created_at));
      const badgeText = badges.length ? ` · ${badges.join(" · ")}` : "";

      return {
        table: `
          <tr>
            <td>
              <strong>${title}</strong>
              <small>${asin}${badgeText}</small>
            </td>
            <td>${priceText}</td>
            <td class="${changeClass}">${changeText}</td>
            <td>${priority}</td>
            <td>${wishlist}</td>
            <td>${stage}</td>
            <td>${checked}</td>
          </tr>
        `,
        card: `
          <article class="budget-plan-compare-card">
            <div class="budget-plan-compare-card-title">
              <strong>${title}</strong>
              <small>${asin}${badgeText}</small>
            </div>
            <dl class="budget-plan-compare-card-grid">
              <div><dt>${i18n("Price", "価格")}</dt><dd>${priceText}</dd></div>
              <div><dt>${i18n("Change", "変動")}</dt><dd class="${changeClass}">${changeText}</dd></div>
              <div><dt>${i18n("Priority", "優先度")}</dt><dd>${priority}</dd></div>
              <div><dt>${i18n("Plan", "プラン")}</dt><dd>${stage}</dd></div>
              <div class="wide"><dt>${i18n("Wishlist", "欲しいものリスト")}</dt><dd>${wishlist}</dd></div>
              <div class="wide"><dt>${i18n("Checked", "確認")}</dt><dd>${checked}</dd></div>
            </dl>
          </article>
        `
      };
    });

  return `
    <section class="budget-plan-compare-section">
      <div class="budget-plan-section-heading">
        <div><span>${i18n("COMPARE", "比較")}</span><h3>${i18n("Selected items side by side", "選択アイテムを比較")}</h3></div>
      </div>
      <div class="budget-plan-compare-scroll">
        <table class="budget-plan-compare-table">
          <thead><tr><th>${i18n("Item", "商品")}</th><th>${i18n("Price", "価格")}</th><th>${i18n("Change", "変動")}</th><th>${i18n("Priority", "優先度")}</th><th>${i18n("Wishlist", "欲しいものリスト")}</th><th>${i18n("Plan", "プラン")}</th><th>${i18n("Checked", "確認")}</th></tr></thead>
          <tbody>${comparisonItems.map((item) => item.table).join("")}</tbody>
        </table>
      </div>
      <div class="budget-plan-compare-cards">
        ${comparisonItems.map((item) => item.card).join("")}
      </div>
    </section>
  `;
}

function renderBudgetSavedTab() {
  const plans = getSavedBudgetPlans();
  const defaultName = `${i18n("Plan", "プラン")} ${new Date().toLocaleDateString(APP_INTL_LOCALE)}`;

  return `
    <section class="budget-plan-save-section">
      <div class="budget-plan-section-heading">
        <div><span>${i18n("SAVE PLAN", "プランを保存")}</span><h3>${i18n("Keep this selection on this device", "この端末に選択を保存")}</h3></div>
      </div>
      <div class="budget-plan-save-form">
        <input id="budget-plan-name" type="text" maxlength="80" value="${escapeHtml(defaultName)}" aria-label="${i18n("Plan name", "プラン名")}">
        <button type="button" data-budget-action="save-plan">${i18n("Save current", "現在のプランを保存")}</button>
      </div>
      <p class="budget-plan-local-note">${i18n("Saved locally in this browser. No D1 or sync token is used.", "このブラウザ内に保存されます。D1や同期トークンは使用しません。")}</p>
    </section>

    <section class="budget-plan-saved-list-section">
      <div class="budget-plan-section-heading">
        <div><span>${i18n("SAVED", "保存済み")}</span><h3>${formatUiPlanCount(plans.length)}</h3></div>
      </div>
      <div class="budget-plan-saved-list">
        ${plans.map((plan) => {
          const keys = (Array.isArray(plan.items) ? plan.items : []).map((entry) => entry.key);
          const availableItems = keys.map(getItemByKey).filter((item) => item && hasPrice(item));
          const total = sumItemPrices(availableItems);
          return `
            <div class="budget-plan-saved-card">
              <div><strong>${escapeHtml(plan.name || i18n("Saved plan", "保存済みプラン"))}</strong><small>${IS_JAPANESE ? `${availableItems.length}件 · ${formatCompactPrice(total)}${plan.budget !== null && plan.budget !== undefined ? ` / ${formatCompactPrice(plan.budget)}` : ""}` : `${availableItems.length} items · ${formatCompactPrice(total)}${plan.budget !== null && plan.budget !== undefined ? ` of ${formatCompactPrice(plan.budget)}` : ""}`}</small></div>
              <div class="budget-plan-saved-actions">
                <button type="button" data-budget-action="load-plan" data-plan-id="${escapeHtml(plan.id)}">${i18n("Load", "読み込む")}</button>
                <button type="button" class="danger" data-budget-action="delete-plan" data-plan-id="${escapeHtml(plan.id)}">${i18n("Delete", "削除")}</button>
              </div>
            </div>
          `;
        }).join("") || `<p class="budget-plan-empty">${i18n("No saved plans yet.", "保存済みプランはまだありません。")}</p>`}
      </div>
    </section>
  `;
}

function ensureBudgetPlanDialog() {
  if (budgetPlanDialog?.isConnected) return budgetPlanDialog;

  budgetPlanDialog = document.createElement("dialog");
  budgetPlanDialog.id = "budget-plan-dialog";
  budgetPlanDialog.className = "app-dialog budget-plan-dialog";
  budgetPlanDialog.innerHTML = `
    <div class="dialog-inner budget-plan-inner">
      <header class="budget-plan-header">
        <div><span class="eyebrow">${i18n("BUDGET PLAN", "予算プラン")}</span><h2>${i18n("Purchase plan", "購入プラン")}</h2></div>
        <button type="button" class="dialog-close" data-budget-action="close-plan" aria-label="${i18n("Close budget plan", "予算プランを閉じる")}">×</button>
      </header>

      <section class="budget-plan-hero">
        <div class="budget-plan-hero-copy">
          <span>${i18n("Selected total", "選択合計")}</span>
          <strong id="budget-plan-total">¥0</strong>
          <small id="budget-plan-budget-status">${i18n("Set a budget to unlock optimization", "予算を設定すると最適化を使えます")}</small>
        </div>
        <div class="budget-plan-hero-progress"><span id="budget-plan-hero-progress"></span></div>
        <div class="budget-plan-metrics">
          <div><span>${i18n("Selected", "選択")}</span><strong id="budget-plan-count">0</strong></div>
          <div><span>${i18n("Remaining", "残り")}</span><strong id="budget-plan-remaining">—</strong></div>
          <div><span>${i18n("Average", "平均")}</span><strong id="budget-plan-average">—</strong></div>
          <div><span>${i18n("Buy now", "今買う")}</span><strong id="budget-plan-now-total">¥0</strong></div>
        </div>
      </section>

      <nav class="budget-plan-tabs" aria-label="${i18n("Budget plan sections", "予算プランのセクション")}">
        <button type="button" data-budget-tab="summary" class="active">${i18n("Summary", "概要")}</button>
        <button type="button" data-budget-tab="compare">${i18n("Compare", "比較")}</button>
        <button type="button" data-budget-tab="saved">${i18n("Saved", "保存済み")}</button>
      </nav>

      <div id="budget-plan-notice" class="budget-plan-notice" hidden></div>
      <div id="budget-plan-content" class="budget-plan-content"></div>

      <footer class="budget-plan-footer">
        <button type="button" data-budget-action="edit-selection">${i18n("Edit selection", "選択を編集")}</button>
        <button type="button" data-budget-action="copy-summary">${i18n("Copy summary", "概要をコピー")}</button>
        <button type="button" class="danger" data-budget-action="clear-selection">${i18n("Clear selection", "選択をクリア")}</button>
      </footer>
    </div>
  `;

  budgetPlanContent = budgetPlanDialog.querySelector("#budget-plan-content");

  budgetPlanDialog.addEventListener("click", async (event) => {
    if (event.target === budgetPlanDialog) {
      closeBudgetPlanDialog();
      return;
    }

    const tab = event.target.closest("[data-budget-tab]");
    if (tab) {
      budgetPlanActiveTab = tab.dataset.budgetTab;
      budgetPlanSmartResult = null;
      renderBudgetPlanDialog();
      requestAnimationFrame(() => {
        const inner = budgetPlanDialog?.querySelector(".budget-plan-inner");
        if (inner) inner.scrollTop = 0;
      });
      return;
    }

    const button = event.target.closest("[data-budget-action]");
    if (!button) return;

    const action = button.dataset.budgetAction;
    const key = button.dataset.key;

    if (action === "close-plan") {
      closeBudgetPlanDialog();
      return;
    }

    if (action === "edit-selection") {
      closeBudgetPlanDialog(() => setBudgetMode(true));
      return;
    }

    if (action === "remove-item" && key) {
      selectedBudgetKeys.delete(key);
      budgetItemStages.delete(key);
      budgetPlanSmartResult = null;
      renderBudgetPlanner();
      renderItems({ animateExits: false });
      renderBudgetPlanDialog();
      return;
    }

    if (action === "set-stage" && key) {
      const nextStage = button.dataset.stage === "later" ? "later" : "now";
      setBudgetStage(key, nextStage);
      renderBudgetPlanner();
      renderBudgetPlanDialog();
      return;
    }

    if (action === "add-item" && key) {
      const item = getItemByKey(key);
      const totals = getBudgetPlanTotals();
      const price = getPrice(item);
      if (!item || price === null) return;
      if (budgetAmount !== null && totals.total + price > budgetAmount) {
        showBudgetPlanNotice(i18n("That item would put the plan over budget.", "そのアイテムを追加すると予算を超えます。"), "warning");
        return;
      }
      selectedBudgetKeys.add(key);
      budgetItemStages.set(key, "now");
      budgetPlanSmartResult = { kind: "fill" };
      renderBudgetPlanner();
      renderItems({ animateExits: false });
      renderBudgetPlanDialog();
      return;
    }

    if (action === "show-fill") {
      budgetPlanSmartResult = { kind: "fill" };
      renderBudgetPlanDialog();
      return;
    }

    if (action === "auto-fill") {
      const count = autoFillBudgetRemaining();
      renderBudgetPlanDialog();
      showBudgetPlanNotice(count > 0 ? (IS_JAPANESE ? `${count}件追加しました。` : `Added ${count} ${count === 1 ? "item" : "items"}.`) : i18n("Nothing else fits the remaining budget.", "残り予算に収まるアイテムはありません。"), count > 0 ? "success" : "neutral");
      return;
    }

    if (action === "show-under") {
      budgetPlanSmartResult = { kind: "under" };
      renderBudgetPlanDialog();
      return;
    }

    if (action === "apply-under") {
      const recommendation = getBudgetUnderRecommendation();
      if (!recommendation) return;
      const removeKeys = new Set(recommendation.items.map((item) => getItemKey(item)));
      applyBudgetKeys(getBudgetSelection().filter((item) => !removeKeys.has(getItemKey(item))).map(getItemKey));
      renderBudgetPlanDialog();
      showBudgetPlanNotice(i18n("Lower-priority items were removed to bring the plan within budget.", "優先度の低いアイテムを外して予算内に収めました。"), "success");
      return;
    }

    if (action === "show-optimize") {
      budgetPlanSmartResult = { kind: "optimize" };
      renderBudgetPlanDialog();
      return;
    }

    if (action === "apply-optimize") {
      const optimized = buildOptimizedBudgetPlan();
      if (optimized.error) {
        showBudgetPlanNotice(optimized.error, "warning");
        return;
      }
      applyBudgetKeys(optimized.finalKeys);
      renderBudgetPlanDialog();
      showBudgetPlanNotice(i18n("Optimized plan applied.", "最適化プランを適用しました。"), "success");
      return;
    }

    if (action === "copy-summary") {
      const originalLabel = button.textContent;
      const copied = await copyBudgetPlanSummary();
      button.textContent = copied ? i18n("Copied ✓", "コピーしました ✓") : i18n("Copy failed", "コピー失敗");
      button.classList.toggle("copy-success", copied);
      showBudgetPlanNotice(copied ? i18n("Budget summary copied.", "予算プランの概要をコピーしました。") : i18n("Could not copy the summary.", "概要をコピーできませんでした。"), copied ? "success" : "warning");
      window.setTimeout(() => {
        if (!button.isConnected) return;
        button.textContent = originalLabel;
        button.classList.remove("copy-success");
      }, 1400);
      return;
    }

    if (action === "clear-selection") {
      if (!selectedBudgetKeys.size) return;
      const count = selectedBudgetKeys.size;
      const confirmed = await showActionConfirm({
        title: i18n("Clear current selection?", "現在の選択をクリア？"),
        message: IS_JAPANESE ? `現在のプランから${count}件の選択を外します。保存済みプランには影響しません。` : `${count} selected ${count === 1 ? "item" : "items"} will be removed from the current plan. Saved plans stay untouched.`,
        confirmLabel: i18n("Clear selection", "選択をクリア")
      });
      if (!confirmed) return;

      clearBudgetSelection();
      renderBudgetPlanDialog();
      showBudgetPlanNotice(i18n("Selection cleared.", "選択をクリアしました。"), "neutral");
      return;
    }

    if (action === "save-plan") {
      const input = budgetPlanDialog.querySelector("#budget-plan-name");
      const result = saveCurrentBudgetPlan(input?.value);
      if (result.error) {
        showBudgetPlanNotice(result.error, "warning");
        return;
      }
      budgetPlanActiveTab = "saved";
      renderBudgetPlanDialog();
      showBudgetPlanNotice(IS_JAPANESE ? `「${result.plan.name}」を保存しました。` : `Saved “${result.plan.name}”.`, "success");
      return;
    }

    if (action === "load-plan") {
      const result = restoreSavedBudgetPlan(button.dataset.planId);
      if (result.error) {
        showBudgetPlanNotice(result.error, "warning");
        return;
      }
      budgetPlanActiveTab = "summary";
      renderBudgetPlanDialog();
      showBudgetPlanNotice(
        result.missing > 0
          ? (IS_JAPANESE ? `「${result.name}」から${result.restored}件読み込みました。${result.missing}件は現在利用できません。` : `Loaded ${result.restored} items from “${result.name}”; ${result.missing} are no longer available.`)
          : (IS_JAPANESE ? `「${result.name}」を読み込みました。` : `Loaded “${result.name}”.`),
        result.missing > 0 ? "warning" : "success"
      );
      return;
    }

    if (action === "delete-plan") {
      const planId = button.dataset.planId;
      const plan = getSavedBudgetPlans().find((candidate) => candidate.id === planId);
      const confirmed = await showActionConfirm({
        title: i18n("Delete saved plan?", "保存済みプランを削除？"),
        message: IS_JAPANESE ? `「${plan?.name || "保存済みプラン"}」をこのブラウザから削除します。欲しいものリストのアイテム自体には影響しません。` : `“${plan?.name || "Saved plan"}” will be removed from this browser. Your wishlist items are not affected.`,
        confirmLabel: i18n("Delete plan", "プランを削除")
      });
      if (!confirmed) return;

      if (deleteSavedBudgetPlan(planId)) {
        renderBudgetPlanDialog();
        showBudgetPlanNotice(i18n("Saved plan deleted.", "保存済みプランを削除しました。"), "neutral");
      }
    }
  });

  budgetPlanDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeBudgetPlanDialog();
  });

  document.body.append(budgetPlanDialog);
  return budgetPlanDialog;
}

function showBudgetPlanNotice(message, tone = "neutral") {
  ensureBudgetPlanDialog();
  const notice = budgetPlanDialog.querySelector("#budget-plan-notice");
  if (!notice) return;

  if (budgetPlanNoticeTimer) window.clearTimeout(budgetPlanNoticeTimer);
  notice.hidden = false;
  notice.className = `budget-plan-notice ${tone}`;
  notice.textContent = message;

  budgetPlanNoticeTimer = window.setTimeout(() => {
    notice.hidden = true;
    budgetPlanNoticeTimer = null;
  }, 2600);
}

function renderBudgetPlanDialog() {
  const dialog = ensureBudgetPlanDialog();
  const selected = getBudgetSelection();
  const totals = getBudgetPlanTotals(selected);

  dialog.querySelector("#budget-plan-total").textContent = formatCompactPrice(totals.total);
  dialog.querySelector("#budget-plan-count").textContent = String(selected.length);
  dialog.querySelector("#budget-plan-average").textContent = selected.length ? formatCompactPrice(totals.average) : "—";
  dialog.querySelector("#budget-plan-now-total").textContent = formatCompactPrice(totals.nowTotal);

  const remainingElement = dialog.querySelector("#budget-plan-remaining");
  const statusElement = dialog.querySelector("#budget-plan-budget-status");
  const progress = dialog.querySelector("#budget-plan-hero-progress");

  if (budgetAmount === null) {
    remainingElement.textContent = "—";
    remainingElement.classList.remove("over");
    statusElement.textContent = i18n("Set a budget to unlock Fill, Under Budget, and Optimize", "予算を設定すると追加・予算調整・最適化を使えます");
    progress.style.width = selected.length ? "12%" : "0%";
    progress.classList.remove("over");
  } else {
    const remaining = totals.remaining ?? 0;
    const over = remaining < 0;
    remainingElement.textContent = over
      ? `−${formatCompactPrice(Math.abs(remaining))}`
      : formatCompactPrice(remaining);
    remainingElement.classList.toggle("over", over);
    statusElement.textContent = IS_JAPANESE ? `${formatCompactPrice(totals.total)} / ${formatCompactPrice(budgetAmount)}${over ? " · 予算超過" : " · 予定"}` : `${formatCompactPrice(totals.total)} of ${formatCompactPrice(budgetAmount)}${over ? " · over budget" : " · planned"}`;
    progress.style.width = `${clamp((totals.total / Math.max(1, budgetAmount)) * 100, 0, 100)}%`;
    progress.classList.toggle("over", over);
  }

  for (const button of dialog.querySelectorAll("[data-budget-tab]")) {
    button.classList.toggle("active", button.dataset.budgetTab === budgetPlanActiveTab);
  }

  if (budgetPlanActiveTab === "compare") {
    budgetPlanContent.innerHTML = renderBudgetCompareTab(selected);
  } else if (budgetPlanActiveTab === "saved") {
    budgetPlanContent.innerHTML = renderBudgetSavedTab();
  } else {
    budgetPlanContent.innerHTML = renderBudgetSummaryTab(selected);
  }
}

function openBudgetPlanDialog() {
  const dialog = ensureBudgetPlanDialog();
  budgetPlanActiveTab = "summary";
  budgetPlanSmartResult = null;
  renderBudgetPlanDialog();
  const inner = dialog.querySelector(".budget-plan-inner");
  if (inner) inner.scrollTop = 0;

  if (settingsDialog.open) {
    closeDialogAnimated(settingsDialog, () => openDialogAnimated(dialog));
  } else {
    openDialogAnimated(dialog);
  }
}

function closeBudgetPlanDialog(afterClose = null) {
  if (!budgetPlanDialog) {
    if (afterClose) afterClose();
    return;
  }
  closeDialogAnimated(budgetPlanDialog, afterClose);
}

function finishBudgetSelection() {
  const hasSelection = selectedBudgetKeys.size > 0;
  setBudgetMode(false);
  renderBudgetPlanner();
  if (hasSelection) openBudgetPlanDialog();
}

function copyTextWithLegacySelection(text, hostOverride = null) {
  const host = hostOverride?.open ? hostOverride : budgetPlanDialog?.open ? budgetPlanDialog : document.body;
  const activeElement = document.activeElement;
  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");
  Object.assign(textarea.style, {
    position: "fixed",
    left: "-9999px",
    top: "0",
    width: "1px",
    height: "1px",
    padding: "0",
    border: "0",
    opacity: "0",
    fontSize: "16px",
    pointerEvents: "none"
  });

  host.append(textarea);

  let copied = false;
  try {
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    copied = Boolean(document.execCommand?.("copy"));
  } catch {
    copied = false;
  } finally {
    textarea.remove();
    if (activeElement instanceof HTMLElement && activeElement.isConnected) {
      try {
        activeElement.focus({ preventScroll: true });
      } catch {
        // Restoring focus is cosmetic; copying already finished.
      }
    }
  }

  return copied;
}

async function copyTextToClipboard(text, modalHost = null) {
  const isIOSWebKit = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOSWebKit && copyTextWithLegacySelection(text, modalHost)) return true;

  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the selection path for restricted browsers.
    }
  }

  return copyTextWithLegacySelection(text, modalHost);
}

async function copyBudgetPlanSummary() {
  const selected = getBudgetSelection();
  const totals = getBudgetPlanTotals(selected);
  const lines = [i18n("Budget Plan", "予算プラン")];

  if (budgetAmount !== null) lines.push(IS_JAPANESE ? `予算: ${formatCompactPrice(budgetAmount)}` : `Budget: ${formatCompactPrice(budgetAmount)}`);
  lines.push(IS_JAPANESE ? `選択: ${selected.length}件` : `Selected: ${selected.length} ${selected.length === 1 ? "item" : "items"}`);
  lines.push(IS_JAPANESE ? `合計: ${formatCompactPrice(totals.total)}` : `Total: ${formatCompactPrice(totals.total)}`);
  if (totals.remaining !== null) {
    lines.push(
      totals.remaining >= 0
        ? (IS_JAPANESE ? `残り: ${formatCompactPrice(totals.remaining)}` : `Remaining: ${formatCompactPrice(totals.remaining)}`)
        : (IS_JAPANESE ? `予算超過: ${formatCompactPrice(Math.abs(totals.remaining))}` : `Over budget: ${formatCompactPrice(Math.abs(totals.remaining))}`)
    );
  }
  lines.push(IS_JAPANESE ? `今買う: ${formatCompactPrice(totals.nowTotal)} (${totals.nowItems.length}件)` : `Buy now: ${formatCompactPrice(totals.nowTotal)} (${totals.nowItems.length})`);
  lines.push(IS_JAPANESE ? `後で買う: ${formatCompactPrice(totals.laterTotal)} (${totals.laterItems.length}件)` : `Later: ${formatCompactPrice(totals.laterTotal)} (${totals.laterItems.length})`);
  lines.push("");

  for (const item of selected) {
    const key = getItemKey(item);
    const stage = getBudgetStage(key) === "later" ? i18n("Later", "後で買う") : i18n("Buy now", "今買う");
    const priority = formatPriorityLabel(item.priority) || i18n("No priority", "優先度なし");
    lines.push(`- [${stage}] ${item.title || item.asin || i18n("Amazon item", "Amazon商品")} — ${formatPrice(item.price, item.currency) || i18n("No price", "価格なし")} — ${priority} — ${item.wishlist_name || i18n("Wishlist", "欲しいものリスト")}`);
  }

  return copyTextToClipboard(lines.join("\n"), budgetPlanDialog);
}


function populateBudgetAutoSources() {
  const previous = budgetAutoSourceSelect.value || "current";
  budgetAutoSourceSelect.innerHTML = "";

  const currentOption = document.createElement("option");
  currentOption.value = "current";
  currentOption.textContent = i18n("Current results", "現在の結果");
  budgetAutoSourceSelect.append(currentOption);

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = i18n("All wishlists", "すべてのリスト");
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
      error: IS_JAPANESE ? `条件に一致する価格付きアイテムは${candidates.length}件だけです。` : `Only ${candidates.length} priced ${candidates.length === 1 ? "item" : "items"} match those conditions.`
    };
  }

  const cheapest = [...candidates]
    .sort((first, second) => getPrice(first) - getPrice(second))
    .slice(0, count);

  const minimumRequired = sumItemPrices(cheapest);

  if (minimumRequired > budget) {
    return {
      error: IS_JAPANESE ? `${count}件選ぶには予算が足りません。` : `That budget is too low for ${count} ${count === 1 ? "item" : "items"}.`,
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
  wishlist.textContent = item.wishlist_name || i18n("Wishlist", "欲しいものリスト");

  const title = document.createElement("strong");
  title.className = "random-result-title";
  title.textContent = item.title || item.asin || i18n("Amazon item", "Amazon商品");

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
    IS_JAPANESE ? `価格付き候補 ${result.candidateCount}件 · ${result.items.length}件選択` : `${result.candidateCount} priced candidates · ${result.items.length} picked`;
  budgetAutoSummaryElement.textContent =
    IS_JAPANESE ? `${formatCompactPrice(result.total)} / ${formatCompactPrice(budget)} · 残り ${formatCompactPrice(result.remaining)}` : `${formatCompactPrice(result.total)} of ${formatCompactPrice(budget)} · ${formatCompactPrice(result.remaining)} remaining`;
}

function runBudgetAutoPick() {
  const budget = parseNumber(budgetAutoBudgetInput.value);
  const count = parseNumber(budgetAutoCountInput.value);

  budgetAutoResultsElement.innerHTML = "";
  budgetAutoSummaryElement.textContent = "";

  if (budget === null || budget <= 0) {
    budgetAutoStatusElement.textContent = i18n("Enter a budget greater than ¥0.", "¥0より大きい予算を入力してください。");
    return;
  }

  if (count === null || count < 1 || count > 20) {
    budgetAutoStatusElement.textContent = i18n("Choose between 1 and 20 items.", "1〜20件の範囲で個数を選んでください。");
    return;
  }

  budgetAutoCountInput.value = String(count);

  const candidates = getBudgetAutoCandidates();
  const result = findBudgetAutoSet(candidates, budget, count);

  if (result.error) {
    budgetAutoStatusElement.textContent = result.minimumRequired
      ? (IS_JAPANESE ? `${result.error} 必要最低額: ${formatCompactPrice(result.minimumRequired)}。` : `${result.error} Minimum needed: ${formatCompactPrice(result.minimumRequired)}.`)
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
  wishlist.textContent = item.wishlist_name || i18n("Wishlist", "欲しいものリスト");

  const title = document.createElement("strong");
  title.className = "random-result-title";
  title.textContent = item.title || item.asin || i18n("Amazon item", "Amazon商品");

  const price = document.createElement("span");
  price.className = "random-result-price";
  price.textContent = formatPrice(item.price, item.currency) || i18n("Price unavailable", "価格情報なし");
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
    ? (IS_JAPANESE ? ` 優先度: ${state.priorities.map((priority) => formatPriorityName(priority)).join(" + ")}。` : ` Priority: ${state.priorities.map((priority) =>
        priority === "none"
          ? "None"
          : `${priority[0].toUpperCase()}${priority.slice(1)}`
      ).join(" + ")}.`)
    : "";
  const context = state.list === "all"
    ? (IS_JAPANESE ? `表示中${filteredCount}件から${items.length}件選びました。${priorityContext}` : `Picked ${items.length} from ${filteredCount} currently visible items.${priorityContext}`)
    : (IS_JAPANESE ? `${listName}の表示中${filteredCount}件から${items.length}件選びました。${priorityContext}` : `Picked ${items.length} from ${filteredCount} currently visible items in ${listName}.${priorityContext}`);

  randomContextElement.textContent = context;

  const prices = items.map(getPrice).filter((price) => price !== null);
  const total = prices.reduce((sum, price) => sum + price, 0);

  randomSummaryElement.textContent = prices.length === 0
    ? i18n("No saved prices in this selection.", "この選択には保存価格がありません。")
    : (IS_JAPANESE ? `価格あり ${prices.length}件 · 合計 ${formatCompactPrice(total)}` : `${prices.length} priced · ${formatCompactPrice(total)} total`);
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

  historyTitleElement.textContent = item.title || item.asin || i18n("Amazon item", "Amazon商品");
  historyMetaElement.textContent = [
    item.wishlist_name || i18n("Wishlist", "欲しいものリスト"),
    formatPriorityLabel(item.priority)
  ].filter(Boolean).join(" · ");
  historyAsinElement.textContent = item.asin || "—";

  const formattedPrice = formatPrice(item.price, item.currency);
  historyProductPrice.textContent = formattedPrice || i18n("Price unavailable", "価格情報なし");
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

  historyCurrentElement.textContent = formattedPrice || i18n("No price", "価格なし");
  const loadingLowest = getOptionalPrice(item.lowest_price);
  const loadingHighest = getOptionalPrice(item.highest_price);
  historyLowestElement.textContent = loadingLowest !== null
    ? formatCompactPrice(loadingLowest)
    : "—";
  historyHighestElement.textContent = loadingHighest !== null
    ? formatCompactPrice(loadingHighest)
    : "—";
  historyChartElement.innerHTML = `<div class="history-loading">${i18n("Loading history…", "価格履歴を読み込み中…")}</div>`;
  historyListElement.innerHTML = "";
  historyCheckedElement.textContent = formatDateTime(
    item.last_checked_at ?? item.price_updated_at ?? item.created_at
  );
  historyAmazonLink.href = item.url;
  historyBackRandomButton.hidden = !returnTo;
  historyBackRandomButton.textContent =
    returnTo === "random"
      ? i18n("← Random picks", "← ランダム選択")
      : returnTo === "budget-auto"
        ? i18n("← Budget Auto Pick", "← 予算自動選択")
        : i18n("← Back", "← 戻る");

  updateProductNavigation(item);
}

function createHistoryChart(history) {
  const entries = history
    .slice()
    .reverse()
    .map((entry) => ({ ...entry, numericPrice: Number(entry.price) }))
    .filter((entry) => Number.isFinite(entry.numericPrice));

  if (entries.length === 0) {
    return `<div class="history-empty-chart">${i18n("No recorded prices yet.", "記録された価格はまだありません。")}</div>`;
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
        aria-label="${i18n("Price history line chart. Tap a point for its date and price.", "価格履歴の折れ線グラフ。ポイントをタップすると日時と価格を確認できます。")}"
        preserveAspectRatio="none"
      >
        ${gridLines}
        <line class="history-selection-guide" x1="0" x2="0" y1="${paddingY}" y2="${height - paddingY}" hidden></line>
        <polyline class="history-line" points="${polyline}"></polyline>
        ${circles}
      </svg>
      <div class="history-chart-tooltip" id="history-chart-tooltip" hidden></div>
      <div class="history-chart-legend" aria-hidden="true">
        <span><i class="legend-low"></i>${i18n("Low", "安値")}</span>
        <span><i class="legend-high"></i>${i18n("High", "高値")}</span>
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
    empty.textContent = i18n("No price points have been recorded yet.", "価格履歴はまだ記録されていません。");
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
    label.textContent = index === 0 ? i18n("Latest recorded price", "最新の記録価格") : i18n("Recorded price", "記録価格");

    left.append(date, label);

    const price = document.createElement("strong");
    price.className = "history-entry-price";
    price.textContent = formatPrice(entry.price, entry.currency) || "—";

    row.append(left, price);
    historyListElement.append(row);
  });
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

    const cloneVisual = cloneImage.closest(
      ".item-visual, .random-result-visual, .product-dialog-visual"
    );
    if (cloneVisual) {
      cloneVisual.classList.add("has-image");
      const fallback = cloneVisual.querySelector(".item-initials");
      if (fallback) fallback.hidden = true;
    }
  });
}

function getCachedDetailResponse(itemKey) {
  const cached = detailResponseCache.get(itemKey);
  if (!cached) return null;
  if (Date.now() - cached.savedAt > DETAIL_CACHE_TTL_MS) {
    detailResponseCache.delete(itemKey);
    return null;
  }
  return cached.data;
}

async function loadProductDetailResponse(item, signal) {
  const itemKey = getItemKey(item);
  const cached = getCachedDetailResponse(itemKey);
  if (cached) return cached;

  const params = new URLSearchParams({ list: item.wishlist_slug });
  const response = await fetch(
    `/api/items/${encodeURIComponent(item.asin)}/history?${params.toString()}`,
    { signal }
  );
  const data = await response.json();

  if (!response.ok) {
    if (!IS_JAPANESE && data.error) throw new Error(data.error);
    throw new Error(i18n("Could not load item details.", "商品詳細を読み込めませんでした。"));
  }

  detailResponseCache.set(itemKey, { data, savedAt: Date.now() });
  return data;
}

async function openProductDetails(
  item,
  { returnTo = null, historyMode = "none" } = {}
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

  openDialogAnimated(historyDialog);

  detailAbortController?.abort();
  const controller = new AbortController();
  detailAbortController = controller;

  try {
    const data = await loadProductDetailResponse(item, controller.signal);
    if (controller.signal.aborted || requestSequence !== detailRequestSequence) return;

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
      detailItem.title || detailItem.asin || i18n("Amazon item", "Amazon商品");
    historyMetaElement.textContent = [
      detailItem.wishlist_name || item.wishlist_name || i18n("Wishlist", "欲しいものリスト"),
      formatPriorityLabel(detailItem.priority ?? item.priority)
    ].filter(Boolean).join(" · ");
    historyAsinElement.textContent = detailItem.asin || item.asin || "—";

    const currentText = current !== null
      ? formatPrice(current, detailItem.currency)
      : null;

    historyProductPrice.textContent = currentText || i18n("Price unavailable", "価格情報なし");
    historyProductPrice.classList.toggle("price-unavailable", !currentText);
    historyCurrentElement.textContent = current !== null ? formatCompactPrice(current) : i18n("No price", "価格なし");
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
    if (error?.name === "AbortError") return;
    if (requestSequence !== detailRequestSequence) return;
    historyChartElement.innerHTML = "";
    historyListElement.innerHTML = "";

    const message = document.createElement("p");
    message.className = "history-empty";
    console.warn("Could not load item details:", error);
    message.textContent = IS_JAPANESE
      ? "商品詳細を読み込めませんでした。"
      : (error?.message || "Could not load item details.");
    historyListElement.append(message);
  } finally {
    if (detailAbortController === controller) detailAbortController = null;
  }
}

function closeProductDetails({ returnToSource = true, fromHistory = false } = {}) {
  detailRequestSequence += 1;
  detailSwapSequence += 1;
  detailSwapInProgress = false;
  historyDialog.classList.remove("detail-switching");
  clearProductDetailSwapClasses();

  if (!fromHistory && detailHistoryPushed && !returnDialogAfterDetails) {
    detailHistoryPushed = false;
    window.history.back();
    return;
  }

  const target = returnToSource ? returnDialogAfterDetails : null;
  returnDialogAfterDetails = null;
  activeDetailKey = null;

  if (!fromHistory) writeStateToUrl({ mode: "replace" });

  const pointerOriginCard = activePointerDetailCard;
  activePointerDetailCard = null;
  pendingPointerDetailCard = null;

  const afterClose = () => {
    // Safari restores focus to the element that opened a native <dialog>.
    // For touch/pointer opens that can incorrectly match :focus-visible and
    // leave a bright ring around the card after the modal closes. Remove that
    // restored pointer focus, while preserving focus for keyboard opens.
    if (pointerOriginCard?.isConnected) {
      pointerOriginCard.blur();
      requestAnimationFrame(() => {
        if (document.activeElement === pointerOriginCard) pointerOriginCard.blur();
      });
    }

    if (target === "random") openDialogAnimated(randomDialog);
    if (target === "budget-auto") openDialogAnimated(budgetAutoDialog);
  };

  detailAbortController?.abort();
  detailAbortController = null;
  closeDialogAnimated(historyDialog, afterClose);
}

function openSettingsDialog() {
  ensurePreferencesSettingsEntry();
  ensureSavedPlansSettingsEntry();
  updateSavedPlansSettingsEntry();
  renderBudgetPlanner();
  updateRandomControls(filterItems().length);
  openDialogAnimated(settingsDialog);
}

function closeSettingsDialog() {
  closeDialogAnimated(settingsDialog);
}

function bindEvents() {
  itemsElement.addEventListener("pointerdown", (event) => {
    const card = event.target.closest(".item-card");
    pendingPointerDetailCard =
      card && itemsElement.contains(card) ? card : null;
  });

  itemsElement.addEventListener("click", (event) => {
    const card = event.target.closest(".item-card");
    if (!card || !itemsElement.contains(card)) return;

    activePointerDetailCard = pendingPointerDetailCard === card ? card : null;
    pendingPointerDetailCard = null;

    const item = getItemByKey(card.dataset.itemKey);
    if (item) openProductDetails(item, { historyMode: "push" });
  });

  itemsElement.addEventListener("keydown", (event) => {
    const card = event.target.closest(".item-card");
    if (!card || event.target !== card) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();

    // Keyboard users should get focus restored to the originating card.
    pendingPointerDetailCard = null;
    activePointerDetailCard = null;

    const item = getItemByKey(card.dataset.itemKey);
    if (item) openProductDetails(item, { historyMode: "push" });
  });

  searchInput.addEventListener("input", () => {
    state.query = searchInput.value;
    if (stickySearchInput) stickySearchInput.value = state.query;
    lastRandomKeys = new Set();
    scheduleSearchCommit();
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
    scheduleSearchCommit();
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
    if (budgetMode) {
      finishBudgetSelection();
      return;
    }

    if (selectedBudgetKeys.size > 0) {
      openBudgetPlanDialog();
      return;
    }

    setBudgetMode(true);
    closeSettingsDialog();
  });

  budgetFloatingDone.addEventListener("click", finishBudgetSelection);

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
      !budgetPlanDialog?.open &&
      !savedPlansDialog?.open &&
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
        if (!IS_JAPANESE && data.error) throw new Error(data.error);
      throw new Error(i18n("Could not load items.", "アイテムを読み込めませんでした。"));
    }

    allItems = Array.isArray(data.items) ? data.items : [];
    itemCardCache.clear();
    itemSearchTextCache.clear();
    detailResponseCache.clear();

    readStateFromUrl();
    validateWishlistState();
    renderWishlistFilters();
    syncControlsFromState();
    renderBudgetPlanner();
    ensureSavedPlansSettingsEntry();
    bindEvents();
    renderItems();
    updateStickyUi();

    if (activeDetailKey) {
      const item = getItemByKey(activeDetailKey);
      if (item) openProductDetails(item, { historyMode: "none" });
    }
  } catch (error) {
    statusElement.textContent = i18n("Error", "エラー");
    resultsSummaryElement.textContent = "";
    updateDashboard([]);
    console.warn("Could not load wishlist items:", error);
    renderEmpty(IS_JAPANESE ? "アイテムを読み込めませんでした。" : (error?.message || "Could not load items."));
  }
}

window.addEventListener("resize", () => {
  requestAnimationFrame(() => {
    restartSummaryTicker();
    updateStickyUi();
  });
});

localizeStaticUi();
setupPwa();
loadItems();
