"use client";

import { useMemo, useState } from "react";
import { TaskEditor } from "@/components/tasks/TaskEditor";
import { TaskList } from "@/components/tasks/TaskList";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroWindow } from "@/components/ui/RetroWindow";
import { createSignOut } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createTaskService, dateKey, filterTasks, type TaskFilter, type TaskRecord } from "@/lib/tasks";

interface TaskDesktopProps {
  userEmail: string;
  userId?: string;
  initialTasks?: TaskRecord[];
}

export function TaskDesktop({ userEmail, userId, initialTasks = [] }: TaskDesktopProps) {
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks);
  const [filter, setFilter] = useState<TaskFilter>("today");
  const [error, setError] = useState<string | null>(null);
  const visibleTasks = useMemo(() => filterTasks(tasks, filter), [tasks, filter]);

  async function addTask(title: string) {
    const now = new Date().toISOString();
    const localTask = {
      id: crypto.randomUUID(),
      user_id: userId ?? "local",
      title,
      note: null,
      due_date: dateKey(new Date()),
      priority: "normal" as const,
      completed_at: null,
      created_at: now,
      updated_at: now,
    };

    if (!userId) {
      setTasks((current) => [localTask, ...current]);
      return;
    }

    const result = await createTaskService(createSupabaseBrowserClient(), userId).createTask({
      title,
      dueDate: localTask.due_date,
    });

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError(null);
    setTasks((current) => [result.value, ...current]);
  }

  async function toggleTask(id: string) {
    const now = new Date().toISOString();
    const target = tasks.find((task) => task.id === id);
    const completed = !target?.completed_at;

    if (!userId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === id ? { ...task, completed_at: completed ? now : null, updated_at: now } : task,
        ),
      );
      return;
    }

    const result = await createTaskService(createSupabaseBrowserClient(), userId).setTaskCompleted(id, completed);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError(null);
    setTasks((current) => current.map((task) => (task.id === id ? result.value : task)));
  }

  async function deleteTask(id: string) {
    if (userId) {
      const result = await createTaskService(createSupabaseBrowserClient(), userId).deleteTask(id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
    }

    setError(null);
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  async function handleSignOut() {
    try {
      setError(null);
      await createSignOut(createSupabaseBrowserClient())();
      window.location.assign("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "로그아웃하지 못했습니다.");
    }
  }

  return (
    <main className="desktop-shell task-desktop">
      <RetroWindow title="User.ini" className="account-window">
        <p className="eyebrow">Signed in</p>
        <p>{userEmail}</p>
        <RetroButton type="button" onClick={() => void handleSignOut()}>
          로그아웃
        </RetroButton>
      </RetroWindow>
      <RetroWindow title="Today.tasks" className="tasks-window">
        <div className="task-toolbar">
          <div>
            <p className="eyebrow">Todo98</p>
            <h1>오늘 할 일</h1>
          </div>
          <div className="filter-row" aria-label="필터">
            <RetroButton type="button" onClick={() => setFilter("today")}>
              오늘
            </RetroButton>
            <RetroButton type="button" onClick={() => setFilter("all")}>
              전체
            </RetroButton>
            <RetroButton type="button" onClick={() => setFilter("completed")}>
              완료
            </RetroButton>
          </div>
        </div>
        <TaskEditor onAdd={(title) => void addTask(title)} />
        {error && <p className="retro-error">{error}</p>}
        <TaskList tasks={visibleTasks} onToggle={toggleTask} onDelete={deleteTask} />
      </RetroWindow>
    </main>
  );
}
