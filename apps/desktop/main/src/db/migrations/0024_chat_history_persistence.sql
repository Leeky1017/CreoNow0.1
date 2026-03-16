-- a1-01: chat history persistence — sessions + messages per project.
-- Why: in-memory Map loses history on restart; SQLite provides durable storage.

CREATE TABLE IF NOT EXISTS chat_sessions (
  id         TEXT    PRIMARY KEY,
  project_id TEXT    NOT NULL,
  title      TEXT    NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_project
  ON chat_sessions (project_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         TEXT    PRIMARY KEY,
  session_id TEXT    NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  project_id TEXT    NOT NULL,
  role       TEXT    NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT    NOT NULL,
  skill_id   TEXT,
  timestamp  INTEGER NOT NULL,
  trace_id   TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session
  ON chat_messages (session_id, timestamp ASC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_project
  ON chat_messages (project_id);
