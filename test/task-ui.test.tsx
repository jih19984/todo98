import { fireEvent, render, screen } from "@testing-library/react";
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
    await user.click(screen.getByRole("button", { name: "수정 저장" }));

    expect(screen.getByText("수정된 할 일")).toBeInTheDocument();
    expect(screen.getByText("편집 메모")).toBeInTheDocument();
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
    expect(screen.queryByLabelText("우선순위 높음")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "완료" }));

    expect(screen.getByText("표시할 할 일이 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("새 할 일을 추가하면 이 창에 바로 나타납니다.")).toBeInTheDocument();
  });

  it("adds and completes a local task", async () => {
    const user = userEvent.setup();
    render(<TaskDesktop userEmail="me@example.com" initialTasks={[]} />);

    expect(screen.queryByLabelText("마감일")).not.toBeInTheDocument();
    expect(screen.getByLabelText("할 일 제목").closest("form")).toHaveClass("task-compose-row");
    expect(screen.getByLabelText("할 일 제목")).toHaveAttribute("placeholder", "할 일 제목");
    expect(screen.getByLabelText("메모")).toHaveAttribute("placeholder", "메모");

    await user.type(screen.getByLabelText("할 일 제목"), "도메인 구매하기");
    await user.type(screen.getByLabelText("메모"), "Vercel 연결 전에 후보 확인");
    expect(screen.queryByLabelText("우선순위")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByText("도메인 구매하기")).toBeInTheDocument();
    expect(screen.getByText("Vercel 연결 전에 후보 확인")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "도메인 구매하기 완료" }));
    expect(screen.getByText("도메인 구매하기")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "도메인 구매하기 완료 취소" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "완료" }));

    expect(screen.getByText("도메인 구매하기")).toBeInTheDocument();
  });

  it("reorders visible tasks by dragging a task row", () => {
    render(
      <TaskDesktop
        userEmail="me@example.com"
        initialTasks={[
          {
            id: "task-1",
            user_id: "local",
            title: "첫 번째",
            note: null,
            due_date: "2026-05-05",
            priority: "normal",
            completed_at: null,
            created_at: "2026-05-05T00:00:00.000Z",
            updated_at: "2026-05-05T00:00:00.000Z",
          },
          {
            id: "task-2",
            user_id: "local",
            title: "두 번째",
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

    const list = screen.getByRole("list", { name: "할 일 목록" });
    const firstTask = screen.getByText("첫 번째").closest("li");
    const secondTask = screen.getByText("두 번째").closest("li");
    const dataTransfer = {
      data: {} as Record<string, string>,
      dropEffect: "",
      effectAllowed: "",
      setData(format: string, value: string) {
        this.data[format] = value;
      },
      getData(format: string) {
        return this.data[format];
      },
    };

    expect(firstTask).not.toBeNull();
    expect(secondTask).not.toBeNull();
    expect(list.querySelectorAll("li")[0]).toHaveTextContent("첫 번째");
    expect(screen.queryByRole("button", { name: "두 번째 위로 이동" })).not.toBeInTheDocument();

    fireEvent.dragStart(secondTask as HTMLLIElement, { dataTransfer });
    fireEvent.dragOver(firstTask as HTMLLIElement, { dataTransfer });
    fireEvent.drop(firstTask as HTMLLIElement, { dataTransfer });

    expect(list.querySelectorAll("li")[0]).toHaveTextContent("두 번째");
  });

  it("switches missions and opens tasks for a calendar date", async () => {
    const user = userEvent.setup();
    render(
      <TaskDesktop
        userEmail="me@example.com"
        initialTasks={[
          {
            id: "task-1",
            user_id: "local",
            title: "오늘 미션",
            note: null,
            due_date: "2026-05-05",
            priority: "normal",
            completed_at: "2026-05-05T03:00:00.000Z",
            created_at: "2026-05-05T00:00:00.000Z",
            updated_at: "2026-05-05T03:00:00.000Z",
          },
          {
            id: "task-2",
            user_id: "local",
            title: "내일 할 일",
            note: null,
            due_date: "2026-05-06",
            priority: "normal",
            completed_at: null,
            created_at: "2026-05-05T00:00:00.000Z",
            updated_at: "2026-05-05T00:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Daily.mission")).toBeInTheDocument();
    expect(screen.getByText("Points 30P")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "주간 미션" }));

    expect(screen.getByText("Weekly.mission")).toBeInTheDocument();
    expect(screen.getByText("이번 주 할 일 10개 완료")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2026-05-06 할 일 보기" }));

    expect(screen.getByText("내일 할 일")).toBeInTheDocument();
    expect(screen.queryByText("오늘 미션")).not.toBeInTheDocument();
  });

  it("signs out from the account window", async () => {
    const user = userEvent.setup();
    render(<TaskDesktop userEmail="me@example.com" initialTasks={[]} />);

    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(signOut).toHaveBeenCalledOnce();
  });
});
