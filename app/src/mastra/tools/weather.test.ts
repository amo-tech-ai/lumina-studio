import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { weatherTool } from "./index";

function fakeResponse({
  ok,
  status,
  body,
}: {
  ok: boolean;
  status: number;
  body?: string;
}): Response {
  return {
    ok,
    status,
    json: async () => JSON.parse(body ?? "null"),
  } as unknown as Response;
}

const GEOCODING_OK = JSON.stringify({
  results: [{ latitude: 48.85, longitude: 2.35, name: "Paris" }],
});

const FORECAST_OK = JSON.stringify({
  current: {
    time: "2026-06-24T12:00",
    temperature_2m: 22,
    apparent_temperature: 24,
    relative_humidity_2m: 55,
    wind_speed_10m: 12,
    wind_gusts_10m: 18,
    weather_code: 2,
  },
});

describe("weatherTool — HTTP integration (mocked)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("geocoding-api.open-meteo.com")) {
          return fakeResponse({ ok: true, status: 200, body: GEOCODING_OK });
        }
        if (url.includes("api.open-meteo.com")) {
          return fakeResponse({ ok: true, status: 200, body: FORECAST_OK });
        }
        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns mapped weather fields on success", async () => {
    const result = await weatherTool.execute!({ location: "Paris" });
    expect(result).toEqual({
      temperature: 22,
      feelsLike: 24,
      humidity: 55,
      windSpeed: 12,
      windGust: 18,
      conditions: "Partly cloudy",
      location: "Paris",
    });
  });

  it("throws when geocoding returns no results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        fakeResponse({ ok: true, status: 200, body: '{"results":[]}' }),
      ),
    );
    await expect(weatherTool.execute!({ location: "Nowhere" })).rejects.toThrow(
      /Location 'Nowhere' not found/,
    );
  });

  it("throws on geocoding HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => fakeResponse({ ok: false, status: 503 })),
    );
    await expect(weatherTool.execute!({ location: "Paris" })).rejects.toThrow(
      /Geocoding API request failed/,
    );
  });

  it("throws on forecast HTTP error after successful geocoding", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("geocoding-api")) {
          return fakeResponse({ ok: true, status: 200, body: GEOCODING_OK });
        }
        return fakeResponse({ ok: false, status: 502 });
      }),
    );
    await expect(weatherTool.execute!({ location: "Paris" })).rejects.toThrow(
      /Weather API request failed/,
    );
  });

  it("maps unknown weather_code to 'Unknown'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("geocoding-api")) {
          return fakeResponse({ ok: true, status: 200, body: GEOCODING_OK });
        }
        return fakeResponse({
          ok: true,
          status: 200,
          body: JSON.stringify({
            current: {
              ...JSON.parse(FORECAST_OK).current,
              weather_code: 999,
            },
          }),
        });
      }),
    );
    const result = await weatherTool.execute!({ location: "Paris" });
    expect(result?.conditions).toBe("Unknown");
  });
});
