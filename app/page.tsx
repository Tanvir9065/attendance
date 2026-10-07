"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Search } from "lucide-react";
import { sb, today } from "@/lib/supabase";
const LATE = "09:15";
type St = "present" | "absent" | "half" | "leave";
const S: { k: St; c: string; n: string }[] = [{ k: "present", c: "P", n: "Present" }, { k: "absent", c: "A", n: "Absent" }, { k: "half", c: "H", n: "Half day" }, { k: "leave", c: "L", n: "Leave" }];
type W = { id: string; name: string; emp_code: string; trade: string | null; site_id: string | null; sites: { name: string } | null };
type A = { worker_id: string; status: St; check_in: string | null; check_out: string | null };
const hm = (s: string | null) => (s ? new Date(s).toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }) : "");
const t12 = (s: string) => new Date(s).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
const addDay = (d: string, n: number) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const wd = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
const label = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
export default function Today() {
  const [date, setDate] = useState(today()); const [ws, setWs] = useState<W[]>([]); const [rows, setRows] = useState<A[]>([]);
  const [draft, setDraft] = useState<Record<string, St>>({}); const [q, setQ] = useState(""); const [site, setSite] = useState("");
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false); const [err, setErr] = useState(""); const [ready, setReady] = useState(false);
  useEffect(() => { sb().from("workers").select("id,name,emp_code,trade,site_id,sites(name)").eq("active", true).order("name").then(({ data }) => { setWs((data as unknown as W[]) ?? []); setReady(true); }); }, []);
  const load = async (d: string) => { const { data } = await sb().from("attendance").select("worker_id,status,check_in,check_out").eq("work_date", d); setRows((data as A[]) ?? []); };
  useEffect(() => { setDraft({}); setErr(""); load(date); }, [date]);
  const rec = (id: string) => rows.find((r) => r.worker_id === id);
  const st = (id: string): St | null => draft[id] ?? rec(id)?.status ?? null;
  const list = useMemo(() => ws.filter((w) => (w.name + w.emp_code).toLowerCase().includes(q.toLowerCase()) && (!site || w.sites?.name === site)), [ws, q, site]);
  const sites = Array.from(new Set(ws.map((w) => w.sites?.name).filter(Boolean))) as string[];
  const cnt = (k: St) => ws.filter((w) => st(w.id) === k).length;
  const late = ws.filter((w) => st(w.id) === "present" && hm(rec(w.id)?.check_in ?? null) > LATE).length;
  const left = ws.filter((w) => !st(w.id)).length; const n = Object.keys(draft).length;
  function pick(id: string, k: St) { setSaved(false); setDraft((d) => { const x = { ...d, [id]: k }; if (rec(id)?.status === k) delete x[id]; return x; }); }
  function rest() { setSaved(false); setDraft((d) => { const x = { ...d }; list.forEach((w) => { if (!st(w.id)) x[w.id] = "present"; }); return x; }); }
  async function save() {
    if (!n) return; setSaving(true); setErr("");
    const payload = Object.keys(draft).map((id) => ({ worker_id: id, work_date: date, status: draft[id], site_id: ws.find((w) => w.id === id)?.site_id ?? null }));
    const { error } = await sb().from("attendance").upsert(payload, { onConflict: "worker_id,work_date" });
    setSaving(false); if (error) return setErr(error.message);
    await load(date); setDraft({}); setSaved(true); setTimeout(() => setSaved(false), 2500);
  }
  if (ready && !ws.length) return (<div className="empty"><h2>No workers yet</h2><p className="muted">Register your first worker to start marking attendance.</p><a className="btn lg" href="/register">Register worker</a></div>);
  return (<div>
    <div className="dh"><button className="ib" aria-label="Previous day" onClick={() => setDate(addDay(date, -1))}><ChevronLeft size={20} /></button>
      <div className="dt"><h1 className="h1">{date === today() ? "Today" : wd(date)}</h1><span className="muted">{label(date)}</span></div>
      <button className="ib" aria-label="Next day" disabled={date >= today()} onClick={() => setDate(addDay(date, 1))}><ChevronRight size={20} /></button></div>
    <div className="sum">{[["Present", cnt("present")], ["Absent", cnt("absent")], ["Late", late], ["On leave", cnt("leave")]].map(([k, v]) => (<div key={k as string}><b>{v}</b><span>{k}</span></div>))}</div>
    <div className="tool"><div className="sbox"><Search size={16} /><input placeholder="Search name or ID" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <select value={site} onChange={(e) => setSite(e.target.value)} aria-label="Filter by site"><option value="">All sites</option>{sites.map((x) => <option key={x}>{x}</option>)}</select></div>
    <div className="row" style={{ margin: "4px 0 8px" }}><span className="muted">{list.length} workers</span><button className="lnk" onClick={rest}>Mark remaining present</button></div>
    <div className="list">{list.map((w) => { const s = st(w.id); const r = rec(w.id); const sn = S.find((x) => x.k === s);
      return (<div className="er" key={w.id}><div className="nm"><b>{w.name}</b><small>{w.sites?.name ?? "No site"} · {w.trade ?? "No trade"}</small>
        <span className="stl">{sn ? <><i className={"dot " + s} />{sn.n}{s === "present" && hm(r?.check_in ?? null) > LATE ? ", late" : ""}{r?.check_in ? " · In " + t12(r.check_in) : ""}{r?.check_out ? " · Out " + t12(r.check_out) : ""}</> : <span className="faint">Not marked</span>}</span></div>
        <div className="seg" role="group" aria-label={"Status for " + w.name}>{S.map((x) => (<button key={x.k} className={x.c + (s === x.k ? " on" : "")} aria-pressed={s === x.k} aria-label={x.n} onClick={() => pick(w.id, x.k)}>{x.c}</button>))}</div></div>); })}
      {!list.length && <p className="muted" style={{ padding: 16 }}>No workers match your search.</p>}</div>
    <div className="bar"><div className="barin"><div className="cnts">{err ? <span className="errt">{err}</span> : saved ? <span className="okt"><Check size={16} />Saved</span> :
      <span>P {cnt("present")} · A {cnt("absent")} · H {cnt("half")} · L {cnt("leave")} · {left} left</span>}</div>
      <button className="lg" disabled={!n || saving} onClick={save}>{saving ? "Saving..." : n ? `Save (${n})` : "Save"}</button></div></div></div>);
}
