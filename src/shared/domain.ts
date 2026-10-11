export type Screen = 'today' | 'tasks' | 'focus' | 'history' | 'settings';
export type Theme = 'light' | 'dark' | 'system';
export type TaskStatus = 'inbox' | 'planned' | 'active' | 'waiting' | 'complete' | 'archived';
export type Priority = 'low' | 'normal' | 'high';
export type TimerMode = 'focus' | 'short-break' | 'long-break';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
export type SessionOutcome = 'completed' | 'partial' | 'interrupted';

export interface Project { id: string; name: string; color: string }

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string | null;
  priority: Priority;
  dueDate: string | null;
  estimateSessions: number;
  status: TaskStatus;
  sortOrder: number;
  isToday: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface Session {
  id: string;
  taskId: string | null;
  projectId: string | null;
  plannedSeconds: number;
  actualSeconds: number;
  startedAt: string;
  endedAt: string;
  outcome: SessionOutcome;
  note: string;
}

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  taskId: string | null;
  durationSeconds: number;
  remainingSeconds: number;
  startedAt: string | null;
  endsAt: string | null;
  cycleCount: number;
}

export interface Settings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  notifications: boolean;
  sound: boolean;
  theme: Theme;
  reducedMotion: boolean;
  compactDensity: boolean;
  startWithWindows: boolean;
  confirmDiscard: boolean;
  quickCaptureShortcut: string;
}

export interface AppState {
  version: 1;
  projects: Project[];
  tasks: Task[];
  sessions: Session[];
  timer: TimerState;
  settings: Settings;
  quickNote: string;
  sessionNote: string;
}

export const defaultSettings: Settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  notifications: true,
  sound: false,
  theme: 'system',
  reducedMotion: false,
  compactDensity: false,
  startWithWindows: false,
  confirmDiscard: true,
  quickCaptureShortcut: 'CommandOrControl+Shift+Space',
};

export function idleTimer(): TimerState {
  return {
    mode: 'focus', status: 'idle', taskId: null,
    durationSeconds: 25 * 60, remainingSeconds: 25 * 60,
    startedAt: null, endsAt: null, cycleCount: 0,
  };
}

export function createEmptyState(): AppState {
  return {
    version: 1,
    projects: [
      { id: 'project-career', name: 'Career', color: '#456FAE' },
      { id: 'project-rurinagi', name: 'Rurinagi', color: '#7A67B7' },
      { id: 'project-learning', name: 'Learning', color: '#4B8B72' },
    ],
    tasks: [], sessions: [], timer: idleTimer(),
    settings: { ...defaultSettings }, quickNote: '', sessionNote: '',
  };
}

export function createInitialState(now = new Date()): AppState {
  const state = createEmptyState();
  const today = localDate(now);
  const tomorrow = localDate(new Date(now.getTime() + 86_400_000));
  state.tasks = [
    sampleTask('task-resume', 'Tailor résumé for frontend engineer role', 'project-career', 0, true, today, 'high', now),
    sampleTask('task-recruiters', 'Message two recruiters', 'project-career', 1, true, today, 'normal', now),
    sampleTask('task-panel', 'Build the task-detail panel', 'project-rurinagi', 2, true, today, 'high', now),
    sampleTask('task-python', 'Review Python project architecture', 'project-learning', 3, false, tomorrow, 'normal', now),
    sampleTask('task-interview', 'Practice behavioral interview answers', 'project-career', 4, false, tomorrow, 'normal', now),
    sampleTask('task-portfolio', 'Submit portfolio update', 'project-career', 5, false, null, 'low', now),
  ];
  return state;
}

function sampleTask(id: string, title: string, projectId: string, sortOrder: number, isToday: boolean, dueDate: string | null, priority: Priority, now: Date): Task {
  return {
    id, title, description: '', projectId, priority, dueDate,
    estimateSessions: priority === 'high' ? 2 : 1,
    status: isToday ? 'planned' : 'inbox', sortOrder, isToday,
    createdAt: now.toISOString(), completedAt: null,
  };
}

