// app/api/travels/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { s3, BUCKET, VoyageEntry } from "@/app/utils/voyageStore";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { currentUser } from "@clerk/nextjs/server";

function normalizeRoles(role: unknown): string[] {
  if (Array.isArray(role)) return role as string[];
  if (typeof role === "string") return [role];
  return [];
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const { voyageId } = Object.fromEntries(new URL(req.url).searchParams) as { voyageId: string };
    if (!voyageId) return NextResponse.json({ error: "voyageId manquant" }, { status: 400 });
    const roles = normalizeRoles(user.publicMetadata?.role);
    const body = await req.json();
    const key = `travels/${user.id}/${voyageId}/voyage.json`;
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const oldBody = await obj.Body?.transformToString();
    if (!oldBody) return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
    const voyage: VoyageEntry = JSON.parse(oldBody);
    const canEdit =
      voyage.email === user.primaryEmailAddress?.emailAddress ||
      roles.includes("compta") ||
      roles.includes(voyage.direction_cible);
    if (!canEdit) return NextResponse.json({ error: "Pas la permission de modifier ce voyage" }, { status: 403 });
    const updatedVoyage: VoyageEntry = {
      ...voyage,
      lieu: body.lieu ?? voyage.lieu,
      activite: body.activite ?? voyage.activite,
      date_depart: body.date_depart ?? voyage.date_depart,
      date_retour: body.date_retour ?? voyage.date_retour,
      classes: body.classes ?? voyage.classes,
      effectif_eleves: body.effectif_eleves ?? voyage.effectif_eleves,
      effectif_accompagnateurs: body.effectif_accompagnateurs ?? voyage.effectif_accompagnateurs,
      commentaire: body.commentaire ?? voyage.commentaire,
      pieces_jointes: body.pieces_jointes ?? voyage.pieces_jointes, // <-- IMPORTANT
    };
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: JSON.stringify(updatedVoyage, null, 2),
        ContentType: "application/json",
      })
    );
    return NextResponse.json({ success: true, message: "Voyage mis à jour avec succès." });
  } catch (err) {
    console.error("Erreur update voyage :", err);
    return NextResponse.json({ error: "Impossible de mettre à jour le voyage" }, { status: 500 });
  }
}
