-- Схема geo.db (SQLite). База — производная от observations.jsonl и queries.csv, пересобирается скриптом.
-- Подробности и определения метрик: docs/geo-architecture.md.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS client (id TEXT PRIMARY KEY, name TEXT NOT NULL, domain TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS brand (
  id INTEGER PRIMARY KEY, client_id TEXT NOT NULL REFERENCES client(id),
  name TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('client','competitor','other')),
  domain TEXT, aliases_json TEXT NOT NULL DEFAULT '[]',
  UNIQUE (client_id, name));

CREATE TABLE IF NOT EXISTS query (
  id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES client(id),
  text TEXT NOT NULL, lang TEXT NOT NULL CHECK (lang IN ('ru','uz','en')),
  intent TEXT NOT NULL CHECK (intent IN ('supplier','compare','price','local','info')),
  region TEXT, priority INTEGER NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  status TEXT NOT NULL CHECK (status IN ('pending','approved','retired')));

CREATE TABLE IF NOT EXISTS model (
  id TEXT PRIMARY KEY, provider TEXT NOT NULL, api_model TEXT NOT NULL,
  search_tool TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1);

CREATE TABLE IF NOT EXISTS run (
  id INTEGER PRIMARY KEY, client_id TEXT NOT NULL REFERENCES client(id),
  week TEXT NOT NULL,
  started_at TEXT, finished_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('running','done','partial','failed')),
  est_cost_usd REAL, actual_cost_usd REAL, config_json TEXT NOT NULL,
  UNIQUE (client_id, week));

CREATE TABLE IF NOT EXISTS answer (
  id INTEGER PRIMARY KEY, run_id INTEGER NOT NULL REFERENCES run(id),
  query_id TEXT NOT NULL REFERENCES query(id), model_id TEXT NOT NULL REFERENCES model(id),
  attempt INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok','empty','error')), error TEXT,
  api_model_version TEXT, latency_ms INTEGER, snippet TEXT,
  client_mentioned INTEGER NOT NULL DEFAULT 0,
  needs_review INTEGER NOT NULL DEFAULT 0,
  UNIQUE (run_id, query_id, model_id, attempt));

CREATE TABLE IF NOT EXISTS mention (
  answer_id INTEGER NOT NULL REFERENCES answer(id), brand_id INTEGER NOT NULL REFERENCES brand(id),
  position INTEGER NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('text','domain_cited','both')),
  PRIMARY KEY (answer_id, brand_id));

CREATE TABLE IF NOT EXISTS citation (
  id INTEGER PRIMARY KEY, answer_id INTEGER NOT NULL REFERENCES answer(id),
  url TEXT NOT NULL, domain TEXT NOT NULL, rank INTEGER, title TEXT);

CREATE TABLE IF NOT EXISTS domain (
  domain TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('own','competitor','marketplace','classifieds',
        'maps','social','media','directory','forum','reviews','other')),
  note TEXT);

CREATE TABLE IF NOT EXISTS task (
  id INTEGER PRIMARY KEY, client_id TEXT NOT NULL REFERENCES client(id),
  kind TEXT NOT NULL CHECK (kind IN ('directory','pr','review_request','onsite')),
  target_domain TEXT, payload_path TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','done','rejected')),
  created_at TEXT NOT NULL, decided_at TEXT, decided_by TEXT);

CREATE INDEX IF NOT EXISTS ix_answer_run ON answer(run_id, model_id);
CREATE INDEX IF NOT EXISTS ix_citation_domain ON citation(domain);

-- Доля ответов с упоминанием клиента по неделям и моделям
-- (Фаза 3 добавит интервалы Уилсона, Share of Voice и динамику).
CREATE VIEW IF NOT EXISTS v_visibility_weekly AS
SELECT r.client_id, r.week, a.model_id,
       COUNT(*)                                   AS answers_ok,
       SUM(a.client_mentioned)                    AS answers_with_client,
       1.0 * SUM(a.client_mentioned) / COUNT(*)   AS visibility_score
FROM answer a JOIN run r ON r.id = a.run_id
WHERE a.status = 'ok'
GROUP BY r.client_id, r.week, a.model_id;
