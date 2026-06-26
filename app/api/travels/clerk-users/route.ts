import { NextResponse } from "next/server";
import { listClerkMembers } from "@/app/lib/clerk-users";
import { requireAuth } from "@/app/lib/intranet-auth";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import { userHasAdministratifRole } from "@/app/lib/travels-roles";

/** Liste Clerk pour affecter un voyage à un enseignant (administratif uniquement). */
export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const user = await safeCurrentUser();
  if (!userHasAdministratifRole(user)) {
    return NextResponse.json({ error: "Réservé à l'administratif." }, { status: 403 });
  }

  try {
    const users = await listClerkMembers();
    return NextResponse.json({
      users: users
        .filter((u) => u.clerkUserId && !u.pending)
        .map((u) => ({
          clerkUserId: u.clerkUserId,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          displayName: u.displayName,
        })),
    });
  } catch (err: unknown) {
    console.error("[travels/clerk-users]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Impossible de charger les utilisateurs." },
      { status: 500 },
    );
  }
}
