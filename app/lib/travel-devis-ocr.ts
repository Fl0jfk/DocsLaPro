import {
  TextractClient,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
} from "@aws-sdk/client-textract";

function textractClient() {
  return new TextractClient({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });
}

export async function ocrS3Key(bucket: string, key: string): Promise<string> {
  const client = textractClient();
  const start = await client.send(
    new StartDocumentTextDetectionCommand({
      DocumentLocation: { S3Object: { Bucket: bucket, Name: key } },
    })
  );
  const jobId = start.JobId;
  if (!jobId) return "";
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await client.send(new GetDocumentTextDetectionCommand({ JobId: jobId }));
    if (res.JobStatus === "SUCCEEDED") {
      return (
        res.Blocks?.filter((b) => b.BlockType === "LINE")
          .map((b) => b.Text)
          .join(" ") || ""
      );
    }
    if (res.JobStatus === "FAILED") break;
  }
  return "";
}

export type DevisOcrMetadata = { price: string | null; company: string | null };

export async function extractDevisMetadataWithMistral(ocrText: string): Promise<DevisOcrMetadata> {
  if (!ocrText || !process.env.MISTRAL_API_KEY) {
    return { price: null, company: null };
  }
  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          {
            role: "system",
            content:
              "Tu analyses le texte OCR d'un devis de transport. Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, clés: montant_ttc (string ou null, ex: \"1 250,00 €\"), societe_emetrice (string ou null, nom de l'entreprise de transport qui émet le devis). Si une info est absente ou incertaine, mets null.",
          },
          { role: "user", content: `Texte:\n${ocrText.slice(0, 4000)}` },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    const parsed = JSON.parse(raw) as {
      montant_ttc?: string | null;
      societe_emetrice?: string | null;
    };
    const price =
      parsed.montant_ttc && String(parsed.montant_ttc).toLowerCase() !== "null"
        ? String(parsed.montant_ttc).trim()
        : null;
    const company =
      parsed.societe_emetrice && String(parsed.societe_emetrice).toLowerCase() !== "null"
        ? String(parsed.societe_emetrice).trim()
        : null;
    return { price: price || null, company: company || null };
  } catch {
    return { price: null, company: null };
  }
}
