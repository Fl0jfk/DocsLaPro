import { NextResponse } from "next/server";

export async function GET() {
 /* const redirectUri = encodeURIComponent(process.env.GOOGLE_REDIRECT_URI!);
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const scope = encodeURIComponent(process.env.GOOGLE_SCOPES!);

  const url =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&access_type=offline` + 
    `&prompt=consent` +     
    `&scope=${scope}`;

  return NextResponse.redirect(url);*/
  return NextResponse
}
