import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskDesktop } from "@/components/tasks/TaskDesktop";

const signOut = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signOut,
    },
  }),
}));

describe("TaskDesktop", () => {
  it("edits a local task", async () => {
    const user = userEvent.setup();
    render(
      <TaskDesktop
        userEmail="me@example.com"
        initialTasks={[
          {
            id: "task-1",
            user_id: "local",
            title: "초안",
            note: null,
            due_date: "2026-05-05",
            priority: "normal",
            completed_at: null,
            created_at: "2026-05-05T00:00:00.000Z",
            updated_at: "2026-05-05T00:00:00.000Z",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "전체" }));
    await user.click(screen.getByRole("button", { name: "초안 수정" }));
    await user.clear(screen.getByLabelText("할 일 제목"));
    await user.type(screen.getByLabelText("할 일 제목"), "수정된 할 일");
    await user.type(screen.getByLabelText("메모"), "편집 메모");
    await user.selectOptions(screen.getByLabelText("우선순위"), "high");
    await user.click(screen.getByRole("button", { name: "수정 저장" }));

    expect(screen.getByText("수정된 할 일")).toBeInTheDocument();
    expect(screen.getByText("편집 메모")).toBeInTheDocument();
    expect(screen.getByLabelText("우선순위 높음")).toBeInTheDocument();
  });

  it("cancels editing without changing the task", async () => {
    const user = userEvent.setup();
    render(
      <TaskDesktop
        userEmail="me@example.com"
        initialTasks={[
          {
            id: "task-1",
            user_id: "local",
            title: "유지할 제목",
            note: null,
            due_date: "2026-05-05",
            priority: "normal",
            completed_at: null,
            created_at: "2026-05-05T00:00:00.000Z",
            updated_at: "2026-05-05T00:00:00.000Z",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "전체" }));
    await user.click(screen.getByRole("button", { name: "유지할 제목 수정" }));
    await user.clear(screen.getByLabelText("할 일 제목"));
    await user.type(screen.getByLabelText("할 일 제목"), "버릴 제목");
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(screen.getByText("유지할 제목")).toBeInTheDocument();
    expect(screen.queryByText("버릴 제목")).not.toBeInTheDocument();
  });

  it("clears edit mode when deleting the task being edited", async () => {
    const user = userEvent.setup();
    render(
      <TaskDesktop
        userEmail="me@example.com"
        initialTasks={[
          {
            id: "task-1",
            user_id: "local",
            title: "삭제할 제목",
            note: null,
            due_date: "2026-05-05",
            priority: "normal",
            completed_at: null,
            created_at: "2026-05-05T00:00:00.000Z",
            updated_at: "2026-05-05T00:00:00.000Z",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "전체" }));
    await user.click(screen.getByRole("button", { name: "삭제할 제목 수정" }));
    expect(screen.getByRole("button", { name: "수정 저장" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "삭제할 제목 삭제" }));

    expect(screen.getByRole("button", { name: "추가" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "수정 저장" })).not.toBeInTheDocument();
  });

  it("shows task metadata and an empty state", async () => {
    const user = userEvent.setup();
    render(
      <TaskDesktop
        userEmail="me@example.com"
        initialTasks={[
          {
            id: "task-1",
            user_id: "local",
            title: "Lazyweb 레퍼런스 반영",
            note: "Any.do와 Sunsama 참고",
            due_date: "2026-05-05",
            priority: "high",
            completed_at: null,
            created_at: "2026-05-05T00:00:00.000Z",
            updated_at: "2026-05-05T00:00:00.000Z",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "전체" }));

    expect(screen.getByText("Lazyweb 레퍼런스 반영")).toBeInTheDocument();
    expect(screen.getByText("Any.do와 Sunsama 참고")).toBeInTheDocument();
    expect(screen.queryByText("2026-05-05")).not.toBeInTheDocument();
    const priorityIcon = screen.getByLabelText("우선순위 높음");
    expect(priorityIcon).toBeInTheDocument();
    expect(priorityIcon.querySelectorAll(".priority-bar")).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "완료" }));

    expect(screen.getByText("표시할 할 일이 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("새 할 일을 추가하면 이 창에 바로 나타납니다.")).toBeInTheDocument();
  });

  it("adds and completes a local task", async () => {
    const user = userEvent.setup();
    render(<TaskDesktop userEmail="me@example.com" initialTasks={[]} />);

    expect(screen.queryByLabelText("마감일")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("할 일 제목"), "도메인 구매하기");
    await user.type(screen.getByLabelText("메모"), "Vercel 연결 전에 후보 확인");
    await user.selectOptions(screen.getByLabelText("우선순위"), "high");
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByText("도메인 구매하기")).toBeInTheDocument();
    expect(screen.getByText("Vercel 연결 전에 후보 확인")).toBeInTheDocument();
    expect(screen.getByLabelText("우선순위 높음")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "도메인 구매하기 완료" }));
    await user.click(screen.getByRole("button", { name: "완료" }));

    expect(screen.getByText("도메인 구매하기")).toBeInTheDocument();
  });

  it("signs out from the account window", async () => {
    const user = userEvent.setup();
    render(<TaskDesktop userEmail="me@example.com" initialTasks={[]} />);

    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(signOut).toHaveBeenCalledOnce();
  });
});
