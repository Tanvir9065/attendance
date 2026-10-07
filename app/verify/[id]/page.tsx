"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { sb } from "@/lib/supabase";
export default function Verify() {
  const { id } = useParams<{ id: string }>();
  const [w, setW] = useState<any>(null); const [img, setImg] = useState(""); const [err, setErr] = useState("");
  useEffect(() => { (async () => {
    const { data } = await sb().from("workers").select("name,emp_code,trade,active,photo_path,sites(name)").eq("id", id).single();
    if (!data) return setErr("Please sign in first (guard/admin), then scan the QR again."); setW(data);
    if (data.photo_path) { const s = await sb().storage.from("worker-photos").createSignedUrl(data.photo_path, 600); setImg(s.data?.signedUrl ?? ""); } })(); }, [id]);
  if (err) return <div className="card"><p>{err}</p><a className="btn" href="/">Login</a></div>; if (!w) return <p className="muted">Verifying...</p>;
  return (<div className="card" style={{ textAlign: "center" }}>{img && <img className="ph" style={{ width: 120, height: 140, objectFit: "cover", borderRadius: 12 }} src={img} alt="" />}
    <h2>{w.name}</h2><p className="muted">{w.emp_code} · {w.trade ?? "-"} · {w.sites?.name ?? "-"}</p>
    <span className={"badge " + (w.active ? "" : "bad")}>{w.active ? "ACTIVE ✔" : "BLOCKED ✖"}</span></div>);
}
