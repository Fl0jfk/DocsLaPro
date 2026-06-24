"use client";

import { useMemo, useState } from "react";
import RentreePublicHeader from "@/app/components/RentreePublicHeader";
import { SCHOOL } from "@/app/lib/school";
import type { FournituresToolConfig } from "@/app/lib/fournitures-types";
import {
  dedupeStrings,
  formatChildLabel,
  getChildSupplies,
  type CollegeNiveau,
  type EcoleNiveau,
  type FournituresChild,
  type LangueSeconde,
  type LyceeNiveau,
  type LyceeOption,
  type LyceeSpecialite,
  type LyceeTrack,
  type Stage,
} from "@/app/lib/fournitures-engine";

const DEFAULT_ARBS_URL =
  "https://scola-image.s3.eu-west-3.amazonaws.com/rentree/Flyer-ARBS.pdf";

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

type Child = FournituresChild;
type Props = { config: FournituresToolConfig };

export default function SimulateurFournituresClient({ config }: Props) {
  return <SimulateurFournituresContent config={config} />;
}

function SimulateurFournituresContent({ config }: { config: FournituresToolConfig }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("college");
  const [ecoleNiveau, setEcoleNiveau] = useState<EcoleNiveau>("CP");
  const [collegeNiveau, setCollegeNiveau] = useState<CollegeNiveau>("6e");
  const [collegeLangue, setCollegeLangue] = useState<LangueSeconde>("Allemand");
  const [collegeBilingueAllemand, setCollegeBilingueAllemand] = useState(false);
  const [collegeLatin, setCollegeLatin] = useState(false);
  const [collegeOse, setCollegeOse] = useState(false);
  const [collegeLceAnglais, setCollegeLceAnglais] = useState(false);
  const [lyceeNiveau, setLyceeNiveau] = useState<LyceeNiveau>("2nde");
  const [lyceeTrack, setLyceeTrack] = useState<LyceeTrack>("General");
  const [lyceeLangue, setLyceeLangue] = useState<LangueSeconde>("Allemand");
  const [lyceeAnglaisEuro, setLyceeAnglaisEuro] = useState(false);
  const [lyceeLatin, setLyceeLatin] = useState(false);
  const [lyceeSpecs, setLyceeSpecs] = useState<LyceeSpecialite[]>(["Maths"]);
  const [lyceeOptions, setLyceeOptions] = useState<LyceeOption[]>([]);
  const lyceeSpecOptions: LyceeSpecialite[] = ["Maths", "Physique-Chimie", "SVT", "SES", "HG-GEO-GEOPOL", "Sc.Phy-Sc.Info"];
  const lyceeOptionOptions: LyceeOption[] = ["Maths Complémentaires", "Maths Expertes"];
  const computed = useMemo(() => {
    const withSupplies = children.map((c) => {
      const supplies = getChildSupplies(c, config.profiles);
      return { child: c, supplies };
    });
    const allItems = withSupplies.flatMap((x) => x.supplies.flatMap((s) => s.items));
    const allDedupe = dedupeStrings(allItems);
    const suppliesByChild = Object.fromEntries(withSupplies.map((x) => [x.child.id, x.supplies]));
    return { withSupplies, allItems, allDedupe, suppliesByChild };
  }, [children, config.profiles]);
  const resetAddForm = () => {
    setStage("college");
    setEcoleNiveau("CP");
    setCollegeNiveau("6e");
    setCollegeLangue("Allemand");
    setCollegeBilingueAllemand(false);
    setCollegeLatin(false);
    setCollegeOse(false);
    setCollegeLceAnglais(false);
    setLyceeNiveau("2nde");
    setLyceeTrack("General");
    setLyceeLangue("Allemand");
    setLyceeAnglaisEuro(false);
    setLyceeLatin(false);
    setLyceeSpecs(["Maths"]);
    setLyceeOptions([]);
  };
  const addChild = () => {
    if (stage === "ecole") {
      setChildren((prev) => [...prev, { id: uid(), stage: "ecole", niveau: ecoleNiveau }]);
      setShowAdd(false);
      return;
    }
    if (stage === "college") {
      const safeLangue: LangueSeconde = collegeNiveau === "6e" ? "Allemand" : collegeLangue;
      const safeLatin = collegeNiveau === "6e" ? false : collegeLatin;
      const safeOse = collegeNiveau === "3e" ? collegeOse : false;
      const safeLceAnglais = collegeNiveau === "5e" || collegeNiveau === "4e" || collegeNiveau === "3e" ? collegeLceAnglais : false;
      setChildren((prev) => [
        ...prev,
        {
          id: uid(),
          stage: "college",
          niveau: collegeNiveau,
          langue: safeLangue,
          optionBilingueAllemand: collegeBilingueAllemand,
          optionLatin: safeLatin,
          optionOse: safeOse,
          optionLceAnglais: safeLceAnglais,
        },
      ]);
      setShowAdd(false);
      return;
    }
    const maxSpecs = lyceeNiveau === "Terminale" ? 2 : lyceeNiveau === "1re" ? 3 : 0;
    const specs = maxSpecs === 0 ? [] : lyceeSpecs.slice(0, maxSpecs);
    const safeOptions = (lyceeNiveau === "Terminale" && lyceeTrack === "General") ? lyceeOptions : [];
    const safeLatin = lyceeTrack === "General" && (lyceeNiveau === "1re" || lyceeNiveau === "Terminale") ? lyceeLatin : false;
    setChildren((prev) => [
      ...prev,
      {
        id: uid(),
        stage: "lycee",
        niveau: lyceeNiveau,
        track: lyceeTrack,
        langue: lyceeLangue,
        anglaisEuro: lyceeAnglaisEuro,
        latin: safeLatin,
        specialites: specs,
        options: safeOptions,
      },
    ]);
    setShowAdd(false);
  };
  const removeChild = (id: string) => { setChildren((prev) => prev.filter((c) => c.id !== id))};
  const sendByEmail = async () => {
    setEmailError(null);
    setEmailSuccess(null);
    const target = email.trim();
    if (children.length === 0) {
      setEmailError("Ajoutez au moins un enfant.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setEmailError("Adresse email invalide.");
      return;
    }
    try {
      setSendingEmail(true);
      const res = await fetch("/api/supplies/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: target,
          children,
          suppliesByChild: computed.suppliesByChild,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEmailError(data?.error || "Échec de l'envoi.");
        return;
      }
      setEmailSuccess("Email envoyé (PDF en pièce jointe).");
    } catch (e: any) {
      setEmailError(e?.message || "Échec de l'envoi.");
    } finally {
      setSendingEmail(false);
    }
  };
  return (
    <>
      <RentreePublicHeader />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-6 md:p-10">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="min-w-[240px]">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-900">{config.title}</h2>
              <p className="text-sm font-bold text-blue-600 mt-2">{SCHOOL.shortName} • Rentrée {config.schoolYear}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (children.length === 0) return alert("Ajoutez au moins un enfant.");
                  window.print();
                }}
                className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 transition print:hidden"
              >
                🖨️ Imprimer
              </button>
              <button
                onClick={() => {
                  setEmailError(null);
                  setEmailSuccess(null);
                  setShowEmail(true);
                }}
                className="bg-white text-indigo-700 border border-indigo-200 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition print:hidden"
              >
                ✉️ Envoyer par email
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vos enfants</p>
                <div className="mt-3 space-y-3">
                  {children.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Aucun enfant ajouté pour le moment.</p>
                  ) : (
                    children.map((c) => (
                      <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-800 text-sm">{formatChildLabel(c)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeChild(c.id)}
                            className="text-red-500 font-black px-2 py-1 rounded-lg hover:bg-red-50"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setShowAdd(true)}
                  className="mt-4 w-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-black px-4 py-3 rounded-2xl hover:bg-indigo-100 transition print:hidden"
                >
                  + Ajouter un enfant
                </button>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Détails par enfant</p>
                <div className="mt-4 space-y-6">
                  {computed.withSupplies.map(({ child, supplies }) => (
                    <div key={child.id} className="border border-slate-100 rounded-2xl p-4">
                      <h3 className="font-black text-slate-900 text-sm">{formatChildLabel(child)}</h3>
                      {child.stage === "lycee" && (
                        <a
                          href={config.arbsPdfUrl || DEFAULT_ARBS_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 mb-3 inline-flex items-center gap-2 bg-pink-50 border border-pink-200 text-pink-700 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full hover:bg-pink-100 transition print:hidden"
                        >
                          <span>📚</span>
                          <span>Partenariat ARBS — Location de manuels</span>
                          <span className="text-pink-400">→ Flyer PDF</span>
                        </a>
                      )}
                      <div className="mt-3 space-y-4">
                        {supplies.map((sec, i) => (
                          <div key={`${sec.title}_${i}`}>
                            <p className="text-[11px] font-black uppercase tracking-widest text-indigo-700">{sec.title}</p>
                            <ul className="mt-2 space-y-1">
                              {sec.items.map((it, idx) => (
                                <li key={`${it}_${idx}`} className="text-sm text-slate-700 leading-relaxed flex items-center gap-2">
                                  <span
                                    aria-hidden
                                    className="inline-block shrink-0 w-3 h-3 border border-slate-400 rounded-[2px]"
                                  />
                                  <span className="flex-1">{it}</span>
                                  {child.stage === "lycee" && (
                                    <a
                                      href={config.arbsPdfUrl || DEFAULT_ARBS_URL}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Location de ce manuel via ARBS"
                                      className="shrink-0 inline-flex items-center gap-1 bg-pink-50 border border-pink-200 text-pink-600 text-[10px] font-black px-2 py-0.5 rounded-full hover:bg-pink-100 transition print:hidden"
                                    >
                                      📚 ARBS
                                    </a>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {showEmail && (
            <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4 print:hidden">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Envoyer la liste par email</h3>
                    <p className="text-sm text-slate-500 mt-1">Vous recevrez un PDF en pièce jointe.</p>
                  </div>
                  <button
                    onClick={() => setShowEmail(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl font-black"
                    aria-label="Fermer"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-5 space-y-3">
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adresse email</span>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: parent@gmail.com"
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </label>
                  {emailError && (
                    <div className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                      {emailError}
                    </div>
                  )}
                  {emailSuccess && (
                    <div className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                      {emailSuccess}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowEmail(false)}
                      className="px-5 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50 border border-slate-200"
                      disabled={sendingEmail}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={sendByEmail}
                      className="px-5 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                      disabled={sendingEmail}
                    >
                      {sendingEmail ? "Envoi..." : "Envoyer"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showAdd && (
            <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Ajouter un enfant</h3>
                    <p className="text-sm text-slate-500 mt-1">Choisissez le niveau puis confirmez.</p>
                  </div>
                  <button onClick={() => { setShowAdd(false); resetAddForm(); }} className="text-slate-400 hover:text-slate-600 text-2xl font-black">
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {([["ecole", "École"],["college", "Collège"],["lycee", "Lycée"],] as Array<[Stage, string]>).map(([s, label]) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStage(s)}
                      className={`px-4 py-3 rounded-2xl font-black border transition ${
                        stage === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-5 space-y-6">
                  {stage === "ecole" && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Niveau</p>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            { value: "JE1MMEBAYEL", label: "JE1 Mme BAYEL" },
                            { value: "JE2MMECARTIER", label: "JE2 Mme CARTIER" },
                            { value: "JE3MMEDOUGHTY", label: "JE3 Mme DOUGHTY" },
                            { value: "JE4", label: "JE4" },
                            { value: "CP", label: "CP" },
                            { value: "CE1", label: "CE1" },
                            { value: "CE2", label: "CE2" },
                            { value: "CM1", label: "CM1" },
                            { value: "CM2", label: "CM2" },
                          ] as Array<{ value: EcoleNiveau; label: string }>
                        ).map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setEcoleNiveau(value)}
                            className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                              ecoleNiveau === value ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {stage === "college" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Niveau</p>
                        <div className="flex flex-wrap gap-2">
                          {(["6e", "5e", "4e", "3e"] as CollegeNiveau[]).map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setCollegeNiveau(n)}
                              className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                                collegeNiveau === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      {collegeNiveau === "6e" ? (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Option bilingue allemand</p>
                          <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                            <input
                              type="checkbox"
                              className="w-5 h-5 accent-indigo-600"
                              checked={collegeBilingueAllemand}
                              onChange={(e) => setCollegeBilingueAllemand(e.target.checked)}
                            />
                            <span className="font-bold text-sm text-slate-800">
                              {collegeBilingueAllemand ? "Bilingue allemand : OUI" : "Bilingue allemand : NON"}
                            </span>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Langue (LV2)</p>
                          <div className="flex flex-wrap gap-2">
                            {(["Espagnol", "Allemand"] as LangueSeconde[]).map((l) => {
                              return (
                                <button
                                  key={l}
                                  type="button"
                                  onClick={() => setCollegeLangue(l)}
                                  className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                                    collegeLangue === l ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                                  }`}
                                >
                                  {l}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {collegeNiveau !== "6e" && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Option Latin</p>
                          <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                            <input
                              type="checkbox"
                              className="w-5 h-5 accent-indigo-600"
                              checked={collegeLatin}
                              onChange={(e) => setCollegeLatin(e.target.checked)}
                            />
                            <span className="font-bold text-sm text-slate-800">{collegeLatin ? "Latin : OUI" : "Latin : NON"}</span>
                          </label>
                        </div>
                      )}
                      {collegeNiveau === "3e" && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Option OSE</p>
                          <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                            <input
                              type="checkbox"
                              className="w-5 h-5 accent-indigo-600"
                              checked={collegeOse}
                              onChange={(e) => setCollegeOse(e.target.checked)}
                            />
                            <span className="font-bold text-sm text-slate-800">{collegeOse ? "OSE : OUI" : "OSE : NON"}</span>
                          </label>
                        </div>
                      )}
                      {(collegeNiveau === "5e" || collegeNiveau === "4e" || collegeNiveau === "3e") && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Option LCE Anglais</p>
                          <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                            <input
                              type="checkbox"
                              className="w-5 h-5 accent-indigo-600"
                              checked={collegeLceAnglais}
                              onChange={(e) => setCollegeLceAnglais(e.target.checked)}
                            />
                            <span className="font-bold text-sm text-slate-800">{collegeLceAnglais ? "LCE Anglais : OUI" : "LCE Anglais : NON"}</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                  {stage === "lycee" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Niveau</p>
                        <div className="flex flex-wrap gap-2">
                          {(["2nde", "1re", "Terminale"] as LyceeNiveau[]).map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => { setLyceeNiveau(n); if (n === "2nde") setLyceeTrack("General"); }}
                              className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                                lyceeNiveau === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      {lyceeNiveau !== "2nde" && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filière</p>
                          <div className="flex flex-wrap gap-2">
                            {(["General", "ST2S"] as LyceeTrack[]).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setLyceeTrack(t)}
                                className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                                  lyceeTrack === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                                }`}
                              >
                                {t === "General" ? "Général" : "ST2S"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">LVB</p>
                        <div className="flex flex-wrap gap-2">
                          {(["Allemand", "Espagnol"] as LangueSeconde[]).map((l) => (
                            <button
                              key={l}
                              type="button"
                              onClick={() => setLyceeLangue(l)}
                              className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                                lyceeLangue === l ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                              }`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                      {lyceeNiveau === "2nde" && (
                        <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                          <input
                            type="checkbox"
                            className="w-5 h-5 accent-indigo-600"
                            checked={lyceeAnglaisEuro}
                            onChange={(e) => setLyceeAnglaisEuro(e.target.checked)}
                          />
                          <span className="font-bold text-sm text-slate-800">Anglais Section Euro (option)</span>
                        </label>
                      )}
                      {lyceeTrack === "General" && (lyceeNiveau === "1re" || lyceeNiveau === "Terminale") && (
                        <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                          <input
                            type="checkbox"
                            className="w-5 h-5 accent-indigo-600"
                            checked={lyceeLatin}
                            onChange={(e) => setLyceeLatin(e.target.checked)}
                          />
                          <span className="font-bold text-sm text-slate-800">Option Latin (si concerné)</span>
                        </label>
                      )}
                      {lyceeTrack === "General" && lyceeNiveau !== "2nde" && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {lyceeNiveau === "1re" ? "Spécialités (jusqu'à 3)" : "Spécialités (jusqu'à 2)"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {lyceeSpecOptions
                              .filter((s) => s !== "Sc.Phy-Sc.Info" || lyceeNiveau === "Terminale")
                              .map((s) => {
                                const max = lyceeNiveau === "Terminale" ? 2 : 3;
                                const selected = lyceeSpecs.includes(s);
                                const disabled = !selected && lyceeSpecs.length >= max;
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                      setLyceeSpecs((prev) => {
                                        const has = prev.includes(s);
                                        if (has) return prev.filter((x) => x !== s);
                                        return [...prev, s];
                                      });
                                    }}
                                    className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                                      selected ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                                    } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                                  >
                                    {s}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                      {lyceeTrack === "General" && lyceeNiveau === "Terminale" && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Options maths (si concerné)</p>
                          <div className="flex flex-wrap gap-2">
                            {lyceeOptionOptions.map((o) => {
                              const selected = lyceeOptions.includes(o);
                              return (
                                <button
                                  key={o}
                                  type="button"
                                  onClick={() => setLyceeOptions((prev) => prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o])}
                                  className={`px-4 py-2 rounded-xl font-black text-sm border transition ${
                                    selected ? "bg-purple-600 text-white border-purple-600" : "bg-white border-slate-200 text-slate-700 hover:border-purple-200"
                                  }`}
                                >
                                  {o}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button  onClick={() => { setShowAdd(false); resetAddForm();}}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition print:hidden"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={addChild}
                    className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition print:hidden"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            /* Masque les widgets flottants externes (IA/assistant/chat) */
            [aria-label*="IA" i],
            [aria-label*="assistant" i],
            [title*="IA" i],
            [title*="assistant" i],
            iframe[title*="assistant" i],
            iframe[title*="chat" i] {
              display: none !important;
              visibility: hidden !important;
            }
            .print-hidden {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}

