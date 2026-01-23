import { NextRequest } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

const s3 = new S3Client({
  region: "eu-west-3",
  credentials: { 
    accessKeyId: process.env.ACCESS_KEY_ID!, 
    secretAccessKey: process.env.SECRET_ACCESS_KEY! 
  },
});

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response("Non autorisé", { status: 401 });
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const roles = (user.publicMetadata.role as string[]) || [];
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const targetPath = formData.get("path") as string;
  const isProf = roles.includes("professeur") && targetPath.startsWith("documents/professeurs/");
  const isCompta = roles.includes("comptabilité") && targetPath.startsWith("documents/Compta RH/");
  const isAdmin = roles.includes("administratif") && targetPath.startsWith("documents/administratif/");
  if (!isProf && !isCompta && !isAdmin) { return new Response("Action non autorisée dans ce dossier", { status: 403 })}
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: `${targetPath}${file.name}`,
      Body: buffer,
      ContentType: file.type,
    });
    await s3.send(command);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
}