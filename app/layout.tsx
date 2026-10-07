import type { ReactNode } from "react";
import "./globals.css";
import Nav from "@/components/Nav";
export const metadata = { title: "Attendance" };
export default function Root({ children }: { children: ReactNode }) {
  return (<html lang="en"><body><Nav /><div className="wrap">{children}</div></body></html>);
}
