import type { ReactNode } from "react";
import type { Viewport } from "next";
import "./globals.css";
import Shell from "@/components/Shell";
export const metadata = { title: "Attendance", appleWebApp: { capable: true, title: "Attendance" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, viewportFit: "cover", themeColor: "#ffffff" };
export default function Root({ children }: { children: ReactNode }) {
  return (<html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Newsreader:wght@500&display=swap" rel="stylesheet" /></head><body><Shell>{children}</Shell></body></html>);
}
