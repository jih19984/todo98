import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Todo98",
  description: "Retro OS Window 스타일의 개인 TODO 앱",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
