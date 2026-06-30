import { NextRequest } from "next/server";
import { createRentreeFileServeResponse, rentreeFileNotFoundHtml } from "@/app/lib/rentree-file-serve";
import { isAllowedRentreeS3Key, rentreeS3KeysFromDocumentPath } from "@/app/lib/rentree-public-urls";
import { getToolboxConfig } from "@/app/lib/toolbox-config";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const config = await getToolboxConfig();
  if (!config.tools.rentree.enabled) {
    return new Response(rentreeFileNotFoundHtml(""), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const { path } = await ctx.params;
  const relative = path.map((p) => decodeURIComponent(p)).join("/");
  const download = req.nextUrl.searchParams.get("download") === "1";

  for (const key of rentreeS3KeysFromDocumentPath(relative)) {
    if (!isAllowedRentreeS3Key(key)) continue;
    const response = await createRentreeFileServeResponse(key, { download });
    if (response.status !== 404) return response;
  }

  return new Response(rentreeFileNotFoundHtml(`toolbox/rentree/${relative}`), {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
