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
