import { z } from 'zod';
import { listChapters, readChapter, searchHandbook } from './content.js';

/**
 * Register all handbook tools on a McpServer instance.
 * @param {McpServer} server
 * @param {string|null} fixedTier - If set, locks all tools to this tier (no tier param exposed)
 */
export function registerTools(server, fixedTier = null) {
  const tierSchema = fixedTier
    ? {}
    : { tier: z.enum(['full', 'lite', 'redux']).default('full').describe('Content tier: full (leadership), lite (leadership summary), redux (team)') };

  const resolveTier = (params) => fixedTier || params.tier || 'full';

  server.tool(
    'list_chapters',
    'List all chapters available in the Modulor Handbook for a given tier and language. Returns chapter IDs, titles, and sizes.',
    {
      ...tierSchema,
      lang: z.enum(['es', 'en']).default('es').describe('Language: es (Spanish, original) or en (English)'),
      version: z.string().regex(/^V\d+\.\d+\.\d+$/).optional().describe('Specific version (e.g. V1.0.0). Defaults to current.'),
    },
    async (params) => {
      const tier = resolveTier(params);
      const { lang, version } = params;
      const chapters = listChapters(tier, lang, version);
      if (chapters.length === 0) {
        return { content: [{ type: 'text', text: `No chapters found for tier="${tier}", lang="${lang}"${version ? `, version="${version}"` : ''}.` }] };
      }
      return { content: [{ type: 'text', text: JSON.stringify(chapters, null, 2) }] };
    }
  );

  server.tool(
    'read_chapter',
    'Read the full markdown content of a specific handbook chapter. Use list_chapters first to discover available chapter IDs.',
    {
      chapter: z.string().describe('Chapter ID (e.g. "intro", "00_Core_Modulor", "03_SSTIL")'),
      ...tierSchema,
      lang: z.enum(['es', 'en']).default('es').describe('Language'),
      version: z.string().regex(/^V\d+\.\d+\.\d+$/).optional().describe('Specific version. Defaults to current.'),
    },
    async (params) => {
      const tier = resolveTier(params);
      const { chapter, lang, version } = params;
      const content = readChapter(chapter, tier, lang, version);
      if (!content) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Chapter "${chapter}" not found for tier="${tier}", lang="${lang}"${version ? `, version="${version}"` : ''}.` }],
        };
      }
      return { content: [{ type: 'text', text: content }] };
    }
  );

  server.tool(
    'search_handbook',
    'Search across all handbook chapters for a query string. Returns matching lines with surrounding context, grouped by chapter.',
    {
      query: z.string().min(2).describe('Search query (case-insensitive substring match)'),
      ...tierSchema,
      lang: z.enum(['es', 'en']).default('es').describe('Language'),
      version: z.string().regex(/^V\d+\.\d+\.\d+$/).optional().describe('Specific version. Defaults to current.'),
    },
    async (params) => {
      const tier = resolveTier(params);
      const { query, lang, version } = params;
      const results = searchHandbook(query, tier, lang, version);
      if (results.length === 0) {
        return { content: [{ type: 'text', text: `No results found for "${query}" in tier="${tier}", lang="${lang}".` }] };
      }
      const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);
      const summary = `Found ${totalMatches} match(es) across ${results.length} chapter(s).\n\n`;
      const details = results.map(r => {
        const matchLines = r.matches.map(m => `  Line ${m.line}:\n${m.context}`).join('\n  ---\n');
        return `## ${r.title} (${r.chapter})\n${matchLines}`;
      }).join('\n\n');
      return { content: [{ type: 'text', text: summary + details }] };
    }
  );
}
