import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ParticipantAuthorBadge } from "@/components/schedules/participant-author-badge";

afterEach(cleanup);

describe("ParticipantAuthorBadge", () => {
  it("shows the author badge for the schedule author", () => {
    render(<ParticipantAuthorBadge isAuthor />);

    expect(screen.getByText("작성자")).toBeInTheDocument();
  });

  it("does not show the author badge for a regular participant", () => {
    render(<ParticipantAuthorBadge isAuthor={false} />);

    expect(screen.queryByText("작성자")).not.toBeInTheDocument();
  });
});
