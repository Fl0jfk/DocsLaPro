import { NextResponse, NextRequest } from "next/server";
import { validateElevesJson } from "@/app/lib/eleves-config";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { getTenantJson, putTenantJson } from "@/app/lib/tenant-s3-storage";

const KEY = "eleves.json";

export async function GET(req: NextRequest) {
  try {
    const gate = await requireTenantAuth();
    if (!gate.ok) return gate.response;
    const hit = await getTenantJson<unknown[]>(gate.ctx.orgId, KEY);
    const eleves = Array.isArray(hit?.data) ? hit.data : [];
    return NextResponse.json({ count: eleves.length, eleves });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const gate = await requireTenantAuth();
    if (!gate.ok) return gate.response;
    const body = await req.json();
    const validated = validateElevesJson(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    await putTenantJson(gate.ctx.orgId, KEY, validated.data);
    return NextResponse.json({ success: true, count: validated.data.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
