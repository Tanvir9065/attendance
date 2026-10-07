"use client";
import { usePathname } from "next/navigation";
import { CalendarDays, ScanFace, Users, UserPlus, MapPin, ClipboardList, UserCog } from "lucide-react";
import { useMe } from "./Auth";
const L = [["/", CalendarDays, "Today", []], ["/checkin", ScanFace, "Scan", []], ["/workers", Users, "Workers", ["/card"]], ["/register", UserPlus, "Register worker", []], ["/sites", MapPin, "Sites", []], ["/admin", ClipboardList, "Records", []], ["/users", UserCog, "Users", []]] as const;
export default function Nav() {
  const p = usePathname(); const me = useMe();
  const on = (h: string, x: readonly string[]) => (h === "/" ? p === "/" : p === h || p.startsWith(h + "/") || x.some((e) => p.startsWith(e)));
  return (<><nav className="sn">{L.filter(([h]) => h !== "/users" || me.role === "admin").map(([h, Ic, n, x]) => (<a key={h} href={h} className={on(h, x) ? "on" : ""}><Ic size={19} strokeWidth={1.8} />{n}</a>))}</nav>
    <div className="su"><b>{me.name || "Account"}</b>{me.role === "admin" ? "Admin" : "Site manager"}</div></>);
}
