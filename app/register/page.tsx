"use client";
import { useEffect, useRef, useState } from "react";
import { sb } from "@/lib/supabase";
import { startCam, getDescriptor, loadFace } from "@/lib/face";
const E = { name: "", phone: "", wage: "", trade: "", blood: "", en: "", ep: "", site: "" };
export default function Register() {
  const v = useRef<HTMLVideoElement>(null);
  const [f, setF] = useState(E); const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [ok, setOk] = useState(false); const [saved, setSaved] = useState(""); const [msg, setMsg] = useState("Camera/model load ho raha hai...");
  const set = (k: keyof typeof E) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  useEffect(() => { (async () => {
    const { data } = await sb().from("sites").select("id,name"); setSites(data ?? []);
    try { await loadFace(); await startCam(v.current!); setMsg("Ready"); } catch { setMsg("Camera allow karo"); } })(); }, []);
  async function save() {
    if (!f.name || !f.site || !ok) return setMsg("Naam, site aur consent zaruri hai");
    const el = v.current!; setMsg("Face scan ho raha hai..."); const d = await getDescriptor(el);
    if (!d) return setMsg("Face nahi mila, seedha camera me dekho");
    const c = document.createElement("canvas"); c.width = el.videoWidth; c.height = el.videoHeight; c.getContext("2d")!.drawImage(el, 0, 0);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));
    const id = crypto.randomUUID(); const path = id + ".jpg";
    const up = await sb().storage.from("worker-photos").upload(path, blob!, { contentType: "image/jpeg" });
    if (up.error) return setMsg(up.error.message);
    const { error } = await sb().from("workers").insert({ id, name: f.name, phone: f.phone, daily_wage: Number(f.wage) || 0, trade: f.trade, blood_group: f.blood,
      emergency_name: f.en, emergency_phone: f.ep, site_id: f.site, photo_path: path, face: d, consent_at: new Date().toISOString() });
    if (error) return setMsg(error.message);
    setMsg("Worker save ho gaya ✅"); setSaved(id); setF({ ...E, site: f.site }); setOk(false);
  }
  return (<div><h2>Worker register</h2><div className="card"><video ref={v} muted playsInline /><p className="muted">{msg}</p></div>
    <div className="card"><select value={f.site} onChange={set("site")}><option value="">Site chuno</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <input placeholder="Naam" value={f.name} onChange={set("name")} /><input placeholder="Phone" value={f.phone} onChange={set("phone")} />
      <input placeholder="Trade (mason, electrician...)" value={f.trade} onChange={set("trade")} /><input placeholder="Blood group" value={f.blood} onChange={set("blood")} />
      <input placeholder="Emergency contact naam" value={f.en} onChange={set("en")} /><input placeholder="Emergency contact number" value={f.ep} onChange={set("ep")} />
      <input placeholder="Daily wage (₹)" inputMode="numeric" value={f.wage} onChange={set("wage")} />
      <label className="muted"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />Worker ki photo aur face data attendance, safety aur gate pass ke liye lene ki consent hai</label>
      <button onClick={save}>Photo + Face scan + Save</button>
      {saved && <a className="btn sec" href={"/card/" + saved}>ID card dekho</a>}</div></div>);
}
