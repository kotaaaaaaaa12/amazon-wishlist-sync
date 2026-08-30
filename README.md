# amazon-wishlist-sync

A personal Amazon.co.jp wishlist dashboard built with Cloudflare Workers, Static Assets, D1, and an iPhone Scriptable workflow.

Amazon product data is collected with best-effort HTML parsing rather than the official Product Advertising API, so manual price entry is used when reliable data cannot be detected.

## Features

### Web dashboard

- Multiple wishlists
- Automatic UI language: Japanese when the browser primary language is `ja` / `ja-*`; English for every other language
- Search by title, ASIN, or wishlist
- Price, image, wishlist, and priority filters
- Sorting by date, price, title, wishlist, and priority
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

A new history point is stored when the detected price changes. Clearing the current price does not delete existing history.

## Budget plans

Saved Budget Plans are stored in browser `localStorage`, so they are local to that browser/device and disappear if site data is cleared.

Budget planning runs in the browser and does not expose `SYNC_TOKEN` to the frontend.

## Security

- Keep `SYNC_TOKEN` in the Worker secret and Scriptable Keychain.
- Never commit the real token to GitHub.
- The public frontend does not need the sync token for browsing or budget tools.
