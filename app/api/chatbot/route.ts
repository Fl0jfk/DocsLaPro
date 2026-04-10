import { NextResponse } from "next/server";
import { buildContextFromEntries, readKnowledgeDocument, readKnowledgeIndex, selectDomainByMessage } from "@/app/lib/knowledge";

export const runtime = "nodejs";

type ChatRequest = {
  message?: string;
  audience?: "public" | "private";
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

function sleep(ms: number) {return new Promise((resolve) => setTimeout(resolve, ms))}

async function fetchMistralWithRetry(body: unknown, attempts = 3) {
  let lastResponse: Response | null = null;
  for (let i = 0; i < attempts; i += 1) {
    const res = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return res;
    lastResponse = res;
    if (![429, 500, 502, 503, 504].includes(res.status) || i === attempts - 1) {
      return res;
    }
    await sleep(350 * (i + 1));
  }
  return lastResponse;
}
async function classifyDomainWithMistral(message: string, domains: Array<{ id: string; label: string }>) {
  if (!process.env.MISTRAL_API_KEY) return null;
  const domainList = domains.map((d) => `- ${d.id}: ${d.label}`).join("\n");
  const prompt =
    `Tu dois classer une question utilisateur dans UN SEUL domaine.\n` +
    `Réponds uniquement en JSON: {"domainId":"..."}\n` +
    `Domaine possibles:\n${domainList}\n\n` +
    `Question:\n${message}`;
  const res = await fetchMistralWithRetry({
      model: "mistral-small-latest",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
  if (!res) return null;
  if (!res.ok) return null;
  const data = await res.json();
  try {
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}") as { domainId?: string };
    return typeof parsed.domainId === "string" ? parsed.domainId.trim() : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest;
    const message = (body.message ?? "").trim();
    const wantsRequest = /\b(demande|ticket|requete|requête|support|incident)\b/i.test(message);
    const audience = body.audience === "private" ? "private" : "public";
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
    if (!message) { return NextResponse.json({ error: "message requis" }, { status: 400 });}
    const index = await readKnowledgeIndex();
    let domain = selectDomainByMessage(index.domains, message);
    const selectedByKeywords = domain;
    const mistralDomainId = await classifyDomainWithMistral( message, index.domains.map((d) => ({ id: d.id, label: d.label })));
    if (mistralDomainId) {
      const found = index.domains.find((d) => d.id === mistralDomainId);
      if (found) domain = found;
    }
    const text = message.toLowerCase();
    const keywordRanked = index.domains
      .map((d) => ({
        domain: d,
        score: d.keywords.reduce((acc, kw) => (text.includes(kw.toLowerCase()) ? acc + 1 : acc), 0),
      }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.domain);

    const selectedDomains: typeof index.domains = [];
    const pushUnique = (d?: (typeof index.domains)[number]) => {
      if (!d) return;
      if (selectedDomains.some((x) => x.id === d.id)) return;
      selectedDomains.push(d);
    };

    pushUnique(domain);
    pushUnique(keywordRanked[0]);
    pushUnique(keywordRanked[1]);
    pushUnique(keywordRanked[2]);

    const finalDomains = selectedDomains.slice(0, 3);
    const docs = await Promise.all(finalDomains.map((d) => readKnowledgeDocument(d.file)));
    const context = docs
      .map(
        (doc, i) =>
          `### Domaine: ${finalDomains[i].label}\n${buildContextFromEntries(finalDomains[i], doc, audience, 8, message, 90)}`
      )
      .join("\n\n");
    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({
        answer: "Le service IA n'est pas configuré (MISTRAL_API_KEY).",
        domain: domain.id,
        usedFile: domain.file,
      });
    }
    const historyText = history
      .map((m) => `${m.role === "user" ? "Utilisateur" : "Assistant"}: ${m.content}`)
      .join("\n");

    const prompt =
      `Tu es l'assistant de La Providence.\n` +
      `Réponds en français, de manière précise, utile et concise.\n` +
      `Tu dois t'appuyer UNIQUEMENT sur le contexte fourni (pas d'invention).\n\n` +
      `Règles de réponse:\n` +
      `1) Si l'information est présente, donne la réponse directement (pas de phrase inutile).\n` +
      `2) Si la question porte sur une personne/date/événement, cite explicitement les éléments clés (nom, classe, date, heure, statut).\n` +
      `3) Si le contexte contient d'autres éléments proches et pertinents, ajoute-les brièvement en complément.\n` +
      `4) N'écris "contactez l'établissement" QUE si l'information demandée est absente du contexte.\n` +
      `5) Ton: professionnel, clair, sans jargon.\n\n` +
      `Historique récent de la conversation:\n${historyText || "(aucun)"}\n\n` +
      `Contexte principal (${domain.label}) + domaines associés:\n${context}\n\n` +
      `Question utilisateur: ${message}`;
    const llm = await fetchMistralWithRetry({
        model: "mistral-small-latest",
        temperature: 0.2,
        messages: [
          { role: "system", content: "Assistant institutionnel, factuel, français." },
          { role: "user", content: prompt },
        ],
      });
    if (!llm) {
      return NextResponse.json(
        {
          answer:
            "Le service IA est temporairement indisponible. Réessaie dans quelques secondes.",
        },
        { status: 503 }
      );
    }
    if (!llm.ok) {
      if ([429, 500, 502, 503, 504].includes(llm.status)) {
        return NextResponse.json(
          {
            answer:
              "Le service IA est temporairement indisponible. Réessaie dans quelques secondes.",
          },
          { status: 503 }
        );
      }
      const err = await llm.text();
      return NextResponse.json({ error: `Erreur Mistral: ${err}` }, { status: llm.status });
    }
    const data = await llm.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();
    const withActionHint = wantsRequest
      ? `${answer || "Je n'ai pas pu formuler de réponse pour le moment."}\n\nSi vous souhaitez un suivi interne, utilisez le bouton "Créer une demande" dans le chatbot (nom, prénom, email, téléphone, sujet, détail).`
      : answer || "Je n'ai pas pu formuler de réponse pour le moment.";
    return NextResponse.json({
      answer: withActionHint,
      domain: domain.id,
      usedFile: domain.file,
      usedDomains: finalDomains.map((d) => ({ id: d.id, file: d.file, label: d.label })),
      fallbackFrom: selectedByKeywords.id !== domain.id ? selectedByKeywords.id : undefined,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}