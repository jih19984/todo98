import { describe, expect, it, vi } from "vitest";
import { createTaskService, validateTaskInput } from "@/lib/tasks";

describe("task validation", () => {
  it("rejects an empty title", () => {
    expect(validateTaskInput({ title: "   " })).toEqual({
      ok: false,
      message: "할 일 제목을 입력해주세요.",
    });
  });

  it("accepts a non-empty title and normalizes priority", () => {
    expect(validateTaskInput({ title: "  카카오 연결  " })).toEqual({
      ok: true,
      value: {
        title: "카카오 연결",
        note: null,
        dueDate: null,
        priority: "normal",
      },
    });
  });
});

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

  it("completes and deletes a task for the current user", async () => {
    const updatePayloads: unknown[] = [];
    const deleteCall = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    const update = vi.fn().mockImplementation((payload) => {
      updatePayloads.push(payload);
      return {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: () => ({ single: async () => ({ data: { id: "task-1", ...payload }, error: null }) }),
          }),
        }),
      };
    });
    const service = createTaskService(
      {
        from: () => ({
          update,
          delete: deleteCall,
        }),
      } as never,
      "user-1",
    );

    const completeResult = await service.setTaskCompleted("task-1", true);
    const deleteResult = await service.deleteTask("task-1");

    expect(updatePayloads[0]).toMatchObject({ completed_at: expect.any(String) });
    expect(completeResult.ok).toBe(true);
    expect(deleteCall).toHaveBeenCalled();
    expect(deleteResult).toEqual({ ok: true });
  });
});
