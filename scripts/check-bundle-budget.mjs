import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const DIST_ASSETS_DIR = path.resolve(import.meta.dirname, '..', 'dist', 'assets');
const INITIAL_ENTRY_BUDGET_KB = 200;

if (!fs.existsSync(DIST_ASSETS_DIR)) {
  console.error('[Devana Budget] Diretório dist/assets não encontrado. Execute npm run build antes.');
  process.exit(1);
}

const files = fs
  .readdirSync(DIST_ASSETS_DIR)
  .filter((name) => name.endsWith('.js') || name.endsWith('.css'));

const rows = files.map((file) => {
  const fullPath = path.join(DIST_ASSETS_DIR, file);
  const raw = fs.readFileSync(fullPath);
  const gz = zlib.gzipSync(raw, { level: 9 });
  return {
    file,
    rawKb: Number((raw.byteLength / 1024).toFixed(2)),
    gzipKb: Number((gz.byteLength / 1024).toFixed(2)),
  };
});

rows.sort((a, b) => b.gzipKb - a.gzipKb);

const entryChunk = rows.find((r) => /^index-.*\.js$/.test(r.file));
const reactChunk = rows.find((r) => /^react-vendor-.*\.js$/.test(r.file));
const runtimeChunk = rows.find((r) => /^rolldown-runtime-.*\.js$/.test(r.file));

console.log('\n[Devana Bundle Budget Report]');
for (const r of rows.slice(0, 12)) {
  console.log(` - ${r.file}: ${r.rawKb} KB raw / ${r.gzipKb} KB gzip`);
}

if (!entryChunk) {
  console.error('[Devana Budget] Chunk inicial index-*.js não encontrado.');
  process.exit(1);
}

const coreBootGzip = Number(
  (
    entryChunk.gzipKb +
    (reactChunk?.gzipKb || 0) +
    (runtimeChunk?.gzipKb || 0)
  ).toFixed(2)
);

console.log(
  `\nChunk inicial (${entryChunk.file}): ${entryChunk.gzipKb} KB gzip | Boot núcleo (entry + react-vendor): ${coreBootGzip} KB gzip (Orçamento máximo: ${INITIAL_ENTRY_BUDGET_KB} KB gzip)`
);

if (coreBootGzip > INITIAL_ENTRY_BUDGET_KB) {
  console.error(
    `[Devana Budget FAIL] Bundle JS inicial (${coreBootGzip} KB gzip) ultrapassou o orçamento de ${INITIAL_ENTRY_BUDGET_KB} KB gzip!`
  );
  process.exit(1);
}

console.log('[Devana Budget PASS] Orçamento de bundle JS inicial respeitado.');
