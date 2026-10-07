"use client";
import { useEffect, useState } from "react";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { sb } from "@/lib/supabase";
import { getPos } from "@/lib/geo";
import { useMe } from "@/components/Auth";
type S = { id: string; name: string; lat: number | null; lng: number | null; radius_m: number };
export default function Sites() {
  const me = useMe(); const [sites, setSites] = useState<S[]>([]); const [name, setName] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState("");
  const [ed, setEd] = useState<string | null>(null); const [en, setEn] = useState(""); const [er, setEr] = useState("100");
  const load = async () => { const { data } = await sb().from("sites").select("*").order("created_at"); setSites((data as S[]) ?? []); };
  useEffect(() => { load(); }, []);
  async function add() {
    if (!name) return setMsg("Enter a site name."); setBusy("new");
    try { setMsg("Detecting location..."); const p = await getPos(); const { error } = await sb().from("sites").insert({ name, lat: p.lat, lng: p.lng, radius_m: 100 });
      setMsg(error ? error.message : `Site saved (accuracy ~${Math.round(p.acc)} m)`); if (!error) { setName(""); load(); } } catch (e) { setMsg((e as Error).message); }
    setBusy("");
  }
  async function setLoc(s: S) {
    if (s.lat != null && !confirm("Replace the saved location with your current position? Do this only while standing at the site.")) return; setBusy(s.id);
    try { setMsg("Detecting location..."); const p = await getPos(); const { error } = await sb().from("sites").update({ lat: p.lat, lng: p.lng }).eq("id", s.id);
      setMsg(error ? error.message : `${s.name}: location saved (accuracy ~${Math.round(p.acc)} m)`); if (!error) load(); } catch (e) { setMsg((e as Error).message); }
    setBusy("");
  }
  async function saveEdit(s: S) {
    const r = Number(er); if (!en.trim() || !(r >= 20 && r <= 1000)) return setMsg("Enter a name and a radius between 20 and 1000 m.");
    const { error } = await sb().from("sites").update({ name: en.trim(), radius_m: r }).eq("id", s.id); if (error) return setMsg(error.message); setEd(null); setMsg("Saved."); load();
  }
  async function del(s: S) {
    if (!confirm(`Delete ${s.name}? Its workers and attendance must be moved or removed first.`)) return;
    const { data, error } = await sb().from("sites").delete().eq("id", s.id).select();
    if (error) return setMsg(/foreign key|violates/i.test(error.message) ? "This site still has workers or attendance records. Move or remove them first." : error.message);
    if (!data?.length) return setMsg("Could not delete this site."); setMsg("Site deleted."); load();
  }
  return (<div><h2>Sites</h2>
    {me.role === "admin" && <div className="card"><p className="muted">Stand at the site, enter its name and detect the location. Or create a user with a site name and let them set the location on site.</p>
      <input placeholder="Site name" value={name} onChange={(e) => setName(e.target.value)} /><button className="lg" disabled={busy === "new"} onClick={add}><MapPin size={18} />Detect location + save</button></div>}
    {msg && <p className="status">{msg}</p>}
    {sites.map((s) => (<div className="card" key={s.id}><div className="row"><div><b>{s.name}</b><p className="muted">{s.lat != null ? `${s.lat.toFixed(5)}, ${s.lng!.toFixed(5)} · ${s.radius_m} m` : "Location not set"}</p></div>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span className={"badge " + (s.lat == null ? "bad" : "")}>{s.lat == null ? "Pending" : "Set"}</span>
        {me.role === "admin" && <><button className="ib" aria-label="Edit site" onClick={() => { setEd(ed === s.id ? null : s.id); setEn(s.name); setEr(String(s.radius_m)); }}><Pencil size={18} /></button>
          <button className="ib" style={{ color: "var(--no)" }} aria-label="Delete site" onClick={() => del(s)}><Trash2 size={18} /></button></>}</span></div>
      {ed === s.id && <div style={{ marginTop: 8 }}><input value={en} onChange={(e) => setEn(e.target.value)} placeholder="Site name" /><input value={er} inputMode="numeric" onChange={(e) => setEr(e.target.value)} placeholder="Radius in metres" />
        <button onClick={() => saveEdit(s)}>Save changes</button></div>}
      <button className="sec" disabled={busy === s.id} onClick={() => setLoc(s)}><MapPin size={18} />{s.lat == null ? "Set location here" : "Update location here"}</button></div>))}
    {!sites.length && <p className="muted">No sites yet.</p>}</div>);
}
