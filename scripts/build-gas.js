// Builds dist/gas/Code.gs: the Google Apps Script backend with the study modules embedded,
// so the Sheets backend stores exactly what the Node server stores.
//
//   npm run build:gas

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

const demodule = (src) =>
  src
    .replace(/^import .*?;$/gm, '')
    .replace(/^export \{[^}]*\};?$/gm, '')
    .replace(/^export (const|let|function|async function) /gm, '$1 ');

const modules = ['server/content.js', 'server/validate.js', 'server/export.js']
  .map((p) => `/* --- ${p} --- */\n${demodule(read(p))}`)
  .join('\n\n');

const template = read('gas/Code.template.gs');
if (!template.includes('/*__EMBEDDED_MODULES__*/')) throw new Error('template marker missing');
const out = template.replace('/*__EMBEDDED_MODULES__*/', modules);

mkdirSync(resolve(root, 'dist/gas'), { recursive: true });
const outPath = resolve(root, 'dist/gas/Code.gs');
writeFileSync(outPath, out);
process.stdout.write(`${outPath} (${(Buffer.byteLength(out) / 1024).toFixed(0)} KB)\n`);
