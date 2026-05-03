# Todo98 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy Todo98, a Retro OS Window / Y2K personal TODO app with Google and Kakao login, Supabase persistence, Vercel hosting, and a paid custom domain.

**Architecture:** Use Next.js App Router with TypeScript for the frontend, Supabase Auth for Google/Kakao OAuth, and Supabase Postgres with RLS for task data. Keep task logic in small pure modules and isolate Supabase calls behind service functions so UI tests can use mocks.

**Tech Stack:** Next.js, React, TypeScript, Supabase JS, Vitest, Testing Library, Playwright, Vercel, Supabase Free.

---

## User Action Checklist

These actions require your browser accounts or paid domain purchase.

- [ ] Create a Supabase project on the free plan.
- [ ] Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] In Supabase SQL editor, run the `tasks` table and RLS SQL from Task 3.
- [ ] Create a Google OAuth app in Google Cloud Console.
- [ ] Add the Supabase callback URL to Google authorized redirect URIs.
- [ ] Paste Google client ID and secret into Supabase Auth provider settings.
- [ ] Create a Kakao app in Kakao Developers.
- [ ] Enable Kakao Login and add the Supabase callback URL.
- [ ] Paste Kakao REST API key and secret into Supabase Auth provider settings.
- [ ] Create or connect a Vercel account.
- [ ] Add Supabase environment variables to Vercel.
- [ ] Buy a domain after the Vercel preview works.
- [ ] Add the purchased domain to the Vercel project.
- [ ] Update DNS records at the domain registrar.
- [ ] Add the production domain to Supabase Auth redirect URLs.
- [ ] Add production redirect URLs to Google and Kakao developer consoles.
- [ ] Test Google and Kakao login on the final domain.

Official references:

- Supabase Google login: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase Kakao login: https://supabase.com/docs/guides/auth/social-login/auth-kakao
- Vercel custom domains: https://vercel.com/docs/concepts/projects/domains/add-a-domain
- Next.js create app: https://nextjs.org/docs/app/api-reference/create-next-app

## File Structure

Create this structure:

```text
Todo98/
  app/
    auth/callback/route.ts
    layout.tsx
    page.tsx
  components/
    auth/LoginWindow.tsx
    tasks/TaskDesktop.tsx
    tasks/TaskEditor.tsx
    tasks/TaskList.tsx
    ui/RetroButton.tsx
    ui/RetroDialog.tsx
    ui/RetroInput.tsx
    ui/RetroSelect.tsx
    ui/RetroWindow.tsx
  lib/
    auth.ts
    dates.ts
    env.ts
    supabase/
      browser.ts
      server.ts
    tasks.ts
  supabase/
    schema.sql
  test/
    auth.test.ts
    tasks.test.ts
    task-filter.test.ts
    setup.ts
  e2e/
    smoke.spec.ts
  .env.example
  package.json
  vitest.config.ts
  playwright.config.ts
```

Responsibilities:

- `lib/tasks.ts`: pure task filtering, validation, mapping, and Supabase CRUD wrappers.
- `lib/auth.ts`: OAuth provider calls and auth callback helpers.
- `components/ui/*`: reusable Retro OS primitives.
- `components/tasks/*`: signed-in TODO experience.
- `components/auth/LoginWindow.tsx`: public login UI.
- `supabase/schema.sql`: source-controlled database schema and RLS policies.

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `vitest.config.ts`
- Create: `test/setup.ts`
- Create: `.env.example`

- [ ] **Step 1: Create the app shell**

Run:

```powershell
npx create-next-app@latest . --ts --eslint --app --src-dir=false --import-alias "@/*"
```

Expected:

- Next.js project files are created in `C:\Users\SSAFY\Documents\Todo98`.
- Existing `docs/` remains intact.

- [ ] **Step 2: Install dependencies**

Run:

```powershell
npm install @supabase/ssr @supabase/supabase-js lucide-react
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright @playwright/test
```

Expected: packages install without vulnerabilities that block development.

- [ ] **Step 3: Add test scripts**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev --hostname 127.0.0.1",
    "build": "next build",
    "start": "next start --hostname 127.0.0.1",
    "lint": "next lint",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 4: Add Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
  },
});
```

- [ ] **Step 5: Add test setup**

Create `test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 6: Add environment example**

Create `.env.example`:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 7: Verify scaffold**

Run:

```powershell
npm test -- --run --passWithNoTests
npm run build
```

Expected:

- Tests run with no tests found or pass once initial tests are added.
- Build succeeds after the default app compiles.

- [ ] **Step 8: Commit**

