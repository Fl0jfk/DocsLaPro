import { NextResponse, NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "eu-west-3",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) { return NextResponse.json({ error: "Non autorisé" }, { status: 401 })}
  const body = await req.json();
  const { path } = body;
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: path
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    return NextResponse.json({ url });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json({errorName: err.name, errorMessage: err.message, stack: err.stack},{ status: 500 });
  }
}

