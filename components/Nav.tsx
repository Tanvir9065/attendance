"use client";
import { usePathname } from "next/navigation";
import { useMe } from "./Auth";
const L: [string, string, string[]][] = [["/", "Today", []], ["/checkin", "Scan", []], ["/workers", "Workers", ["/register", "/card"]], ["/sites", "Sites", []], ["/admin", "Records", []], ["/users", "Users", []]];
export default function Nav() {
  const p = usePathname(); const me = useMe();
  const on = (h: string, x: string[]) => (h === "/" ? p === "/" : p.startsWith(h) || x.some((e) => p.startsWith(e)));
  return (<nav className="tabs">{L.filter(([h]) => h !== "/users" || me.role === "admin").map(([h, n, x]) => (<a key={h} href={h} className={on(h, x) ? "on" : ""}>{n}</a>))}</nav>);
}
