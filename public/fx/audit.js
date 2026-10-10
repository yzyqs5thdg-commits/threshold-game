/* THRESHOLD fx: "audit" vignette.
   A quiet ledger / controls board for the top of the Internal audit incident card.
   Pure decorative string; carries no information about the incident or the experimental condition:
   no digits, no severity words, bars of deliberately non-monotonic width, no needle on the dial.
   All ids are prefixed "fxaudit-", all classes "fx-audit-". Styles live in /fx/audit.css.
   Rendering: 760x200 viewBox, preserveAspectRatio slice. On narrow banners (~360x160) the visible
   window is roughly x 155..605, so the three subjects (ledger, dial, document) sit inside that band. */

// Ledger board origin and row layout (viewBox units).
const LEDGER = { x: 188, y: 40, w: 150, h: 122 };
const ROW0 = 14;      // y of first row inside the board
const ROW_GAP = 13;
// Row bar widths: intentionally non-monotonic so nothing reads as a trend.
const ROWS = [78, 52, 96, 60, 84, 44, 70, 90];

const DIAL = { x: 405, y: 100 };
const DOC = { x: 488, y: 44, w: 92, h: 112 };
const SEAL = { x: 70, y: 90, r: 22 }; // relative to the document origin

function fmt(n) { return Number(n.toFixed(2)); }

function radialTicks(r1, r2, count, stroke, width, opacity, longEvery = 0, longExtra = 0) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count;
    const ro = longEvery && i % longEvery === 0 ? r2 + longExtra : r2;
    out.push(`<line x1="${fmt(r1 * Math.cos(a))}" y1="${fmt(r1 * Math.sin(a))}" x2="${fmt(ro * Math.cos(a))}" y2="${fmt(ro * Math.sin(a))}"/>`);
  }
  return `<g fill="none" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round">${out.join('')}</g>`;
}

function arc(r, a0, a1) {
  const x0 = fmt(r * Math.cos(a0)), y0 = fmt(r * Math.sin(a0));
  const x1 = fmt(r * Math.cos(a1)), y1 = fmt(r * Math.sin(a1));
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1}`;
}

function defs() {
  return `
  <defs>
    <pattern id="fxaudit-rule" width="760" height="13" patternUnits="userSpaceOnUse">
      <line x1="0" y1="12.5" x2="760" y2="12.5" stroke="#7fb3ff" stroke-width="0.5" opacity="0.10"/>
    </pattern>
    <pattern id="fxaudit-cols" width="38" height="200" patternUnits="userSpaceOnUse">
      <line x1="0.5" y1="0" x2="0.5" y2="200" stroke="#7fb3ff" stroke-width="0.5" opacity="0.07"/>
    </pattern>
    <pattern id="fxaudit-scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="4" height="1" fill="#ffffff" opacity="0.035"/>
    </pattern>
    <radialGradient id="fxaudit-vig" cx="50%" cy="50%" r="62%">
      <stop offset="0" stop-color="#0a1020" stop-opacity="0"/>
      <stop offset="0.66" stop-color="#0a1020" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#0a1020" stop-opacity="0.78"/>
    </radialGradient>
    <radialGradient id="fxaudit-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#e9b94c" stop-opacity="0.16"/>
      <stop offset="0.55" stop-color="#e9b94c" stop-opacity="0.04"/>
      <stop offset="1" stop-color="#e9b94c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fxaudit-dialglow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#7fb3ff" stop-opacity="0.20"/>
      <stop offset="0.5" stop-color="#7fb3ff" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#7fb3ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fxaudit-sealglow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#f3cf7a" stop-opacity="0.42"/>
      <stop offset="0.5" stop-color="#e9b94c" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#e9b94c" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fxaudit-rowscan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9b94c" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#e9b94c" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#e9b94c" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fxaudit-bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7fb3ff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#7fb3ff" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#7fb3ff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fxaudit-docline" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7fb3ff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#7fb3ff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#7fb3ff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fxaudit-sheet" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#182440" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#131d33" stop-opacity="0.95"/>
    </linearGradient>
    <clipPath id="fxaudit-docclip">
      <path d="M0,0 L${DOC.w - 16},0 L${DOC.w},16 L${DOC.w},${DOC.h} L0,${DOC.h} Z"/>
    </clipPath>
    <clipPath id="fxaudit-ledgerclip">
      <rect x="1" y="1" width="${LEDGER.w - 2}" height="${LEDGER.h - 2}" rx="4"/>
    </clipPath>
    <filter id="fxaudit-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="fxaudit-glow-soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="1.1" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