export function localDate(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function remainingSeconds(timer: TimerState, nowMs = Date.now()): number {
  if (timer.status !== 'running' || !timer.endsAt) return Math.max(0, timer.remainingSeconds);
  return Math.max(0, Math.ceil((new Date(timer.endsAt).getTime() - nowMs) / 1000));
}

export function startFocus(state: AppState, taskId: string, nowMs = Date.now()): AppState {
  const durationSeconds = state.settings.focusMinutes * 60;
  return {
    ...state,
    timer: {
      mode: 'focus', status: 'running', taskId, durationSeconds,
      remainingSeconds: durationSeconds, startedAt: new Date(nowMs).toISOString(),
      endsAt: new Date(nowMs + durationSeconds * 1000).toISOString(),
      cycleCount: state.timer.cycleCount,
    },
    sessionNote: '',
    tasks: state.tasks.map((task) => task.id === taskId ? { ...task, status: 'active' } : task),
  };
}

export function startBreak(state: AppState, nowMs = Date.now()): AppState {
  const isLong = state.timer.cycleCount > 0 && state.timer.cycleCount % state.settings.sessionsBeforeLongBreak === 0;
  const durationSeconds = (isLong ? state.settings.longBreakMinutes : state.settings.shortBreakMinutes) * 60;
  return {
    ...state,
    timer: {
      ...state.timer, mode: isLong ? 'long-break' : 'short-break', status: 'running', taskId: null,
      durationSeconds, remainingSeconds: durationSeconds, startedAt: new Date(nowMs).toISOString(),
      endsAt: new Date(nowMs + durationSeconds * 1000).toISOString(),
    },
  };
}

export function pauseTimer(state: AppState, nowMs = Date.now()): AppState {
  if (state.timer.status !== 'running') return state;
  return { ...state, timer: { ...state.timer, status: 'paused', remainingSeconds: remainingSeconds(state.timer, nowMs), endsAt: null } };
}

export function resumeTimer(state: AppState, nowMs = Date.now()): AppState {
  if (state.timer.status !== 'paused') return state;
  return { ...state, timer: { ...state.timer, status: 'running', endsAt: new Date(nowMs + state.timer.remainingSeconds * 1000).toISOString() } };
}

export function finishTimer(state: AppState, outcome: SessionOutcome = 'completed', nowMs = Date.now(), id = `session-${nowMs}`): AppState {
  const timer = state.timer;
  if (timer.mode !== 'focus' || !timer.taskId || !timer.startedAt) {
    return { ...state, timer: { ...idleTimer(), cycleCount: timer.cycleCount } };
  }
  const remaining = remainingSeconds(timer, nowMs);
  const actualSeconds = Math.max(1, Math.min(timer.durationSeconds, timer.durationSeconds - remaining));
  const task = state.tasks.find((candidate) => candidate.id === timer.taskId);
  const session: Session = {
    id, taskId: timer.taskId, projectId: task?.projectId ?? null,
    plannedSeconds: timer.durationSeconds, actualSeconds,
    startedAt: timer.startedAt, endedAt: new Date(nowMs).toISOString(),
    outcome, note: state.sessionNote.trim(),
  };
  return {
    ...state, sessions: [session, ...state.sessions], sessionNote: '',
    timer: { ...timer, status: 'completed', remainingSeconds: 0, endsAt: null, cycleCount: outcome === 'completed' ? timer.cycleCount + 1 : timer.cycleCount },
    tasks: state.tasks.map((candidate) => candidate.id === timer.taskId ? { ...candidate, status: 'planned' } : candidate),
  };
}

export function discardTimer(state: AppState): AppState {
  return {
    ...state, timer: { ...idleTimer(), cycleCount: state.timer.cycleCount }, sessionNote: '',
    tasks: state.tasks.map((task) => task.status === 'active' ? { ...task, status: task.isToday ? 'planned' : 'inbox' } : task),
  };
}

export function recoverState(state: AppState, nowMs = Date.now()): AppState {
  if (state.timer.status !== 'running' || remainingSeconds(state.timer, nowMs) > 0) return state;
  if (state.timer.mode === 'focus') return finishTimer(state, 'completed', nowMs, `recovered-${nowMs}`);
  return { ...state, timer: { ...idleTimer(), cycleCount: state.timer.cycleCount } };
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function focusedSecondsToday(state: AppState, now = new Date()): number {
  const today = localDate(now);
  return state.sessions.filter((session) => localDate(new Date(session.endedAt)) === today).reduce((total, session) => total + session.actualSeconds, 0);
}
