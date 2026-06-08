import { NextRequest, NextResponse } from "next/server";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { getTenantSignedReadUrl } from "@/app/lib/tenant-s3-storage";
import {
  assertCanReadFile,
  storageKeyForItem,
  type DocumentScope,
} from "@/app/lib/documents-cloud";

export async function GET(req: NextRequest) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(req.url);
  const scope = (searchParams.get("scope") || "personal") as DocumentScope;
  const shareId = searchParams.get("shareId");
  const relPath = searchParams.get("path") || searchParams.get("key") || "";

  if (!relPath) {
    return NextResponse.json({ error: "Fichier absent." }, { status: 400 });
  }

  const access = await assertCanReadFile(
    gate.ctx.userId,
    scope,
    shareId,
  );
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });

  const resolved = storageKeyForItem(gate.ctx.userId, scope, shareId, relPath);
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: 400 });

  try {
    const url = await getTenantSignedReadUrl(null, resolved.key, 3600);
    if (!url) return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
