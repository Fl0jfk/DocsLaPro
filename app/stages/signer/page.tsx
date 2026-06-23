"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type SignView = {
  convention: {
    studentName: string;
    className: string;
    companyName: string;
    period: string;
    scheduleSummary: string;
    hasPdf: boolean;
  };
  signature: {
    role: string;
    roleLabel: string;
    label: string;
    status: string;
    signedAt?: string;
    signedBy?: string;
  };
  stampsPdf: boolean;
  needsDrawnSignature: boolean;
  hasStoredReferentSignature: boolean;
  pdfUrl: string | null;
};

function SignatureCanvas({
  onChange,
}: {
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineTo(x, y);
    ctx.stroke();
    onChange(canvasRef.current?.toDataURL("image/png") ?? null);
  };

  const end = () => {
    drawing.current = false;
    onChange(canvasRef.current?.toDataURL("image/png") ?? null);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div>
      <p className="text-xs font-semibold text-stone-600 mb-2">Dessinez votre signature avec la souris ou le doigt</p>
      <canvas
        ref={canvasRef}
        width={400}
        height={120}
        className="w-full touch-none rounded-lg border-2 border-dashed border-stone-300 bg-white cursor-crosshair"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <button
        type="button"
        onClick={clear}
        className="mt-2 text-xs font-semibold text-stone-500 underline hover:text-stone-800"
      >
        Effacer
      </button>
    </div>
  );
}

function SignerContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [view, setView] = useState<SignView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signaturePng, setSignaturePng] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setError("Lien incomplet.");
      return;
    }
    const res = await fetch(`/api/stages/public/sign?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Lien invalide");
    setView(data);
    if (data.signature?.status === "signe") setDone(true);
  }, [token]);

  useEffect(() => {
    void load().catch((e: unknown) => setError(e instanceof Error ? e.message : "Erreur"));
  }, [load]);

  async function sign() {
    if (!view) return;
    if (view.needsDrawnSignature && !signaturePng && !view.hasStoredReferentSignature) {
      setError("Dessinez votre signature dans le cadre ci-dessous.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stages/public/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          signerName,
          signaturePngBase64: signaturePng || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      setDone(true);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (!view && !error) {
    return <main className="min-h-screen flex items-center justify-center p-6">Chargement…</main>;
  }

  if (error && !view) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-rose-700">{error}</p>
      </main>
    );
  }

  if (!view) return null;

  const isDirection = view.signature.role === "direction";

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-[#1F3D2B]">Signature convention de stage</h1>
        <p className="mt-2 text-sm text-stone-600">En tant que : {view.signature.roleLabel}</p>

        {view.stampsPdf && (
          <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            {isDirection
              ? "Votre signature enregistrée (direction) sera apposée directement sur le PDF — pas d'impression nécessaire."
              : view.hasStoredReferentSignature
                ? "Votre signature enregistrée sera apposée sur le PDF."
                : "Dessinez votre signature : elle sera intégrée au PDF de la convention."}
          </p>
        )}

        <div className="mt-6 rounded-xl bg-stone-50 p-4 text-sm space-y-2">
          <p>
            <strong>Élève :</strong> {view.convention.studentName} ({view.convention.className})
          </p>
          <p>
            <strong>Entreprise :</strong> {view.convention.companyName}
          </p>
          <p>
            <strong>Période :</strong> {view.convention.period}
          </p>
        </div>

        {view.pdfUrl && (
          <div className="mt-6">
            <p className="text-xs font-bold text-stone-600 mb-2">Aperçu du document</p>
            <iframe
              title="Convention PDF"
              src={view.pdfUrl}
              className="h-[420px] w-full rounded-lg border border-stone-200"
            />
          </div>
        )}

        {done ? (
          <p className="mt-6 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
            Signature enregistrée
            {view.signature.signedBy ? ` par ${view.signature.signedBy}` : ""}
            {view.stampsPdf ? " — paraphe ajouté sur le PDF." : "."}
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            <input
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              placeholder="Votre nom (ex. M. Dupont)"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
            />

            {view.needsDrawnSignature && (
              <SignatureCanvas onChange={setSignaturePng} />
            )}

            {error && <p className="text-sm text-rose-700">{error}</p>}
            <button
              type="button"
              disabled={busy}
              onClick={() => void sign()}
              className="w-full rounded-lg bg-[#2F6B4A] py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {view.stampsPdf ? "Signer et apposer sur le PDF" : "Signer la convention"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function StageSignerPage() {
  return (
    <Suspense fallback={<main className="p-8">Chargement…</main>}>
      <SignerContent />
    </Suspense>
  );
}
