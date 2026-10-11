import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmptyState, finishTimer, formatDuration, pauseTimer,
  recoverState, remainingSeconds, resumeTimer, startFocus,
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
