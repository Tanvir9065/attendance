"use client";
import { useEffect, useState } from "react";
import { sb, today } from "@/lib/supabase";
export default function Home() {
  const [st, setSt] = useState({ p: 0, t: 0, s: 0 });
  useEffect(() => { (async () => {
    const c = (q: any) => q.then((r: any) => r.count ?? 0);
    const [p, t, s] = await Promise.all([
      c(sb().from("attendance").select("id", { count: "exact", head: true }).eq("work_date", today())),
      c(sb().from("workers").select("id", { count: "exact", head: true }).eq("active", true)),
      c(sb().from("sites").select("id", { count: "exact", head: true }))]);
    setSt({ p, t, s }); })(); }, []);
  return (<div><h2>Welcome 👋</h2><p className="muted">Today's overview</p>
    <div className="grid" style={{ margin: "12px 0" }}><div className="card"><b>{st.p}</b><span className="muted">Present</span></div>
      <div className="card"><b>{st.t}</b><span className="muted">Workers</span></div><div className="card"><b>{st.s}</b><span className="muted">Sites</span></div></div>
    <div className="tiles"><a className="btn tile" href="/checkin"><span>📷</span>Check-in</a><a className="btn tile" href="/register"><span>➕</span>Register</a>
      <a className="btn tile" href="/workers"><span>👷</span>Workers</a><a className="btn tile" href="/sites"><span>📍</span>Sites</a></div></div>);
}
