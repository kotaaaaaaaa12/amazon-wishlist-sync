const itemsElement =
  document.querySelector(
    "#items"
  );

const statusElement =
  document.querySelector(
    "#status"
  );

const wishlistFiltersElement =
  document.querySelector(
    "#wishlist-filters"
  );

const activeListElement =
  document.querySelector(
    "#active-list"
  );

const resultsSummaryElement =
  document.querySelector(
    "#results-summary"
  );

const searchInput =
  document.querySelector(
    "#search-input"
  );

const sortSelect =
  document.querySelector(
    "#sort-select"
  );

const filtersToggle =
  document.querySelector(
    "#filters-toggle"
  );

const advancedFiltersElement =
  document.querySelector(
    "#advanced-filters"
  );

const filterCountElement =
  document.querySelector(
    "#filter-count"
  );

const minPriceInput =
  document.querySelector(
    "#min-price"
  );

const maxPriceInput =
  document.querySelector(
    "#max-price"
  );

const priceStatusSelect =
  document.querySelector(
    "#price-status"
  );

const imageStatusSelect =
  document.querySelector(
    "#image-status"
  );

const pricePresetsElement =
  document.querySelector(
    "#price-presets"
  );

const resetFiltersButton =
  document.querySelector(
    "#reset-filters"
  );

const randomButton =
  document.querySelector(
    "#random-button"
  );

const randomDialog =
  document.querySelector(
    "#random-dialog"
  );

const randomCloseButton =
  document.querySelector(
    "#random-close"
  );

const randomAgainButton =
  document.querySelector(
    "#random-again"
  );

const randomOpenLink =
  document.querySelector(
    "#random-open"
  );

const randomImage =
  document.querySelector(
    "#random-image"
  );

const randomInitials =
  document.querySelector(
    "#random-initials"
  );

const randomWishlist =
  document.querySelector(
    "#random-wishlist"
  );

const randomTitle =
  document.querySelector(
    "#random-title"
  );

const randomPrice =
  document.querySelector(
    "#random-price"
  );

const randomChange =
  document.querySelector(
    "#random-change"
  );

const randomContext =
  document.querySelector(
    "#random-context"
  );

const statItems =
  document.querySelector(
    "#stat-items"
  );

const statTotal =
  document.querySelector(
    "#stat-total"
  );

const statAverage =
  document.querySelector(
    "#stat-average"
  );

const statRange =
  document.querySelector(
    "#stat-range"
  );

const dashboardNote =
  document.querySelector(
    "#dashboard-note"
  );

const DEFAULT_STATE = {
  list:
    "all",

  query:
    "",

  sort:
    "newest",

  minPrice:
    null,

  maxPrice:
    null,

  priceStatus:
    "all",

  imageStatus:
    "all"
};

const VALID_SORTS =
  new Set([
    "newest",
    "oldest",
    "price-asc",
    "price-desc",
    "title-asc",
    "title-desc",
    "wishlist"
  ]);

const VALID_PRICE_STATUSES =
  new Set([
    "all",
    "priced",
    "missing"
  ]);

const VALID_IMAGE_STATUSES =
  new Set([
    "all",
    "image",
    "missing"
  ]);

let allItems = [];

let state = {
  ...DEFAULT_STATE
};

let lastRandomKey =
  null;

function parseNumber(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return null;
  }

  return Math.round(
    number
  );
}

function hasPrice(
  item
) {
  return (
    item.price !== null &&
    item.price !== undefined &&
    Number.isFinite(
      Number(item.price)
    )
  );
}

function getPrice(
  item
) {
  if (
    !hasPrice(item)
  ) {
    return null;
  }

  return Number(
    item.price
  );
}

