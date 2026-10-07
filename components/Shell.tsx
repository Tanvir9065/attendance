"use client";
import { useEffect, useState, ReactNode } from "react";
import { sb } from "@/lib/supabase";
import Nav from "./Nav";
export default function Shell({ children }: { children: ReactNode }) {
  const [s, setS] = useState<"load" | "out" | "in">("load");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    sb().auth.getSession().then(({ data }) => setS(data.session ? "in" : "out"));
    const { data: l } = sb().auth.onAuthStateChange((_e, ses) => setS(ses ? "in" : "out"));
    return () => l.subscription.unsubscribe();
  }, []);
  async function login() {
    setBusy(true); setMsg(""); const { error } = await sb().auth.signInWithPassword({ email, password: pw });
    if (error) setMsg(error.message); setBusy(false);
  }
  if (s === "load") return <div className="login"><p style={{ color: "#fff" }}>Loading...</p></div>;
  if (s === "out") return (<div className="login"><div className="card">
    <div style={{ fontSize: 40 }}>🏗️</div><h2 style={{ margin: "4px 0" }}>Site Attendance</h2><p className="muted">Sign in to continue</p>
    <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    <input placeholder="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} />
    <button disabled={busy} onClick={login}>{busy ? "Please wait..." : "Login"}</button>{msg && <p className="status">{msg}</p>}</div></div>);
  return (<><header className="top"><b>🏗️ Site Attendance</b><button className="ghost" onClick={() => sb().auth.signOut()}>Logout</button></header>
    <main className="wrap">{children}</main><Nav /></>);
}
