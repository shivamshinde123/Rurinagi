export type Screen = 'today' | 'tasks' | 'focus' | 'history' | 'insights' | 'settings';
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

export interface FocusDay { date: string; label: string; seconds: number; sessions: number }
export interface ProjectFocus { projectId: string | null; seconds: number; sessions: number }
export interface FocusInsights {
  days: FocusDay[];
  weekSeconds: number;
  previousWeekSeconds: number;
  weekChangePercent: number | null;
  sessions: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  projects: ProjectFocus[];
}

export const policyUrls = {
  privacy: 'https://shivamshinde123.github.io/Rurinagi/privacy.html',
  terms: 'https://shivamshinde123.github.io/Rurinagi/terms.html',
} as const;

export function isAllowedPolicyUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return !url.username && !url.password && Object.values(policyUrls).includes(`${url.origin}${url.pathname}` as typeof policyUrls[keyof typeof policyUrls]);
  } catch {
    return false;
  }
}

export const defaultSettings: Settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  notifications: false,
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
      { id: 'project-career', name: 'Career', color: '#315F4D' },
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

export function deleteProject(state: AppState, projectId: string): AppState {
  if (!state.projects.some((project) => project.id === projectId)) return state;
  if (['running', 'paused'].includes(state.timer.status) && state.tasks.some((task) => task.id === state.timer.taskId && task.projectId === projectId)) return state;
  return {
    ...state,
    projects: state.projects.filter((project) => project.id !== projectId),
    tasks: state.tasks.filter((task) => task.projectId !== projectId),
  };
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

export function buildFocusInsights(state: AppState, now = new Date()): FocusInsights {
  const dayAt = (offset: number): Date => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = dayAt(index - 6);
    const value = localDate(date);
    const sessions = state.sessions.filter((session) => localDate(new Date(session.endedAt)) === value);
    return { date: value, label: date.toLocaleDateString(undefined, { weekday: 'short' }), seconds: sessions.reduce((sum, session) => sum + session.actualSeconds, 0), sessions: sessions.length };
  });
  const weekDates = new Set(days.map((day) => day.date));
  const previousDates = new Set(Array.from({ length: 7 }, (_, index) => localDate(dayAt(index - 13))));
  const recentSessions = state.sessions.filter((session) => weekDates.has(localDate(new Date(session.endedAt))));
  const weekSeconds = days.reduce((sum, day) => sum + day.seconds, 0);
  const previousWeekSeconds = state.sessions.filter((session) => previousDates.has(localDate(new Date(session.endedAt)))).reduce((sum, session) => sum + session.actualSeconds, 0);
  const projectMap = new Map<string | null, ProjectFocus>();
  for (const session of recentSessions) {
    const current = projectMap.get(session.projectId) ?? { projectId: session.projectId, seconds: 0, sessions: 0 };
    current.seconds += session.actualSeconds; current.sessions += 1; projectMap.set(session.projectId, current);
  }
  const focusedDates = new Set(state.sessions.map((session) => localDate(new Date(session.endedAt))));
  let cursor = dayAt(0);
  if (!focusedDates.has(localDate(cursor))) cursor = dayAt(-1);
  let currentStreak = 0;
  while (focusedDates.has(localDate(cursor))) { currentStreak += 1; cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1, 12); }
  let longestStreak = 0; let runningStreak = 0; let previous = '';
  for (const date of [...focusedDates].sort()) {
    const expected = previous ? localDate(new Date(Number(previous.slice(0, 4)), Number(previous.slice(5, 7)) - 1, Number(previous.slice(8, 10)) + 1, 12)) : '';
    runningStreak = date === expected ? runningStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, runningStreak); previous = date;
  }
  return {
    days, weekSeconds, previousWeekSeconds,
    weekChangePercent: previousWeekSeconds ? Math.round(((weekSeconds - previousWeekSeconds) / previousWeekSeconds) * 100) : null,
    sessions: recentSessions.length,
    completionRate: recentSessions.length ? Math.round((recentSessions.filter((session) => session.outcome === 'completed').length / recentSessions.length) * 100) : 0,
    currentStreak, longestStreak,
    projects: [...projectMap.values()].sort((a, b) => b.seconds - a.seconds),
  };
}
