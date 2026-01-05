import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.BUCKET_NAME!;
const FILE_KEY = "tokensGoogle.json";

async function getSignedUrlForRead() {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: FILE_KEY });
  return await getSignedUrl(s3, command, { expiresIn: 60 });
}

async function getSignedUrlForWrite() {
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: FILE_KEY });
  return await getSignedUrl(s3, command, { expiresIn: 60 });
}

async function readTokens() {
  try {
    const url = await getSignedUrlForRead();
    const res = await fetch(url);
    if (!res.ok) {
      return {};
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Erreur lecture JSON S3 :", err);
    return {};
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function writeTokens(tokens: any) {
  try {
    const url = await getSignedUrlForWrite();
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokens),
    });
  } catch (err) {
    throw err;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    });
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const tokenData = await tokenRes.json();
      const { access_token, refresh_token, expires_in, scope } = tokenData;
    if (!access_token) {
      console.error("Access token manquant :", tokenData);
      return NextResponse.json({ error: "Failed to get access_token" }, { status: 400 });
    }
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userData = await userRes.json();
    const googleEmail = userData.email;
    if (!googleEmail) {
      console.error("Email introuvable dans userData :", userData);
      return NextResponse.json({ error: "Failed to get email" }, { status: 400 });
    }
    const tokens = await readTokens();
    tokens[googleEmail] = {
      accessToken: access_token,
      refreshToken: refresh_token,
      scope,
      expiresAt: new Date(Date.now() + expires_in * 1000).toISOString(),
    };
    await writeTokens(tokens);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}`);
  } catch (err) {
    console.error("Erreur callback Google :", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
