"use client";
import { User, Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { sb } from "@/lib/supabase";
export default function Card() {
  const { id } = useParams<{ id: string }>();
  const [w, setW] = useState<any>(null); const [img, setImg] = useState(""); const [qr, setQr] = useState(""); const [err, setErr] = useState("");
  useEffect(() => { (async () => {
    const { data, error } = await sb().from("workers").select("*,sites(name)").eq("id", id).single();
    if (error || !data) return setErr("Worker not found"); setW(data);
    if (data.photo_path) { const s = await sb().storage.from("worker-photos").createSignedUrl(data.photo_path, 3600); setImg(s.data?.signedUrl ?? ""); }
    setQr(await QRCode.toDataURL(location.origin + "/verify/" + id, { width: 300, margin: 1 })); })(); }, [id]);
  async function png() {
    const L = (s: string) => new Promise<HTMLImageElement>((r, j) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => r(i); i.onerror = j; i.src = s; });
    const c = document.createElement("canvas"); c.width = 640; c.height = 1016; const x = c.getContext("2d")!;
    const rr = (a: number, b: number, W: number, H: number, r: number) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + W, b, a + W, b + H, r); x.arcTo(a + W, b + H, a, b + H, r); x.arcTo(a, b + H, a, b, r); x.arcTo(a, b, a + W, b, r); x.closePath(); };
    x.fillStyle = "#fff"; rr(0, 0, 640, 1016, 40); x.fill(); x.save(); x.clip();
    const g = x.createLinearGradient(0, 0, 640, 270); g.addColorStop(0, "#4f46e5"); g.addColorStop(1, "#7c3aed"); x.fillStyle = g; x.fillRect(0, 0, 640, 270);
    x.textAlign = "center"; x.fillStyle = "#fff"; x.font = "600 22px sans-serif"; x.fillText("G A T E   P A S S", 320, 60);
    x.font = "bold 40px sans-serif"; x.fillText((w.sites?.name ?? "SITE").toUpperCase(), 320, 115);
    rr(212, 160, 216, 256, 30); x.fill(); x.save(); rr(220, 168, 200, 240, 24); x.clip(); x.fillStyle = "#eef2ff"; x.fillRect(220, 168, 200, 240);
    if (img) { try { const im = await L(img); const s = Math.max(200 / im.width, 240 / im.height); const sw = 200 / s, sh = 240 / s; x.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, 220, 168, 200, 240); } catch {} }
    x.restore(); x.fillStyle = "#0f172a"; x.font = "bold 42px sans-serif"; x.fillText(w.name, 320, 490);
    x.fillStyle = "#64748b"; x.font = "26px sans-serif"; x.fillText(w.trade || "", 320, 530);
    x.fillStyle = "#eef2ff"; rr(190, 556, 260, 56, 28); x.fill(); x.fillStyle = "#4f46e5"; x.font = "bold 30px sans-serif"; x.fillText(w.emp_code, 320, 594);
    x.fillStyle = "#64748b"; x.font = "600 16px sans-serif"; x.fillText("BLOOD GROUP", 170, 665); x.fillText("EMERGENCY", 450, 665);
    x.fillStyle = "#0f172a"; x.font = "bold 30px sans-serif"; x.fillText(w.blood_group || "-", 170, 705);
    x.font = "bold 26px sans-serif"; x.fillText(w.emergency_name || "-", 450, 705); x.fillStyle = "#64748b"; x.font = "22px sans-serif"; x.fillText(w.emergency_phone || "", 450, 738);
    x.drawImage(await L(qr), 220, 765, 200, 200); x.font = "18px sans-serif"; x.fillText("Scan to verify", 320, 998); x.restore();
    const a = document.createElement("a"); a.download = w.emp_code + ".png"; a.href = c.toDataURL("image/png"); a.click();
  }
  if (err) return <p className="muted">{err}</p>; if (!w) return <p className="muted">Loading...</p>;
  return (<div><div className="idc"><div className="idh"><small>GATE PASS</small><b>{w.sites?.name ?? "SITE"}</b></div>
    <div className="idph">{img ? <img src={img} alt="" /> : <User size={44} color="#6366f1" />}</div><h3>{w.name}</h3><p className="muted">{w.trade}</p><span className="chip">{w.emp_code}</span>
    <div className="idg"><div><small>BLOOD GROUP</small><b>{w.blood_group || "-"}</b></div><div><small>EMERGENCY</small><b>{w.emergency_name || "-"}</b><span>{w.emergency_phone}</span></div></div>
    {qr && <img src={qr} alt="QR" />}<small>Scan to verify</small></div>
    <button className="noprint" onClick={png}><Download size={18} className="i" />Download PNG</button><button className="noprint sec" onClick={() => window.print()}><Printer size={18} className="i" />Print / PDF</button></div>);
}
