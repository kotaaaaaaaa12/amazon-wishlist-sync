CREATE TABLE IF NOT EXISTS item_preferences (
  item_id INTEGER PRIMARY KEY,
  priority TEXT NOT NULL DEFAULT 'none'
    CHECK (priority IN ('none', 'low', 'medium', 'high')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (item_id)
    REFERENCES items(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_item_preferences_priority
ON item_preferences(priority);