```powershell
git add .
git commit -m "chore: scaffold Todo98 Next.js app"
```

---

### Task 2: Environment and Supabase Clients

**Files:**
- Create: `lib/env.ts`
- Create: `lib/supabase/browser.ts`
- Create: `lib/supabase/server.ts`
- Test: `test/auth.test.ts`

- [ ] **Step 1: Write failing env test**

Create `test/auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getPublicEnv } from "@/lib/env";

describe("environment config", () => {
  it("returns a setup error when Supabase env vars are missing", () => {
    const result = getPublicEnv({});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Supabase 환경변수");
    }
  });

  it("returns Supabase config when env vars exist", () => {
    const result = getPublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon-key",
      },
    });
  });
});
```

- [ ] **Step 2: Verify test fails**

Run:

```powershell
npm test -- --run test/auth.test.ts
```

Expected: FAIL because `@/lib/env` does not exist.

- [ ] **Step 3: Implement env helper**

Create `lib/env.ts`:

```ts
export type PublicEnv =
  | {
      ok: true;
      value: {
        supabaseUrl: string;
        supabaseAnonKey: string;
      };
    }
  | {
      ok: false;
      message: string;
    };

export function getPublicEnv(source: NodeJS.ProcessEnv = process.env): PublicEnv {
  const supabaseUrl = source.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = source.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      message: "Supabase 환경변수가 필요합니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.",
    };
  }

  return {
    ok: true,
    value: { supabaseUrl, supabaseAnonKey },
  };
}
```

- [ ] **Step 4: Implement browser Supabase client**

Create `lib/supabase/browser.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const env = getPublicEnv();

  if (!env.ok) {
    throw new Error(env.message);
  }

  return createBrowserClient(env.value.supabaseUrl, env.value.supabaseAnonKey);
}
```

- [ ] **Step 5: Implement server Supabase client**

Create `lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  const env = getPublicEnv();

  if (!env.ok) {
    throw new Error(env.message);
  }

  const cookieStore = await cookies();

  return createServerClient(env.value.supabaseUrl, env.value.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}
```

- [ ] **Step 6: Verify tests**

Run:

```powershell
npm test -- --run test/auth.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add lib test
git commit -m "feat: add Supabase environment helpers"
```

---

### Task 3: Supabase Database Schema

**Files:**
- Create: `supabase/schema.sql`
- Test: `test/tasks.test.ts`

- [ ] **Step 1: Write task validation test**

Create `test/tasks.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateTaskInput } from "@/lib/tasks";

describe("task validation", () => {
  it("rejects an empty title", () => {
    expect(validateTaskInput({ title: "   " })).toEqual({
      ok: false,
      message: "할 일 제목을 입력해주세요.",
    });
  });

  it("accepts a non-empty title and normalizes priority", () => {
    expect(validateTaskInput({ title: "  도메인 연결  " })).toEqual({
      ok: true,
      value: {
        title: "도메인 연결",
        note: null,
        dueDate: null,
        priority: "normal",
      },
    });
  });
});
```

- [ ] **Step 2: Verify test fails**

Run:

```powershell
npm test -- --run test/tasks.test.ts
```

Expected: FAIL because `@/lib/tasks` does not exist.

- [ ] **Step 3: Create task domain helpers**

Create `lib/tasks.ts`:

```ts
export type TaskPriority = "low" | "normal" | "high";

export interface TaskInput {
  title: string;
  note?: string | null;
  dueDate?: string | null;
  priority?: TaskPriority | null;
}

export interface TaskRecord {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  due_date: string | null;
  priority: TaskPriority;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ValidatedTaskInput =
  | {
      ok: true;
      value: {
        title: string;
        note: string | null;
        dueDate: string | null;
        priority: TaskPriority;
      };
    }
  | {
      ok: false;
      message: string;
    };

export function validateTaskInput(input: TaskInput): ValidatedTaskInput {
  const title = input.title.trim();

  if (!title) {
    return { ok: false, message: "할 일 제목을 입력해주세요." };
  }

  return {
    ok: true,
    value: {
      title,
      note: input.note?.trim() || null,
      dueDate: input.dueDate || null,
      priority: input.priority || "normal",
    },
  };
}
```

- [ ] **Step 4: Add Supabase SQL**

Create `supabase/schema.sql`:

```sql
create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  note text,
  due_date date,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_user_due_date_idx on public.tasks(user_id, due_date);
create index if not exists tasks_user_completed_idx on public.tasks(user_id, completed_at);

alter table public.tasks enable row level security;

drop policy if exists "Users can read own tasks" on public.tasks;
create policy "Users can read own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own tasks" on public.tasks;
create policy "Users can create own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();
```

