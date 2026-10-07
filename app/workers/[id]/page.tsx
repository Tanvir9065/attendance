"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SwitchCamera, Save, Ban, CheckCircle2, Trash2, Camera, ChevronRight } from "lucide-react";
import { sb } from "@/lib/supabase";
import { useMe } from "@/components/Auth";
import { startCam, getDescriptor, loadFace } from "@/lib/face";
export default function Edit() {
  const { id } = useParams<{ id: string }>(); const me = useMe(); const router = useRouter(); const v = useRef<HTMLVideoElement>(null);
  const [f, setF] = useState<any>(null); const [sites, setSites] = useState<{ id: string; name: string }[]>([]); const [img, setImg] = useState("");
  const [cam, setCam] = useState(false); const [facing, setFacing] = useState<"user" | "environment">("user"); const [ok, setOk] = useState(false); const [msg, setMsg] = useState("");
  const photoUrl = async (path: string | null) => { if (!path) return setImg(""); const s = await sb().storage.from("worker-photos").createSignedUrl(path, 3600); setImg(s.data?.signedUrl ?? ""); };
  useEffect(() => { (async () => {
    const { data } = await sb().from("workers").select("name,phone,trade,blood_group,emergency_name,emergency_phone,daily_wage,site_id,active,photo_path,emp_code").eq("id", id).single(); setF(data); if (data) photoUrl(data.photo_path);
    const s = await sb().from("sites").select("id,name"); setSites(s.data ?? []); })(); }, [id]);
  useEffect(() => {
    if (!cam) return; const el = v.current!;
    (async () => { try { await loadFace(); await startCam(el, facing); } catch { setMsg("Please allow camera access"); } })();
    return () => (el.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop());
  }, [cam, facing]);
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const fld = (k: string, label: string, extra: object = {}) => (<label className="fl"><span>{label}</span><input value={f[k] ?? ""} onChange={set(k)} {...extra} /></label>);
  async function save() {
    if (!f.name?.trim()) return setMsg("Name is required.");
    const { error } = await sb().from("workers").update({ name: f.name.trim(), phone: f.phone, trade: f.trade, blood_group: f.blood_group, emergency_name: f.emergency_name,
      emergency_phone: f.emergency_phone, daily_wage: Number(f.daily_wage) || 0, site_id: f.site_id || null }).eq("id", id);
    setMsg(error ? error.message : "Changes saved.");
  }
  async function toggle() {
    const a = !f.active; const { error } = await sb().from("workers").update({ active: a }).eq("id", id);
    if (error) return setMsg(error.message); setF({ ...f, active: a }); setMsg(a ? "Worker unblocked." : "Worker blocked.");
  }
  async function photo() {
    if (!ok) return setMsg("Consent is required."); const el = v.current!; setMsg("Scanning...");
    const d = await getDescriptor(el); if (!d) return setMsg("No face detected. Look straight at the camera.");
    const c = document.createElement("canvas"); c.width = el.videoWidth; c.height = el.videoHeight; c.getContext("2d")!.drawImage(el, 0, 0);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85)); const path = id + ".jpg";
    const up = await sb().storage.from("worker-photos").upload(path, blob!, { contentType: "image/jpeg", upsert: true }); if (up.error) return setMsg(up.error.message);
    const { error } = await sb().from("workers").update({ photo_path: path, face: d, consent_at: new Date().toISOString() }).eq("id", id);
    if (error) return setMsg(error.message); setF({ ...f, photo_path: path }); photoUrl(path); setCam(false); setOk(false); setMsg("Photo and face updated.");
  }
  async function del() {
    const { count } = await sb().from("attendance").select("id", { count: "exact", head: true }).eq("worker_id", id);
    if (count) return setMsg("This worker has attendance records and cannot be deleted. Block the worker instead.");
    if (!confirm("Delete this worker permanently?")) return;
    if (f.photo_path) await sb().storage.from("worker-photos").remove([f.photo_path]);
    const { data, error } = await sb().from("workers").delete().eq("id", id).select(); if (error) return setMsg(error.message);
    if (!data?.length) return setMsg("Could not delete this worker."); router.push("/workers");
  }
  if (!f) return <p className="muted">Loading...</p>;
  return (<div className="ep">
    <div className="eh"><span className="av big">{img ? <img src={img} alt="" /> : (f.name || "?").slice(0, 1).toUpperCase()}</span>
      <div className="nm"><h2 style={{ margin: 0 }}>{f.name || "Worker"}</h2><small>{f.emp_code} · <span className={"badge " + (f.active ? "" : "bad")}>{f.active ? "Active" : "Blocked"}</span></small></div></div>
    {msg && <p className="status">{msg}</p>}
    <div className="card"><div className="fg">{fld("name", "Name")}{fld("phone", "Phone", { inputMode: "tel" })}
      <label className="fl"><span>Site</span><select value={f.site_id ?? ""} onChange={set("site_id")}><option value="">Select site</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      {fld("trade", "Trade")}{fld("blood_group", "Blood group")}{fld("daily_wage", "Daily wage (INR)", { inputMode: "numeric" })}
      {fld("emergency_name", "Emergency contact name")}{fld("emergency_phone", "Emergency contact number", { inputMode: "tel" })}</div>
      <button className="lg" style={{ marginTop: 16 }} onClick={save}><Save size={18} />Save changes</button></div>
    <div className="card acts"><button className="ar" onClick={() => setCam(!cam)}><Camera size={19} /><span>Update photo + face<small>{f.photo_path ? "Photo on file" : "No photo yet"}</small></span><ChevronRight size={18} className="chv" /></button>
      {cam && <div className="camb"><div className="vwrap sm"><video ref={v} muted playsInline className={facing === "environment" ? "rear" : ""} />
        <button className="flip" aria-label="Switch camera" onClick={() => setFacing(facing === "user" ? "environment" : "user")}><SwitchCamera size={20} /></button></div>
        <label className="muted" style={{ display: "block", margin: "12px 0 4px" }}><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />Worker consents to photo and face data collection</label>
        <button className="lg" onClick={photo}><Camera size={18} />Capture + Save</button></div>}
      <button className="ar" onClick={toggle}>{f.active ? <Ban size={19} /> : <CheckCircle2 size={19} />}<span>{f.active ? "Block worker" : "Unblock worker"}<small>{f.active ? "Blocked workers cannot check in" : "Allow this worker to check in again"}</small></span><ChevronRight size={18} className="chv" /></button>
      {me.role === "admin" && <button className="ar dng" onClick={del}><Trash2 size={19} /><span>Delete worker<small>Only possible when there is no attendance history</small></span><ChevronRight size={18} className="chv" /></button>}</div></div>);
}