function background() {
  // Ground, ruled "ledger paper" lines, faint column rules, scanlines, soft amber halo behind the subjects.
  return `
  <g class="fx-audit-bg">
    <rect x="0" y="0" width="760" height="200" fill="#0a1020"/>
    <ellipse cx="385" cy="104" rx="300" ry="120" fill="url(#fxaudit-halo)"/>
    <g class="fx-audit-paper">
      <rect x="-40" y="-26" width="840" height="260" fill="url(#fxaudit-rule)"/>
      <rect x="-40" y="0" width="840" height="200" fill="url(#fxaudit-cols)"/>
    </g>
    <rect x="0" y="0" width="760" height="200" fill="url(#fxaudit-scan)"/>
    <g class="fx-audit-ruler" stroke="#7b89a8" stroke-width="1" opacity="0.65">
      ${Array.from({ length: 37 }, (_, i) => {
        const x = 20 + i * 20;
        const h = i % 5 === 0 ? 7 : 3;
        return `<line x1="${x}" y1="${194 - h}" x2="${x}" y2="194"/>`;
      }).join('')}
      <line x1="20" y1="194" x2="740" y2="194" opacity="0.6"/>
    </g>
  </g>`;
}

function motes() {
  // Slow-drifting specks in the empty air of the room; purely atmospheric.
  const M = [
    [96, 150, 1.3, '#7fb3ff', 1], [150, 92, 1.0, '#e9b94c', 2], [346, 176, 1.2, '#7fb3ff', 3],
    [470, 164, 0.9, '#e9b94c', 4], [612, 150, 1.3, '#7fb3ff', 5], [700, 118, 1.0, '#e9b94c', 6],
    [258, 186, 0.9, '#7fb3ff', 7], [534, 60, 1.1, '#7fb3ff', 8], [62, 86, 1.0, '#e9b94c', 2],
    [736, 170, 1.2, '#7fb3ff', 5],
  ];
  return `
  <g class="fx-audit-motes">
    ${M.map(([x, y, r, c, v]) => `<circle class="fx-audit-mote fx-audit-mote--v${v}" cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="0"/>`).join('')}
  </g>`;
}

function ghostColumn(x, y, widths, stroke) {
  // Off-band abstract rows: visible only on wide banners, very low contrast.
  return `
  <g class="fx-audit-ghost" transform="translate(${x},${y})" opacity="0.7">
    ${widths.map((w, i) => `<rect x="0" y="${i * 12}" width="${w}" height="3" rx="1.5" fill="${stroke}" opacity="${0.16 + (i % 3) * 0.04}"/>`).join('')}
    ${widths.map((_, i) => `<rect x="-10" y="${i * 12 - 0.5}" width="4" height="4" fill="none" stroke="#7b89a8" stroke-width="0.8" opacity="0.5"/>`).join('')}
  </g>`;
}

