"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LogOut, Settings, ShoppingCart } from "lucide-react";
import { TaskEditor } from "@/components/tasks/TaskEditor";
import { TaskList } from "@/components/tasks/TaskList";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroWindow } from "@/components/ui/RetroWindow";
import { createSignOut } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  createTaskService,
  dateKey,
  filterTasks,
  validateTaskInput,
  type TaskInput,
  type TaskRecord,
} from "@/lib/tasks";

interface TaskDesktopProps {
  userEmail: string;
  userId?: string;
  initialTasks?: TaskRecord[];
}

type MissionMode = "daily" | "weekly";

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDisplayDate(key: string) {
  return key.replaceAll("-", ". ");
}

function isSameWeek(date: Date, selectedDate: Date) {
  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return date >= weekStart && date < weekEnd;
}

function buildCalendarDays(selectedDate: Date) {
  const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
  const blanks = Array.from({ length: firstDay.getDay() }, () => null);
  const days = Array.from({ length: lastDay.getDate() }, (_, index) => index + 1);
  return [...blanks, ...days];
}

function buildYearOptions(centerYear: number) {
  return Array.from({ length: 5 }, (_, index) => centerYear - 2 + index);
}

export function TaskDesktop({ userEmail, userId, initialTasks = [] }: TaskDesktopProps) {
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks);
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [calendarViewDate, setCalendarViewDate] = useState(dateFromKey(dateKey(new Date())));
  const [missionMode, setMissionMode] = useState<MissionMode>("daily");
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const todayKey = dateKey(new Date());
  const todayDateValue = useMemo(() => dateFromKey(todayKey), [todayKey]);
  const selectedDateValue = useMemo(() => dateFromKey(selectedDate), [selectedDate]);
  const visibleTasks = useMemo(() => filterTasks(tasks, "today", selectedDateValue), [tasks, selectedDateValue]);
  const todayTasks = useMemo(
    () => tasks.filter((task) => task.due_date === todayKey),
    [tasks, todayKey],
  );
  const todayCompletedCount = todayTasks.filter((task) => Boolean(task.completed_at)).length;
  const weeklyCompletedCount = tasks.filter((task) => {
    if (!task.completed_at) return false;
    return isSameWeek(dateFromKey(task.due_date ?? task.created_at.slice(0, 10)), todayDateValue);
  }).length;
  const weeklyActiveDays = new Set(
    tasks
      .filter((task) => task.completed_at && isSameWeek(dateFromKey(task.due_date ?? task.created_at.slice(0, 10)), todayDateValue))
      .map((task) => task.due_date ?? task.created_at.slice(0, 10)),
  ).size;
  const dailyMissions = [
    { label: "할 일 1개 추가", points: 10, done: todayTasks.length >= 1 },
    { label: "할 일 1개 완료", points: 20, done: todayCompletedCount >= 1 },
    { label: "할 일 3개 완료", points: 50, done: todayCompletedCount >= 3 },
  ];
  const weeklyMissions = [
    { label: "이번 주 할 일 10개 완료", points: 150, done: weeklyCompletedCount >= 10 },
    { label: "3일 이상 할 일 완료", points: 100, done: weeklyActiveDays >= 3 },
    { label: "5일 이상 할 일 완료", points: 200, done: weeklyActiveDays >= 5 },
  ];
  const visibleMissions = missionMode === "daily" ? dailyMissions : weeklyMissions;
  const earnedPoints = visibleMissions.reduce((sum, mission) => sum + (mission.done ? mission.points : 0), 0);
  const calendarDays = buildCalendarDays(calendarViewDate);
  const calendarYears = buildYearOptions(todayDateValue.getFullYear());
  const calendarMonths = Array.from({ length: 12 }, (_, index) => index);

  function updateCalendarView(year: number, month: number) {
    setCalendarViewDate(new Date(year, month, 1));
  }

  function reorderTask(draggedId: string, targetId: string) {
    setTasks((current) => {
      const next = [...current];
      const sourceIndex = next.findIndex((task) => task.id === draggedId);
      const targetIndex = next.findIndex((task) => task.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return current;
      }

      const [draggedTask] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, draggedTask);
      return next;
    });
  }

  async function addTask(input: TaskInput) {
    const now = new Date().toISOString();
    const localTask = {
      id: crypto.randomUUID(),
      user_id: userId ?? "local",
      title: input.title.trim(),
      note: input.note?.trim() || null,
      due_date: input.dueDate || null,
      priority: input.priority || "normal",
      completed_at: null,
      created_at: now,
      updated_at: now,
    };

    if (!userId) {
      setTasks((current) => [localTask, ...current]);
      return;
    }

    const result = await createTaskService(createSupabaseBrowserClient(), userId).createTask({
      title: input.title,
      note: input.note,
      dueDate: input.dueDate,
      priority: input.priority,
    });

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError(null);
    setTasks((current) => [result.value, ...current]);
  }

  async function updateTask(input: TaskInput) {
    if (!editingTask) return;

    const validated = validateTaskInput(input);
    if (!validated.ok) {
      setError(validated.message);
      return;
    }

    const now = new Date().toISOString();

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

  async function toggleTask(id: string) {
    const now = new Date().toISOString();
    const target = tasks.find((task) => task.id === id);
    if (!target) return;

    const completed = !target.completed_at;
    const optimisticCompletedAt = completed ? now : null;

    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed_at: optimisticCompletedAt, updated_at: now } : task,
      ),
    );

    if (!userId) {
      return;
    }

    try {
      const result = await createTaskService(createSupabaseBrowserClient(), userId).setTaskCompleted(id, completed);

      if (!result.ok) {
        setError(result.message);
        setTasks((current) => current.map((task) => (task.id === id ? target : task)));
        return;
      }

      setError(null);
      setTasks((current) => current.map((task) => (task.id === id ? result.value : task)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "완료 상태를 저장하지 못했습니다.");
      setTasks((current) => current.map((task) => (task.id === id ? target : task)));
    }
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
    if (editingTask?.id === id) {
      setEditingTask(null);
    }
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
      <nav className="desktop-left-nav" aria-label="앱 메뉴">
        <Link href="/shop" className="desktop-nav-link" aria-label="상점">
          <ShoppingCart size={20} aria-hidden="true" />
          <span>상점</span>
        </Link>
      </nav>
      <aside className="right-rail" aria-label="사용자 패널">
        <RetroWindow title="User.ini" className="account-window">
          <p className="eyebrow">Signed in</p>
          <div className="account-profile">
            <img
              className="account-character"
              src="/animations/todo98-character.webp"
              alt="대표 캐릭터"
              width="92"
              height="172"
              draggable={false}
            />
            <p>{userEmail}</p>
          </div>
          <div className="account-actions" aria-label="프로필 메뉴">
            <RetroButton type="button" aria-label="로그아웃" onClick={() => void handleSignOut()}>
              <LogOut size={16} aria-hidden="true" />
            </RetroButton>
            <Link className="account-icon-link" href="/mypage" aria-label="마이페이지">
              <Settings size={16} aria-hidden="true" />
            </Link>
          </div>
        </RetroWindow>
        <RetroWindow title={missionMode === "daily" ? "Daily.mission" : "Weekly.mission"} className="mission-window">
          <div className="mission-toggle" aria-label="미션 보기">
            <RetroButton
              type="button"
              aria-pressed={missionMode === "daily"}
              className={missionMode === "daily" ? "is-active" : ""}
              onClick={() => setMissionMode("daily")}
            >
              일일 미션
            </RetroButton>
            <RetroButton
              type="button"
              aria-pressed={missionMode === "weekly"}
              className={missionMode === "weekly" ? "is-active" : ""}
              onClick={() => setMissionMode("weekly")}
            >
              주간 미션
            </RetroButton>
          </div>
          <p className="mission-points">Points {earnedPoints}TP</p>
          <ul className="mission-list">
            {visibleMissions.map((mission) => (
              <li className={mission.done ? "mission-item is-done" : "mission-item"} key={mission.label}>
                <span>{mission.done ? "✓" : ""}</span>
                <p>{mission.label}</p>
                <strong>+{mission.points}TP</strong>
              </li>
            ))}
          </ul>
        </RetroWindow>
        <RetroWindow title="Calendar.exe" className="calendar-window">
          <div className="calendar-heading">
            <label>
              <select
                className="retro-select calendar-select"
                aria-label="년도"
                value={calendarViewDate.getFullYear()}
                onChange={(event) => updateCalendarView(Number(event.target.value), calendarViewDate.getMonth())}
              >
                {calendarYears.map((year) => (
                  <option value={year} key={year}>
                    {year}년
                  </option>
                ))}
              </select>
            </label>
            <label>
              <select
                className="retro-select calendar-select"
                aria-label="월"
                value={calendarViewDate.getMonth()}
                onChange={(event) => updateCalendarView(calendarViewDate.getFullYear(), Number(event.target.value))}
              >
                {calendarMonths.map((month) => (
                  <option value={month} key={month}>
                    {String(month + 1).padStart(2, "0")}월
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="calendar-weekdays" aria-hidden="true">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {calendarDays.map((day, index) => {
              if (!day) return <span className="calendar-empty" key={`blank-${index}`} />;
              const key = dateKey(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day));
              const taskCount = tasks.filter((task) => task.due_date === key).length;
              return (
                <button
                  className={key === selectedDate ? "calendar-day is-selected" : "calendar-day"}
                  type="button"
                  aria-label={`${key} 할 일 보기`}
                  key={key}
                  onClick={() => setSelectedDate(key)}
                >
                  <span>{day}</span>
                  {taskCount > 0 && <small>{taskCount}</small>}
                </button>
              );
            })}
          </div>
        </RetroWindow>
      </aside>
      <RetroWindow title="Today.tasks" className="tasks-window">
        <div className="task-toolbar">
          <div>
            <h1>{selectedDate === todayKey ? "오늘 할 일" : `${formatDisplayDate(selectedDate)} 할 일`}</h1>
          </div>
        </div>
        <TaskEditor
          mode={editingTask ? "edit" : "create"}
          initialTask={editingTask ?? undefined}
          onSubmit={(input) => void (editingTask ? updateTask(input) : addTask({ ...input, dueDate: selectedDate }))}
          onCancel={editingTask ? () => setEditingTask(null) : undefined}
        />
        {error && <p className="retro-error">{error}</p>}
        <TaskList
          tasks={visibleTasks}
          onToggle={toggleTask}
          onEdit={setEditingTask}
          onDelete={deleteTask}
          onReorder={reorderTask}
        />
      </RetroWindow>
    </main>
  );
}
