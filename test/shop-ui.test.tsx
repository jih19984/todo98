import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ShopScreen } from "@/components/shop/ShopScreen";
import { TaskDesktop } from "@/components/tasks/TaskDesktop";

describe("Shop UI", () => {
  it("links to the shop from the task desktop", () => {
    render(<TaskDesktop userEmail="me@example.com" initialTasks={[]} />);

    expect(screen.getByRole("link", { name: "상점" })).toHaveAttribute("href", "/shop");
  });

  it("renders the character pickup shop surface", async () => {
    const user = userEvent.setup();
    render(<ShopScreen userEmail="me@example.com" />);

    expect(screen.getByText("Todo98.exe - 상점")).toBeInTheDocument();
    expect(screen.queryByText("me@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("TP 6560")).toBeInTheDocument();
    expect(screen.queryByLabelText("보유 뽑기 티켓")).not.toBeInTheDocument();
    expect(screen.queryByText("상점")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "캐릭터 픽업" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "일반 뽑기" })).toBeInTheDocument();
    expect(screen.getByText("미나 픽업")).toBeInTheDocument();
    expect(screen.getAllByText("Coming soon!").length).toBe(6);
    expect(screen.getByRole("button", { name: "일반 뽑기" })).toBeDisabled();
    expect(screen.queryByText("1200x720")).not.toBeInTheDocument();
    expect(screen.queryByText("150x150")).not.toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("남은 시간");
    expect(screen.getByText("픽업 캐릭터")).toBeInTheDocument();
    expect(screen.queryByText("3성 확정")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "확률 정보 보기" }));
    expect(screen.getByText("확률 정보")).toBeInTheDocument();
    expect(screen.getByText("3성 확정")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "확률 정보 보기" }));
    expect(screen.queryByText("3성 확정")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "오늘 할 일로 돌아가기" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: "100 TP 1회 뽑기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "900 TP 10회 뽑기" })).toBeInTheDocument();
    expect(screen.getAllByText("미나").length).toBeGreaterThan(0);
    expect(screen.getByText("작은 체크 하나까지 다정하게 챙기는 Todo98 런칭 에디션 친구.")).toBeInTheDocument();
    expect(screen.getByAltText("미나 캐릭터 픽업 비주얼")).toHaveAttribute(
      "src",
      "/shop/todo98-shop-hero-mina.webp",
    );
  });
});
