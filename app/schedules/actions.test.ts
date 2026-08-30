import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireUser: vi.fn(async () => ({
    supabase: { rpc: mocks.rpc, from: mocks.from },
    user: { id: "00000000-0000-4000-8000-000000000001" },
  })),
}));

vi.mock("@/lib/schedules/guards", () => ({
  requireScheduleLeader: vi.fn(async () => ({
    supabase: { from: mocks.from },
    user: { id: "00000000-0000-4000-8000-000000000001" },
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { createSchedule, updateSchedule } from "@/app/schedules/actions";

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

describe("createSchedule", () => {
  beforeEach(() => {
    mocks.rpc.mockReset();
    mocks.from.mockReset();
    mocks.update.mockReset();
    mocks.updateEq.mockReset();
    mocks.revalidatePath.mockReset();
    mocks.rpc.mockResolvedValue({
      data: { success: true, code: "created", schedule_id: "00000000-0000-4000-8000-000000000010" },
      error: null,
    });
    mocks.updateEq.mockResolvedValue({ error: null });
    mocks.update.mockReturnValue({ eq: mocks.updateEq });
    mocks.from.mockImplementation((table: string) => {
      if (table === "schedule_participants") {
        return {
          select: () => ({
            eq: () => ({
              eq: async () => ({ count: 1 }),
            }),
          }),
        };
      }
      if (table === "schedules") return { update: mocks.update };
      throw new Error(`Unexpected table: ${table}`);
    });
  });

  it.each([true, false])(
    "passes leader participation choice %s to the atomic creation RPC",
    async (joinAsParticipant) => {
      const result = await createSchedule({
        ...validSchedule,
        join_as_participant: joinAsParticipant,
      });

      expect(result.success).toBe(true);
      expect(mocks.rpc).toHaveBeenCalledWith("create_schedule", {
        schedule_data: expect.objectContaining({ title: validSchedule.title }),
        join_as_participant: joinAsParticipant,
      });
      expect(mocks.from).not.toHaveBeenCalled();
    },
  );

  it("does not forward client-controlled identity, timestamps, id, or status", async () => {
    await createSchedule({
      ...validSchedule,
      status: "completed",
      leader_id: "00000000-0000-4000-8000-000000000099",
      id: "00000000-0000-4000-8000-000000000098",
      created_at: "2020-01-01T00:00:00.000Z",
      updated_at: "2020-01-01T00:00:00.000Z",
      join_as_participant: true,
    });

    const scheduleData = mocks.rpc.mock.calls[0][1].schedule_data;
    expect(scheduleData).not.toHaveProperty("leader_id");
    expect(scheduleData).not.toHaveProperty("id");
    expect(scheduleData).not.toHaveProperty("created_at");
    expect(scheduleData).not.toHaveProperty("updated_at");
    expect(scheduleData).not.toHaveProperty("status");
  });

  it("keeps the existing leader update action working", async () => {
    const result = await updateSchedule(
      "00000000-0000-4000-8000-000000000010",
      validSchedule,
    );

    expect(result.success).toBe(true);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: "open" }));
    expect(mocks.updateEq).toHaveBeenCalledWith(
      "id",
      "00000000-0000-4000-8000-000000000010",
    );
  });
});
