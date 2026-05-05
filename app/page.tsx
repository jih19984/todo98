import { LoginWindow } from "@/components/auth/LoginWindow";
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
        <div className="landing-copy-stack">
          <RetroWindow title="Todo98">
            <h1>Todo98</h1>
          </RetroWindow>

          <LoginWindow />
        </div>
        <div className="landing-character-stage" aria-hidden="true">
          <img
            className="landing-character"
            src="/animations/todo98-character.webp"
            alt=""
            width="360"
            height="674"
            draggable={false}
            loading="eager"
          />
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
