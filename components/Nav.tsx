"use client";
import { usePathname } from "next/navigation";
const L = [["/", "🏠", "Home"], ["/checkin", "📷", "Check-in"], ["/register", "➕", "Register"], ["/workers", "👷", "Workers"], ["/sites", "📍", "Sites"], ["/admin", "📊", "Today"]];
export default function Nav() {
  const p = usePathname();
  return (<nav>{L.map(([h, i, n]) => (<a key={h} href={h} className={p === h ? "on" : ""}><span>{i}</span>{n}</a>))}</nav>);
}
