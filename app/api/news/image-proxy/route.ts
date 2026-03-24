import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

// Works with virtual-hosted style S3 URLs:
//   https://bucket-name.s3.region.amazonaws.com/some/key
function extractBucketAndKey(url: string): { bucket: string; key: string } | null {
  try {
    const parsed = new URL(url);
    const match = parsed.hostname.match(/^(.+?)\.s3\.[^.]+\.amazonaws\.com$/);
    if (!match) return null;
    const bucket = match[1];
    const key = decodeURIComponent(parsed.pathname.slice(1)); // remove leading "/"
    return { bucket, key };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Paramètre url manquant", { status: 400 });
  }

  const parsed = extractBucketAndKey(imageUrl);
  if (!parsed) {
    // Not an S3 URL — redirect directly.
    return NextResponse.redirect(imageUrl);
  }

  try {
    const command = new GetObjectCommand({ Bucket: parsed.bucket, Key: parsed.key });
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return NextResponse.redirect(signedUrl);
  } catch (err) {
    console.error("image-proxy error:", err);
    return new NextResponse("Erreur génération lien image", { status: 500 });
  }
}
