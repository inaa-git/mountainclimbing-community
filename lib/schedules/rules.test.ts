import { describe, expect, it } from "vitest";

import {
  canCancelScheduleParticipation,
  decideScheduleJoin,
  isCapacityValid,
  shouldCreateLeaderParticipation,
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

  it.each(["completed", "cancelled"])("prevents leaders from joining %s schedules", (scheduleStatus) => {
    expect(
      decideScheduleJoin({
        scheduleStatus,
        participantStatus: null,
        joinedCount: 1,
        maxParticipants: null,
      }),
    ).toBe("schedule_not_open");
  });

  it("creates a leader participant row only when selected", () => {
    expect(shouldCreateLeaderParticipation(true)).toBe(true);
    expect(shouldCreateLeaderParticipation(false)).toBe(false);
  });

  it("allows leaders and members to cancel active participation", () => {
    expect(canCancelScheduleParticipation("open")).toBe(true);
    expect(canCancelScheduleParticipation("closed")).toBe(true);
  });

  it("prevents cancellation after a schedule is finalized", () => {
    expect(canCancelScheduleParticipation("completed")).toBe(false);
    expect(canCancelScheduleParticipation("cancelled")).toBe(false);
  });

  it("allows a leader to join later and rejoin after cancellation", () => {
    expect(
      decideScheduleJoin({
        scheduleStatus: "open",
        participantStatus: null,
        joinedCount: 0,
        maxParticipants: 2,
      }),
    ).toBe("joined");
    expect(
      decideScheduleJoin({
        scheduleStatus: "open",
        participantStatus: "cancelled",
        joinedCount: 0,
        maxParticipants: 2,
      }),
    ).toBe("joined");
  });

  it("counts joined leaders toward capacity and blocks a full schedule", () => {
    expect(
      decideScheduleJoin({
        scheduleStatus: "open",
        participantStatus: null,
        joinedCount: 1,
        maxParticipants: 1,
      }),
    ).toBe("schedule_full");
  });

  it("does not promote reserved waitlist rows through normal join", () => {
    expect(
      decideScheduleJoin({
        scheduleStatus: "open",
        participantStatus: "waitlisted",
        joinedCount: 1,
        maxParticipants: 5,
      }),
    ).toBe("waitlist_reserved");
  });

  it("prevents lowering capacity below joined count", () => {
    expect(isCapacityValid(3, 4)).toBe(false);
    expect(isCapacityValid(4, 4)).toBe(true);
    expect(isCapacityValid(null, 100)).toBe(true);
  });
});
