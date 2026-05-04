# Todo98 Day 2 Polished MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Todo98's logged-in MVP so users can create, edit, complete, delete, and filter tasks with title, note, due date, and priority.

**Architecture:** Keep the current Next.js App Router structure. Expand the existing task domain in `lib/tasks.ts`, make `TaskEditor` submit structured input for create/edit, keep `TaskDesktop` as the state owner, and make `TaskList` a compact display/action component.

**Tech Stack:** Next.js 16 canary, React 19, TypeScript, Supabase JS, Vitest, Testing Library.

---

## File Map

- Modify `lib/tasks.ts`: add `updateTask`, keep validation centralized, export existing task types.
- Modify `components/tasks/TaskEditor.tsx`: support title, note, due date, priority, create/edit mode, cancel.
- Modify `components/tasks/TaskList.tsx`: render metadata and expose edit/delete/complete actions.
- Modify `components/tasks/TaskDesktop.tsx`: wire structured create/update flows, edit mode, filter selected state.
- Modify `app/globals.css`: style expanded editor, task metadata, empty state, active filters, mobile behavior.
- Modify `test/tasks.test.ts`: cover validation and service update.
- Modify `test/task-ui.test.tsx`: cover create, edit, cancel, metadata rendering.

## Task 1: Task Domain Update

**Files:**
- Modify: `lib/tasks.ts`
- Test: `test/tasks.test.ts`

- [ ] **Step 1: Write failing validation and update-service tests**

Add these tests to `test/tasks.test.ts`:

```ts
it("trims note and keeps explicit due date and priority", () => {
  expect(
    validateTaskInput({
      title: "  디자인 점검  ",
      note: "  Lazyweb 참고 반영  ",
      dueDate: "2026-05-05",
      priority: "high",
    }),
  ).toEqual({
    ok: true,
    value: {
      title: "디자인 점검",
      note: "Lazyweb 참고 반영",
      dueDate: "2026-05-05",
      priority: "high",
    },
  });
});

it("updates an existing task for the current user", async () => {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: () => ({
          single: async () => ({
            data: {
              id: "task-1",
              title: "수정된 제목",
              note: "메모",
              due_date: "2026-05-05",
              priority: "high",
            },
            error: null,
          }),
        }),
      }),
    }),
  });
  const service = createTaskService({ from: () => ({ update }) } as never, "user-1");

  const result = await service.updateTask("task-1", {
    title: " 수정된 제목 ",
    note: " 메모 ",
    dueDate: "2026-05-05",
    priority: "high",
  });

  expect(update).toHaveBeenCalledWith({
    title: "수정된 제목",
    note: "메모",
    due_date: "2026-05-05",
    priority: "high",
  });
  expect(result.ok).toBe(true);
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `npm test -- test/tasks.test.ts`

Expected: validation test passes or exposes gaps; update-service test fails because `updateTask` does not exist.

- [ ] **Step 3: Implement `updateTask`**

Add this method inside the object returned by `createTaskService` in `lib/tasks.ts`:

```ts
async updateTask(taskId: string, input: TaskInput) {
  const validated = validateTaskInput(input);
  if (!validated.ok) return validated;

  const { data, error } = await client
    .from("tasks")
    .update({
      title: validated.value.title,
      note: validated.value.note,
      due_date: validated.value.dueDate,
      priority: validated.value.priority,
    })
    .eq("id", taskId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, value: data as TaskRecord };
},
```

- [ ] **Step 4: Run the tests and verify pass**

Run: `npm test -- test/tasks.test.ts`

Expected: all tests in `test/tasks.test.ts` pass.

- [ ] **Step 5: Commit**

```bash
git add lib/tasks.ts test/tasks.test.ts
git commit -m "feat: add task update service"
```

## Task 2: Expanded Task Editor

**Files:**
- Modify: `components/tasks/TaskEditor.tsx`
- Modify: `app/globals.css`
- Test: `test/task-ui.test.tsx`

- [ ] **Step 1: Write failing editor create test**

Update the local-task test in `test/task-ui.test.tsx` so it fills all fields:

```ts
await user.type(screen.getByLabelText("할 일 제목"), "도메인 구매하기");
await user.type(screen.getByLabelText("메모"), "Vercel 연결 전에 후보 확인");
await user.clear(screen.getByLabelText("마감일"));
await user.type(screen.getByLabelText("마감일"), "2026-05-05");
await user.selectOptions(screen.getByLabelText("우선순위"), "high");
await user.click(screen.getByRole("button", { name: "추가" }));

