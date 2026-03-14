import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Suspense, lazy, type ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Page from "../app/page";

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ default: ComponentType<any> }>) => lazy(loader),
}));

const mockResult = {
  requestId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  timestamp: "2026-03-14T12:00:00.000Z",
  middlewarePipeline: [{ name: "withLogging", status: "passed" }],
  geo: { country: "US" },
  rateLimit: { limit: "10", remaining: "9", reset: "9999999999" },
  client: { ip: "127.0.0.1" },
  durationMs: 42,
};

function renderPage() {
  return render(
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  );
}

describe("Page", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the pipeline and action buttons on initial load", () => {
    renderPage();
    expect(screen.getByText("next-edgepipe")).toBeInTheDocument();
    expect(screen.getByText("withLogging")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run Pipeline" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stress Test (15 requests)" })).toBeInTheDocument();
  });

  it("shows results panel after a successful fetch", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResult,
    } as Response);

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Run Pipeline" }));

    await waitFor(() => {
      expect(screen.getByText("a1b2c3d4…")).toBeInTheDocument();
    });
  });

  it("appends an entry to the request log after a successful fetch", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResult,
    } as Response);

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Run Pipeline" }));

    await waitFor(() => {
      expect(screen.getByText("200")).toBeInTheDocument();
    });
  });

  it("shows an error message when fetch throws", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Run Pipeline" }));

    await waitFor(() => {
      expect(
        screen.getByText("Request failed. Check your connection and try again.")
      ).toBeInTheDocument();
    });
  });

  it("clears the error on a subsequent successful fetch", async () => {
    vi.mocked(global.fetch)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResult,
      } as Response);

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Run Pipeline" }));

    await waitFor(() => {
      expect(
        screen.getByText("Request failed. Check your connection and try again.")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Run Pipeline" }));

    await waitFor(() => {
      expect(
        screen.queryByText("Request failed. Check your connection and try again.")
      ).not.toBeInTheDocument();
    });
  });

  it("shows an error message when stress test fetch throws", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Stress Test (15 requests)" }));

    await waitFor(() => {
      expect(
        screen.getByText("Stress test failed. Some requests may not have completed.")
      ).toBeInTheDocument();
    });
  });
});
