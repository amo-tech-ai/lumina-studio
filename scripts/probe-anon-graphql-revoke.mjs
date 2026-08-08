#!/usr/bin/env node
/**
 * IPI-680 · SB-SEC-002 — Prove anon GraphQL endpoint is closed after Approach A.
 *
 * Expects anon POST /graphql/v1 to lack a successful Query payload
 * (e.g. "pg_graphql extension is not enabled."), while REST brands still
 * returns HTTP 200 (empty under RLS is OK — proves REST path still works).
 *
 *   node scripts/probe-anon-graphql-revoke.mjs
 */
import { loadRepoEnv } from "./lib/script-env.mjs";

loadRepoEnv({ includeApp: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(2);
}

const headers = {
  apikey: anonKey,
  Authorization: `Bearer ${anonKey}`,
  "Content-Type": "application/json",
};

async function main() {
  const gqlRes = await fetch(`${url}/graphql/v1`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: "{ __typename }" }),
  });
  const gqlBody = await gqlRes.text();
  const gqlOkData =
    gqlRes.status === 200 &&
    (() => {
      try {
        const j = JSON.parse(gqlBody);
        return j?.data?.__typename === "Query" && !j?.errors?.length;
      } catch {
        return false;
      }
    })();

  const restRes = await fetch(`${url}/rest/v1/brands?select=id&limit=1`, {
    headers: { ...headers, Accept: "application/json" },
  });
  const restBody = await restRes.text();

  const graphqlClosed = !gqlOkData;
  const restAlive = restRes.status === 200;

  console.log(
    JSON.stringify(
      {
        graphql: {
          status: gqlRes.status,
          closed: graphqlClosed,
          bodyPreview: gqlBody.slice(0, 240),
        },
        rest_brands: {
          status: restRes.status,
          alive: restAlive,
          bodyPreview: restBody.slice(0, 120),
        },
        pass: graphqlClosed && restAlive,
      },
      null,
      2,
    ),
  );

  process.exit(graphqlClosed && restAlive ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
