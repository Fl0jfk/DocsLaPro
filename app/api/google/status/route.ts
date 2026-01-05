// app/api/google/status/route.ts
import { NextResponse } from "next/server";

const INTERNAL_TOKENS_URL =process.env.NEXT_PUBLIC_APP_URL+"/api/google/gettokens";

export async function GET() {
  try {
    const res = await fetch(INTERNAL_TOKENS_URL!, { cache: "no-store" });
    const tokens = await res.json();
    const email = process.env.GOOGLE_ACCOUNT_EMAIL!;
    const userTokens = tokens[email];
    const hasToken = !!userTokens?.refreshToken;
    return NextResponse.json({ hasToken });
  } catch (e) {
    console.error("Erreur /api/google/status", e);
    return NextResponse.json({ hasToken: false });
  }
}
