CREATE TABLE IF NOT EXISTS wishlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  amazon_list_id TEXT UNIQUE,
  amazon_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP INDEX IF EXISTS idx_items_created_at;
DROP TABLE IF EXISTS items;

CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wishlist_id INTEGER NOT NULL,
  asin TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (wishlist_id)
    REFERENCES wishlists(id)
    ON DELETE CASCADE,

  UNIQUE (wishlist_id, asin)
);

CREATE INDEX IF NOT EXISTS idx_items_wishlist
ON items(wishlist_id, created_at DESC);
