import type { Database, ParticipantStatus } from "@/lib/supabase/database.types";

export type Schedule = Database["public"]["Tables"]["schedules"]["Row"];

export type Participation = Pick<
  Database["public"]["Tables"]["schedule_participants"]["Row"],
  "schedule_id" | "status" | "joined_at" | "cancelled_at"
>;

export type ScheduleActivity = {
  schedule: Schedule;
  participantStatus: ParticipantStatus;
};

export function getKoreanDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function classifyScheduleActivities({
  today,
  ledSchedules,
  participations,
  participantSchedules,
}: {
  today: string;
  ledSchedules: Schedule[];
  participations: Participation[];
  participantSchedules: Schedule[];
}) {
  const schedulesById = new Map(participantSchedules.map((schedule) => [schedule.id, schedule]));
  const participationByScheduleId = new Map(
    participations.map((participation) => [participation.schedule_id, participation]),
  );

  const joinedSchedules: ScheduleActivity[] = [];
  const pastActivities: ScheduleActivity[] = [];

  for (const [scheduleId, participation] of participationByScheduleId) {
    const schedule = schedulesById.get(scheduleId);
    if (!schedule || participation.status !== "joined" || schedule.status === "cancelled") continue;

    const isCompleted = schedule.status === "completed";
    const isPastDate = schedule.hiking_date < today;

    if (isPastDate || isCompleted) {
      pastActivities.push({ schedule, participantStatus: participation.status });
      continue;
    }

    if (schedule.hiking_date >= today) {
      joinedSchedules.push({ schedule, participantStatus: participation.status });
    }
  }

  return {
    ledSchedules: [...new Map(ledSchedules.map((schedule) => [schedule.id, schedule])).values()].sort(
      (a, b) => compareClosestSchedules(a, b, today),
    ),
    joinedSchedules: joinedSchedules.sort((a, b) =>
      compareScheduleDateAscending(a.schedule, b.schedule),
    ),
    pastActivities: pastActivities.sort((a, b) =>
      compareScheduleDateDescending(a.schedule, b.schedule),
    ),
  };
}

function compareClosestSchedules(a: Schedule, b: Schedule, today: string) {
  const aIsUpcoming = a.hiking_date >= today;
  const bIsUpcoming = b.hiking_date >= today;

  if (aIsUpcoming !== bIsUpcoming) return aIsUpcoming ? -1 : 1;
  return aIsUpcoming
    ? compareScheduleDateAscending(a, b)
    : compareScheduleDateDescending(a, b);
}

function compareScheduleDateAscending(a: Schedule, b: Schedule) {
  return a.hiking_date.localeCompare(b.hiking_date) || a.start_time.localeCompare(b.start_time);
}

function compareScheduleDateDescending(a: Schedule, b: Schedule) {
  return b.hiking_date.localeCompare(a.hiking_date) || b.start_time.localeCompare(a.start_time);
}
