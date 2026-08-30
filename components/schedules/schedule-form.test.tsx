import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/schedules/actions", () => ({
  createSchedule: vi.fn(),
  updateSchedule: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { ScheduleForm } from "@/components/schedules/schedule-form";

describe("ScheduleForm", () => {
  it("checks leader participation by default when creating a schedule", () => {
    render(<ScheduleForm mode="create" />);

    expect(
      screen.getByRole("checkbox", { name: "이 산행에 나도 참가합니다" }),
    ).toBeChecked();
  });
});
