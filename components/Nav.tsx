"use client";
import { usePathname } from "next/navigation";
const L = [["/", "🏠", "Dashboard"], ["/checkin", "✅", "Check-in"], ["/register", "➕", "Register"], ["/workers", "👷", "Workers"], ["/sites", "📍", "Sites"], ["/admin", "🗂️", "Records"]];
export default function Nav() {
  const p = usePathname();
  return (<nav>{L.map(([h, i, n]) => (<a key={h} href={h} className={p === h ? "on" : ""}><span>{i}</span>{n}</a>))}</nav>);
}
