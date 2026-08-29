import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn(() => {
  throw new Error("NEXT_REDIRECT");
});
const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const maybeSingleMock = vi.fn();

vi.mock("next/navigation", () => ({ redirect: redirectMock, notFound: notFoundMock }));
vi.mock("@/lib/auth/guards", () => ({
  requireUser: vi.fn(async () => ({
    user: { id: "current-user" },
    supabase: {
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }) }),
    },
  })),
}));

describe("requireScheduleLeader", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows the schedule leader", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { id: "schedule-id", leader_id: "current-user" },
      error: null,
    });
    const { requireScheduleLeader } = await import("@/lib/schedules/guards");
    await expect(requireScheduleLeader("schedule-id")).resolves.toMatchObject({
      user: { id: "current-user" },
      schedule: { leader_id: "current-user" },
    });
  });

  it("redirects non-leaders away from edit", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { id: "schedule-id", leader_id: "another-user" },
      error: null,
    });
    const { requireScheduleLeader } = await import("@/lib/schedules/guards");
    await expect(requireScheduleLeader("schedule-id")).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/schedules/schedule-id");
  });

  it("returns not found only when the schedule does not exist", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { requireScheduleLeader } = await import("@/lib/schedules/guards");

    await expect(requireScheduleLeader("missing-schedule")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it("preserves Supabase lookup errors instead of converting them to 404", async () => {
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "permission denied for table schedules" },
    });
    const { requireScheduleLeader } = await import("@/lib/schedules/guards");

    await expect(requireScheduleLeader("schedule-id")).rejects.toThrow(
      "Failed to load schedule for leader authorization (42501)",
    );
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
