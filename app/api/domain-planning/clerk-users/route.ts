import { NextResponse } from "next/server";
import { listClerkMembers } from "@/app/lib/clerk-users";
import { requireDomainPlanningClerkUsersList } from "@/app/lib/domain-planning-auth";

/** Liste des utilisateurs Clerk (paramétrage + affectation de créneaux). */
export async function GET() {
  const gate = await requireDomainPlanningClerkUsersList();
  if (!gate.ok) return gate.response;
  try {
    const users = await listClerkMembers();
    return NextResponse.json({
      users: users.map((u) => ({
        clerkUserId: u.clerkUserId,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        displayName: u.displayName,
        pending: u.pending,
      })),
    });
  } catch (err: unknown) {
    console.error("GET /domain-planning/clerk-users:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Impossible de charger les utilisateurs Clerk." },
      { status: 500 },
    );
  }
}
