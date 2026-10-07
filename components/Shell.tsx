"use client";
import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { sb } from "@/lib/supabase";
import { AuthCtx, Me } from "./Auth";
import Nav from "./Nav";
const CREDIT = "Attendance system for site teams";
export default function Shell({ children }: { children: ReactNode }) {
  const [s, setS] = useState<"load" | "out" | "in">("load"); const [me, setMe] = useState<Me | null>(null); const [noacc, setNoacc] = useState(false); const p = usePathname();
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    try { setEmail(localStorage.getItem("att_email") || ""); } catch {}
    const init = async (ses: Session | null) => {
      if (!ses) { setS("out"); setMe(null); setNoacc(false); return; }
      const { data } = await sb().from("profiles").select("role,name").eq("id", ses.user.id).maybeSingle();
      if (data) { setMe(data as Me); setNoacc(false); } else { setMe(null); setNoacc(true); } setS("in");
    };
    sb().auth.getSession().then(({ data }) => init(data.session));
    const { data: l } = sb().auth.onAuthStateChange((_e, ses) => { setTimeout(() => init(ses), 0); });
    return () => l.subscription.unsubscribe();
  }, []);
  async function login() {
    if (!email || !pw) return setMsg("Enter your email and password.");
    setBusy(true); setMsg(""); const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password: pw });
    if (error) setMsg(/invalid/i.test(error.message) ? "Incorrect email or password." : error.message); else { try { localStorage.setItem("att_email", email.trim()); } catch {} }
    setBusy(false);
  }
  const out = () => sb().auth.signOut();
  if (s === "load" || (s === "in" && !me && !noacc)) return <div className="login"><p className="muted">Loading...</p></div>;
  if (s === "out") return (<div className="login"><div className="lbox"><h1 className="h1">Attendance</h1><p className="muted" style={{ marginBottom: 18 }}>Sign in to continue.</p>
    <input placeholder="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
    <input placeholder="Password" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} />
    {msg && <p className="err">{msg}</p>}<button className="lg" disabled={busy} onClick={login}>{busy ? "Signing in..." : "Sign in"}</button><p className="credit">{CREDIT}</p></div></div>);
  if (noacc || !me) return (<div className="login"><div className="lbox"><h1 className="h1">No access yet</h1><p className="muted" style={{ marginBottom: 18 }}>This account has no role. Ask the admin to set it up.</p><button className="lg sec" onClick={out}>Sign out</button></div></div>);
  return (<AuthCtx.Provider value={me}><header className="top"><div className="topin"><div className="tb"><b className="brand">Attendance</b><button className="lnk" onClick={out}>Sign out</button></div><Nav /></div></header>
    <main className={"wrap" + (p === "/" ? " hasbar" : "")}>{children}</main></AuthCtx.Provider>);
}
