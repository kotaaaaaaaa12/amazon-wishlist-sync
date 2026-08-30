# amazon-wishlist-sync

A personal Amazon.co.jp wishlist dashboard built with Cloudflare Workers, Static Assets, D1, and an iPhone Scriptable workflow.

The project is designed around a simple split:

- **Web:** browse, search, filter, compare, inspect price history, use manual budget planning, run Budget Auto Pick, and view random picks.
- **Scriptable:** add products, manage priorities, bulk-edit items, move items between wishlists, clear prices, delete items, and create backups.

> This project does not use an official Amazon Product Advertising API. Product title, image, availability, and price detection are best-effort HTML parsing and can break when Amazon changes its pages. Manual price entry is used as a fallback.

## Features

### Wishlist dashboard

- Multiple Amazon wishlists
- Responsive light/dark UI
- Installable PWA shell for Home Screen / standalone launch
- Compact sticky search/filter/settings toolbar after scrolling
- Scroll-to-top control for long lists
- Search by title, ASIN, or wishlist
- Price and image filters
- Price range presets
- Sorting by added date, price, title, wishlist, or priority
- Compact continuously scrolling summary ticker
- Item count, total saved-price value, average price, and range

### Item details

Tapping a product card opens an animated item-details modal before leaving the site. The card has touch/press feedback, and the modal can move directly to the previous or next item in the current filtered/sorted result set.

The modal includes:

- Product image and title
- Wishlist and priority
- Current saved price
- Last Checked timestamp
- ASIN
- Interactive price-history chart with tappable/focusable points
- Low/high point markers and point date/price tooltip
- Lowest and highest recorded prices
- Complete recorded price history
- Previous / Next navigation through visible results
- Explicit **Open on Amazon** action

Random Pick results also open the same details modal first instead of sending the user directly to Amazon.


### URL state

The dashboard keeps its browsing state in the URL, including:

- Active wishlist
- Search query
- Sort order
- Minimum / maximum price
- Price and image filters
- Whether the advanced filter panel is open
- The currently open item-details modal

This means filtered/detail views can be refreshed, bookmarked, or shared without losing the current view. Opening a card adds the item to browser history, so the browser Back action closes the details view naturally.

### PWA

The `public/` directory includes:

- `manifest.webmanifest`
- `sw.js`
- App icons

The service worker uses a network-first strategy for the static shell and does not intercept `/api/*` requests. The app remains a live dashboard rather than treating wishlist API data as an offline cache.

### Price handling

- Automatic price detection when a reliable current-product price can be found
- Manual price prompt when automatic detection fails
- Leaving the manual field blank uses `clearPrice` and removes the current saved price
- Historical prices are kept when the current price is cleared
- Price-history points are recorded when a newly detected price changes

### Priority

Each item can have one of four priority values:

- `high`
- `medium`
- `low`
- `none`

Priority is mainly edited from Scriptable. The web dashboard displays it and can sort by it.

### Scriptable management

Running **Wishlist Sync** directly opens the management menu:

```text
Wishlist Sync
├─ Manage Items
│  ├─ Change Priority
│  ├─ Move Wishlist
│  ├─ Clear Prices
│  └─ Delete Items
├─ Export / Backup
└─ Reset SYNC_TOKEN
```

`Manage Items` supports multi-selection with a Scriptable table, including Select All.

### Budget Auto Pick

Budget Auto Pick lives in the web dashboard as its own card under **Settings & Tools → Budget Auto Pick**.

You choose:

- Budget in JPY
- Number of items
- Current filtered results, all wishlists, or one wishlist
- Priority scope

The browser uses the item data already loaded by the dashboard and searches randomized combinations for a set that stays inside the budget while using as much of it as possible. No sync token is exposed to the web page.

Tapping an Auto Pick result opens the normal item-details modal first, just like Random Pick.

### Backup / Export

Scriptable supports two exports:

- **Full JSON Backup** — wishlists, items, metadata, priorities, and complete price histories
- **Items CSV** — flattened item data for spreadsheets

