"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { sb } from "@/lib/supabase";
export default function Card() {
  const { id } = useParams<{ id: string }>();
  const [w, setW] = useState<any>(null); const [img, setImg] = useState(""); const [qr, setQr] = useState(""); const [err, setErr] = useState("");
  useEffect(() => { (async () => {
    const { data, error } = await sb().from("workers").select("*,sites(name)").eq("id", id).single();
    if (error || !data) return setErr("Worker nahi mila (login karo)"); setW(data);
    if (data.photo_path) { const s = await sb().storage.from("worker-photos").createSignedUrl(data.photo_path, 3600); setImg(s.data?.signedUrl ?? ""); }
    setQr(await QRCode.toDataURL(location.origin + "/verify/" + id, { width: 200, margin: 1 })); })(); }, [id]);
  async function png() {
    const L = (s: string) => new Promise<HTMLImageElement>((r, j) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => r(i); i.onerror = j; i.src = s; });
    const c = document.createElement("canvas"); c.width = 640; c.height = 960; const x = c.getContext("2d")!;
    x.fillStyle = "#fff"; x.fillRect(0, 0, 640, 960); x.fillStyle = "#4f46e5"; x.fillRect(0, 0, 640, 90);
    x.fillStyle = "#fff"; x.font = "bold 30px sans-serif"; x.textAlign = "center"; x.fillText(`${w.sites?.name ?? "SITE"} · GATE PASS`, 320, 57);
    if (img) { try { x.drawImage(await L(img), 235, 120, 170, 200); } catch {} }
    x.fillStyle = "#111"; x.font = "bold 38px sans-serif"; x.fillText(w.name, 320, 380);
    x.font = "28px sans-serif"; x.fillText(w.trade || "", 320, 425); x.font = "bold 34px sans-serif"; x.fillText(w.emp_code, 320, 480);
    x.font = "28px sans-serif"; x.fillText("Blood: " + (w.blood_group || "-"), 320, 530);
    x.fillText("Emergency: " + (w.emergency_name || "-") + " " + (w.emergency_phone || ""), 320, 575);
    x.drawImage(await L(qr), 220, 620, 200, 200);
    const a = document.createElement("a"); a.download = w.emp_code + ".png"; a.href = c.toDataURL("image/png"); a.click();
  }
  if (err) return <p className="muted">{err}</p>; if (!w) return <p className="muted">Load ho raha hai...</p>;
  return (<div><div className="idc"><div className="idh">{w.sites?.name ?? "SITE"} · GATE PASS</div>
    <div className="idb">{img && <img className="ph" src={img} alt="" />}<h3 style={{ margin: "8px 0 0" }}>{w.name}</h3><p className="muted">{w.trade}</p>
      <p><b>{w.emp_code}</b></p><p>🩸 {w.blood_group || "-"}</p><p>🚨 {w.emergency_name || "-"} · {w.emergency_phone || "-"}</p>{qr && <img src={qr} alt="QR" width={120} />}</div></div>
    <button className="noprint" onClick={png}>PNG download</button><button className="noprint sec" onClick={() => window.print()}>Print / PDF save</button></div>);
}
