import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState, FocusDay, Priority, Project, Screen, Session, Settings, Task, TaskStatus,
  buildFocusInsights, deleteProject, discardTimer, finishTimer, focusedSecondsToday, formatDuration, localDate,
  pauseTimer, policyUrls, remainingSeconds, resumeTimer, startBreak, startFocus,
} from '../shared/domain';

const setupStorageKey = 'rurinagi:first-run-complete';

const screens: { id: Screen; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Today', icon: 'sun' },
  { id: 'tasks', label: 'Tasks', icon: 'check' },
  { id: 'focus', label: 'Focus', icon: 'timer' },
  { id: 'history', label: 'History', icon: 'history' },
  { id: 'insights', label: 'Insights', icon: 'insights' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const priorityLabels: Record<Priority, string> = { low: 'Low priority', normal: 'Normal priority', high: 'High priority' };

export function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [screen, setScreen] = useState<Screen>('today');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [setupComplete, setSetupComplete] = useState(() => localStorage.getItem(setupStorageKey) === '1');
  const capture = location.hash === '#capture';

  const reload = () => window.rurinagi.loadState().then(setState).catch((cause: unknown) => setError(message(cause)));
  useEffect(() => { void reload(); return window.rurinagi.onStateChanged(reload); }, []);

  const commit = async (next: AppState, notice?: string): Promise<boolean> => {
    setState(next);
    if (notice) setToast(notice);
    try {
      await window.rurinagi.saveState(next);
      return true;
    } catch (cause) {
      setToast(`Couldn't save: ${message(cause)}`);
      return false;
    }
  };

  useEffect(() => {
    if (!state) return;
    document.documentElement.dataset.theme = state.settings.theme;
    document.documentElement.dataset.motion = state.settings.reducedMotion ? 'reduced' : 'full';
    document.documentElement.dataset.density = state.settings.compactDensity ? 'compact' : 'comfortable';
  }, [state?.settings]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  if (error) return <main className="fatal"><Logo /><h1>Rurinagi couldn’t open</h1><p>{error}</p><button className="button primary" onClick={() => location.reload()}>Try again</button></main>;
  if (!state) return <main className="loading"><Logo /><p>Opening your day…</p></main>;
  if (capture) return <QuickCapture state={state} commit={commit} />;
  if (!setupComplete) return <FirstRunSetup state={state} commit={commit} onComplete={() => setSetupComplete(true)} />;

  return (
    <div className="app-shell">
      <Sidebar active={screen} onNavigate={setScreen} />
      <div className="workspace">
        <Toolbar onCapture={() => void window.rurinagi.openCapture()} />
        <main className={`screen screen-${screen}`}>
          {screen === 'today' && <Today state={state} commit={commit} navigate={setScreen} />}
          {screen === 'tasks' && <Tasks state={state} commit={commit} navigate={setScreen} />}
          {screen === 'focus' && <Focus state={state} commit={commit} />}
          {screen === 'history' && <History state={state} commit={commit} />}
          {screen === 'insights' && <Insights state={state} />}
          {screen === 'settings' && <SettingsScreen state={state} commit={commit} setToast={setToast} />}
        </main>
      </div>
      {toast && <div className="toast" role="status"><Icon name="check" />{toast}</div>}
    </div>
  );
}

function FirstRunSetup({ state, commit, onComplete }: { state: AppState; commit: Commit; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [notifications, setNotifications] = useState(false);
  const [startWithWindows, setStartWithWindows] = useState(false);
  const [saveError, setSaveError] = useState('');
  const finish = async (): Promise<void> => {
    setSaveError('');
    const saved = await commit({ ...state, settings: { ...state.settings, notifications, startWithWindows } });
    if (!saved) { setSaveError('Rurinagi could not save these choices. Please try again.'); return; }
    localStorage.setItem(setupStorageKey, '1');
    onComplete();
  };
  return <main className="setup-shell">
    <section className="setup-card" aria-labelledby="setup-title">
      <div className="setup-brand"><Logo /><span>Rurinagi</span></div>
      <div className="setup-progress" aria-label={`Setup step ${step + 1} of 2`}><span className="active" /><span className={step === 1 ? 'active' : ''} /></div>
      {step === 0 ? <>
        <p className="section-label">Welcome</p>
        <h1 id="setup-title">A calmer place for meaningful work.</h1>
        <p className="setup-lede">Rurinagi works locally on this computer. There is no account, analytics, advertising, or cloud database.</p>
        <div className="setup-privacy"><span className="status-dot" /><div><strong>Your work stays with you</strong><p>Tasks, notes, settings, and focus history are stored in a local SQLite database. You can export, back up, or delete them from Settings.</p></div></div>
        <div className="policy-links"><button className="text-button" onClick={() => void window.rurinagi.openExternal(policyUrls.privacy)}>Privacy Policy</button><button className="text-button" onClick={() => void window.rurinagi.openExternal(policyUrls.terms)}>Terms of Service</button></div>
        <button className="button primary large setup-next" autoFocus onClick={() => setStep(1)}>Continue</button>
      </> : <>
        <p className="section-label">Preferences</p>
        <h1 id="setup-title">Make Rurinagi yours.</h1>
        <p className="setup-lede">Both choices are optional and can be changed later in Settings.</p>
        <div className="setup-options">
          <SettingToggle label="Desktop notifications" description="Show a Windows notification when a focus session finishes." checked={notifications} onChange={setNotifications} />
          <SettingToggle label="Start with Windows" description="Keep quick capture and the tray icon ready after you sign in." checked={startWithWindows} onChange={setStartWithWindows} />
        </div>
        {saveError && <p className="setup-error" role="alert">{saveError}</p>}
        <div className="setup-actions"><button className="button quiet" onClick={() => setStep(0)}>Back</button><button className="button primary large" autoFocus onClick={() => void finish()}>Finish setup</button></div>
      </>}
    </section>
  </main>;
}

function Sidebar({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  return (
    <aside className="sidebar">
      <div className="brand"><Logo /><span>Rurinagi</span></div>
      <nav aria-label="Primary navigation">
        {screens.map((item) => <button key={item.id} className={`nav-item ${active === item.id ? 'active' : ''}`} aria-label={item.label} title={item.label} aria-current={active === item.id ? 'page' : undefined} onClick={() => onNavigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span></button>)}
      </nav>
      <div className="sidebar-bottom">
        <button className="button secondary capture-button" onClick={() => void window.rurinagi.openCapture()}><Icon name="plus" />Quick capture</button>
        <div className="device-status"><span className="status-dot" />Stored on this device</div>
      </div>
    </aside>
  );
}

function Toolbar({ onCapture }: { onCapture: () => void }) {
  const date = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  return <header className="toolbar"><span>{date}</span><div className="toolbar-actions"><button className="icon-button emphasized" aria-label="Quick capture" title="Quick capture" onClick={onCapture}><Icon name="plus" /></button></div></header>;
}

type Commit = (state: AppState, notice?: string) => Promise<boolean>;

function Today({ state, commit, navigate }: { state: AppState; commit: Commit; navigate: (screen: Screen) => void }) {
  const openTasks = state.tasks.filter((task) => task.isToday && task.status !== 'complete' && task.status !== 'archived').sort((a, b) => a.sortOrder - b.sortOrder);
  const completed = state.tasks.filter((task) => task.isToday && task.status === 'complete');
  const next = openTasks.find((task) => task.status === 'active') ?? openTasks[0];
  const todaySessions = state.sessions.filter((session) => localDate(new Date(session.endedAt)) === localDate());
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const start = (task: Task) => { commit(startFocus(state, task.id)); navigate('focus'); };
  return <>
    <PageHeader eyebrow="Today" title={greeting} subtitle="Choose one meaningful thing to move forward." />
    <div className="today-grid">
      <div className="primary-column">
        <section className="card up-next">
          <div className="section-label">Up next</div>
          {next ? <>
            <div className="project-kicker"><ProjectDot project={projectFor(state, next.projectId)} />{projectFor(state, next.projectId)?.name ?? 'Inbox'}</div>
            <h2>{next.title}</h2>
            <p>{next.description || `${next.estimateSessions} focus ${next.estimateSessions === 1 ? 'session' : 'sessions'} estimated`}</p>
            <div className="actions"><button className="button primary" onClick={() => start(next)}><Icon name="play" />Start focus</button><button className="button quiet" onClick={() => navigate('tasks')}>Choose another task</button></div>
          </> : <Empty title="You’re clear for today." body="Add a task when something needs your attention." action={<button className="button primary" onClick={() => navigate('tasks')}>Add a task</button>} />}
        </section>
        <section className="card task-card">
          <div className="section-heading"><div><span className="section-label">Plan</span><h2>Today’s tasks</h2></div><span className="count-badge">{openTasks.length}</span></div>
          <div className="task-list">
            {openTasks.map((task) => <TaskRow key={task.id} task={task} state={state} onToggle={() => commit(toggleTask(state, task))} selected={task.id === next?.id} onOpen={() => start(task)} />)}
            <button className="add-row" onClick={() => navigate('tasks')}><Icon name="plus" />Add task</button>
          </div>
          {completed.length > 0 && <details className="completed"><summary>{completed.length} completed</summary>{completed.map((task) => <TaskRow key={task.id} task={task} state={state} onToggle={() => commit(toggleTask(state, task))} />)}</details>}
        </section>
      </div>
      <aside className="support-column">
        <TimerCard state={state} next={next} onStart={() => next && start(next)} onFocus={() => navigate('focus')} />
        <section className="card summary-card"><div className="section-label">Today summary</div><div className="metrics"><Metric value={humanMinutes(focusedSecondsToday(state))} label="Focused" /><Metric value={String(todaySessions.length)} label="Sessions" /><Metric value={String(completed.length)} label="Tasks" /></div></section>
        <section className="card quick-note"><div className="section-label">Quick note</div><textarea aria-label="Quick note" value={state.quickNote} placeholder="Capture something before you forget…" onChange={(event) => commit({ ...state, quickNote: event.target.value })} /><span className="saved-hint"><Icon name="check" />Saved locally</span></section>
      </aside>
    </div>
  </>;
}

function TimerCard({ state, next, onStart, onFocus }: { state: AppState; next?: Task; onStart: () => void; onFocus: () => void }) {
  const seconds = useTimerSeconds(state);
  const active = state.timer.status !== 'idle';
  const progress = 1 - seconds / Math.max(1, state.timer.durationSeconds);
  return <section className="card timer-card"><div className="section-label">{state.timer.mode === 'focus' ? 'Focus' : 'Break'}</div><ProgressRing progress={progress} compact><strong>{formatDuration(active ? seconds : state.settings.focusMinutes * 60)}</strong></ProgressRing><p>{active ? taskById(state, state.timer.taskId)?.title ?? 'Take a deliberate break' : next?.title ?? 'Choose a task to begin'}</p><button className="button primary wide" onClick={active ? onFocus : onStart} disabled={!active && !next}>{active ? 'Open focus' : 'Start'}</button></section>;
}

function Tasks({ state, commit, navigate }: { state: AppState; commit: Commit; navigate: (screen: Screen) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Task | null>(null);
  const [query, setQuery] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<'archive' | 'delete' | null>(null);
  const selected = state.tasks.find((task) => task.id === selectedId);
  useEffect(() => setDraft(selected ? { ...selected } : null), [selectedId]);
  const visible = state.tasks.filter((task) => task.status !== 'archived' && task.title.toLowerCase().includes(query.toLowerCase()));
  const addTask = (event: FormEvent) => {
    event.preventDefault();
    const title = taskName.trim();
    if (!title) return;
    const task: Task = { id: crypto.randomUUID(), title: title.slice(0, 500), description: '', projectId: null, priority: 'normal', dueDate: localDate(), estimateSessions: 1, status: 'inbox', sortOrder: state.tasks.length, isToday: false, createdAt: new Date().toISOString(), completedAt: null };
    commit({ ...state, tasks: [...state.tasks, task] }, 'Task created');
    setSelectedId(task.id); setTaskName(''); setCreatingTask(false);
  };
  const addProject = (event: FormEvent) => {
    event.preventDefault();
    const name = projectName.trim();
    if (!name) return;
    commit({ ...state, projects: [...state.projects, { id: crypto.randomUUID(), name: name.slice(0, 120), color: '#315F4D' }] }, 'Project created');
    setProjectName(''); setCreatingProject(false);
  };
  const update = (patch: Partial<Task>) => setDraft((current) => current ? { ...current, ...patch } : current);
  const withDraft = (): AppState => !selected || !draft ? state : { ...state, tasks: state.tasks.map((task) => task.id === selected.id ? { ...draft, title: draft.title.trim(), sortOrder: task.sortOrder } : task) };
  const saveDraft = (): void => {
    if (!draft?.title.trim()) return;
    commit(withDraft(), 'Task updated'); setSelectedId(null);
  };
  const move = (direction: -1 | 1) => {
    if (!selected) return;
    const ordered = [...state.tasks].sort((a, b) => a.sortOrder - b.sortOrder);
    const from = ordered.findIndex((task) => task.id === selected.id);
    const other = ordered[from + direction];
    if (!other) return;
    commit({ ...state, tasks: state.tasks.map((task) => task.id === selected.id ? { ...task, sortOrder: other.sortOrder } : task.id === other.id ? { ...task, sortOrder: selected.sortOrder } : task) }, 'Task order updated');
    setDraft((current) => current ? { ...current, sortOrder: other.sortOrder } : current);
  };
  const groups = [['Today', visible.filter((task) => task.isToday)], ['Tomorrow', visible.filter((task) => task.dueDate && task.dueDate > localDate() && !task.isToday)], ['Later', visible.filter((task) => !task.isToday && (!task.dueDate || task.dueDate <= localDate()))]] as const;
  return <>
    <PageHeader title="Tasks" subtitle="Keep the list practical. Choose what deserves today." actions={<div className="header-actions"><button className="button secondary" onClick={() => setCreatingProject(true)}>Manage projects</button><button className="button create-action" onClick={() => setCreatingTask(true)}><Icon name="plus" />Add task</button></div>} />
    <div className={`tasks-layout ${selected && draft ? 'with-inspector' : ''}`}>
      <section className="task-browser card">
        <label className="search-field"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" aria-label="Search tasks" /></label>
        {groups.map(([label, tasks]) => tasks.length > 0 && <div className="task-group" key={label}><h2>{label}</h2>{tasks.map((task) => <TaskRow key={task.id} task={task} state={state} selected={selectedId === task.id} onToggle={() => commit(toggleTask(state, task))} onOpen={() => setSelectedId(task.id)} />)}</div>)}
        {visible.length === 0 && <Empty title="Nothing needs your attention." body="Create a task or change the search." />}
      </section>
      {selected && draft && <aside className="inspector card open">
        <>
          <div className="section-label">Task details</div>
          <input className="title-input" value={draft.title} aria-label="Task title" onChange={(event) => update({ title: event.target.value })} />
          <Field label="Project"><SelectControl ariaLabel="Project" value={draft.projectId ?? ''} onChange={(value) => update({ projectId: value || null })} options={[{ value: '', label: 'Inbox' }, ...state.projects.map((project) => ({ value: project.id, label: project.name }))]} /></Field>
          <Field label="Notes"><textarea value={draft.description} onChange={(event) => update({ description: event.target.value })} placeholder="Add a useful next step…" /></Field>
          <div className="field-grid"><Field label="Planned date"><CalendarControl ariaLabel="Planned date" value={draft.dueDate ?? ''} onChange={(value) => update({ dueDate: value || null })} /></Field><Field label="Sessions"><input type="number" min="1" max="20" value={draft.estimateSessions} onChange={(event) => update({ estimateSessions: boundedInt(event.target.value, 1, 20) })} /></Field></div>
          <div className="field-grid"><Field label="Priority"><SelectControl ariaLabel="Priority" value={draft.priority} onChange={(value) => update({ priority: value as Priority })} options={[{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }]} /></Field><Field label="Status"><SelectControl ariaLabel="Status" value={draft.status} onChange={(value) => update({ status: value as TaskStatus })} options={[{ value: 'inbox', label: 'Inbox' }, { value: 'planned', label: 'Planned' }, { value: 'waiting', label: 'Waiting' }, { value: 'complete', label: 'Complete' }]} /></Field></div>
          <label className="switch-row"><input type="checkbox" checked={draft.isToday} onChange={(event) => update({ isToday: event.target.checked, status: event.target.checked ? 'planned' : draft.status })} /><span>Priority for today</span></label>
          <div className="reorder-actions"><button className="button quiet" onClick={() => move(-1)}>Move up</button><button className="button quiet" onClick={() => move(1)}>Move down</button></div>
          <div className="primary-task-actions"><button className="button primary focus-action" disabled={!draft.title.trim()} onClick={() => { commit(startFocus(withDraft(), selected.id)); navigate('focus'); }}><Icon name="play" />Start focus</button><button className="button create-action" disabled={!draft.title.trim()} onClick={saveDraft}><Icon name="check" />Update task</button></div>
          <div className="inspector-actions">
            <button className="button quiet" onClick={() => setConfirmation('archive')}>Archive</button>
            <button className="button destructive destructive-outline" disabled={state.timer.taskId === selected.id && ['running', 'paused'].includes(state.timer.status)} title={state.timer.taskId === selected.id && ['running', 'paused'].includes(state.timer.status) ? 'End the active focus session before deleting this task' : 'Permanently delete task'} onClick={() => setConfirmation('delete')}>Delete</button>
          </div>
        </>
      </aside>}
    </div>
    {creatingTask && <Modal title="Add a task" onClose={() => { setCreatingTask(false); setTaskName(''); }}><form onSubmit={addTask}><Field label="Task name"><input autoFocus value={taskName} maxLength={500} placeholder="What needs your attention?" onChange={(event) => setTaskName(event.target.value)} /></Field><div className="modal-actions"><button className="button primary" type="submit" disabled={!taskName.trim()}>Create task</button><button className="button quiet" type="button" onClick={() => { setCreatingTask(false); setTaskName(''); }}>Cancel</button></div></form></Modal>}
    {creatingProject && <Modal title="Manage projects" onClose={() => setCreatingProject(false)}><form onSubmit={addProject}><Field label="New project name"><input autoFocus value={projectName} maxLength={120} onChange={(event) => setProjectName(event.target.value)} /></Field><div className="modal-actions project-create-actions"><button className="button primary" type="submit" disabled={!projectName.trim()}>Create project</button></div></form><div className="project-manager"><h3>Your projects</h3>{state.projects.map((project) => {
      const taskCount = state.tasks.filter((task) => task.projectId === project.id).length;
      const hasLiveTimer = ['running', 'paused'].includes(state.timer.status) && state.tasks.some((task) => task.id === state.timer.taskId && task.projectId === project.id);
      return <div className="project-manager-row" key={project.id}><span className="project-manager-name"><ProjectDot project={project} /><span><strong>{project.name}</strong><small>{taskCount} {taskCount === 1 ? 'task' : 'tasks'}</small></span></span><button className="button destructive quiet" type="button" aria-label={`Delete ${project.name} project`} disabled={hasLiveTimer} title={hasLiveTimer ? 'End the active focus session before deleting this project' : `Delete ${project.name} and its tasks`} onClick={() => { setCreatingProject(false); setDeletingProjectId(project.id); }}>Delete</button></div>;
    })}</div><div className="modal-actions"><button className="button quiet" type="button" onClick={() => setCreatingProject(false)}>Done</button></div></Modal>}
    {confirmation === 'archive' && selected && draft && <ConfirmModal title="Archive this task?" body="It will leave your active lists, while its focus history stays available." confirmLabel="Archive task" onClose={() => setConfirmation(null)} onConfirm={() => { const next = withDraft(); commit({ ...next, tasks: next.tasks.map((task) => task.id === selected.id ? { ...task, status: 'archived' } : task) }, 'Task archived'); setSelectedId(null); setConfirmation(null); }} />}
    {confirmation === 'delete' && selected && draft && <ConfirmModal title="Delete this task permanently?" body={`“${draft.title}” will be removed. Focus history will be kept. This cannot be undone.`} confirmLabel="Delete task" destructive onClose={() => setConfirmation(null)} onConfirm={() => { commit({ ...state, tasks: state.tasks.filter((task) => task.id !== selected.id) }, 'Task deleted'); setSelectedId(null); setConfirmation(null); }} />}
    {deletingProjectId && (() => {
      const project = state.projects.find((candidate) => candidate.id === deletingProjectId);
      if (!project) return null;
      const taskCount = state.tasks.filter((task) => task.projectId === project.id).length;
      return <ConfirmModal title={`Delete ${project.name}?`} body={`This project and ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'} will be permanently deleted. Focus history will be kept. This cannot be undone.`} confirmLabel="Delete project" destructive onClose={() => { setDeletingProjectId(null); setCreatingProject(true); }} onConfirm={() => { commit(deleteProject(state, project.id), 'Project and tasks deleted'); setSelectedId(null); setDeletingProjectId(null); }} />;
    })()}
  </>;
}

function Focus({ state, commit }: { state: AppState; commit: Commit }) {
  const seconds = useTimerSeconds(state);
  const completing = useRef(false);
  const timer = state.timer;
  const task = taskById(state, timer.taskId);
  const completedSession = state.sessions.find((session) => session.taskId === timer.taskId);
  const isBreak = timer.mode !== 'focus';
  const [confirmEnd, setConfirmEnd] = useState(false);
  useEffect(() => {
    if (timer.status !== 'running' || seconds > 0 || completing.current) return;
    completing.current = true;
    const finished = finishTimer(state);
    const next = !isBreak && state.settings.autoStartBreaks ? startBreak(finished) : finished;
    commit(next, isBreak ? 'Break complete' : 'Focus session complete');
    if (!isBreak && state.settings.notifications) void window.rurinagi.notify('Focus session complete', task?.title ?? 'Your focus session is complete.');
    if (!isBreak && state.settings.sound) playChime();
    window.setTimeout(() => { completing.current = false; }, 500);
  }, [seconds, timer.status]);
  const progress = 1 - seconds / Math.max(1, timer.durationSeconds);
  if (timer.status === 'idle') return <div className="focus-empty"><span className="section-label">Focus</span><h1>Choose one task.</h1><p>Return to Today or Tasks, then start a focus session.</p></div>;
  if (timer.status === 'completed') return <div className="focus-stage completion"><div className="completion-mark"><Icon name="check" /></div><span className="section-label">Session complete</span><h1>{task?.title ?? 'Nicely done.'}</h1><p>{focusDuration(completedSession?.actualSeconds ?? timer.durationSeconds)} of focused work recorded.</p><div className="actions centered"><button className="button primary" onClick={() => commit(startBreak(state))}>Start break</button>{task && <button className="button secondary" onClick={() => commit(startFocus(state, task.id))}>Continue focusing</button>} {task && <button className="button quiet" onClick={() => commit({ ...discardTimer(state), tasks: state.tasks.map((item) => item.id === task.id ? { ...item, status: 'complete', completedAt: new Date().toISOString() } : item) }, 'Task completed')}>Mark task complete</button>}</div></div>;
  return <div className={`focus-stage ${isBreak ? 'break' : ''}`}>
    <span className={`mode-pill ${timer.status}`}>{timer.status === 'paused' ? 'Paused' : isBreak ? 'Break' : 'Focus session'}</span>
    <h1>{isBreak ? 'Take a breath' : task?.title ?? 'Focus session'}</h1>
    <p>{isBreak ? 'Stretch, drink water, or look away from the screen.' : projectFor(state, task?.projectId ?? null)?.name ?? 'Inbox'}</p>
    <ProgressRing progress={progress}><strong>{formatDuration(seconds)}</strong></ProgressRing>
    <div className="actions centered">
      {timer.status === 'running' ? <button className="button primary large" onClick={() => commit(pauseTimer(state))}>Pause</button> : <button className="button primary large" onClick={() => commit(resumeTimer(state))}>Resume</button>}
      <button className="button secondary" onClick={() => isBreak ? commit(discardTimer(state), 'Break skipped') : state.settings.confirmDiscard ? setConfirmEnd(true) : commit(finishTimer(state, 'partial'), 'Partial session saved')}>{isBreak ? 'Skip break' : 'End session'}</button>
    </div>
    {!isBreak && <label className="session-note"><span>Add session note</span><textarea value={state.sessionNote} onChange={(event) => commit({ ...state, sessionNote: event.target.value })} placeholder="What are you working through?" /></label>}
    {!isBreak && <span className="next-break">Break: {state.settings.shortBreakMinutes} minutes</span>}
    {confirmEnd && <Modal title="End this session?" onClose={() => setConfirmEnd(false)}><p>Save the focused time so far, discard it, or continue.</p><div className="modal-actions"><button className="button primary" onClick={() => { commit(finishTimer(state, 'partial'), 'Partial session saved'); setConfirmEnd(false); }}>Save session</button><button className="button destructive" onClick={() => { commit(discardTimer(state), 'Session discarded'); setConfirmEnd(false); }}>Discard</button><button className="button quiet" onClick={() => setConfirmEnd(false)}>Continue focusing</button></div></Modal>}
  </div>;
}

function History({ state, commit }: { state: AppState; commit: Commit }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [outcome, setOutcome] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const filtered = state.sessions.filter((session) => (outcome === 'all' || session.outcome === outcome) && (projectId === 'all' || session.projectId === projectId));
  const sessionsByDay = useMemo(() => groupSessions(filtered), [filtered]);
  const chosen = state.sessions.find((session) => session.id === selected);
  return <>
    <PageHeader title="History" subtitle="A quiet record of where your attention went." actions={<div className="history-filters"><SelectControl ariaLabel="Filter by project" value={projectId} onChange={setProjectId} options={[{ value: 'all', label: 'All projects' }, ...state.projects.map((project) => ({ value: project.id, label: project.name }))]} /><SelectControl ariaLabel="Filter by session status" value={outcome} onChange={setOutcome} options={[{ value: 'all', label: 'All statuses' }, { value: 'completed', label: 'Completed' }, { value: 'partial', label: 'Partial' }, { value: 'interrupted', label: 'Interrupted' }]} /></div>} />
    <div className="history-summary"><Metric value={humanMinutes(focusedSecondsToday(state))} label="Focused today" /><Metric value={humanMinutes(state.sessions.reduce((sum, session) => sum + session.actualSeconds, 0))} label="All focus" /><Metric value={String(state.sessions.filter((session) => session.outcome === 'completed').length)} label="Completed sessions" /></div>
    <div className="history-layout"><section className="card session-list">
      {filtered.length === 0 && <Empty title={state.sessions.length ? 'No matching sessions.' : 'No sessions yet.'} body="Completed and partial focus sessions will appear here." />}
      {[...sessionsByDay.entries()].map(([day, sessions]) => <div className="session-day" key={day}><h2>{formatDay(day)}</h2>{sessions.map((session) => <SessionRow key={session.id} session={session} state={state} selected={selected === session.id} onClick={() => setSelected(session.id)} />)}</div>)}
    </section>{chosen && <aside className="card session-detail"><div className="section-label">Session details</div><h2>{taskById(state, chosen.taskId)?.title ?? 'Deleted task'}</h2><p>{new Date(chosen.startedAt).toLocaleString()} · {focusDuration(chosen.actualSeconds)}</p><Field label="Task"><SelectControl ariaLabel="Task" value={chosen.taskId ?? ''} onChange={(value) => { const task = taskById(state, value); commit({ ...state, sessions: state.sessions.map((session) => session.id === chosen.id ? { ...session, taskId: task?.id ?? null, projectId: task?.projectId ?? null } : session) }, 'Session updated'); }} options={[{ value: '', label: 'No task' }, ...state.tasks.filter((task) => task.status !== 'archived').map((task) => ({ value: task.id, label: task.title }))]} /></Field><Field label="Session note"><textarea value={chosen.note} onChange={(event) => commit({ ...state, sessions: state.sessions.map((session) => session.id === chosen.id ? { ...session, note: event.target.value } : session) })} /></Field><button className="button destructive quiet wide" onClick={() => setConfirmDelete(true)}>Delete record</button></aside>}</div>
    {confirmDelete && chosen && <ConfirmModal title="Delete this session record?" body="This focus record and its note will be removed permanently." confirmLabel="Delete record" destructive onClose={() => setConfirmDelete(false)} onConfirm={() => { commit({ ...state, sessions: state.sessions.filter((session) => session.id !== chosen.id) }, 'Session deleted'); setSelected(null); setConfirmDelete(false); }} />}
  </>;
}

function Insights({ state }: { state: AppState }) {
  const insights = useMemo(() => buildFocusInsights(state), [state.sessions]);
  const comparison = insights.weekChangePercent === null
    ? insights.weekSeconds ? 'Your first recorded week' : 'Ready when you are'
    : insights.weekChangePercent === 0 ? 'Even with the previous 7 days'
    : `${Math.abs(insights.weekChangePercent)}% ${insights.weekChangePercent > 0 ? 'more' : 'less'} than the previous 7 days`;
  return <>
    <PageHeader eyebrow="Private insights" title="Insights" subtitle="A local view of where your attention has gone." />
    <section className="insights-summary card" aria-label="Last 7 days summary">
      <Metric value={insightDuration(insights.weekSeconds)} label="Focused" />
      <Metric value={String(insights.sessions)} label="Sessions" />
      <Metric value={`${insights.completionRate}%`} label="Completed" />
      <Metric value={`${insights.currentStreak} ${insights.currentStreak === 1 ? 'day' : 'days'}`} label="Current streak" />
    </section>
    <div className="insights-grid">
      <section className="card skyline-card">
        <div className="insight-heading"><div><span className="section-label">Last 7 days</span><h2>Focus skyline</h2></div><span className={`trend ${insights.weekChangePercent !== null && insights.weekChangePercent < 0 ? 'down' : ''}`}>{comparison}</span></div>
        <FocusSkyline days={insights.days} />
      </section>
      <section className="card project-insights">
        <span className="section-label">Distribution</span><h2>Projects</h2>
        {insights.projects.length === 0 ? <Empty title="No focus time yet." body="Finish a focus session and your project mix will appear here." /> : <div className="project-focus-list">{insights.projects.map((item) => {
          const project = projectFor(state, item.projectId);
          const width = Math.max(4, Math.round((item.seconds / insights.weekSeconds) * 100));
          return <div className="project-focus-row" key={item.projectId ?? 'inbox'}><div><span><ProjectDot project={project} />{project?.name ?? (item.projectId ? 'Deleted project' : 'Inbox')}</span><strong>{insightDuration(item.seconds)}</strong></div><div className="project-focus-track" aria-hidden="true"><span style={{ width: `${width}%`, background: project?.color ?? 'var(--accent)' }} /></div><small>{item.sessions} {item.sessions === 1 ? 'session' : 'sessions'}</small></div>;
        })}</div>}
        <div className="streak-pair"><div><strong>{insights.currentStreak}</strong><span>Current streak</span></div><div><strong>{insights.longestStreak}</strong><span>Longest streak</span></div></div>
      </section>
    </div>
    <p className="local-insight-note"><span className="status-dot" />Calculated on this device. Nothing is uploaded.</p>
  </>;
}

function FocusSkyline({ days }: { days: FocusDay[] }) {
  const maxSeconds = Math.max(1, ...days.map((day) => day.seconds));
  return <div className="skyline" role="list" aria-label="Focus time by day">{days.map((day, index) => {
    const height = day.seconds ? Math.max(10, Math.round((day.seconds / maxSeconds) * 100)) : 3;
    return <div className={`skyline-day ${index === days.length - 1 ? 'today' : ''}`} role="listitem" aria-label={`${formatDay(day.date)}: ${insightDuration(day.seconds)} across ${day.sessions} sessions`} key={day.date}>
      <span className="skyline-value">{day.seconds ? insightDuration(day.seconds) : ''}</span>
      <span className="skyline-column"><span className="skyline-bar" style={{ height: `${height}%`, animationDelay: `${index * 35}ms` }} /></span>
      <strong>{day.label}</strong><small>{Number(day.date.slice(-2))}</small>
    </div>;
  })}</div>;
}

function SettingsScreen({ state, commit, setToast }: { state: AppState; commit: Commit; setToast: (toast: string) => void }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const update = (patch: Partial<Settings>) => commit({ ...state, settings: { ...state.settings, ...patch } });
  const action = async (kind: 'export' | 'import' | 'backup') => {
    try {
      const result = kind === 'export' ? await window.rurinagi.exportData() : kind === 'import' ? await window.rurinagi.importData() : await window.rurinagi.backupData();
      if (!result.canceled) { if ('state' in result && result.state) commit(result.state); setToast(`${kind[0]!.toUpperCase()}${kind.slice(1)} complete`); }
    } catch (cause) { setToast(`${kind} failed: ${message(cause)}`); }
  };
  return <>
    <PageHeader title="Settings" subtitle="Shape Rurinagi around the way you work." />
    <div className="settings-stack">
      <SettingsGroup title="Timer"><SettingNumber label="Focus duration" value={state.settings.focusMinutes} suffix="min" onChange={(value) => update({ focusMinutes: value })} /><SettingNumber label="Short break" value={state.settings.shortBreakMinutes} suffix="min" onChange={(value) => update({ shortBreakMinutes: value })} /><SettingNumber label="Long break" value={state.settings.longBreakMinutes} suffix="min" onChange={(value) => update({ longBreakMinutes: value })} /><SettingNumber label="Sessions before long break" value={state.settings.sessionsBeforeLongBreak} onChange={(value) => update({ sessionsBeforeLongBreak: value })} /><SettingToggle label="Start breaks automatically" checked={state.settings.autoStartBreaks} onChange={(checked) => update({ autoStartBreaks: checked })} /><SettingToggle label="Desktop notifications" description="Show a Windows notification when a focus session finishes." checked={state.settings.notifications} onChange={(checked) => update({ notifications: checked })} /><SettingToggle label="Completion sound" checked={state.settings.sound} onChange={(checked) => update({ sound: checked })} /></SettingsGroup>
      <SettingsGroup title="Appearance"><div className="setting-row"><div><strong>Theme</strong><small>Match your workspace.</small></div><SelectControl ariaLabel="Theme" value={state.settings.theme} onChange={(value) => update({ theme: value as Settings['theme'] })} options={[{ value: 'system', label: 'Follow system' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} /></div><SettingToggle label="Reduce motion" checked={state.settings.reducedMotion} onChange={(checked) => update({ reducedMotion: checked })} /><SettingToggle label="Compact density" checked={state.settings.compactDensity} onChange={(checked) => update({ compactDensity: checked })} /></SettingsGroup>
      <SettingsGroup title="Behavior"><SettingToggle label="Start with Windows" description="Launch Rurinagi after you sign in to Windows." checked={state.settings.startWithWindows} onChange={(checked) => update({ startWithWindows: checked })} /><SettingToggle label="Confirm before discarding a session" checked={state.settings.confirmDiscard} onChange={(checked) => update({ confirmDiscard: checked })} /><ShortcutInput value={state.settings.quickCaptureShortcut} onChange={(quickCaptureShortcut) => update({ quickCaptureShortcut })} /></SettingsGroup>
      <SettingsGroup title="Data and privacy"><p className="privacy-copy">Your tasks and focus history are stored locally on this device.</p><div className="data-actions"><button className="button secondary" onClick={() => void action('export')}>Export data</button><button className="button secondary" onClick={() => void action('import')}>Import data</button><button className="button secondary" onClick={() => void action('backup')}>Back up database</button></div><div className="policy-links settings-policy-links"><button className="text-button" onClick={() => void window.rurinagi.openExternal(policyUrls.privacy)}>Privacy Policy</button><button className="text-button" onClick={() => void window.rurinagi.openExternal(policyUrls.terms)}>Terms of Service</button></div><button className="button destructive quiet" onClick={() => setConfirmClear(true)}>Clear all data</button></SettingsGroup>
      <SettingsGroup title="About"><div className="about-row"><Logo /><div><strong>Rurinagi</strong><small>Version 3.0.0 · Published by Shivam D Shinde</small></div></div></SettingsGroup>
    </div>
    {confirmClear && <ConfirmModal title="Clear all local data?" body="Every task, project, focus record, and note will be permanently removed. This cannot be undone." confirmLabel="Clear all data" destructive onClose={() => setConfirmClear(false)} onConfirm={() => { void window.rurinagi.clearData().then((next) => { commit(next, 'All local data cleared'); setConfirmClear(false); }).catch((cause: unknown) => setToast(`Clear failed: ${message(cause)}`)); }} />}
  </>;
}

function QuickCapture({ state, commit }: { state: AppState; commit: Commit }) {
  const [title, setTitle] = useState(''); const [projectId, setProjectId] = useState(''); const [date, setDate] = useState(''); const [estimate, setEstimate] = useState(1);
  const submit = (event: FormEvent) => {
    event.preventDefault(); const clean = title.trim(); if (!clean) return;
    const task: Task = { id: crypto.randomUUID(), title: clean, description: '', projectId: projectId || null, priority: 'normal', dueDate: date || null, estimateSessions: estimate, status: date === localDate() ? 'planned' : 'inbox', sortOrder: state.tasks.length, isToday: date === localDate(), createdAt: new Date().toISOString(), completedAt: null };
    commit({ ...state, tasks: [...state.tasks, task] }, 'Captured'); setTitle(''); void window.rurinagi.completeCapture();
  };
  return <main className="capture-window"><div className="capture-brand"><Logo /><span>Quick capture</span></div><form onSubmit={submit}><label className="capture-title"><span>What needs your attention?</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Write a task, idea, or next step" /></label><div className="capture-fields"><SelectControl ariaLabel="Project" value={projectId} onChange={setProjectId} options={[{ value: '', label: 'Inbox' }, ...state.projects.map((project) => ({ value: project.id, label: project.name }))]} /><CalendarControl ariaLabel="Planned date" value={date} onChange={setDate} /><SelectControl ariaLabel="Estimated sessions" value={String(estimate)} onChange={(value) => setEstimate(Number(value))} options={[1, 2, 3, 4].map((value) => ({ value: String(value), label: `${value} session${value === 1 ? '' : 's'}` }))} /></div><div className="capture-footer"><span><kbd>Enter</kbd> to save</span><button className="button primary" disabled={!title.trim()} type="submit">Save task</button></div></form></main>;
}

function TaskRow({ task, state, selected, onToggle, onOpen }: { task: Task; state: AppState; selected?: boolean; onToggle: () => void; onOpen?: () => void }) {
  const project = projectFor(state, task.projectId); const complete = task.status === 'complete'; const overdue = task.dueDate ? task.dueDate < localDate() && !complete : false;
  return <div className={`task-row ${selected ? 'selected' : ''} ${complete ? 'done' : ''}`}><button className="checkbox" aria-label={complete ? `Reopen ${task.title}` : `Complete ${task.title}`} aria-pressed={complete} onClick={onToggle}>{complete && <Icon name="check" />}</button><button className="task-content" onClick={onOpen}><span>{task.title}</span><small>{project && <span className="project-label"><ProjectDot project={project} /><span>{project.name}</span></span>}<span className={`priority-label ${task.priority}`}>{priorityLabels[task.priority]}</span>{task.estimateSessions > 0 && <span>{task.estimateSessions * state.settings.focusMinutes} min</span>}{overdue && <b className="overdue">Overdue</b>}</small></button></div>;
}

function SessionRow({ session, state, selected, onClick }: { session: Session; state: AppState; selected: boolean; onClick: () => void }) {
  const task = taskById(state, session.taskId); const project = projectFor(state, session.projectId);
  return <button className={`session-row ${selected ? 'selected' : ''}`} onClick={onClick}><time>{new Date(session.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time><span className="session-task"><strong>{task?.title ?? 'Deleted task'}</strong><small>{project?.name ?? (session.projectId ? 'Deleted project' : 'Inbox')}</small></span><span>{humanMinutes(session.actualSeconds)}</span><span className={`status ${session.outcome}`}>{session.outcome}</span></button>;
}

function ProgressRing({ progress, compact, children }: { progress: number; compact?: boolean; children: ReactNode }) {
  const pct = Math.min(1, Math.max(0, progress));
  return <div className={`progress-ring ${compact ? 'compact' : ''}`} style={{ '--progress': pct } as React.CSSProperties}><svg viewBox="0 0 120 120" aria-hidden="true"><circle className="track" cx="60" cy="60" r="52" /><circle className="value" cx="60" cy="60" r="52" pathLength="1" /></svg><div>{children}</div></div>;
}

function useTimerSeconds(state: AppState) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (state.timer.status !== 'running') return; const id = window.setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, [state.timer.status, state.timer.endsAt]);
  return remainingSeconds(state.timer, now);
}

function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle: string; actions?: ReactNode }) { return <header className="page-header"><div>{eyebrow && <span className="section-label">{eyebrow}</span>}<h1>{title}</h1><p>{subtitle}</p></div>{actions}</header>; }
function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) { return <div className="empty"><div className="empty-icon"><Icon name="check" /></div><h3>{title}</h3><p>{body}</p>{action}</div>; }
function Metric({ value, label }: { value: string; label: string }) { return <div className="metric"><strong>{value}</strong><span>{label}</span></div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
function SettingsGroup({ title, children }: { title: string; children: ReactNode }) { return <section className="settings-group"><h2>{title}</h2><div className="card">{children}</div></section>; }
function SettingToggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="setting-row"><div><strong>{label}</strong>{description && <small>{description}</small>}</div><span className="toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span /></span></label>; }
function SettingNumber({ label, value, suffix, onChange }: { label: string; value: number; suffix?: string; onChange: (value: number) => void }) { return <label className="setting-row"><div><strong>{label}</strong></div><span className="number-setting"><input type="number" min="1" max="120" value={value} onChange={(event) => onChange(boundedInt(event.target.value, 1, 120))} />{suffix && <small>{suffix}</small>}</span></label>; }
function ShortcutInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(formatShortcut(value));
  useEffect(() => setDraft(formatShortcut(value)), [value]);
  const commit = (): void => {
    const shortcut = parseShortcut(draft);
    setDraft(formatShortcut(shortcut));
    onChange(shortcut);
  };
  return <div className="setting-row"><div><strong>Quick capture shortcut</strong><small>Works while Rurinagi is running.</small></div><input aria-label="Quick capture shortcut" value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></div>;
}
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const escape = (event: KeyboardEvent): void => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('keydown', escape); previous?.focus(); };
  }, []);
  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Tab') return;
    const items = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? [])];
    if (items.length === 0) return;
    const first = items[0]!; const last = items[items.length - 1]!;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  return <div className="scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialog} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onKeyDown={trapFocus}><h2 id="modal-title">{title}</h2>{children}</div></div>;
}
function ConfirmModal({ title, body, confirmLabel, destructive, onConfirm, onClose }: { title: string; body: string; confirmLabel: string; destructive?: boolean; onConfirm: () => void; onClose: () => void }) { return <Modal title={title} onClose={onClose}><p>{body}</p><div className="modal-actions"><button className={`button ${destructive ? 'destructive destructive-outline' : 'primary'}`} onClick={onConfirm}>{confirmLabel}</button><button className="button quiet" autoFocus onClick={onClose}>Cancel</button></div></Modal>; }
type SelectOption = { value: string; label: string };
function SelectControl({ ariaLabel, value, options, onChange }: { ariaLabel: string; value: string; options: readonly SelectOption[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent): void => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    requestAnimationFrame(() => menu.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus());
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  const move = (event: React.KeyboardEvent<HTMLButtonElement>, offset: number): void => {
    event.preventDefault();
    const items = [...(menu.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])];
    const index = items.indexOf(event.currentTarget);
    items[(index + offset + items.length) % items.length]?.focus();
  };
  return <div className={`select-control ${open ? 'open' : ''}`} ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="select-trigger" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); } }}>{selected?.label ?? 'Select'}<span className="select-chevron" aria-hidden="true" /></button>
    {open && <div className="select-menu" role="listbox" aria-label={ariaLabel} ref={menu}>{options.map((option) => <button type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={() => { onChange(option.value); setOpen(false); trigger.current?.focus(); }} onKeyDown={(event) => { if (event.key === 'ArrowDown') move(event, 1); else if (event.key === 'ArrowUp') move(event, -1); else if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } }}>{option.label}{option.value === value && <Icon name="check" />}</button>)}</div>}
  </div>;
}
function CalendarControl({ ariaLabel, value, onChange }: { ariaLabel: string; value: string; onChange: (value: string) => void }) {
  const initialDate = value ? parseLocalDate(value) : new Date();
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => monthStart(initialDate));
  const [focusedDate, setFocusedDate] = useState(() => dateValue(initialDate));
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const today = localDate();
  const days = calendarDays(viewMonth);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent): void => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    requestAnimationFrame(() => popover.current?.querySelector<HTMLButtonElement>(`[data-date="${focusedDate}"]`)?.focus());
    return () => document.removeEventListener('pointerdown', close);
  }, [open, focusedDate]);
  const show = (): void => {
    const date = value ? parseLocalDate(value) : new Date();
    setViewMonth(monthStart(date)); setFocusedDate(dateValue(date)); setOpen(true);
  };
  const select = (next: string): void => { onChange(next); setOpen(false); trigger.current?.focus(); };
  const focus = (next: Date): void => {
    const nextValue = dateValue(next);
    setFocusedDate(nextValue); setViewMonth(monthStart(next));
    requestAnimationFrame(() => popover.current?.querySelector<HTMLButtonElement>(`[data-date="${nextValue}"]`)?.focus());
  };
  const moveFocus = (event: React.KeyboardEvent<HTMLButtonElement>, amount: number): void => { event.preventDefault(); focus(addDays(parseLocalDate(event.currentTarget.dataset.date!), amount)); };
  const changeMonth = (amount: number): void => { const next = addMonths(viewMonth, amount); setViewMonth(next); setFocusedDate(dateValue(next)); };
  return <div className={`calendar-control ${open ? 'open' : ''}`} ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="calendar-trigger" aria-label={ariaLabel} aria-haspopup="dialog" aria-expanded={open} onClick={() => open ? setOpen(false) : show()} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); show(); } }}>{value ? formatCalendarDate(value) : 'Choose date'}<Icon name="calendar" /></button>
    {open && <div className="calendar-popover" role="dialog" aria-label={`${ariaLabel} calendar`} ref={popover} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus(); } }}>
      <div className="calendar-header"><strong>{viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong><div className="calendar-nav"><button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}>‹</button><button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>›</button></div></div>
      <div className="calendar-weekdays" aria-hidden="true">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid" role="grid" aria-label="Calendar dates">{days.map((day) => {
        const dayValue = dateValue(day);
        return <button type="button" role="gridcell" key={dayValue} data-date={dayValue} tabIndex={dayValue === focusedDate ? 0 : -1} className={`${day.getMonth() === viewMonth.getMonth() ? '' : 'outside'} ${dayValue === today ? 'today' : ''}`} aria-label={`Choose ${dayValue}`} aria-selected={dayValue === value} onClick={() => select(dayValue)} onKeyDown={(event) => { if (event.key === 'ArrowLeft') moveFocus(event, -1); else if (event.key === 'ArrowRight') moveFocus(event, 1); else if (event.key === 'ArrowUp') moveFocus(event, -7); else if (event.key === 'ArrowDown') moveFocus(event, 7); else if (event.key === 'PageUp') { event.preventDefault(); focus(addMonths(day, -1)); } else if (event.key === 'PageDown') { event.preventDefault(); focus(addMonths(day, 1)); } }}>{day.getDate()}</button>;
      })}</div>
      <div className="calendar-footer"><button type="button" onClick={() => select('')} disabled={!value}>Clear</button><button type="button" onClick={() => select(today)}>Today</button></div>
    </div>}
  </div>;
}
function ProjectDot({ project }: { project?: Project }) { return <span className="project-dot" style={{ background: project?.color ?? '#9A9AA1' }} />; }
function Logo() { return <span className="logo" aria-label="Rurinagi"><svg viewBox="0 0 512 512" role="img"><path d="M96 257c64-106 129-128 185-63 58 67 105 39 151-40" /><path className="logo-current" d="M96 358c79-65 145-64 200-17 50 42 94 24 136-22" /></svg></span>; }

