"use client";

import { RetroButton } from "@/components/ui/RetroButton";
import type { TaskRecord } from "@/lib/tasks";

interface TaskListProps {
  tasks: TaskRecord[];
  onToggle: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
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
            onClick={() => void onToggle(task.id)}
          >
            {task.completed_at ? "✓" : "□"}
          </RetroButton>
          <span>{task.title}</span>
          <small>{task.priority.toUpperCase()}</small>
          <RetroButton type="button" aria-label={`${task.title} 삭제`} onClick={() => void onDelete(task.id)}>
            삭제
          </RetroButton>
        </li>
      ))}
    </ul>
  );
}
