"use client";

import { useEffect, useState } from "react";
import type { InternatAlert, InternatStudent } from "@/app/lib/internat-types";
import { studentDisplayName } from "@/app/lib/internat-types";

export default function InternatAlertsPanel() {
  const [alerts, setAlerts] = useState<InternatAlert[]>([]);
  const [students, setStudents] = useState<InternatStudent[]>([]);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState<"info" | "urgent" | "critique">("urgent");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [aRes, sRes] = await Promise.all([
      fetch("/api/internat/alerts"),
      fetch("/api/internat/students"),
    ]);
    const aData = await aRes.json();
    const sData = await sRes.json();
    if (aRes.ok) setAlerts(aData.alerts || []);
    if (sRes.ok) setStudents((sData.students || []).filter((s: InternatStudent) => s.actif));
  };

  useEffect(() => {
    void load();
  }, []);

  const send = async () => {
    if (!message.trim()) return alert("Message requis.");
    if (!confirm("Envoyer l'alerte immédiatement aux destinataires configurés ?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/internat/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, location, severity, studentIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Envoi impossible");
      setMessage("");
      setLocation("");
      setStudentIds([]);
      await load();
      alert(data.mail?.sent ? "Alerte envoyée." : "Alerte enregistrée mais mail non envoyé (SMTP / destinataires).");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const toggleStudent = (id: string) => {
    setStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 space-y-3">
        <h3 className="font-black text-red-900">Alerte urgence</h3>
        <select className="border rounded-xl px-3 py-2 text-sm w-full sm:w-auto" value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)}>
          <option value="info">Info</option>
          <option value="urgent">Urgent</option>
          <option value="critique">Critique</option>
        </select>
        <input className="border rounded-xl px-3 py-2 text-sm w-full" placeholder="Lieu (optionnel)" value={location} onChange={(e) => setLocation(e.target.value)} />
        <textarea className="border rounded-xl px-3 py-2 text-sm w-full" rows={4} placeholder="Description de l'incident" value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className="max-h-32 overflow-y-auto border border-red-100 rounded-xl p-2 bg-white text-sm space-y-1">
          {students.map((s) => (
            <label key={s.id} className="flex items-center gap-2">
              <input type="checkbox" checked={studentIds.includes(s.id)} onChange={() => toggleStudent(s.id)} />
              {studentDisplayName(s)}
            </label>
          ))}
        </div>
        <button type="button" disabled={busy} onClick={send} className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm">
          Envoyer l&apos;alerte maintenant
        </button>
      </div>

      <section>
        <h3 className="font-black text-slate-900 mb-3">Journal des alertes</h3>
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="bg-white border border-slate-200 rounded-xl p-4 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-bold uppercase text-xs text-red-700">{a.severity}</span>
                <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString("fr-FR")}</span>
              </div>
              <p className="mt-1 text-slate-800">{a.message}</p>
              {a.location && <p className="text-xs text-slate-500 mt-1">Lieu : {a.location}</p>}
              <p className="text-xs text-slate-500 mt-1">Par {a.createdBy.name}{a.sentAt ? " · mail envoyé" : ""}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
