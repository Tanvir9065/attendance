import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
const svc = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const bad = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s });
async function guard(req: Request) {
  const a = svc(); const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data } = await a.auth.getUser(token); if (!data.user) return null;
  const { data: p } = await a.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  return p?.role === "admin" ? { a, uid: data.user.id } : null;
}
export async function POST(req: Request) {
  const g = await guard(req); if (!g) return bad("Not allowed", 403); const { a } = g;
  const { email, password, name, siteIds = [], siteName } = await req.json();
  if (!name || !email || !password || String(password).length < 6) return bad("Name, email and a password of at least 6 characters are required.");
  const { data, error } = await a.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) return bad(error?.message ?? "Could not create user.");
  const uid = data.user.id; const ids: string[] = [...siteIds];
  if (siteName) { const s = await a.from("sites").insert({ name: siteName }).select("id").single(); if (s.data) ids.push(s.data.id); }
  await a.from("profiles").insert({ id: uid, role: "manager", name, email });
  if (ids.length) await a.from("user_sites").insert(ids.map((site_id) => ({ user_id: uid, site_id })));
  return NextResponse.json({ ok: true });
}
export async function PATCH(req: Request) {
  const g = await guard(req); if (!g) return bad("Not allowed", 403);
  const { id, password } = await req.json(); if (!id || String(password || "").length < 6) return bad("Password must be at least 6 characters.");
  const { error } = await g.a.auth.admin.updateUserById(id, { password }); return error ? bad(error.message) : NextResponse.json({ ok: true });
}
export async function DELETE(req: Request) {
  const g = await guard(req); if (!g) return bad("Not allowed", 403);
  const { id } = await req.json(); if (!id || id === g.uid) return bad("You cannot remove your own account.");
  const { data: t } = await g.a.from("profiles").select("role").eq("id", id).maybeSingle(); if (t?.role === "admin") return bad("Admin accounts cannot be removed here.");
  const { error } = await g.a.auth.admin.deleteUser(id); return error ? bad(error.message) : NextResponse.json({ ok: true });
}
