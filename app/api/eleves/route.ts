import { NextResponse, NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { validateElevesJson } from "@/app/lib/eleves-config";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.BUCKET_NAME!;
const KEY = "eleves.json";

async function getElevesFromS3() {
  const res = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: KEY })
  );
  const body = await res.Body?.transformToString("utf-8");
  if (!body) return [];
  return JSON.parse(body);
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const eleves = await getElevesFromS3();
    return NextResponse.json({ count: eleves.length, eleves });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const body = await req.json();
    const validated = validateElevesJson(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: KEY,
        ContentType: "application/json; charset=utf-8",
        Body: JSON.stringify(validated.eleves, null, 2),
      })
    );
    return NextResponse.json({
      success: true,
      count: validated.eleves.length,
      message: `Liste mise à jour (${validated.eleves.length} élèves).`,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
