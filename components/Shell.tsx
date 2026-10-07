"use client";
import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { sb } from "@/lib/supabase";
import Nav from "./Nav";
const ADMIN = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
const CREDIT = "Attendance system for site teams";
export default function Shell({ children }: { children: ReactNode }) {
  const [s, setS] = useState<"load" | "out" | "in">("load"); const p = usePathname();
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    sb().auth.getSession().then(({ data }) => setS(data.session ? "in" : "out"));
    const { data: l } = sb().auth.onAuthStateChange((_e, ses) => setS(ses ? "in" : "out"));
    return () => l.subscription.unsubscribe();
  }, []);
  async function login() {
    if (!pw) return setMsg("Enter your password.");
    setBusy(true); setMsg(""); const { error } = await sb().auth.signInWithPassword({ email: ADMIN || email, password: pw });
    if (error) setMsg(/invalid/i.test(error.message) ? "Incorrect password." : error.message); setBusy(false);
  }
  if (s === "load") return <div className="login"><p className="muted">Loading...</p></div>;
  if (s === "out") return (<div className="login"><div className="lbox"><h1 className="h1">Attendance</h1><p className="muted" style={{ marginBottom: 18 }}>Enter your password to continue.</p>
    {!ADMIN && <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
    <input placeholder="Password" type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} />
    {msg && <p className="err">{msg}</p>}<button className="lg" disabled={busy} onClick={login}>{busy ? "Signing in..." : "Sign in"}</button><p className="credit">{CREDIT}</p></div></div>);
  return (<div><header className="top"><div className="topin"><div className="tb"><b className="brand">Attendance</b><button className="lnk" onClick={() => sb().auth.signOut()}>Sign out</button></div><Nav /></div></header>
    <main className={"wrap" + (p === "/" ? " hasbar" : "")}>{children}</main></div>);
}
