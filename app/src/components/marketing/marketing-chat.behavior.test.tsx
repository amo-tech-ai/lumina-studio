// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ToolCallStatus } from "@copilotkit/core";
import { getAnonId, LeadResultView, submitMarketingLead } from "./marketing-chat-lead";

describe("marketing-chat — getAnonId", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("crypto", {
      randomUUID: () => "test-uuid-1234",
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("creates and persists ipix_anon_id in localStorage", () => {
    const first = getAnonId();
    const second = getAnonId();
    expect(first).toBe("anon-test-uuid-1234");
    expect(second).toBe(first);
    expect(localStorage.getItem("ipix_anon_id")).toBe(first);
  });
});

describe("marketing-chat — submitMarketingLead", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns submitted:draftId on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ draftId: "d-42", status: "draft" }), {
          status: 200,
        }),
      ),
    );

    const result = await submitMarketingLead(
      {
        name: "Alex",
        email: "alex@brand.co",
        service_interest: "shopify",
        message_summary: "Shopify shoot inquiry",
      },
      "anon-xyz",
    );

    expect(result).toBe("submitted:d-42");
    expect(fetch).toHaveBeenCalledWith(
      "/api/marketing-lead",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Alex",
          email: "alex@brand.co",
          service_interest: "shopify",
          message_summary: "Shopify shoot inquiry",
          anon_id: "anon-xyz",
        }),
      }),
    );
  });

  it("returns error: prefix when the API responds with a failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Validation failed" }), { status: 422 }),
      ),
    );

    const result = await submitMarketingLead(
      {
        name: "Alex",
        email: "alex@brand.co",
        service_interest: "shopify",
        message_summary: "Shopify shoot inquiry",
      },
      "anon-xyz",
    );

    expect(result).toBe("error:Validation failed");
  });
});

describe("marketing-chat — LeadResultView", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows pending copy while the tool call is in progress", () => {
    render(
      <LeadResultView
        name="capture_lead"
        toolCallId="tc-1"
        args={{}}
        status={ToolCallStatus.InProgress}
        result={undefined}
      />,
    );
    expect(screen.getByText(/Connecting you with the team/i)).toBeTruthy();
  });

  it("renders success state with draft reference", () => {
    render(
      <LeadResultView
        name="capture_lead"
        toolCallId="tc-2"
        args={{}}
        status={ToolCallStatus.Complete}
        result="submitted:d-99"
      />,
    );
    expect(screen.getByTestId("lead-draft-d-99")).toBeTruthy();
    expect(screen.getByText(/Inquiry received/i)).toBeTruthy();
  });

  it("renders failure state when result is not submitted:", () => {
    render(
      <LeadResultView
        name="capture_lead"
        toolCallId="tc-3"
        args={{}}
        status={ToolCallStatus.Complete}
        result="error:Validation failed"
      />,
    );
    expect(screen.getByText(/Submission failed/i)).toBeTruthy();
  });
});
