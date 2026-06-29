import type { FournituresChild } from "@/app/lib/fournitures-types";
import type { SuppliesPdfInput } from "@/app/lib/fournitures-supplies-pdf";

/** Parse le corps JSON ou formulaire (champ `payload`) d'une requête PDF fournitures. */
export async function parseSuppliesPdfRequest(req: Request): Promise<SuppliesPdfInput> {
  const contentType = req.headers.get("content-type") ?? "";
  let body: Record<string, unknown>;

  if (contentType.includes("application/json")) {
    body = (await req.json()) as Record<string, unknown>;
  } else if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await req.formData();
    const raw = form.get("payload");
    if (typeof raw !== "string" || !raw.trim()) {
      throw new Error("Payload manquant.");
    }
    body = JSON.parse(raw) as Record<string, unknown>;
  } else {
    throw new Error("Format de requête non supporté.");
  }

  const children = (body.children || []) as FournituresChild[];
  if (!Array.isArray(children) || children.length === 0) {
    throw new Error("Ajoutez au moins un enfant.");
  }

  const suppliesByChild = (body.suppliesByChild || {}) as Record<
    string,
    Array<{ title: string; items: string[] }>
  >;

  return { children, suppliesByChild };
}
