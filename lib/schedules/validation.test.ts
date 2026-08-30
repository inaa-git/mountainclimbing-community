import { describe, expect, it } from "vitest";

import { createScheduleFormSchema, scheduleFormSchema } from "@/lib/schedules/validation";

const validSchedule = {
  title: "북한산 주말 산행",
  description: "함께 안전하게 산행해요.",
  schedule_type: "general",
  hiking_date: "2026-09-05",
  start_time: "08:00",
  end_time: "14:00",
  meeting_location: "북한산성 탐방지원센터",
  region: "서울",
  mountain_name: "북한산",
  course_description: "백운대 왕복",
  difficulty: "medium",
  max_participants: 8,
  preparation: "물, 간식",
  transportation: "대중교통",
  estimated_distance_km: 9.5,
  estimated_duration_minutes: 300,
  status: "open",
};

describe("scheduleFormSchema", () => {
  it("accepts a valid schedule", () => {
    expect(scheduleFormSchema.safeParse(validSchedule).success).toBe(true);
  });

  it("requires an explicit leader participation choice when creating", () => {
    expect(
      createScheduleFormSchema.safeParse({ ...validSchedule, join_as_participant: true }).success,
    ).toBe(true);
    expect(createScheduleFormSchema.safeParse(validSchedule).success).toBe(false);
  });

  it("rejects invalid capacity, distance, duration, and time range", () => {
    const result = scheduleFormSchema.safeParse({
      ...validSchedule,
      max_participants: 0,
      estimated_distance_km: -1,
      estimated_duration_minutes: -10,
      end_time: "07:00",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toEqual(
        expect.arrayContaining([
          "max_participants",
          "estimated_distance_km",
          "estimated_duration_minutes",
          "end_time",
        ]),
      );
    }
  });
});
