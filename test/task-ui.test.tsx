import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TaskDesktop } from "@/components/tasks/TaskDesktop";

describe("TaskDesktop", () => {
  it("adds and completes a local task", async () => {
    const user = userEvent.setup();
    render(<TaskDesktop userEmail="me@example.com" initialTasks={[]} />);

    await user.type(screen.getByLabelText("할 일 제목"), "도메인 구매하기");
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByText("도메인 구매하기")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "도메인 구매하기 완료" }));
    await user.click(screen.getByRole("button", { name: "완료" }));

    expect(screen.getByText("도메인 구매하기")).toBeInTheDocument();
  });
});
