const itemsElement =
  document.querySelector(
    "#items"
  );

const statusElement =
  document.querySelector(
    "#status"
  );

const filtersElement =
  document.querySelector(
    "#filters"
  );

const activeListElement =
  document.querySelector(
    "#active-list"
  );

let allItems = [];
let activeSlug = "all";

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

function formatDate(value) {
  if (!value) {
    return "";
  }

  const normalized =
    value.endsWith("Z")
      ? value
      : `${value}Z`;

  const date =
    new Date(
      normalized
    );

  return new Intl
    .DateTimeFormat(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    )
    .format(date);
}

function formatPrice(
  price,
  currency
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
      .format(price);
  } catch {
    return (
      `¥${Number(price).toLocaleString()}`
    );
  }
}

function getInitials(title) {
  if (!title) {
    return "A";
  }

  const words =
    title
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

function createItemCard(item) {
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

  const visual =
    document.createElement(
      "div"
    );

  visual.className =
    "item-visual";

  const initials =
    document.createElement(
      "span"
    );

  initials.textContent =
    getInitials(
      item.title
    );

  visual.append(
    initials
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

  if (formattedPrice) {
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
      />
    </svg>
  `;

  bottom.append(
    asin,
    action
  );

  content.append(
    top,
    title,
    priceRow,
    bottom
  );

  card.append(
    visual,
    content
  );

  return card;
}

function renderItems() {
  itemsElement.innerHTML =
    "";

  const filtered =
    activeSlug ===
    "all"
      ? allItems
      : allItems.filter(
          (item) =>
            item
              .wishlist_slug ===
            activeSlug
        );

  statusElement.textContent =
    `${filtered.length} ${
      filtered.length === 1
        ? "item"
        : "items"
    }`;

  if (
    filtered.length === 0
  ) {
    renderEmpty(
      "Nothing saved here yet."
    );

    return;
  }

  for (
    const item
    of filtered
  ) {
    itemsElement.append(
      createItemCard(
        item
      )
    );
  }
}

function renderFilters() {
  filtersElement.innerHTML =
    "";

  const lists =
    new Map();

  for (
    const item
    of allItems
  ) {
    if (
      item.wishlist_slug &&
      item.wishlist_name
    ) {
      lists.set(
        item.wishlist_slug,
        item.wishlist_name
      );
    }
  }

  const options = [
    {
      slug: "all",
      name: "All"
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
        name
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
      "filter-button";

    if (
      option.slug ===
      activeSlug
    ) {
      button.classList.add(
        "active"
      );
    }

    button.textContent =
      option.name;

    button.addEventListener(
      "click",
      () => {
        activeSlug =
          option.slug;

        activeListElement
          .textContent =
          option.name;

        renderFilters();
        renderItems();
      }
    );

    filtersElement.append(
      button
    );
  }
}

async function loadItems() {
  try {
    const response =
      await fetch(
        "/api/items"
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Could not load items."
      );
    }

    allItems =
      data.items ??
      [];

    renderFilters();
    renderItems();
  } catch (error) {
    statusElement.textContent =
      "Error";

    renderEmpty(
      error.message
    );
  }
}

loadItems();
