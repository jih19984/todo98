import type { SelectHTMLAttributes } from "react";

export function RetroSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`retro-select ${props.className ?? ""}`.trim()} />;
}
