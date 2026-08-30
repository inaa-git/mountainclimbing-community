import { describe, expect, it } from "vitest";

import {
  classifyScheduleActivities,
  getKoreanDateKey,
  type Participation,
  type Schedule,
} from "@/lib/schedules/activity";

const today = "2026-08-30";

describe("schedule activity classification", () => {
  it("includes a joined leader schedule in current participation", () => {
    const leaderSchedule = makeSchedule({ id: "leader", leader_id: "user-1" });
    const result = classify({
      ledSchedules: [leaderSchedule],
      participations: [makeParticipation("leader")],
      participantSchedules: [leaderSchedule],
    });

    expect(result.ledSchedules.map((schedule) => schedule.id)).toEqual(["leader"]);
    expect(result.joinedSchedules.map((activity) => activity.schedule.id)).toEqual(["leader"]);
  });

  it("does not include a leader schedule without a participant row in current participation", () => {
    const leaderSchedule = makeSchedule({ id: "leader", leader_id: "user-1" });
    const result = classify({ ledSchedules: [leaderSchedule] });

    expect(result.ledSchedules.map((schedule) => schedule.id)).toEqual(["leader"]);
    expect(result.joinedSchedules).toEqual([]);
  });

  it("classifies a future joined schedule as currently joined", () => {
    const schedule = makeSchedule({ id: "future", hiking_date: "2026-09-01" });
    const result = classify({
      participations: [makeParticipation("future")],
      participantSchedules: [schedule],
    });

    expect(result.joinedSchedules.map((activity) => activity.schedule.id)).toEqual(["future"]);
    expect(result.pastActivities).toEqual([]);
  });

  it("classifies a schedule before today as past activity", () => {
    const schedule = makeSchedule({ id: "past", hiking_date: "2026-08-29" });
    const result = classify({
      participations: [makeParticipation("past")],
      participantSchedules: [schedule],
    });

    expect(result.pastActivities.map((activity) => activity.schedule.id)).toEqual(["past"]);
  });

  it("classifies a joined leader schedule before today as past activity", () => {
    const schedule = makeSchedule({
      id: "past-leader",
      leader_id: "user-1",
      hiking_date: "2026-08-29",
    });
    const result = classify({
      ledSchedules: [schedule],
      participations: [makeParticipation("past-leader")],
      participantSchedules: [schedule],
    });

    expect(result.pastActivities.map((activity) => activity.schedule.id)).toEqual(["past-leader"]);
  });

  it("classifies a future completed schedule as past activity", () => {
    const schedule = makeSchedule({ id: "completed", status: "completed", hiking_date: "2026-09-02" });
    const result = classify({
      participations: [makeParticipation("completed")],
      participantSchedules: [schedule],
    });

    expect(result.pastActivities.map((activity) => activity.schedule.id)).toEqual(["completed"]);
    expect(result.joinedSchedules).toEqual([]);
  });

  it("excludes a cancelled participation from past activity", () => {
    const schedule = makeSchedule({ id: "withdrawn", hiking_date: "2026-09-03" });
    const result = classify({
      participations: [makeParticipation("withdrawn", "cancelled")],
      participantSchedules: [schedule],
    });

    expect(result.pastActivities).toEqual([]);
    expect(result.joinedSchedules).toEqual([]);
  });

  it("excludes a cancelled schedule from past activity", () => {
    const schedule = makeSchedule({ id: "cancelled", status: "cancelled", hiking_date: "2026-08-20" });
    const result = classify({
      participations: [makeParticipation("cancelled")],
      participantSchedules: [schedule],
    });

    expect(result.pastActivities).toEqual([]);
    expect(result.joinedSchedules).toEqual([]);
  });

  it("uses the Korean calendar date at the UTC date boundary", () => {
    expect(getKoreanDateKey(new Date("2026-08-29T15:00:00.000Z"))).toBe("2026-08-30");
    expect(getKoreanDateKey(new Date("2026-08-29T14:59:59.999Z"))).toBe("2026-08-29");
  });
});

function classify({
  ledSchedules = [],
  participations = [],
  participantSchedules = [],
}: {
  ledSchedules?: Schedule[];
  participations?: Participation[];
  participantSchedules?: Schedule[];
}) {
  return classifyScheduleActivities({
    today,
    ledSchedules,
    participations,
    participantSchedules,
  });
}

function makeParticipation(scheduleId: string, status: Participation["status"] = "joined") {
  return {
    schedule_id: scheduleId,
    status,
    joined_at: "2026-08-01T00:00:00.000Z",
    cancelled_at: status === "cancelled" ? "2026-08-02T00:00:00.000Z" : null,
  } satisfies Participation;
}

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: "schedule-1",
    title: "테스트 산행",
    description: null,
    schedule_type: "general",
    leader_id: "leader-1",
    hiking_date: "2026-08-30",
    start_time: "09:00:00",
    end_time: null,
    meeting_location: "등산로 입구",
    region: "서울",
    mountain_name: "북한산",
    course_description: null,
    difficulty: "medium",
    max_participants: 10,
    preparation: null,
    transportation: null,
    estimated_distance_km: null,
    estimated_duration_minutes: null,
    status: "open",
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}
