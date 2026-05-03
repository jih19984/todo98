import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RetroWindow } from "@/components/ui/RetroWindow";

describe("RetroWindow", () => {
  it("renders a window title and content", () => {
    render(
      <RetroWindow title="Today.tasks">
        <p>작업 목록</p>
      </RetroWindow>,
    );

    expect(screen.getByText("Today.tasks")).toBeInTheDocument();
    expect(screen.getByText("작업 목록")).toBeInTheDocument();
  });
});
