import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getTenantDataS3Client } from "@/app/lib/s3-clients";
import { normalizeRequestEmail } from "@/app/lib/requests-board";
import { findRequestAttachment, getRequestsIndex } from "@/app/lib/requests";
import { canAccessRequestsStaffBoard } from "@/app/lib/requests-staff-access";
import { getBucketName } from "@/app/lib/s3-storage";

export async function GET(req: NextRequest) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { userId } = gate.ctx;
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const roleRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(roleRaw) ? roleRaw.map(String) : roleRaw ? [String(roleRaw)] : [];
  const requestId = req.nextUrl.searchParams.get("requestId")?.trim() ?? "";
  const attachmentId = req.nextUrl.searchParams.get("attachmentId")?.trim() ?? "";
  if (!requestId || !attachmentId) {  return NextResponse.json({ error: "requestId et attachmentId requis" }, { status: 400 });}
  try {
    const index = await getRequestsIndex();
    const record = index.find((r) => r.id === requestId);
    if (!record) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    const att = findRequestAttachment(record, attachmentId);
    if (!att) return NextResponse.json({ error: "Pièce jointe introuvable" }, { status: 404 });
    const staff = canAccessRequestsStaffBoard(roles, userEmail);
    const isRequester = record.requester.userId === userId || (userEmail && normalizeRequestEmail(record.requester.email) === normalizeRequestEmail(userEmail));
    if (!staff && !isRequester) { return NextResponse.json({ error: "Accès refusé" }, { status: 403 })}
    const relOk = att.key.includes(`requests/${requestId}/files/`);
    if (!relOk) {
      return NextResponse.json({ error: "Clé invalide" }, { status: 400 });
    }
    const command = new GetObjectCommand({ Bucket: await getBucketName(), Key: att.key });
    const s3 = await getTenantDataS3Client();
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return NextResponse.json({ url, fileName: att.fileName, contentType: att.contentType });
  } catch (e) {
    console.error("attachment-url error:", e);
    return NextResponse.json({ error: "Erreur lien de téléchargement" }, { status: 500 });
  }
}