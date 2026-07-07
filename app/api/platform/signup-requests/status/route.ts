import { NextResponse } from "next/server";
import {
  loadSignupRequest,
  publicSignupStatusView,
  saveSignupRequest,
} from "@/app/lib/platform-signup-request";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "token requis." }, { status: 400 });
  }

  const { loadSignupRequestByToken } = await import("@/app/lib/platform-signup-request");
  const request = await loadSignupRequestByToken(token);
  if (!request) {
    return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  }

  return NextResponse.json({ request: publicSignupStatusView(request) });
}
