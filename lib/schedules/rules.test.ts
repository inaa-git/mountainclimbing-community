import { describe, expect, it } from "vitest";

import {
  canCancelScheduleParticipation,
  decideScheduleJoin,
  isCapacityValid,
} from "@/lib/schedules/rules";

describe("schedule participation rules", () => {
  it("prevents duplicate participation", () => {
    expect(
      decideScheduleJoin({
        scheduleStatus: "open",
        participantStatus: "joined",
        joinedCount: 2,
        maxParticipants: 8,
      }),
    ).toBe("already_joined");
  });

  it("prevents capacity overflow", () => {
    expect(
      decideScheduleJoin({
        scheduleStatus: "open",
        participantStatus: null,
        joinedCount: 8,
        maxParticipants: 8,
      }),
    ).toBe("schedule_full");
  });

  it("prevents joining cancelled schedules", () => {
    expect(
      decideScheduleJoin({
        scheduleStatus: "cancelled",
        participantStatus: null,
        joinedCount: 1,
        maxParticipants: null,
      }),
    ).toBe("schedule_not_open");
  });

  it("prevents leaders from cancelling participation", () => {
    expect(canCancelScheduleParticipation("leader", "leader")).toBe(false);
    expect(canCancelScheduleParticipation("member", "leader")).toBe(true);
  });

  it("prevents lowering capacity below joined count", () => {
    expect(isCapacityValid(3, 4)).toBe(false);
    expect(isCapacityValid(4, 4)).toBe(true);
    expect(isCapacityValid(null, 100)).toBe(true);
  });
});