- [ ] **Step 5: Verify tests**

Run:

```powershell
npm test -- --run test/tasks.test.ts
```

Expected: PASS.

- [ ] **Step 6: User runs SQL in Supabase**

User action: open Supabase SQL editor, paste `supabase/schema.sql`, run it, confirm the `tasks` table appears.

- [ ] **Step 7: Commit**

```powershell
git add lib/tasks.ts supabase/schema.sql test/tasks.test.ts
git commit -m "feat: add task schema and validation"
```

---

### Task 4: Task Filtering and CRUD Services

**Files:**
- Modify: `lib/tasks.ts`
- Test: `test/task-filter.test.ts`
- Test: `test/tasks.test.ts`

- [ ] **Step 1: Write filtering tests**

Create `test/task-filter.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { filterTasks, type TaskRecord } from "@/lib/tasks";

const baseTask: TaskRecord = {
  id: "1",
  user_id: "user-1",
  title: "Task",
  note: null,
  due_date: null,
  priority: "normal",
  completed_at: null,
  created_at: "2026-05-03T00:00:00.000Z",
  updated_at: "2026-05-03T00:00:00.000Z",
};

describe("task filters", () => {
  it("returns today's open tasks for the today filter", () => {
    const tasks: TaskRecord[] = [
      { ...baseTask, id: "today", due_date: "2026-05-03" },
      { ...baseTask, id: "future", due_date: "2026-05-04" },
      { ...baseTask, id: "done", due_date: "2026-05-03", completed_at: "2026-05-03T03:00:00.000Z" },
    ];

    expect(filterTasks(tasks, "today", new Date("2026-05-03T12:00:00.000Z")).map((task) => task.id)).toEqual([
      "today",
    ]);
  });

  it("returns completed tasks for the completed filter", () => {
    const tasks: TaskRecord[] = [
      { ...baseTask, id: "open" },
      { ...baseTask, id: "done", completed_at: "2026-05-03T03:00:00.000Z" },
    ];

    expect(filterTasks(tasks, "completed").map((task) => task.id)).toEqual(["done"]);
  });
});
```

- [ ] **Step 2: Verify test fails**

Run:

```powershell
npm test -- --run test/task-filter.test.ts
```

Expected: FAIL because `filterTasks` does not exist.

- [ ] **Step 3: Implement filtering and CRUD signatures**

Modify `lib/tasks.ts`:

```ts
export type TaskPriority = "low" | "normal" | "high";
export type TaskFilter = "today" | "all" | "completed";

export interface TaskInput {
  title: string;
  note?: string | null;
  dueDate?: string | null;
  priority?: TaskPriority | null;
}

export interface TaskRecord {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  due_date: string | null;
  priority: TaskPriority;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ValidatedTaskInput =
  | {
      ok: true;
      value: {
        title: string;
        note: string | null;
        dueDate: string | null;
        priority: TaskPriority;
      };
    }
  | {
      ok: false;
      message: string;
    };

export function validateTaskInput(input: TaskInput): ValidatedTaskInput {
  const title = input.title.trim();

  if (!title) {
    return { ok: false, message: "할 일 제목을 입력해주세요." };
  }

  return {
    ok: true,
    value: {
      title,
      note: input.note?.trim() || null,
      dueDate: input.dueDate || null,
      priority: input.priority || "normal",
    },
  };
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function filterTasks(tasks: TaskRecord[], filter: TaskFilter, today = new Date()): TaskRecord[] {
  if (filter === "completed") {
    return tasks.filter((task) => Boolean(task.completed_at));
  }

  if (filter === "today") {
    const todayKey = dateKey(today);
    return tasks.filter((task) => !task.completed_at && task.due_date === todayKey);
  }

  return tasks.filter((task) => !task.completed_at);
}
```

- [ ] **Step 4: Verify tests**

Run:

```powershell
npm test -- --run test/tasks.test.ts test/task-filter.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/tasks.ts test/task-filter.test.ts test/tasks.test.ts
git commit -m "feat: add task filtering"
```

---

### Task 5: OAuth Login Flow

**Files:**
- Create: `lib/auth.ts`
- Create: `app/auth/callback/route.ts`
- Create: `components/auth/LoginWindow.tsx`
- Modify: `test/auth.test.ts`

- [ ] **Step 1: Write OAuth tests**

