/**
 * Lambda déclenchée par EventBridge (ex. rate(2 hours) ou rate(1 hour)).
 * Variables d'environnement requises :
 * - GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
 * - S3_BUCKET (même bucket que l'app, ex. docslapro)
 * - INGEST_URL (https://votredomaine.com/api/travels/ingest-from-email)
 * - INGEST_SECRET (identique à TRAVEL_EMAIL_INGEST_SECRET côté Amplify)
 * Rôle IAM : s3:PutObject sur arn:...:bucket/name/devis-incoming/*
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { google } from "googleapis";

const s3 = new S3Client({});

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/x-pdf",
  "application/octet-stream",
]);

function isPdfName(name) {
  return typeof name === "string" && /\.pdf$/i.test(name);
}

function collectAttachmentsFromPayload(payload, out) {
  if (!payload) return;
  const fn = payload.filename;
  const aid = payload.body?.attachmentId;
  const mime = payload.mimeType || "";
  if (fn && aid) {
    const okMime = ALLOWED_MIME.has(mime) || (mime === "application/octet-stream" && isPdfName(fn));
    if (okMime && isPdfName(fn)) {
      out.push({ filename: fn, attachmentId: aid, mimeType: mime || "application/pdf" });
    }
  }
  if (payload.parts && Array.isArray(payload.parts)) {
    for (const p of payload.parts) {
      collectAttachmentsFromPayload(p, out);
    }
  }
}

function decodeAttachmentData(data) {
  if (!data) return Buffer.alloc(0);
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

function buildOAuth() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail OAuth: variables GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN requises");
  }
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, "urn:ietf:wg:oauth:2.0:oob");
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

export async function handler() {
  const bucket = process.env.S3_BUCKET;
  const ingestUrl = process.env.INGEST_URL;
  const ingestSecret = process.env.INGEST_SECRET;
  if (!bucket || !ingestUrl || !ingestSecret) {
    throw new Error("S3_BUCKET, INGEST_URL et INGEST_SECRET requis");
  }

  const auth = buildOAuth();
  const gmail = google.gmail({ version: "v1", auth });

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread",
    maxResults: 20,
  });

  const messages = listRes.data.messages || [];
  const summary = { scanned: messages.length, processed: 0, errors: [] };

  for (const { id: messageId } of messages) {
    let allOk = true;
    try {
      const full = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });
      const headers = full.data.payload?.headers || [];
      const getHeader = (name) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
      const subject = getHeader("Subject");
      const fromRaw = getHeader("From");
      const fromEmail =
        (fromRaw.match(/<([^>]+)>/) || [, fromRaw])[1]?.trim() || fromRaw.trim();
      const snippet = full.data.snippet || "";

      const attachments = [];
      collectAttachmentsFromPayload(full.data.payload, attachments);
      if (attachments.length === 0) {
        continue;
      }

      for (const att of attachments) {
        const attRes = await gmail.users.messages.attachments.get({
          userId: "me",
          messageId,
          id: att.attachmentId,
        });
        const buf = decodeAttachmentData(attRes.data.data);
        if (buf.length === 0) {
          allOk = false;
          summary.errors.push({ messageId, file: att.filename, err: "pièce vide" });
          break;
        }

        const safeName = att.filename
          .replace(/[/\\]/g, "_")
          .replace(/\s+/g, "_")
          .replace(/\.\./g, "_");
        const s3Key = `devis-incoming/${messageId}/${att.attachmentId}_${safeName}`;

        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: s3Key,
            Body: buf,
            ContentType: "application/pdf",
          })
        );

        const res = await fetch(ingestUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-travel-email-ingest-secret": ingestSecret,
          },
          body: JSON.stringify({
            s3Key,
            fromEmail,
            subject,
            snippet,
            gmailMessageId: messageId,
            originalFilename: att.filename,
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          allOk = false;
          summary.errors.push({
            messageId,
            file: att.filename,
            err: `ingest ${res.status}: ${text.slice(0, 200)}`,
          });
          break;
        }
      }

      if (allOk) {
        await gmail.users.messages.modify({
          userId: "me",
          id: messageId,
          requestBody: { removeLabelIds: ["UNREAD"] },
        });
        summary.processed += 1;
      }
    } catch (e) {
      summary.errors.push({ messageId, err: String(e?.message || e) });
    }
  }

  return { statusCode: 200, body: JSON.stringify(summary) };
}
