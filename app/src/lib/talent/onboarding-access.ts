const TALENT_SELF_SERVE_ROLES = new Set(["model"]);
const AGENCY_ORG_ROLES = new Set(["owner", "editor"]);

export function canAccessTalentOnboarding(input: {
  profileRole: string | null | undefined;
  orgRoles: Array<string | null | undefined>;
}): boolean {
  if (input.profileRole && TALENT_SELF_SERVE_ROLES.has(input.profileRole)) return true;
  return input.orgRoles.some((role) => typeof role === "string" && AGENCY_ORG_ROLES.has(role));
}
