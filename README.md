# Amazon Wishlist Sync — v6.9 Budget Plan

A personal Amazon.co.jp wishlist dashboard built with Cloudflare Workers, Static Assets, D1, and an iPhone Scriptable workflow.

The project intentionally separates browsing from administration:

- **Web:** browse, search, filter, compare, inspect price history, use Random Pick, Budget Auto Pick, and build purchase plans.
- **Scriptable:** add products, set priorities, bulk-edit items, move items, clear prices, delete items, and export backups.

> Amazon product metadata is collected with best-effort HTML parsing rather than the official Product Advertising API. Amazon can change its markup at any time, so manual price entry remains the fallback when a reliable product price cannot be found.

## v6.9 highlights

v6.9 turns the old manual Budget selection mode into a real **Purchase Plan** workflow.

Select products in Budget mode and press **Done**. Instead of only leaving the selected cards outlined, the site now opens a Budget Plan dialog with totals, planning tools, comparison, and saved plans.

### Budget Plan summary

The summary shows:

- Selected item count
- Total selected price
- Budget
- Remaining amount or amount over budget
- Average selected price
- Buy now total
- Buy now / Later item counts
- Priority breakdown
- Wishlist breakdown

The selected-item list stays editable from the plan. Items can be removed or moved between **Buy now** and **Later**, and every total updates immediately.

### Fill remaining

**Fill remaining** looks for unselected priced items that still fit the remaining budget.

Candidates are ranked using information already available in the dashboard, including priority and price-history signals. You can add suggestions one at a time or use the automatic fill action.

### Get under budget

When the current selection exceeds the budget, **Get under budget** proposes items to remove until the plan fits again.

Lower-priority items are preferred for removal before stronger-priority items. The recommendation is previewed before applying it.

### Optimize

**Optimize** starts from the current plan instead of creating a completely unrelated selection. It attempts to keep useful/high-priority choices while improving the fit inside the configured budget.

The optimized result can be reviewed before replacing the current selection.

### Compare

The **Compare** tab provides a table for the selected products with information such as:

- Price
- Price change
- Priority
- Wishlist
- Buy now / Later stage
- Last Checked

This is intended for deciding between similar purchases without leaving the wishlist site.

### Saved Plans

Budget Plans can be named and stored locally in the browser.

- Storage: `localStorage`
- Storage key: `wishlist-budget-plans-v1`
- Maximum saved plans: 12
- Plans can be loaded or deleted later
- No D1 migration or sync token is required

Saved Plans are device/browser-local. Clearing site data will remove them.

### Copy Summary

The current plan can be copied as text for Notes, Messages, Discord, etc. The copied summary includes the budget, totals, Buy now/Later grouping, item names, prices, priorities, and wishlists.

## Existing dashboard features

### Browsing

- Multiple Amazon wishlists
- Search by title, ASIN, or wishlist
- Sorting by newest/oldest, price, title, wishlist, and priority
- Minimum / maximum price filters
- Price presets
- Price available/missing filter
- Image available/missing filter
- Multi-select Priority filters
- Wishlist pill counts
- Comfortable / Compact view modes
- URL-persisted filter and view state
- Responsive mobile UI
- PWA installation support

### Dashboard statistics

Statistics follow the currently visible result set:

- Items
- Total saved-price value
- Average among items with a valid price
- Price range
- Priced / missing-price count

The statistics use the continuous ticker UI on compact/mobile layouts.

### Item Details

Product cards open a dedicated Item Details modal with a standalone, Safari-stable animation.

It includes:

- Product image
- Product title
- Wishlist
- Priority
- Current saved price
- Price change
- Lowest / highest recorded price
- Last Checked
- ASIN
- Interactive price-history line graph
- Complete price-history list
- Previous / Next navigation through the current filtered/sorted result set
- Horizontal swipe navigation on touch devices
- Explicit **Open on Amazon** action

Opening Amazon is intentionally explicit; tapping a card itself stays inside the dashboard.

### Random Pick

Random Pick uses the current filtered result set. That means Wishlist, Search, Priority, and other active filters determine the pool.

Random results open Item Details first rather than immediately navigating to Amazon.

### Budget Auto Pick

Budget Auto Pick remains separate from manual Budget Plan.

It can automatically search combinations using:

- Budget
- Item count
- Current results / all wishlists / a specific wishlist
- Priority scope

The current web implementation performs this calculation using data already loaded in the browser. `SYNC_TOKEN` is not exposed to the frontend.

## Performance work retained from v6.8+

v6.9 keeps the performance work introduced in v6.8 and the Safari/focus fixes that followed it.

