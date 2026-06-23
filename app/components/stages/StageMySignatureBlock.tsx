"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function StageMySignatureBlock() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stages/my-signature", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setHasSignature(Boolean(j.hasSignature)))
      .catch(() => undefined);
  }, []);

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
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const res = await fetch("/api/stages/my-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signaturePngBase64: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      setHasSignature(true);
      setMsg("Signature enregistrée — elle sera réutilisée sur les conventions de stage.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-violet-200 bg-violet-50/50 p-5">
      <h2 className="text-lg font-bold text-[#1F3D2B]">Ma signature (professeur principal)</h2>
      <p className="mt-1 text-sm text-stone-600 max-w-2xl">
        Enregistrez-la une fois : elle sera apposée automatiquement sur le PDF quand vous signerez une
        convention par e-mail. Sinon, vous pourrez la dessiner à la volée sur le lien de signature.
      </p>
      {hasSignature && (
        <p className="mt-2 text-xs font-semibold text-emerald-800">✓ Signature déjà enregistrée</p>
      )}
      <canvas
        ref={canvasRef}
        width={400}
        height={100}
        className="mt-4 w-full max-w-md touch-none rounded-lg border border-dashed border-violet-300 bg-white cursor-crosshair"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={clear}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700"
        >
          Effacer
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-lg bg-violet-700 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Enregistrement…" : "Enregistrer ma signature"}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-emerald-800">{msg}</p>}
      {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
    </section>
  );
}
