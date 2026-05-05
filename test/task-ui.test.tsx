import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskDesktop } from "@/components/tasks/TaskDesktop";

const signOut = vi.fn().mockResolvedValue({ error: null });
let setTaskCompletedResponse: Promise<{ data: unknown; error: { message: string } | null }> = Promise.resolve({
  data: null,
  error: null,
});
const taskQuery = {
  eq: vi.fn(() => taskQuery),
  select: vi.fn(() => taskQuery),
  single: vi.fn(() => setTaskCompletedResponse),
};
const updateTask = vi.fn(() => taskQuery);

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signOut,
    },
    from: () => ({
      update: updateTask,
    }),
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

    expect(screen.getByText("Lazyweb 레퍼런스 반영")).toBeInTheDocument();
    expect(screen.getByText("Any.do와 Sunsama 참고")).toBeInTheDocument();
    expect(screen.queryByText("2026-05-05")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("우선순위 높음")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2026-05-06 할 일 보기" }));

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
  });

  it("toggles a task when clicking the task row", async () => {
    const user = userEvent.setup();
    render(
      <TaskDesktop
        userEmail="me@example.com"
        initialTasks={[
          {
            id: "task-1",
            user_id: "local",
            title: "행 클릭 할 일",
            note: "체크박스 말고 본문 클릭",
            due_date: "2026-05-05",
            priority: "normal",
            completed_at: null,
            created_at: "2026-05-05T00:00:00.000Z",
            updated_at: "2026-05-05T00:00:00.000Z",
          },
        ]}
      />,
    );

    await user.click(screen.getByText("행 클릭 할 일"));

    expect(screen.getByRole("button", { name: "행 클릭 할 일 완료 취소" })).toBeInTheDocument();
  });

  it("checks an authenticated task before the server responds", async () => {
    const user = userEvent.setup();
    let resolveResponse: (value: { data: unknown; error: null }) => void = () => {};
    setTaskCompletedResponse = new Promise((resolve) => {
      resolveResponse = resolve;
    });

    render(
      <TaskDesktop
        userEmail="me@example.com"
        userId="user-1"
        initialTasks={[
          {
            id: "task-1",
            user_id: "user-1",
            title: "서버 할 일",
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

    await user.click(screen.getByRole("button", { name: "서버 할 일 완료" }));

    expect(screen.getByRole("button", { name: "서버 할 일 완료 취소" })).toBeInTheDocument();

    resolveResponse({
      data: {
        id: "task-1",
        user_id: "user-1",
        title: "서버 할 일",
        note: null,
        due_date: "2026-05-05",
        priority: "normal",
        completed_at: "2026-05-05T03:00:00.000Z",
        created_at: "2026-05-05T00:00:00.000Z",
        updated_at: "2026-05-05T03:00:00.000Z",
      },
      error: null,
    });
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
          {
            id: "task-3",
            user_id: "local",
            title: "다음 주 첫 할 일",
            note: null,
            due_date: "2026-05-12",
            priority: "normal",
            completed_at: "2026-05-12T03:00:00.000Z",
            created_at: "2026-05-12T00:00:00.000Z",
            updated_at: "2026-05-12T03:00:00.000Z",
          },
          {
            id: "task-4",
            user_id: "local",
            title: "다음 주 둘째 할 일",
            note: null,
            due_date: "2026-05-13",
            priority: "normal",
            completed_at: "2026-05-13T03:00:00.000Z",
            created_at: "2026-05-13T00:00:00.000Z",
            updated_at: "2026-05-13T03:00:00.000Z",
          },
          {
            id: "task-5",
            user_id: "local",
            title: "다음 주 셋째 할 일",
            note: null,
            due_date: "2026-05-14",
            priority: "normal",
            completed_at: "2026-05-14T03:00:00.000Z",
            created_at: "2026-05-14T00:00:00.000Z",
            updated_at: "2026-05-14T03:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Daily.mission")).toBeInTheDocument();
    expect(screen.getByText("Points 30TP")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2026-05-06 할 일 보기" }));

    expect(screen.getByText("내일 할 일")).toBeInTheDocument();
    expect(screen.queryByText("오늘 미션")).not.toBeInTheDocument();
    expect(screen.getByText("Points 30TP")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "주간 미션" }));

    expect(screen.getByText("Weekly.mission")).toBeInTheDocument();
    expect(screen.getByText("이번 주 할 일 10개 완료")).toBeInTheDocument();
    expect(screen.getByText("Points 0TP")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2026-05-12 할 일 보기" }));

    expect(screen.getByText("다음 주 첫 할 일")).toBeInTheDocument();
    expect(screen.getByText("Points 0TP")).toBeInTheDocument();
  });

  it("changes the visible calendar month without opening that date until a day is clicked", async () => {
    const user = userEvent.setup();
    render(
      <TaskDesktop
        userEmail="me@example.com"
        initialTasks={[
          {
            id: "task-1",
            user_id: "local",
            title: "오늘 할 일",
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
            title: "이월 할 일",
            note: null,
            due_date: "2027-02-02",
            priority: "normal",
            completed_at: null,
            created_at: "2027-02-02T00:00:00.000Z",
            updated_at: "2027-02-02T00:00:00.000Z",
          },
        ]}
      />,
    );

    await user.selectOptions(screen.getByLabelText("년도"), "2027");
    await user.selectOptions(screen.getByLabelText("월"), "1");

    expect(screen.getByRole("button", { name: "2027-02-02 할 일 보기" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "오늘 할 일" })).toBeInTheDocument();
    expect(screen.queryByText("이월 할 일")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2027-02-02 할 일 보기" }));

    expect(screen.getByText("2027. 02. 02 할 일")).toBeInTheDocument();
    expect(screen.getByText("이월 할 일")).toBeInTheDocument();
  });

  it("signs out from the account window", async () => {
    const user = userEvent.setup();
    render(<TaskDesktop userEmail="me@example.com" initialTasks={[]} />);

    expect(screen.getByAltText("대표 캐릭터")).toHaveAttribute("src", "/animations/todo98-character.webp");
    expect(screen.getByRole("link", { name: "마이페이지" })).toHaveAttribute("href", "/mypage");

    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(signOut).toHaveBeenCalledOnce();
  });
});
