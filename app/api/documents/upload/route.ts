import { NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireTenantAuth } from "@/app/lib/tenant-auth";
import { putTenantObject } from "@/app/lib/tenant-s3-storage";

export async function POST(req: NextRequest) {
  const gate = await requireTenantAuth();
  if (!gate.ok) return gate.response;
  const { userId, orgId } = gate.ctx;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const roles = (user.publicMetadata.role as string[]) || [];

  const formData = await req.formData();
  const file = formData.get("file") as File;
  let targetPath = formData.get("path") as string;

  if (targetPath && !targetPath.endsWith("/")) {
    targetPath += "/";
  }

  const isProf = roles.includes("professeur") && targetPath.startsWith("documents/professeurs/");
  const isCompta = roles.includes("comptabilité") && targetPath.startsWith("documents/Compta RH/");
  const isAdmin = roles.includes("administratif") && targetPath.startsWith("documents/administratif/");

  if (!isProf && !isCompta && !isAdmin) {
    return new Response("Action non autorisée dans ce dossier", { status: 403 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const rel = `${targetPath}${file.name}`;
    await putTenantObject(orgId, rel, buffer, file.type);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("ERREUR S3:", err);
    return new Response(String(err), { status: 500 });
  }
}