function getOptionalPrice(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

function parseCreatedAt(
  value
) {
  if (!value) {
    return 0;
  }

  let normalized =
    String(value)
      .trim();

  if (
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
      .test(normalized)
  ) {
    normalized =
      normalized.replace(
        " ",
        "T"
      );
  }

  if (
    !/[zZ]|[+-]\d{2}:\d{2}$/
      .test(normalized)
  ) {
    normalized =
      `${normalized}Z`;
  }

  const timestamp =
    new Date(
      normalized
    ).getTime();

  return Number.isFinite(
    timestamp
  )
    ? timestamp
    : 0;
}

function formatDate(
  value
) {
  const timestamp =
    parseCreatedAt(
      value
    );

  if (!timestamp) {
    return "";
  }

  return new Intl
    .DateTimeFormat(
      undefined,
      {
        month:
          "short",

        day:
          "numeric",

        year:
          "numeric"
      }
    )
    .format(
      new Date(
        timestamp
      )
    );
}

function formatPrice(
  price,
  currency = "JPY"
) {
  if (
    price === null ||
    price === undefined
  ) {
    return null;
  }

  try {
    return new Intl
      .NumberFormat(
        "ja-JP",
        {
          style:
            "currency",

          currency:
            currency ||
            "JPY",

          maximumFractionDigits:
            0
        }
      )
      .format(
        Number(price)
      );
  } catch {
    return (
      `¥${Number(price)
        .toLocaleString(
          "ja-JP"
        )}`
    );
  }
}

function formatCompactPrice(
  price
) {
  if (
    price === null ||
    price === undefined
  ) {
    return "—";
  }

  return (
    `¥${Math.round(
      Number(price)
    ).toLocaleString(
      "ja-JP"
    )}`
  );
}

function normalizeSearchText(
  value
) {
  return String(
    value ?? ""
  )
    .toLocaleLowerCase()
    .trim();
}

function getInitials(
  title
) {
  if (!title) {
    return "A";
  }

  const words =
    String(title)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    words.length === 0
  ) {
    return "A";
  }

  return words
    .slice(0, 2)
    .map(
      (word) =>
        word[0]
    )
    .join("")
    .toUpperCase();
}

function getItemKey(
  item
) {
  return (
    `${item.wishlist_slug ?? ""}:${item.asin ?? ""}`
  );
}

function renderEmpty(
  message
) {
  itemsElement.innerHTML =
    "";

  const empty =
    document.createElement(
      "div"
    );

  empty.className =
    "empty-state";

  const icon =
    document.createElement(
      "div"
    );

  icon.className =
    "empty-icon";

  icon.textContent =
    "♡";

  const text =
    document.createElement(
      "p"
    );

  text.textContent =
    message;

  empty.append(
    icon,
    text
  );

  itemsElement.append(
    empty
  );
}

function createVisual(
  item
) {
  const visual =
    document.createElement(
      "div"
    );

  visual.className =
    "item-visual";

  const fallback =
    document.createElement(
      "span"
    );

  fallback.className =
    "item-initials";

  fallback.textContent =
    getInitials(
      item.title
    );

  visual.append(
    fallback
  );

  if (
    !item.image_url
  ) {
    return visual;
  }

  const image =
    document.createElement(
      "img"
    );

  image.className =
    "item-image";

  image.src =
    item.image_url;

  image.alt =
    "";

  image.loading =
    "lazy";

  image.decoding =
    "async";

  image.addEventListener(
    "load",
    () => {
      visual.classList.add(
        "has-image"
      );
    }
  );

  image.addEventListener(
    "error",
    () => {
      image.remove();

      visual.classList.remove(
        "has-image"
      );
    }
  );

  visual.prepend(
    image
  );

  return visual;
}

