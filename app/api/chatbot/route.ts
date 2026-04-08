import { NextResponse } from "next/server";
import { buildContextFromEntries, readKnowledgeDocument, readKnowledgeIndex, selectDomainByMessage } from "@/app/lib/knowledge";

export const runtime = "nodejs";

type ChatRequest = {
  message?: string;
  audience?: "public" | "private";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest;
    const message = (body.message ?? "").trim();
    const audience = body.audience === "private" ? "private" : "public";
    if (!message) { return NextResponse.json({ error: "message requis" }, { status: 400 });}
    const index = await readKnowledgeIndex();
    const domain = selectDomainByMessage(index.domains, message);
    const doc = await readKnowledgeDocument(domain.file);
    const context = buildContextFromEntries(doc, audience);
    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({
        answer: "Le service IA n'est pas configuré (MISTRAL_API_KEY).",
        domain: domain.id,
        usedFile: domain.file,
      });
    }
    const prompt = `Tu es l'assistant de La Providence. Réponds en français, clairement, sans inventer.\n` +
      `Tu dois t'appuyer uniquement sur le contexte fourni.\n` +
      `Si l'information n'est pas dans le contexte, dis-le explicitement et propose de contacter l'établissement.\n\n` +
      `Contexte (${domain.label}) :\n${context}\n\nQuestion utilisateur: ${message}`;
    const llm = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.2,
        messages: [
          { role: "system", content: "Assistant institutionnel, factuel, français." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!llm.ok) {
      const err = await llm.text();
      return NextResponse.json({ error: `Erreur Mistral: ${err}` }, { status: llm.status });
    }
    const data = await llm.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({
      answer: answer || "Je n'ai pas pu formuler de réponse pour le moment.",
      domain: domain.id,
      usedFile: domain.file,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}