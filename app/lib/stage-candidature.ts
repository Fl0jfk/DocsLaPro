import { defaultStageSchedule } from "@/app/lib/stage-schedule";
import {
  addOfferApplication,
  getOfferCandidatureTokenRef,
  getStageOffer,
  listOfferApplications,
  saveOfferCandidatureTokenRef,
  saveStageConvention,
  saveStageOffer,
} from "@/app/lib/stage-storage";
import { ensureConventionReferent } from "@/app/lib/stage-referents-config";
import {
  ensureStudentAccessToken,
  generateStageToken,
} from "@/app/lib/stage-workflow";
import {
  currentStageSchoolYear,
  stageUid,
  type StageConvention,
  type StageOffer,
  type StageOfferApplication,
  type StageStudentInfo,
} from "@/app/lib/stage-types";

export async function ensureOfferCandidatureToken(offer: StageOffer): Promise<StageOffer> {
  if (offer.candidatureToken) return offer;
  const token = generateStageToken();
  await saveOfferCandidatureTokenRef(token, {
    offerId: offer.id,
    createdAt: new Date().toISOString(),
  });
  const next = { ...offer, candidatureToken: token, updatedAt: new Date().toISOString() };
  await saveStageOffer(next);
  return next;
}

export async function resolveOfferByCandidatureToken(token: string): Promise<StageOffer | null> {
  const ref = await getOfferCandidatureTokenRef(token);
  if (!ref) return null;
  const offer = await getStageOffer(ref.offerId);
  if (!offer || offer.candidatureToken !== token) return null;
  return offer;
}

function conventionFromOffer(offer: StageOffer, student: StageStudentInfo): StageConvention {
  const now = new Date().toISOString();
  const internshipKind =
    offer.kind === "job_ete"
      ? "job_ete"
      : offer.kind === "stage_observation"
        ? "stage_observation"
        : offer.kind === "autre"
          ? "autre"
          : "pfmp";

  let schedule = defaultStageSchedule("uniform_week");
  if (offer.periodStart && offer.periodEnd) {
    schedule = { ...schedule, periodStart: offer.periodStart, periodEnd: offer.periodEnd };
  }

  return {
    id: stageUid("conv"),
    schoolYear: offer.schoolYear || currentStageSchoolYear(),
    status: "draft",
    internshipKind,
    student,
    offerId: offer.id,
    company: {
      name: offer.companyName,
      address: offer.companyAddress || "",
      siret: offer.companySiret,
      activity: offer.sector || offer.description.slice(0, 200),
      tutorName: offer.contactName,
      tutorEmail: offer.contactEmail,
      tutorPhone: offer.contactPhone,
    },
    schedule,
    teacherReferent: { name: "", email: "" },
    signatures: [],
    createdAt: now,
    updatedAt: now,
    createdBy: { role: "eleve", name: `${student.firstName} ${student.lastName}`.trim() },
    history: [{ at: now, by: `${student.firstName} ${student.lastName}`.trim(), action: "CANDIDATURE_OFFRE" }],
  };
}

export async function submitOfferCandidature(params: {
  token: string;
  student: StageStudentInfo;
}): Promise<
  | { ok: true; convention: StageConvention; studentLink: string }
  | { ok: false; error: string }
> {
  const offer = await resolveOfferByCandidatureToken(params.token);
  if (!offer) return { ok: false, error: "Lien de candidature invalide." };
  if (offer.status !== "approved") {
    return { ok: false, error: "Cette offre n'accepte plus de candidatures." };
  }

  const apps = await listOfferApplications(offer.id);
  if (apps.length >= offer.positionsCount) {
    return { ok: false, error: "Toutes les places pour cette offre sont pourvues." };
  }

  const s = params.student;
  if (!s.firstName.trim() || !s.lastName.trim() || !s.className.trim() || !s.level.trim()) {
    return { ok: false, error: "Identité élève incomplète." };
  }

  const duplicate = apps.some(
    (a) =>
      a.studentFirstName.toLowerCase() === s.firstName.trim().toLowerCase() &&
      a.studentLastName.toLowerCase() === s.lastName.trim().toLowerCase() &&
      a.studentClassName.toLowerCase() === s.className.trim().toLowerCase(),
  );
  if (duplicate) {
    return { ok: false, error: "Une candidature existe déjà pour cet élève sur cette offre." };
  }

  let convention = conventionFromOffer(offer, {
    firstName: s.firstName.trim(),
    lastName: s.lastName.trim(),
    className: s.className.trim(),
    level: s.level.trim(),
    email: s.email?.trim() || undefined,
    parentEmail: s.parentEmail?.trim() || undefined,
  });
  convention = await ensureConventionReferent(convention);
  convention = await ensureStudentAccessToken(convention);
  await saveStageConvention(convention);

  const application: StageOfferApplication = {
    id: stageUid("app"),
    offerId: offer.id,
    conventionId: convention.id,
    studentFirstName: convention.student.firstName,
    studentLastName: convention.student.lastName,
    studentClassName: convention.student.className,
    studentLevel: convention.student.level,
    createdAt: new Date().toISOString(),
  };
  await addOfferApplication(application);

  const updatedApps = await listOfferApplications(offer.id);
  if (updatedApps.length >= offer.positionsCount) {
    await saveStageOffer({
      ...offer,
      status: "filled",
      updatedAt: new Date().toISOString(),
    });
  }

  const studentLink = `/stages/eleve?token=${encodeURIComponent(convention.studentAccessToken!)}`;
  return { ok: true, convention, studentLink };
}
