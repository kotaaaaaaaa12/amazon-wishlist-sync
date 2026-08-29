const itemsElement =
  document.querySelector("#items");

const statusElement =
  document.querySelector("#status");

function renderEmpty(message) {
  itemsElement.innerHTML = "";

  const empty =
    document.createElement("p");

  empty.className = "empty";
  empty.textContent = message;

  itemsElement.append(empty);
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(
      value.endsWith("Z")
        ? value
        : `${value}Z`
    );

  return date.toLocaleString();
}

function renderItems(items) {
  itemsElement.innerHTML = "";

  for (const item of items) {
    const card =
      document.createElement("article");

    card.className = "item-card";

    const meta =
      document.createElement("div");

    meta.className = "item-meta";

    const title =
      document.createElement("h3");

    title.className = "item-title";

    title.textContent =
      item.title ||
      "Untitled Amazon item";

    const details =
      document.createElement("div");

    details.className =
      "item-details";

    const asin =
      document.createElement("span");

    asin.className = "asin";
    asin.textContent = item.asin;

    const wishlist =
      document.createElement("span");

    wishlist.className =
      "wishlist-name";

    wishlist.textContent =
      item.wishlist_name ||
      "";

    const date =
      document.createElement("span");

    date.className = "date";

    date.textContent =
      formatDate(
        item.created_at
      );

    details.append(
      wishlist,
      asin,
      date
    );

    meta.append(
      title,
      details
    );

    const link =
      document.createElement("a");

    link.href = item.url;
    link.target = "_blank";
    link.rel =
      "noopener noreferrer";

    link.className =
      "amazon-link";

    link.textContent =
      "View on Amazon";

    card.append(
      meta,
      link
    );

    itemsElement.append(card);
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

    if (data.setupRequired) {
      statusElement.textContent =
        "Setup required";

      renderEmpty(
        "Connect a D1 database to start syncing items."
      );

      return;
    }

    const items =
      data.items ?? [];

    statusElement.textContent =
      `${items.length} item${
        items.length === 1
          ? ""
          : "s"
      }`;

    if (items.length === 0) {
      renderEmpty(
        "No items yet."
      );

      return;
    }

    renderItems(items);
  } catch (error) {
    statusElement.textContent =
      "Error";

    renderEmpty(
      error.message
    );
  }
}

loadItems();
