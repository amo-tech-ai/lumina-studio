/** Re-export QA creds loader — reads `.env.local` Email/Password when QA_* unset. */
export { getQaCredentials, loadEnvLocal } from "../../scripts/lib/qa-credentials.mjs";
