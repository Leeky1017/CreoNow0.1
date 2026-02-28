# Appendix B · SQLite Schema Dump

> Source: Notion local DB page `4efb9912-8dd2-4332-8c8d-e6ec073ea64a`

> Applied: 21/22 migrations · Skipped: 0008_user_memory_vec.sql（uses vec0 / sqlite-vec extension）

```
-- Generated schema dump (in-memory)
-- Source migrations: apps/desktop/main/src/db/migrations

-- [index] idx_chapter_synopses_project_order (table=chapter_synopses)
CREATE INDEX idx_chapter_synopses_project_order
  ON chapter_synopses(project_id, chapter_order DESC, updated_at DESC, synopsis_id ASC)

-- [index] idx_custom_skills_scope_project (table=custom_skills)
CREATE INDEX idx_custom_skills_scope_project
  ON custom_skills(scope, project_id, updated_at)

-- [index] idx_document_branches_document_created (table=document_branches)
CREATE INDEX idx_document_branches_document_created
  ON document_branches (document_id, created_at DESC, branch_id ASC)

-- [index] idx_document_merge_conflicts_session (table=document_merge_conflicts)
CREATE INDEX idx_document_merge_conflicts_session
  ON document_merge_conflicts (merge_session_id, conflict_index ASC, conflict_id ASC)

-- [index] idx_document_versions_document_created (table=document_versions)
CREATE INDEX idx_document_versions_document_created
  ON document_versions (document_id, created_at DESC, version_id ASC)

-- [index] idx_documents_project_sort (table=documents)
CREATE INDEX idx_documents_project_sort
  ON documents (project_id, sort_order ASC, updated_at DESC, document_id ASC)

-- [index] idx_documents_project_updated (table=documents)
CREATE INDEX idx_documents_project_updated
  ON documents (project_id, updated_at DESC, document_id ASC)

-- [index] idx_generation_traces_document_created (table=generation_traces)
CREATE INDEX idx_generation_traces_document_created
  ON generation_traces(document_id, created_at DESC, trace_id ASC)

-- [index] idx_generation_traces_project_created (table=generation_traces)
CREATE INDEX idx_generation_traces_project_created
  ON generation_traces(project_id, created_at DESC, trace_id ASC)

-- [index] idx_kg_entities_project (table=kg_entities)
CREATE INDEX idx_kg_entities_project
  ON kg_entities(project_id)

-- [index] idx_kg_entities_project_context_level (table=kg_entities)
CREATE INDEX idx_kg_entities_project_context_level
  ON kg_entities(project_id, ai_context_level)

-- [index] idx_kg_entities_project_name (table=kg_entities)
CREATE INDEX idx_kg_entities_project_name
  ON kg_entities(project_id, name)

-- [index] idx_kg_entities_project_type (table=kg_entities)
CREATE INDEX idx_kg_entities_project_type
  ON kg_entities(project_id, type)

-- [index] idx_kg_entities_project_type_name (table=kg_entities)
CREATE UNIQUE INDEX idx_kg_entities_project_type_name
  ON kg_entities(project_id, type, lower(trim(name)))

-- [index] idx_kg_relations_project (table=kg_relations)
CREATE INDEX idx_kg_relations_project
  ON kg_relations(project_id)

-- [index] idx_kg_relations_source (table=kg_relations)
CREATE INDEX idx_kg_relations_source
  ON kg_relations(project_id, source_entity_id)

-- [index] idx_kg_relations_target (table=kg_relations)
CREATE INDEX idx_kg_relations_target
  ON kg_relations(project_id, target_entity_id)

-- [index] idx_memory_episodes_last_recalled (table=memory_episodes)
CREATE INDEX idx_memory_episodes_last_recalled
  ON memory_episodes(last_recalled_at DESC, episode_id ASC)

-- [index] idx_memory_episodes_project_created (table=memory_episodes)
CREATE INDEX idx_memory_episodes_project_created
  ON memory_episodes(project_id, created_at DESC, episode_id ASC)

-- [index] idx_memory_episodes_scene_type (table=memory_episodes)
CREATE INDEX idx_memory_episodes_scene_type
  ON memory_episodes(scene_type, created_at DESC, episode_id ASC)

-- [index] idx_memory_semantic_placeholders_project_updated (table=memory_semantic_placeholders)
CREATE INDEX idx_memory_semantic_placeholders_project_updated
  ON memory_semantic_placeholders(project_id, updated_at DESC, rule_id ASC)

-- [index] idx_projects_archived_updated (table=projects)
CREATE INDEX idx_projects_archived_updated
  ON projects (archived_at, updated_at DESC, project_id ASC)

-- [index] idx_skill_feedback_evidence_action (table=skill_feedback)
CREATE INDEX idx_skill_feedback_evidence_action
  ON skill_feedback(evidence_ref, action, created_at DESC)

-- [index] idx_trace_feedback_trace_created (table=trace_feedback)
CREATE INDEX idx_trace_feedback_trace_created
  ON trace_feedback(trace_id, created_at DESC, feedback_id ASC)

-- [index] idx_user_memory_document (table=user_memory)
CREATE INDEX idx_user_memory_document
  ON user_memory(document_id, updated_at DESC, memory_id ASC)
  WHERE document_id IS NOT NULL

-- [index] idx_user_memory_learned_source (table=user_memory)
CREATE UNIQUE INDEX idx_user_memory_learned_source
  ON user_memory(origin, scope, project_id, document_id, source_ref)
  WHERE origin = 'learned' AND source_ref IS NOT NULL

-- [index] idx_user_memory_project (table=user_memory)
CREATE INDEX idx_user_memory_project
  ON user_memory(project_id, updated_at DESC, memory_id ASC)

-- [index] idx_user_memory_scope_type_updated (table=user_memory)
CREATE INDEX idx_user_memory_scope_type_updated
  ON user_memory(scope, type, updated_at DESC, memory_id ASC)

-- [table] chapter_synopses
CREATE TABLE chapter_synopses (
  synopsis_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  chapter_order INTEGER NOT NULL,
  synopsis_text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
  UNIQUE (project_id, document_id)
)

-- [table] custom_skills
CREATE TABLE custom_skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('selection', 'document')),
  context_rules TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'project')),
  project_id TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)

-- [table] document_branches
CREATE TABLE document_branches (
  branch_id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  name TEXT NOT NULL,
  base_snapshot_id TEXT NOT NULL,
  head_snapshot_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(document_id, name),
  FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
  FOREIGN KEY (base_snapshot_id) REFERENCES document_versions(version_id),
  FOREIGN KEY (head_snapshot_id) REFERENCES document_versions(version_id)
)

-- [table] document_merge_conflicts
CREATE TABLE document_merge_conflicts (
  conflict_id TEXT PRIMARY KEY,
  merge_session_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  source_branch_name TEXT NOT NULL,
  target_branch_name TEXT NOT NULL,
  conflict_index INTEGER NOT NULL,
  base_text TEXT NOT NULL,
  ours_text TEXT NOT NULL,
  theirs_text TEXT NOT NULL,
  selected_resolution TEXT,
  manual_text TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (merge_session_id) REFERENCES document_merge_sessions(merge_session_id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
)

-- [table] document_merge_sessions
CREATE TABLE document_merge_sessions (
  merge_session_id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  source_branch_name TEXT NOT NULL,
  target_branch_name TEXT NOT NULL,
  merged_template_text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
)

-- [table] document_versions
CREATE TABLE document_versions (
  version_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  content_json TEXT NOT NULL,
  content_text TEXT NOT NULL,
  content_md TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  content_hash TEXT NOT NULL DEFAULT '',
  diff_format TEXT NOT NULL DEFAULT '',
  diff_text TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
  FOREIGN KEY(document_id) REFERENCES documents(document_id) ON DELETE CASCADE
)

-- [table] documents
CREATE TABLE documents (
  document_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,
  content_text TEXT NOT NULL,
  content_md TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  content_hash TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'chapter',
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_id TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)

-- [table] documents_fts
CREATE VIRTUAL TABLE documents_fts USING fts5(
  title,
  content_text,
  document_id UNINDEXED,
  project_id UNINDEXED
)

-- [table] generation_traces
CREATE TABLE generation_traces (
  trace_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL UNIQUE,
  execution_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  model TEXT NOT NULL,
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  project_id TEXT,
  document_id TEXT,
  started_at INTEGER NOT NULL,
  completed_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
)

-- [table] judge_models
CREATE TABLE judge_models (
  model_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  updated_at INTEGER NOT NULL
)

-- [table] kg_entities
CREATE TABLE kg_entities (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('character', 'location', 'event', 'item', 'faction')),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  attributes_json TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  ai_context_level TEXT NOT NULL DEFAULT 'when_detected',
  aliases TEXT NOT NULL DEFAULT '[]',
  last_seen_state TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)

-- [table] kg_relation_types
CREATE TABLE kg_relation_types (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  builtin INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(project_id, key),
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)

-- [table] kg_relations
CREATE TABLE kg_relations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  source_entity_id TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
  FOREIGN KEY(source_entity_id) REFERENCES kg_entities(id) ON DELETE CASCADE,
  FOREIGN KEY(target_entity_id) REFERENCES kg_entities(id) ON DELETE CASCADE
)

-- [table] memory_episodes
CREATE TABLE memory_episodes (
  episode_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  version INTEGER NOT NULL,
  chapter_id TEXT NOT NULL,
  scene_type TEXT NOT NULL,
  skill_used TEXT NOT NULL,
  input_context TEXT NOT NULL,
  candidates_json TEXT NOT NULL,
  selected_index INTEGER NOT NULL,
  final_text TEXT NOT NULL,
  explicit_feedback TEXT,
  edit_distance REAL NOT NULL,
  implicit_signal TEXT NOT NULL,
  implicit_weight REAL NOT NULL,
  importance REAL NOT NULL,
  recall_count INTEGER NOT NULL DEFAULT 0,
  last_recalled_at INTEGER,
  compressed INTEGER NOT NULL DEFAULT 0,
  user_confirmed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)

-- [table] memory_semantic_placeholders
CREATE TABLE memory_semantic_placeholders (
  rule_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  version INTEGER NOT NULL,
  rule_text TEXT NOT NULL,
  confidence REAL NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)

-- [table] projects
CREATE TABLE projects (
  project_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  archived_at INTEGER,
  type TEXT NOT NULL DEFAULT 'novel',
  description TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'outline',
  target_word_count INTEGER,
  target_chapter_count INTEGER,
  narrative_person TEXT NOT NULL DEFAULT 'first',
  language_style TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  default_skill_set_id TEXT,
  knowledge_graph_id TEXT
)

-- [table] settings
CREATE TABLE settings (
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (scope, key)
)

-- [table] skill_feedback
CREATE TABLE skill_feedback (
  feedback_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  action TEXT NOT NULL,
  evidence_ref TEXT,
  ignored INTEGER NOT NULL,
  ignored_reason TEXT,
  created_at INTEGER NOT NULL
)

-- [table] skills
CREATE TABLE skills (
  skill_id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL,
  valid INTEGER NOT NULL,
  error_code TEXT,
  error_message TEXT,
  updated_at INTEGER NOT NULL
)

-- [table] stats_daily
CREATE TABLE stats_daily (
  date TEXT PRIMARY KEY,
  words_written INTEGER NOT NULL,
  writing_seconds INTEGER NOT NULL,
  skills_used INTEGER NOT NULL,
  documents_created INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)

-- [table] trace_feedback
CREATE TABLE trace_feedback (
  feedback_id TEXT PRIMARY KEY,
  trace_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('accept', 'reject', 'partial')),
  evidence_ref TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (trace_id) REFERENCES generation_traces(trace_id) ON DELETE CASCADE
)

-- [table] user_memory
CREATE TABLE user_memory (
  memory_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  scope TEXT NOT NULL,
  project_id TEXT,
  origin TEXT NOT NULL,
  source_ref TEXT,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  document_id TEXT DEFAULT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
)

-- [trigger] documents_ad_fts
CREATE TRIGGER documents_ad_fts AFTER DELETE ON documents BEGIN
  DELETE FROM documents_fts WHERE rowid = old.rowid;
END

-- [trigger] documents_ai_fts
CREATE TRIGGER documents_ai_fts AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(rowid, title, content_text, document_id, project_id)
  VALUES (new.rowid, new.title, new.content_text, new.document_id, new.project_id);
END

-- [trigger] documents_au_fts
CREATE TRIGGER documents_au_fts AFTER UPDATE ON documents BEGIN
  DELETE FROM documents_fts WHERE rowid = old.rowid;
  INSERT INTO documents_fts(rowid, title, content_text, document_id, project_id)
  VALUES (new.rowid, new.title, new.content_text, new.document_id, new.project_id);
END
```
