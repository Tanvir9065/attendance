"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { sb } from "@/lib/supabase";
import { startCam, getDescriptor, loadFace } from "@/lib/face";
export default function Edit() {
  const { id } = useParams<{ id: string }>(); const router = useRouter(); const v = useRef<HTMLVideoElement>(null);
  const [f, setF] = useState<any>(null); const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [cam, setCam] = useState(false); const [ok, setOk] = useState(false); const [msg, setMsg] = useState("");
  useEffect(() => { (async () => {
    const { data } = await sb().from("workers").select("name,phone,trade,blood_group,emergency_name,emergency_phone,daily_wage,site_id,active,photo_path,emp_code").eq("id", id).single(); setF(data);
    const s = await sb().from("sites").select("id,name"); setSites(s.data ?? []); })(); }, [id]);
  useEffect(() => { if (cam) (async () => { try { await loadFace(); await startCam(v.current!); setMsg("Camera ready"); } catch { setMsg("Camera allow karo"); } })(); }, [cam]);
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  async function save() {
    const { error } = await sb().from("workers").update({ name: f.name, phone: f.phone, trade: f.trade, blood_group: f.blood_group, emergency_name: f.emergency_name,
      emergency_phone: f.emergency_phone, daily_wage: Number(f.daily_wage) || 0, site_id: f.site_id || null }).eq("id", id);
    setMsg(error ? error.message : "Save ho gaya ✅");
  }
  async function toggle() {
    const a = !f.active; const { error } = await sb().from("workers").update({ active: a }).eq("id", id);
    if (error) return setMsg(error.message); setF({ ...f, active: a }); setMsg(a ? "Unblock ho gaya" : "Block ho gaya");
  }
  async function photo() {
    if (!ok) return setMsg("Consent zaruri hai"); const el = v.current!; setMsg("Scan ho raha hai...");
    const d = await getDescriptor(el); if (!d) return setMsg("Face nahi mila");
    const c = document.createElement("canvas"); c.width = el.videoWidth; c.height = el.videoHeight; c.getContext("2d")!.drawImage(el, 0, 0);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85)); const path = id + ".jpg";
    const up = await sb().storage.from("worker-photos").upload(path, blob!, { contentType: "image/jpeg", upsert: true }); if (up.error) return setMsg(up.error.message);
    const { error } = await sb().from("workers").update({ photo_path: path, face: d, consent_at: new Date().toISOString() }).eq("id", id);
    if (error) return setMsg(error.message); setF({ ...f, photo_path: path }); setCam(false); setMsg("Photo + face update ho gaya ✅");
  }
  async function del() {
    const { count } = await sb().from("attendance").select("id", { count: "exact", head: true }).eq("worker_id", id);
    if (count) return setMsg("Is worker ki attendance hai, delete nahi hoga. Block karo.");
    if (!confirm("Pakka delete karna hai?")) return;
    if (f.photo_path) await sb().storage.from("worker-photos").remove([f.photo_path]);
    const { error } = await sb().from("workers").delete().eq("id", id); if (error) return setMsg(error.message); router.push("/workers");
  }
  if (!f) return <p className="muted">Load ho raha hai... (login check karo)</p>;
  return (<div><h2>{f.emp_code}</h2>
    <div className="card"><input placeholder="Naam" value={f.name ?? ""} onChange={set("name")} /><input placeholder="Phone" value={f.phone ?? ""} onChange={set("phone")} />
      <select value={f.site_id ?? ""} onChange={set("site_id")}><option value="">Site chuno</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <input placeholder="Trade" value={f.trade ?? ""} onChange={set("trade")} /><input placeholder="Blood group" value={f.blood_group ?? ""} onChange={set("blood_group")} />
      <input placeholder="Emergency naam" value={f.emergency_name ?? ""} onChange={set("emergency_name")} /><input placeholder="Emergency number" value={f.emergency_phone ?? ""} onChange={set("emergency_phone")} />
      <input placeholder="Daily wage" inputMode="numeric" value={f.daily_wage ?? ""} onChange={set("daily_wage")} />
      <button onClick={save}>Save</button></div>
    <div className="card"><span className={"badge " + (f.active ? "" : "bad")}>{f.active ? "ACTIVE" : "BLOCKED"}</span>
      <button className="sec" onClick={toggle}>{f.active ? "Block karo" : "Unblock karo"}</button></div>
    <div className="card"><p className="muted">{f.photo_path ? "Photo maujood hai" : "⚠️ Photo/face baaki hai"}</p>
      {!cam ? <button className="sec" onClick={() => setCam(true)}>📷 Photo + face update</button> : <>
        <video ref={v} muted playsInline />
        <label className="muted"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />Worker ki photo/face data ki consent hai</label>
        <button onClick={photo}>Capture + Save</button></>}</div>
    <div className="card"><button style={{ background: "#dc2626" }} onClick={del}>Delete worker</button></div><p className="muted">{msg}</p></div>);
}