Files are saved to:

```text
iCloud Drive / Scriptable / Wishlist Sync Backups
```

The JSON format is structured so a restore workflow can be added later.

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
   ├─ API routes
   ├─ Static Assets
   └─ D1
       ├─ wishlists
       ├─ items
       ├─ price_history
       └─ item_preferences
```

## Project structure

```text
.
├─ migrations/
│  ├─ 0001_create_items.sql
│  ├─ 0002_multi_wishlist.sql
│  ├─ 0003_price_history.sql
│  └─ 0004_item_preferences.sql
├─ public/
│  ├─ app.js
│  ├─ index.html
│  ├─ style.css
│  ├─ manifest.webmanifest
│  ├─ sw.js
│  ├─ icon.svg
│  ├─ icon-512.png
│  └─ apple-touch-icon.png
├─ scriptable/
│  └─ Wishlist Sync.js
├─ src/
│  └─ worker.js
├─ README.md
├─ package.json
└─ wrangler.jsonc
```

## D1 data model

### `wishlists`

Stores wishlist names, slugs, Amazon list IDs, and canonical Amazon wishlist URLs.

### `items`

Stores products and their current metadata:

- Wishlist relationship
- ASIN
- Canonical Amazon URL
- Title
- Product image URL
- Current saved price
- Currency
- Last checked / price-updated time
- Created time

### `price_history`

Stores historical price points by item.

### `item_preferences`

Stores UI/management metadata that does not belong to Amazon itself.

Currently it stores item priority.

`0004_item_preferences.sql` uses `CREATE TABLE IF NOT EXISTS`, and the Worker also safely creates this table/index if missing. This prevents a deployment from taking the site down when the migration has not been applied yet.

## API

Write/management routes require:

```http
Authorization: Bearer YOUR_SYNC_TOKEN
```

### Health

```http
GET /api/health
```

### Wishlists

```http
GET /api/wishlists
POST /api/wishlists
```

Example create body:

```json
{
  "name": "Gadgets",
  "slug": "gadgets",
  "amazonUrl": "https://www.amazon.jp/hz/wishlist/ls/YOUR_LIST_ID"
}
```

### Items

```http
GET /api/items
GET /api/items?list=gadgets
POST /api/items
DELETE /api/items/:asin?list=gadgets
```

Example add/update body:

```json
{
  "url": "https://www.amazon.co.jp/dp/B0XXXXXXXX",
  "title": "Example item",
  "imageUrl": "https://m.media-amazon.com/images/I/example.jpg",
  "price": 12980,
  "currency": "JPY",
  "clearPrice": false,
  "priority": "high",
  "list": "gadgets"
}
```

If `clearPrice` is `true`, the current saved price and currency are cleared while existing historical price points remain.

### Price history / item details

```http
GET /api/items/:asin/history?list=gadgets
```

### Bulk item management

```http
POST /api/items/bulk
```

Example priority update:

```json
{
  "action": "priority",
  "priority": "high",
  "items": [
    {
      "asin": "B0XXXXXXXX",
      "list": "gadgets"
    }
  ]
}
```

Supported actions:

```text
priority
move
clear-price
delete
```

Move example:

```json
{
  "action": "move",
  "targetList": "astronomy",
  "items": [
    {
      "asin": "B0XXXXXXXX",
      "list": "gadgets"
    }
  ]
}
```

If the target wishlist already contains the same ASIN, that item is skipped rather than overwriting data.

### Budget Auto Pick compatibility endpoint

The current web UI performs Budget Auto Pick in the browser using the already-loaded item list, so it does not need a token-bearing API request.

The authenticated `POST /api/budget-pick` endpoint remains available for compatibility with older clients, but the current Scriptable workflow no longer calls it.

### Backup / Export

```http
GET /api/export?format=json
GET /api/export?format=csv
```

Both require the sync token.

## Setup

### Install dependencies

```bash
npm install
```

### Configure D1

`wrangler.jsonc` should contain the D1 binding:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "wishlist-db",
    "database_id": "YOUR_D1_DATABASE_ID",
    "migrations_dir": "migrations"
  }
]
```

