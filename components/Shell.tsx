"use client";
import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CalendarCheck, CalendarDays, User, LogOut } from "lucide-react";
import { sb } from "@/lib/supabase";
import Nav from "./Nav";
export default function Shell({ children }: { children: ReactNode }) {
  const [s, setS] = useState<"load" | "out" | "in">("load"); const p = usePathname(); const [mail, setMail] = useState(""); const [dt, setDt] = useState("");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    setDt(new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }));
    sb().auth.getSession().then(({ data }) => { setS(data.session ? "in" : "out"); setMail(data.session?.user.email ?? ""); });
    const { data: l } = sb().auth.onAuthStateChange((_e, ses) => { setS(ses ? "in" : "out"); setMail(ses?.user.email ?? ""); });
    return () => l.subscription.unsubscribe();
  }, []);
  async function login() {
    setBusy(true); setMsg(""); const { error } = await sb().auth.signInWithPassword({ email, password: pw });
    if (error) setMsg(error.message); setBusy(false);
  }
  const out = () => sb().auth.signOut();
  if (s === "load") return <div className="login"><p style={{ color: "#fff" }}>Loading...</p></div>;
  if (s === "out") return (<div className="login"><div className="card">
    <div className="logo"><CalendarCheck size={30} /></div><h2 style={{ margin: "4px 0" }}>Attendance System</h2><p className="muted">Sign in to continue</p>
    <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    <input placeholder="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} />
    <button disabled={busy} onClick={login}>{busy ? "Please wait..." : "Login"}</button>{msg && <p className="status">{msg}</p>}</div></div>);
  return (<div className="app"><aside><div className="brand"><CalendarCheck size={26} /> Attendance System</div><Nav />
    <button className="out" onClick={out}><LogOut size={18} /> Logout</button></aside>
    <div className="main"><header className="top"><b className="mbrand"><span className="lg"><CalendarCheck size={18} /></span>Attendance</b>
      <span className="hr"><span className="dt"><CalendarDays size={16} /> {dt}</span><span className="who"><span className="avt"><User size={18} /></span> {mail}</span>
        <button className="ib topout" aria-label="Logout" onClick={out}><LogOut size={18} /></button></span></header>
      <main className={"wrap" + (p === "/" ? " wide" : "")}>{children}</main></div></div>);
}
