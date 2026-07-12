#!/usr/bin/env node
/**
 * Check for unverified material claims in Cloudflare-related PRs and code.
 *
 * Flags claims about status, pricing, performance, or risk without citing official sources.
 * Part of cf-wf skill's Stage 2 (Evidence Collection) — Official Sources Rule.
 *
 * Usage:
 *   npm run check:material-claims [--fix]
 *   node scripts/check-material-claims.mjs services/cloudflare-worker/src
 *
 * Exit code: 0 if no issues, 1 if issues found (unless --fix applied successfully).
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const patterns = [
  {
    name: 'unverified-same-pricing',
    pattern: /same pricing/i,
    message: 'Material claim "same pricing" requires official source (link to Cloudflare pricing page)',
    severity: 'error',
  },
  {
    name: 'unverified-same-performance',
    pattern: /same performance/i,
    message: 'Material claim "same performance" requires benchmark or official docs',
    severity: 'error',
  },
  {
    name: 'unverified-zero-risk',
    pattern: /zero risk/i,
    message: 'Material claim "zero risk" requires proof (security audit, test evidence, or official docs)',
    severity: 'error',
  },
  {
    name: 'unverified-currently-supported',
    pattern: /currently supported|is supported/i,
    context: /model|feature|endpoint/i,
    message: 'Material claim "currently supported" requires link to official Cloudflare docs or MCP result',
    severity: 'warn',
  },
  {
    name: 'unverified-deprecation',
    pattern: /deprecated(?:\s+as\s+of)?/i,
    context: /model|endpoint|feature/i,
    message: 'Deprecation claim requires link to Cloudflare changelog with exact date',
    severity: 'error',
  },
];

// Exclude files that are obviously generated or vendored
const excludePatterns = [/node_modules/, /\.next/, /dist/, /build/, /\.open-next/];

function shouldCheck(filePath) {
  return (
    (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.md')) &&
    !excludePatterns.some((p) => p.test(filePath))
  );
}

function checkFile(filePath) {
  let issues = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    patterns.forEach((pattern) => {
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;

        // Skip code comments and markdown links (assumed verified)
        if (line.trim().startsWith('//') && line.includes('https://')) return;
        if (line.includes('[') && line.includes(']') && line.includes('(https')) return;

        if (pattern.pattern.test(line)) {
          // If pattern has context requirement, check if context is present
          if (pattern.context && !pattern.context.test(line)) {
            return; // Context mismatch, skip
          }

          // Check if line has an official source (link or MCP reference)
          const hasSource =
            line.includes('https://developers.cloudflare.com') ||
            line.includes('https://github.com/') ||
            line.includes('MCP') ||
            line.includes('cloudflare_docs') ||
            line.includes('TBD');

          if (!hasSource) {
            issues.push({
              file: filePath,
              line: lineNum,
              text: line.trim().substring(0, 80),
              pattern: pattern.name,
              message: pattern.message,
              severity: pattern.severity,
            });
          }
        }
      });
    });
  } catch (err) {
    // Silently skip files that can't be read
  }

  return issues;
}

function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');

  let filePaths = args.filter((arg) => !arg.startsWith('--'));

  if (filePaths.length === 0) {
    // If no files specified, check staged files in git
    try {
      const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
      filePaths = output.split('\n').filter((f) => f && shouldCheck(f));
    } catch {
      filePaths = [];
    }
  }

  if (filePaths.length === 0) {
    console.log('✅ No Cloudflare files to check.');
    process.exit(0);
  }

  let allIssues = [];

  filePaths.forEach((filePath) => {
    if (shouldCheck(filePath)) {
      allIssues = allIssues.concat(checkFile(filePath));
    }
  });

  if (allIssues.length === 0) {
    console.log('✅ No unverified material claims found.');
    process.exit(0);
  }

  // Group by severity
  const errors = allIssues.filter((i) => i.severity === 'error');
  const warnings = allIssues.filter((i) => i.severity === 'warn');

  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):\n`);
    warnings.forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`     Pattern: ${issue.pattern}`);
      console.log(`     Message: ${issue.message}`);
      console.log(`     Code: ${issue.text}`);
      console.log();
    });
  }

  if (errors.length > 0) {
    console.log(`\n🔴 Errors (${errors.length}):\n`);
    errors.forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`     Pattern: ${issue.pattern}`);
      console.log(`     Message: ${issue.message}`);
      console.log(`     Code: ${issue.text}`);
      console.log();
    });

    console.log('\n📖 Fix: Add official source link or mark as "TBD" in comments/docs\n');
    console.log('Examples:');
    console.log('  ✅ // See https://developers.cloudflare.com/workers-ai/pricing/');
    console.log('  ✅ // MCP: cloudflare_docs search result verified');
    console.log('  ✅ // Pricing TBD — needs official Cloudflare docs');
    console.log();

    process.exit(fix ? 1 : 1); // Always fail on errors; --fix flag doesn't auto-correct these
  }

  console.log(`\n✅ Material claims verified (${allIssues.length} warnings, 0 errors).`);
  process.exit(0);
}

main();
