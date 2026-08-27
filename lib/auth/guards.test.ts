import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn(() => {
  throw new Error("NEXT_REDIRECT:/login");
});
const getUserMock = vi.fn();

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}));

describe("requireUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects unauthenticated users to login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { requireUser } = await import("@/lib/auth/guards");
    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
