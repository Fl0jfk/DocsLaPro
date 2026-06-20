import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { intranetRolesFromMetadata } from "@/app/lib/intranet-roles";
import { requireAuth } from "@/app/lib/intranet-auth";
import { canReviewPreconvention, canViewAllConventions, canViewReferentConventions } from "@/app/lib/stage-access";
import { conventionVisibleToUser } from "@/app/lib/stage-referent";
import {
  normalizeConventionInput,
  reviewPreconvention,
  submitPreconvention,
} from "@/app/lib/stage-workflow";
import { getStageConvention, saveStageConvention } from "@/app/lib/stage-storage";
import { notifyAllStageSignatureRequests } from "@/app/lib/stage-notify";

function displayName(user: Awaited<ReturnType<typeof currentUser>>) {
  const first = user?.firstName?.trim() || "";
  const last = user?.lastName?.trim() || "";
  return `${first} ${last}`.trim() || "Utilisateur";
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireAuth();
    if (!gate.ok) return gate.response;

    const user = await currentUser();
    const roles = intranetRolesFromMetadata(user?.publicMetadata);
    const { id } = await ctx.params;
    const convention = await getStageConvention(id);
    if (!convention) return NextResponse.json({ error: "Convention introuvable." }, { status: 404 });

    const userEmail = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() || "";
    if (
      !conventionVisibleToUser(convention, roles, userEmail, gate.ctx.userId) &&
      !roles.includes("parent")
    ) {
      return NextResponse.json({ error: "Accès réservé." }, { status: 403 });
    }

    const signLinks = convention.signatures
      .filter((s) => s.signToken && s.status === "en_attente")
      .map((s) => ({
        role: s.role,
        label: s.label,
        email: s.signEmail,
        link: `/stages/signer?token=${encodeURIComponent(s.signToken!)}`,
      }));

    return NextResponse.json({
      convention,
      studentLink: convention.studentAccessToken
        ? `/stages/eleve?token=${encodeURIComponent(convention.studentAccessToken)}`
        : null,
      signLinks,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireAuth();
    if (!gate.ok) return gate.response;

    const user = await currentUser();
    const roles = intranetRolesFromMetadata(user?.publicMetadata);
    const { id } = await ctx.params;
    let convention = await getStageConvention(id);
    if (!convention) return NextResponse.json({ error: "Convention introuvable." }, { status: 404 });

    const body = await req.json();
    const action = String(body.action ?? "save");

    if (action === "save") {
      convention = normalizeConventionInput(body.convention ?? body, convention);
      await saveStageConvention(convention);
      return NextResponse.json({ success: true, convention });
    }

    if (action === "submit") {
      convention = normalizeConventionInput(body.convention ?? body, convention);
      const result = await submitPreconvention(convention, displayName(user));
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true, convention: result.convention });
    }

    if (action === "admin_review") {
      if (!canReviewPreconvention(roles)) {
        return NextResponse.json({ error: "Réservé à l'administratif / direction." }, { status: 403 });
      }
      const approved = body.approved === true;
      const next = await reviewPreconvention(convention, {
        by: gate.ctx.userId,
        byName: displayName(user),
        approved,
        note: String(body.note ?? "").trim() || undefined,
      });
      const signLinks = next.signatures
        .filter((s) => s.signToken)
        .map((s) => ({
          role: s.role,
          label: s.label,
          email: s.signEmail,
          link: `/stages/signer?token=${encodeURIComponent(s.signToken!)}`,
        }));
      return NextResponse.json({ success: true, convention: next, signLinks });
    }

    if (action === "resend_signatures") {
      if (!canReviewPreconvention(roles)) {
        return NextResponse.json({ error: "Réservé à l'administratif / direction." }, { status: 403 });
      }
      if (convention.status !== "signatures_pending") {
        return NextResponse.json({ error: "Aucune signature en attente." }, { status: 400 });
      }
      const mail = await notifyAllStageSignatureRequests(convention);
      return NextResponse.json({ success: true, mail });
    }

    if (action === "cancel") {
      if (!canReviewPreconvention(roles)) {
        return NextResponse.json({ error: "Réservé à l'administratif / direction." }, { status: 403 });
      }
      convention = {
        ...convention,
        status: "cancelled",
        updatedAt: new Date().toISOString(),
        history: [
          ...convention.history,
          {
            at: new Date().toISOString(),
            by: displayName(user),
            action: "ANNULEE",
            note: String(body.note ?? "").trim() || undefined,
          },
        ],
      };
      await saveStageConvention(convention);
      return NextResponse.json({ success: true, convention });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
