// app/api/travels/updateStatus/route.ts
import { NextRequest, NextResponse } from "next/server";
import { s3, BUCKET } from "@/app/utils/voyageStore";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { currentUser } from "@clerk/nextjs/server";

type VoyageStatus =
  | "draft"
  | "direction_validation"
  | "requests_stage"
  | "compta_validation"
  | "final_validation"
  | "validated"
  | "rejected";

type Voyage = {
  id: string;
  lieu: string;
  activite: string;
  date_depart: string;
  date_retour: string;
  classes: string;
  effectif_eleves: number;
  effectif_accompagnateurs: number;
  commentaire?: string;
  pieces_jointes?: { filename: string; url: string }[];
  status: VoyageStatus;
};

const allowedTransitions: Record<VoyageStatus, VoyageStatus[]> = {
  draft: ["direction_validation"],
  direction_validation: ["requests_stage", "rejected"],
  requests_stage: ["compta_validation"],
  compta_validation: ["final_validation"],
  final_validation: ["validated"],
  validated: [],
  rejected: [],
};

const rolePermissions: Record<string, VoyageStatus[]> = {
  prof: ["draft", "requests_stage"],
  direction: ["direction_validation", "final_validation"],
  compta: ["compta_validation"],
};

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { voyageId, newStatus } = (await req.json()) as {
      voyageId: string;
      newStatus: VoyageStatus;
    };

    const role = user.publicMetadata?.role as string | undefined;
    if (!role) {
      return NextResponse.json({ error: "Rôle utilisateur manquant" }, { status: 400 });
    }

    // 📦 Lecture du fichier JSON sur S3
    const key = `travels/${user.id}/${voyageId}/voyage.json`;
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const oldBody = await obj.Body?.transformToString();
    if (!oldBody) {
      return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
    }

    const voyage: Voyage = JSON.parse(oldBody);

    // 🔒 Vérif : rôle autorisé à agir sur ce statut ?
    if (!rolePermissions[role]?.includes(voyage.status)) {
      return NextResponse.json(
        { error: "Accès refusé à cette étape" },
        { status: 403 }
      );
    }

    // 🔄 Vérif : transition valide ?
    if (!allowedTransitions[voyage.status]?.includes(newStatus)) {
      return NextResponse.json(
        { error: "Transition non autorisée" },
        { status: 400 }
      );
    }

    // ✅ Mise à jour du statut
    voyage.status = newStatus;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: JSON.stringify(voyage, null, 2),
        ContentType: "application/json",
      })
    );

    return NextResponse.json({ success: true, newStatus });
  } catch (err) {
    console.error("Erreur updateStatus:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
