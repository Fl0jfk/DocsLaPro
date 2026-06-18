"use client";

import { useMemo, useState } from "react";
import {
  BILLING_OPTIONS,
  computePricing,
  formatEur,
  PRICE_PER_STUDENT_MONTHLY_EUR,
  type BillingMode,
} from "@/app/lib/pricing";

const PRESETS = [300, 500, 800, 1000, 1500] as const;

export default function PricingSimulator() {
  const [studentCount, setStudentCount] = useState(500);
  const [selectedMode, setSelectedMode] = useState<BillingMode>("monthly");

  const breakdown = useMemo(
    () => computePricing(studentCount, selectedMode),
    [studentCount, selectedMode],
  );

  return (
    <section className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-3xl border-2 border-emerald-200/80 bg-white p-6 shadow-xl shadow-emerald-900/10 md:p-8">
        <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-[#3D8A5C]">
          Simulateur
        </p>
        <p className="mt-1 text-center text-sm text-stone-600">
          Tarif de base :{" "}
          <strong className="text-[#2F6B4A]">
            {formatEur(PRICE_PER_STUDENT_MONTHLY_EUR, { decimals: 2 })} / élève / mois
          </strong>{" "}
          — tout inclus
        </p>

        <div className="mt-6">
          <label htmlFor="student-count" className="text-sm font-bold text-[#2F6B4A]">
            Nombre d&apos;élèves
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input
              id="student-count"
              type="number"
              min={0}
              max={10000}
              step={50}
              value={studentCount}
              onChange={(e) => setStudentCount(Math.max(0, Number(e.target.value) || 0))}
              className="w-32 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 px-4 py-2.5 text-lg font-black text-[#2F6B4A] outline-none focus:border-[#2F6B4A] focus:ring-2 focus:ring-[#4ADE80]/30"
            />
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStudentCount(n)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    studentCount === n
                      ? "bg-gradient-to-r from-[#2F6B4A] to-[#1E4A32] text-white shadow-md"
                      : "border border-emerald-200 bg-white text-stone-600 hover:border-[#2F6B4A] hover:text-[#2F6B4A]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={2000}
            step={50}
            value={Math.min(studentCount, 2000)}
            onChange={(e) => setStudentCount(Number(e.target.value))}
            className="mt-4 w-full accent-[#2F6B4A]"
            aria-label="Ajuster le nombre d'élèves"
          />
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {BILLING_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedMode(opt.mode)}
              className={`rounded-2xl border-2 px-3 py-3 text-left transition ${
                selectedMode === opt.mode
                  ? "border-[#2F6B4A] bg-emerald-50 ring-2 ring-[#4ADE80]/25"
                  : "border-emerald-100 bg-white hover:border-emerald-300"
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-[#3D8A5C]">
                {opt.badge}
              </span>
              <p className="mt-0.5 text-sm font-black text-[#14231A]">{opt.name}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#2F6B4A] to-[#1A3D2B] px-5 py-6 text-center text-white shadow-lg shadow-emerald-900/20">
          {studentCount === 0 ? (
            <p className="text-sm text-emerald-100/80">
              Indiquez un effectif pour voir l&apos;estimation.
            </p>
          ) : selectedMode === "monthly" ? (
            <>
              <p className="text-3xl font-black text-[#4ADE80] md:text-4xl">
                {formatEur(breakdown.monthlyTotal)}
                <span className="text-lg font-bold text-emerald-100/70"> / mois</span>
              </p>
              <p className="mt-2 text-sm text-emerald-100/90">
                Soit {formatEur(breakdown.annualTotal)} sur 12 mois ·{" "}
                {formatEur(breakdown.pricePerStudentYear, { decimals: 2 })} / élève / an
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-black text-[#4ADE80] md:text-4xl">
                {formatEur(breakdown.annualTotal)}
                <span className="text-lg font-bold text-emerald-100/70"> / an</span>
              </p>
              <p className="mt-2 text-sm text-emerald-100/90">
                −10 % · équivalent {formatEur(breakdown.monthlyTotal)} / mois ·{" "}
                {formatEur(breakdown.pricePerStudentYear, { decimals: 2 })} / élève / an
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
