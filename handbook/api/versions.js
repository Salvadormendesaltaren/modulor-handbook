import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const candidates = [
    join(__dirname, '..', '_content', 'versions.json'),
    join(process.cwd(), '_content', 'versions.json'),
    join('/var/task', '_content', 'versions.json'),
  ];

  for (const p of candidates) {
    if (existsSync(p)) {
      const data = readFileSync(p, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.send(data);
    }
  }

  return res.status(404).send('Not found');
}
