/**
 * TypeScript surface for Playwright specs — logic lives in qa-target.mjs (Node-loadable SSOT).
 */
export {
  QA_PROJECT_REF,
  PROD_PROJECT_REF,
  loadEnvLocalFiles,
  refuseQaTarget,
  assertQaOnly,
  jwtProjectRef,
  preflightOnboardingQaTarget,
  qaWebServerEnv,
} from "./qa-target.mjs";
