import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  backupDatabase, clearState, closeStorage, exportState, importState,
  loadState, openStorage, saveState, validateState,
} from '../src/main/storage';

test('SQLite persistence, export, import, backup, and clear form a lossless round trip', () => {
  const directory = mkdtempSync(join(tmpdir(), 'rurinagi-storage-'));
  const database = join(directory, 'rurinagi.sqlite');
  const exported = join(directory, 'rurinagi.json');
  const backup = join(directory, 'rurinagi-backup.sqlite');
  try {
    openStorage(database);
    const state = loadState();
    state.quickNote = 'Durable release check';
    state.settings.theme = 'dark';
    saveState(state);
    assert.equal(loadState().quickNote, 'Durable release check');

    exportState(exported);
    backupDatabase(database, backup);
    assert.equal(existsSync(exported), true);
    assert.equal(existsSync(backup), true);

    const cleared = clearState();
    assert.equal(cleared.tasks.length, 0);
    const restored = importState(exported);
    assert.equal(restored.quickNote, 'Durable release check');
    assert.equal(restored.settings.theme, 'dark');
  } finally {
    closeStorage();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('import validation rejects malformed nested data without mutating its input', () => {
  const valid = loadFixture();
  const malformed = structuredClone(valid) as unknown as Record<string, unknown>;
  (malformed.settings as Record<string, unknown>).focusMinutes = 'twenty-five';
  assert.throws(() => validateState(malformed), /Invalid settings data/);
  assert.equal((malformed.settings as Record<string, unknown>).focusMinutes, 'twenty-five');

  const invalidTimer = structuredClone(valid) as unknown as Record<string, unknown>;
  (invalidTimer.timer as Record<string, unknown>).remainingSeconds = -1;
  assert.throws(() => validateState(invalidTimer), /Invalid timer data/);
});

function loadFixture() {
  const directory = mkdtempSync(join(tmpdir(), 'rurinagi-fixture-'));
  try {
    openStorage(join(directory, 'fixture.sqlite'));
    return loadState();
  } finally {
    closeStorage();
    rmSync(directory, { recursive: true, force: true });
  }
}
