import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { appendEntryToKnowledgeFile, readKnowledgeIndex, selectDomainByMessage } from "@/app/lib/knowledge";

export const runtime = "nodejs";

type IngestRequest = {
  text?: string;
  source?: string;
  audience?: "public" | "private" | "both";
};

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any);
    if (!userId) {  return NextResponse.json({ error: "Non autorisé" }, { status: 401 })}
    const body = (await req.json()) as IngestRequest;
    const text = (body.text ?? "").trim();
    if (!text) { return NextResponse.json({ error: "text requis" }, { status: 400 })}
    const index = await readKnowledgeIndex();
    const chosenDomain = selectDomainByMessage(index.domains, text);
    const audience: Array<"public" | "private"> = body.audience === "public" ? ["public"] : body.audience === "private" ? ["private"] : ["public", "private"];
    let title = `Ajout ${new Date().toLocaleDateString("fr-FR")}`;
    let content = text.slice(0, 1800);
    if (process.env.MISTRAL_API_KEY) {
      const prompt = `Tu dois transformer un texte OCR en fiche de connaissance JSON.\n` +
        `Réponds strictement en JSON: {"title":"...","content":"..."}\n` +
        `Le titre doit être court. Le contenu doit être clair, en français, factuel.\n\nTexte:\n${text}`;
      const llm = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (llm.ok) {
        const data = await llm.json();
        const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}") as { title?: string; content?: string };
        title = (parsed.title ?? title).trim();
        content = (parsed.content ?? content).trim();
      }
    }
    await appendEntryToKnowledgeFile(chosenDomain.file, {
      title,
      content,
      source: body.source?.trim() || "Upload admin OCR",
      audiences: audience,
    });

    return NextResponse.json({
      ok: true,
      domain: chosenDomain.id,
      file: chosenDomain.file,
      title,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}