Append to `test/auth.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createOAuthLogin } from "@/lib/auth";

describe("OAuth login", () => {
  it("starts Google login with Supabase OAuth provider", async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({ data: {}, error: null });
    const login = createOAuthLogin({ auth: { signInWithOAuth } } as never, "https://todo98.test");

    await login("google");

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://todo98.test/auth/callback",
      },
    });
  });

  it("starts Kakao login with Supabase OAuth provider", async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({ data: {}, error: null });
    const login = createOAuthLogin({ auth: { signInWithOAuth } } as never, "https://todo98.test");

    await login("kakao");

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "kakao",
      options: {
        redirectTo: "https://todo98.test/auth/callback",
      },
    });
  });
});
```

- [ ] **Step 2: Verify test fails**

Run:

```powershell
npm test -- --run test/auth.test.ts
```

Expected: FAIL because `@/lib/auth` does not exist.

- [ ] **Step 3: Implement auth helper**

Create `lib/auth.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type OAuthProvider = "google" | "kakao";

export function createOAuthLogin(client: SupabaseClient, origin: string) {
  return async function login(provider: OAuthProvider) {
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }
  };
}
```

- [ ] **Step 4: Implement callback route**

Create `app/auth/callback/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/", request.url));
}
```

- [ ] **Step 5: Implement login window**

Create `components/auth/LoginWindow.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createOAuthLogin, type OAuthProvider } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroWindow } from "@/components/ui/RetroWindow";

export function LoginWindow() {
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(provider: OAuthProvider) {
    try {
      setError(null);
      const supabase = createSupabaseBrowserClient();
      await createOAuthLogin(supabase, window.location.origin)(provider);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "로그인을 시작하지 못했습니다.");
    }
  }

  return (
    <RetroWindow title="Login.exe" className="login-window">
      <p className="window-copy">Google 또는 Kakao 계정으로 Todo98을 시작하세요.</p>
      <div className="login-actions">
        <RetroButton type="button" onClick={() => void handleLogin("google")}>
          Google로 계속하기
        </RetroButton>
        <RetroButton type="button" onClick={() => void handleLogin("kakao")}>
          Kakao로 계속하기
        </RetroButton>
      </div>
      {error && <p className="retro-error">{error}</p>}
    </RetroWindow>
  );
}
```

- [ ] **Step 6: Verify tests**

Run:

```powershell
npm test -- --run test/auth.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add app/auth components/auth lib/auth.ts test/auth.test.ts
git commit -m "feat: add OAuth login flow"
```

---

### Task 6: Retro OS UI Primitives

**Files:**
- Create: `components/ui/RetroWindow.tsx`
- Create: `components/ui/RetroButton.tsx`
- Create: `components/ui/RetroInput.tsx`
- Create: `components/ui/RetroSelect.tsx`
- Create: `components/ui/RetroDialog.tsx`
- Modify: `app/globals.css`
- Test: `test/ui.test.tsx`

- [ ] **Step 1: Write UI smoke test**

Create `test/ui.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RetroWindow } from "@/components/ui/RetroWindow";

describe("RetroWindow", () => {
  it("renders a window title and content", () => {
    render(
      <RetroWindow title="Today.tasks">
        <p>할 일 목록</p>
      </RetroWindow>,
    );

    expect(screen.getByText("Today.tasks")).toBeInTheDocument();
    expect(screen.getByText("할 일 목록")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify test fails**

Run:

```powershell
npm test -- --run test/ui.test.tsx
```

Expected: FAIL because `RetroWindow` does not exist.

- [ ] **Step 3: Implement UI primitives**

Create `components/ui/RetroWindow.tsx`:

```tsx
import type { ReactNode } from "react";

interface RetroWindowProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function RetroWindow({ title, children, className = "" }: RetroWindowProps) {
  return (
    <section className={`retro-window ${className}`.trim()}>
      <div className="retro-titlebar">
        <span>{title}</span>
        <div className="retro-controls" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="retro-window-body">{children}</div>
    </section>
  );
}
```

Create `components/ui/RetroButton.tsx`:

```tsx
import type { ButtonHTMLAttributes } from "react";

export function RetroButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`retro-button ${props.className ?? ""}`.trim()} />;
}
```

Create `components/ui/RetroInput.tsx`:

```tsx
import type { InputHTMLAttributes } from "react";

export function RetroInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`retro-input ${props.className ?? ""}`.trim()} />;
}
```

Create `components/ui/RetroSelect.tsx`:

```tsx
import type { SelectHTMLAttributes } from "react";

