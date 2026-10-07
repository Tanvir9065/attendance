import type { ReactNode } from "react";
import "./globals.css";
import Shell from "@/components/Shell";
export const metadata = { title: "Site Attendance" };
export default function Root({ children }: { children: ReactNode }) {
  return (<html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" /><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" /></head><body><Shell>{children}</Shell></body></html>);
}
