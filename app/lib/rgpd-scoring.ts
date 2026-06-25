import {
  RGPD_CATALOG,
  evaluateAllDocumentRequirements,
  type RgpdCatalogEntry,
} from "@/app/lib/rgpd-catalog";
import type {
  RgpdComplianceScore,
  RgpdDocumentState,
  RgpdQuestionnaireAnswers,
  RgpdWorkspace,
} from "@/app/lib/rgpd-types";
import { RGPD_TOTAL_STEPS } from "@/app/lib/rgpd-catalog";

function isDocumentPresent(state?: RgpdDocumentState): boolean {
  if (!state) return false;
  if (state.status === "non_applicable") return true;
  return (
    state.status === "genere" ||
    state.status === "importe" ||
    state.status === "valide"
  );
}

function questionnaireCompletionPercent(answers: RgpdQuestionnaireAnswers): number {
  if (answers.questionnaireCompleted) return 100;
  const step = Math.max(1, Math.min(answers.questionnaireStep, RGPD_TOTAL_STEPS));
  return Math.round(((step - 1) / RGPD_TOTAL_STEPS) * 100);
}

export function computeRgpdComplianceScore(workspace: RgpdWorkspace): RgpdComplianceScore {
  const requirements = evaluateAllDocumentRequirements(workspace.answers);
  const applicable = requirements.filter((r) => r.applicable);

  const mandatoryIds = applicable.filter((r) => {
    const entry = RGPD_CATALOG.find((c) => c.id === r.docId);
    return entry?.level === "obligatoire" || entry?.level === "conditionnel";
  });

  const recommendedIds = applicable.filter((r) => {
    const entry = RGPD_CATALOG.find((c) => c.id === r.docId);
    return entry?.level === "recommande";
  });

  const mandatoryPresent = mandatoryIds.filter((r) =>
    isDocumentPresent(workspace.documents[r.docId]),
  ).length;
  const mandatoryTotal = mandatoryIds.length || 1;

  const recommendedPresent = recommendedIds.filter((r) =>
    isDocumentPresent(workspace.documents[r.docId]),
  ).length;
  const recommendedTotal = recommendedIds.length || 1;

  const mandatoryDocs =
    mandatoryTotal > 0 ? Math.round((mandatoryPresent / mandatoryTotal) * 55) : 55;
  const recommendedDocs =
    recommendedTotal > 0 ? Math.round((recommendedPresent / recommendedTotal) * 20) : 20;

  const qPercent = questionnaireCompletionPercent(workspace.answers);
  const questionnaire = Math.round((qPercent / 100) * 10);

  const analyzed = applicable
    .map((r) => workspace.documents[r.docId]?.analysis?.documentScore)
    .filter((s): s is number => typeof s === "number");
  const averageQuality =
    analyzed.length > 0
      ? analyzed.reduce((a, b) => a + b, 0) / analyzed.length
      : 0;
  const quality = Math.round((averageQuality / 100) * 15);

  const total = Math.min(100, mandatoryDocs + recommendedDocs + questionnaire + quality);

  return {
    total,
    mandatoryDocs,
    recommendedDocs,
    questionnaire,
    quality,
    breakdown: {
      mandatoryPresent,
      mandatoryTotal,
      recommendedPresent,
      recommendedTotal,
      questionnairePercent: qPercent,
      averageQuality: Math.round(averageQuality),
    },
  };
}

export type RgpdDocumentWithMeta = RgpdCatalogEntry & {
  requirement: { applicable: boolean; reason: string };
  state: RgpdDocumentState;
};

export function buildDocumentList(workspace: RgpdWorkspace): RgpdDocumentWithMeta[] {
  const requirements = evaluateAllDocumentRequirements(workspace.answers);
  return RGPD_CATALOG.filter((e) => !e.incidentTool).map((entry) => {
    const req = requirements.find((r) => r.docId === entry.id)!;
    let state: RgpdDocumentState = workspace.documents[entry.id] ?? {
      status: req.applicable ? "manquant" : "non_applicable",
    };
    if (!req.applicable && state.status === "manquant") {
      state = {
        ...state,
        status: "non_applicable",
        notApplicableReason: req.reason,
      };
    }
    return { ...entry, requirement: req, state };
  });
}

export type RgpdActionItem = {
  docId: string;
  title: string;
  priority: "haute" | "moyenne" | "basse";
  message: string;
};

export function buildActionItems(workspace: RgpdWorkspace): RgpdActionItem[] {
  const items: RgpdActionItem[] = [];
  const docs = buildDocumentList(workspace);

  for (const doc of docs) {
    if (!doc.requirement.applicable) continue;
    if (doc.state.status === "manquant") {
      items.push({
        docId: doc.id,
        title: doc.title,
        priority: doc.level === "obligatoire" ? "haute" : "moyenne",
        message: "Document manquant — à créer ou importer.",
      });
    } else if (
      doc.state.analysis &&
      doc.state.analysis.documentScore < 70 &&
      doc.state.analysis.missingCriteria.length > 0
    ) {
      items.push({
        docId: doc.id,
        title: doc.title,
        priority: "moyenne",
        message: `À améliorer (score ${doc.state.analysis.documentScore}/100) : ${doc.state.analysis.missingCriteria.slice(0, 2).join(", ")}`,
      });
    }
  }

  if (!workspace.answers.questionnaireCompleted) {
    items.unshift({
      docId: "_questionnaire",
      title: "Questionnaire",
      priority: "haute",
      message: "Complétez le questionnaire pour affiner les documents requis.",
    });
  }

  return items;
}
