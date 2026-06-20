import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getTenant } from "@/app/lib/tenant-context";
import { isMultiTenantEnabled } from "@/app/lib/tenant-registry";
import { getPlatformS3Client, getTenantDataS3Client } from "@/app/lib/s3-clients";
import { getJson, getBucketName } from "@/app/lib/s3-storage";
import { resolveTenantSession } from "@/app/lib/tenant-session";

export const dynamic = "force-dynamic";

function msg(e: unknown): string {
  return e instanceof Error ? `${e.name}: ${e.message}` : String(e);
}

/** Diagnostic public (aucune auth) — pour localiser la cause des 500. */
export async function GET() {
  const report: Record<string, unknown> = {};

  report.env = {
    ACCESS_KEY_ID: Boolean(process.env.ACCESS_KEY_ID?.trim()),
    SECRET_ACCESS_KEY: Boolean(process.env.SECRET_ACCESS_KEY?.trim()),
    REGION: process.env.REGION?.trim() || null,
    REGISTRY_BUCKET: process.env.REGISTRY_BUCKET?.trim() || null,
    BUCKET_NAME: process.env.BUCKET_NAME?.trim() || null,
    TENANT_INDEX_JSON: Boolean(process.env.TENANT_INDEX_JSON?.trim()),
    CLERK_ENCRYPTION_KEY: Boolean(process.env.CLERK_ENCRYPTION_KEY?.trim()),
    PLATFORM_CLERK_SECRET_KEY: Boolean(process.env.PLATFORM_CLERK_SECRET_KEY?.trim()),
    CLERK_SECRET_KEY: Boolean(process.env.CLERK_SECRET_KEY?.trim()),
    multiTenant: isMultiTenantEnabled(),
  };

  try {
    const h = await headers();
    report.request = {
      host: h.get("host"),
      xForwardedHost: h.get("x-forwarded-host"),
      tenantSlugHeader: h.get("x-tenant-slug"),
      hasCookie: Boolean(h.get("cookie")),
    };
  } catch (e) {
    report.request = { error: msg(e) };
  }

  try {
    const tenant = await getTenant();
    report.tenant = {
      slug: tenant.slug,
      hostnames: tenant.hostnames,
      dataBucket: tenant.dataBucket,
      appUrl: tenant.appUrl,
      hasClerkSecretKey: Boolean(tenant.clerkSecretKey?.trim()),
      hasClerkPublishableKey: Boolean(tenant.clerkPublishableKey?.trim()),
      hasAwsOverride: Boolean(
        tenant.secrets?.aws?.roleArn ||
          tenant.secrets?.aws?.accessKeyId,
      ),
    };
  } catch (e) {
    report.tenant = { error: msg(e) };
  }

  try {
    const bucket = await getBucketName();
    report.bucketName = bucket;
  } catch (e) {
    report.bucketName = { error: msg(e) };
  }

  try {
    const client = getPlatformS3Client();
    const registry = process.env.REGISTRY_BUCKET?.trim();
    if (registry) {
      const res = await client.send(
        new ListObjectsV2Command({ Bucket: registry, MaxKeys: 1 }),
      );
      report.platformS3 = { ok: true, sampleKeyCount: res.KeyCount ?? 0 };
    } else {
      report.platformS3 = { skipped: "REGISTRY_BUCKET absent" };
    }
  } catch (e) {
    report.platformS3 = { error: msg(e) };
  }

  try {
    const client = await getTenantDataS3Client();
    const bucket = await getBucketName();
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }),
    );
    report.tenantS3List = { ok: true, sampleKeyCount: res.KeyCount ?? 0 };
  } catch (e) {
    report.tenantS3List = { error: msg(e) };
  }

  try {
    const hit = await getJson<{ name?: string }>("settings/site.json");
    report.s3ReadSiteJson = hit?.data ? "ok" : "empty_or_missing";
  } catch (e) {
    report.s3ReadSiteJson = { error: msg(e) };
  }

  try {
    const session = await resolveTenantSession();
    report.tenantSession = session ? { ok: true, userId: session.userId } : "null";
  } catch (e) {
    report.tenantSession = { error: msg(e) };
  }

  return NextResponse.json(report, { status: 200 });
}
