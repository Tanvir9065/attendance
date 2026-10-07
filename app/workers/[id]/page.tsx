"use client";
import { SwitchCamera, Save, Ban, CheckCircle2, Trash2, Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { sb } from "@/lib/supabase";
import { useMe } from "@/components/Auth";
import { startCam, getDescriptor, loadFace } from "@/lib/face";
export default function Edit() {
  const { id } = useParams<{ id: string }>(); const me = useMe(); const router = useRouter(); const v = useRef<HTMLVideoElement>(null);
  const [f, setF] = useState<any>(null); const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [cam, setCam] = useState(false); const [facing, setFacing] = useState<"user" | "environment">("user"); const [ok, setOk] = useState(false); const [msg, setMsg] = useState("");
  useEffect(() => { (async () => {
    const { data } = await sb().from("workers").select("name,phone,trade,blood_group,emergency_name,emergency_phone,daily_wage,site_id,active,photo_path,emp_code").eq("id", id).single(); setF(data);
    const s = await sb().from("sites").select("id,name"); setSites(s.data ?? []); })(); }, [id]);
  useEffect(() => { if (cam) (async () => { try { await loadFace(); await startCam(v.current!, facing); setMsg("Camera ready"); } catch { setMsg("Please allow camera access"); } })(); }, [cam, facing]);
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  async function save() {
    const { error } = await sb().from("workers").update({ name: f.name, phone: f.phone, trade: f.trade, blood_group: f.blood_group, emergency_name: f.emergency_name,
      emergency_phone: f.emergency_phone, daily_wage: Number(f.daily_wage) || 0, site_id: f.site_id || null }).eq("id", id);
    setMsg(error ? error.message : "Saved");
  }
  async function toggle() {
    const a = !f.active; const { error } = await sb().from("workers").update({ active: a }).eq("id", id);
    if (error) return setMsg(error.message); setF({ ...f, active: a }); setMsg(a ? "Unblocked" : "Blocked");
  }
  async function photo() {
    if (!ok) return setMsg("Consent is required"); const el = v.current!; setMsg("Scanning...");
    const d = await getDescriptor(el); if (!d) return setMsg("No face detected");
    const c = document.createElement("canvas"); c.width = el.videoWidth; c.height = el.videoHeight; c.getContext("2d")!.drawImage(el, 0, 0);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85)); const path = id + ".jpg";
    const up = await sb().storage.from("worker-photos").upload(path, blob!, { contentType: "image/jpeg", upsert: true }); if (up.error) return setMsg(up.error.message);
    const { error } = await sb().from("workers").update({ photo_path: path, face: d, consent_at: new Date().toISOString() }).eq("id", id);
    if (error) return setMsg(error.message); setF({ ...f, photo_path: path }); setCam(false); setMsg("Photo and face updated");
  }
  async function del() {
    const { count } = await sb().from("attendance").select("id", { count: "exact", head: true }).eq("worker_id", id);
    if (count) return setMsg("This worker has attendance records and cannot be deleted. Block instead.");
    if (!confirm("Delete this worker permanently?")) return;
    if (f.photo_path) await sb().storage.from("worker-photos").remove([f.photo_path]);
    const { error } = await sb().from("workers").delete().eq("id", id); if (error) return setMsg(error.message); router.push("/workers");
  }
  if (!f) return <p className="muted">Loading...</p>;
  return (<div><h2>{f.emp_code}</h2>
    <div className="card"><input placeholder="Name" value={f.name ?? ""} onChange={set("name")} /><input placeholder="Phone" value={f.phone ?? ""} onChange={set("phone")} />
      <select value={f.site_id ?? ""} onChange={set("site_id")}><option value="">Select site</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <input placeholder="Trade" value={f.trade ?? ""} onChange={set("trade")} /><input placeholder="Blood group" value={f.blood_group ?? ""} onChange={set("blood_group")} />
      <input placeholder="Emergency name" value={f.emergency_name ?? ""} onChange={set("emergency_name")} /><input placeholder="Emergency number" value={f.emergency_phone ?? ""} onChange={set("emergency_phone")} />
      <input placeholder="Daily wage" inputMode="numeric" value={f.daily_wage ?? ""} onChange={set("daily_wage")} />
      <button onClick={save}><Save size={18} />Save</button></div>
    <div className="card"><span className={"badge " + (f.active ? "" : "bad")}>{f.active ? "ACTIVE" : "BLOCKED"}</span>
      <button className="sec" onClick={toggle}>{f.active ? <Ban size={18} /> : <CheckCircle2 size={18} />}{f.active ? "Block worker" : "Unblock worker"}</button></div>
    <div className="card"><p className="muted">{f.photo_path ? "Photo on file" : "Photo/face missing"}</p>
      {!cam ? <button className="sec" onClick={() => setCam(true)}><Camera size={18} />Update photo + face</button> : <>
        <div className="vwrap"><video ref={v} muted playsInline className={facing === "environment" ? "rear" : ""} /><button className="flip" aria-label="Switch camera" onClick={() => setFacing(facing === "user" ? "environment" : "user")}><SwitchCamera size={20} /></button></div>
        <label className="muted"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />Worker consents to photo/face data collection</label>
        <button onClick={photo}><Camera size={18} />Capture + Save</button></>}</div>
    {me.role === "admin" && <div className="card"><button className="danger" onClick={del}><Trash2 size={18} />Delete worker</button></div>}<p className="muted">{msg}</p></div>);
}
