"use client";

import { FormEvent, useEffect, useState } from "react";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroInput } from "@/components/ui/RetroInput";
import { RetroSelect } from "@/components/ui/RetroSelect";
import { dateKey, type TaskInput, type TaskPriority, type TaskRecord } from "@/lib/tasks";

interface TaskEditorProps {
  mode?: "create" | "edit";
  initialTask?: Pick<TaskRecord, "title" | "note" | "due_date" | "priority">;
  onSubmit: (input: TaskInput) => void;
  onCancel?: () => void;
}

export function TaskEditor({ mode = "create", initialTask, onSubmit, onCancel }: TaskEditorProps) {
  const defaultDueDate = mode === "create" ? dateKey(new Date()) : "";
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [note, setNote] = useState(initialTask?.note ?? "");
  const [dueDate, setDueDate] = useState(initialTask?.due_date ?? defaultDueDate);
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority ?? "normal");

  useEffect(() => {
    setTitle(initialTask?.title ?? "");
    setNote(initialTask?.note ?? "");
    setDueDate(initialTask?.due_date ?? (mode === "create" ? dateKey(new Date()) : ""));
    setPriority(initialTask?.priority ?? "normal");
  }, [initialTask, mode]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    onSubmit({ title: clean, note, dueDate, priority });

    if (mode === "create") {
      setTitle("");
      setNote("");
      setDueDate(dateKey(new Date()));
      setPriority("normal");
    }
  }

  return (
    <form className="task-editor" onSubmit={handleSubmit}>
      <div className="task-editor-grid">
        <label className="task-editor-field" htmlFor="task-title">
          할 일 제목
          <RetroInput id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="task-editor-field" htmlFor="task-due-date">
          마감일
          <RetroInput
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
        <label className="task-editor-field" htmlFor="task-priority">
          우선순위
          <RetroSelect
            id="task-priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
          >
            <option value="low">낮음</option>
            <option value="normal">보통</option>
            <option value="high">높음</option>
          </RetroSelect>
        </label>
        <label className="task-editor-field task-editor-note" htmlFor="task-note">
          메모
          <textarea
            id="task-note"
            className="retro-input retro-textarea"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <div className="task-editor-actions">
          <RetroButton type="submit">{mode === "edit" ? "수정 저장" : "추가"}</RetroButton>
          {onCancel && (
            <RetroButton type="button" onClick={onCancel}>
              취소
            </RetroButton>
          )}
        </div>
      </div>
    </form>
  );
}
