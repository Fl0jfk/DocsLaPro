import { NextRequest } from "next/server";
import { getToolboxConfig } from "@/app/lib/toolbox-config";
import {
  buildRentreeFileResponse,
  loadRentreeFileBytes,
  rentreeFileNotFoundHtml,
} from "@/app/lib/rentree-file-serve";
import { isAllowedRentreeS3Key } from "@/app/lib/rentree-public-urls";

export async function GET(req: NextRequest) {
  const config = await getToolboxConfig();
  if (!config.tools.rentree.enabled) {
    return new Response(rentreeFileNotFoundHtml(""), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const key = req.nextUrl.searchParams.get("key")?.trim() || "";
  if (!key || !isAllowedRentreeS3Key(key)) {
    return new Response(rentreeFileNotFoundHtml(key || "inconnu"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const loaded = await loadRentreeFileBytes(key);
  if (!loaded) {
    return new Response(rentreeFileNotFoundHtml(key), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const download = req.nextUrl.searchParams.get("download") === "1";
  return buildRentreeFileResponse(loaded.bytes, loaded.resolvedKey, { download });
}
