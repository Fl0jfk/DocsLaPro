import { NextRequest, NextResponse } from "next/server";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET, VoyageEntry } from "@/app/utils/voyageStore";
import { currentUser } from "@clerk/nextjs/server";

function normalizeRoles(role: unknown): string[] {
  if (Array.isArray(role)) return role as string[];
  if (typeof role === "string") return [role];
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const url = new URL(req.url);
    const voyageId = url.searchParams.get("voyageId");
    if (!voyageId) {
      return NextResponse.json({ error: "voyageId manquant" }, { status: 400 });
    }
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: "travels/",
      })
    );
    const normalizedRoles = normalizeRoles(user.publicMetadata?.role);
    let foundVoyage: VoyageEntry | null = null;
    for (const obj of list.Contents || []) {
      if (!obj.Key?.endsWith("voyage.json")) continue;
      const data = await s3.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: obj.Key })
      );
      const body = await data.Body?.transformToString();
      if (!body) continue;
      const voyage: VoyageEntry = JSON.parse(body);
      if (voyage.id === voyageId) {
        const isCreator = voyage.email === user.primaryEmailAddress?.emailAddress;
        const canAccess =
          isCreator ||
          normalizedRoles.includes("compta") ||
          normalizedRoles.includes(voyage.direction_cible);
        if (!canAccess) {
          return NextResponse.json(
            { error: "Accès refusé à ce voyage" },
            { status: 403 }
          );
        }
        foundVoyage = voyage;
        break;
      }
    }
    if (!foundVoyage) {
      return NextResponse.json(
        { error: "Voyage introuvable" },
        { status: 404 }
      );
    }
    return NextResponse.json({ voyage: foundVoyage });
  } catch (err) {
    console.error("Erreur GET /api/travels/get:", err);
    return NextResponse.json(
      { error: "Impossible de récupérer le voyage" },
      { status: 500 }
    );
  }
}
