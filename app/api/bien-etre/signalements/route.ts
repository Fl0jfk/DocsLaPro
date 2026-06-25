import { NextResponse } from "next/server";
import { requireBienEtreReferentAuth } from "@/app/lib/bien-etre-auth";
import {
  getSignalement,
  listSignalements,
  purgeExpiredSignalements,
  updateSignalementStatus,
} from "@/app/lib/bien-etre-storage";
import type { BienEtreSignalementStatus } from "@/app/lib/bien-etre-types";

export async function GET(req: Request) {
  const gate = await requireBienEtreReferentAuth();
  if (!gate.ok) return gate.response;

  await purgeExpiredSignalements();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();
  if (id) {
    const record = await getSignalement(id);
    if (!record) return NextResponse.json({ error: "Signalement introuvable." }, { status: 404 });
    return NextResponse.json({ signalement: record });
  }
  const items = await listSignalements();
  return NextResponse.json({ items });
}

export async function PATCH(req: Request) {
  const gate = await requireBienEtreReferentAuth();
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json();
    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "id requis." }, { status: 400 });

    const status = body.status as BienEtreSignalementStatus | undefined;
    const allowed: BienEtreSignalementStatus[] = ["nouveau", "en_cours", "cloture"];
    if (status && !allowed.includes(status)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }

    const updated = await updateSignalementStatus(id, {
      status,
      referentNote: body.referentNote !== undefined ? String(body.referentNote) : undefined,
    });
    if (!updated) return NextResponse.json({ error: "Signalement introuvable." }, { status: 404 });
    return NextResponse.json({ signalement: updated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
