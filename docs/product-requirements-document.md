# Rurinagi V2 product requirements

## Goal

Rurinagi helps one person answer “What should I work on now?” without an account or network connection. V2 preserves the complete daily loop and makes the app easier to keep available, read, and operate from Windows.

## Users

The primary user is an individual Windows user managing personal work such as job applications, interview preparation, coding projects, learning, and errands.

## Required experiences

- Today shows up to three priorities, overdue work, the active task, timer state, and a compact daily summary.
- Tasks supports named creation, edit, complete, reopen, archive, permanent delete, reorder, project assignment, priority, date, description, and session estimate.
- Focus shows one task, remaining time, a scratchpad, essential controls, completion, and breaks.
- Quick Capture opens from a global shortcut and saves to the inbox with immediate keyboard focus.
- The shortcut is shown in familiar Windows notation while its portable Electron accelerator remains valid internally.
- History lists completed, partial, and interrupted sessions with notes.
- Settings controls timer durations, break behavior, notifications, theme, reduced motion, startup behavior, backup, import, export, and deletion.
- Closing the main window keeps Rurinagi available in the system tray, whose menu can restore the app, open Quick Capture, or quit.
- The app uses the product website's green visual identity and keeps project metadata clearly spaced.
- Task creation and focus initiation have distinct visual hierarchy, task edits use an explicit Update task action, and dropdown menus match the application theme.

## Acceptance criteria

- The application launches and completes its core loop offline.
- A task moves from capture to Today to a recorded focus session.
- An active timer survives window closure and application restart.
- Completed or active sessions disappear only after an explicit destructive action.
- Primary workflows are keyboard navigable with visible focus.
- Reduced-motion mode removes nonessential movement.
- Local exports can be restored after validation.
- The system tray can restore a hidden main window and offers an explicit Quit command.
- Permanent task deletion requires confirmation, keeps historical session records, and is unavailable while that task has a live focus timer.
- Archive, task deletion, session deletion, and clearing all data use consistent in-app confirmation dialogs.
- Add task opens a focused name field and creates nothing until a non-empty name is submitted.
- The task inspector is absent until a task is selected or created; Update task saves the draft and closes it.

## Out of scope

Spotify, calendar, weather, detailed analytics, Focus Skyline, AI, accounts, collaboration, surveillance, and automatic closing of other applications.

