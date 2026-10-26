# amazon-wishlist-sync

A personal Amazon.co.jp wishlist dashboard built with Cloudflare Workers, Static Assets, D1, and an iPhone Scriptable workflow.

Amazon product data is collected with best-effort HTML parsing rather than the official Product Advertising API, so manual price entry is used when reliable data cannot be detected.

## Features

### Web dashboard

- Multiple wishlists
- Language setting: Auto / 日本語 / English. Auto uses Japanese for `ja` / `ja-*` and English for every other language.
- Appearance setting: Auto / Light / Dark. Auto follows the device color scheme.
- Search by title, ASIN, or wishlist
- Price, image, wishlist, and priority filters
- Recorded-low and recorded-high price filters, requiring at least two price records per item
- Sorting by date, price, title, wishlist, and priority
- Biggest price drop / increase sorting, based on the amount changed since the previous recorded price; items without a comparable price appear last
- Comfortable / Compact views
- Dashboard totals and price statistics
- Item Details modal with price history graph
- Previous / Next and swipe navigation
- Random Pick
- Budget Auto Pick
- Manual Budget Plan
  - Selected total / remaining budget
  - Buy now / Later planning
  - Fill remaining
  - Get under budget
  - Optimize selection
  - Compare selected items
  - Save plans locally
  - Open saved plans directly from Settings
  - Copy plan summary
- PWA support

### Scriptable

- Add products from the iPhone Share Sheet
- Register wishlists
- Set item priority
- Bulk edit items
- Move items between wishlists
- Clear saved prices
- Delete items
- Export JSON backups and CSV files
- Refresh saved prices in batches, clearing the current price for verified unavailable or unpriced products while keeping price history

## Architecture

```text
Amazon Share Sheet
       │
       ▼
iPhone Shortcut
       │
       ▼
Scriptable: Wishlist Sync
       │
       │ Bearer SYNC_TOKEN
       ▼
Cloudflare Worker
   ├─ /api/*
   ├─ Static Assets
   └─ D1
       ├─ wishlists
       ├─ items
       ├─ price_history
       └─ item_preferences
```

## Setup

Install dependencies:

```bash
npm install
```

Configure the D1 binding in `wrangler.jsonc`, then add the Worker secret:

```bash
npx wrangler secret put SYNC_TOKEN
```

Use the same token in Scriptable. It is stored in the iOS Keychain as:

```text
amazon-wishlist-sync-token
```

Deploy with Wrangler:

```bash
npx wrangler deploy
```

## D1 migrations

Before applying migrations to an existing remote database, inspect the pending list first:

```bash
npx wrangler d1 migrations list wishlist-db --remote
```

Do not blindly apply old migrations to an existing production database. Older installations may already contain schema changes that were applied manually.

## Price history

Price history is updated when an item is shared or synced again. It is not automatic background price monitoring.

During a Scriptable batch refresh, a verified unavailable product clears the current saved price. A fully loaded, matching product page without price candidates also clears it. CAPTCHA, network errors, incomplete pages, conflicting prices, and unparseable price candidates keep the saved price. In review mode, clearing a detected missing price requires confirmation; leaving a reviewed price empty also clears it. Existing price history is retained.

After updating `scriptable/Wishlist Sync.js` in the repository, replace the contents of the existing Wishlist Sync script in the iPhone Scriptable app as well. Deploying the Worker does not update the iPhone script.

A new history point is stored when the detected price changes. Clearing the current price does not delete existing history.

Item updates, price history, and an optional priority update are committed in one D1 transaction. If any write fails, the entire update is rolled back. Repeated or concurrent syncs with the same latest price and currency do not add duplicate history points. Syncing a price again also restores its latest history point if it was missing from an older partial update.

## Budget plans

Saved Budget Plans are stored in browser `localStorage`, so they are local to that browser/device and disappear if site data is cleared.

Budget planning runs in the browser and does not expose `SYNC_TOKEN` to the frontend.

## Security

- Keep `SYNC_TOKEN` in the Worker secret and Scriptable Keychain.
- Never commit the real token to GitHub.
- The public frontend does not need the sync token for browsing or budget tools.

## Worker regression tests

Run with Node.js 24:

```bash
npm run test:worker
```

These tests use an in-memory SQLite database and a D1 binding adapter. They cover transaction rollback, retries, concurrent syncs, history deduplication, and JSON error responses for every API handler. They do not access the deployed Worker or a remote database.

Run the dashboard's price-filter and sorting regression tests:

```bash
npm run test:filters
```

Run Scriptable batch-refresh regression tests without an iPhone or external DOM dependency:

```bash
npm run test:refresh
```



