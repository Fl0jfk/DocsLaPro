import { safeCurrentUser } from "@/app/lib/intranet-session";
import { NextResponse } from "next/server";

import { requireAuth } from "@/app/lib/intranet-auth";
import {
  assertEligibleRequestAttachment,
  assistanceScopeLabel,
  getAssistanceScopeOptions,
  isValidAssistanceScope,
  MAX_REQUEST_ATTACHMENTS_PER_UPLOAD,
  newAssistanceTicketId,
  sendAssistanceTicketEmails,
} from "@/app/lib/assistance";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  return NextResponse.json({ options: getAssistanceScopeOptions() });
}

export async function POST(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const user = await safeCurrentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress?.trim() || "";
  const userName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    userEmail ||
    "Utilisateur";

  if (!userEmail) {
    return NextResponse.json(
      { error: "Votre compte doit avoir une adresse e-mail pour envoyer une demande d'assistance." },
      { status: 400 },
    );
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Format multipart attendu." }, { status: 400 });
  }

  const form = await req.formData();
  const scopeId = String(form.get("scope") || "").trim();
  const description = String(form.get("description") || "").trim();

  if (!isValidAssistanceScope(scopeId)) {
    return NextResponse.json({ error: "Veuillez choisir une zone concernée." }, { status: 400 });
  }

  if (description.length < 15) {
    return NextResponse.json(
      { error: "Décrivez le problème en au moins 15 caractères." },
      { status: 400 },
    );
  }

  if (description.length > 12_000) {
    return NextResponse.json({ error: "Description trop longue (12 000 caractères max)." }, { status: 400 });
  }

  const rawFiles = form.getAll("files").filter((x): x is File => x instanceof File && x.size > 0);
  if (rawFiles.length > MAX_REQUEST_ATTACHMENTS_PER_UPLOAD) {
    return NextResponse.json(
      { error: `Maximum ${MAX_REQUEST_ATTACHMENTS_PER_UPLOAD} fichiers par envoi.` },
      { status: 400 },
    );
  }

  const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
  for (const file of rawFiles) {
    const check = assertEligibleRequestAttachment(file.name, file.type, file.size);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    attachments.push({
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || "application/octet-stream",
    });
  }

  const ticketId = newAssistanceTicketId();
  const scopeLabel = assistanceScopeLabel(scopeId);

  try {
    await sendAssistanceTicketEmails({
      ticketId,
      scopeId,
      scopeLabel,
      description,
      userName,
      userEmail,
      attachments,
    });
  } catch (e) {
    console.error("[assistance]", e);
    const message = e instanceof Error ? e.message : "Envoi impossible.";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    ticketId,
    message: `Votre demande a été envoyée (réf. ${ticketId}). Un e-mail de confirmation vous a été adressé.`,
  });
}