expect(screen.getByText("도메인 구매하기")).toBeInTheDocument();
expect(screen.getByText("Vercel 연결 전에 후보 확인")).toBeInTheDocument();
expect(screen.getByText("2026-05-05")).toBeInTheDocument();
expect(screen.getByText("HIGH")).toBeInTheDocument();
```

- [ ] **Step 2: Run the UI test and verify failure**

Run: `npm test -- test/task-ui.test.tsx`

Expected: fails because note, due date, and priority fields are missing.

- [ ] **Step 3: Implement structured `TaskEditor` props**

Replace `TaskEditorProps` with:

```ts
interface TaskEditorProps {
  mode?: "create" | "edit";
  initialTask?: Pick<TaskRecord, "title" | "note" | "due_date" | "priority">;
  onSubmit: (input: TaskInput) => void;
  onCancel?: () => void;
}
```

Import `TaskInput`, `TaskPriority`, `TaskRecord`, and `dateKey` from `@/lib/tasks`. The editor should keep local state for `title`, `note`, `dueDate`, and `priority`. On submit, call:

```ts
onSubmit({ title: clean, note, dueDate, priority });
```

Render labels exactly as:

- `할 일 제목`
- `메모`
- `마감일`
- `우선순위`

Use `RetroInput` for title and date, a `<textarea className="retro-input retro-textarea">` for note, and `RetroSelect` for priority values `low`, `normal`, `high`.

- [ ] **Step 4: Add editor CSS**

In `app/globals.css`, update `.task-editor` to a responsive grid and add:

```css
.task-editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px 150px;
  gap: 10px;
  align-items: end;
}

.task-editor-field {
  display: grid;
  gap: 6px;
  font-weight: 900;
}

.task-editor-note {
  grid-column: 1 / -1;
}

.retro-textarea {
  min-height: 76px;
  padding-top: 8px;
  resize: vertical;
}

