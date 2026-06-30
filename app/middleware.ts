// Next.js middleware — wires the operator auth gate from src/proxy.ts.
// IPI2-127: Blocks unauthenticated /app/* access when OPERATOR_AUTH_ENABLED=true.
export { proxy as default, config } from "./src/proxy";