function getPriceHistoryInfo(
  item
) {
  const current =
    getPrice(item);

  const previous =
    getOptionalPrice(
      item.previous_price
    );

  const lowest =
    getOptionalPrice(
      item.lowest_price
    );

  const historyCount =
    Number(
      item.price_history_count ??
      0
    );

  const hasHistory =
    historyCount >= 2 &&
    current !== null &&
    previous !== null;

  const change =
    hasHistory
      ? current -
        previous
      : null;

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

function createPriceHistoryRow(
  item
) {
  const info =
    getPriceHistoryInfo(
      item
    );

  if (
    info.historyCount < 2
  ) {
    return null;
  }

  const row =
    document.createElement(
      "div"
    );

  row.className =
    "price-history-row";

  if (
    info.change !== null &&
    info.change !== 0
  ) {
    const change =
      document.createElement(
        "span"
      );

    change.className =
      "price-change";

    if (
      info.change < 0
    ) {
      change.classList.add(
        "price-drop"
      );

      change.textContent =
        `↓ ${formatCompactPrice(
          Math.abs(
            info.change
          )
        )}`;
    } else {
      change.classList.add(
        "price-rise"
      );

      change.textContent =
        `↑ ${formatCompactPrice(
          info.change
        )}`;
    }

    row.append(
      change
    );
  }

  if (
    info.isLowest
  ) {
    const lowest =
      document.createElement(
        "span"
      );

    lowest.className =
      "lowest-badge";

    lowest.textContent =
      "Lowest";

    row.append(
      lowest
    );
  }

  const points =
    document.createElement(
      "span"
    );

  points.className =
    "price-points";

  points.textContent =
    `${info.historyCount} price points`;

  row.append(
    points
  );

  return row;
}

function createItemCard(
  item
) {
  const card =
    document.createElement(
      "a"
    );

  card.className =
    "item-card";

  card.href =
    item.url;

  card.target =
    "_blank";

  card.rel =
    "noopener noreferrer";

  card.dataset.itemKey =
    getItemKey(
      item
    );

  const visual =
    createVisual(
      item
    );

  const content =
    document.createElement(
      "div"
    );

  content.className =
    "item-content";

  const top =
    document.createElement(
      "div"
    );

  top.className =
    "item-top";

  const wishlist =
    document.createElement(
      "span"
    );

  wishlist.className =
    "wishlist-badge";

  wishlist.textContent =
    item.wishlist_name ||
    "Wishlist";

  const date =
    document.createElement(
      "span"
    );

  date.className =
    "date";

  date.textContent =
    formatDate(
      item.created_at
    );

  top.append(
    wishlist,
    date
  );

  const title =
    document.createElement(
      "h3"
    );

  title.className =
    "item-title";

  title.textContent =
    item.title ||
    item.asin ||
    "Amazon item";

  const priceRow =
    document.createElement(
      "div"
    );

  priceRow.className =
    "price-row";

  const price =
    document.createElement(
      "span"
    );

  price.className =
    "item-price";

  const formattedPrice =
    formatPrice(
      item.price,
      item.currency
    );

  if (
    formattedPrice
  ) {
    price.textContent =
      formattedPrice;
  } else {
    price.textContent =
      "Price unavailable";

    price.classList.add(
      "price-unavailable"
    );
  }

  const priceLabel =
    document.createElement(
      "span"
    );

  priceLabel.className =
    "price-label";

  priceLabel.textContent =
    formattedPrice
      ? "saved price"
      : "";

  priceRow.append(
    price,
    priceLabel
  );

  const historyRow =
    createPriceHistoryRow(
      item
    );

  const bottom =
    document.createElement(
      "div"
    );

  bottom.className =
    "item-bottom";

  const asin =
    document.createElement(
      "span"
    );

  asin.className =
    "asin";

  asin.textContent =
    item.asin ||
    "";

  const action =
    document.createElement(
      "span"
    );

  action.className =
    "amazon-action";

  action.innerHTML = `
    <span>Amazon</span>

    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M7 17L17 7M9 7h8v8"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></path>
    </svg>
  `;

  bottom.append(
    asin,
    action
  );

  content.append(
    top,
    title,
    priceRow
  );

  if (
    historyRow
  ) {
    content.append(
      historyRow
    );
  }

  content.append(
    bottom
  );

  card.append(
    visual,
    content
  );

  return card;
}

function getWishlistMap() {
  const lists =
    new Map();

  for (
    const item
    of allItems
  ) {
    if (
      !item.wishlist_slug ||
      !item.wishlist_name
    ) {
      continue;
    }

    lists.set(
      item.wishlist_slug,
      item.wishlist_name
    );
  }

  return lists;
}

function getActiveListName() {
  if (
    state.list ===
    "all"
  ) {
    return "All";
  }

  return (
    getWishlistMap()
      .get(
        state.list
      ) ||
    "All"
  );
}

function itemMatchesSearch(
  item
) {
  const query =
    normalizeSearchText(
      state.query
    );

  if (!query) {
    return true;
  }

  const searchable =
    [
      item.title,
      item.asin,
      item.wishlist_name,
      item.wishlist_slug
    ]
      .map(
        normalizeSearchText
      )
      .join(" ");

  return searchable.includes(
    query
  );
}

function itemMatchesPriceRange(
  item
) {
  const hasMinimum =
    state.minPrice !==
    null;

  const hasMaximum =
    state.maxPrice !==
    null;

  if (
    !hasMinimum &&
    !hasMaximum
  ) {
    return true;
  }

  const price =
    getPrice(
      item
    );

  if (
    price === null
  ) {
    return false;
  }

  if (
    hasMinimum &&
    price <
      state.minPrice
  ) {
    return false;
  }

  if (
    hasMaximum &&
    price >
      state.maxPrice
  ) {
    return false;
  }

  return true;
}

function itemMatchesPriceStatus(
  item
) {
  if (
    state.priceStatus ===
    "priced"
  ) {
    return hasPrice(
      item
    );
  }

  if (
    state.priceStatus ===
    "missing"
  ) {
    return !hasPrice(
      item
    );
  }

  return true;
}

function itemMatchesImageStatus(
  item
) {
  const hasImage =
    Boolean(
      item.image_url
    );

  if (
    state.imageStatus ===
    "image"
  ) {
    return hasImage;
  }

  if (
    state.imageStatus ===
    "missing"
  ) {
    return !hasImage;
  }

  return true;
}

function filterItems() {
  return allItems.filter(
    (item) => {
      if (
        state.list !==
          "all" &&
        item.wishlist_slug !==
          state.list
      ) {
        return false;
      }

      if (
        !itemMatchesSearch(
          item
        )
      ) {
        return false;
      }

      if (
        !itemMatchesPriceRange(
          item
        )
      ) {
        return false;
      }

      if (
        !itemMatchesPriceStatus(
          item
        )
      ) {
        return false;
      }

      if (
        !itemMatchesImageStatus(
          item
        )
      ) {
        return false;
      }

      return true;
    }
  );
}

function comparePrices(
  first,
  second,
  direction
) {
  const firstPrice =
    getPrice(
      first
    );

  const secondPrice =
    getPrice(
      second
    );

  if (
    firstPrice === null &&
    secondPrice === null
  ) {
    return (
      parseCreatedAt(
        second.created_at
      ) -
      parseCreatedAt(
        first.created_at
      )
    );
  }

  if (
    firstPrice === null
  ) {
    return 1;
  }

  if (
    secondPrice === null
  ) {
    return -1;
  }

  return (
    firstPrice -
    secondPrice
  ) * direction;
}

function sortItems(
  items
) {
  const sorted =
    [...items];

  switch (
    state.sort
  ) {
    case "oldest":
      sorted.sort(
        (
          first,
          second
        ) =>
          parseCreatedAt(
            first.created_at
          ) -
          parseCreatedAt(
            second.created_at
          )
      );

      break;

    case "price-asc":
      sorted.sort(
        (
          first,
          second
        ) =>
          comparePrices(
            first,
            second,
            1
          )
      );

      break;

    case "price-desc":
      sorted.sort(
        (
          first,
          second
        ) =>
          comparePrices(
            first,
            second,
            -1
          )
      );

      break;

    case "title-asc":
      sorted.sort(
        (
          first,
          second
        ) =>
          String(
            first.title ??
            first.asin ??
            ""
          ).localeCompare(
            String(
              second.title ??
              second.asin ??
              ""
            ),
            undefined,
            {
              sensitivity:
                "base"
            }
          )
      );

      break;

    case "title-desc":
      sorted.sort(
        (
          first,
          second
        ) =>
          String(
            second.title ??
            second.asin ??
            ""
          ).localeCompare(
            String(
              first.title ??
              first.asin ??
              ""
            ),
            undefined,
            {
              sensitivity:
                "base"
            }
          )
      );

      break;

    case "wishlist":
      sorted.sort(
        (
          first,
          second
        ) => {
          const listComparison =
            String(
              first.wishlist_name ??
              ""
            ).localeCompare(
              String(
                second.wishlist_name ??
                ""
              ),
              undefined,
              {
                sensitivity:
                  "base"
              }
            );

          if (
            listComparison !==
            0
          ) {
            return listComparison;
          }

          return String(
            first.title ??
            first.asin ??
            ""
          ).localeCompare(
            String(
              second.title ??
              second.asin ??
              ""
            ),
            undefined,
            {
              sensitivity:
                "base"
            }
          );
        }
      );

      break;

    case "newest":
    default:
      sorted.sort(
        (
          first,
          second
        ) =>
          parseCreatedAt(
            second.created_at
          ) -
          parseCreatedAt(
            first.created_at
          )
      );

      break;
  }

  return sorted;
}

function getVisibleStats(
  items
) {
  const prices =
    items
      .map(
        getPrice
      )
      .filter(
        (price) =>
          price !== null
      );

  const total =
    prices.reduce(
      (
        sum,
        price
      ) =>
        sum +
        price,
      0
    );

  const average =
    prices.length > 0
      ? total /
        prices.length
      : null;

  const minimum =
    prices.length > 0
      ? Math.min(
          ...prices
        )
      : null;

  const maximum =
    prices.length > 0
      ? Math.max(
          ...prices
        )
      : null;

  return {
    count:
      items.length,

    pricedCount:
      prices.length,

    missingPriceCount:
      items.length -
      prices.length,

    total,

    average,

    minimum,

    maximum
  };
}

function updateDashboard(
  visibleItems
) {
  const stats =
    getVisibleStats(
      visibleItems
    );

  statItems.textContent =
    String(
      stats.count
    );

  statTotal.textContent =
    stats.pricedCount > 0
      ? formatCompactPrice(
          stats.total
        )
      : "—";

  statAverage.textContent =
    stats.average !== null
      ? formatCompactPrice(
          stats.average
        )
      : "—";

  if (
    stats.minimum ===
      null ||
    stats.maximum ===
      null
  ) {
    statRange.textContent =
      "—";
  } else if (
    stats.minimum ===
    stats.maximum
  ) {
    statRange.textContent =
      formatCompactPrice(
        stats.minimum
      );
  } else {
    statRange.textContent =
      `${formatCompactPrice(
        stats.minimum
      )} – ${formatCompactPrice(
        stats.maximum
      )}`;
  }

  if (
    stats.count === 0
  ) {
    dashboardNote.textContent =
      "No items match the current filters.";

    return;
  }

  if (
    stats.missingPriceCount >
    0
  ) {
    dashboardNote.textContent =
      `${stats.pricedCount} priced · ${stats.missingPriceCount} without price`;
  } else {
    dashboardNote.textContent =
      `${stats.pricedCount} priced`;
  }
}

function updateResultsSummary(
  visibleItems
) {
  const stats =
    getVisibleStats(
      visibleItems
    );

  const parts = [
    `${stats.count} ${
      stats.count === 1
        ? "item"
        : "items"
    }`
  ];

  if (
    stats.pricedCount > 0
  ) {
    parts.push(
      `${stats.pricedCount} priced`
    );
  }

  resultsSummaryElement
    .textContent =
    parts.join(" · ");

  if (
    visibleItems.length ===
    allItems.length
  ) {
    statusElement.textContent =
      `${allItems.length} ${
        allItems.length === 1
          ? "item"
          : "items"
      }`;
  } else {
    statusElement.textContent =
      `${visibleItems.length} / ${allItems.length}`;
  }
}

function renderItems() {
  itemsElement.innerHTML =
    "";

  const filtered =
    filterItems();

  const sorted =
    sortItems(
      filtered
    );

  updateDashboard(
    sorted
  );

  updateResultsSummary(
    sorted
  );

  activeListElement
    .textContent =
    getActiveListName();

  randomButton.disabled =
    filtered.length === 0;

  if (
    sorted.length === 0
  ) {
    renderEmpty(
      "No items match these filters."
    );

    return;
  }

  const fragment =
    document.createDocumentFragment();

  for (
    const item
    of sorted
  ) {
    fragment.append(
      createItemCard(
        item
      )
    );
  }

  itemsElement.append(
    fragment
  );
}

function renderWishlistFilters() {
  wishlistFiltersElement
    .innerHTML =
    "";

  const lists =
    getWishlistMap();

  const options = [
    {
      slug:
        "all",

      name:
        "All",

      count:
        allItems.length
    },

    ...Array.from(
      lists,
      (
        [
          slug,
          name
        ]
      ) => ({
        slug,

        name,

        count:
          allItems.filter(
            (item) =>
              item.wishlist_slug ===
              slug
          ).length
      })
    )
  ];

  for (
    const option
    of options
  ) {
    const button =
      document.createElement(
        "button"
      );

    button.type =
      "button";

    button.className =
      "wishlist-filter-button";

    if (
      option.slug ===
      state.list
    ) {
      button.classList.add(
        "active"
      );
    }

    const name =
      document.createElement(
        "span"
      );

    name.textContent =
      option.name;

    const count =
      document.createElement(
        "span"
      );

    count.className =
      "wishlist-filter-count";

    count.textContent =
      String(
        option.count
      );

    button.append(
      name,
      count
    );

    button.addEventListener(
      "click",
      () => {
        state.list =
          option.slug;

        lastRandomKey =
          null;

        renderWishlistFilters();

        commitState();
      }
    );

    wishlistFiltersElement
      .append(
        button
      );
  }
}

function getAdvancedFilterCount() {
  let count =
    0;

  if (
    state.minPrice !== null ||
    state.maxPrice !== null
  ) {
    count +=
      1;
  }

  if (
    state.priceStatus !==
    "all"
  ) {
    count +=
      1;
  }

  if (
    state.imageStatus !==
    "all"
  ) {
    count +=
      1;
  }

  return count;
}

function renderFilterCount() {
  const count =
    getAdvancedFilterCount();

  if (
    count === 0
  ) {
    filterCountElement.hidden =
      true;

    filterCountElement
      .textContent =
      "0";

    return;
  }

  filterCountElement.hidden =
    false;

  filterCountElement
    .textContent =
    String(count);
}

function renderPricePresets() {
  const buttons =
    pricePresetsElement
      .querySelectorAll(
        ".price-preset"
      );

  for (
    const button
    of buttons
  ) {
    const min =
      parseNumber(
        button.dataset.min
      );

    const max =
      parseNumber(
        button.dataset.max
      );

    const isActive =
      min ===
        state.minPrice &&
      max ===
        state.maxPrice;

    button.classList.toggle(
      "active",
      isActive
    );
  }
}

function syncControlsFromState() {
  searchInput.value =
    state.query;

  sortSelect.value =
    state.sort;

  minPriceInput.value =
    state.minPrice ===
    null
      ? ""
      : String(
          state.minPrice
        );

  maxPriceInput.value =
    state.maxPrice ===
    null
      ? ""
      : String(
          state.maxPrice
        );

  priceStatusSelect.value =
    state.priceStatus;

  imageStatusSelect.value =
    state.imageStatus;

  renderFilterCount();

  renderPricePresets();
}

function readStateFromUrl() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const sort =
    params.get(
      "sort"
    );

  const priceStatus =
    params.get(
      "price"
    );

  const imageStatus =
    params.get(
      "image"
    );

  state = {
    list:
      params.get(
        "list"
      ) ||
      DEFAULT_STATE.list,

    query:
      params.get(
        "q"
      ) ||
      DEFAULT_STATE.query,

    sort:
      VALID_SORTS.has(
        sort
      )
        ? sort
        : DEFAULT_STATE.sort,

    minPrice:
      parseNumber(
        params.get(
          "min"
        )
      ),

    maxPrice:
      parseNumber(
        params.get(
          "max"
        )
      ),

    priceStatus:
      VALID_PRICE_STATUSES
        .has(
          priceStatus
        )
        ? priceStatus
        : DEFAULT_STATE
          .priceStatus,

    imageStatus:
      VALID_IMAGE_STATUSES
        .has(
          imageStatus
        )
        ? imageStatus
        : DEFAULT_STATE
          .imageStatus
  };
}

