import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RetroWindow } from "@/components/ui/RetroWindow";

export default function MyPage() {
  return (
    <main className="desktop-shell mypage-shell">
      <RetroWindow title="MyPage.ini" className="mypage-window">
        <div className="mypage-placeholder">
          <img src="/animations/todo98-character.webp" alt="대표 캐릭터" width="120" height="225" draggable={false} />
          <div>
            <h1>마이페이지</h1>
            <p>대표 캐릭터, 보유 캐릭터, 스킨 설정을 이곳에 연결할 예정입니다.</p>
            <Link href="/" className="account-icon-link mypage-back-link" aria-label="오늘 할 일로 돌아가기">
              <ArrowLeft size={16} aria-hidden="true" />
              <span>돌아가기</span>
            </Link>
          </div>
        </div>
      </RetroWindow>
    </main>
  );
}
