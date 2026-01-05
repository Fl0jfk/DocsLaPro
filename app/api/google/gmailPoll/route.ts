/*
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.BUCKET_NAME!;
const FILE_KEY = "tokensGoogle.json";
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

// mapping catégorie -> plan/bucket Planner (IDs à mettre en env ou en dur)
const PLANS_BY_CATEGORY: Record<string, { planId: string; bucketId: string }> =
  {
    COMPTA: {
      planId: process.env.PLANNER_PLAN_COMPTA_ID || "PLAN_COMPTA_ID",
      bucketId: process.env.PLANNER_BUCKET_COMPTA_ID || "BUCKET_COMPTA_ID",
    },
    ADMIN: {
      planId: process.env.PLANNER_PLAN_ADMIN_ID || "PLAN_ADMIN_ID",
      bucketId: process.env.PLANNER_BUCKET_ADMIN_ID || "BUCKET_ADMIN_ID",
    },
    CPE: {
      planId: process.env.PLANNER_PLAN_CPE_ID || "PLAN_CPE_ID",
      bucketId: process.env.PLANNER_BUCKET_CPE_ID || "BUCKET_CPE_ID",
    },
    VIE_SCOLAIRE: {
      planId:
        process.env.PLANNER_PLAN_VIE_SCOLAIRE_ID || "PLAN_VIE_SCOLAIRE_ID",
      bucketId:
        process.env.PLANNER_BUCKET_VIE_SCOLAIRE_ID ||
        "BUCKET_VIE_SCOLAIRE_ID",
    },
    DIRECTION: {
      planId: process.env.PLANNER_PLAN_DIRECTION_ID || "PLAN_DIRECTION_ID",
      bucketId:
        process.env.PLANNER_BUCKET_DIRECTION_ID || "BUCKET_DIRECTION_ID",
    },
  };

async function readTokens() {
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: FILE_KEY });
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    const res = await fetch(url);
    if (!res.ok) return {};
    return await res.json();
  } catch (err) {
    console.error("Erreur lecture JSON S3 :", err);
    return {};
  }
}

async function callAIForRouting(from: string, subject: string, text: string) {
  const extractionPrompt = `
Tu es l'assistant d'un établissement scolaire.

À partir de l'email suivant, retourne un JSON STRICTEMENT de la forme :
{
  "category": "COMPTA | ADMIN | CPE | VIE_SCOLAIRE | DIRECTION",
  "summary": "résumé très court en une phrase"
}

Email :
De: ${from}
Sujet: ${subject}
Contenu: ${text}
`;

  const extractionResponse = await fetch(
    "https://api.mistral.ai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: [{ role: "user", content: extractionPrompt }],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    },
  );

  if (!extractionResponse.ok) {
    throw new Error(`Mistral error: ${extractionResponse.status}`);
  }

  const data = await extractionResponse.json();
  const content = data.choices[0].message.content as string;
  const parsed = JSON.parse(content);

  return {
    category: parsed.category as string,
    summary: parsed.summary as string,
  };
}

// création de tâche Planner à partir d’un mail
async function createPlannerTaskFromEmail(params: {
  accessToken: string;
  planId: string;
  bucketId: string;
  subject: string;
  from: string;
  summary: string;
  text: string;
}) {
  const { accessToken, planId, bucketId, subject, from, summary, text } =
    params;

  const title = `${subject}`.slice(0, 250);
  const description = (
    `Mail de: ${from}\n\nRésumé IA:\n${summary}\n\nContenu:\n${text}`
  ).slice(0, 8000);

  const taskRes = await fetch(`${GRAPH_BASE}/planner/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      planId,
      bucketId,
      title,
    }),
  });

  if (!taskRes.ok) {
    const errText = await taskRes.text();
    console.error("Erreur création tâche Planner", errText);
    throw new Error("Erreur création tâche Planner");
  }

  const task = await taskRes.json();
  const taskId = task.id as string;
  const etag = task["@odata.etag"] as string | undefined;

  if (etag) {
    const detailsRes = await fetch(
      `${GRAPH_BASE}/planner/tasks/${taskId}/details`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "If-Match": etag,
        },
        body: JSON.stringify({
          description,
        }),
      },
    );

    if (!detailsRes.ok) {
      const errText = await detailsRes.text();
      console.error("Erreur mise à jour détails Planner", errText);
    }
  }

  return { taskId };
}

// 🔁 maintenant en POST et on attend graphAccessToken dans le body
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const graphAccessToken = body.graphAccessToken as string | undefined;

    if (!graphAccessToken) {
      return NextResponse.json(
        { ok: false, error: "graphAccessToken manquant" },
        { status: 400 },
      );
    }

    const tokens = await readTokens();
    const email = process.env.GOOGLE_ACCOUNT_EMAIL!;
    const userTokens = (tokens as any)[email];

    if (!userTokens?.refreshToken) {
      return NextResponse.json(
        { ok: false, error: "Aucun refreshToken trouvé pour cet email" },
        { status: 400 },
      );
    }

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    oAuth2Client.setCredentials({
      refresh_token: userTokens.refreshToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
      maxResults: 10,
    });

    const messages = listRes.data.messages || [];
    const results: any[] = [];

    for (const msg of messages) {
      if (!msg.id) continue;

      const full = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "FULL",
      });

      const payload = full.data.payload;
      const headers = payload?.headers || [];
      const from = headers.find((h) => h.name === "From")?.value || "";
      const subject = headers.find((h) => h.name === "Subject")?.value || "";

      let text = "";
      if (payload?.parts) {
        const part = payload.parts.find((p) => p.mimeType === "text/plain");
        if (part?.body?.data) {
          text = Buffer.from(part.body.data, "base64").toString("utf8");
        }
      } else if (payload?.body?.data) {
        text = Buffer.from(payload.body.data, "base64").toString("utf8");
      }

      const { category, summary } = await callAIForRouting(from, subject, text);

      const mapping = PLANS_BY_CATEGORY[category] ?? PLANS_BY_CATEGORY.ADMIN;

      try {
        await createPlannerTaskFromEmail({
          accessToken: graphAccessToken,
          planId: mapping.planId,
          bucketId: mapping.bucketId,
          subject,
          from,
          summary,
          text,
        });
      } catch (e) {
        console.error(
          `Erreur Planner pour le mail ${msg.id} (${subject})`,
          e,
        );
      }

      await gmail.users.messages.modify({
        userId: "me",
        id: msg.id,
        requestBody: {
          removeLabelIds: ["UNREAD"],
        },
      });

      results.push({ id: msg.id, from, subject, category, summary });
    }

    return NextResponse.json({ ok: true, count: results.length, emails: results });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error while polling Gmail" },
      { status: 500 },
    );
  }
}
*/