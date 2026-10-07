"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
type W = { id: string; name: string; emp_code: string; trade: string | null; active: boolean; photo_path: string | null; sites: { name: string } | null };
export default function Workers() {
  const [w, setW] = useState<W[]>([]);
  useEffect(() => { sb().from("workers").select("id,name,emp_code,trade,active,photo_path,sites(name)").order("created_at", { ascending: false }).then(({ data }) => setW((data as unknown as W[]) ?? [])); }, []);
  return (<div><h2>Workers ({w.length})</h2>{w.map((x) => (<div className="card" key={x.id}>
    <div className="row"><b>{x.name}</b><span className={"badge " + (x.active ? "" : "bad")}>{x.active ? "ACTIVE" : "BLOCKED"}</span></div>
    <p className="muted">{x.emp_code} · {x.trade ?? "-"} · {x.sites?.name ?? "no site"}{!x.photo_path || !x.sites ? " · ⚠️ site/photo baaki" : ""}</p>
    <div className="row"><a className="btn sec" href={"/workers/" + x.id}>Edit</a><a className="btn sec" href={"/card/" + x.id}>ID card</a></div></div>))}</div>);
}
