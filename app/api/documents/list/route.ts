// app/api/documents/list/route.ts
import { NextRequest } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

const s3 = new S3Client({
  region: "eu-west-3",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });
  }
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const role = user.publicMetadata.role as string;
  let folder = "";
  if (role === "professeurs") folder = "professeurs/";
  else if (role === "administratif") folder = "administratif/";
  else if (role === "direction") folder = "direction/";
  else if (role === "admin") folder = "admin/";
  else return new Response(JSON.stringify({ error: "Accès refusé" }), { status: 403 });
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Prefix: `documents/${folder}`,
    });
    const response = await s3.send(command);
    const files = response.Contents
      ?.filter((file) => file.Key?.endsWith(".pdf"))
      .map((file) => ({
        title: file.Key?.split("/").pop()?.replace(".pdf", ""),
        url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.eu-west-3.amazonaws.com/${file.Key}`,
      })) || [];
    return new Response(JSON.stringify(files), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err }), { status: 500 });
  }
}