function validateWishlistState() {
  if (
    state.list ===
    "all"
  ) {
    return;
  }

  if (
    !getWishlistMap()
      .has(
        state.list
      )
  ) {
    state.list =
      "all";
  }
}

function normalizePriceRange() {
  if (
    state.minPrice ===
      null ||
    state.maxPrice ===
      null
  ) {
    return;
  }

  if (
    state.minPrice <=
    state.maxPrice
  ) {
    return;
  }

  const minimum =
    state.maxPrice;

  const maximum =
    state.minPrice;

  state.minPrice =
    minimum;

  state.maxPrice =
    maximum;
}

function writeStateToUrl() {
  const params =
    new URLSearchParams();

  if (
    state.list !==
    DEFAULT_STATE.list
  ) {
    params.set(
      "list",
      state.list
    );
  }

  if (
    state.query
  ) {
    params.set(
      "q",
      state.query
    );
  }

  if (
    state.sort !==
    DEFAULT_STATE.sort
  ) {
    params.set(
      "sort",
      state.sort
    );
  }

  if (
    state.minPrice !==
    null
  ) {
    params.set(
      "min",
      String(
        state.minPrice
      )
    );
  }

  if (
    state.maxPrice !==
    null
  ) {
    params.set(
      "max",
      String(
        state.maxPrice
      )
    );
  }

  if (
    state.priceStatus !==
    DEFAULT_STATE.priceStatus
  ) {
    params.set(
      "price",
      state.priceStatus
    );
  }

  if (
    state.imageStatus !==
    DEFAULT_STATE.imageStatus
  ) {
    params.set(
      "image",
      state.imageStatus
    );
  }

  const query =
    params.toString();

  const nextUrl =
    query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;

  window.history.replaceState(
    null,
    "",
    nextUrl
  );
}

