import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultsPanel } from "../app/_components/ResultsPanel";

const baseResult = {
  requestId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  timestamp: "2026-03-14T12:00:00.000Z",
  middlewarePipeline: [
    { name: "withLogging", status: "passed" },
    { name: "withGeoBlock", status: "passed" },
  ],
  geo: { country: "US" },
  rateLimit: { limit: "10", remaining: "7", reset: "9999999999" },
  client: { ip: "127.0.0.1" },
  durationMs: 42,
};

describe("ResultsPanel", () => {
  it("shows truncated request ID", () => {
    render(<ResultsPanel result={baseResult} />);
    expect(screen.getByText("a1b2c3d4…")).toBeInTheDocument();
  });

  it("shows geo country", () => {
    render(<ResultsPanel result={baseResult} />);
    expect(screen.getByText("US")).toBeInTheDocument();
  });

  it("shows client IP", () => {
    render(<ResultsPanel result={baseResult} />);
    expect(screen.getByText("127.0.0.1")).toBeInTheDocument();
  });

  it("shows remaining/limit rate limit counts", () => {
    render(<ResultsPanel result={baseResult} />);
    expect(screen.getByText("7/10 remaining")).toBeInTheDocument();
  });

  it("shows depleted state when remaining is 0", () => {
    const depleted = {
      ...baseResult,
      rateLimit: { limit: "10", remaining: "0", reset: "9999999999" },
    };
    render(<ResultsPanel result={depleted} />);
    expect(screen.getByText("0/10 remaining")).toBeInTheDocument();
  });

  it("renders each middleware pipeline entry", () => {
    render(<ResultsPanel result={baseResult} />);
    expect(screen.getByText("withLogging")).toBeInTheDocument();
    expect(screen.getByText("withGeoBlock")).toBeInTheDocument();
  });

  it("shows response time", () => {
    render(<ResultsPanel result={baseResult} />);
    expect(screen.getByText("42ms")).toBeInTheDocument();
  });
});
