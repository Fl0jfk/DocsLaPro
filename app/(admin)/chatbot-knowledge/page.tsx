"use client";

import { useState } from "react";

export default function ChatbotKnowledgePage() {
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [audience, setAudience] = useState<"public" | "private" | "both">("both");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const injectText = async (payloadText: string, payloadSource?: string) => {
    const res = await fetch("/api/chatbot/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: payloadText,
        source: payloadSource || source || "Saisie manuelle",
        audience,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur inconnue");
    return data;
  };

  const submitManual = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setStatus("Injection en cours...");
    try {
      const data = await injectText(text.trim());
      setStatus(`OK: ajouté dans ${data.file} (${data.domain})`);
      setText("");
    } catch (e) {
      setStatus(`Erreur: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const submitPdfWithOcr = async () => {
    if (!pdfFile) return;
    setLoading(true);
    setStatus("Upload PDF...");
    try {
      const up = await fetch("/api/agentIAOCR/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: pdfFile.name, contentType: pdfFile.type || "application/pdf" }),
      });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.error || "Erreur URL signée");

      const put = await fetch(upData.url, {
        method: "PUT",
        headers: { "Content-Type": pdfFile.type || "application/pdf" },
        body: pdfFile,
      });
      if (!put.ok) throw new Error("Erreur upload S3");

      setStatus("OCR en cours...");
      const start = await fetch("/api/agentIAOCR/ocr-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: upData.key }),
      });
      const startData = await start.json();
      if (!start.ok) throw new Error(startData.error || "Erreur lancement OCR");

      let extractedText = "";
      for (let i = 0; i < 30; i++) {
        const poll = await fetch("/api/agentIAOCR/ocr-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: startData.jobId }),
        });
        const pollData = await poll.json();
        if (pollData.text) {
          extractedText = pollData.text;
          break;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      if (!extractedText) throw new Error("OCR vide ou timeout");

      setStatus("Injection knowledge...");
      const data = await injectText(extractedText, `OCR PDF: ${pdfFile.name}`);
      setStatus(`OK PDF: ajouté dans ${data.file} (${data.domain})`);
      setPdfFile(null);
    } catch (e) {
      setStatus(`Erreur: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-slate-900 mb-2">Base IA (PDF/OCR)</h1>
      <p className="text-sm text-slate-600 mb-6">
        Injectez du texte ou des PDF. Le système classe automatiquement vers le bon JSON knowledge sur S3.
      </p>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
        <h2 className="font-bold mb-3">Injection texte</h2>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Source (ex: Circulaire voyage avril)"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm mb-3"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Collez ici le texte à injecter..."
          className="w-full min-h-[180px] rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
        <h2 className="font-bold mb-3">Injection PDF + OCR</h2>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
      </section>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium">Audience</label>
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value as "public" | "private" | "both")}
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="both">Public + privé</option>
          <option value="public">Public</option>
          <option value="private">Privé</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={submitManual}
          disabled={loading}
          className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          Injecter texte
        </button>
        <button
          type="button"
          onClick={submitPdfWithOcr}
          disabled={loading || !pdfFile}
          className="rounded-xl bg-sky-600 text-white px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          OCR + Injecter PDF
        </button>
      </div>

      {status ? <p className="mt-4 text-sm text-slate-700">{status}</p> : null}
    </main>
  );
}
