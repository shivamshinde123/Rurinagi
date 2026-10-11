import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmptyState, discardTimer, finishTimer, focusedSecondsToday, formatDuration,
  pauseTimer, recoverState, remainingSeconds, resumeTimer, startBreak, startFocus,
} from '../src/shared/domain';

function stateWithTask() {
  const state = createEmptyState();
  state.tasks.push({
    id: 'task-1', title: 'Write the test', description: '', projectId: null,
    priority: 'normal', dueDate: null, estimateSessions: 1, status: 'planned',
    sortOrder: 0, isToday: true, createdAt: new Date(0).toISOString(), completedAt: null,
  });
  return state;
}

test('start, pause, and resume preserve the timer truth', () => {
  const started = startFocus(stateWithTask(), 'task-1', 1_000);
  assert.equal(started.timer.status, 'running');
  assert.equal(remainingSeconds(started.timer, 61_000), 24 * 60);

  const paused = pauseTimer(started, 61_000);
  assert.equal(paused.timer.status, 'paused');
  assert.equal(paused.timer.remainingSeconds, 24 * 60);
  assert.equal(paused.timer.endsAt, null);

  const resumed = resumeTimer(paused, 121_000);
  assert.equal(resumed.timer.status, 'running');
  assert.equal(remainingSeconds(resumed.timer, 181_000), 23 * 60);
});

test('finishing focus records exactly one durable session', () => {
  const started = startFocus(stateWithTask(), 'task-1', 1_000);
  const finished = finishTimer(started, 'completed', 301_000, 'session-1');
  assert.equal(finished.sessions.length, 1);
  assert.equal(finished.sessions[0]?.actualSeconds, 300);
  assert.equal(finished.sessions[0]?.taskId, 'task-1');
  assert.equal(finished.timer.status, 'completed');
  assert.equal(finished.timer.cycleCount, 1);
});

test('restart recovery finalizes an elapsed focus timer once', () => {
  const started = startFocus(stateWithTask(), 'task-1', 1_000);
  const recovered = recoverState(started, 1_501_000);
  assert.equal(recovered.sessions.length, 1);
  assert.equal(recovered.sessions[0]?.outcome, 'completed');
  assert.equal(recovered.timer.status, 'completed');
  assert.deepEqual(recoverState(recovered, 1_502_000), recovered);
});

test('duration display uses tabular minute and second format', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(-1), '00:00');
});

test('partial focus records elapsed time and preserves the cycle count', () => {
  const started = startFocus(stateWithTask(), 'task-1', 1_000);
  started.sessionNote = 'Kept the useful part';
  const finished = finishTimer(started, 'partial', 121_000, 'partial-1');
  assert.equal(finished.sessions[0]?.actualSeconds, 120);
  assert.equal(finished.sessions[0]?.outcome, 'partial');
  assert.equal(finished.sessions[0]?.note, 'Kept the useful part');
  assert.equal(finished.timer.cycleCount, 0);
  assert.equal(finished.sessionNote, '');
});

test('discarding focus restores active tasks without recording a session', () => {
  const started = startFocus(stateWithTask(), 'task-1', 1_000);
  const discarded = discardTimer(started);
  assert.equal(discarded.timer.status, 'idle');
  assert.equal(discarded.tasks[0]?.status, 'planned');
  assert.equal(discarded.sessions.length, 0);
});

test('break selection follows the configured focus cycle', () => {
  const state = stateWithTask();
  state.settings.shortBreakMinutes = 3;
  state.settings.longBreakMinutes = 12;
  state.settings.sessionsBeforeLongBreak = 2;
  state.timer.cycleCount = 1;
  const shortBreak = startBreak(state, 10_000);
  assert.equal(shortBreak.timer.mode, 'short-break');
  assert.equal(shortBreak.timer.durationSeconds, 180);

  state.timer.cycleCount = 2;
  const longBreak = startBreak(state, 10_000);
  assert.equal(longBreak.timer.mode, 'long-break');
  assert.equal(longBreak.timer.durationSeconds, 720);
});

test('elapsed break recovery returns to idle without creating focus history', () => {
  const state = stateWithTask();
  state.timer.cycleCount = 1;
  const started = startBreak(state, 1_000);
  const recovered = recoverState(started, 1_000 + started.timer.durationSeconds * 1_000);
  assert.equal(recovered.timer.status, 'idle');
  assert.equal(recovered.sessions.length, 0);
  assert.equal(recovered.timer.cycleCount, 1);
});

test('today summary includes every session ending on the local day', () => {
  const state = stateWithTask();
  const now = new Date(2026, 9, 11, 12, 0, 0);
  state.sessions = [
    { id: 'today-1', taskId: 'task-1', projectId: null, plannedSeconds: 1500, actualSeconds: 300, startedAt: new Date(2026, 9, 11, 9).toISOString(), endedAt: new Date(2026, 9, 11, 9, 5).toISOString(), outcome: 'completed', note: '' },
    { id: 'yesterday-1', taskId: 'task-1', projectId: null, plannedSeconds: 1500, actualSeconds: 600, startedAt: new Date(2026, 9, 10, 9).toISOString(), endedAt: new Date(2026, 9, 10, 9, 10).toISOString(), outcome: 'completed', note: '' },
  ];
  assert.equal(focusedSecondsToday(state, now), 300);
});
