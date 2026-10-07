"use client";
import { usePathname } from "next/navigation";
const L = [["/", "Home"], ["/checkin", "Check-in"], ["/register", "Register"], ["/workers", "Workers"], ["/sites", "Sites"], ["/admin", "Dashboard"]];
export default function Nav() {
  const p = usePathname();
  return (<nav>{L.map(([h, n]) => (<a key={h} href={h} className={p === h ? "on" : ""}>{n}</a>))}</nav>);
}