function commitState() {
  normalizePriceRange();

  syncControlsFromState();

  writeStateToUrl();

  renderItems();
}

function resetState() {
  state = {
    ...DEFAULT_STATE
  };

  lastRandomKey =
    null;

  renderWishlistFilters();

  commitState();

  advancedFiltersElement.hidden =
    true;

  filtersToggle.setAttribute(
    "aria-expanded",
    "false"
  );
}

function pickRandomItem() {
  const filtered =
    filterItems();

  if (
    filtered.length === 0
  ) {
    return null;
  }

  let pool =
    filtered;

  if (
    filtered.length > 1 &&
    lastRandomKey
  ) {
    const withoutLast =
      filtered.filter(
        (item) =>
          getItemKey(
            item
          ) !==
          lastRandomKey
      );

    if (
      withoutLast.length >
      0
    ) {
      pool =
        withoutLast;
    }
  }

  const index =
    Math.floor(
      Math.random() *
      pool.length
    );

  const item =
    pool[index];

  lastRandomKey =
    getItemKey(
      item
    );

  return item;
}

function getRandomContextText() {
  const count =
    filterItems().length;

  const listName =
    getActiveListName();

  if (
    state.list ===
    "all"
  ) {
    return (
      `Picked from ${count} currently visible ${
        count === 1
          ? "item"
          : "items"
      }.`
    );
  }

  return (
    `Picked from ${count} currently visible ${
      count === 1
        ? "item"
        : "items"
    } in ${listName}.`
  );
}

