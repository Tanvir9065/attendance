"use client";
import { useEffect, useState } from "react";
import { sb, today } from "@/lib/supabase";
type R = { id: string; check_in: string | null; check_out: string | null; workers: { name: string; sites: { name: string } | null } | null };
const t = (s: string | null) => (s ? new Date(s).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) : "-");
export default function Admin() {
  const [rows, setRows] = useState<R[]>([]); const [total, setTotal] = useState(0);
  useEffect(() => { (async () => {
    const { data } = await sb().from("attendance").select("id,check_in,check_out,workers(name,sites(name))").eq("work_date", today());
    setRows((data as unknown as R[]) ?? []);
    const { count } = await sb().from("workers").select("id", { count: "exact", head: true }).eq("active", true); setTotal(count ?? 0); })(); }, []);
  return (<div><h2>Aaj · {today()}</h2><div className="card"><b>Present: {rows.length} / {total}</b></div>
    <div className="card"><table><tbody><tr><th>Naam</th><th>Site</th><th>In</th><th>Out</th></tr>
      {rows.map((r) => (<tr key={r.id}><td>{r.workers?.name}</td><td>{r.workers?.sites?.name ?? "-"}</td><td>{t(r.check_in)}</td><td>{t(r.check_out)}</td></tr>))}</tbody></table></div></div>);
}
