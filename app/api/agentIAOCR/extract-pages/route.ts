import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PDFDocument } from "pdf-lib";
import { getTenantDataS3Client } from "@/app/lib/s3-clients";
import { getBucketName } from "@/app/lib/s3-storage";

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const bucket = await getBucketName();
    const s3 = await getTenantDataS3Client();
    const { key, pageStart, pageEnd, filename } = await req.json();
    if (!key) {
      return NextResponse.json({ error: "key requis" }, { status: 400 });
    }

    const start = Math.max(1, Number(pageStart) || 1);
    const end = Math.max(start, Number(pageEnd) || start);

    const obj = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    const bytes = await obj.Body?.transformToByteArray();
    if (!bytes?.length) {
      return NextResponse.json({ error: "PDF introuvable sur S3" }, { status: 404 });
    }

    const src = await PDFDocument.load(bytes);
    const pageCount = src.getPageCount();
    const i0 = Math.min(start - 1, pageCount - 1);
    const i1 = Math.min(end - 1, pageCount - 1);
    const indices = [];
    for (let i = i0; i <= i1; i++) indices.push(i);

    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, indices);
    copied.forEach((p) => out.addPage(p));
    const outBytes = await out.save();

    const baseName =
      (typeof filename === "string" && filename.replace(/\.pdf$/i, "")) ||
      "segment";
    const segmentKey = `uploads-temp/segment_${Date.now()}_p${start}-${end}_${baseName}.pdf`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: segmentKey,
        ContentType: "application/pdf",
        Body: Buffer.from(outBytes),
      })
    );

    const downloadUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: segmentKey }),
      { expiresIn: 3600 }
    );

    return NextResponse.json({
      key: segmentKey,
      downloadUrl,
      pageStart: start,
      pageEnd: end,
      pageCount: indices.length,
    });
  } catch (error) {
    console.error("[extract-pages]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
