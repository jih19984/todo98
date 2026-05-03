import type { InputHTMLAttributes } from "react";

export function RetroInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`retro-input ${props.className ?? ""}`.trim()} />;
}
