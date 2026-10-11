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
  const validated = validateState(JSON.parse(row.json));
  const state = upgradeState(validated);
  const recovered = recoverState(state);
  if (JSON.stringify(recovered) !== JSON.stringify(validated)) saveState(recovered);
  return recovered;
}

export function saveState(input: unknown): AppState {
  const state = upgradeState(validateState(input));
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
  if (input.projects.length > 500 || input.tasks.length > 10_000 || input.sessions.length > 100_000) throw new Error('Imported data exceeds supported limits.');
  for (const project of input.projects) {
    if (!isObject(project) || !validId(project.id) || !validText(project.name, 120) || !validText(project.color, 32)) throw new Error('Invalid project record.');
  }
  for (const task of input.tasks) {
    if (!isObject(task) || !validId(task.id) || !validText(task.title, 500) || !validText(task.description, MAX_TEXT)
      || !nullableId(task.projectId) || !oneOf(task.priority, ['low', 'normal', 'high'])
      || !nullableDateOnly(task.dueDate) || !integerBetween(task.estimateSessions, 1, 20)
      || !oneOf(task.status, ['inbox', 'planned', 'active', 'waiting', 'complete', 'archived'])
      || !integerBetween(task.sortOrder, 0, 1_000_000) || typeof task.isToday !== 'boolean'
      || !validDateTime(task.createdAt) || !nullableDateTime(task.completedAt)) throw new Error('Invalid task record.');
  }
  for (const session of input.sessions) {
    if (!isObject(session) || !validId(session.id) || !nullableId(session.taskId) || !nullableId(session.projectId)
      || !integerBetween(session.plannedSeconds, 1, 7_200) || !integerBetween(session.actualSeconds, 1, 7_200)
      || !validDateTime(session.startedAt) || !validDateTime(session.endedAt)
      || !oneOf(session.outcome, ['completed', 'partial', 'interrupted']) || !validText(session.note, MAX_TEXT)) throw new Error('Invalid session record.');
  }
  const timer = input.timer;
  if (!oneOf(timer.mode, ['focus', 'short-break', 'long-break']) || !oneOf(timer.status, ['idle', 'running', 'paused', 'completed'])
    || !nullableId(timer.taskId) || !integerBetween(timer.durationSeconds, 1, 7_200)
    || !integerBetween(timer.remainingSeconds, 0, timer.durationSeconds as number)
    || !nullableDateTime(timer.startedAt) || !nullableDateTime(timer.endsAt)
    || !integerBetween(timer.cycleCount, 0, 1_000_000)) throw new Error('Invalid timer data.');
  const settings = input.settings;
  if (!integerBetween(settings.focusMinutes, 1, 120) || !integerBetween(settings.shortBreakMinutes, 1, 120)
    || !integerBetween(settings.longBreakMinutes, 1, 120) || !integerBetween(settings.sessionsBeforeLongBreak, 1, 120)
    || !boolean(settings.autoStartBreaks) || !boolean(settings.notifications) || !boolean(settings.sound)
    || !oneOf(settings.theme, ['light', 'dark', 'system']) || !boolean(settings.reducedMotion)
    || !boolean(settings.compactDensity) || !boolean(settings.startWithWindows) || !boolean(settings.confirmDiscard)
    || !validText(settings.quickCaptureShortcut, 120)) throw new Error('Invalid settings data.');
  if (!validText(input.quickNote, MAX_TEXT) || !validText(input.sessionNote, MAX_TEXT)) throw new Error('Invalid note data.');
  return structuredClone(input) as unknown as AppState;
}

function upgradeState(state: AppState): AppState {
  const projects = state.projects.map((project) => project.id === 'project-career' && project.color.toLowerCase() === '#456fae'
    ? { ...project, color: '#315F4D' }
    : project);
  return projects.some((project, index) => project !== state.projects[index]) ? { ...state, projects } : state;
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

function nullableId(value: unknown): boolean {
  return value === null || validId(value);
}

function integerBetween(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function boolean(value: unknown): boolean {
  return typeof value === 'boolean';
}

function oneOf(value: unknown, options: readonly string[]): boolean {
  return typeof value === 'string' && options.includes(value);
}

function validDateTime(value: unknown): boolean {
  return typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value));
}

function nullableDateTime(value: unknown): boolean {
  return value === null || validDateTime(value);
}

function nullableDateOnly(value: unknown): boolean {
  return value === null || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

