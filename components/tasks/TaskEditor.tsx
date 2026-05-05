"use client";

import { FormEvent, useEffect, useState } from "react";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroInput } from "@/components/ui/RetroInput";
import { dateKey, type TaskInput, type TaskRecord } from "@/lib/tasks";

interface TaskEditorProps {
  mode?: "create" | "edit";
  initialTask?: Pick<TaskRecord, "title" | "note" | "due_date" | "priority">;
  onSubmit: (input: TaskInput) => void;
  onCancel?: () => void;
}

export function TaskEditor({ mode = "create", initialTask, onSubmit, onCancel }: TaskEditorProps) {
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [note, setNote] = useState(initialTask?.note ?? "");

  useEffect(() => {
    setTitle(initialTask?.title ?? "");
    setNote(initialTask?.note ?? "");
  }, [initialTask]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    const dueDate = mode === "create" ? dateKey(new Date()) : (initialTask?.due_date ?? null);
    onSubmit({ title: clean, note, dueDate, priority: "normal" });

    if (mode === "create") {
      setTitle("");
      setNote("");
    }
  }

  return (
    <form className="task-editor task-compose-row" onSubmit={handleSubmit}>
      <span className="task-compose-check" aria-hidden="true" />
      <div className="task-compose-fields">
        <RetroInput
          id="task-title"
          className="task-compose-title"
          aria-label="할 일 제목"
          placeholder="할 일 제목"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <textarea
          id="task-note"
          className="retro-input retro-textarea task-compose-note"
          aria-label="메모"
          placeholder="메모"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
      <div className="task-editor-actions">
        <RetroButton type="submit">{mode === "edit" ? "수정 저장" : "추가"}</RetroButton>
        {onCancel && (
          <RetroButton type="button" onClick={onCancel}>
            취소
          </RetroButton>
        )}
      </div>
    </form>
  );
}
