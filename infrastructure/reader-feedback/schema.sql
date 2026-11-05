CREATE TABLE IF NOT EXISTS article_feedback (
  article TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating IN (1, 2, 3)),
  improvement TEXT NOT NULL CHECK (improvement IN ('', 'examples', 'evidence', 'steps', 'relevance')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (article, visitor_hash)
);
CREATE INDEX IF NOT EXISTS feedback_created_at ON article_feedback(created_at);
