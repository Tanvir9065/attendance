"use client";
import { useEffect, useRef, useState } from "react";
import { ScanFace, CheckCircle2, AlertCircle, SwitchCamera } from "lucide-react";
import { sb, today } from "@/lib/supabase";
import { startCam, getDescriptor, loadFace, dist, MATCH } from "@/lib/face";
import { getPos, meters } from "@/lib/geo";
type W = { id: string; name: string; face: number[]; site_id: string | null };
type S = { id: string; name: string; lat: number; lng: number; radius_m: number };
export default function Checkin() {
  const v = useRef<HTMLVideoElement>(null); const workers = useRef<W[]>([]); const sites = useRef<S[]>([]);
  const [msg, setMsg] = useState("Loading..."); const [busy, setBusy] = useState(false); const [facing, setFacing] = useState<"user" | "environment">("user"); const [locErr, setLocErr] = useState("");
  useEffect(() => { (async () => { try {
    const w = await sb().from("workers").select("id,name,face,site_id").eq("active", true); workers.current = (w.data as W[]) ?? [];
    const s = await sb().from("sites").select("*"); sites.current = (s.data as S[]) ?? [];
    await loadFace(); setMsg("Ready. Tap Scan"); } catch { setMsg("Check login and camera access"); } })(); }, []);
  useEffect(() => { const el = v.current!; startCam(el, facing).catch(() => setMsg("Please allow camera access")); return () => (el.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop()); }, [facing]);
  const askLoc = () => { setLocErr(""); getPos().catch((e) => setLocErr((e as Error).message)); };
  useEffect(() => { askLoc(); }, []);
  async function scan() {
    setBusy(true); setMsg("Scanning..."); const posP = getPos(); posP.catch(() => {});
    try {
      const d = await getDescriptor(v.current!); if (!d) return setMsg("No face detected");
      let best: W | null = null, bd = 9;
      for (const w of workers.current) { const x = dist(d, w.face); if (x < bd) { bd = x; best = w; } }
      if (!best || bd > MATCH) return setMsg("Face not recognised");
      const site = sites.current.find((s) => s.id === best!.site_id);
      if (!site) return setMsg(best.name + ": no site assigned");
      if (site.lat == null || site.lng == null) return setMsg("Site location is not set yet. The site manager must set it first.");
      const p = await posP; const m = meters(p, site);
      if (m > site.radius_m) return setMsg(`${best.name}: ${Math.round(m)} m away from site (limit ${site.radius_m} m)`);
      const day = today(); const now = new Date().toISOString();
      const { data: row } = await sb().from("attendance").select("*").eq("worker_id", best.id).eq("work_date", day).maybeSingle();
      const tm = (x: string) => new Date(x).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
      if (!row) { await sb().from("attendance").insert({ worker_id: best.id, work_date: day, check_in: now, site_id: site.id, lat: p.lat, lng: p.lng }); setMsg(`${best.name}: CHECKED IN at ${tm(now)}`); }
      else if (row.check_out) setMsg(`${best.name}: Already checked out at ${tm(row.check_out)}`);
      else { const left = 5 * 60000 - (Date.now() - new Date(row.check_in).getTime());
        if (left > 0) setMsg(`${best.name}: Already checked in at ${tm(row.check_in)}. Check-out opens in ${Math.ceil(left / 60000)} min`);
        else { await sb().from("attendance").update({ check_out: now }).eq("id", row.id); setMsg(`${best.name}: CHECKED OUT at ${tm(now)}`); } }
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }
  const kind = /Already/.test(msg) ? "warn" : /CHECKED (IN|OUT)/.test(msg) ? "ok" : /away|not recognised|No face|no site|Please|Check login|ocation/.test(msg) ? "err" : "";
  return (<div><h2 className="pt">Mark attendance</h2><div className="vwrap"><video ref={v} muted playsInline className={facing === "environment" ? "rear" : ""} /><div className="frame" /><button className="flip" aria-label="Switch camera" onClick={() => setFacing(facing === "user" ? "environment" : "user")}><SwitchCamera size={20} /></button></div>
    {locErr && <><div className="result err"><AlertCircle size={20} /><span>{locErr}</span></div><button className="sec" onClick={askLoc}>Enable location</button></>}<div className={"result " + kind}>{kind === "ok" ? <CheckCircle2 size={20} /> : kind === "err" || kind === "warn" ? <AlertCircle size={20} /> : <ScanFace size={20} />}<span>{msg}</span></div>
    <button className="scanbtn" disabled={busy} onClick={scan}><ScanFace size={22} />{busy ? "Scanning..." : "Scan face"}</button></div>);
}