Apply migrations when using Wrangler:

```bash
npx wrangler d1 migrations apply wishlist-db --remote
```

If migrations were previously run manually in the Cloudflare D1 Console, inspect the pending migration list before applying older migrations.

For the priority release specifically, `item_preferences` is also created safely by the Worker at runtime, so the site can deploy without waiting for `0004` to be applied.

### Configure the sync token

```bash
npx wrangler secret put SYNC_TOKEN
```

Use the same token in Scriptable. The script stores it in the iOS Keychain under:

```text
amazon-wishlist-sync-token
```

### Scriptable

Copy:

```text
scriptable/Wishlist Sync.js
```

into Scriptable on the iPhone.

The Shortcut should pass its Share Sheet input to Scriptable. Keeping **Run in App** enabled is the most reliable setup for interactive prompts and management tables.

## Development

```bash
npm run dev
```

Useful health check:

```text
/api/health
```

A healthy deployed Worker reports that D1 and `SYNC_TOKEN` are configured.

## Security

- Read-only wishlist pages and item browsing are intentionally separate from management actions.
- Management routes require `SYNC_TOKEN`.
- The token is not stored in the frontend.
- Scriptable stores the token in iOS Keychain.
- Never commit the real token to GitHub.

## Amazon parsing notes

Amazon HTML is not a stable API. The Scriptable scraper deliberately keeps detection strict:

- Product images prefer the primary product image only.
- Page-wide recommendation/ad image fallbacks are avoided.
- Price parsing is limited to trusted current-product price regions.
- If a trustworthy price is unavailable, the script asks for manual input.
- An empty manual price clears the current saved price.

This is intentionally more conservative than guessing the wrong product image or price.

## Roadmap ideas

Potential next steps:

- Restore from JSON backup
- Purchased / Archive state
- Notes and tags
- Saved filters
- Price-drop sorting and filters
- Needs Attention view for stale/missing metadata


## UI notes

- The summary bar uses a single-pass scrolling ticker so it never duplicates the visible statistics or widens the page on mobile.
- Budget Auto Pick is available on the web under **Settings & Tools → Budget Auto Pick**. It is intentionally not exposed in Scriptable.


## v6.2 polish

- Stabilized modal layout on iPhone-sized screens.
- Made dialog opening/closing motion more visible and reliable in Safari.
- Replaced the sticky settings sun-like glyph with the same gear icon as the main Settings button.
- Bumped the PWA shell cache so the updated CSS and JavaScript replace v6 cleanly.


## v6.2.1 polish

- Prevents Safari from automatically showing a blue focus ring on the close button when a modal first opens.
- Initial modal focus now lands on the dialog shell while normal keyboard focus indicators remain available when tabbing to controls.
- Bumped the PWA shell cache so the updated JavaScript and CSS replace v6.2 cleanly.

## v6.4 design polish

The v6.4 UI pass focuses on visual hierarchy and faster browsing without changing the API or database schema.

- Priority is visible at a glance with a slim card-edge indicator.
- Price changes are shown beside the saved price when a previous price point exists.
- Wishlist identity gets a small deterministic accent used on list badges and result visuals.
- Priority filter chips use clearer multi-select states.
- Settings includes Comfortable and Compact card view modes; the selected mode is saved in the URL with `view=compact`.
- The sticky search/filter/settings toolbar is smaller and less intrusive.
- Item Details keeps Previous / Next / Close controls pinned while the modal content scrolls.
- Price History uses an explicit polyline chart with point markers, grid guides, and a selected-point guide.
- Opening a card and the product visual use coordinated motion for a more continuous card-to-modal feel.
- Item cards have more deliberate desktop hover and touch press feedback.
- Item Details supports horizontal swipe navigation on touch devices, except when a gesture starts on the interactive price chart or another control.
- The PWA cache is bumped to `wishlist-shell-v6-4`.

No Worker, Scriptable, D1 schema, or migration changes are required for v6.4.
