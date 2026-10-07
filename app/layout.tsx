import type { ReactNode } from "react";
import "./globals.css";
import Shell from "@/components/Shell";
export const metadata = { title: "Site Attendance" };
export default function Root({ children }: { children: ReactNode }) {
  return (<html lang="en"><body><Shell>{children}</Shell></body></html>);
}
