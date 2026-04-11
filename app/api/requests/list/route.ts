import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { computeStaffBoardColumn, isCorbeilleBranchId, isVisibleOnStaffBoard, normalizeRequestBranchId, normalizeRequestEmail} from "@/app/lib/requests-board";
import { getAllBranchStaffEmails, getDelegateTargetEmailsForRequest, getRequestsIndex, isLeaderForRequestBranch, purgeExpiredRequests,} from "@/app/lib/requests";
import { canAccessRequestsStaffBoard } from "@/app/lib/requests-staff-access";

function hasStaffBoardAccess(roles: string[], email: string) { return canAccessRequestsStaffBoard(roles, email)}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Non autorisé", { status: 401 });
  const user = await currentUser();
  const roleRaw = user?.publicMetadata?.role;
  const roles = Array.isArray(roleRaw) ? roleRaw.map(String) : roleRaw ? [String(roleRaw)] : [];
  const scopeParam = req.nextUrl.searchParams.get("scope");
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const scope = scopeParam ?? (hasStaffBoardAccess(roles, userEmail) ? "board" : "submitted");
  try {
    try {
      await purgeExpiredRequests();
    } catch (e) {
      console.error("purgeExpiredRequests:", e);
    }
    const index = await getRequestsIndex();
    const sortDesc = (a: (typeof index)[number], b: (typeof index)[number]) => +new Date(b.updatedAt) - +new Date(a.updatedAt);
    if (scope === "submitted") {
      const mine = index.filter(
        (r) =>
          r.requester.userId === userId ||
          (userEmail && normalizeRequestEmail(r.requester.email) === normalizeRequestEmail(userEmail)),
      );
      return NextResponse.json(mine.sort(sortDesc));
    }
    if (scope === "board" || scope === "all" || scope === "my_queue") {
      if (!hasStaffBoardAccess(roles, userEmail)) return new NextResponse("Accès refusé", { status: 403 });
      if (!userEmail) return NextResponse.json({ error: "Email requis pour le tableau des demandes" }, { status: 400 });
      const allStaff = getAllBranchStaffEmails();
      const visible = index.filter((r) => isVisibleOnStaffBoard( r.assignedTo, userEmail, allStaff, isLeaderForRequestBranch(r.assignedTo.routeId, r.assignedTo.unit, userEmail)));
      const enriched = visible
        .sort(sortDesc)
        .map((r) => {
          const isLeaderHere = isLeaderForRequestBranch(r.assignedTo.routeId, r.assignedTo.unit, userEmail);
          const branch = normalizeRequestBranchId(r.assignedTo.routeId, r.assignedTo.unit);
          const isCorbeilleCard = isCorbeilleBranchId(branch);
          const delegateTargets =
            isLeaderHere && !isCorbeilleCard ? getDelegateTargetEmailsForRequest(r, userEmail) : [];
          return {
            ...r,
            boardColumn: computeStaffBoardColumn(r.assignedTo, r.status, userEmail, allStaff, isLeaderHere),
            boardCanReassign: isLeaderHere,
            boardCanDelegate: delegateTargets.length > 0,
            delegateTargets,
          };
        });
      return NextResponse.json(enriched);
    }
    return NextResponse.json({ error: "Scope de liste inconnu." }, { status: 400 });
  } catch (error) {
    console.error("Request list error:", error);
    return NextResponse.json({ error: "Erreur récupération demandes" }, { status: 500 });
  }
}
