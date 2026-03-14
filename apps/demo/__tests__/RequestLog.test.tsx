import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RequestLog } from "../app/_components/RequestLog";

const entries = [
  { n: 1, timestamp: "2026-03-14T12:00:00.000Z", status: 200, durationMs: 34 },
  { n: 2, timestamp: "2026-03-14T12:00:01.000Z", status: 429, durationMs: 12 },
];

describe("RequestLog", () => {
  it("renders nothing when entries is empty", () => {
    const { container } = render(<RequestLog entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a row for each entry", () => {
    render(<RequestLog entries={entries} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows status codes", () => {
    render(<RequestLog entries={entries} />);
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("429")).toBeInTheDocument();
  });

  it("shows duration for each entry", () => {
    render(<RequestLog entries={entries} />);
    expect(screen.getByText("34ms")).toBeInTheDocument();
    expect(screen.getByText("12ms")).toBeInTheDocument();
  });
});
