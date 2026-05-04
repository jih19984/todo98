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
  it("adds and completes a local task", async () => {
    const user = userEvent.setup();
    render(<TaskDesktop userEmail="me@example.com" initialTasks={[]} />);

    const visibleToday = (screen.getByLabelText("마감일") as HTMLInputElement).value;

    await user.type(screen.getByLabelText("할 일 제목"), "도메인 구매하기");
    await user.type(screen.getByLabelText("메모"), "Vercel 연결 전에 후보 확인");
    await user.clear(screen.getByLabelText("마감일"));
    await user.type(screen.getByLabelText("마감일"), visibleToday);
    await user.selectOptions(screen.getByLabelText("우선순위"), "high");
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByText("도메인 구매하기")).toBeInTheDocument();
    expect(screen.getByText("Vercel 연결 전에 후보 확인")).toBeInTheDocument();
    expect(screen.getByText(visibleToday)).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();

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
