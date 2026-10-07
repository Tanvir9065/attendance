"use client";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScanFace, UserPlus, Users, MapPin, ClipboardList } from "lucide-react";
const L = [["/", LayoutDashboard, "Home", ""], ["/workers", Users, "Workers", ""], ["/register", UserPlus, "Register", "dsk"], ["/checkin", ScanFace, "Check-in", "fab"], ["/sites", MapPin, "Sites", ""], ["/admin", ClipboardList, "Records", ""]] as const;
export default function Nav() {
  const p = usePathname();
  return (<nav>{L.map(([h, Ic, n, c]) => (<a key={h} href={h} className={c + (p === h ? " on" : "")}><Ic size={c === "fab" ? 26 : 22} strokeWidth={1.9} /><em>{n}</em></a>))}</nav>);
}
