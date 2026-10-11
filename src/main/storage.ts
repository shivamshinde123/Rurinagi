import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { AppState, createEmptyState, createInitialState, recoverState } from '../shared/domain';

const MAX_TEXT = 20_000;
let database: DatabaseSync | null = null;

export function openStorage(path: string): void {
  database = new DatabaseSync(path);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL,
      json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT;
  `);
  database.prepare('INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (?, ?)').run(1, new Date().toISOString());
  const existing = database.prepare('SELECT id FROM app_state WHERE id = 1').get();
  if (!existing) saveState(createInitialState());
}

function db(): DatabaseSync {
  if (!database) throw new Error('Storage is not initialized.');
  return database;
}

export function loadState(): AppState {
  const row = db().prepare('SELECT json FROM app_state WHERE id = 1').get() as { json: string } | undefined;
  if (!row) throw new Error('Application state is missing.');
  const state = validateState(JSON.parse(row.json));
  const recovered = recoverState(state);
  if (JSON.stringify(recovered) !== JSON.stringify(state)) saveState(recovered);
  return recovered;
}

export function saveState(input: unknown): AppState {
  const state = validateState(input);
  const json = JSON.stringify(state);
  const connection = db();
  connection.exec('BEGIN IMMEDIATE');
  try {
    connection.prepare(`
      INSERT INTO app_state(id, version, json, updated_at) VALUES (1, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET version = excluded.version, json = excluded.json, updated_at = excluded.updated_at
    `).run(state.version, json, new Date().toISOString());
    connection.exec('COMMIT');
    return state;
  } catch (error) {
    connection.exec('ROLLBACK');
    throw error;
  }
}

export function clearState(): AppState {
  return saveState(createEmptyState());
}

export function exportState(path: string): void {
  writeFileSync(path, `${JSON.stringify(loadState(), null, 2)}\n`, { encoding: 'utf8', flag: 'w' });
}

export function importState(path: string): AppState {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  return saveState(parsed);
}

export function backupDatabase(source: string, destination: string): void {
  db().exec('PRAGMA wal_checkpoint(FULL)');
  copyFileSync(source, destination);
}

export function closeStorage(): void {
  database?.close();
  database = null;
}

export function validateState(input: unknown): AppState {
  if (!isObject(input) || input.version !== 1) throw new Error('Unsupported Rurinagi data version.');
  if (!Array.isArray(input.projects) || !Array.isArray(input.tasks) || !Array.isArray(input.sessions)) throw new Error('Invalid data collections.');
  if (!isObject(input.timer) || !isObject(input.settings)) throw new Error('Invalid timer or settings data.');
  if (input.projects.length > 500 || input.tasks.length > 10_000 || input.sessions.length > 100_000) throw new Error('Imported data exceeds V1 limits.');
  for (const project of input.projects) {
    if (!isObject(project) || !validId(project.id) || !validText(project.name, 120) || !validText(project.color, 32)) throw new Error('Invalid project record.');
  }
  for (const task of input.tasks) {
    if (!isObject(task) || !validId(task.id) || !validText(task.title, 500) || !validText(task.description, MAX_TEXT)) throw new Error('Invalid task record.');
  }
  for (const session of input.sessions) {
    if (!isObject(session) || !validId(session.id) || !validText(session.note, MAX_TEXT)) throw new Error('Invalid session record.');
  }
  if (!validText(input.quickNote, MAX_TEXT) || !validText(input.sessionNote, MAX_TEXT)) throw new Error('Invalid note data.');
  return structuredClone(input) as unknown as AppState;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validId(value: unknown): boolean {
  return typeof value === 'string' && value.length >= 1 && value.length <= 200;
}

function validText(value: unknown, max: number): boolean {
  return typeof value === 'string' && value.length <= max;
}

