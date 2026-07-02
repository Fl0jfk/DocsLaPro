import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { canDownloadAwardPdf } from "@/app/lib/certificates-auth";
import { CERTIFICATE_S3 } from "@/app/lib/certificates-types";
import { loadAward, loadProgram } from "@/app/lib/certificates-storage";
import { safeCurrentUser } from "@/app/lib/intranet-session";
import { getTenantDataS3Client } from "@/app/lib/s3-clients";
import { getBucketName } from "@/app/lib/s3-storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;
  const user = await safeCurrentUser();
  const { id } = await params;
  const award = await loadAward(id);
  if (!award) return NextResponse.json({ error: "Fiche introuvable." }, { status: 404 });
  const program = await loadProgram(award.programId);
  if (!program) return NextResponse.json({ error: "Parcours introuvable." }, { status: 404 });
  if (!canDownloadAwardPdf(award, program, gate.ctx.userId, user)) {
    return NextResponse.json({ error: "PDF non disponible." }, { status: 403 });
  }
  const key = award.pdfS3Key || CERTIFICATE_S3.pdf(id);
  try {
    const s3 = await getTenantDataS3Client();
    const obj = await s3.send(
      new GetObjectCommand({ Bucket: await getBucketName(), Key: key }),
    );
    const bytes = await obj.Body?.transformToByteArray();
    if (!bytes?.length) return NextResponse.json({ error: "PDF introuvable." }, { status: 404 });
    const filename = `certificat-${award.student.nom}-${award.student.prenom}.pdf`.replace(/\s+/g, "-");
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch {
    return NextResponse.json({ error: "PDF introuvable." }, { status: 404 });
  }
}