type IconName = 'sun' | 'check' | 'timer' | 'history' | 'insights' | 'settings' | 'plus' | 'search' | 'more' | 'play' | 'calendar';
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    check: <path d="m5 12 4 4L19 6" />, timer: <><circle cx="12" cy="13" r="8" /><path d="M9 2h6M12 13l3-3" /></>,
    history: <><path d="M4 7v5h5" /><path d="M5.5 17a8 8 0 1 0-.8-8" /><path d="M12 8v5l3 2" /></>,
    insights: <><path d="M4 19V11M10 19V5M16 19v-6M22 19V8" /><path d="M3 19h20" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    plus: <path d="M12 5v14M5 12h14" />, search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 5 5" /></>, more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>, play: <path d="m8 5 11 7-11 7Z" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function toggleTask(state: AppState, task: Task): AppState { const complete = task.status !== 'complete'; return { ...state, tasks: state.tasks.map((item) => item.id === task.id ? { ...item, status: complete ? 'complete' : item.isToday ? 'planned' : 'inbox', completedAt: complete ? new Date().toISOString() : null } : item) }; }
function projectFor(state: AppState, id: string | null): Project | undefined { return state.projects.find((project) => project.id === id); }
function taskById(state: AppState, id: string | null): Task | undefined { return state.tasks.find((task) => task.id === id); }
function humanMinutes(seconds: number): string { const minutes = Math.round(seconds / 60); return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`; }
function focusDuration(seconds: number): string { return seconds < 60 ? 'Less than 1m' : humanMinutes(seconds); }
function insightDuration(seconds: number): string { return seconds > 0 && seconds < 60 ? '<1m' : humanMinutes(seconds); }
function boundedInt(value: string, min: number, max: number): number { return Math.min(max, Math.max(min, Number.parseInt(value, 10) || min)); }
function parseLocalDate(value: string): Date { const [year, month, day] = value.split('-').map(Number); return new Date(year!, month! - 1, day!, 12); }
function dateValue(date: Date): string { return localDate(date); }
function monthStart(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), 1, 12); }
function addDays(date: Date, amount: number): Date { return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, 12); }
function addMonths(date: Date, amount: number): Date { return new Date(date.getFullYear(), date.getMonth() + amount, Math.min(date.getDate(), new Date(date.getFullYear(), date.getMonth() + amount + 1, 0).getDate()), 12); }
function calendarDays(month: Date): Date[] { const start = addDays(month, -month.getDay()); return Array.from({ length: 42 }, (_, index) => addDays(start, index)); }
function formatCalendarDate(value: string): string { return parseLocalDate(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
function formatShortcut(value: string): string { return value.replace(/CommandOrControl|CmdOrCtrl|Control|Ctrl/gi, 'Ctrl').replace(/\s*\+\s*/g, ' + '); }
function parseShortcut(value: string): string { return value.trim().replace(/\s*\+\s*/g, '+').replace(/^Ctrl(?=\+)/i, 'CommandOrControl'); }
function formatDay(day: string): string { const date = new Date(`${day}T12:00:00`); return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }); }
function message(cause: unknown): string { return cause instanceof Error ? cause.message : String(cause); }
function playChime(): void {
  const AudioContextClass = window.AudioContext;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 660;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.38);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(); oscillator.stop(context.currentTime + 0.4);
  oscillator.addEventListener('ended', () => void context.close(), { once: true });
}
function groupSessions(sessions: Session[]): Map<string, Session[]> {
  const groups = new Map<string, Session[]>();
  for (const session of sessions) {
    const day = localDate(new Date(session.endedAt));
    groups.set(day, [...(groups.get(day) ?? []), session]);
  }
  return groups;
}
