Wishlist update: Price History details + Last Checked + clearPrice + Budget Planner + Multi Random

Replace:
- src/worker.js
- public/index.html
- public/app.js
- public/style.css
- Scriptable: Wishlist Sync.js

No new D1 migration is required for this update.

Last Checked reuses the existing items.price_updated_at column. From this version onward it is refreshed every time the Scriptable POST reaches the Worker, whether the price changed, stayed the same, or was cleared.

clearPrice behavior:
- Automatic/manual price available: save/update the price.
- Automatic price missing and manual field left empty: Scriptable sends clearPrice=true.
- Existing saved price is then cleared to NULL by the Worker.
- Price history rows are not deleted when the current price is cleared.

Price History endpoint:
GET /api/items/<ASIN>/history?list=<wishlist-slug>

Random:
- Uses the current filtered result set.
- Allows 1 to 10 random picks, limited by visible item count.

Budget Planner:
- Enter a budget.
- Tap Select items.
- Priced products show Add to budget.
- Selection total and remaining/over-budget amount update immediately.
