import { NextResponse } from "next/server";
import { loadVerifySnapshot } from "@/app/lib/certificates-storage";
import { shortContentHash } from "@/app/lib/certificates-verify";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  if (!token?.trim()) return NextResponse.json({ error: "Token invalide." }, { status: 400 });
  const snapshot = await loadVerifySnapshot(token);
  if (!snapshot) return NextResponse.json({ error: "Certificat introuvable." }, { status: 404 });
  return NextResponse.json({
    ...snapshot,
    shortHash: shortContentHash(snapshot.contentHash),
    authentic: true,
  });
}
