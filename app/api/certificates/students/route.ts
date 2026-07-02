import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import { canAccessCertificatesModule } from "@/app/lib/certificates-auth";
import { loadCertificateStudents } from "@/app/lib/certificates-students";

export async function GET(req: Request) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const user = await safeCurrentUser();
  if (!canAccessCertificatesModule(user)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;
  const classe = url.searchParams.get("classe") || undefined;
  const students = await loadCertificateStudents({ q, classe });
  const classes = [...new Set(students.map((s) => s.classe).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
  return NextResponse.json({ students, classes });
}