export function RetroSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`retro-select ${props.className ?? ""}`.trim()} />;
}
```

Create `components/ui/RetroDialog.tsx`:

```tsx
import { RetroWindow } from "@/components/ui/RetroWindow";

interface RetroDialogProps {
  message: string;
}

export function RetroDialog({ message }: RetroDialogProps) {
  return (
    <RetroWindow title="Alert.exe" className="retro-dialog">
      <p>{message}</p>
    </RetroWindow>
  );
}
```

- [ ] **Step 4: Add global Retro OS CSS**

Modify `app/globals.css` to include:

```css
:root {
  --ink: #111111;
  --paper: #f7f7fb;
  --window: #ffffff;
  --blue: #175cff;
  --mint: #8fffea;
  --lemon: #f7ff5f;
  --pink: #ff72d2;
  --shadow: #777777;
}

* {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
}

body {
  margin: 0;
  color: var(--ink);
  background:
    linear-gradient(rgba(17, 17, 17, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(17, 17, 17, 0.05) 1px, transparent 1px),
    var(--paper);
  background-size: 24px 24px;
  font-family: "Trebuchet MS", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

.retro-window {
  border: 2px solid var(--ink);
  background: var(--window);
  box-shadow: 5px 5px 0 var(--shadow);
}

.retro-titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 34px;
  padding: 6px 8px;
  border-bottom: 2px solid var(--ink);
  background: var(--blue);
  color: #ffffff;
  font-weight: 900;
}

.retro-controls {
  display: flex;
  gap: 4px;
}

.retro-controls span {
  width: 14px;
  height: 14px;
  border: 1px solid var(--ink);
  background: #ffffff;
}

.retro-window-body {
  padding: 16px;
}

.retro-button,
.retro-input,
.retro-select {
  min-height: 38px;
  border: 2px solid var(--ink);
  background: #ffffff;
  color: var(--ink);
  box-shadow: 3px 3px 0 var(--shadow);
}

.retro-button {
  padding: 0 14px;
  cursor: pointer;
  font-weight: 900;
}

.retro-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.retro-input,
.retro-select {
  width: 100%;
  padding: 0 10px;
}

.retro-error {
  margin: 12px 0 0;
  padding: 10px;
  border: 2px solid var(--ink);
  background: #fff0f7;
}
```

- [ ] **Step 5: Verify UI test**

Run:

```powershell
npm test -- --run test/ui.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add app/globals.css components/ui test/ui.test.tsx
git commit -m "feat: add retro OS UI primitives"
```

---

### Task 7: Landing and Authenticated App Page

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Create: `components/tasks/TaskDesktop.tsx`
- Create: `components/tasks/TaskList.tsx`
- Create: `components/tasks/TaskEditor.tsx`
- Test: `test/app.test.tsx`

- [ ] **Step 1: Write landing test**

Create `test/app.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
  }),
}));

