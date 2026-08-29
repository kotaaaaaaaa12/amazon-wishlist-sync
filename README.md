# amazon-wishlist-sync

A small Cloudflare Worker + Static Assets project for keeping a personal list of Amazon.co.jp product URLs.

This first version intentionally stores only the Amazon URL and ASIN. It does not scrape Amazon product pages or copy product images, titles, or prices.

## Architecture

- Cloudflare Workers: API routes
- Cloudflare Static Assets: frontend
- Cloudflare D1: wishlist data
- GitHub: source repository and deployment source
- iPhone Shortcut: planned client for sending Amazon product URLs

## Local setup

```bash
npm install
npm run dev
```

The site can run without D1. `/api/items` will report that database setup is required.

## Create D1

Create the database:

```bash
npx wrangler d1 create wishlist-db
```

Wrangler will print the database ID. Add this block to `wrangler.jsonc`:

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

Apply the migration:

```bash
npm run db:migrate:remote
```

For local development:

```bash
npm run db:migrate:local
```

## Protect write access

Create a Worker secret:

```bash
npx wrangler secret put SYNC_TOKEN
```

Use the same token from the iPhone Shortcut.

## API

### Health

```http
GET /api/health
```

### List items

```http
GET /api/items
```

### Add an item

```http
POST /api/items
Authorization: Bearer YOUR_SYNC_TOKEN
Content-Type: application/json

{
  "url": "https://www.amazon.co.jp/dp/B0XXXXXXXX"
}
```

### Delete an item

```http
DELETE /api/items/B0XXXXXXXX
Authorization: Bearer YOUR_SYNC_TOKEN
```

## Next step

After the Worker and D1 are deployed, create an iPhone Shortcut that receives an Amazon product URL from the share sheet and sends it to `POST /api/items`.
