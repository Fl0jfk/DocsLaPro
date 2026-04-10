import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { normalizeRequestEmail } from "@/app/lib/requests-board";
import { findRequestAttachment, getRequestsIndex } from "@/app/lib/requests";
import { canAccessRequestsStaffBoard } from "@/app/lib/requests-staff-access";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const roleRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(roleRaw) ? roleRaw.map(String) : roleRaw ? [String(roleRaw)] : [];

  const requestId = req.nextUrl.searchParams.get("requestId")?.trim() ?? "";
  const attachmentId = req.nextUrl.searchParams.get("attachmentId")?.trim() ?? "";
  if (!requestId || !attachmentId) {
    return NextResponse.json({ error: "requestId et attachmentId requis" }, { status: 400 });
  }

  try {
    const index = await getRequestsIndex();
    const record = index.find((r) => r.id === requestId);
    if (!record) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

    const att = findRequestAttachment(record, attachmentId);
    if (!att) return NextResponse.json({ error: "Pièce jointe introuvable" }, { status: 404 });

    const staff = canAccessRequestsStaffBoard(roles, userEmail);
    const isRequester =
      record.requester.userId === userId ||
      (userEmail && normalizeRequestEmail(record.requester.email) === normalizeRequestEmail(userEmail));
    if (!staff && !isRequester) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    if (!att.key.startsWith(`requests/${requestId}/files/`)) {
      return NextResponse.json({ error: "Clé invalide" }, { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: att.key,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return NextResponse.json({ url, fileName: att.fileName, contentType: att.contentType });
  } catch (e) {
    console.error("attachment-url error:", e);
    return NextResponse.json({ error: "Erreur lien de téléchargement" }, { status: 500 });
  }
}
