"use client";
import { usePathname } from "next/navigation";
const L: [string, string, string[]][] = [["/", "Today", []], ["/checkin", "Scan", []], ["/workers", "Workers", ["/register", "/card"]], ["/sites", "Sites", []], ["/admin", "Records", []]];
export default function Nav() {
  const p = usePathname();
  const on = (h: string, x: string[]) => (h === "/" ? p === "/" : p.startsWith(h) || x.some((e) => p.startsWith(e)));
  return (<nav className="tabs">{L.map(([h, n, x]) => (<a key={h} href={h} className={on(h, x) ? "on" : ""}>{n}</a>))}</nav>);
}
