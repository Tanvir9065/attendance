"use client";
import { useEffect, useMemo, useState } from "react";
import { UserCheck, UserX, Clock, LogOut, ScanFace, Users, UserPlus, MapPin, ClipboardList, Search } from "lucide-react";
import { sb, today } from "@/lib/supabase";
const LATE = "09:15";
type W = { id: string; name: string; emp_code: string; trade: string | null };
type A = { worker_id: string; check_in: string | null; check_out: string | null };
const hm = (s: string | null) => (s ? new Date(s).toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }) : "");
const t12 = (s: string | null) => (s ? new Date(s).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) : "--");
const COL = ["#2563eb", "#7c3aed", "#f97316", "#16a34a", "#db2777", "#0891b2", "#64748b"];
const col = (n: string) => COL[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % COL.length];
const ini = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
export default function Dash() {
  const [date, setDate] = useState(today()); const [ws, setWs] = useState<W[]>([]); const [as, setAs] = useState<A[]>([]);
  const [q, setQ] = useState(""); const [lim, setLim] = useState(10); const [now, setNow] = useState(""); const [greet, setGreet] = useState("Hello");
  useEffect(() => { sb().from("workers").select("id,name,emp_code,trade").eq("active", true).order("name").then(({ data }) => setWs((data as W[]) ?? [])); }, []);
  useEffect(() => { sb().from("attendance").select("worker_id,check_in,check_out").eq("work_date", date).then(({ data }) => setAs((data as A[]) ?? [])); setLim(10); }, [date]);
  useEffect(() => { const f = () => { setNow(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }));
    const h = Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Kolkata" })); setGreet(h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening"); };
    f(); const i = setInterval(f, 30000); return () => clearInterval(i); }, []);
  const rows = useMemo(() => ws.map((w) => { const a = as.find((x) => x.worker_id === w.id); return { w, a, st: !a ? "Absent" : hm(a.check_in) > LATE ? "Late" : "Present" }; }), [ws, as]);
  const n = (s: string) => rows.filter((r) => r.st === s).length; const total = ws.length; const inn = n("Present") + n("Late");
  const cards = [["Present", n("Present"), "g", UserCheck], ["Absent", n("Absent"), "r", UserX], ["Late", n("Late"), "o", Clock], ["Checked out", rows.filter((r) => r.a?.check_out).length, "v", LogOut]] as const;
  const f = rows.filter((r) => (r.w.name + r.w.emp_code).toLowerCase().includes(q.toLowerCase())); const vis = f.slice(0, lim);
  return (<div className="dash"><div className="mc">
    <div className="hero"><div className="hn">{greet}, Admin 👋</div><small>{date === today() ? "Today's attendance" : "Attendance on " + date}</small>
      <div className="big">{inn}<span> / {total}</span></div><small>workers checked in</small><div className="hp"><i style={{ width: (total ? (inn / total) * 100 : 0) + "%" }} /></div></div>
    <div className="stats">{cards.map(([k, v, c, Ic]) => (<div key={k} className={"sc " + c}><div className="ic"><Ic size={20} /></div><div><b>{v}</b><span>{k}</span></div></div>))}</div>
    <div className="card"><div className="sh"><h3>Attendance</h3></div>
      <div className="ctl"><input type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <div className="sbox"><Search size={16} /><input placeholder="Search" value={q} onChange={(e) => { setQ(e.target.value); setLim(10); }} /></div></div>
      {vis.map((r) => (<a className="li" key={r.w.id} href={"/workers/" + r.w.id}><span className="av" style={{ background: col(r.w.name) }}>{ini(r.w.name)}</span>
        <span className="nm"><b>{r.w.name}</b><small>{r.w.emp_code} · {r.w.trade ?? "No trade"}</small></span>
        <span className="rt"><span className={"pill " + r.st}>{r.st}</span><small>{t12(r.a?.check_in ?? null)} → {t12(r.a?.check_out ?? null)}</small></span></a>))}
      {!vis.length && <p className="muted" style={{ padding: 12 }}>No workers found.</p>}
      {f.length > lim && <button className="sec" onClick={() => setLim(lim + 10)}>Show more ({f.length - lim})</button>}</div></div>
    <div className="rc"><a className="btn dskblk" href="/checkin"><ScanFace size={18} className="i" />Mark Attendance</a>
      <div className="card"><b>Quick actions</b><a className="qa" href="/register"><UserPlus size={18} />Register worker</a><a className="qa" href="/workers"><Users size={18} />All workers</a><a className="qa" href="/sites"><MapPin size={18} />Sites</a><a className="qa" href="/admin"><ClipboardList size={18} />Today&apos;s records</a></div>
      <div className="card dskblk"><b>Attendance trend</b><div className="ch">{cards.map(([k, v, c]) => (<div key={k}><em>{v}</em><i className={c} style={{ height: Math.max(4, total ? (v / total) * 100 : 0) + "%" }} /><small>{k === "Checked out" ? "Out" : k}</small></div>))}</div></div>
      <div className="card clk dskblk"><span className="cc"><Clock size={24} /></span><div><small>Current time</small><b>{now}</b></div></div></div></div>);
}
