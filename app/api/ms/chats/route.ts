import { Auth } from "@auth/core";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

// Type utile pour le retour d'erreur
type ErrorResponse = {
  error: string;
};

// Correction principale : typage robuste, gestion d'erreur cohérente
export async function GET(req: NextRequest) {
  try {
    const session = await Auth(req, authOptions);

    // Validation de la présence du token d'accès utilisateur
    const accessToken = session?.user?.accessToken;
    if (!accessToken) {
      return NextResponse.json<ErrorResponse>(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // Appel à l'API Microsoft Graph avec token d'accès
    const graphRes = await fetch("https://graph.microsoft.com/v1.0/me/chats", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!graphRes.ok) {
      // Gestion spécifique des erreurs Microsoft Graph
      const errorText = await graphRes.text();
      return NextResponse.json<ErrorResponse>(
        { error: `Graph API: ${errorText || graphRes.statusText}` },
        { status: graphRes.status }
      );
    }

    const data = await graphRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    // Erreur serveur ou exception inattendue
    return NextResponse.json<ErrorResponse>(
      { error: err?.message ?? "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
