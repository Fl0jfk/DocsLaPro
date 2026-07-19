import "server-only";

import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { RhOnboardingFormData } from "@/app/lib/rh/onboarding-types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 10, color: "#64748b", marginBottom: 16 },
  section: { marginBottom: 12 },
  label: { fontWeight: "bold", marginBottom: 2 },
  row: { marginBottom: 4 },
  mask: {
    marginTop: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
});

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text>{value?.trim() || "—"}</Text>
    </View>
  );
}

function FichePosteDoc({ form, schoolName }: { form: RhOnboardingFormData; schoolName: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Fiche de poste</Text>
        <Text style={styles.subtitle}>{schoolName} — brouillon auto-généré (masque à personnaliser)</Text>
        <View style={styles.section}>
          <Field label="Collaborateur(trice)" value={`${form.firstName} ${form.lastName}`} />
          <Field label="Poste" value={form.jobTitle} />
          <Field label="Établissement" value={form.etablissement} />
          <Field label="Type de contrat" value={form.contractType.toUpperCase()} />
          <Field label="Date d'entrée" value={form.contractStartDate} />
          <Field label="Temps de travail (%)" value={String(form.workTimePercent ?? 100)} />
        </View>
        <View style={styles.mask}>
          <Text style={styles.label}>Zone masque éditable (placeholder)</Text>
          <Text>
            Missions principales, rattachement hiérarchique, horaires, lieu de travail… À compléter
            dans le moteur de documents RH.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

function UrssafDoc({ form, schoolName }: { form: RhOnboardingFormData; schoolName: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Déclaration préalable à l&apos;embauche (URSSAF)</Text>
        <Text style={styles.subtitle}>{schoolName} — brouillon auto-généré (masque à personnaliser)</Text>
        <View style={styles.section}>
          <Field label="Nom de naissance" value={form.birthName || form.lastName} />
          <Field label="Prénom(s)" value={form.firstName} />
          <Field label="Date de naissance" value={form.birthDate} />
          <Field label="Lieu de naissance" value={form.birthPlace} />
          <Field label="N° sécurité sociale" value={form.socialSecurityNumber} />
          <Field label="Adresse" value={`${form.addressLine1}, ${form.postalCode} ${form.city}`} />
          <Field label="Date d'embauche" value={form.contractStartDate} />
          <Field label="Nature du contrat" value={form.contractType.toUpperCase()} />
        </View>
        <View style={styles.mask}>
          <Text style={styles.label}>Zone masque URSSAF (placeholder)</Text>
          <Text>
            Identifiant employeur, code PCS, durée du contrat, mutuelle, convention collective…
            Remplacer par le masque officiel plus tard.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderOnboardingPdfBuffers(
  form: RhOnboardingFormData,
  schoolName: string,
): Promise<{ fichePoste: Buffer; urssaf: Buffer }> {
  const [fichePoste, urssaf] = await Promise.all([
    renderToBuffer(<FichePosteDoc form={form} schoolName={schoolName} />),
    renderToBuffer(<UrssafDoc form={form} schoolName={schoolName} />),
  ]);
  return { fichePoste: Buffer.from(fichePoste), urssaf: Buffer.from(urssaf) };
}
