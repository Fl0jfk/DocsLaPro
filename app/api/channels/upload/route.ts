import { NextRequest, NextResponse } from "next/server";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { putTenantObject } from "@/app/lib/tenant-s3-storage";
import { tenantS3Key } from "@/app/lib/tenant";

export const config = {
  api: {
    bodyParser: false,
  },
};

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const { orgId } = gate.ctx;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier trouvé" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const rel = `uploads/${fileName}`;
    await putTenantObject(orgId, rel, buffer, file.type);
    const fileKey = tenantS3Key(orgId, rel);
    const region = process.env.REGION || "eu-west-3";
    const url = `https://${process.env.BUCKET_NAME}.s3.${region}.amazonaws.com/${fileKey}`;
    return NextResponse.json({
      url,
      name: file.name,
      type: file.type,
      key: fileKey,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erreur Upload S3:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
