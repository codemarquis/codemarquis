// Generates assets/terminal.svg — an animated "hacker typing" terminal for the
// GitHub profile README. GitHub strips JavaScript from READMEs, so the animation
// is baked into the SVG with SMIL (plays inside <img>, loops forever).
//
// Edit SCRIPT below, then run:  node scripts/build-terminal.mjs

import { writeFileSync } from 'node:fs';

const PROMPT = 'codemarquis@prod:~$ ';

// type: cmd  = prompt + typed command
//       out  = output line, appears instantly
//       bar  = output line, "typed" fast (progress bars)
//       hi   = highlighted output line (brighter green)
const SCRIPT = [
  { type: 'cmd', text: 'whoami' },
  { type: 'hi',  text: 'Cloud & DevOps Engineer  //  DevSecOps · Cloud Security · Web' },
  { type: 'out', text: 'status: open to work — Cloud / DevOps / DevSecOps roles' },
  { type: 'cmd', text: 'terraform apply -auto-approve' },
  { type: 'out', text: '  + module.vpc.aws_vpc.main                    created' },
  { type: 'out', text: '  + module.eks.aws_eks_cluster.platform        created' },
  { type: 'out', text: '  + aws_kms_key.secrets  (rotation: enabled)   created' },
  { type: 'hi',  text: 'Apply complete! Resources: 42 added, 0 changed, 0 destroyed.' },
  { type: 'cmd', text: 'docker build -t api . && trivy image --severity HIGH,CRITICAL api' },
  { type: 'bar', text: '[##################################################] 100%  scanned' },
  { type: 'hi',  text: 'Total: 0 (HIGH: 0, CRITICAL: 0)  —  image signed & pushed' },
  { type: 'cmd', text: 'kubectl rollout status deploy/api -n prod' },
  { type: 'hi',  text: 'deployment "api" successfully rolled out  (3/3 pods ready)' },
  { type: 'cmd', text: 'git push origin main' },
  { type: 'out', text: '  lint ok  ·  test ok  ·  build ok  ·  scan ok  ·  deploy ok' },
  { type: 'hi',  text: '  shipped to production in 2m 14s  —  zero downtime' },
  { type: 'cmd', text: '' },
];

// Layout
const W = 880;
const PAD_X = 22;
const TOP = 58;           // first baseline
const LH = 22;            // line height
const FONT = 14;
const CW = 8.43;          // monospace char width at 14px
const H = TOP + LH * SCRIPT.length + 14;

// Timing (seconds)
const TYPE_MIN = 0.045, TYPE_MAX = 0.11;
const BAR_STEP = 0.018;
const ENTER = 0.45;       // pause after a command before output
const OUT_GAP = 0.12;
const HOLD = 4.5;         // pause on the finished screen before looping

const COLORS = {
  bg: '#0d1117', border: '#30363d', bar: '#161b22', title: '#8b949e',
  prompt: '#3fb950', text: '#39d353', out: '#2ea043', hi: '#7ee787',
};

// Deterministic jitter so the typing feels human but the SVG is reproducible.
let seed = 7;
const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Build a timeline: for each line, list of [time, revealedChars].
let t = 0.8;
const lines = [];
const cursor = []; // [time, x, y]
SCRIPT.forEach((line, i) => {
  const y = TOP + i * LH;
  const steps = [];
  if (line.type === 'cmd') {
    const full = PROMPT + line.text;
    steps.push([t, PROMPT.length]);
    cursor.push([t, PAD_X + PROMPT.length * CW, y]);
    t += 0.35;
    for (let c = 1; c <= line.text.length; c++) {
      t += TYPE_MIN + rand() * (TYPE_MAX - TYPE_MIN);
      steps.push([t, PROMPT.length + c]);
      cursor.push([t, PAD_X + (PROMPT.length + c) * CW, y]);
    }
    t += ENTER;
    lines.push({ ...line, full, y, steps });
  } else if (line.type === 'bar') {
    for (let c = 1; c <= line.text.length; c++) {
      t += BAR_STEP;
      steps.push([t, c]);
    }
    cursor.push([t, -100, -100]); // hide cursor while output prints
    t += OUT_GAP;
    lines.push({ ...line, full: line.text, y, steps });
  } else {
    t += OUT_GAP;
    steps.push([t, line.text.length]);
    cursor.push([t, -100, -100]);
    lines.push({ ...line, full: line.text, y, steps });
  }
});
const T = +(t + HOLD).toFixed(3);

