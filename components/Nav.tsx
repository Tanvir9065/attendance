"use client";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckCircle2, UserPlus, Users, MapPin, ClipboardList } from "lucide-react";
const L = [["/", LayoutDashboard, "Dashboard"], ["/checkin", CheckCircle2, "Check-in"], ["/register", UserPlus, "Register"], ["/workers", Users, "Workers"], ["/sites", MapPin, "Sites"], ["/admin", ClipboardList, "Records"]] as const;
export default function Nav() {
  const p = usePathname();
  return (<nav>{L.map(([h, Ic, n]) => (<a key={h} href={h} className={p === h ? "on" : ""}><span><Ic size={22} strokeWidth={1.8} /></span>{n}</a>))}</nav>);
}
