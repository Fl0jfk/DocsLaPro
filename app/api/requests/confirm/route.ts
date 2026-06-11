import { NextRequest, NextResponse } from "next/server";
import { copyPendingFileToRequest, deletePendingRequestPrefix,loadPendingRequestMeta,} from "@/app/lib/request-pending-verify";
import { RequestRecord, getPublicAppBaseUrl, getRequestsIndex, notifyRequestCreated, resolveRequestRouting, saveRequestFile, saveRequestsIndex,} from "@/app/lib/requests";

export const runtime = "nodejs";

function redirectToMerci(req: NextRequest, query: Record<string, string>) {
  const base = getPublicAppBaseUrl() || new URL(req.url).origin;
  const u = new URL("/demande/merci", base);
  for (const [k, v] of Object.entries(query)) { u.searchParams.set(k, v)}
  return NextResponse.redirect(u);
}
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim() ?? "";
  try {
    const meta = await loadPendingRequestMeta(token);
    if (!meta) { return redirectToMerci(req, { erreur: "lien_invalide" })}
    if (new Date(meta.expiresAt).getTime() < Date.now()) {
      await deletePendingRequestPrefix(token);
      return redirectToMerci(req, { erreur: "lien_expire" });
    }
    const routing = await resolveRequestRouting(meta.subject, meta.description);
    const now = new Date().toISOString();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const attachments: NonNullable<RequestRecord["attachments"]> = [];
    for (let i = 0; i < meta.attachmentKeys.length; i++) {
      const key = meta.attachmentKeys[i]!;
      const m = meta.attachmentMeta[i]!;
      const copied = await copyPendingFileToRequest(  key, id, m.id, m.fileName, m.contentType, m.size, m.uploadedAt);
      attachments.push(copied);
    }
    const record: RequestRecord = {
      id,
      createdAt: now,
      updatedAt: now,
      status: "NOUVELLE",
      category: routing.category,
      subject: meta.subject,
      description: meta.description,
      requester: {
        firstName: meta.firstName,
        lastName: meta.lastName,
        fullName: `${meta.firstName} ${meta.lastName}`,
        email: meta.email,
        phone: meta.phone,
        userId: null,
      },
      assignedTo: routing.assignedTo,
      routing: {
        source: routing.source,
        confidence: routing.confidence,
        reason: routing.reason,
        ...(routing.suggestedRouteId ? { suggestedRouteId: routing.suggestedRouteId } : {}),
      },
      ...(attachments.length > 0 ? { attachments } : {}),
      comments: [],
      history: [
        {
          at: now,
          by: `${meta.firstName} ${meta.lastName}`,
          action: "CREATION",
          note: `Demande créée après confirmation e-mail — route ${routing.assignedTo.routeId ?? routing.assignedTo.unit} (${routing.assignedTo.roleLabel}).${attachments.length ? ` ${attachments.length} pièce(s) jointe(s).` : ""}`,
        },
      ],
    };
    await saveRequestFile(record);
    const index = await getRequestsIndex();
    index.push(record);
    await saveRequestsIndex(index);
    await deletePendingRequestPrefix(token);
    try {
      await notifyRequestCreated(record);
    } catch (mailError) { console.error("Request confirm notification error:", mailError)}
    return redirectToMerci(req, { ok: "1", id: record.id });
  } catch (error) {
    console.error("Request confirm error:", error);
    return redirectToMerci(req, { erreur: "serveur" });
  }
}
