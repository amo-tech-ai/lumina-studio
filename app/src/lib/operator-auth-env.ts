/** Zero-deps env gate — safe to import from next.config.ts at build time. */
export function isOperatorAuthEnforced(): boolean {
  return (
    process.env.OPERATOR_AUTH_ENABLED === "true" ||
    process.env.NODE_ENV === "production"
  );
}
