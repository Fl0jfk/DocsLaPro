export function classAllocationCampaignOpenedEmail(label: string): string {
  return `La campagne "${label}" de répartition des classes est ouverte. Merci de saisir vos voeux dans les délais.`;
}

export function classAllocationCampaignReminderEmail(label: string): string {
  return `Rappel: la campagne "${label}" est en cours. Pensez à compléter vos voeux avant la fermeture.`;
}

export function classAllocationCampaignClosedEmail(label: string): string {
  return `La campagne "${label}" est désormais fermée. Les équipes vont finaliser les affectations.`;
}
