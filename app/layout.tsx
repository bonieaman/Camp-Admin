import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Youth Camp 2026 Admin",
  description: "Private administration system for Youth Camp 2026"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
