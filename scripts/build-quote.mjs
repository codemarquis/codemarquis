// Renders quote.svg — a dark quote card for the GitHub profile README.
// The quote is picked from the current 5-minute window of the clock, so the
// scheduled workflow always shows the right quote even when GitHub runs it late.
//
//   node scripts/build-quote.mjs [outDir] [index]
//   outDir defaults to ./_site; pass an index to preview a specific quote.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROTATE_MS = 5 * 60 * 1000;
const LIFT = 1.5;          // pane elevation, as a multiple of the base shadow
const BASE_DY = 6, BASE_BLUR = 9;

const quotes = JSON.parse(readFileSync(new URL('../quotes.json', import.meta.url), 'utf8'));
const outDir = process.argv[2] ?? '_site';
const index = process.argv[3] !== undefined
  ? Number(process.argv[3]) % quotes.length
  : Math.floor(Date.now() / ROTATE_MS) % quotes.length;
const q = quotes[index];

const W = 880;
const PANE_X = 32, PANE_Y = 26, PANE_W = W - PANE_X * 2;
const TEXT_X = PANE_X + 72;
const FONT = 20, LH = 30, MAX_CHARS = 58;

const C = {
  bg: '#010409', pane: '#161b22', paneTop: '#1c2129', edge: '#30363d',
  mark: '#39d353', text: '#e6edf3', author: '#39d353', muted: '#7d8590',
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > max) { lines.push(line); line = word; }
    else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  return lines;
}

const lines = wrap(q.text, MAX_CHARS);
const firstBaseline = PANE_Y + 74;
const authorY = firstBaseline + (lines.length - 1) * LH + 44;
const PANE_H = authorY - PANE_Y + 30;
const H = PANE_Y + PANE_H + 40;   // room below the pane for its shadow

const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

const quoteLines = lines.map((l, i) =>
  `<text x="${TEXT_X}" y="${firstBaseline + i * LH}" font-family="${SANS}" font-size="${FONT}" font-style="italic" fill="${C.text}">${esc(l)}</text>`
).join('\n    ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`“${q.text}” — ${q.author}`)}">
  <title>${esc(`“${q.text}” — ${q.author}`)}</title>
  <defs>
    <filter id="lift" x="-10%" y="-20%" width="120%" height="160%">
      <feDropShadow dx="0" dy="${BASE_DY * LIFT}" stdDeviation="${BASE_BLUR * LIFT}" flood-color="#000000" flood-opacity="0.85"/>
    </filter>
    <linearGradient id="paneFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.paneTop}"/>
      <stop offset="1" stop-color="${C.pane}"/>
    </linearGradient>
    <linearGradient id="paneEdge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3d444d"/>
      <stop offset="1" stop-color="${C.edge}" stop-opacity="0.4"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="14" fill="${C.bg}"/>
  <rect x="${PANE_X}" y="${PANE_Y}" width="${PANE_W}" height="${PANE_H}" rx="12" fill="url(#paneFill)" stroke="url(#paneEdge)" filter="url(#lift)"/>
  <text x="${PANE_X + 24}" y="${PANE_Y + 30}" font-family="${MONO}" font-size="12" fill="${C.muted}">// ${esc(q.kind)}</text>
  <text x="${PANE_X + PANE_W - 24}" y="${PANE_Y + 30}" text-anchor="end" font-family="${MONO}" font-size="12" fill="${C.muted}">${String(index + 1).padStart(2, '0')}/${quotes.length}</text>
  <g opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="0.9s" fill="freeze"/>
    <text x="${PANE_X + 22}" y="${PANE_Y + 92}" font-family="Georgia, 'Times New Roman', serif" font-size="64" fill="${C.mark}">“</text>
    ${quoteLines}
    <text x="${TEXT_X}" y="${authorY}" font-family="${MONO}" font-size="14" fill="${C.author}">— ${esc(q.author)}</text>
  </g>
</svg>
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/quote.svg`, svg);
writeFileSync(`${outDir}/index.html`, '<!doctype html><meta http-equiv="refresh" content="0; url=https://github.com/codemarquis">\n');
console.log(`${outDir}/quote.svg  #${index + 1}/${quotes.length}  ${q.kind}  ${q.author}  (${lines.length} lines)`);
