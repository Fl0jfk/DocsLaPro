import { NextResponse, NextRequest } from "next/server";
import { validateElevesJson } from "@/app/lib/eleves-config";
import { requireAdmin, requireAuth } from "@/app/lib/intranet-auth";
import {
  countElevesRegistry,
  loadElevesRegistry,
  saveElevesRegistry,
} from "@/app/lib/eleves-registry";

export async function GET(req: NextRequest) {
  try {
    const gate = await requireAuth();
    if (!gate.ok) return gate.response;
    const eleves = await loadElevesRegistry();
    return NextResponse.json({ count: eleves.length, eleves });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.response;
    const body = await req.json();
    const validated = validateElevesJson(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    await saveElevesRegistry(validated.eleves);
    return NextResponse.json({
      success: true,
      count: validated.eleves.length,
      message: `Liste mise à jour (${validated.eleves.length} élèves).`,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
