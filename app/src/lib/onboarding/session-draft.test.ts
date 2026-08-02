import { describe, expect, it } from "vitest";
import {
  answersToOnboardingForm,
  parseDraftAnswers,
  serializeDraftAnswers,
} from "./session-draft";
import { EMPTY_ANSWERS } from "./navigation";

describe("session-draft", () => {
  it("round-trips answers", () => {
    const answers = {
      ...EMPTY_ANSWERS,
      build: "agency",
      brandName: "Maison",
      websiteUrl: "https://maison.test",
      listed: { shopify: true },
      grow: "fast",
    };
    expect(parseDraftAnswers(serializeDraftAnswers(answers))).toEqual(answers);
  });

  it("falls back to empty on garbage", () => {
    expect(parseDraftAnswers(null)).toEqual(EMPTY_ANSWERS);
    expect(parseDraftAnswers("x")).toEqual(EMPTY_ANSWERS);
  });

  it("maps to materialize form", () => {
    expect(
      answersToOnboardingForm({
        build: "DTC",
        brandName: "  Acme ",
        websiteUrl: " https://acme.test ",
        listed: {},
        grow: "Scale",
      }),
    ).toEqual({
      brandName: "Acme",
      websiteUrl: "https://acme.test",
      instagramHandle: "",
      industry: "DTC",
      goal: "Scale",
    });
  });
});
