"use client";
import { useEffect, useRef, useState } from "react";
import { ScanFace, Check, X, AlertTriangle, SwitchCamera } from "lucide-react";
import { sb, today } from "@/lib/supabase";
import { startCam, getDescriptor, faceReady, loadFace, dist, MATCH } from "@/lib/face";
import { getPos, meters } from "@/lib/geo";
type W = { id: string; name: string; face: number[]; site_id: string | null };
type S = { id: string; name: string; lat: number | null; lng: number | null; radius_m: number };
type K = "" | "ok" | "warn" | "err";
type R = { k: K; text: string };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const tm = (x: string) => new Date(x).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
const IDLE = "Looking for a face...";
export default function Checkin() {
  const v = useRef<HTMLVideoElement>(null); const workers = useRef<W[]>([]); const sites = useRef<S[]>([]); const ready = useRef(false);
  const [msg, setMsg] = useState("Loading..."); const [kind, setKind] = useState<K>(""); const [facing, setFacing] = useState<"user" | "environment">("user"); const [locErr, setLocErr] = useState("");
  useEffect(() => { (async () => { try {
    const w = await sb().from("workers").select("id,name,face,site_id").eq("active", true); workers.current = (w.data as W[]) ?? [];
    const s = await sb().from("sites").select("*"); sites.current = (s.data as S[]) ?? [];
    await loadFace(); ready.current = true; setMsg(IDLE); } catch { setMsg("Could not load. Check your connection and reload."); } })(); }, []);
  useEffect(() => { const el = v.current!; startCam(el, facing).catch(() => setMsg("Please allow camera access")); return () => (el.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop()); }, [facing]);
  const askLoc = () => { setLocErr(""); getPos().catch((e) => setLocErr((e as Error).message)); };
  useEffect(() => { askLoc(); }, []);
  useEffect(() => {
    let alive = true;
    (async () => { let hits = 0, clear = false;
      while (alive) { await sleep(600); const el = v.current; if (!ready.current || !el || el.readyState < 2) continue;
        try {
          const face = await faceReady(el);
          if (!face) { hits = 0; clear = false; setMsg(IDLE); continue; }
          if (clear) { setMsg("Done. Next person, please step in."); continue; }
          if (++hits < 2) { setMsg("Hold still..."); continue; }
          hits = 0; setMsg("Scanning..."); const r = await scan(el);
          if (!alive) break; if (!r) { setMsg(IDLE); continue; }
          setKind(r.k); setMsg(r.text); clear = r.k !== "err"; await sleep(r.k === "ok" ? 3000 : 2500); setKind(""); setMsg(IDLE);
        } catch { setMsg(IDLE); } } })();
    return () => { alive = false; };
  }, []);
  async function scan(el: HTMLVideoElement): Promise<R | null> {
    const posP = getPos(); posP.catch(() => {});
    const d = await getDescriptor(el); if (!d) return null;
    const c = workers.current.map((w) => ({ w, x: dist(d, w.face) })).sort((a, b) => a.x - b.x)[0];
    if (!c || c.x > MATCH) return { k: "err", text: "Face not recognised" };
    const best = c.w; const site = sites.current.find((s) => s.id === best.site_id);
    if (!site) return { k: "err", text: best.name + ": no site assigned" };
    if (site.lat == null || site.lng == null) return { k: "err", text: "Site location is not set yet. The site manager must set it first." };
    let p; try { p = await posP; } catch (e) { return { k: "err", text: (e as Error).message }; }
    const m = meters(p, { lat: site.lat, lng: site.lng }); if (m > site.radius_m) return { k: "err", text: `${best.name}: ${Math.round(m)} m away from site (limit ${site.radius_m} m)` };
    const day = today(); const now = new Date().toISOString();
    const { data: row } = await sb().from("attendance").select("*").eq("worker_id", best.id).eq("work_date", day).maybeSingle();
    if (!row || !row.check_in) {
      const pay = { check_in: now, site_id: site.id, lat: p.lat, lng: p.lng, status: "present" };
      const { error } = row ? await sb().from("attendance").update(pay).eq("id", row.id) : await sb().from("attendance").insert({ worker_id: best.id, work_date: day, ...pay });
      return error ? { k: "err", text: error.message } : { k: "ok", text: `${best.name}: CHECKED IN at ${tm(now)}` };
    }
    if (row.check_out) return { k: "warn", text: `${best.name}: Already checked out at ${tm(row.check_out)}` };
    const left = 5 * 60000 - (Date.now() - new Date(row.check_in).getTime());
    if (left > 0) return { k: "warn", text: `${best.name}: Already checked in at ${tm(row.check_in)}. Check-out opens in ${Math.ceil(left / 60000)} min` };
    const { error } = await sb().from("attendance").update({ check_out: now }).eq("id", row.id);
    return error ? { k: "err", text: error.message } : { k: "ok", text: `${best.name}: CHECKED OUT at ${tm(now)}` };
  }
  return (<div><h2 className="pt">Mark attendance</h2>
    <div className={"vwrap sm " + kind}><video ref={v} muted playsInline className={facing === "environment" ? "rear" : ""} /><div className="frame" />
      <button className="flip" aria-label="Switch camera" onClick={() => setFacing(facing === "user" ? "environment" : "user")}><SwitchCamera size={20} /></button>
      {kind && <div className={"flash " + kind}>{kind === "ok" ? <Check size={72} strokeWidth={2.5} /> : kind === "warn" ? <AlertTriangle size={64} strokeWidth={2.2} /> : <X size={72} strokeWidth={2.5} />}</div>}</div>
    {locErr && <><div className="result err"><X size={20} /><span>{locErr}</span></div><button className="sec" onClick={askLoc}>Enable location</button></>}
    <div className={"result " + kind}>{kind === "ok" ? <Check size={20} /> : kind === "err" ? <X size={20} /> : kind === "warn" ? <AlertTriangle size={20} /> : <ScanFace size={20} />}<span>{msg}</span></div></div>);
}
