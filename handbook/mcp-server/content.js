import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_ROOT = join(__dirname, '..', '_content');

/**
 * Load versions.json from _content/
 */
function loadVersions() {
  const path = join(CONTENT_ROOT, 'versions.json');
  if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf-8'));
  return null;
}

/**
 * Resolve the base directory for a tier+lang+version combination.
 * Falls back from EN to ES if the EN directory doesn't exist.
 */
function resolveDir(tier, lang, version) {
  const versions = loadVersions();
  const isCurrent = !version || !versions || version === versions.current;
  const subdir = isCurrent ? 'current' : `archive/${version}`;

  const langPath = lang === 'en' ? join(tier, 'en') : tier;
  const dir = join(CONTENT_ROOT, subdir, langPath);

  if (existsSync(dir)) return dir;

  // Fallback: if EN dir not found, return ES dir
  if (lang === 'en') return resolveDir(tier, 'es', version);
  return null;
}

/**
 * Extract the first # heading from markdown content as the chapter title.
 */
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Derive a chapter ID from a filename.
 * "00_Core_Modulor.md" → "00_Core_Modulor"
 * "intro.md" → "intro"
 */
function filenameToId(filename) {
  return filename.replace(/\.md$/, '');
}

/**
 * List all chapters for a given tier/lang/version.
 * Returns array of { id, filename, title, tier, lang, sizeBytes }
 */
export function listChapters(tier = 'full', lang = 'es', version) {
  const dir = resolveDir(tier, lang, version);
  if (!dir) return [];

  const files = readdirSync(dir).filter(f => f.endsWith('.md')).sort();
  return files.map(filename => {
    const fullPath = join(dir, filename);
    const content = readFileSync(fullPath, 'utf-8');
    const stats = statSync(fullPath);
    return {
      id: filenameToId(filename),
      filename,
      title: extractTitle(content) || filenameToId(filename),
      tier,
      lang,
      sizeBytes: stats.size,
    };
  });
}

/**
 * Read a single chapter's content.
 * `chapter` can be an ID like "intro" or "00_Core_Modulor".
 */
export function readChapter(chapter, tier = 'full', lang = 'es', version) {
  const dir = resolveDir(tier, lang, version);
  if (!dir) return null;

  const filename = chapter.endsWith('.md') ? chapter : `${chapter}.md`;
  const fullPath = join(dir, filename);
  if (!existsSync(fullPath)) return null;

  return readFileSync(fullPath, 'utf-8');
}

/**
 * Search across all chapters for a query string (case-insensitive).
 * Returns matches grouped by chapter with ±2 lines of context.
 */
export function searchHandbook(query, tier = 'full', lang = 'es', version) {
  const dir = resolveDir(tier, lang, version);
  if (!dir) return [];

  const files = readdirSync(dir).filter(f => f.endsWith('.md')).sort();
  const lowerQuery = query.toLowerCase();
  const results = [];

  for (const filename of files) {
    const content = readFileSync(join(dir, filename), 'utf-8');
    const lines = content.split('\n');
    const matches = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lowerQuery)) {
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length - 1, i + 2);
        matches.push({
          line: i + 1,
          context: lines.slice(start, end + 1).join('\n'),
        });
      }
    }

    if (matches.length > 0) {
      results.push({
        chapter: filenameToId(filename),
        title: extractTitle(content) || filenameToId(filename),
        matches,
      });
    }
  }

  return results;
}
