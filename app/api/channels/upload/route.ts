import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getAuth } from "@clerk/nextjs/server";

export const config = {
  api: {
    bodyParser: false,
  },
};

export const maxDuration = 60; 

const s3 = new S3Client({
  region: "eu-west-3",
  credentials: { 
    accessKeyId: process.env.ACCESS_KEY_ID!, 
    secretAccessKey: process.env.SECRET_ACCESS_KEY! 
  },
});

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) { return NextResponse.json({ error: "Aucun fichier trouvé" }, { status: 400 })}
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const fileKey = `uploads/${fileName}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
    }));
    const url = `https://${process.env.BUCKET_NAME}.s3.eu-west-3.amazonaws.com/${fileKey}`;
    return NextResponse.json({ 
      url, 
      name: file.name, 
      type: file.type,
      key: fileKey 
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erreur Upload S3:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}