import { safeCurrentUser } from "@/app/lib/intranet-session";
import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import {
  buildHseAcceptancePdf,
  hseAcceptancePdfFilename,
  type HseAcceptanceRecord,
} from "@/app/lib/hse-acceptance-pdf";
import { getJson } from "@/app/lib/s3-storage";

const INDEX_KEY = "demandes-hse/index.json";

type HseRecord = HseAcceptanceRecord & {
  status: string;
  createdBy: { userId: string; name: string; email: string };
  acceptancePdfPath?: string;
};

const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s-]+/g, "");

function rolesOfUser(roleRaw: unknown): string[] {
  return Array.isArray(roleRaw) ? (roleRaw as string[]) : roleRaw ? [String(roleRaw)] : [];
}

function getRoleFlags(roles: string[]) {
  const n = roles.map(norm);
  return {
    isDirectionEcole: n.some((r) => r.includes("direction") && r.includes("ecole")),
    isDirectionCollege: n.some((r) => r.includes("direction") && r.includes("college")),
    isDirectionLycee: n.some((r) => r.includes("direction") && r.includes("lycee")),
  };
}

function canManageDemand(rec: HseRecord, roles: string[]) {
  const f = getRoleFlags(roles);
  if (rec.etablissement === "École") return f.isDirectionEcole;
  if (rec.etablissement === "Collège") return f.isDirectionCollege;
  if (rec.etablissement === "Lycée") return f.isDirectionLycee;
  return false;
}

function canViewDemand(rec: HseRecord, userId: string, roles: string[]) {
  if (rec.createdBy.userId === userId) return true;
  return canManageDemand(rec, roles);
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const { userId } = gate.ctx;

  const user = await safeCurrentUser();
  const roles = rolesOfUser(user?.publicMetadata?.role);

  const { id } = await ctx.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
  }

  try {
    const hit = await getJson<HseRecord[]>(INDEX_KEY);
    const record = hit?.data?.find((r) => r.id === id);
    if (!record) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }
    if (!canViewDemand(record, userId, roles)) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
    if (record.status !== "ACCEPTEE") {
      return NextResponse.json(
        { error: "L'attestation PDF n'est disponible que pour les demandes acceptées." },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await buildHseAcceptancePdf(record));

    const filename = hseAcceptancePdfFilename(record);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[demandes-hse/pdf]", error);
    return NextResponse.json({ error: "Impossible de générer le PDF." }, { status: 500 });
  }
}
