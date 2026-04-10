import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { listRequestRoutesForPicker } from "@/app/lib/requests";
import { canAccessRequestsStaffBoard } from "@/app/lib/requests-staff-access";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  const user = await currentUser();
  const roleRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(roleRaw) ? roleRaw.map(String) : roleRaw ? [String(roleRaw)] : [];
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  if (!canAccessRequestsStaffBoard(roles, userEmail)) return new NextResponse("Accès refusé", { status: 403 });
  return NextResponse.json(listRequestRoutesForPicker());
}
