"use client";
import { useEffect, useMemo, useState } from "react";
import { UserCheck, UserX, Clock, LogOut, CheckCircle2, Users, UserPlus, MapPin, ClipboardList, Search, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { sb, today } from "@/lib/supabase";
const LATE = "09:15";
type W = { id: string; name: string; emp_code: string; trade: string | null };
type A = { worker_id: string; check_in: string | null; check_out: string | null };
const hm = (s: string | null) => (s ? new Date(s).toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }) : "");
const t12 = (s: string | null) => (s ? new Date(s).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) : "—");
const COL = ["#2563eb", "#7c3aed", "#f97316", "#16a34a", "#db2777", "#0891b2", "#64748b"];
const col = (n: string) => COL[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % COL.length];
const ini = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
export default function Dash() {
  const [date, setDate] = useState(today()); const [ws, setWs] = useState<W[]>([]); const [as, setAs] = useState<A[]>([]);
  const [q, setQ] = useState(""); const [pg, setPg] = useState(0); const [now, setNow] = useState(""); const [greet, setGreet] = useState("Hello");
  useEffect(() => { sb().from("workers").select("id,name,emp_code,trade").eq("active", true).order("name").then(({ data }) => setWs((data as W[]) ?? [])); }, []);
  useEffect(() => { sb().from("attendance").select("worker_id,check_in,check_out").eq("work_date", date).then(({ data }) => setAs((data as A[]) ?? [])); setPg(0); }, [date]);
  useEffect(() => { const f = () => { setNow(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }));
    const h = Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Kolkata" })); setGreet(h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening"); };
    f(); const i = setInterval(f, 30000); return () => clearInterval(i); }, []);
  const rows = useMemo(() => ws.map((w) => { const a = as.find((x) => x.worker_id === w.id); return { w, a, st: !a ? "Absent" : hm(a.check_in) > LATE ? "Late" : "Present" }; }), [ws, as]);
  const n = (s: string) => rows.filter((r) => r.st === s).length; const total = ws.length;
  const cards = [["Present", n("Present"), "g", UserCheck], ["Absent", n("Absent"), "r", UserX], ["Late", n("Late"), "o", Clock], ["Checked Out", rows.filter((r) => r.a?.check_out).length, "v", LogOut]] as const;
  const f = rows.filter((r) => (r.w.name + r.w.emp_code).toLowerCase().includes(q.toLowerCase())); const pages = Math.max(1, Math.ceil(f.length / 10)); const vis = f.slice(pg * 10, pg * 10 + 10);
  return (<div><h2 style={{ fontSize: 28 }}>{greet}, Admin 👋</h2><p className="muted">Here&apos;s your attendance summary.</p>
    <div className="stats">{cards.map(([k, v, c, Ic]) => (<div key={k} className={"sc " + c}><div className="ic"><Ic size={22} /></div><div><span>{k}</span><b>{v}</b><small>out of {total} workers</small></div>
      <div className="bar"><i style={{ width: (total ? (v / total) * 100 : 0) + "%" }} /></div></div>))}</div>
    <div className="dash"><div className="card"><div className="row" style={{ flexWrap: "wrap" }}><h3 style={{ margin: 0 }}>Attendance</h3>
      <div className="row"><input className="fi" type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <div className="sbox"><Search size={16} /><input className="fi" placeholder="Search name or ID" value={q} onChange={(e) => { setQ(e.target.value); setPg(0); }} /></div></div></div>
      <div className="tw"><table><thead><tr><th>#</th><th>Worker</th><th>ID</th><th>Trade</th><th>Check In</th><th>Check Out</th><th>Status</th><th></th></tr></thead><tbody>
        {vis.map((r, i) => (<tr key={r.w.id}><td>{pg * 10 + i + 1}</td><td><span className="av" style={{ background: col(r.w.name) }}>{ini(r.w.name)}</span>{r.w.name}</td><td>{r.w.emp_code}</td><td>{r.w.trade ?? "—"}</td>
          <td>{t12(r.a?.check_in ?? null)}</td><td>{t12(r.a?.check_out ?? null)}</td><td><span className={"pill " + r.st}>{r.st}</span></td><td><a className="edit" href={"/workers/" + r.w.id}><Pencil size={14} /></a></td></tr>))}</tbody></table></div>
      <div className="row" style={{ marginTop: 10 }}><span className="muted">Showing {f.length ? pg * 10 + 1 : 0} to {Math.min(f.length, pg * 10 + 10)} of {f.length}</span>
        <span><button className="pgb" disabled={pg === 0} onClick={() => setPg(pg - 1)}><ChevronLeft size={16} /></button><button className="pgb" disabled={pg >= pages - 1} onClick={() => setPg(pg + 1)}><ChevronRight size={16} /></button></span></div></div>
    <div><a className="btn" href="/checkin"><CheckCircle2 size={18} className="i" />Mark Attendance</a>
      <div className="card"><b>Quick Actions</b><a className="qa" href="/workers"><Users size={18} />View All Workers</a><a className="qa" href="/register"><UserPlus size={18} />Register Worker</a><a className="qa" href="/sites"><MapPin size={18} />Sites</a><a className="qa" href="/admin"><ClipboardList size={18} />Today&apos;s Records</a></div>
      <div className="card"><b>Attendance Trend</b><div className="ch">{cards.map(([k, v, c]) => (<div key={k}><em>{v}</em><i className={c} style={{ height: Math.max(4, total ? (v / total) * 100 : 0) + "%" }} /><small>{k === "Checked Out" ? "Out" : k}</small></div>))}</div></div>
      <div className="card clk"><span className="cc"><Clock size={24} /></span><div><small>Current Time</small><b>{now}</b></div></div></div></div></div>);
}
