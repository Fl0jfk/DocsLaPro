import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  const s3Client = new S3Client({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });
  try {
    const getCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: 'travels/index.json',
    });
    const response = await s3Client.send(getCommand);
    const body = await response.Body?.transformToString();
    const trips = body ? JSON.parse(body) : [];
    const sortedTrips = trips.sort((a: any, b: any) =>  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json(sortedTrips);
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      return NextResponse.json([]);
    }
    console.error("Erreur S3 List:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération de l'index" }, { status: 500 });
  }
}