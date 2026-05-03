import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
  }),
}));

describe("Home page", () => {
  it("shows Todo98 landing when signed out", async () => {
    render(await Home());

    expect(screen.getByRole("heading", { name: /Todo98/i })).toBeInTheDocument();
    expect(screen.getByText(/Google로 계속하기/i)).toBeInTheDocument();
    expect(screen.getByText(/Kakao로 계속하기/i)).toBeInTheDocument();
  });

  it("shows OAuth callback errors on the landing page", async () => {
    render(await Home({ searchParams: Promise.resolve({ auth_error: "OAuth 설정을 확인해주세요." }) }));

    expect(screen.getByText("OAuth 설정을 확인해주세요.")).toBeInTheDocument();
  });
});
