"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
export default function Home() {
  const [user, setUser] = useState<string | null>(null);
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [msg, setMsg] = useState("");
  useEffect(() => { sb().auth.getSession().then(({ data }) => setUser(data.session?.user.email ?? null)); }, []);
  async function login() {
    const { data, error } = await sb().auth.signInWithPassword({ email, password: pw });
    if (error) setMsg(error.message); else setUser(data.user.email ?? "ok");
  }
  if (!user) return (<div className="card"><h2>Admin Login</h2>
    <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
    <input placeholder="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
    <button onClick={login}>Login</button><p className="muted">{msg}</p></div>);
  return (<div className="card"><h2>Welcome 👋</h2><p className="muted">{user}</p>
    <a className="btn" href="/checkin">Check-in / Check-out</a><a className="btn sec" href="/register">Naya worker register</a>
    <a className="btn sec" href="/sites">Sites</a>
    <button className="sec" onClick={async () => { await sb().auth.signOut(); setUser(null); }}>Logout</button></div>);
}
