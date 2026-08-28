import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn(() => {
  throw new Error("NEXT_REDIRECT");
});
const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const singleMock = vi.fn();

vi.mock("next/navigation", () => ({ redirect: redirectMock, notFound: notFoundMock }));
vi.mock("@/lib/auth/guards", () => ({
  requireUser: vi.fn(async () => ({
    user: { id: "current-user" },
    supabase: {
      from: () => ({ select: () => ({ eq: () => ({ single: singleMock }) }) }),
    },
  })),
}));

describe("requireScheduleLeader", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows the schedule leader", async () => {
    singleMock.mockResolvedValue({ data: { id: "schedule-id", leader_id: "current-user" } });
    const { requireScheduleLeader } = await import("@/lib/schedules/guards");
    await expect(requireScheduleLeader("schedule-id")).resolves.toMatchObject({
      user: { id: "current-user" },
      schedule: { leader_id: "current-user" },
    });
  });

  it("redirects non-leaders away from edit", async () => {
    singleMock.mockResolvedValue({ data: { id: "schedule-id", leader_id: "another-user" } });
    const { requireScheduleLeader } = await import("@/lib/schedules/guards");
    await expect(requireScheduleLeader("schedule-id")).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/schedules/schedule-id");
  });
});
