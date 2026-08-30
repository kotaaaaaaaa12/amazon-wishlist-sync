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

Tapping a product card morphs the card itself into the item-details modal before leaving the site. The modal can move directly to the previous or next item in the current filtered/sorted result set.

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


## v6.5 card-to-modal morph

v6.5 replaces the subtle image-only continuity effect with a full card-to-modal morph.

- The tapped card becomes the actual modal shell: position, size, and corner radius animate into the centered Item Details dialog.
- Card content fades away while Item Details content fades in during the same movement.
- Closing the modal reverses the morph back into the currently selected card when that card is visible on screen.
- Previous/Next and swipe navigation keep the existing lighter content-swap transition instead of replaying the full morph.
- Random Picker and Budget Auto Pick detail flows keep their normal modal transitions so returning to those tools remains predictable.
- Reduced Motion skips the morph.
- PWA cache is bumped to `wishlist-shell-v6-5`.

No Worker, Scriptable, D1 schema, or migration changes are required for v6.5.

## v6.5.1 card morph stability fix

The card-to-details transition no longer animates the native `<dialog>` geometry. A fixed card-copy overlay performs the morph while the real dialog stays in its final position, which avoids Safari top-layer/layout jumps. The overlay hands off to the real modal with a short crossfade; closing uses the same overlay approach when the destination card is visible.


## v6.5.2
Item Details now closes with a centered shrink-and-fade animation instead of morphing back to the source card. This removes the small end snap visible on Safari/iPhone. Opening card-to-modal morph remains unchanged.


## v6.5.5
- Slowed the Item Details close animation to 430ms.
- Keeps the modal visually steady for the first third, then shrinks and fades smoothly in place.
- Backdrop blur/dimming now fades on the same timing curve.

## v6.5.5 close morph
- Closing Item Details now reverses the card-to-modal opening morph back into the corresponding visible card.
- The destination card is geometry-locked during handoff and revealed underneath the overlay before the overlay disappears, removing the final-frame snap.
- A snapshot of the live modal content rides inside the shrinking shell, then crossfades into the card content.
- If the destination card is not sufficiently visible, the centered Safari-safe close remains the fallback.


## v6.5.6
- Slower reverse close morph.
- Item detail content stays visible longer while the modal moves toward the source card.
- Card content appears later in the return animation to avoid an early modal-to-card visual swap.
- Opening morph is unchanged.


## v6.5.7
- Keeps the loaded product image visible in the cloned destination card during the reverse close morph on iOS Safari.
- Reuses the source card image's already-decoded URL, forces eager rendering in the morph clone, and suppresses the initials fallback only when the source image is confirmed loaded.
- Opening animation, Worker, Scriptable, and D1 schema are unchanged.


## v6.5.8 — compressed modal bridge

The item-detail morph now has an explicit two-stage bridge. Opening moves from the card into a slightly larger, visibly compressed copy of the modal before expanding to the full dialog. Closing is the visual reverse: the full modal progressively compresses into that near-card bridge, then crossfades into the real card (including its product image) for the final landing. No Worker, Scriptable, API, D1, or migration changes are required.


## v6.5.9
- Fixed compressed-modal drift on Safari by centering a full-size modal snapshot inside a dedicated stage.
- The snapshot never reflows while the shell changes size; only uniform scale/opacity animate.
- Opening and closing keep the two-stage Card ↔ compressed modal ↔ full modal behavior.
- No Worker, Scriptable, D1, or schema changes.


## v6.5.12
- Rebuilt Card ↔ Modal motion around transform-only compositor layers.
- The card and modal keep fixed natural layouts; only matrix transforms and opacity animate.
- Removes mid-animation left/top/width/height relayout that caused small Safari stutters at the compressed bridge and final handoff.
- Opening and closing still use the compressed-modal bridge and preserve product images.
- PWA cache: `wishlist-shell-v6-5-12`.


## v6.5.12 morph fix
- Moves the Card ↔ Modal morph portal out of the native `<dialog>` and into a body-level fixed viewport layer.
- The opening modal snapshot is present from the card-size frame instead of appearing halfway through.
- The compressed-modal bridge stays centered on the original card before travelling toward the final modal.
- Live cards are hidden with opacity only; helper classes no longer change their transform before measurement.
- Detail API updates wait until the opening morph handoff finishes, preventing mid-animation content jumps.
- Closing is the exact visual inverse: full modal → compressed modal over the card → card.

## v6.6 — Standalone Item Details animation

Card-to-modal morphing has been retired. Item Details now opens and closes as a stable, centered modal with a soft zoom/fade transition and backdrop blur. Previous/Next detail swapping remains unchanged. No Worker, Scriptable, D1, or migration changes are required.

## v6.7.1 — motion polish

v6.7.1 keeps the stable standalone Item Details modal from v6.6 and adds motion where it improves orientation instead of trying to morph the card into the dialog.

- Filter, search, wishlist, priority, and sort changes now preserve card position with a FLIP-style movement. Removed visible cards fade away and newly visible cards stagger in.
- Item Details uses a staged reveal for the hero, info grid, price-history heading, stats, chart, list, and footer after the modal shell starts opening.
- Previous/Next and swipe navigation keep the dialog shell fixed. The product image travels horizontally while the copy and history content use a lighter directional fade.
- The page behind Item Details subtly scales back while the modal backdrop darkens and blurs, adding depth without changing dialog geometry.
- Comfortable and Compact view modes animate the cards already on screen instead of rebuilding the list, so spacing, image size, typography, and padding transition smoothly.
- `prefers-reduced-motion` disables the added motion.
- PWA cache: `wishlist-shell-v6-7`.

No Worker, Scriptable, D1 schema, or migration changes are required.
