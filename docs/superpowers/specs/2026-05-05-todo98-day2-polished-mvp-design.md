# Todo98 Day 2 Polished MVP Design

## Decision

Day 2 focuses on the Polished MVP direction. Todo98 keeps the current Retro OS/Y2K identity, but the logged-in app becomes complete enough for real personal use.

Lazyweb references used:

- Any.do: fast task capture and readable task rows.
- Sunsama: day-planning density and clear prioritization.
- Asana: direct social-login entry with minimal friction.
- Appcues: friendly empty states that explain the next useful action.

## Scope

### Login and Landing

The public page remains a retro desktop-style landing page. The login window should stay obvious and action-oriented:

- Google and Kakao login buttons remain the primary calls to action.
- Setup/auth errors remain visible in a retro window.
- The copy should make clear that login opens the user's private `Today.tasks`.

### Logged-In TODO App

The logged-in app should complete the core task workflow:

- Add a task with title, optional note, optional due date, and priority.
- Edit an existing task's title, note, due date, and priority.
- Delete a task.
- Complete and uncomplete a task.
- Filter by Today, All, and Completed.
- Show readable metadata on each task row.
- Show an empty state that tells the user what to do next.

The layout remains a focused two-window desktop:

- `User.ini`: account email and logout.
- `Today.tasks`: filters, editor, error state, and task list.

Day 2 does not add recurring tasks, drag sorting, tags, team sharing, analytics, or a larger OS-style multi-window desktop.

## Components

### TaskEditor

`TaskEditor` becomes a reusable form for both creating and editing tasks. It accepts an optional initial task and submits structured task input:

- `title`
- `note`
- `dueDate`
- `priority`

For creation, defaults are title empty, note empty, due date today, and priority normal.

### TaskList

`TaskList` renders task rows with:

- complete/uncomplete control
- title
- note preview when present
- due date label when present
- priority label
- edit command
- delete command

It should keep rows compact and scannable.

### TaskDesktop

`TaskDesktop` owns client state and server persistence calls. It manages:

- current filter
- current editing task
- optimistic local-only fallback when no `userId` is available
- surfaced error messages

## Data Flow

Task operations continue to use `createTaskService`.

The service needs one new method:

- `updateTask(taskId, input)` validates input, updates the matching row for the current user, and returns the updated record.

Create, update, complete, and delete should all update local React state only after success for authenticated users. The local fallback path should mirror the same behavior without Supabase.

## Error Handling

- Empty titles are blocked before save.
- Supabase create/update/delete/complete failures show the returned message in the retro error window.
- Editing can be cancelled without changing the task.
- After a successful save, the editor resets to creation mode and clears the error.

## Testing

Automated tests should cover:

- validating structured task input including note, due date, and priority defaults
- updating task fields through the task service
- rendering note, due date, and priority in task rows
- creating a task from the expanded editor
- editing an existing task
- cancelling edit mode
- existing login and filter behavior still passing

## Acceptance Criteria

- A user can log in and manage tasks with title, note, due date, and priority.
- A user can edit every editable task field after creation.
- Today, All, and Completed filters remain usable.
- The UI still reads as Todo98: retro windows, square controls, Y2K accents, and no generic SaaS landing page.
- `npm test` passes.
