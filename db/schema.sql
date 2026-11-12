CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  client TEXT NOT NULL CHECK (char_length(btrim(client)) BETWEEN 1 AND 80),
  description TEXT NOT NULL CHECK (char_length(btrim(description)) BETWEEN 1 AND 500),
  status TEXT NOT NULL DEFAULT 'Awaiting feedback'
    CHECK (status IN ('Awaiting feedback', 'Approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_feedback (
  id UUID PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  author TEXT NOT NULL CHECK (char_length(btrim(author)) BETWEEN 1 AND 80),
  message TEXT NOT NULL CHECK (char_length(btrim(message)) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_feedback_history
  ON project_feedback (project_id, created_at DESC, id DESC);