// SMIL discrete animation from [time, value] pairs, starting at value0.
function discrete(attr, pairs, value0) {
  const kt = [0], vals = [value0];
  for (const [time, v] of pairs) {
    const k = +(time / T).toFixed(5);
    if (k <= kt[kt.length - 1]) { vals[vals.length - 1] = v; continue; }
    kt.push(k); vals.push(v);
  }
  return `<animate attributeName="${attr}" dur="${T}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${kt.join(';')}" values="${vals.join(';')}"/>`;
}

const fmt = (n) => +n.toFixed(2);

const clips = lines.map((l, i) =>
  `<clipPath id="c${i}"><rect x="${PAD_X - 2}" y="${l.y - FONT}" height="${LH}" width="0">` +
  discrete('width', l.steps.map(([time, n]) => [time, fmt(n * CW + 2)]), 0) +
  `</rect></clipPath>`).join('\n    ');

const texts = lines.map((l, i) => {
  let body;
  if (l.type === 'cmd') {
    body = `<tspan fill="${COLORS.prompt}" font-weight="700">${esc(PROMPT.trimEnd())}</tspan> <tspan fill="${COLORS.text}">${esc(l.text)}</tspan>`;
  } else {
    const fill = l.type === 'hi' ? COLORS.hi : COLORS.out;
    body = `<tspan fill="${fill}">${esc(l.text)}</tspan>`;
  }
  return `<text x="${PAD_X}" y="${l.y}" clip-path="url(#c${i})" xml:space="preserve">${body}</text>`;
}).join('\n    ');

const cx = discrete('x', cursor.map(([time, x]) => [time, fmt(x)]), -100);
const cy = discrete('y', cursor.map(([time, , y]) => [time, fmt(y - FONT + 2)]), -100);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Terminal: codemarquis runs terraform apply, docker push, kubectl rollout and ships to production">
  <title>codemarquis — DevOps terminal</title>
  <defs>
    <filter id="glow" x="-5%" y="-20%" width="110%" height="140%">
      <feGaussianBlur stdDeviation="1.6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="#ffffff" opacity="0.025"/>
    </pattern>
    ${clips}
  </defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${COLORS.bg}" stroke="${COLORS.border}"/>
  <path d="M0.5 32 V10.5 a10 10 0 0 1 10 -10 H${W - 10.5} a10 10 0 0 1 10 10 V32 Z" fill="${COLORS.bar}"/>
  <line x1="0.5" y1="32" x2="${W - 0.5}" y2="32" stroke="${COLORS.border}"/>
  <circle cx="20" cy="16.5" r="6" fill="#ff5f57"/>
  <circle cx="40" cy="16.5" r="6" fill="#febc2e"/>
  <circle cx="60" cy="16.5" r="6" fill="#28c840"/>
  <text x="${W / 2}" y="21" text-anchor="middle" fill="${COLORS.title}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace" font-size="12">codemarquis@prod — zsh — ${Math.round((W - PAD_X * 2) / CW)}×${SCRIPT.length + 2}</text>
  <g font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace" font-size="${FONT}" filter="url(#glow)">
    ${texts}
    <rect width="${fmt(CW)}" height="${LH - 4}" fill="${COLORS.text}" x="-100" y="-100">
      ${cx}
      ${cy}
      <animate attributeName="opacity" values="1;0" dur="1s" calcMode="discrete" repeatCount="indefinite"/>
    </rect>
  </g>
  <rect x="1" y="33" width="${W - 2}" height="${H - 34}" rx="9" fill="url(#scan)" pointer-events="none"/>
</svg>
`;

writeFileSync(new URL('../assets/terminal.svg', import.meta.url), svg);
console.log(`assets/terminal.svg  ${W}×${H}  loop ${T}s  ${(svg.length / 1024).toFixed(1)} KB`);
