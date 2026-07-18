/** True when CopilotKit Intelligence (threads/persistence) is fully configured. */
export function isCopilotIntelligenceEnabled(): boolean {
  const license = process.env.COPILOTKIT_LICENSE_TOKEN?.trim();
  if (!license) return false;
  return Boolean(
    process.env.INTELLIGENCE_API_KEY?.trim() &&
      process.env.INTELLIGENCE_API_URL?.trim() &&
      process.env.INTELLIGENCE_GATEWAY_WS_URL?.trim(),
  );
}
