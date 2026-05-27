#!/usr/bin/env node

/**
 * Translate handbook .md files from Spanish to English using Claude API.
 *
 * Usage:
 *   node scripts/translate.js [--version V1.0.0] [--tier all|full|lite|redux] [--force]
 *
 * Defaults: translates _content/current/, all tiers.
 * With --version, translates _content/archive/{version}/.
 * Skips files that already have an English translation unless --force is used.
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, "..", "_content");

const SYSTEM_PROMPT = `You are a professional translator specializing in corporate documentation.
Translate the following Spanish markdown document to English.

Rules:
- Preserve ALL markdown formatting exactly (headings, lists, tables, links, bold, italic, code blocks).
- Keep proper nouns unchanged: company names (Modulor Studios, mendesaltaren, Tailor Hub, SSTIL, Nocodehackers, FIK, Minimum), product names, person names, city names.
- Keep URLs, email addresses, and file paths unchanged.
- Translate section titles and body text naturally — not word-for-word.
- Maintain the same document structure and heading hierarchy.
- Do NOT add any commentary, notes, or explanations — output ONLY the translated markdown.`;

const DELAY_MS = 2000;

async function main() {
  const { values } = parseArgs({
    options: {
      version: { type: "string", short: "v" },
      tier: { type: "string", short: "t", default: "all" },
      force: { type: "boolean", short: "f", default: false },
    },
  });

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required.");
    process.exit(1);
  }

  const client = new Anthropic();

  // Determine base directory
  const baseDir = values.version
    ? join(CONTENT_DIR, "archive", values.version)
    : join(CONTENT_DIR, "current");

  if (!existsSync(baseDir)) {
    console.error(`Error: Directory not found: ${baseDir}`);
    process.exit(1);
  }

  // Determine tiers
  const allTiers = ["full", "lite", "redux"];
  const tiers = values.tier === "all" ? allTiers : [values.tier];

  for (const tier of tiers) {
    if (!allTiers.includes(tier)) {
      console.error(`Error: Invalid tier "${tier}". Use: full, lite, redux, or all.`);
      process.exit(1);
    }
  }

  const label = values.version || "current";
  console.log(`\nTranslating handbook: ${label}`);
  console.log(`Tiers: ${tiers.join(", ")}`);
  console.log(`Force: ${values.force}\n`);

  let translated = 0;
  let skipped = 0;

  for (const tier of tiers) {
    const tierDir = join(baseDir, tier);
    if (!existsSync(tierDir)) {
      console.log(`  [skip] Tier "${tier}" not found, skipping.`);
      continue;
    }

    const enDir = join(tierDir, "en");
    mkdirSync(enDir, { recursive: true });

    const files = readdirSync(tierDir).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const enFile = join(enDir, file);

      if (existsSync(enFile) && !values.force) {
        console.log(`  [skip] ${tier}/en/${file} — already exists`);
        skipped++;
        continue;
      }

      const content = readFileSync(join(tierDir, file), "utf-8");
      console.log(`  [translating] ${tier}/${file} (${content.length} chars)...`);

      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8192,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content }],
        });

        const translatedText = response.content
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("");

        writeFileSync(enFile, translatedText, "utf-8");
        console.log(`  [done] ${tier}/en/${file} (${translatedText.length} chars)`);
        translated++;

        // Delay to respect rate limits
        if (files.indexOf(file) < files.length - 1) {
          await new Promise((r) => setTimeout(r, DELAY_MS));
        }
      } catch (err) {
        console.error(`  [error] ${tier}/${file}: ${err.message}`);
      }
    }
  }

  console.log(`\nDone. Translated: ${translated}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
