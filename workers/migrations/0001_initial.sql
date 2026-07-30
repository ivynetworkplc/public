-- Ivy Network PLC Forms Database — Initial Schema
-- Compatible with Cloudflare D1 (SQLite)

PRAGMA foreign_keys = ON;

-- Generic status used across tables:
-- pending | contacted | resolved | closed | spam | archived

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  country TEXT,
  department TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  privacy_accepted INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT,
  user_agent TEXT,
  source_page TEXT,
  meta_json TEXT
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending',
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  source_page TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  unsubscribed_at TEXT,
  meta_json TEXT
);

CREATE TABLE IF NOT EXISTS partnership_requests (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  country TEXT,
  website TEXT,
  partnership_type TEXT,
  message TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  source_page TEXT,
  meta_json TEXT
);

CREATE TABLE IF NOT EXISTS support_requests (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  ip_hash TEXT,
  user_agent TEXT,
  source_page TEXT,
  meta_json TEXT
);

CREATE TABLE IF NOT EXISTS copyright_reports (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  work_title TEXT,
  work_url TEXT,
  infringing_url TEXT,
  description TEXT NOT NULL,
  ownership_statement TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  source_page TEXT,
  meta_json TEXT
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending',
  full_name TEXT,
  email TEXT,
  rating INTEGER,
  category TEXT,
  message TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  source_page TEXT,
  meta_json TEXT
);

CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending',
  form_type TEXT NOT NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  country TEXT,
  subject TEXT,
  message TEXT,
  payload_json TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  source_page TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  event_type TEXT NOT NULL,
  form_type TEXT,
  submission_id TEXT,
  ip_hash TEXT,
  details TEXT,
  success INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);
