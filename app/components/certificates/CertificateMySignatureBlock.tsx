"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function CertificateMySignatureBlock() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/certificates/my-signature", { cache: "no-store" })
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
    ctx.lineWidth = 1.6;
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
      const res = await fetch("/api/certificates/my-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signaturePngBase64: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      setHasSignature(true);
      setMsg("Paraphe enregistré — il sera réutilisé sur tous vos certificats.");
      clear();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <div>
        <p className="text-sm font-black text-slate-900">Mon paraphe (certificats)</p>
        <p className="text-xs text-slate-600 mt-1">
          Dessinez votre signature une fois. Elle sera apposée automatiquement sur les certificats que vous signez.
        </p>
        {hasSignature && (
          <p className="text-xs font-bold text-emerald-700 mt-2">Paraphe déjà enregistré sur le serveur.</p>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={160}
        className="w-full max-w-lg border border-dashed border-slate-300 rounded-xl bg-slate-50 touch-none cursor-crosshair"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={clear}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
        >
          Effacer le canvas
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
        >
          {busy ? "Enregistrement…" : "Enregistrer mon paraphe"}
        </button>
      </div>
      {msg && <p className="text-sm text-emerald-700 font-medium">{msg}</p>}
      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
    </div>
  );
}
