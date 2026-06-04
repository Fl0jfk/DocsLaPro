import { NextRequest, NextResponse } from "next/server";
import { getTenantJson, putTenantJson } from "@/app/lib/tenant-s3-storage";
import { requireTenantAuth } from "@/app/lib/tenant-auth";

const FILE_KEY = "channels/channels.json";
const DEFAULT_CHANNELS = [{ id: "general", name: "Général", type: "public" }];

export async function GET() {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  try {
    const hit = await getTenantJson<unknown[]>(gate.ctx.orgId, FILE_KEY);
    const data = Array.isArray(hit?.data) ? hit.data : DEFAULT_CHANNELS;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur GET Channels:", error);
    return NextResponse.json(DEFAULT_CHANNELS);
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  try {
    const body = await req.json();
    const hit = await getTenantJson<unknown[]>(gate.ctx.orgId, FILE_KEY);
    const channels = Array.isArray(hit?.data) ? [...hit.data] : [...DEFAULT_CHANNELS];
    const newChan = {
      id: String(body.id || body.name || "").trim().toLowerCase().replace(/\s+/g, "-"),
      name: String(body.name || "Nouveau canal"),
      type: body.type || "public",
      members: body.members || [],
    };
    channels.push(newChan);
    await putTenantJson(gate.ctx.orgId, FILE_KEY, channels);
    return NextResponse.json(newChan);
  } catch (error) {
    console.error("Erreur POST Channels:", error);
    return NextResponse.json({ error: "Erreur création canal" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  try {
    const body = await req.json();
    const hit = await getTenantJson<unknown[]>(gate.ctx.orgId, FILE_KEY);
    const channels = Array.isArray(hit?.data) ? [...hit.data] : [...DEFAULT_CHANNELS];
    const idx = channels.findIndex((c: { id?: string }) => c.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Canal introuvable" }, { status: 404 });
    channels[idx] = { ...channels[idx], ...body };
    await putTenantJson(gate.ctx.orgId, FILE_KEY, channels);
    return NextResponse.json(channels[idx]);
  } catch (error) {
    return NextResponse.json({ error: "Erreur modification" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const hit = await getTenantJson<unknown[]>(gate.ctx.orgId, FILE_KEY);
    let channels = Array.isArray(hit?.data) ? [...hit.data] : [...DEFAULT_CHANNELS];
    channels = channels.filter((c: { id?: string }) => c.id !== id);
    await putTenantJson(gate.ctx.orgId, FILE_KEY, channels);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
