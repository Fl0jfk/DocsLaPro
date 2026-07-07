import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearParentSessionCookieOptions } from "@/app/lib/class-allocation-parent-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearParentSessionCookieOptions());
  return res;
}
