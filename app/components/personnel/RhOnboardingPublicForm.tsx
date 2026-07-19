"use client";

import { useState } from "react";
import type { RhContractType } from "@/app/lib/rh/types";

const CONTRACT_OPTIONS: { value: RhContractType; label: string }[] = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "cddu", label: "CDDU" },
  { value: "interim", label: "Intérim" },
  { value: "stage", label: "Stage" },
  { value: "autre", label: "Autre" },
];

type Props = {
  token: string;
  schoolName: string;
  disabled?: boolean;
  onSuccess: () => void;
};

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-bold text-slate-700">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300";

export default function RhOnboardingPublicForm({ token, schoolName, disabled, onSuccess }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = String(fd.get(k) || "").trim();
      return v ? Number(v) : null;
    };
    const payload = {
      token,
      form: {
        firstName: String(fd.get("firstName") || "").trim(),
        lastName: String(fd.get("lastName") || "").trim(),
        birthName: String(fd.get("birthName") || "").trim() || null,
        email: String(fd.get("email") || "").trim(),
        phone: String(fd.get("phone") || "").trim() || null,
        phoneMobile: String(fd.get("phoneMobile") || "").trim() || null,
        birthDate: String(fd.get("birthDate") || "").trim(),
        birthPlace: String(fd.get("birthPlace") || "").trim(),
        birthDepartment: String(fd.get("birthDepartment") || "").trim() || null,
        nationality: String(fd.get("nationality") || "Française").trim(),
        gender: String(fd.get("gender") || "") || null,
        socialSecurityNumber: String(fd.get("socialSecurityNumber") || "").trim(),
        addressLine1: String(fd.get("addressLine1") || "").trim(),
        addressLine2: String(fd.get("addressLine2") || "").trim() || null,
        postalCode: String(fd.get("postalCode") || "").trim(),
        city: String(fd.get("city") || "").trim(),
        country: String(fd.get("country") || "France").trim(),
        maritalStatus: String(fd.get("maritalStatus") || "").trim() || null,
        childrenCount: num("childrenCount"),
        iban: String(fd.get("iban") || "").trim() || null,
        bic: String(fd.get("bic") || "").trim() || null,
        emergencyContactName: String(fd.get("emergencyContactName") || "").trim() || null,
        emergencyContactPhone: String(fd.get("emergencyContactPhone") || "").trim() || null,
        contractType: String(fd.get("contractType") || "cdi"),
        jobTitle: String(fd.get("jobTitle") || "").trim(),
        etablissement: String(fd.get("etablissement") || "").trim() || null,
        contractStartDate: String(fd.get("contractStartDate") || "").trim(),
        contractEndDate: String(fd.get("contractEndDate") || "").trim() || null,
        workTimePercent: num("workTimePercent") ?? 100,
        classification: String(fd.get("classification") || "").trim() || null,
        coefficient: String(fd.get("coefficient") || "").trim() || null,
        grossMonthlySalary: String(fd.get("grossMonthlySalary") || "").trim() || null,
        notes: String(fd.get("notes") || "").trim() || null,
      },
    };

    try {
      const res = await fetch("/api/rh/onboarding/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Envoi impossible");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <p className="text-sm text-slate-600">
        {schoolName} — renseignements pour votre dossier administratif et votre contrat.
      </p>

      <section className="space-y-4">
        <h2 className="font-black text-slate-900">Identité</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Prénom" required>
            <input name="firstName" required className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Nom" required>
            <input name="lastName" required className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Nom de naissance">
            <input name="birthName" className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Date de naissance" required>
            <input name="birthDate" type="date" required className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Ville de naissance" required>
            <input name="birthPlace" required className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Département de naissance">
            <input name="birthDepartment" className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Nationalité">
            <input name="nationality" defaultValue="Française" className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Sexe">
            <select name="gender" className={inputClass} disabled={disabled || busy}>
              <option value="">—</option>
              <option value="F">Féminin</option>
              <option value="M">Masculin</option>
              <option value="autre">Autre</option>
            </select>
          </Field>
          <Field label="N° sécurité sociale" required>
            <input name="socialSecurityNumber" required className={inputClass} disabled={disabled || busy} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-black text-slate-900">Coordonnées</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="E-mail" required>
            <input name="email" type="email" required className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Téléphone fixe">
            <input name="phone" className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Téléphone mobile">
            <input name="phoneMobile" className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Adresse" required>
            <input name="addressLine1" required className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Complément d'adresse">
            <input name="addressLine2" className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Code postal" required>
            <input name="postalCode" required className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Ville" required>
            <input name="city" required className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Pays">
            <input name="country" defaultValue="France" className={inputClass} disabled={disabled || busy} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-black text-slate-900">Contrat & poste</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Intitulé du poste" required>
            <input name="jobTitle" required className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Type de contrat" required>
            <select name="contractType" required className={inputClass} disabled={disabled || busy}>
              {CONTRACT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date d'entrée" required>
            <input name="contractStartDate" type="date" required className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Date de fin (CDD)">
            <input name="contractEndDate" type="date" className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Établissement">
            <input name="etablissement" className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Temps de travail (%)">
            <input name="workTimePercent" type="number" min={1} max={100} defaultValue={100} className={inputClass} disabled={disabled || busy} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-black text-slate-900">Banque & urgence</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="IBAN">
            <input name="iban" className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="BIC">
            <input name="bic" className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Contact d'urgence — nom">
            <input name="emergencyContactName" className={inputClass} disabled={disabled || busy} />
          </Field>
          <Field label="Contact d'urgence — téléphone">
            <input name="emergencyContactPhone" className={inputClass} disabled={disabled || busy} />
          </Field>
        </div>
      </section>

      {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={disabled || busy}
        className="w-full sm:w-auto rounded-xl bg-indigo-600 text-white font-bold px-6 py-3 hover:bg-indigo-700 disabled:opacity-50"
      >
        {busy ? "Envoi…" : "Envoyer mon dossier"}
      </button>
    </form>
  );
}
