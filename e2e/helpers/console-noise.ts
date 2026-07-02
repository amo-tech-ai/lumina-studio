/** Shared console noise filters for Playwright forensics specs. */

export function isExtensionOnlyNoise(text: string): boolean {
  return (
    /chrome-extension:\/\//i.test(text) ||
    /installHook\.js/i.test(text) ||
    /react-devtools/i.test(text) ||
    /download the react devtools/i.test(text) ||
    /useCopilotKit must be used within CopilotKitProvider/i.test(text)
  );
}

export function isBenignAppNoise(text: string): boolean {
  return (
    /Failed to load resource: the server responded with a status of 404/i.test(text) ||
    /favicon\.ico/i.test(text) ||
    /useCopilotKit must be used within CopilotKitProvider/i.test(text)
  );
}
