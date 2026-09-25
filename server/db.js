const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'studio.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  logline TEXT DEFAULT '',
  synopsis TEXT DEFAULT '',
  style_bible TEXT DEFAULT '',
  status TEXT DEFAULT 'dang_phat_trien',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  want TEXT DEFAULT '',
  need TEXT DEFAULT '',
  contradiction TEXT DEFAULT '',
  visual_dna TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scenes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  seq_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  location TEXT DEFAULT '',
  time_of_day TEXT DEFAULT '',
  synopsis TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scene_id INTEGER NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  shot_number INTEGER NOT NULL DEFAULT 1,
  shot_size TEXT DEFAULT '',
  camera TEXT DEFAULT '',
  description TEXT DEFAULT '',
  emotion_inner TEXT DEFAULT '',
  emotion_mask TEXT DEFAULT '',
  emotion_leak TEXT DEFAULT '',
  broll_notes TEXT DEFAULT '',
  duration_sec REAL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shot_id INTEGER NOT NULL REFERENCES shots(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  prompt_type TEXT DEFAULT 'seedance',
  content TEXT DEFAULT '',
  char_count INTEGER DEFAULT 0,
  is_final INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL DEFAULT 'prop',
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  first_appearance TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS continuity_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'setup',
  description TEXT DEFAULT '',
  related_scene_id INTEGER REFERENCES scenes(id) ON DELETE SET NULL,
  resolved INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

module.exports = db;
