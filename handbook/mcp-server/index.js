#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools.js';

const VALID_TIERS = ['full', 'lite', 'redux'];
const tierArg = process.argv.find(a => a.startsWith('--tier='));
const fixedTier = tierArg ? tierArg.split('=')[1] : null;

if (fixedTier && !VALID_TIERS.includes(fixedTier)) {
  console.error(`Invalid --tier value: "${fixedTier}". Must be one of: ${VALID_TIERS.join(', ')}`);
  process.exit(1);
}

const tierLine = fixedTier
  ? `- Tier: locked to "${fixedTier}" (set via --tier flag)`
  : '- Tier: full (complete, leadership), lite (summary, leadership), redux (essentials, team)';

const server = new McpServer({
  name: 'modulor-handbook',
  version: '1.0.0',
  instructions: `This MCP server provides access to the Modulor Studios Handbook — the internal knowledge base of Modulor Studios, a group of creative and technology boutiques.

The handbook contains chapters covering:
- Core Modulor: group identity, vision, organizational structure, financials
- mendesaltaren: design boutique
- Tailor Hub: tech & product development boutique
- SSTIL: fashion & lifestyle boutique
- Nocodehackers: no-code/low-code development boutique
- FIK: financial & investment boutique
- Directorio de Equipo: team directory (full tier only)
- Intro: handbook introduction and overview

Content is organized by:
${tierLine}
- Language: es (Spanish, original), en (English translation)
- Version: current or archived versions (e.g. V1.0.0)

Recommended workflow:
1. Use list_chapters to see available chapters and their sizes
2. Use read_chapter to load specific chapters relevant to the question
3. Use search_handbook for targeted keyword searches across all chapters`,
});

registerTools(server, fixedTier);

const transport = new StdioServerTransport();
await server.connect(transport);
