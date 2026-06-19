"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DASHBOARD_ACCENT_OPTIONS } from "@/app/lib/dashboard-brand-presets";
import { PLATFORM_ASSISTANCE_EMAIL } from "@/app/lib/platform-assistance-email";
import type {
  Establishment,
  EstablishmentKind,
  ExternalQuickLinkConfig,
  IntegrationsConfig,
  NotificationsConfig,
  SiteIdentity,
  TravelsModuleConfig,
} from "@/app/lib/app-config-schemas";

const TOTAL_STEPS = 14;

type EstablishmentDraft = Establishment & { clerkRoleSlugsText: string };

const ESTABLISHMENT_PRESETS: { kind: EstablishmentKind; id: string; label: string; grades: string; roles: string }[] = [
  { kind: "ecole", id: "ecole", label: "École", grades: "Maternelle & Élémentaire", roles: "direction_ecole" },
  { kind: "college", id: "college", label: "Collège", grades: "6ème · 5ème · 4ème · 3ème", roles: "direction_college" },
  { kind: "lycee", id: "lycee", label: "Lycée", grades: "2nde · 1ère · Terminale", roles: "direction_lycee" },
];

function Help({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-600 leading-relaxed mb-4 bg-slate-50 border border-slate-200 rounded-xl p-4">{children}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export default function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reviewMode = searchParams.get("review") === "1";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [identity, setIdentity] = useState<Partial<SiteIdentity>>({});
  const [establishments, setEstablishments] = useState<EstablishmentDraft[]>([]);
  const [notifications, setNotifications] = useState<Partial<NotificationsConfig>>({});
  const [travels, setTravels] = useState<Partial<TravelsModuleConfig>>({ transportProviders: [] });
  const [integrations, setIntegrations] = useState<IntegrationsConfig>({});
  const [externalLinks, setExternalLinks] = useState<ExternalQuickLinkConfig[]>([]);
  const [hasInternat, setHasInternat] = useState(false);
  const [existingConfigDetected, setExistingConfigDetected] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Chargement impossible");
      const cfg = j.config;
      const loadedEstablishments = (cfg.establishments || []).map((e: Establishment) => ({
        ...e,
        clerkRoleSlugsText: (e.clerkRoleSlugs || []).join(", "),
      }));
      const identityCfg = cfg.identity || {};
      const activeCount = loadedEstablishments.filter((e: EstablishmentDraft) => e.active !== false).length;
      const hasRealName = Boolean(identityCfg.name?.trim() && identityCfg.name.trim() !== "Mon établissement");
      const inferredOrgKind =
        identityCfg.organizationKind ??
        (activeCount >= 2 ? "groupe" : activeCount === 1 ? "standalone" : undefined);
      setIdentity({ ...identityCfg, organizationKind: inferredOrgKind });
      setEstablishments(loadedEstablishments);
      setExistingConfigDetected(hasRealName || activeCount >= 2);
      setNotifications(cfg.notifications || {});
      setTravels(cfg.travels || { transportProviders: [] });
      const integrationsCfg = cfg.integrations || {};
      setIntegrations({
        ...integrationsCfg,
        microsoftOneDrive: {
          enabled:
            integrationsCfg.microsoftOneDrive?.enabled ??
            (hasRealName || activeCount >= 2),
        },
      });
      setExternalLinks(cfg.externalLinks || []);
      const onboardingStep = identityCfg.onboardingStep || 1;
      const onboardingCompleted = identityCfg.onboardingCompleted === true;

      if (!reviewMode && onboardingCompleted) {
        router.replace("/dashboard");
        return;
      }

      if (
        !reviewMode &&
        !onboardingCompleted &&
        onboardingStep >= TOTAL_STEPS &&
        (hasRealName || activeCount >= 2)
      ) {
        const completeRes = await fetch("/api/settings/onboarding/complete", { method: "PUT" });
        if (completeRes.ok) {
          router.replace("/dashboard");
          return;
        }
      }

      setStep(onboardingStep);
      setHasInternat(Boolean(cfg.notifications?.internatRollCallRecipients || cfg.notifications?.internatEmergencyRecipients?.length));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [reviewMode, router]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const saveSite = async (patch: Partial<SiteIdentity>, nextStep?: number) => {
    const payload = { ...identity, ...patch, ...(nextStep ? { onboardingStep: nextStep } : {}) };
    const res = await fetch("/api/settings/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Enregistrement identité impossible");
    setIdentity(j.config?.identity || payload);
  };

  const saveEstablishmentsApi = async (list: EstablishmentDraft[], nextStep?: number) => {
    const parsed = list.map((e) => ({
      id: e.id,
      label: e.label,
      kind: e.kind,
      directorName: e.directorName,
      directorEmail: e.directorEmail,
      grades: e.grades,
      clerkRoleSlugs: e.clerkRoleSlugsText.split(",").map((s) => s.trim()).filter(Boolean),
      active: e.active !== false,
    }));
    const res = await fetch("/api/settings/establishments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ establishments: parsed }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Enregistrement établissements impossible");
    if (nextStep) await saveSite({}, nextStep);
    setEstablishments(list);
  };

  const saveNotificationsApi = async (patch: Partial<NotificationsConfig>, nextStep?: number) => {
    const payload = { ...notifications, ...patch };
    const res = await fetch("/api/settings/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Enregistrement notifications impossible");
    setNotifications(j.config?.notifications || payload);
    if (nextStep) await saveSite({}, nextStep);
  };

  const saveTravelsApi = async (patch: Partial<TravelsModuleConfig>, nextStep?: number) => {
    const payload = { ...travels, ...patch };
    const res = await fetch("/api/settings/travels", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Enregistrement voyages impossible");
    setTravels(j.travels || payload);
    if (nextStep) await saveSite({}, nextStep);
  };

  const saveIntegrationsApi = async (patch: IntegrationsConfig, nextStep?: number) => {
    const payload = { ...integrations, ...patch };
    const res = await fetch("/api/settings/integrations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Enregistrement intégrations impossible");
    setIntegrations(j.integrations || payload);
    if (nextStep) await saveSite({}, nextStep);
  };

  const saveExternalLinksApi = async (links: ExternalQuickLinkConfig[], nextStep?: number) => {
    const res = await fetch("/api/settings/external-links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Enregistrement liens impossible");
    setExternalLinks(j.links || links);
    if (nextStep) await saveSite({}, nextStep);
  };

  const geocodeAddress = async () => {
    const res = await fetch("/api/settings/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        street: identity.address?.street,
        zip: identity.address?.zip,
        city: identity.address?.city,
      }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Géocodage impossible");
    setIdentity((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        latitude: j.latitude,
        longitude: j.longitude,
      },
    }));
    return j;
  };

  const goNext = async () => {
    setSaving(true);
    setError(null);
    try {
      const next = Math.min(TOTAL_STEPS, step + 1);
      if (step === 1) {
        await saveSite(
          {
            name: identity.name,
            organizationKind: identity.organizationKind,
            shortName: identity.shortName || identity.name,
          },
          next,
        );
      } else if (step === 2) {
        await saveSite({ dashboardAccent: identity.dashboardAccent, shortName: identity.shortName }, next);
      } else if (step === 3) {
        if (establishments.length === 0) throw new Error("Ajoutez au moins un établissement.");
        await saveEstablishmentsApi(establishments, next);
      } else if (step === 4) {
        await geocodeAddress();
        await saveSite({ address: identity.address }, next);
      } else if (step === 5) {
        await saveSite(
          {
            phone: identity.phone,
            preinscriptionUrl: identity.preinscriptionUrl,
            reglementFinancier: identity.reglementFinancier,
          },
          next,
        );
      } else if (step === 6) {
        await saveSite({ assistanceEmail: PLATFORM_ASSISTANCE_EMAIL }, next);
        await saveNotificationsApi(
          {
            hseOps: notifications.hseOps,
            photocopiesOps: notifications.photocopiesOps,
          },
          next,
        );
      } else if (step === 7) {
        await saveNotificationsApi({
          travelsCompta: notifications.travelsCompta,
          travelsCuisine: notifications.travelsCuisine,
        });
        await saveTravelsApi({ transportProviders: travels.transportProviders || [] }, next);
      } else if (step === 8) {
        await saveIntegrationsApi({ zeendoc: integrations.zeendoc }, next);
        if (integrations.zeendoc?.destinationEmail) {
          await saveNotificationsApi({ travelsZeendoc: integrations.zeendoc.destinationEmail });
        }
      } else if (step === 9) {
        await saveNotificationsApi(
          {
            absencesNotifyProfEcole: notifications.absencesNotifyProfEcole,
            absencesNotifyProfCollegeLycee: notifications.absencesNotifyProfCollegeLycee,
            absencesNotifyOgecCompta: notifications.absencesNotifyOgecCompta,
          },
          next,
        );
      } else if (step === 10) {
        if (hasInternat) {
          await saveNotificationsApi(
            {
              internatRollCallRecipients: notifications.internatRollCallRecipients,
              internatEmergencyRecipients: notifications.internatEmergencyRecipients,
            },
            next,
          );
        } else {
          await saveSite({}, next);
        }
      } else if (step === 11) {
        await saveIntegrationsApi({ ecoleDirecte: integrations.ecoleDirecte });
        await saveExternalLinksApi(externalLinks, next);
      } else if (step === 12) {
        await saveIntegrationsApi(
          {
            microsoftOneDrive: {
              enabled: integrations.microsoftOneDrive?.enabled ?? existingConfigDetected,
            },
          },
          next,
        );
      } else if (step === 13) {
        await saveSite({}, next);
      } else if (step === 14) {
        const res = await fetch("/api/settings/onboarding/complete", { method: "PUT" });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Finalisation impossible");
        router.push("/dashboard");
        return;
      }
      setStep(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  const addPresetEstablishment = (preset: (typeof ESTABLISHMENT_PRESETS)[number]) => {
    if (establishments.some((e) => e.id === preset.id)) return;
    setEstablishments((prev) => [
      ...prev,
      {
        id: preset.id,
        label: preset.label,
        kind: preset.kind,
        grades: preset.grades,
        directorName: "",
        directorEmail: "",
        clerkRoleSlugsText: preset.roles,
        active: true,
      },
    ]);
  };

  const stepTitle = useMemo(() => {
    const titles: Record<number, string> = {
      1: "Bienvenue — votre établissement",
      2: "Identité visuelle",
      3: "Établissements",
      4: "Adresse & météo",
      5: "Contacts & liens utiles",
      6: "Alertes HSE & photocopies",
      7: "Sorties scolaires",
      8: "Envoi documents (Zeendoc / mail)",
      9: "Absences",
      10: "Internat",
      11: "Liens externes",
      12: "OneDrive / OCR",
      13: "Demandes internes",
      14: "Récapitulatif",
    };
    return titles[step] || "";
  }, [step]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Chargement de la configuration…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
            Configuration {reviewMode ? "— relecture" : "initiale"} · Étape {step}/{TOTAL_STEPS}
          </p>
          <h1 className="text-2xl font-bold text-slate-900">{stepTitle}</h1>
          <div className="mt-4 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>}
          {existingConfigDetected && !reviewMode && (
            <div className="mb-4 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3">
              Configuration existante détectée (nom de plateforme ou plusieurs établissements). Les champs sont
              pré-remplis depuis S3 — vérifiez avant d&apos;enregistrer chaque étape.
            </div>
          )}

          {step === 1 && (
            <>
              <Help>
                Indiquez si vous gérez un seul établissement ou un groupe scolaire (plusieurs niveaux). Cela adapte les
                modules (sorties, absences, tableau de bord).
              </Help>
              <Field label="Nom affiché de la plateforme">
                <input className={inputClass} value={identity.name || ""} onChange={(e) => setIdentity({ ...identity, name: e.target.value })} />
              </Field>
              <Field label="Type d'organisation">
                <select
                  className={inputClass}
                  value={identity.organizationKind || "standalone"}
                  onChange={(e) =>
                    setIdentity({ ...identity, organizationKind: e.target.value as "standalone" | "groupe" })
                  }
                >
                  <option value="standalone">Un seul établissement</option>
                  <option value="groupe">Groupe scolaire (plusieurs niveaux)</option>
                </select>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Help>Personnalisez l'apparence du tableau de bord. Le logo peut être ajouté plus tard dans Paramètres.</Help>
              <Field label="Nom court">
                <input className={inputClass} value={identity.shortName || ""} onChange={(e) => setIdentity({ ...identity, shortName: e.target.value })} />
              </Field>
              <Field label="Couleur d'accent">
                <select
                  className={inputClass}
                  value={identity.dashboardAccent || "green"}
                  onChange={(e) => setIdentity({ ...identity, dashboardAccent: e.target.value })}
                >
                  {DASHBOARD_ACCENT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Help>
                Ajoutez les établissements actifs. Pour un groupe scolaire, activez école, collège et/ou lycée. Les
                e-mails de direction serviront aux validations et notifications.
              </Help>
              <div className="flex flex-wrap gap-2 mb-4">
                {ESTABLISHMENT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="text-sm px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => addPresetEstablishment(p)}
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
              {establishments.map((e, idx) => (
                <div key={e.id} className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex justify-between items-center mb-2">
                    <strong>{e.label}</strong>
                    <button type="button" className="text-xs text-red-600" onClick={() => setEstablishments((prev) => prev.filter((_, i) => i !== idx))}>
                      Retirer
                    </button>
                  </div>
                  <Field label="Directeur(trice)">
                    <input className={inputClass} value={e.directorName || ""} onChange={(ev) => {
                      const copy = [...establishments];
                      copy[idx] = { ...copy[idx], directorName: ev.target.value };
                      setEstablishments(copy);
                    }} />
                  </Field>
                  <Field label="E-mail direction">
                    <input className={inputClass} type="email" value={e.directorEmail || ""} onChange={(ev) => {
                      const copy = [...establishments];
                      copy[idx] = { ...copy[idx], directorEmail: ev.target.value };
                      setEstablishments(copy);
                    }} />
                  </Field>
                </div>
              ))}
            </>
          )}

          {step === 4 && (
            <>
              <Help>
                L'adresse exacte alimente le widget météo du tableau de bord. Nous géolocalisons automatiquement votre
                établissement à partir de la rue, du code postal et de la ville.
              </Help>
              <Field label="Rue">
                <input className={inputClass} value={identity.address?.street || ""} onChange={(e) => setIdentity({ ...identity, address: { ...identity.address, street: e.target.value } })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Code postal">
                  <input className={inputClass} value={identity.address?.zip || ""} onChange={(e) => setIdentity({ ...identity, address: { ...identity.address, zip: e.target.value } })} />
                </Field>
                <Field label="Ville">
                  <input className={inputClass} value={identity.address?.city || ""} onChange={(e) => setIdentity({ ...identity, address: { ...identity.address, city: e.target.value } })} />
                </Field>
              </div>
              {(identity.address?.latitude != null && identity.address?.longitude != null) && (
                <p className="text-xs text-emerald-700 mb-2">
                  Coordonnées : {identity.address.latitude.toFixed(4)}, {identity.address.longitude.toFixed(4)}
                </p>
              )}
            </>
          )}

          {step === 5 && (
            <>
              <Help>Téléphone et liens affichés aux utilisateurs (préinscription, règlement financier).</Help>
              <Field label="Téléphone (affichage)">
                <input className={inputClass} value={identity.phone?.display || ""} onChange={(e) => setIdentity({ ...identity, phone: { ...identity.phone, display: e.target.value } })} />
              </Field>
              <Field label="URL préinscription">
                <input className={inputClass} value={identity.preinscriptionUrl || ""} onChange={(e) => setIdentity({ ...identity, preinscriptionUrl: e.target.value })} />
              </Field>
              <Field label="Règlement financier (URL PDF)">
                <input className={inputClass} value={identity.reglementFinancier || ""} onChange={(e) => setIdentity({ ...identity, reglementFinancier: e.target.value })} />
              </Field>
            </>
          )}

          {step === 6 && (
            <>
              <Help>
                Indiquez les responsables qui recevront les alertes HSE et les demandes de photocopies couleur.
              </Help>
              <Field label="Responsable HSE (e-mail)">
                <input className={inputClass} type="email" value={notifications.hseOps || ""} onChange={(e) => setNotifications({ ...notifications, hseOps: e.target.value })} />
              </Field>
              <Field label="Responsable photocopies couleur (e-mail)">
                <input className={inputClass} type="email" value={notifications.photocopiesOps || ""} onChange={(e) => setNotifications({ ...notifications, photocopiesOps: e.target.value })} />
              </Field>
            </>
          )}

          {step === 7 && (
            <>
              <Help>
                Pour les sorties scolaires : compta reçoit les devis signés, la cuisine reçoit les commandes
                restauration, les transporteurs reçoivent les demandes de devis bus.
              </Help>
              <Field label="E-mails comptabilité (séparés par des virgules)">
                <input
                  className={inputClass}
                  value={Array.isArray(notifications.travelsCompta) ? notifications.travelsCompta.join(", ") : ""}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      travelsCompta: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              </Field>
              <Field label="E-mail cuisine / prestataire restauration">
                <input className={inputClass} type="email" value={notifications.travelsCuisine || ""} onChange={(e) => setNotifications({ ...notifications, travelsCuisine: e.target.value })} />
              </Field>
              <p className="text-sm font-medium text-slate-700 mb-2">Transporteurs habituels</p>
              {(travels.transportProviders || []).map((p, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2 mb-2">
                  <input className={inputClass} placeholder="Nom" value={p.name} onChange={(e) => {
                    const copy = [...(travels.transportProviders || [])];
                    copy[idx] = { ...copy[idx], name: e.target.value };
                    setTravels({ ...travels, transportProviders: copy });
                  }} />
                  <input className={inputClass} placeholder="E-mail" type="email" value={p.email} onChange={(e) => {
                    const copy = [...(travels.transportProviders || [])];
                    copy[idx] = { ...copy[idx], email: e.target.value };
                    setTravels({ ...travels, transportProviders: copy });
                  }} />
                </div>
              ))}
              <button type="button" className="text-sm text-indigo-600" onClick={() => setTravels({ ...travels, transportProviders: [...(travels.transportProviders || []), { name: "", email: "" }] })}>
                + Ajouter un transporteur
              </button>
            </>
          )}

          {step === 8 && (
            <>
              <Help>
                Si vous utilisez Zeendoc, le bouton du module voyages portera ce nom et enverra les PDF à l'adresse
                configurée. Sinon, choisissez « Envoyer par mail ».
              </Help>
              <Field label="Utilisez-vous Zeendoc ?">
                <select
                  className={inputClass}
                  value={integrations.zeendoc?.enabled ? "yes" : "no"}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      zeendoc: {
                        enabled: e.target.value === "yes",
                        buttonLabel: e.target.value === "yes" ? "Envoyer sur Zeendoc" : "Envoyer par mail",
                        destinationEmail: integrations.zeendoc?.destinationEmail,
                        loginUrl: integrations.zeendoc?.loginUrl,
                      },
                    })
                  }
                >
                  <option value="no">Non — envoi par mail simple</option>
                  <option value="yes">Oui — Zeendoc</option>
                </select>
              </Field>
              <Field label="Libellé du bouton">
                <input className={inputClass} value={integrations.zeendoc?.buttonLabel || "Envoyer par mail"} onChange={(e) => setIntegrations({ ...integrations, zeendoc: { ...integrations.zeendoc, enabled: integrations.zeendoc?.enabled ?? false, buttonLabel: e.target.value } })} />
              </Field>
              <Field label="E-mail de destination des PDF">
                <input className={inputClass} type="email" value={integrations.zeendoc?.destinationEmail || notifications.travelsZeendoc || ""} onChange={(e) => setIntegrations({ ...integrations, zeendoc: { ...integrations.zeendoc, enabled: integrations.zeendoc?.enabled ?? false, destinationEmail: e.target.value } })} />
              </Field>
            </>
          )}

          {step === 9 && (
            <>
              <Help>Ces destinataires reçoivent les notifications après validation des absences déclarées par les professeurs ou l'OGEC.</Help>
              <Field label="Professeurs — école (nom + e-mail)">
                <input className={`${inputClass} mb-2`} placeholder="Nom" value={notifications.absencesNotifyProfEcole?.label || ""} onChange={(e) => setNotifications({ ...notifications, absencesNotifyProfEcole: { ...notifications.absencesNotifyProfEcole, label: e.target.value, email: notifications.absencesNotifyProfEcole?.email || "" } })} />
                <input className={inputClass} placeholder="E-mail" type="email" value={notifications.absencesNotifyProfEcole?.email || ""} onChange={(e) => setNotifications({ ...notifications, absencesNotifyProfEcole: { label: notifications.absencesNotifyProfEcole?.label, email: e.target.value } })} />
              </Field>
              <Field label="Professeurs — collège / lycée (nom + e-mail)">
                <input className={`${inputClass} mb-2`} placeholder="Nom" value={notifications.absencesNotifyProfCollegeLycee?.label || ""} onChange={(e) => setNotifications({ ...notifications, absencesNotifyProfCollegeLycee: { ...notifications.absencesNotifyProfCollegeLycee, label: e.target.value, email: notifications.absencesNotifyProfCollegeLycee?.email || "" } })} />
                <input className={inputClass} placeholder="E-mail" type="email" value={notifications.absencesNotifyProfCollegeLycee?.email || ""} onChange={(e) => setNotifications({ ...notifications, absencesNotifyProfCollegeLycee: { label: notifications.absencesNotifyProfCollegeLycee?.label, email: e.target.value } })} />
              </Field>
              <Field label="OGEC / compta (e-mails séparés par des virgules)">
                <input className={inputClass} value={Array.isArray(notifications.absencesNotifyOgecCompta) ? notifications.absencesNotifyOgecCompta.join(", ") : ""} onChange={(e) => setNotifications({ ...notifications, absencesNotifyOgecCompta: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </Field>
            </>
          )}

          {step === 10 && (
            <>
              <Help>Configurez l'internat si vous hébergez des élèves. Sinon, passez à l'étape suivante.</Help>
              <label className="flex items-center gap-2 mb-4 text-sm">
                <input type="checkbox" checked={hasInternat} onChange={(e) => setHasInternat(e.target.checked)} />
                Nous avons un internat
              </label>
              {hasInternat && (
                <>
                  <Field label="Direction lycée (appel)">
                    <input className={inputClass} type="email" value={notifications.internatRollCallRecipients?.directionLycee || ""} onChange={(e) => setNotifications({ ...notifications, internatRollCallRecipients: { ...notifications.internatRollCallRecipients, directionLycee: e.target.value } })} />
                  </Field>
                  <Field label="Urgences internat (e-mails séparés par des virgules)">
                    <input className={inputClass} value={Array.isArray(notifications.internatEmergencyRecipients) ? notifications.internatEmergencyRecipients.join(", ") : ""} onChange={(e) => setNotifications({ ...notifications, internatEmergencyRecipients: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                  </Field>
                </>
              )}
            </>
          )}

          {step === 11 && (
            <>
              <Help>Liens rapides sous le tableau de bord (EcoleDirecte, Zeendoc, etc.). Vous pourrez en ajouter d'autres dans Paramètres.</Help>
              <label className="flex items-center gap-2 mb-3 text-sm">
                <input
                  type="checkbox"
                  checked={integrations.ecoleDirecte?.enabled ?? false}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      ecoleDirecte: {
                        enabled: e.target.checked,
                        label: "École Directe",
                        loginUrl: integrations.ecoleDirecte?.loginUrl || "https://www.ecoledirecte.com/login?cameFrom=%2FAccueil",
                      },
                    })
                  }
                />
                Afficher le raccourci École Directe
              </label>
              {integrations.ecoleDirecte?.enabled && (
                <Field label="URL de connexion École Directe">
                  <input className={inputClass} value={integrations.ecoleDirecte.loginUrl || ""} onChange={(e) => setIntegrations({ ...integrations, ecoleDirecte: { ...integrations.ecoleDirecte, enabled: true, loginUrl: e.target.value } })} />
                </Field>
              )}
              {integrations.zeendoc?.enabled && (
                <label className="flex items-center gap-2 mb-3 text-sm">
                  <input
                    type="checkbox"
                    checked={externalLinks.some((l) => l.id === "zeendoc")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setExternalLinks((prev) => [
                          ...prev.filter((l) => l.id !== "zeendoc"),
                          {
                            id: "zeendoc",
                            name: "ZeenDoc",
                            link: integrations.zeendoc?.loginUrl || "",
                            allowedRoles: ["administratif", "comptabilite"],
                          },
                        ]);
                      } else {
                        setExternalLinks((prev) => prev.filter((l) => l.id !== "zeendoc"));
                      }
                    }}
                  />
                  Raccourci Zeendoc sur le tableau de bord
                </label>
              )}
            </>
          )}

          {step === 12 && (
            <>
              <Help>
                Le module « Ajout documents IA » utilise OneDrive. Activez-le si vous déposez les dossiers élèves sur
                OneDrive. Les identifiants Azure sont configurés côté hébergeur (secrets tenant).
              </Help>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={integrations.microsoftOneDrive?.enabled ?? false}
                  onChange={(e) =>
                    setIntegrations({
                      ...integrations,
                      microsoftOneDrive: { enabled: e.target.checked },
                    })
                  }
                />
                Nous utilisons OneDrive pour les dossiers élèves
              </label>
            </>
          )}

          {step === 13 && (
            <>
              <Help>
                Le routage des demandes internes (chatbot) se configure en détail dans Paramètres → Routage demandes.
                Vous pourrez y assigner chaque tâche à un collaborateur.
              </Help>
              <p className="text-sm text-slate-600">
                Aucune action obligatoire ici. Passez à l'étape suivante pour accéder à la plateforme, puis affinez le
                routage quand vous le souhaitez.
              </p>
            </>
          )}

          {step === 14 && (
            <>
              <Help>Vérifiez les informations saisies. Vous pourrez tout modifier ultérieurement dans Paramètres généraux.</Help>
              <ul className="text-sm text-slate-700 space-y-2">
                <li><strong>Organisation :</strong> {identity.name} ({identity.organizationKind === "groupe" ? "groupe scolaire" : "établissement unique"})</li>
                <li><strong>Établissements :</strong> {establishments.map((e) => e.label).join(", ") || "—"}</li>
                <li><strong>Adresse :</strong> {identity.address?.street}, {identity.address?.zip} {identity.address?.city}</li>
                <li><strong>Transporteurs :</strong> {(travels.transportProviders || []).length}</li>
              </ul>
            </>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            <button type="button" className="px-4 py-2 text-sm text-slate-600 disabled:opacity-40" disabled={step <= 1 || saving} onClick={goPrev}>
              Précédent
            </button>
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
              disabled={saving}
              onClick={goNext}
            >
              {saving ? "Enregistrement…" : step === TOTAL_STEPS ? (reviewMode ? "Terminer la relecture" : "Accéder à la plateforme") : "Suivant"}
            </button>
          </div>
          {reviewMode && step === TOTAL_STEPS && (
            <button type="button" className="mt-3 text-sm text-indigo-600 w-full text-center" onClick={() => router.push("/parametres")}>
              Retour aux paramètres sans finaliser
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
