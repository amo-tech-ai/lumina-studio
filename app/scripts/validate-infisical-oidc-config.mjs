#!/usr/bin/env node
/**
 * IPI-606 — fail closed when infisical-oidc is selected but repo variables are unset.
 */
const identityId = process.env.INFISICAL_IDENTITY_ID?.trim();
const projectSlug = process.env.INFISICAL_PROJECT_SLUG?.trim();
const secretSource = process.env.SECRET_SOURCE?.trim();

if (secretSource !== "infisical-oidc") {
  console.log("skip: secret_source is not infisical-oidc");
  process.exit(0);
}

const missing = [];
if (!identityId) missing.push("INFISICAL_IDENTITY_ID");
if (!projectSlug) missing.push("INFISICAL_PROJECT_SLUG");

if (missing.length > 0) {
  console.error(
    `Error: secret_source=infisical-oidc requires repo variables: ${missing.join(", ")}`,
  );
  console.error("Configure them under Settings → Secrets and variables → Actions → Variables.");
  process.exit(1);
}

console.log("infisical oidc config ok");
