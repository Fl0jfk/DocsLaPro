export type DomainPlanningDomain = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  coordinatorClerkUserIds: string[];
};

export type DomainPlanningBooking = {
  id: string;
  groupId?: string | null;
  domainId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  className: string;
  activityLabel?: string;
  comment: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  createdByUserId: string;
  assignmentKind: "coordinator" | "self";
  status: "CONFIRMED" | "CANCELLED";
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
};
