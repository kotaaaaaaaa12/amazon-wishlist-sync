const itemsElement = document.querySelector("#items");
const statusElement = document.querySelector("#status");

function renderEmpty(message) {
  itemsElement.innerHTML = "";

  const empty = document.createElement("p");
  empty.className = "empty";
  empty.textContent = message;
  itemsElement.append(empty);
}

function renderItems(items) {
  itemsElement.innerHTML = "";

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "item-card";

    const meta = document.createElement("div");

    const asin = document.createElement("p");
    asin.className = "asin";
    asin.textContent = item.asin;

    const date = document.createElement("p");
    date.className = "date";
    date.textContent = new Date(`${item.created_at}Z`).toLocaleString();

    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View on Amazon";

    meta.append(asin, date);
    card.append(meta, link);
    itemsElement.append(card);
  }
}

async function loadItems() {
  try {
    const response = await fetch("/api/items");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not load items.");
    }

    if (data.setupRequired) {
      statusElement.textContent = "Setup required";
      renderEmpty("Connect a D1 database to start syncing items.");
      return;
    }

    statusElement.textContent = `${data.items.length} item${data.items.length === 1 ? "" : "s"}`;

    if (data.items.length === 0) {
      renderEmpty("No items yet.");
      return;
    }

    renderItems(data.items);
  } catch (error) {
    statusElement.textContent = "Error";
    renderEmpty(error.message);
  }
}

loadItems();