function ledger() {
  const rows = ROWS.map((w, i) => {
    const y = ROW0 + i * ROW_GAP;
    const sig = i % 2 === 0;
    const col = sig ? '#7fb3ff' : '#e9b94c';
    return `
      <g class="fx-audit-row fx-audit-row--${i + 1}" transform="translate(0,${y})">
        <rect class="fx-audit-box" x="10" y="-3.5" width="7" height="7" rx="1" fill="#0a1020" stroke="#7b89a8" stroke-width="1" opacity="0.9"/>
        <rect x="26" y="-2" width="${w}" height="4" rx="2" fill="${col}" opacity="${sig ? 0.42 : 0.5}"/>
        <rect x="26" y="-2" width="${Math.round(w * 0.38)}" height="4" rx="2" fill="${col}" opacity="0.35"/>
        <circle cx="${26 + w + 7}" cy="0" r="1.2" fill="#7b89a8" opacity="0.7"/>
        <circle class="fx-audit-check-halo fx-audit-check-halo--${i + 1}" cx="13.5" cy="0" r="7" fill="#f3cf7a" opacity="0"/>
        <path class="fx-audit-check fx-audit-check--${i + 1}" d="M10.5,0.2 L12.8,2.6 L17.2,-2.8" fill="none" stroke="#f3cf7a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="11 11" stroke-dashoffset="11" opacity="0"/>
      </g>`;
  }).join('');

  return `
  <g class="fx-audit-ledger" transform="translate(${LEDGER.x},${LEDGER.y})">
    <rect x="0" y="0" width="${LEDGER.w}" height="${LEDGER.h}" rx="5" fill="#131d33" opacity="0.72"/>
    <rect x="0" y="0" width="${LEDGER.w}" height="${LEDGER.h}" rx="5" fill="none" stroke="#2f4169" stroke-width="1.25"/>
    <line x1="0" y1="7" x2="${LEDGER.w}" y2="7" stroke="#233150" stroke-width="1"/>
    <g stroke="#7b89a8" stroke-width="1" opacity="0.6">
      <line x1="6" y1="3.5" x2="12" y2="3.5"/><line x1="15" y1="3.5" x2="18" y2="3.5"/>
      <line x1="${LEDGER.w - 18}" y1="3.5" x2="${LEDGER.w - 6}" y2="3.5"/>
    </g>
    <line x1="22" y1="7" x2="22" y2="${LEDGER.h}" stroke="#233150" stroke-width="1"/>
    <g clip-path="url(#fxaudit-ledgerclip)">
      <g class="fx-audit-rowscan">
        <rect x="1" y="${ROW0 - 6.5}" width="${LEDGER.w - 2}" height="13" fill="url(#fxaudit-rowscan)"/>
        <line x1="1" y1="${ROW0}" x2="${LEDGER.w - 1}" y2="${ROW0}" stroke="#f3cf7a" stroke-width="0.75" opacity="0.5"/>
      </g>
    </g>
    ${rows}
    <g class="fx-audit-ledger-bracket" fill="none" stroke="#e9b94c" stroke-width="1.25" opacity="0.75">
      <path d="M-6,8 L-6,-4 L6,-4"/>
      <path d="M${LEDGER.w + 6},${LEDGER.h - 8} L${LEDGER.w + 6},${LEDGER.h + 4} L${LEDGER.w - 6},${LEDGER.h + 4}"/>
    </g>
  </g>`;
}

