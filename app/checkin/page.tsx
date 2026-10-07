"use client";
import { useEffect, useRef, useState } from "react";
import { ScanFace, CheckCircle2, AlertCircle } from "lucide-react";
import { sb, today } from "@/lib/supabase";
import { startCam, getDescriptor, loadFace, dist, MATCH } from "@/lib/face";
import { getPos, meters } from "@/lib/geo";
type W = { id: string; name: string; face: number[]; site_id: string | null };
type S = { id: string; name: string; lat: number; lng: number; radius_m: number };
export default function Checkin() {
  const v = useRef<HTMLVideoElement>(null); const workers = useRef<W[]>([]); const sites = useRef<S[]>([]);
  const [msg, setMsg] = useState("Loading..."); const [busy, setBusy] = useState(false);
  useEffect(() => { (async () => { try {
    const w = await sb().from("workers").select("id,name,face,site_id").eq("active", true); workers.current = (w.data as W[]) ?? [];
    const s = await sb().from("sites").select("*"); sites.current = (s.data as S[]) ?? [];
    await loadFace(); await startCam(v.current!); setMsg("Ready. Tap Scan"); } catch { setMsg("Check login and camera access"); } })(); }, []);
  async function scan() {
    setBusy(true); setMsg("Scanning...");
    try {
      const d = await getDescriptor(v.current!); if (!d) return setMsg("No face detected");
      let best: W | null = null, bd = 9;
      for (const w of workers.current) { const x = dist(d, w.face); if (x < bd) { bd = x; best = w; } }
      if (!best || bd > MATCH) return setMsg("Face not recognised");
      const site = sites.current.find((s) => s.id === best!.site_id);
      if (!site) return setMsg(best.name + ": no site assigned");
      const p = await getPos(); const m = meters(p, site);
      if (m > site.radius_m) return setMsg(`${best.name}: ${Math.round(m)} m away from site (limit ${site.radius_m} m)`);
      const day = today(); const now = new Date().toISOString();
      const { data: row } = await sb().from("attendance").select("*").eq("worker_id", best.id).eq("work_date", day).maybeSingle();
      if (!row) { await sb().from("attendance").insert({ worker_id: best.id, work_date: day, check_in: now, site_id: site.id, lat: p.lat, lng: p.lng }); setMsg(best.name + ": CHECKED IN"); }
      else if (!row.check_out && Date.now() - new Date(row.check_in).getTime() > 5 * 60000) { await sb().from("attendance").update({ check_out: now }).eq("id", row.id); setMsg(best.name + ": CHECKED OUT"); }
      else setMsg(best.name + ": already marked for today");
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }
  const kind = /CHECKED/.test(msg) ? "ok" : /away|not recognised|No face|no site|Please|Check login/.test(msg) ? "err" : "";
  return (<div><h2 className="pt">Mark attendance</h2><div className="vwrap"><video ref={v} muted playsInline /><div className="frame" /></div>
    <div className={"result " + kind}>{kind === "ok" ? <CheckCircle2 size={20} /> : kind === "err" ? <AlertCircle size={20} /> : <ScanFace size={20} />}<span>{msg}</span></div>
    <button className="scanbtn" disabled={busy} onClick={scan}><ScanFace size={22} />{busy ? "Scanning..." : "Scan face"}</button></div>);
}
