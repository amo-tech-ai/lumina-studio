// IPI2-127 — wire the operator page gate into Next.js middleware so /app/*
// HTML is blocked when OPERATOR_AUTH_ENABLED=true (API routes have their own
// withOperatorAuth guard; this closes the page-level gap).
export { proxy as middleware, config } from "./proxy";
