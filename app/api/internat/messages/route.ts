import { NextResponse } from "next/server";
import { requireInternatAccess, requireInternatManage } from "@/app/api/internat/_auth";
import { getInternatMessages, saveInternatMessages } from "@/app/lib/internat-storage";
import { newId, type InternatMessage } from "@/app/lib/internat-types";

const AUDIENCES = ["equipe", "direction", "cpe", "surveillants"] as const;

export async function GET() {
  const access = await requireInternatAccess();
  if (!access.ok) return access.response;
  const messages = (await getInternatMessages()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;
  const body = await req.json().catch(() => ({}));
  const subject = String(body.subject || "").trim();
  const text = String(body.body || "").trim();
  const audience = AUDIENCES.includes(body.audience) ? body.audience : "equipe";
  if (!subject || !text) {
    return NextResponse.json({ error: "Sujet et message requis." }, { status: 400 });
  }
  const message: InternatMessage = {
    id: newId("msg"),
    threadId: String(body.threadId || newId("thr")),
    subject,
    body: text,
    audience,
    createdAt: new Date().toISOString(),
    createdBy: { userId: access.userId, name: access.userName },
  };
  const messages = await getInternatMessages();
  messages.push(message);
  await saveInternatMessages(messages);
  return NextResponse.json({ message, messages });
}

export async function DELETE(req: Request) {
  const access = await requireInternatManage();
  if (!access.ok) return access.response;
  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") || "");
  const messages = (await getInternatMessages()).filter((m) => m.id !== id);
  await saveInternatMessages(messages);
  return NextResponse.json({ ok: true, messages });
}
