import { NextResponse, NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.BUCKET!;
const KEY = "eleves.json";

async function getElevesFromS3() {
  const res = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: KEY})
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
    return NextResponse.json(eleves);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}