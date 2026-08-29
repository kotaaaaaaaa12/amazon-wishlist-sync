CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'JPY',
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (item_id)
    REFERENCES items(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_price_history_item_recorded
ON price_history(
  item_id,
  recorded_at DESC,
  id DESC
);

-- Use each item's current saved price as the first history point.
-- Existing wishlist items therefore start with a baseline immediately.

INSERT INTO price_history (
  item_id,
  price,
  currency,
  recorded_at
)
SELECT
  i.id,
  i.price,
  COALESCE(i.currency, 'JPY'),
  COALESCE(
    i.price_updated_at,
    i.created_at,
    CURRENT_TIMESTAMP
  )
FROM items AS i
WHERE
  i.price IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM price_history AS ph
    WHERE ph.item_id = i.id
  );
