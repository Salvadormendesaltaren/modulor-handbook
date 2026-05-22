#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '..', '_content');
const VERSIONS_FILE = join(CONTENT_DIR, 'versions.json');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

function parseVersion(v) {
  const m = v.match(/^V(\d+)\.(\d+)\.(\d+)$/);
  if (!m) throw new Error(`Versión inválida: ${v}`);
  return { year: +m[1], quarter: +m[2], patch: +m[3] };
}

function formatVersion({ year, quarter, patch }) {
  return `V${year}.${quarter}.${patch}`;
}

function bump(version, type) {
  const v = parseVersion(version);
  switch (type) {
    case 'patch':
      return formatVersion({ ...v, patch: v.patch + 1 });
    case 'quarter':
      return formatVersion({ ...v, quarter: v.quarter + 1, patch: 0 });
    case 'annual':
      return formatVersion({ year: v.year + 1, quarter: 0, patch: 0 });
    default:
      throw new Error(`Tipo desconocido: ${type}`);
  }
}

async function main() {
  const versions = JSON.parse(readFileSync(VERSIONS_FILE, 'utf-8'));
  const current = versions.current;

  console.log(`\nVersión actual: ${current}\n`);

  const type = await ask('Tipo de bump (patch / quarter / annual): ');
  if (!['patch', 'quarter', 'annual'].includes(type.trim())) {
    console.error('Tipo inválido. Usa: patch, quarter, annual');
    process.exit(1);
  }

  const newVersion = bump(current, type.trim());
  console.log(`\nNueva versión: ${current} → ${newVersion}`);

  const notes = await ask('Notas de la versión: ');

  const confirm = await ask('\n¿Confirmar? (s/n): ');
  if (confirm.trim().toLowerCase() !== 's') {
    console.log('Cancelado.');
    rl.close();
    process.exit(0);
  }

  // Copy current/ to archive/{currentVersion}/
  const archiveDir = join(CONTENT_DIR, 'archive', current);
  mkdirSync(archiveDir, { recursive: true });
  cpSync(join(CONTENT_DIR, 'current'), archiveDir, { recursive: true });
  console.log(`\n✓ Copiado current/ → archive/${current}/`);

  // Update versions.json
  versions.current = newVersion;
  versions.versions.unshift({
    version: newVersion,
    date: new Date().toISOString().split('T')[0],
    notes: notes.trim() || '',
    type: type.trim(),
  });
  writeFileSync(VERSIONS_FILE, JSON.stringify(versions, null, 2) + '\n');
  console.log(`✓ versions.json actualizado → ${newVersion}`);

  console.log(
    '\nHecho. Edita los archivos en _content/current/ con los cambios de la nueva versión.\n'
  );

  rl.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
