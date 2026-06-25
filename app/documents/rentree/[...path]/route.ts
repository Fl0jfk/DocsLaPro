import { NextRequest, NextResponse } from "next/server";
import { rentreePublicFileApiUrl } from "@/app/lib/rentree-public-urls";

/** Fallback pour les liens legacy `/documents/rentree/...pdf` (hors middleware PDF). */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const key = `documents/rentree/${path.map((p) => decodeURIComponent(p)).join("/")}`;
  const dest = new URL(rentreePublicFileApiUrl(key), req.nextUrl.origin);
  return NextResponse.redirect(dest);
}
