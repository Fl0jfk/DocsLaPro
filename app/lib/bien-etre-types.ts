export type BienEtreSeverity = "low" | "medium" | "high";

export type BienEtreSignalementStatus = "nouveau" | "en_cours" | "cloture";

export type BienEtreChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type BienEtreSessionAnalysis = {
  offTopic: boolean;
  distressLevel: number;
  suggestSignalement: boolean;
  categories: string[];
};

export type BienEtreSession = {
  messages: BienEtreChatMessage[];
  analysis?: BienEtreSessionAnalysis;
  updatedAt: string;
};

export type BienEtreConfig = {
  enabled: boolean;
  psychologistEmail: string;
  retentionDays: number;
  welcomeMessage?: string;
  notificationFromEmail?: string;
};

export type BienEtreSignalement = {
  id: string;
  createdAt: string;
  prenom: string;
  classe?: string;
  complement?: string;
  summary: string;
  categories: string[];
  severity: BienEtreSeverity;
  status: BienEtreSignalementStatus;
  referentNote?: string;
  retentionExpiresAt: string;
};

export type BienEtreSignalementIndexEntry = {
  id: string;
  createdAt: string;
  prenom: string;
  severity: BienEtreSeverity;
  status: BienEtreSignalementStatus;
  categories: string[];
};
