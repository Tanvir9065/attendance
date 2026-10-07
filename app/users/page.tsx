"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { useMe } from "@/components/Auth";
type U = { id: string; name: string | null; email: string | null; role: string; user_sites: { sites: { name: string } | null }[] };
type S = { id: string; name: string };
async function call(method: string, body: object) {
  const t = (await sb().auth.getSession()).data.session?.access_token;
  const r = await fetch("/api/users", { method, headers: { "Content-Type": "application/json", Authorization: "Bearer " + t }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || "Request failed"); return j;
}
export default function Users() {
  const me = useMe(); const [us, setUs] = useState<U[]>([]); const [sites, setSites] = useState<S[]>([]);
  const [f, setF] = useState({ name: "", email: "", password: "", siteName: "" }); const [pick, setPick] = useState<string[]>([]);
  const [msg, setMsg] = useState(""); const [ok, setOk] = useState(false); const [busy, setBusy] = useState(false);
  const load = async () => {
    const a = await sb().from("profiles").select("id,name,email,role,user_sites(sites(name))").order("created_at"); setUs((a.data as unknown as U[]) ?? []);
    const b = await sb().from("sites").select("id,name").order("name"); setSites(b.data ?? []);
  };
  useEffect(() => { if (me.role === "admin") load(); }, [me.role]);
  if (me.role !== "admin") return <p className="muted" style={{ padding: 16 }}>Only the admin can manage users.</p>;
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  async function add() {
    setMsg(""); setOk(false); setBusy(true);
    try { await call("POST", { ...f, siteIds: pick }); setOk(true); setMsg("User created."); setF({ name: "", email: "", password: "", siteName: "" }); setPick([]); load(); } catch (e) { setMsg((e as Error).message); }
    setBusy(false);
  }
  async function reset(u: U) { const pw = prompt("New password for " + (u.email || u.name) + " (minimum 6 characters)"); if (!pw) return;
    try { await call("PATCH", { id: u.id, password: pw }); setOk(true); setMsg("Password updated."); } catch (e) { setOk(false); setMsg((e as Error).message); } }
  async function del(u: U) { if (!confirm("Remove " + (u.email || u.name) + "? They will lose access.")) return;
    try { await call("DELETE", { id: u.id }); load(); } catch (e) { setOk(false); setMsg((e as Error).message); } }
  return (<div><h2>Users</h2>
    <div className="card"><b>Add site manager</b><p className="muted">Managers see and manage only their own sites.</p>
      <input placeholder="Name" value={f.name} onChange={set("name")} /><input placeholder="Email" type="email" value={f.email} onChange={set("email")} />
      <input placeholder="Password (min 6 characters)" value={f.password} onChange={set("password")} />
      <input placeholder="New site name (optional)" value={f.siteName} onChange={set("siteName")} />
      <p className="muted">A new site starts without a location. The manager sets it when they are at the site.</p>
      {sites.length > 0 && <p className="muted" style={{ marginTop: 10 }}>Or give access to existing sites:</p>}
      {sites.map((s) => (<label className="chk" key={s.id}><input type="checkbox" checked={pick.includes(s.id)} onChange={(e) => setPick(e.target.checked ? [...pick, s.id] : pick.filter((x) => x !== s.id))} />{s.name}</label>))}
      {msg && <p className={ok ? "okt" : "err"}>{msg}</p>}<button className="lg" disabled={busy} onClick={add}>{busy ? "Creating..." : "Create user"}</button></div>
    <div className="list">{us.map((u) => (<div className="er" key={u.id} style={{ alignItems: "flex-start" }}><div className="nm"><b>{u.name || u.email}</b>
      <small>{u.email} · {u.role === "admin" ? "Admin" : "Manager"}</small><small>{u.role === "admin" ? "All sites" : u.user_sites.map((x) => x.sites?.name).filter(Boolean).join(", ") || "No sites assigned"}</small></div>
      {u.role !== "admin" && <div style={{ display: "flex", gap: 6 }}><button className="sec" style={{ width: "auto", margin: 0 }} onClick={() => reset(u)}>Reset password</button><button className="danger" style={{ width: "auto", margin: 0 }} onClick={() => del(u)}>Remove</button></div>}</div>))}</div></div>);
}
