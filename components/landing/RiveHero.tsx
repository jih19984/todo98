"use client";

import { Alignment, Fit, Layout, useRive } from "@rive-app/react-canvas";

export function RiveHero() {
  const { RiveComponent } = useRive({
    src: "/animations/cloudy-walk.riv",
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  return (
    <div className="rive-hero" aria-label="구름 위를 걷는 Todo98 캐릭터 애니메이션">
      <RiveComponent />
    </div>
  );
}
