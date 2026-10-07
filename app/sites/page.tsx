"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { getPos } from "@/lib/geo";
type S = { id: string; name: string; lat: number; lng: number; radius_m: number };
export default function Sites() {
  const [sites, setSites] = useState<S[]>([]); const [name, setName] = useState(""); const [msg, setMsg] = useState("");
  const load = async () => { const { data } = await sb().from("sites").select("*").order("created_at"); setSites((data as S[]) ?? []); };
  useEffect(() => { load(); }, []);
  async function add() {
    if (!name) return setMsg("Site ka naam likho");
    try { setMsg("Location detect ho rahi hai..."); const p = await getPos();
      const { error } = await sb().from("sites").insert({ name, lat: p.lat, lng: p.lng, radius_m: 100 });
      setMsg(error ? error.message : `Site save (accuracy ~${Math.round(p.acc)} m)`); if (!error) { setName(""); load(); }
    } catch (e) { setMsg((e as Error).message); }
  }
  return (<div><h2>Sites</h2><div className="card"><p className="muted">Site par khade hokar naam likho aur detect dabao. 100 m radius set hoga.</p>
    <input placeholder="Site ka naam" value={name} onChange={(e) => setName(e.target.value)} />
    <button onClick={add}>📍 Location detect + save</button><p className="muted">{msg}</p></div>
    {sites.map((s) => (<div className="card" key={s.id}><b>{s.name}</b><p className="muted">{s.lat.toFixed(5)}, {s.lng.toFixed(5)} · {s.radius_m} m</p></div>))}</div>);
}
