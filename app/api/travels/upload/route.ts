import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { tenantS3Key } from "@/app/lib/tenant";
import { getBucketName } from "@/app/lib/tenant-s3-storage";
import { requireTenantAuth } from "@/app/lib/tenant-auth";

export async function POST(req: Request) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  try {
    const { fileName, fileType } = await req.json();
    const fileKey = tenantS3Key(gate.ctx.orgId, `attachments/${Date.now()}-${fileName}`);
    const s3Client = new S3Client({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });
    const bucket = getBucketName();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: fileType,
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return NextResponse.json({
      uploadUrl,
      fileUrl: `https://${bucket}.s3.${process.env.REGION}.amazonaws.com/${fileKey}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur upload" }, { status: 500 });
  }
}
