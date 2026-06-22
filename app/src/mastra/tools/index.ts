import { createTool } from "@mastra/core/tools";
import { z } from "zod";

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}
interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

export type WeatherToolResult = z.infer<typeof WeatherToolResultSchema>;

const WeatherToolResultSchema = z.object({
  temperature: z.number(),
  feelsLike: z.number(),
  humidity: z.number(),
  windSpeed: z.number(),
  windGust: z.number(),
  conditions: z.string(),
  location: z.string(),
});

export const weatherTool = createTool({
  id: "get-weather",
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name"),
  }),
  outputSchema: WeatherToolResultSchema,
  execute: async (inputData) => {
    return await getWeather(inputData.location);
  },
});

async function getWeather(location: string) {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  if (!geocodingResponse.ok) {
    throw new Error(
      `Geocoding API request failed for '${location}' (HTTP ${geocodingResponse.status})`,
    );
  }
  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;

  const response = await fetch(weatherUrl);
  if (!response.ok) {
    throw new Error(
      `Weather API request failed for '${name}' (HTTP ${response.status})`,
    );
  }
  const data = (await response.json()) as WeatherResponse;

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name,
  };
}

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return conditions[code] || "Unknown";
}

// Agent Tool Registry (IPI2-84) — the single discoverable place agents pull
// tools from. Register every agent tool here; agents import `agentTools` rather
// than individual tools so the surface is auditable in one location.
//
// Convention:
//  - READ tools: query Supabase with an RLS-scoped client directly, or a public
//    API (like weatherTool). No edge layer needed.
//  - WRITE tools: call a Supabase Edge Function via `callEdgeFunction` (./edge.ts)
//    AFTER a useInterrupt HITL approval — never write durable tables directly
//    (no silent writes; IPI2-116 pattern). Real write tools (analyzeBrandUrl,
//    commitApprovedBrandDraft, …) land with their edge functions + auth (IPI2-83/127).
export const agentTools = {
  weatherTool,
} as const;

export type AgentToolName = keyof typeof agentTools;

export { callEdgeFunction, EdgeFunctionError } from "./edge";
