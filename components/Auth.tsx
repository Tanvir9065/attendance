"use client";
import { createContext, useContext } from "react";
export type Me = { role: "admin" | "manager"; name: string | null };
export const AuthCtx = createContext<Me>({ role: "manager", name: null });
export const useMe = () => useContext(AuthCtx);
