import type { ButtonHTMLAttributes } from "react";

export function RetroButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`retro-button ${props.className ?? ""}`.trim()} />;
}
