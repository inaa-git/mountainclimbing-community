export type JoinDecisionCode = "joined" | "already_joined" | "schedule_not_open" | "schedule_full";

export function decideScheduleJoin(input: {
  scheduleStatus: string;
  participantStatus: string | null;
  joinedCount: number;
  maxParticipants: number | null;
}): JoinDecisionCode {
  if (input.scheduleStatus !== "open") return "schedule_not_open";
  if (input.participantStatus === "joined") return "already_joined";
  if (input.maxParticipants !== null && input.joinedCount >= input.maxParticipants) {
    return "schedule_full";
  }
  return "joined";
}

export function canCancelScheduleParticipation(userId: string, leaderId: string) {
  return userId !== leaderId;
}

export function isCapacityValid(maxParticipants: number | null, joinedCount: number) {
  return maxParticipants === null || maxParticipants >= joinedCount;
}
