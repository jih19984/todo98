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
