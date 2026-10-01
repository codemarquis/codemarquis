// Generates assets/motto.svg — the motto inside a bezelled thought bubble.
// Edit QUOTE / AUTHOR / CODE below, then run:  node scripts/build-motto.mjs

import { writeFileSync } from 'node:fs';

const QUOTE = 'Dubito, ergo cogito, ergo sum';
const AUTHOR = 'René Descartes';
const CODE = 'Audi. Vide. Tace. Si Vis Vivere In Pace';

const W = 880, H = 380;
const TOP = 30;                      // headroom so the top puffs aren't clipped
const LIFT = 1.5;                    // elevation, as a multiple of the base shadow
const BASE_DY = 6, BASE_BLUR = 9;

const C = {
  fillTop: '#1c2129', fillBottom: '#161b22',
  rimTop: '#4a525c', rimBottom: '#2a313a',
  quote: '#e6edf3', green: '#39d353', muted: '#8b949e',
};

// Cloud = one rounded body plus overlapping puffs. Drawn twice: first stroked
// (the rim), then filled on top, so only the outer outline shows as a bezel.
const body = { x: 150, y: 76, w: 580, h: 132, r: 66 };
const puffs = [
  [218, 84, 42], [315, 66, 50], [420, 58, 52], [525, 62, 50], [625, 72, 46], [698, 98, 38],
  [150, 145, 54], [732, 145, 52],
  [222, 210, 50], [328, 222, 53], [440, 226, 53], [552, 222, 52], [652, 212, 50], [712, 192, 40],
];
const PUFF_GROW = 7;                // overlap puffs so no flat edge shows between them
const trail = [[176, 292, 15], [144, 316, 10], [120, 334, 6]];

const shapes = [
  `<rect x="${body.x}" y="${body.y}" width="${body.w}" height="${body.h}" rx="${body.r}"/>`,
  ...puffs.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r + PUFF_GROW}"/>`),
].join('');
const dots = trail.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join('');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
const CX = 440;
const label = `“${QUOTE}” ~ ${AUTHOR}. Code: ${CODE}`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
  <title>${esc(label)}</title>
  <defs>
    <filter id="lift" x="-10%" y="-20%" width="120%" height="150%">
      <feDropShadow dx="0" dy="${BASE_DY * LIFT}" stdDeviation="${BASE_BLUR * LIFT}" flood-color="#000" flood-opacity="0.8"/>
    </filter>
    <linearGradient id="rim" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="322">
      <stop offset="0" stop-color="${C.rimTop}"/>
      <stop offset="1" stop-color="${C.rimBottom}"/>
    </linearGradient>
    <linearGradient id="fill" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="322">
      <stop offset="0" stop-color="${C.fillTop}"/>
      <stop offset="1" stop-color="${C.fillBottom}"/>
    </linearGradient>
    <radialGradient id="sheen" gradientUnits="userSpaceOnUse" cx="440" cy="20" r="360">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="cloud">${shapes}</clipPath>
  </defs>
  <g transform="translate(0 ${TOP})">
  <g filter="url(#lift)">
    <g fill="url(#rim)" stroke="url(#rim)" stroke-width="7">${shapes}${dots}</g>
    <g fill="url(#fill)">${shapes}${dots}</g>
    <rect width="${W}" height="${H}" fill="url(#sheen)" clip-path="url(#cloud)"/>
  </g>
  <text x="${CX}" y="136" text-anchor="middle" font-family="${SANS}" font-size="23" fill="${C.quote}"><tspan font-style="italic">“${esc(QUOTE)}”</tspan><tspan fill="${C.green}" font-family="${MONO}" font-size="16"> ~ ${esc(AUTHOR)}</tspan></text>
  <line x1="${CX - 60}" y1="160" x2="${CX + 60}" y2="160" stroke="${C.muted}" stroke-opacity="0.35"/>
  <text x="${CX}" y="196" text-anchor="middle" font-family="${SANS}" font-size="17" fill="${C.quote}">🧬 <tspan fill="${C.green}" font-family="${MONO}" font-weight="700">Code:</tspan> ${esc(CODE)}</text>
  </g>
</svg>
`;

writeFileSync(new URL('../assets/motto.svg', import.meta.url), svg);
console.log(`assets/motto.svg  ${W}×${H}  ${(svg.length / 1024).toFixed(1)} KB`);
