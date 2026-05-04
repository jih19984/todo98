"use client";

import { RetroButton } from "@/components/ui/RetroButton";
import type { TaskRecord } from "@/lib/tasks";

interface TaskListProps {
  tasks: TaskRecord[];
  onToggle: (id: string) => void | Promise<void>;
  onEdit?: (task: TaskRecord) => void;
  onDelete: (id: string) => void | Promise<void>;
}

export function TaskList({ tasks, onToggle, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="empty-task">
        <strong>표시할 할 일이 없습니다.</strong>
        <span>새 할 일을 추가하면 이 창에 바로 나타납니다.</span>
      </div>
    );
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li className={task.completed_at ? "task-row completed" : "task-row"} key={task.id}>
          <button
            className="task-check-button"
            type="button"
            aria-label={`${task.title} ${task.completed_at ? "완료 취소" : "완료"}`}
            aria-pressed={Boolean(task.completed_at)}
            onClick={() => void onToggle(task.id)}
          >
            <span className="task-check-box" aria-hidden="true">
              {task.completed_at ? "✓" : ""}
            </span>
          </button>
          <div className="task-main">
            <span className="task-title-line">{task.title}</span>
            {task.note && <p className="task-note">{task.note}</p>}
            <div className="task-meta">
              {task.due_date && <small className="task-chip">{task.due_date}</small>}
              <small className="task-chip">{task.priority.toUpperCase()}</small>
            </div>
          </div>
          {onEdit && (
            <RetroButton type="button" aria-label={`${task.title} 수정`} onClick={() => onEdit(task)}>
              수정
            </RetroButton>
          )}
          <RetroButton
            type="button"
            className="task-delete-button"
            aria-label={`${task.title} 삭제`}
            onClick={() => void onDelete(task.id)}
          >
            삭제
          </RetroButton>
        </li>
      ))}
    </ul>
  );
}