describe("Home page", () => {
  it("shows Todo98 landing when signed out", async () => {
    render(await Home());

    expect(screen.getByRole("heading", { name: /Todo98/i })).toBeInTheDocument();
    expect(screen.getByText(/Google로 계속하기/i)).toBeInTheDocument();
    expect(screen.getByText(/Kakao로 계속하기/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify test fails**

Run:

```powershell
npm test -- --run test/app.test.tsx
```

Expected: FAIL because page still has default content.

- [ ] **Step 3: Implement layout metadata**

Modify `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Todo98",
  description: "Retro OS Window 스타일의 개인 TODO 앱",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Implement signed-out and signed-in page**

Modify `app/page.tsx`:

```tsx
import { LoginWindow } from "@/components/auth/LoginWindow";
import { TaskDesktop } from "@/components/tasks/TaskDesktop";
import { RetroWindow } from "@/components/ui/RetroWindow";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  let user = null;
  let setupError: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (caught) {
    setupError = caught instanceof Error ? caught.message : "Supabase 설정을 확인해주세요.";
  }

  if (user) {
    return <TaskDesktop userEmail={user.email ?? "user"} />;
  }

  return (
    <main className="desktop-shell">
      <section className="hero-window-set">
        <RetroWindow title="Todo98">
          <h1>Todo98</h1>
          <p>윈도우 98 감성으로 오늘 할 일을 정리하는 개인 TODO 앱입니다.</p>
        </RetroWindow>
        <LoginWindow />
        {setupError && (
          <RetroWindow title="Setup.txt">
            <p>{setupError}</p>
          </RetroWindow>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Implement initial minimal task desktop**

Create `components/tasks/TaskDesktop.tsx`:

```tsx
import { RetroWindow } from "@/components/ui/RetroWindow";

interface TaskDesktopProps {
  userEmail: string;
}

export function TaskDesktop({ userEmail }: TaskDesktopProps) {
  return (
    <main className="desktop-shell">
      <RetroWindow title="Today.tasks">
        <h1>오늘 할 일</h1>
        <p>{userEmail} 계정으로 로그인했습니다.</p>
      </RetroWindow>
    </main>
  );
}
```

Create minimal components for later task UI work:

```tsx
// components/tasks/TaskList.tsx
export function TaskList() {
  return null;
}
```

```tsx
// components/tasks/TaskEditor.tsx
export function TaskEditor() {
  return null;
}
```

- [ ] **Step 6: Add page CSS**

Append to `app/globals.css`:

```css
.desktop-shell {
  width: min(1120px, calc(100% - 24px));
  min-height: 100vh;
  margin: 0 auto;
  padding: 32px 0;
}

.hero-window-set {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 22px;
  align-items: start;
}

.hero-window-set h1 {
  margin: 0 0 12px;
  font-size: clamp(52px, 9vw, 116px);
  line-height: 0.9;
}

.login-actions {
  display: grid;
  gap: 10px;
}

.window-copy {
  margin-top: 0;
}

@media (max-width: 780px) {
  .hero-window-set {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: Verify page test**

Run:

```powershell
npm test -- --run test/app.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add app components test/app.test.tsx
git commit -m "feat: add Todo98 landing page"
```

---

### Task 8: Interactive Task CRUD UI

**Files:**
- Modify: `components/tasks/TaskDesktop.tsx`
- Modify: `components/tasks/TaskEditor.tsx`
- Modify: `components/tasks/TaskList.tsx`
- Modify: `lib/tasks.ts`
- Test: `test/task-ui.test.tsx`

- [ ] **Step 1: Write task UI test**

Create `test/task-ui.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TaskDesktop } from "@/components/tasks/TaskDesktop";

describe("TaskDesktop", () => {
  it("adds and completes a local task", async () => {
    const user = userEvent.setup();
    render(<TaskDesktop userEmail="me@example.com" initialTasks={[]} />);

    await user.type(screen.getByLabelText("할 일 제목"), "도메인 구매하기");
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByText("도메인 구매하기")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "도메인 구매하기 완료" }));
    await user.click(screen.getByRole("button", { name: "완료" }));

    expect(screen.getByText("도메인 구매하기")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify test fails**

Run:

```powershell
npm test -- --run test/task-ui.test.tsx
```

Expected: FAIL because TaskDesktop does not accept `initialTasks`.

- [ ] **Step 3: Implement interactive UI with local state**

Modify `components/tasks/TaskDesktop.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { TaskEditor } from "@/components/tasks/TaskEditor";
import { TaskList } from "@/components/tasks/TaskList";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroWindow } from "@/components/ui/RetroWindow";
import { dateKey, filterTasks, type TaskFilter, type TaskRecord } from "@/lib/tasks";

interface TaskDesktopProps {
  userEmail: string;
  initialTasks?: TaskRecord[];
}

export function TaskDesktop({ userEmail, initialTasks = [] }: TaskDesktopProps) {
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks);
  const [filter, setFilter] = useState<TaskFilter>("today");
  const visibleTasks = useMemo(() => filterTasks(tasks, filter), [tasks, filter]);

  function addTask(title: string) {
    const now = new Date().toISOString();
    setTasks((current) => [
      {
        id: crypto.randomUUID(),
        user_id: "local",
        title,
        note: null,
        due_date: dateKey(new Date()),
        priority: "normal",
        completed_at: null,
        created_at: now,
        updated_at: now,
      },
      ...current,
    ]);
  }

  function toggleTask(id: string) {
    const now = new Date().toISOString();
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, completed_at: task.completed_at ? null : now, updated_at: now }
          : task,
      ),
    );
  }

  return (
    <main className="desktop-shell task-desktop">
      <RetroWindow title="User.ini" className="account-window">
        <p>{userEmail}</p>
      </RetroWindow>
      <RetroWindow title="Today.tasks" className="tasks-window">
        <div className="task-toolbar">
          <h1>오늘 할 일</h1>
          <div className="filter-row">
            <RetroButton type="button" onClick={() => setFilter("today")}>오늘</RetroButton>
            <RetroButton type="button" onClick={() => setFilter("all")}>전체</RetroButton>
            <RetroButton type="button" onClick={() => setFilter("completed")}>완료</RetroButton>
          </div>
        </div>
        <TaskEditor onAdd={addTask} />
        <TaskList tasks={visibleTasks} onToggle={toggleTask} />
      </RetroWindow>
    </main>
  );
}
```

Create `components/tasks/TaskEditor.tsx`:

```tsx
"use client";

import { FormEvent, useState } from "react";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroInput } from "@/components/ui/RetroInput";

interface TaskEditorProps {
  onAdd: (title: string) => void;
}

export function TaskEditor({ onAdd }: TaskEditorProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    onAdd(clean);
    setTitle("");
  }

  return (
    <form className="task-editor" onSubmit={handleSubmit}>
      <label htmlFor="task-title">할 일 제목</label>
      <RetroInput id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} />
      <RetroButton type="submit">추가</RetroButton>
    </form>
  );
}
```

Create `components/tasks/TaskList.tsx`:

```tsx
"use client";

import { RetroButton } from "@/components/ui/RetroButton";
import type { TaskRecord } from "@/lib/tasks";

interface TaskListProps {
  tasks: TaskRecord[];
  onToggle: (id: string) => void;
}

export function TaskList({ tasks, onToggle }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="empty-task">표시할 할 일이 없습니다.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li className={task.completed_at ? "task-row completed" : "task-row"} key={task.id}>
          <RetroButton
            type="button"
            aria-label={`${task.title} ${task.completed_at ? "완료 취소" : "완료"}`}
            onClick={() => onToggle(task.id)}
          >
            {task.completed_at ? "✓" : "□"}
          </RetroButton>
          <span>{task.title}</span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Add task UI CSS**

Append to `app/globals.css`:

```css
.task-desktop {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 20px;
}

.tasks-window h1 {
  margin: 0;
  font-size: clamp(34px, 6vw, 72px);
}

.task-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.task-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  margin-bottom: 18px;
}

.task-editor label {
  grid-column: 1 / -1;
  font-weight: 900;
}

.task-list {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.task-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 2px solid var(--ink);
  background: #ffffff;
}

.task-row.completed span {
  text-decoration: line-through;
  opacity: 0.6;
}

.empty-task {
  padding: 18px;
  border: 2px dashed var(--ink);
}

@media (max-width: 820px) {
  .task-desktop {
    grid-template-columns: 1fr;
  }

  .task-toolbar,
  .task-editor {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Verify test**

Run:

```powershell
npm test -- --run test/task-ui.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add components/tasks app/globals.css test/task-ui.test.tsx
git commit -m "feat: add interactive task desktop"
```

---

### Task 9: Connect Supabase Task Persistence

**Files:**
- Modify: `lib/tasks.ts`
- Modify: `app/page.tsx`
- Modify: `components/tasks/TaskDesktop.tsx`
- Test: `test/tasks.test.ts`

- [ ] **Step 1: Write service tests**

Append to `test/tasks.test.ts`:

```ts
import { createTaskService } from "@/lib/tasks";

describe("task service", () => {
  it("creates a task for the current user", async () => {
    const insert = vi.fn().mockReturnValue({
      select: () => ({ single: async () => ({ data: { id: "task-1" }, error: null }) }),
    });
    const service = createTaskService({ from: () => ({ insert }) } as never, "user-1");

    const result = await service.createTask({ title: "OAuth 확인" });

    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      title: "OAuth 확인",
      note: null,
      due_date: null,
      priority: "normal",
    });
    expect(result.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Verify test fails**

Run:

```powershell
npm test -- --run test/tasks.test.ts
```

Expected: FAIL because `createTaskService` does not exist.

- [ ] **Step 3: Implement Supabase task service**

Append to `lib/tasks.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export function createTaskService(client: SupabaseClient, userId: string) {
  return {
    async listTasks() {
      const { data, error } = await client
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) return { ok: false as const, message: error.message };
      return { ok: true as const, value: (data ?? []) as TaskRecord[] };
    },

    async createTask(input: TaskInput) {
      const validated = validateTaskInput(input);
      if (!validated.ok) return validated;

      const { data, error } = await client
        .from("tasks")
        .insert({
          user_id: userId,
          title: validated.value.title,
          note: validated.value.note,
          due_date: validated.value.dueDate,
          priority: validated.value.priority,
        })
        .select()
        .single();

      if (error) return { ok: false as const, message: error.message };
      return { ok: true as const, value: data as TaskRecord };
    },
  };
}
```

- [ ] **Step 4: Load tasks on server page**

Modify the signed-in branch in `app/page.tsx` to list tasks:

```tsx
import { createTaskService } from "@/lib/tasks";

// inside Home(), after getUser:
let tasks = [];
if (user) {
  const service = createTaskService(supabase, user.id);
  const taskResult = await service.listTasks();
  tasks = taskResult.ok ? taskResult.value : [];
}

// signed-in return:
return <TaskDesktop userEmail={user.email ?? "user"} initialTasks={tasks} />;
```

- [ ] **Step 5: Verify tests**

Run:

```powershell
npm test -- --run
npm run build
```

Expected: all tests pass and build succeeds.

- [ ] **Step 6: Commit**

```powershell
git add app/page.tsx lib/tasks.ts test/tasks.test.ts
git commit -m "feat: connect tasks to Supabase"
```

---

### Task 10: Local Browser Verification

**Files:**
- Modify only if issues are found.

- [ ] **Step 1: Start dev server**

Run:

```powershell
npm run dev
```

Expected: local app runs at `http://127.0.0.1:3000` or the next available port.

- [ ] **Step 2: Verify landing in browser**

Open the app in the in-app browser.

Check:

- Todo98 heading is visible.
- Retro window styling is visible.
- Google login button is visible.
- Kakao login button is visible.
- Mobile viewport does not overlap.

- [ ] **Step 3: Verify local task UI with mocked or signed-in state**

If Supabase credentials are not ready, use tests as the primary CRUD proof. If credentials are ready, log in and create a task.

- [ ] **Step 4: Run final local checks**

Run:

```powershell
npm test -- --run
npm run build
npm audit --omit=dev
```

Expected:

- Tests pass.
- Build succeeds.
- No production vulnerabilities.

- [ ] **Step 5: Commit fixes if any**

```powershell
git add .
git commit -m "fix: polish Todo98 local verification"
```

---

### Task 11: Vercel Deployment

**Files:**
- Create or modify only deployment config if needed.

- [ ] **Step 1: Push repository to GitHub**

User action: create an empty GitHub repository named `todo98`.

If the GitHub owner were `octocat`, the remote URL would look like:

```text
https://github.com/octocat/todo98.git
```

Run with the exact repository URL shown by GitHub:

```powershell
git remote add origin https://github.com/octocat/todo98.git
git push -u origin master
```

Expected: repository is available on GitHub.

- [ ] **Step 2: Import into Vercel**

User action:

- Open Vercel.
- Import the GitHub repository.
- Add `NEXT_PUBLIC_SUPABASE_URL`.
- Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Deploy.

- [ ] **Step 3: Verify Vercel preview**

Open the Vercel URL and confirm:

- Landing loads.
- No setup error appears.
- Google/Kakao login buttons start provider flows after OAuth setup.

- [ ] **Step 4: Commit deployment docs**

Create `docs/deployment.md`:

```md
# Todo98 Deployment

Hosting: Vercel Hobby
Database/Auth: Supabase Free

Required environment variables:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Production checks:

- Landing page loads over HTTPS.
- Google login works.
- Kakao login works.
- Tasks persist per user.
```

Commit:

```powershell
git add docs/deployment.md
git commit -m "docs: add deployment checklist"
```

---

### Task 12: Domain and Production OAuth

**Files:**
- Modify docs only if final domain differs from examples.

- [ ] **Step 1: Buy domain**

User action:

- Pick and buy a domain such as `todo98.app`, `todo98.kr`, or another available name.

- [ ] **Step 2: Add domain in Vercel**

User action:

- Open Vercel project settings.
- Add the purchased domain.
- Follow Vercel's DNS instructions.

- [ ] **Step 3: Add production redirect URL in Supabase**

User action:

If the purchased domain is `todo98.kr`, Supabase Auth URL configuration should include:

```text
https://todo98.kr/auth/callback
```

Use the exact purchased domain in place of `todo98.kr`.

- [ ] **Step 4: Add production redirect URLs in provider consoles**

User action:

- Google Cloud Console: add the production callback URL required by Supabase Google provider docs. For `todo98.kr`, use `https://todo98.kr/auth/callback`.
- Kakao Developers: add the production callback URL required by Supabase Kakao provider docs. For `todo98.kr`, use `https://todo98.kr/auth/callback`.

- [ ] **Step 5: Verify production**

Check:

- The purchased domain, for example `https://todo98.kr`, loads.
- Google login succeeds.
- Kakao login succeeds.
- A created task appears after refresh.
- Another user cannot see the first user's tasks.

- [ ] **Step 6: Commit final domain docs**

Update `docs/deployment.md` with final domain and commit:

```powershell
git add docs/deployment.md
git commit -m "docs: record production domain"
```
