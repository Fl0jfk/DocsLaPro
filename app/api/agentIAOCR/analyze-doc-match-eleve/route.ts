import { NextResponse } from "next/server";
import { safeCurrentUser, resolveSession } from "@/app/lib/intranet-session";
import { requireAuth } from "@/app/lib/intranet-auth";
import { analyzeDocMatchEleve } from "@/app/lib/ocr-analyze-eleve";
import { resolveOneDriveProfileForClerkUserServer } from "@/app/lib/onedrive-user-profiles.server";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const session = await resolveSession();
    const userId = session?.userId;
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const gate = await requireAuth();
    if (!gate.ok) return gate.response;

    const user = await safeCurrentUser();
    const odProfile = user
      ? await resolveOneDriveProfileForClerkUserServer({
          lastName: user.lastName,
          emailAddresses: user.emailAddresses?.map((e) => ({ emailAddress: e.emailAddress })),
          primaryEmailAddress: user.primaryEmailAddress
            ? { emailAddress: user.primaryEmailAddress.emailAddress }
            : null,
        })
      : null;

    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "text requis" }, { status: 400 });

    const result = await analyzeDocMatchEleve(text, odProfile);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur analyse Mistral:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
