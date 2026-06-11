import {
  DetectDocumentTextCommand,
  TextractClient,
} from "@aws-sdk/client-textract";

const textract = new TextractClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

function blocksToText(blocks: { Text?: string | null; BlockType?: string }[]) {
  return blocks
    .filter((b) => b.BlockType === "LINE" && b.Text)
    .map((b) => b.Text)
    .join("\n");
}

/** Extraction PDF via Textract (déjà utilisé ailleurs dans le projet). */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const res = await textract.send(new DetectDocumentTextCommand({ Document: { Bytes: bytes } }));
  const text = blocksToText(res.Blocks || []);
  if (!text.trim()) throw new Error("Impossible de lire le texte du PDF.");
  return text;
}

/** Chaînes lisibles dans les binaires Office / Excel (sans librairie dédiée). */
export function scrapeBinaryText(bytes: Uint8Array, maxChars = 20_000): string {
  const buf = Buffer.from(bytes);
  const latin = buf.toString("latin1");
  const runs = latin.match(/[\x20-\x7E\u00C0-\u024F\u00DF\u0152\u0153]{4,}/g) || [];
  const uniq = Array.from(new Set(runs.map((s) => s.trim()).filter(Boolean)));
  return uniq.join("\n").slice(0, maxChars);
}

export async function extractTextFromUpload(
  bytes: Uint8Array,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const lower = fileName.toLowerCase();
  const mime = (mimeType || "").toLowerCase();

  if (lower.endsWith(".pdf") || mime.includes("pdf")) {
    return extractPdfText(bytes);
  }

  const scraped = scrapeBinaryText(bytes);
  if (scraped.trim().length < 8) {
    throw new Error(
      "Texte insuffisant pour l'analyse. Essayez un PDF ou un export plus lisible.",
    );
  }
  return scraped;
}
