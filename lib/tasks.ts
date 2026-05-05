import type { SupabaseClient } from "@supabase/supabase-js";

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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function filterTasks(tasks: TaskRecord[], filter: TaskFilter, today = new Date()): TaskRecord[] {
  if (filter === "completed") {
    return tasks.filter((task) => Boolean(task.completed_at));
  }

  if (filter === "today") {
    const todayKey = dateKey(today);
    return tasks.filter((task) => task.due_date === todayKey);
  }

  return tasks.filter((task) => !task.completed_at);
}

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

    async setTaskCompleted(taskId: string, completed: boolean) {
      const { data, error } = await client
        .from("tasks")
        .update({ completed_at: completed ? new Date().toISOString() : null })
        .eq("id", taskId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) return { ok: false as const, message: error.message };
      return { ok: true as const, value: data as TaskRecord };
    },

    async deleteTask(taskId: string) {
      const { error } = await client.from("tasks").delete().eq("id", taskId).eq("user_id", userId);

      if (error) return { ok: false as const, message: error.message };
      return { ok: true as const };
    },
  };
}