Notable optimizations include:

- Removed old unused Card ↔ Modal morph implementations and legacy CSS
- Reuse normal item-card DOM nodes across search/filter/sort updates
- Cached normalized search strings
- Search commits coalesced to animation frames
- Reduced disappearing-card ghost work during active typing
- Delegated item-card click / keyboard events instead of per-card listeners
- Reused `Intl.Collator`
- Wishlist counts calculated in one pass
- Superseded Item Details requests aborted with `AbortController`
- Short-lived in-memory Item Details response cache
- `content-visibility: auto` for far-off-screen cards where supported
- Service-worker navigation preload where supported

The v6.9 Budget Plan UI is created on demand, so its larger planning interface is not inserted into the DOM until it is needed.

## Price handling

- Scriptable attempts strict current-product price extraction
- Unrelated recommendation/accessory prices are deliberately avoided
- Manual price prompt is used when automatic detection is unreliable
- Leaving manual price blank can send `clearPrice: true`
- Clearing the current price does not delete historical price points
- A new history point is stored only when the incoming price actually changes
- Sharing/syncing an item updates its Last Checked timestamp

Price history is **not** automatic background price monitoring. Prices change in the database when the item is shared/synced again.

## Priority

Priority values:

- `high`
- `medium`
- `low`
- `none`

Priority is primarily edited through Scriptable. The web dashboard displays it, filters by it, sorts by it, and uses it in Budget planning decisions.

## Scriptable management

Directly running **Wishlist Sync** opens the management workflow.

Typical tools include:

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

Bulk management supports selecting multiple items before applying an action.

Budget Auto Pick and Budget Plan are web features, not Scriptable management actions.

## Backup / Export

Scriptable can export:

- **Full JSON Backup** — wishlists, items, priorities, metadata, and price history
- **Items CSV** — flattened item data for spreadsheet use

Default Scriptable backup location:

```text
iCloud Drive / Scriptable / Wishlist Sync Backups
```

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
       │ Authorization: Bearer SYNC_TOKEN
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

## Main repository structure

The full repository normally contains:

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

This **v6.9 update bundle** contains only the frontend files changed for the release plus release notes. It is intended to be copied over an existing working repository.

## Updating to v6.9

Replace:

```text
public/app.js
public/style.css
public/sw.js
```

No changes are required for:

```text
public/index.html
src/worker.js
Scriptable
D1 schema
D1 migrations
```

PWA cache name:

```text
wishlist-shell-v6-9
```

After deployment, Safari/PWA clients may need one normal reload for the new service worker shell to become active.

## D1 migration safety

v6.9 itself requires **no database migration**.

For an existing production database, do not blindly apply old migrations just because Wrangler reports something as pending. Some older databases may have had SQL executed manually in the D1 Console, and older migration files may not accurately represent production history.

Before any future migration work, inspect pending migrations first:

```bash
npx wrangler d1 migrations list wishlist-db --remote
```

If old migrations such as the destructive multi-wishlist migration appear unexpectedly, inspect the database/migration state before applying anything.

## Authentication

Write/management API routes use:

```http
Authorization: Bearer YOUR_SYNC_TOKEN
```

The token belongs in the Worker runtime secret and Scriptable Keychain. It must not be embedded in `public/app.js` or committed to GitHub.

Typical Worker configuration:

```bash
npx wrangler secret put SYNC_TOKEN
```

Scriptable Keychain key:

```text
amazon-wishlist-sync-token
```

## API overview

Common read routes:

```http
GET /api/health
GET /api/wishlists
GET /api/items
GET /api/items?list=gadgets
GET /api/items/:asin/history?list=gadgets
```

Management routes require the sync token. The current web Budget Plan does not require new API routes.

## PWA / service worker

The service worker keeps a network-first static-shell strategy and does not intercept `/api/*` requests as offline data.

This keeps product/wishlist data fresh while still providing an installable PWA shell.

## Security notes

- `SYNC_TOKEN` is not exposed to the browser UI
- Scriptable stores the token in iOS Keychain
- Saved Budget Plans contain wishlist/product planning data and live only in browser `localStorage`
- Never commit a real token to the repository

## v6.9 release scope

Frontend only:

- Purchase Plan / Budget Summary dialog
- Fill remaining
- Get under budget
- Optimize current selection
- Buy now / Later grouping
- Compare tab
- Saved local plans
- Copy Summary
- Editable selected-item list
- `Review plan (N)` entry when a selection already exists
- Preserves v6.8 performance optimizations
- Preserves v6.8.1 touch focus-ring fix

No Worker, Scriptable, D1, or migration changes are required.
