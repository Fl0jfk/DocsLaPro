import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl, BUCKET } from "@/app/utils/voyageStore";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const body = await req.json();
    const { voyageId, filename, type } = body;
    if (!voyageId || !filename || !type) {
      return NextResponse.json(
        { error: "Paramètres manquants : voyageId, filename ou type" },
        { status: 400 }
      );
    }
    const result = await getPresignedUploadUrl(voyageId, filename, type);
    const publicUrl = `https://${BUCKET}.s3.amazonaws.com/${result.key}`;
    return NextResponse.json({ ...result, publicUrl });
  } catch (error) {
    console.error("Erreur presign-upload:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du lien présigné" },
      { status: 500 }
    );
  }
}
