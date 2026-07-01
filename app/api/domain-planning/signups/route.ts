import { NextResponse } from "next/server";
import { loadSignups } from "@/app/lib/domain-planning-storage";
import { requireAuth } from "@/app/lib/intranet-auth";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const signups = await loadSignups();
  return NextResponse.json({ signups });
}
