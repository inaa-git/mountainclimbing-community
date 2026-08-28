import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUserMock = vi.fn();

vi.mock("@/lib/auth/guards", () => ({ requireUser: requireUserMock }));
vi.mock("@/components/schedules/schedule-form", () => ({
  ScheduleForm: () => null,
}));

describe("NewSchedulePage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks unauthenticated access through the server auth guard", async () => {
    requireUserMock.mockRejectedValue(new Error("NEXT_REDIRECT:/login"));
    const { default: NewSchedulePage } = await import("@/app/schedules/new/page");
    await expect(NewSchedulePage()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(requireUserMock).toHaveBeenCalledOnce();
  });
});
