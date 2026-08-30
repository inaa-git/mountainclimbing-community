import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ParticipationButton } from "@/components/schedules/participation-button";

vi.mock("@/app/schedules/actions", () => ({
  cancelScheduleParticipation: vi.fn(),
  joinSchedule: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

afterEach(cleanup);

const defaultProps = {
  scheduleId: "00000000-0000-4000-8000-000000000001",
  isAuthenticated: true,
  isLeader: false,
  isJoined: true,
  isFull: false,
};

describe("ParticipationButton", () => {
  it.each([
    ["completed", "완료된 산행"],
    ["cancelled", "취소된 산행"],
  ])("does not show cancellation for %s schedules", (scheduleStatus, label) => {
    render(<ParticipationButton {...defaultProps} isLeader scheduleStatus={scheduleStatus} />);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText("작성자 · 참가 중")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "참가 취소" })).not.toBeInTheDocument();
  });

  it("keeps cancellation available for closed schedules", () => {
    render(<ParticipationButton {...defaultProps} scheduleStatus="closed" />);

    expect(screen.getByRole("button", { name: "참가 취소" })).toBeInTheDocument();
  });

  it("allows a joined leader to cancel an open schedule", () => {
    render(<ParticipationButton {...defaultProps} isLeader scheduleStatus="open" />);

    expect(screen.getByText("작성자 · 참가 중")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "참가 취소" })).toBeInTheDocument();
  });

  it("allows a leader without participation to join an open schedule", () => {
    render(
      <ParticipationButton
        {...defaultProps}
        isLeader
        isJoined={false}
        scheduleStatus="open"
      />,
    );

    expect(screen.getByText("작성자 · 미참가")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "참가 신청" })).toBeInTheDocument();
  });
});
