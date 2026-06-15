import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { canAccessRequestsStaffBoard } from "@/app/lib/requests-staff-access";
import {
  getRequestsRoutingConfig,
  listActiveTasksForPicker,
  listDirectionQueuesForTransmit,
} from "@/app/lib/requests-routing-config";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  const user = await currentUser();
  const roleRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(roleRaw) ? roleRaw.map(String) : roleRaw ? [String(roleRaw)] : [];
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  if (!(await canAccessRequestsStaffBoard(roles, userEmail))) return new NextResponse("Accès refusé", { status: 403 });
  const config = await getRequestsRoutingConfig();
  const mode = new URL(req.url).searchParams.get("mode");
  if (mode === "transmit") {
    return NextResponse.json(listDirectionQueuesForTransmit(config));
  }
  return NextResponse.json(listActiveTasksForPicker(config));
}
