import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import { Session } from "api-ecoledirecte";

export const runtime = "node"; // ⚠ obligatoire pour utiliser node-fetch
(global as any).fetch = fetch;

export async function POST(req: NextRequest) {
  try {
    const { identifiant, motdepasse } = await req.json();

    if (!identifiant || !motdepasse) {
      return NextResponse.json(
        { error: "Identifiant et mot de passe requis" },
        { status: 400 }
      );
    }

    const session = new Session();

    try {
      await session.login(identifiant, motdepasse);
    } catch (loginErr) {
      return NextResponse.json(
        { error: "Impossible de se connecter", details: loginErr },
        { status: 401 }
      );
    }

    const notes = await session.accounts[0]?.fetchNotes();
    const messages = await session.accounts[0]?.fetchMessages();
    const emploiDuTemps = await session.accounts[0]?.fetchEmploiDuTemps();

    return NextResponse.json({
      success: true,
      notes: notes ?? [],
      messages: messages ?? [],
      emploiDuTemps: emploiDuTemps ?? [],
    });
  } catch (err) {
    console.error("Erreur API EcoleDirecte :", err);
    return NextResponse.json({ error: "Erreur lors de la requête" }, { status: 500 });
  }
}