import { NextResponse } from "next/server";
import { listClerkMembers } from "@/app/lib/clerk-users";
import { requireProfRoomModuleAdmin } from "@/app/lib/prof-room-auth";

/** Liste des utilisateurs Clerk pour le paramétrage des administrateurs du module. */
export async function GET() {
  const gate = await requireProfRoomModuleAdmin();
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
    console.error("GET /reservation-rooms/clerk-users:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Impossible de charger les utilisateurs Clerk." },
      { status: 500 },
    );
  }
}