function renderRandomItem(
  item
) {
  if (!item) {
    return;
  }

  randomWishlist.textContent =
    item.wishlist_name ||
    "Wishlist";

  randomTitle.textContent =
    item.title ||
    item.asin ||
    "Amazon item";

  const formattedPrice =
    formatPrice(
      item.price,
      item.currency
    );

  randomPrice.textContent =
    formattedPrice ||
    "Price unavailable";

  randomPrice.classList.toggle(
    "price-unavailable",
    !formattedPrice
  );

  const history =
    getPriceHistoryInfo(
      item
    );

  randomChange.className =
    "random-change";

  if (
    history.change ===
      null ||
    history.change ===
      0
  ) {
    randomChange.textContent =
      "";
  } else if (
    history.change < 0
  ) {
    randomChange.textContent =
      `↓ ${formatCompactPrice(
        Math.abs(
          history.change
        )
      )}`;

    randomChange.classList.add(
      "price-drop"
    );
  } else {
    randomChange.textContent =
      `↑ ${formatCompactPrice(
        history.change
      )}`;

    randomChange.classList.add(
      "price-rise"
    );
  }

  randomInitials.textContent =
    getInitials(
      item.title
    );

  randomImage.hidden =
    true;

  randomImage.removeAttribute(
    "src"
  );

  if (
    item.image_url
  ) {
    randomImage.onload =
      () => {
        randomImage.hidden =
          false;

        randomInitials.hidden =
          true;
      };

    randomImage.onerror =
      () => {
        randomImage.hidden =
          true;

        randomInitials.hidden =
          false;
      };

    randomInitials.hidden =
      false;

    randomImage.src =
      item.image_url;
  } else {
    randomInitials.hidden =
      false;
  }

  randomOpenLink.href =
    item.url;

  randomContext.textContent =
    getRandomContextText();
}

