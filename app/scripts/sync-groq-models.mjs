#!/usr/bin/env node
/** Copies repo SSOT `config/groq-models.json` into the Workers bundle path. */
import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(appDir, "..", "config", "groq-models.json");
const dest = join(appDir, "src", "lib", "ai", "groq-models.ssot.json");

copyFileSync(src, dest);
