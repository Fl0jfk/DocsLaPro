import { NextRequest } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "eu-west-3",
  credentials: { accessKeyId: process.env.ACCESS_KEY_ID!, secretAccessKey: process.env.SECRET_ACCESS_KEY!},
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return new Response(JSON.stringify({ error: "Clé absente" }), { status: 400 });
  try {
    const command = new GetObjectCommand({ Bucket: process.env.BUCKET_NAME!, Key: key });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return new Response(JSON.stringify({ url }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}