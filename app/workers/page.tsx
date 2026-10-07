"use client";
import { useEffect, useState } from "react";
import { UserPlus, QrCode, Search, Pencil } from "lucide-react";
import { sb } from "@/lib/supabase";
type W = { id: string; name: string; emp_code: string; trade: string | null; active: boolean; photo_path: string | null; sites: { name: string } | null };
const COL = ["#2563eb", "#7c3aed", "#f97316", "#16a34a", "#db2777", "#0891b2", "#64748b"];
const col = (n: string) => COL[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % COL.length];
export default function Workers() {
  const [w, setW] = useState<W[]>([]); const [q, setQ] = useState("");
  useEffect(() => { sb().from("workers").select("id,name,emp_code,trade,active,photo_path,sites(name)").order("created_at", { ascending: false }).then(({ data }) => setW((data as unknown as W[]) ?? [])); }, []);
  const f = w.filter((x) => (x.name + x.emp_code).toLowerCase().includes(q.toLowerCase()));
  return (<div><div className="row pt"><h2 style={{ margin: 0 }}>Workers <span className="muted">({w.length})</span></h2><a className="add" href="/register"><UserPlus size={18} />Add</a></div>
    <div className="sbox"><Search size={16} /><input placeholder="Search name or ID" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <div className="card" style={{ padding: "4px 14px" }}>{f.map((x) => (<div className="li" key={x.id}><a className="lk" href={"/workers/" + x.id}>
      <span className="av" style={{ background: col(x.name) }}>{x.name.slice(0, 1).toUpperCase()}</span><span className="nm"><b>{x.name}</b>
        <small>{x.emp_code} · {x.trade ?? "No trade"} · {x.sites?.name ?? "No site"}{!x.photo_path || !x.sites ? " · Incomplete" : ""}</small></span></a>
      <span className={"badge " + (x.active ? "" : "bad")}>{x.active ? "Active" : "Blocked"}</span><a className="ib" href={"/workers/" + x.id} aria-label="Edit worker"><Pencil size={18} /></a><a className="ib" href={"/card/" + x.id} aria-label="ID card"><QrCode size={18} /></a></div>))}
      {!f.length && <p className="muted" style={{ padding: 12 }}>No workers found.</p>}</div></div>);
}
