import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PipelineViz } from "../app/_components/PipelineViz";

describe("PipelineViz", () => {
  it("renders all four middleware steps", () => {
    render(<PipelineViz />);
    expect(screen.getByText("withLogging")).toBeInTheDocument();
    expect(screen.getByText("withGeoBlock")).toBeInTheDocument();
    expect(screen.getByText("withRateLimit")).toBeInTheDocument();
    expect(screen.getByText("withAuth")).toBeInTheDocument();
  });

  it("renders step descriptions", () => {
    render(<PipelineViz />);
    expect(screen.getByText("Records timing & geo per request")).toBeInTheDocument();
    expect(screen.getByText("Blocks CN, RU, KP by country")).toBeInTheDocument();
    expect(screen.getByText("10 req/min per IP, in-memory")).toBeInTheDocument();
    expect(screen.getByText("Cookie token, public path bypass")).toBeInTheDocument();
  });

  it("renders arrows between steps", () => {
    render(<PipelineViz />);
    const arrows = screen.getAllByText("→");
    expect(arrows).toHaveLength(3);
  });
});
