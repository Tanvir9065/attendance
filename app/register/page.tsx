"use client";
import { CheckCircle2, Camera, SwitchCamera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { sb } from "@/lib/supabase";
import { startCam, getDescriptor, loadFace } from "@/lib/face";
const E = { name: "", phone: "", wage: "", trade: "", blood: "", en: "", ep: "", site: "" };
export default function Register() {
  const v = useRef<HTMLVideoElement>(null);
  const [f, setF] = useState(E); const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [step, setStep] = useState(1); const [facing, setFacing] = useState<"user" | "environment">("user"); const [ok, setOk] = useState(false); const [saved, setSaved] = useState(""); const [msg, setMsg] = useState("");
  const set = (k: keyof typeof E) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const stop = () => (v.current?.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop());
  useEffect(() => { sb().from("sites").select("id,name").then(({ data }) => setSites(data ?? [])); return stop; }, []);
  useEffect(() => { if (step === 2) (async () => { try { setMsg("Loading camera..."); await loadFace(); await startCam(v.current!, facing); setMsg("Look straight at the camera"); } catch { setMsg("Please allow camera access"); } })(); }, [step, facing]);
  function next() { if (!f.name || !f.site || !ok) return setMsg("Name, site and consent are required"); setMsg(""); setStep(2); }
  async function save() {
    const el = v.current!; setMsg("Scanning face..."); const d = await getDescriptor(el);
    if (!d) return setMsg("No face detected. Look straight at the camera.");
    const c = document.createElement("canvas"); c.width = el.videoWidth; c.height = el.videoHeight; c.getContext("2d")!.drawImage(el, 0, 0);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));
    const id = crypto.randomUUID(); const path = id + ".jpg";
    const up = await sb().storage.from("worker-photos").upload(path, blob!, { contentType: "image/jpeg" }); if (up.error) return setMsg(up.error.message);
    const { error } = await sb().from("workers").insert({ id, name: f.name, phone: f.phone, daily_wage: Number(f.wage) || 0, trade: f.trade, blood_group: f.blood,
      emergency_name: f.en, emergency_phone: f.ep, site_id: f.site, photo_path: path, face: d, consent_at: new Date().toISOString() });
    if (error) return setMsg(error.message); stop(); setSaved(id); setStep(3); setMsg("");
  }
  return (<div><h2>Worker register</h2><div className="steps"><div className="on" /><div className={step >= 2 ? "on" : ""} /></div>
    {step === 1 && <div className="card"><p className="muted">Step 1: Details</p>
      <select value={f.site} onChange={set("site")}><option value="">Select site</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <input placeholder="Name" value={f.name} onChange={set("name")} /><input placeholder="Phone" value={f.phone} onChange={set("phone")} />
      <input placeholder="Trade (mason, electrician...)" value={f.trade} onChange={set("trade")} /><input placeholder="Blood group" value={f.blood} onChange={set("blood")} />
      <input placeholder="Emergency contact name" value={f.en} onChange={set("en")} /><input placeholder="Emergency contact number" value={f.ep} onChange={set("ep")} />
      <input placeholder="Daily wage (₹)" inputMode="numeric" value={f.wage} onChange={set("wage")} />
      <label className="muted"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />Worker consents to photo and face data being collected for attendance, safety and gate pass</label>
      <button onClick={next}>Next: Face capture →</button>{msg && <p className="status">{msg}</p>}</div>}
    {step === 2 && <div className="card"><p className="muted">Step 2: Face capture · {f.name}</p><div className="vwrap"><video ref={v} muted playsInline className={facing === "environment" ? "rear" : ""} /><button className="flip" aria-label="Switch camera" onClick={() => setFacing(facing === "user" ? "environment" : "user")}><SwitchCamera size={20} /></button></div>
      <button onClick={save}><Camera size={18} className="i" />Capture + Save</button><button className="sec" onClick={() => { stop(); setStep(1); }}>← Back</button><p className="status">{msg}</p></div>}
    {step === 3 && <div className="card" style={{ textAlign: "center" }}><CheckCircle2 size={56} color="#16a34a" /><h2>Worker saved</h2>
      <a className="btn" href={"/card/" + saved}>View ID card</a><button className="sec" onClick={() => { setF({ ...E, site: f.site }); setOk(false); setStep(1); }}>New worker</button></div>}</div>);
}