function dial() {
  return `
  <g class="fx-audit-dial" transform="translate(${DIAL.x},${DIAL.y})">
    <circle r="68" fill="url(#fxaudit-dialglow)"/>
    <g class="fx-audit-dial-ticks">
      ${radialTicks(50, 54, 60, '#7fb3ff', 1, 0.55, 5, 3)}
      <circle r="56" fill="none" stroke="#2f4169" stroke-width="1"/>
    </g>
    <g class="fx-audit-dial-dash">
      <circle r="43" fill="none" stroke="#e9b94c" stroke-width="1" stroke-dasharray="3 7" opacity="0.5"/>
    </g>
    <g class="fx-audit-dial-arcs" fill="none" stroke="#7fb3ff" stroke-width="1.5" stroke-linecap="round" opacity="0.65">
      <path d="${arc(35, -2.4, -0.7)}"/>
      <path d="${arc(35, 0.74, 2.44)}"/>
      <g filter="url(#fxaudit-glow-soft)">
        <circle cx="${fmt(35 * Math.cos(-0.7))}" cy="${fmt(35 * Math.sin(-0.7))}" r="2.2" fill="#7fb3ff" stroke="none" opacity="0.95"/>
        <circle cx="${fmt(35 * Math.cos(2.44))}" cy="${fmt(35 * Math.sin(2.44))}" r="2.2" fill="#7fb3ff" stroke="none" opacity="0.95"/>
      </g>
    </g>
    <g class="fx-audit-dial-arcs-b" fill="none" stroke="#e9b94c" stroke-width="1" stroke-linecap="round" opacity="0.45">
      <path d="${arc(62, 2.0, 3.1)}"/>
      <path d="${arc(62, -1.14, -0.04)}"/>
      <g filter="url(#fxaudit-glow-soft)">
        <circle cx="${fmt(62 * Math.cos(3.1))}" cy="${fmt(62 * Math.sin(3.1))}" r="2" fill="#f3cf7a" stroke="none" opacity="0.95"/>
        <circle cx="${fmt(62 * Math.cos(-0.04))}" cy="${fmt(62 * Math.sin(-0.04))}" r="2" fill="#f3cf7a" stroke="none" opacity="0.95"/>
      </g>
    </g>
    <g class="fx-audit-dial-orbit">
      <circle r="56" fill="none" stroke="#7fb3ff" stroke-width="0.6" stroke-dasharray="1 5" opacity="0.35"/>
      <g filter="url(#fxaudit-glow-soft)">
        <circle cx="56" cy="0" r="2.4" fill="#f3cf7a" opacity="0.95"/>
        <circle cx="56" cy="0" r="5" fill="#e9b94c" opacity="0.18"/>
      </g>
    </g>
    <g class="fx-audit-dial-inner">
      ${radialTicks(24, 28, 12, '#e9b94c', 1.25, 0.7)}
      <circle r="28" fill="none" stroke="#2f4169" stroke-width="0.8" opacity="0.8"/>
    </g>
    <g filter="url(#fxaudit-glow)">
      <rect x="-9" y="-9" width="18" height="18" rx="2" transform="rotate(45)" fill="#131d33" stroke="#f3cf7a" stroke-width="1.5" opacity="0.98"/>
      <circle class="fx-audit-dial-heart" r="3.2" fill="#f3cf7a"/>
    </g>
    <g class="fx-audit-dial-reticle" fill="none" stroke="#7b89a8" stroke-width="1" opacity="0.55">
      <line x1="-74" y1="0" x2="-62" y2="0"/><line x1="62" y1="0" x2="74" y2="0"/>
      <line x1="0" y1="-74" x2="0" y2="-66"/><line x1="0" y1="66" x2="0" y2="74"/>
    </g>
  </g>`;
}

