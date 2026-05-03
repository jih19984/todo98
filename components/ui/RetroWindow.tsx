import type { ReactNode } from "react";

interface RetroWindowProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function RetroWindow({ title, children, className = "" }: RetroWindowProps) {
  return (
    <section className={`retro-window ${className}`.trim()}>
      <div className="retro-titlebar">
        <span>{title}</span>
        <div className="retro-controls" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="retro-window-body">{children}</div>
    </section>
  );
}
