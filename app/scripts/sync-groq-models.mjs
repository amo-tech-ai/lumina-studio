#!/usr/bin/env node
/**
 * Copies repo SSOT `config/groq-models.json` into the Workers bundle path.
 * Strips `$schema` from the bundled copy — it points at a relative
 * `./groq-models.schema.json` that lives next to the SSOT in `config/`, not
 * next to the bundled copy in `app/src/lib/ai/`, so it would be a dangling
 * reference there.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(appDir, "..", "config", "groq-models.json");
const dest = join(appDir, "src", "lib", "ai", "groq-models.ssot.json");

const { $schema, ...config } = JSON.parse(readFileSync(src, "utf8"));
writeFileSync(dest, `${JSON.stringify(config, null, 2)}\n`);
