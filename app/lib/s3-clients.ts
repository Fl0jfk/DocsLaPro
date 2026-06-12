import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import { getTenant } from "@/app/lib/tenant-context";
import type { TenantSecrets } from "@/app/lib/tenant-types";

type TenantAwsConfig = NonNullable<TenantSecrets["aws"]>;

let _platformClient: S3Client | null = null;
const staticTenantClients = new Map<string, S3Client>();
const assumedRoleCache = new Map<string, { client: S3Client; expiresAt: number }>();

function defaultRegion(): string {
  return process.env.REGION?.trim() || "eu-west-3";
}

function platformCredentials() {
  const accessKeyId = process.env.ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("ACCESS_KEY_ID / SECRET_ACCESS_KEY manquants (IAM plateforme).");
  }
  return { accessKeyId, secretAccessKey };
}

/** IAM plateforme — registry S3 uniquement (index + secrets tenants). */
export function getPlatformS3Client(): S3Client {
  if (!_platformClient) {
    _platformClient = new S3Client({
      region: defaultRegion(),
      credentials: platformCredentials(),
    });
  }
  return _platformClient;
}

async function clientForTenantAws(slug: string, aws?: TenantAwsConfig): Promise<S3Client> {
  const region = aws?.region?.trim() || defaultRegion();

  if (aws?.roleArn?.trim()) {
    const roleArn = aws.roleArn.trim();
    const cacheKey = `${slug}:${roleArn}`;
    const cached = assumedRoleCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() + 60_000) return cached.client;

    const sts = new STSClient({ region, credentials: platformCredentials() });
    const assumed = await sts.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: `docslapro-${slug}`.slice(0, 64),
        DurationSeconds: 3600,
      }),
    );
    const creds = assumed.Credentials;
    if (!creds?.AccessKeyId || !creds.SecretAccessKey || !creds.SessionToken) {
      throw new Error(`AssumeRole échoué pour le tenant « ${slug} ».`);
    }

    const client = new S3Client({
      region,
      credentials: {
        accessKeyId: creds.AccessKeyId,
        secretAccessKey: creds.SecretAccessKey,
        sessionToken: creds.SessionToken,
      },
    });
    assumedRoleCache.set(cacheKey, {
      client,
      expiresAt: creds.Expiration?.getTime() ?? Date.now() + 3_500_000,
    });
    return client;
  }

  if (aws?.accessKeyId?.trim() && aws?.secretAccessKey?.trim()) {
    const cached = staticTenantClients.get(slug);
    if (cached) return cached;
    const client = new S3Client({
      region,
      credentials: {
        accessKeyId: aws.accessKeyId.trim(),
        secretAccessKey: aws.secretAccessKey.trim(),
      },
    });
    staticTenantClients.set(slug, client);
    return client;
  }

  return getPlatformS3Client();
}

/** IAM données du tenant courant — bucket métier (AssumeRole, clés dédiées, ou repli plateforme). */
export async function getTenantDataS3Client(): Promise<S3Client> {
  try {
    const tenant = await getTenant();
    return clientForTenantAws(tenant.slug, tenant.secrets?.aws);
  } catch {
    return getPlatformS3Client();
  }
}

export async function getTenantDataS3Region(): Promise<string> {
  try {
    const tenant = await getTenant();
    return tenant.secrets?.aws?.region?.trim() || defaultRegion();
  } catch {
    return defaultRegion();
  }
}
