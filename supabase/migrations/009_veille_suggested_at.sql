-- Track which veille items have been proactively suggested via Telegram
ALTER TABLE veille_items ADD COLUMN IF NOT EXISTS suggested_at timestamptz;

-- Partial index for the daily suggestion query (new items not yet suggested, score >= 0.7)
CREATE INDEX IF NOT EXISTS idx_veille_suggestion_candidates
  ON veille_items(relevance_score DESC)
  WHERE status = 'new' AND suggested_at IS NULL AND relevance_score >= 0.7;
