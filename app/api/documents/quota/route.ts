import { NextResponse } from "next/server";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import {
  DOCUMENTS_QUOTA_BYTES,
  formatBytes,
  getUserStorageBytes,
} from "@/app/lib/documents-cloud";

export async function GET() {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;

  const used = await getUserStorageBytes(gate.ctx.userId);
  return NextResponse.json({
    used,
    quota: DOCUMENTS_QUOTA_BYTES,
    usedLabel: formatBytes(used),
    quotaLabel: formatBytes(DOCUMENTS_QUOTA_BYTES),
    percent: Math.min(100, Math.round((used / DOCUMENTS_QUOTA_BYTES) * 100)),
  });
}
