import { NextResponse, NextRequest } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
  },
});

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type");
    if (!type) return NextResponse.json({ error: "type manquant" }, { status: 400 });

    if (type === "getRooms" || type === "getReservations") {
      const key = type === "getRooms" ? process.env.S3_ROOMS_KEY : process.env.S3_RES_KEY;
      const cmd = new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: key! });
      const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
      return NextResponse.json({ url });
    }

    if (type === "putReservations") {
      const { userId } = getAuth(req);
      if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      const roles = (user.publicMetadata?.roles || []) as string[];
      if (!roles.includes("admin-room"))
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

      const cmd = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: process.env.S3_RES_KEY!,
        ContentType: "application/json",
      });
      const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
      return NextResponse.json({ url });
    }

    return NextResponse.json({ error: "type invalide" }, { status: 400 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
