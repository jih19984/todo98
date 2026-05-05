"use client";

import { useEffect, useMemo, useState } from "react";

interface CountdownTimerProps {
  targetDate: string;
}

function getRemainingTime(targetDate: string) {
  const remaining = Math.max(0, new Date(targetDate).getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [remainingTime, setRemainingTime] = useState(() => getRemainingTime(targetDate));
  const formattedSeconds = useMemo(
    () => String(remainingTime.seconds).padStart(2, "0"),
    [remainingTime.seconds],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingTime(getRemainingTime(targetDate));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="shop-countdown" role="timer" aria-live="polite">
      <span>남은 시간</span>
      <strong>
        {remainingTime.days}일 {remainingTime.hours}시간 {remainingTime.minutes}분 {formattedSeconds}초
      </strong>
    </div>
  );
}
