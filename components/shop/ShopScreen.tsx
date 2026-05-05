"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Info, ShoppingCart } from "lucide-react";
import { CountdownTimer } from "@/components/shop/CountdownTimer";
import { RetroButton } from "@/components/ui/RetroButton";

interface ShopScreenProps {
  userEmail: string;
}

const shopSections = [
  { label: "캐릭터 픽업", meta: "미나 픽업", hasImage: true },
  { label: "일반 뽑기", meta: "Coming soon!", isComingSoon: true },
  { label: "아이콘 뽑기", meta: "Coming soon!", isComingSoon: true },
  { label: "스킨 뽑기", meta: "Coming soon!", isComingSoon: true },
  { label: "포인트 상점", meta: "Coming soon!", isComingSoon: true },
];
const pickupCharacters = [
  { name: "미나", hasImage: true },
  { name: "Coming soon!", isComingSoon: true },
  { name: "Coming soon!", isComingSoon: true },
];
const pickupEndsAt = "2026-05-25T20:00:00+09:00";

export function ShopScreen(_props: ShopScreenProps) {
  const [showRateInfo, setShowRateInfo] = useState(false);

  return (
    <main className="shop-shell">
      <header className="shop-topbar">
        <div className="shop-title">
          <ShoppingCart size={18} aria-hidden="true" />
          <span>Todo98.exe - 상점</span>
        </div>
        <div className="shop-currency" aria-label="보유 TP">
          <span>TP 6560</span>
        </div>
        <Link className="shop-icon-link" href="/" aria-label="오늘 할 일로 돌아가기">
          <ArrowLeft size={22} aria-hidden="true" />
        </Link>
      </header>

      <aside className="shop-sidebar" aria-label="상점 메뉴">
        <nav>
          {shopSections.map((section, index) => (
            <button
              className={[
                "shop-banner-slot",
                index === 0 ? "is-active" : "",
                section.hasImage ? "has-image" : "",
                section.isComingSoon ? "is-coming-soon" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              type="button"
              aria-label={section.label}
              disabled={section.isComingSoon}
              key={section.label}
            >
              <span>{section.label}</span>
              <small>{section.meta}</small>
            </button>
          ))}
        </nav>
      </aside>

      <section className="shop-stage" aria-label="캐릭터 픽업 상점">
        <img
          className="shop-concept-art"
          src="/shop/todo98-shop-hero-mina.webp"
          alt="미나 캐릭터 픽업 비주얼"
          width="1200"
          height="720"
          draggable={false}
        />
        <div className="shop-copy">
          <span>캐릭터 픽업</span>
          <h1>미나</h1>
          <p>작은 체크 하나까지 다정하게 챙기는 Todo98 런칭 에디션 친구.</p>
          <CountdownTimer targetDate={pickupEndsAt} />
        </div>
        <div className="shop-guarantee">★2 이상 1개 확정!</div>

        <div className="shop-gacha-panel">
          <div className="shop-pickups" aria-label="픽업 캐릭터">
            <div className="shop-panel-heading">
              <strong>픽업 캐릭터</strong>
              <span>확률 UP!</span>
            </div>
            <div className="shop-pickup-grid">
              {pickupCharacters.map((character, index) => (
                <div
                  className={[
                    "shop-pickup-card",
                    character.hasImage ? "has-image" : "",
                    character.isComingSoon ? "is-coming-soon" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={`${character.name}-${index}`}
                >
                  {character.isComingSoon ? (
                    <strong>{character.name}</strong>
                  ) : (
                    <>
                      <span>UP!</span>
                      <strong>{character.name}</strong>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="shop-rate-area">
            <button
              className="shop-rate-trigger"
              type="button"
              aria-label="확률 정보 보기"
              aria-expanded={showRateInfo}
              onClick={() => setShowRateInfo((current) => !current)}
            >
              <Info size={16} aria-hidden="true" />
            </button>
            {showRateInfo && (
              <div className="shop-rate-popover" role="tooltip" aria-label="확률 정보">
                <strong>확률 정보</strong>
                <dl>
                  <div>
                    <dt>3성 확정</dt>
                    <dd>2.000%</dd>
                  </div>
                  <div>
                    <dt>2성</dt>
                    <dd>18.000%</dd>
                  </div>
                  <div>
                    <dt>1성</dt>
                    <dd>80.000%</dd>
                  </div>
                </dl>
                <p>10회 뽑기 시 ★2 이상 1개 확정</p>
              </div>
            )}
          </div>

          <div className="shop-draw-actions">
            <RetroButton type="button" aria-label="100 TP 1회 뽑기">
              <span>100 TP</span>
              <strong>1회 뽑기</strong>
            </RetroButton>
            <RetroButton type="button" aria-label="900 TP 10회 뽑기">
              <span>900 TP</span>
              <strong>10회 뽑기</strong>
            </RetroButton>
          </div>
        </div>
      </section>
    </main>
  );
}
