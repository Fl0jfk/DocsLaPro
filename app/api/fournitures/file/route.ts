import { NextRequest, NextResponse } from "next/server";
import { isAllowedFournituresS3Key } from "@/app/lib/fournitures-public-urls";
import { getObjectBytes } from "@/app/lib/s3-storage";
import { getToolboxConfig } from "@/app/lib/toolbox-config";
import { resolveTravelsS3ObjectKey } from "@/app/lib/travels-s3";

function contentTypeForKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function fileNameFromKey(key: string): string {
  const base = key.split("/").pop() || "document";
  try {
    return decodeURIComponent(base);
  } catch {
    return base;
  }
}

export async function GET(req: NextRequest) {
  const config = await getToolboxConfig();
  if (!config.tools["simulateur-fournitures"].enabled) {
    return NextResponse.json({ error: "Non disponible." }, { status: 404 });
  }

  const key = req.nextUrl.searchParams.get("key")?.trim() || "";
  if (!key || !isAllowedFournituresS3Key(key)) {
    return NextResponse.json({ error: "Clé invalide." }, { status: 400 });
  }

  const resolvedKey = (await resolveTravelsS3ObjectKey(key, key)) || key;
  const bytes = await getObjectBytes(resolvedKey);
  if (!bytes?.length) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const fileName = fileNameFromKey(resolvedKey);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": contentTypeForKey(resolvedKey),
      "Content-Disposition": `inline; filename="${fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