function documentSheet() {
  // Document lines: short dashes of non-monotonic length, no digits.
  const LINES = [[10, 48], [10, 34], [10, 56], [10, 40], [10, 52], [10, 28], [10, 46]];
  const lines = LINES.map(([x, w], i) => {
    const y = 26 + i * 9;
    return `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="#aab6d0" stroke-width="1.25" stroke-linecap="round" opacity="${0.26 + (i % 2) * 0.1}"/>`;
  }).join('');
  const { w, h } = DOC;
  const outline = `M0,0 L${w - 16},0 L${w},16 L${w},${h} L0,${h} Z`;
  return `
  <g class="fx-audit-doc" transform="translate(${DOC.x},${DOC.y})">
    <g class="fx-audit-doc-stack" fill="#131d33" stroke="#2f4169" stroke-width="1" opacity="0.6">
      <path d="${outline}" transform="translate(10,-8)" opacity="0.45"/>
      <path d="${outline}" transform="translate(5,-4)" opacity="0.7"/>
    </g>
    <path d="${outline}" fill="url(#fxaudit-sheet)" opacity="0.96"/>
    <g clip-path="url(#fxaudit-docclip)">
      <g class="fx-audit-docscan">
        <rect x="0" y="-9" width="${w}" height="18" fill="url(#fxaudit-docline)"/>
      </g>
    </g>
    <path d="${outline}" fill="none" stroke="#2f4169" stroke-width="1.25"/>
    <path d="M${w - 16},0 L${w - 16},16 L${w},16" fill="none" stroke="#7fb3ff" stroke-width="1.25" opacity="0.7"/>
    <g stroke="#7fb3ff" stroke-width="1.5" stroke-linecap="round" opacity="0.6">
      <line x1="10" y1="12" x2="36" y2="12"/>
    </g>
    <line x1="10" y1="18" x2="${w - 10}" y2="18" stroke="#233150" stroke-width="1"/>
    ${lines}
    <g class="fx-audit-signature" fill="none" stroke="#f3cf7a" stroke-width="1.1" stroke-linecap="round" opacity="0.7">
      <path d="M12,96 C16,88 20,88 22,94 C24,100 27,100 30,92 C33,84 36,86 38,94 C40,101 44,99 48,93"/>
      <line x1="10" y1="102" x2="52" y2="102" stroke="#7b89a8" stroke-width="0.8" opacity="0.8"/>
    </g>
    <g class="fx-audit-seal" transform="translate(${SEAL.x},${SEAL.y})">
      <circle class="fx-audit-seal-glow" r="36" fill="url(#fxaudit-sealglow)"/>
      <circle r="${SEAL.r}" fill="#0a1020" opacity="0.85"/>
      <g class="fx-audit-seal-ring">
        <circle r="${SEAL.r}" fill="none" stroke="#e9b94c" stroke-width="1.5" opacity="0.9"/>
        ${radialTicks(SEAL.r - 5, SEAL.r - 2, 24, '#e9b94c', 1, 0.7)}
      </g>
      <g class="fx-audit-seal-inner">
        <circle r="13" fill="none" stroke="#f3cf7a" stroke-width="0.9" stroke-dasharray="2 4" opacity="0.7"/>
      </g>
      <g filter="url(#fxaudit-glow-soft)" fill="none" stroke="#f3cf7a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="0,-8 6.93,-4 6.93,4 0,8 -6.93,4 -6.93,-4" opacity="0.9"/>
        <polygon points="0,-3.5 3.03,-1.75 3.03,1.75 0,3.5 -3.03,1.75 -3.03,-1.75" opacity="0.8"/>
      </g>
      <g class="fx-audit-seal-ribbon" fill="none" stroke="#e9b94c" stroke-width="1.5" stroke-linecap="round" opacity="0.7">
        <path d="M-7,19 L-11,30"/>
        <path d="M7,19 L11,30"/>
      </g>
    </g>
  </g>`;
}

function hud() {
  const br = 'fill="none" stroke="#e9b94c" stroke-width="1.5" opacity="0.8"';
  return `
  <g class="fx-audit-hud">
    <path d="M14,34 L14,14 L34,14" ${br}/>
    <path d="M746,34 L746,14 L726,14" ${br}/>
    <path d="M14,166 L14,186 L34,186" ${br}/>
    <path d="M746,166 L746,186 L726,186" ${br}/>
    <g class="fx-audit-glyphs" fill="#7b89a8" font-size="8" letter-spacing="2.2">
      <text x="42" y="22">SYS</text>
      <text x="42" y="184" class="fx-audit-blink">LEDGER</text>
      <text x="718" y="22" text-anchor="end" class="fx-audit-blink fx-audit-blink--b">CTRL</text>
      <text x="718" y="184" text-anchor="end">TELEMETRY</text>
    </g>
    <g class="fx-audit-reticle" fill="none" stroke="#7fb3ff" stroke-width="1" opacity="0.45">
      <path d="M168,30 L168,18 L180,18"/>
      <path d="M592,30 L592,18 L580,18"/>
      <path d="M168,170 L168,182 L180,182"/>
      <path d="M592,170 L592,182 L580,182"/>
    </g>
    <g class="fx-audit-bar">
      <rect x="-70" y="0" width="70" height="200" fill="url(#fxaudit-bar)"/>
      <line x1="-35" y1="0" x2="-35" y2="200" stroke="#7fb3ff" stroke-width="1" opacity="0.26"/>
    </g>
    <rect x="0" y="0" width="760" height="200" fill="url(#fxaudit-vig)"/>
  </g>`;
}

export function render() {
  return `<svg class="fx-audit" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true" focusable="false">
    ${defs()}
    ${background()}
    ${motes()}
    ${ghostColumn(58, 56, [52, 36, 64, 44, 58, 30, 66, 48], '#7fb3ff')}
    ${ghostColumn(656, 52, [44, 60, 36, 56, 42, 64, 34, 52], '#e9b94c')}
    ${ledger()}
    ${dial()}
    ${documentSheet()}
    ${hud()}
  </svg>`;
}
