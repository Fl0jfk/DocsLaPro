import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

const s3 = new S3Client({ region: process.env.REGION });

async function streamToString(stream: Readable | undefined): Promise<string> {
  if (!stream) return "";
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

export async function GET() {
  try {
    const cmd = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: process.env.S3_RES_KEY,
    });

    const data = await s3.send(cmd);
    const bodyStr = await streamToString(data.Body as Readable | undefined);
    const reservations = JSON.parse(bodyStr || "[]");

    return NextResponse.json({ reservations });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