function showRandomPick() {
  const item =
    pickRandomItem();

  if (!item) {
    return;
  }

  renderRandomItem(
    item
  );

  if (
    !randomDialog.open
  ) {
    randomDialog.showModal();
  }
}

function closeRandomDialog() {
  if (
    randomDialog.open
  ) {
    randomDialog.close();
  }
}

function bindEvents() {
  searchInput.addEventListener(
    "input",
    () => {
      state.query =
        searchInput.value;

      lastRandomKey =
        null;

      commitState();
    }
  );

  sortSelect.addEventListener(
    "change",
    () => {
      state.sort =
        sortSelect.value;

      commitState();
    }
  );

  filtersToggle.addEventListener(
    "click",
    () => {
      const isOpen =
        !advancedFiltersElement
          .hidden;

      advancedFiltersElement.hidden =
        isOpen;

      filtersToggle.setAttribute(
        "aria-expanded",
        String(!isOpen)
      );
    }
  );

  minPriceInput.addEventListener(
    "change",
    () => {
      state.minPrice =
        parseNumber(
          minPriceInput.value
        );

      lastRandomKey =
        null;

      commitState();
    }
  );

  maxPriceInput.addEventListener(
    "change",
    () => {
      state.maxPrice =
        parseNumber(
          maxPriceInput.value
        );

      lastRandomKey =
        null;

      commitState();
    }
  );

  priceStatusSelect.addEventListener(
    "change",
    () => {
      state.priceStatus =
        priceStatusSelect.value;

      lastRandomKey =
        null;

      commitState();
    }
  );

  imageStatusSelect.addEventListener(
    "change",
    () => {
      state.imageStatus =
        imageStatusSelect.value;

      lastRandomKey =
        null;

      commitState();
    }
  );

  pricePresetsElement
    .addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            ".price-preset"
          );

        if (!button) {
          return;
        }

        const min =
          parseNumber(
            button.dataset.min
          );

        const max =
          parseNumber(
            button.dataset.max
          );

        const alreadyActive =
          min ===
            state.minPrice &&
          max ===
            state.maxPrice;

        if (
          alreadyActive
        ) {
          state.minPrice =
            null;

          state.maxPrice =
            null;
        } else {
          state.minPrice =
            min;

          state.maxPrice =
            max;
        }

        lastRandomKey =
          null;

        commitState();
      }
    );

  resetFiltersButton.addEventListener(
    "click",
    () => {
      resetState();
    }
  );

  randomButton.addEventListener(
    "click",
    () => {
      showRandomPick();
    }
  );

  randomAgainButton.addEventListener(
    "click",
    () => {
      showRandomPick();
    }
  );

  randomCloseButton.addEventListener(
    "click",
    () => {
      closeRandomDialog();
    }
  );

  randomDialog.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        randomDialog
      ) {
        closeRandomDialog();
      }
    }
  );

  window.addEventListener(
    "popstate",
    () => {
      readStateFromUrl();

      validateWishlistState();

      lastRandomKey =
        null;

      renderWishlistFilters();

      syncControlsFromState();

      renderItems();
    }
  );
}

async function loadItems() {
  try {
    const response =
      await fetch(
        "/api/items"
      );

    const data =
      await response.json();

    if (
      !response.ok
    ) {
      throw new Error(
        data.error ||
        "Could not load items."
      );
    }

    allItems =
      Array.isArray(
        data.items
      )
        ? data.items
        : [];

    readStateFromUrl();

    validateWishlistState();

    renderWishlistFilters();

    syncControlsFromState();

    bindEvents();

    renderItems();
  } catch (error) {
    statusElement.textContent =
      "Error";

    resultsSummaryElement
      .textContent =
      "";

    updateDashboard(
      []
    );

    renderEmpty(
      error.message
    );
  }
}

loadItems();