.task-editor-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
```

- [ ] **Step 5: Run the UI test and verify pass**

Run: `npm test -- test/task-ui.test.tsx`

Expected: the create flow test passes.

- [ ] **Step 6: Commit**

```bash
git add components/tasks/TaskEditor.tsx app/globals.css test/task-ui.test.tsx
git commit -m "feat: expand task editor fields"
```

## Task 3: Task Row Metadata and Empty State

**Files:**
- Modify: `components/tasks/TaskList.tsx`
- Modify: `app/globals.css`
- Test: `test/task-ui.test.tsx`

- [ ] **Step 1: Write failing metadata test**

Add a test to `test/task-ui.test.tsx` that renders `TaskDesktop` with one initial task:

```ts
it("shows task metadata and an empty state", () => {
  render(
    <TaskDesktop
      userEmail="me@example.com"
      initialTasks={[
        {
          id: "task-1",
          user_id: "local",
          title: "Lazyweb 레퍼런스 반영",
          note: "Any.do와 Sunsama 참고",
          due_date: "2026-05-05",
          priority: "high",
          completed_at: null,
          created_at: "2026-05-05T00:00:00.000Z",
          updated_at: "2026-05-05T00:00:00.000Z",
        },
      ]}
    />,
  );

  expect(screen.getByText("Lazyweb 레퍼런스 반영")).toBeInTheDocument();
  expect(screen.getByText("Any.do와 Sunsama 참고")).toBeInTheDocument();
  expect(screen.getByText("2026-05-05")).toBeInTheDocument();
  expect(screen.getByText("HIGH")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the UI test and verify failure**

Run: `npm test -- test/task-ui.test.tsx`

Expected: fails because note and due date are not rendered.

- [ ] **Step 3: Implement metadata rows**

Update `TaskListProps`:

```ts
interface TaskListProps {
  tasks: TaskRecord[];
  onToggle: (id: string) => void | Promise<void>;
  onEdit: (task: TaskRecord) => void;
  onDelete: (id: string) => void | Promise<void>;
}
```

Render each row with `.task-main`, `.task-title-line`, `.task-note`, and `.task-meta`. Add an edit button:

```tsx
<RetroButton type="button" aria-label={`${task.title} 수정`} onClick={() => onEdit(task)}>
  수정
</RetroButton>
```

For empty state, return:

```tsx
<div className="empty-task">
  <strong>표시할 할 일이 없습니다.</strong>
  <span>새 할 일을 추가하면 이 창에 바로 나타납니다.</span>
</div>
```

- [ ] **Step 4: Add row CSS**

In `app/globals.css`, replace the old row grid with:

```css
.task-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: start;
  gap: 10px;
  padding: 10px;
  border: 2px solid var(--ink);
  background: #ffffff;
}

.task-main {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.task-title-line {
  font-weight: 900;
  overflow-wrap: anywhere;
}

.task-note {
  margin: 0;
  color: #565656;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.task-chip {
  border: 1px solid var(--ink);
  background: #fffdf7;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 900;
}

.empty-task {
  display: grid;
  gap: 4px;
  padding: 18px;
  border: 2px dashed var(--ink);
  background: #fffdf7;
}
```

- [ ] **Step 5: Run the UI test and verify pass**

Run: `npm test -- test/task-ui.test.tsx`

Expected: metadata test passes.

- [ ] **Step 6: Commit**

```bash
git add components/tasks/TaskList.tsx app/globals.css test/task-ui.test.tsx
git commit -m "feat: show task metadata"
```

## Task 4: Edit Flow in TaskDesktop

**Files:**
- Modify: `components/tasks/TaskDesktop.tsx`
- Test: `test/task-ui.test.tsx`

- [ ] **Step 1: Write failing edit and cancel tests**

Add:

```ts
it("edits a local task", async () => {
  const user = userEvent.setup();
  render(
    <TaskDesktop
      userEmail="me@example.com"
      initialTasks={[
        {
          id: "task-1",
          user_id: "local",
          title: "초안",
          note: null,
          due_date: "2026-05-05",
          priority: "normal",
          completed_at: null,
          created_at: "2026-05-05T00:00:00.000Z",
          updated_at: "2026-05-05T00:00:00.000Z",
        },
      ]}
    />,
  );

  await user.click(screen.getByRole("button", { name: "초안 수정" }));
  await user.clear(screen.getByLabelText("할 일 제목"));
  await user.type(screen.getByLabelText("할 일 제목"), "수정된 할 일");
  await user.type(screen.getByLabelText("메모"), "편집 메모");
  await user.selectOptions(screen.getByLabelText("우선순위"), "high");
  await user.click(screen.getByRole("button", { name: "수정 저장" }));

  expect(screen.getByText("수정된 할 일")).toBeInTheDocument();
  expect(screen.getByText("편집 메모")).toBeInTheDocument();
  expect(screen.getByText("HIGH")).toBeInTheDocument();
});

it("cancels editing without changing the task", async () => {
  const user = userEvent.setup();
  render(
    <TaskDesktop
      userEmail="me@example.com"
      initialTasks={[
        {
          id: "task-1",
          user_id: "local",
          title: "유지할 제목",
          note: null,
          due_date: "2026-05-05",
          priority: "normal",
          completed_at: null,
          created_at: "2026-05-05T00:00:00.000Z",
          updated_at: "2026-05-05T00:00:00.000Z",
        },
      ]}
    />,
  );

  await user.click(screen.getByRole("button", { name: "유지할 제목 수정" }));
  await user.clear(screen.getByLabelText("할 일 제목"));
  await user.type(screen.getByLabelText("할 일 제목"), "버릴 제목");
  await user.click(screen.getByRole("button", { name: "취소" }));

  expect(screen.getByText("유지할 제목")).toBeInTheDocument();
  expect(screen.queryByText("버릴 제목")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the UI test and verify failure**

Run: `npm test -- test/task-ui.test.tsx`

Expected: fails because edit mode is not wired.

- [ ] **Step 3: Wire create/update state**

In `TaskDesktop`, replace `addTask(title: string)` with `addTask(input: TaskInput)` and add:

```ts
const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);

async function updateTask(input: TaskInput) {
  if (!editingTask) return;
  const now = new Date().toISOString();
  const validated = validateTaskInput(input);
  if (!validated.ok) {
    setError(validated.message);
    return;
  }

  if (!userId) {
    setTasks((current) =>
      current.map((task) =>
        task.id === editingTask.id
          ? {
              ...task,
              title: validated.value.title,
              note: validated.value.note,
              due_date: validated.value.dueDate,
              priority: validated.value.priority,
              updated_at: now,
            }
          : task,
      ),
    );
    setEditingTask(null);
    setError(null);
    return;
  }

  const result = await createTaskService(createSupabaseBrowserClient(), userId).updateTask(editingTask.id, input);
  if (!result.ok) {
    setError(result.message);
    return;
  }

  setTasks((current) => current.map((task) => (task.id === editingTask.id ? result.value : task)));
  setEditingTask(null);
  setError(null);
}
```

Render:

```tsx
<TaskEditor
  mode={editingTask ? "edit" : "create"}
  initialTask={editingTask ?? undefined}
  onSubmit={(input) => void (editingTask ? updateTask(input) : addTask(input))}
  onCancel={editingTask ? () => setEditingTask(null) : undefined}
/>
```

Pass `onEdit={setEditingTask}` to `TaskList`.

- [ ] **Step 4: Run the UI test and verify pass**

Run: `npm test -- test/task-ui.test.tsx`

Expected: edit and cancel tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/tasks/TaskDesktop.tsx test/task-ui.test.tsx
git commit -m "feat: add task edit flow"
```

## Task 5: Final Polish and Full Verification

**Files:**
- Modify: `app/globals.css`
- Test: all tests

- [ ] **Step 1: Add active filter styling**

Update filter buttons in `TaskDesktop`:

```tsx
<RetroButton type="button" className={filter === "today" ? "is-active" : ""} onClick={() => setFilter("today")}>
  오늘
</RetroButton>
```

Repeat for `all` and `completed`.

Add CSS:

```css
.retro-button.is-active {
  background: var(--lemon);
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--shadow);
}
```

- [ ] **Step 2: Add mobile CSS**

Append:

```css
@media (max-width: 760px) {
  .task-desktop {
    grid-template-columns: 1fr;
  }

  .task-editor-grid {
    grid-template-columns: 1fr;
  }

  .task-toolbar {
    display: grid;
  }

  .task-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .task-row > .retro-button:last-child,
  .task-row > .retro-button:nth-last-child(2) {
    grid-column: span 1;
  }
}
```

- [ ] **Step 3: Run full tests**

Run: `npm test`

Expected: all Vitest tests pass.

- [ ] **Step 4: Start local dev server**

Run: `npm run dev`

Expected: server starts on `http://127.0.0.1:3000`.

- [ ] **Step 5: Browser smoke test**

Open `http://127.0.0.1:3000` in the in-app browser. Confirm:

- landing page shows Todo98 and Google/Kakao login buttons
- if local unauthenticated fallback is directly rendered in tests only, no protected user data appears publicly
- UI has no overlapping text at desktop width

- [ ] **Step 6: Commit final polish**

```bash
git add app/globals.css components/tasks/TaskDesktop.tsx
git commit -m "style: polish task desktop interactions"
```

## Self-Review

- Spec coverage: login/landing remains intact; logged-in task create/edit/delete/complete/filter workflow is covered; empty state and metadata are covered; out-of-scope items are excluded.
- Placeholder scan: no TBD or unspecified implementation steps remain.
- Type consistency: `TaskInput`, `TaskRecord`, `TaskPriority`, `updateTask`, `onSubmit`, and `onEdit` names are consistent across tasks.
