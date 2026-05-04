import { LoginWindow } from "@/components/auth/LoginWindow";
import { RiveHero } from "@/components/landing/RiveHero";
import { TaskDesktop } from "@/components/tasks/TaskDesktop";
import { RetroWindow } from "@/components/ui/RetroWindow";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTaskService, type TaskRecord } from "@/lib/tasks";
import { redirect } from "next/navigation";

interface HomeProps {
  searchParams?: Promise<{
    auth_error?: string;
    code?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps = {}) {
  const params = await searchParams;
  if (params?.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`);
  }

  let setupError = params?.auth_error ?? null;
  let tasks: TaskRecord[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.getUser();
    const user = result.data.user;

    if (user) {
      const taskResult = await createTaskService(supabase, user.id).listTasks();
      tasks = taskResult.ok ? taskResult.value : [];
      return <TaskDesktop userEmail={user.email ?? "Todo98 사용자"} userId={user.id} initialTasks={tasks} />;
    }
  } catch (caught) {
    setupError = caught instanceof Error ? caught.message : "Supabase 설정을 확인해주세요.";
  }

  return (
    <main className="desktop-shell landing-shell">
      <section className="landing-grid">
        <RetroWindow title="CloudyWalk.riv" className="animation-window">
          <RiveHero />
        </RetroWindow>

        <div className="landing-copy-stack">
          <RetroWindow title="Todo98">
            <p className="eyebrow">Retro OS Todo</p>
            <h1>Todo98</h1>
            <p className="hero-copy">
              오늘 할 일을 가볍게 적고, 체크하고, 저장하는 개인 TODO 앱입니다. Google 또는 Kakao로
              로그인하고 나만의 `Today.tasks`를 열어보세요.
            </p>
            <div className="todo-preview" aria-label="Todo98 미리보기">
              <p>Today.tasks</p>
              <span>□ 오늘 할 일 적기</span>
              <span>□ 로그인 연결 확인</span>
              <span>✓ 첫 배포 완료</span>
            </div>
          </RetroWindow>

          <LoginWindow />
        </div>

        {setupError && (
          <RetroWindow title="Setup.txt" className="setup-window">
            <p>{setupError}</p>
          </RetroWindow>
        )}
      </section>
    </main>
  );
}
