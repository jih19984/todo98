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
});
