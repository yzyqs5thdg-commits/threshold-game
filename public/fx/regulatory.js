/* THRESHOLD fx: "regulatory" vignette.
   A wireframe compliance chamber for the top of the Regulatory incident card: a pair of balance
   scales that sway symmetrically (never settling to one side), a stack of document outlines with a
   travelling scan line, a rotating seal ring with tick marks, faint pillars and a cornice behind.
   Pure decorative string; carries no information about the incident or the experimental condition.
   All ids are prefixed "fxregulatory-", all classes "fx-regulatory-". Styles live in /fx/regulatory.css.
   Rendering: 760x200 viewBox, preserveAspectRatio slice. On narrow banners (~360x160) the visible
   window is roughly x 155..605, so the three subjects (docs, scales, seal) sit inside that band.
   Motion pattern: every CSS-animated group is a child of a plain translate() group, so CSS transforms
   (which replace the transform attribute) pivot at the right point via transform-origin 0 0. */

const PIVOT = { x: 380, y: 58 };   // beam hub
const BEAM_HALF = 90;              // half length of the beam
const SEAL = { x: 560, y: 100 };   // seal/emblem centre
const DOCS = { x: 182, y: 58 };    // top-left of the front sheet

const A = '#e9b94c', A2 = '#f3cf7a', S = '#7fb3ff', INK3 = '#7b89a8', INK2 = '#aab6d0', G = '#0a1020';

function defs() {
  return `
  <defs>
    <pattern id="fxregulatory-grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M20,0 L0,0 L0,20" fill="none" stroke="#ffffff" stroke-width="0.6" opacity="0.045"/>
    </pattern>
    <pattern id="fxregulatory-scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="4" height="1" fill="#ffffff" opacity="0.035"/>
    </pattern>
    <radialGradient id="fxregulatory-vig" cx="50%" cy="50%" r="62%">
      <stop offset="0" stop-color="${G}" stop-opacity="0"/>
      <stop offset="0.62" stop-color="${G}" stop-opacity="0.08"/>
      <stop offset="1" stop-color="${G}" stop-opacity="0.92"/>
    </radialGradient>
    <radialGradient id="fxregulatory-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${A}" stop-opacity="0.22"/>
      <stop offset="0.55" stop-color="${A}" stop-opacity="0.05"/>
      <stop offset="1" stop-color="${A}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fxregulatory-halo-s" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${S}" stop-opacity="0.2"/>
      <stop offset="0.6" stop-color="${S}" stop-opacity="0.04"/>
      <stop offset="1" stop-color="${S}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fxregulatory-floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${S}" stop-opacity="0.0"/>
      <stop offset="1" stop-color="${S}" stop-opacity="0.09"/>
    </linearGradient>
    <linearGradient id="fxregulatory-bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${S}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${S}" stop-opacity="0.14"/>
      <stop offset="1" stop-color="${S}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fxregulatory-scanline" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${A}" stop-opacity="0"/>
      <stop offset="0.75" stop-color="${A}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${A2}" stop-opacity="0.55"/>
    </linearGradient>
    <linearGradient id="fxregulatory-pan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${S}" stop-opacity="0.04"/>
      <stop offset="1" stop-color="${S}" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="fxregulatory-pillar" gradientUnits="userSpaceOnUse" x1="0" y1="36" x2="0" y2="156">
      <stop offset="0" stop-color="${INK3}" stop-opacity="0.0"/>
      <stop offset="0.2" stop-color="${INK3}" stop-opacity="0.55"/>
      <stop offset="0.8" stop-color="${INK3}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${INK3}" stop-opacity="0.0"/>
    </linearGradient>
    <clipPath id="fxregulatory-docclip">
      <path d="M0,0 H42 L56,14 V76 H0 Z"/>
    </clipPath>
    <filter id="fxregulatory-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="fxregulatory-glow-soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="1.1" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

function pillar(x, strong) {
  // A fluted column: capital, shaft lines, base. Drawn with a vertical gradient stroke so it fades top and bottom.
  const op = strong ? 1 : 0.6;
  const flutes = [-9, -4.5, 0, 4.5, 9].map((dx) => `<line x1="${x + dx}" y1="44" x2="${x + dx}" y2="148"/>`).join('');
  return `
    <g class="fx-regulatory-pillar" stroke="url(#fxregulatory-pillar)" stroke-width="1" fill="none" opacity="${op}">
      <path d="M${x - 16},40 H${x + 16} M${x - 13},44 H${x + 13}"/>
      ${flutes}
      <path d="M${x - 13},148 H${x + 13} M${x - 16},152 H${x + 16}"/>
    </g>`;
}

function background() {
  // Floor: a wireframe plane with a horizon at y=150 and lines converging on a far point.
  const vp = { x: 380, y: 92 };
  const floorLines = [-7, -5, -3, -1.6, -0.7, 0, 0.7, 1.6, 3, 5, 7].map((k) => {
    const xh = 380 + k * 40;             // where the line crosses the horizon
    const t = (210 - vp.y) / (150 - vp.y); // extend past the bottom edge
    const xb = vp.x + (xh - vp.x) * t;
    return `<line x1="${xh.toFixed(1)}" y1="150" x2="${xb.toFixed(1)}" y2="210"/>`;
  }).join('');
  return `
  <g class="fx-regulatory-bg">
    <rect x="0" y="0" width="760" height="200" fill="${G}"/>
    <rect class="fx-regulatory-grid" x="-40" y="-40" width="840" height="280" fill="url(#fxregulatory-grid)"/>
    <ellipse cx="${PIVOT.x}" cy="104" rx="250" ry="120" fill="url(#fxregulatory-halo)"/>
    <ellipse cx="${SEAL.x}" cy="${SEAL.y}" rx="90" ry="90" fill="url(#fxregulatory-halo-s)" class="fx-regulatory-sealhalo"/>
    <!-- cornice + pillars: a faint chamber facade -->
    <g class="fx-regulatory-facade" stroke="${INK3}" stroke-width="1" fill="none" opacity="0.5">
      <path d="M60,30 H700" opacity="0.5"/>
      <path d="M72,35 H688" opacity="0.3" stroke-dasharray="14 6"/>
    </g>
    ${pillar(34, false)}
    ${pillar(112, true)}
    ${pillar(648, true)}
    ${pillar(726, false)}
    <!-- large holographic orbit behind the scales -->
    <g transform="translate(${PIVOT.x},98)">
      <g class="fx-regulatory-bigorbit">
        <circle r="118" fill="none" stroke="${S}" stroke-width="0.8" stroke-dasharray="2 10" opacity="0.28"/>
        ${Array.from({ length: 4 }, (_, i) => { const a = (Math.PI / 180) * (i * 90 + 45); return `<circle cx="${(118 * Math.cos(a)).toFixed(2)}" cy="${(118 * Math.sin(a)).toFixed(2)}" r="1.8" fill="${S}" opacity="0.6"/>`; }).join('')}
      </g>
      <g class="fx-regulatory-bigorbit-b">
        <path d="M-104,-52 A116,116 0 0 1 -52,-104" fill="none" stroke="${A}" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
        <path d="M104,52 A116,116 0 0 1 52,104" fill="none" stroke="${A}" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
      </g>
    </g>
    <!-- floor plane -->
    <rect x="0" y="150" width="760" height="50" fill="url(#fxregulatory-floor)"/>
    <g class="fx-regulatory-floor" stroke="${S}" stroke-width="0.8" fill="none" opacity="0.22">
      ${floorLines}
      <line x1="0" y1="150" x2="760" y2="150" opacity="0.9"/>
      <line x1="0" y1="157" x2="760" y2="157" opacity="0.6"/>
      <line x1="0" y1="167" x2="760" y2="167" opacity="0.45"/>
      <line x1="0" y1="181" x2="760" y2="181" opacity="0.3"/>
    </g>
    <!-- floor data rails: dashes crawl outward from the centre, symmetric -->
    <g class="fx-regulatory-rails" fill="none" stroke-width="1" stroke-linecap="round">
      <line class="fx-regulatory-rail fx-regulatory-rail--l" x1="330" y1="150" x2="60" y2="150" stroke="${A}" stroke-dasharray="3 11" opacity="0.5"/>
      <line class="fx-regulatory-rail fx-regulatory-rail--r" x1="430" y1="150" x2="700" y2="150" stroke="${A}" stroke-dasharray="3 11" opacity="0.5"/>
    </g>
    <rect x="0" y="0" width="760" height="200" fill="url(#fxregulatory-scan)"/>
    <!-- drifting section glyphs, purely decorative -->
    <g class="fx-regulatory-motes" fill="${INK3}" font-size="11">
      <text class="fx-regulatory-mote fx-regulatory-mote--1" x="150" y="40">§</text>
      <text class="fx-regulatory-mote fx-regulatory-mote--2" x="300" y="30" font-size="8">§</text>
      <text class="fx-regulatory-mote fx-regulatory-mote--3" x="470" y="44" font-size="9">§</text>
      <text class="fx-regulatory-mote fx-regulatory-mote--4" x="620" y="54" font-size="13">§</text>
      <text class="fx-regulatory-mote fx-regulatory-mote--5" x="250" y="150" font-size="8">§</text>
      <text class="fx-regulatory-mote fx-regulatory-mote--6" x="520" y="166" font-size="10">§</text>
    </g>
  </g>`;
}

function documents() {
  // Three sheets, back-to-front. Text lines are abstract dashes (no words). A scan line travels down the
  // front sheet inside a clipPath; the scan group has no transform attribute so CSS can translate it.
  const lines = [[24, 34], [32, 40], [40, 28], [48, 38], [56, 30], [64, 22]]
    .map(([y, w]) => `<line x1="9" y1="${y}" x2="${9 + w}" y2="${y}"/>`).join('');
  const sheet = (op, cls) => `
      <g class="${cls}" opacity="${op}">
        <path d="M0,0 H42 L56,14 V76 H0 Z" fill="#131d33" fill-opacity="0.85" stroke="${S}" stroke-width="1.25"/>
        <path d="M42,0 V14 H56" fill="none" stroke="${S}" stroke-width="1" opacity="0.8"/>
      </g>`;
  return `
  <g class="fx-regulatory-docs" transform="translate(${DOCS.x},${DOCS.y})">
    <g transform="translate(12,-12)">${sheet(0.32, 'fx-regulatory-sheet fx-regulatory-sheet--3')}</g>
    <g transform="translate(6,-6)">${sheet(0.55, 'fx-regulatory-sheet fx-regulatory-sheet--2')}</g>
    ${sheet(1, 'fx-regulatory-sheet fx-regulatory-sheet--1')}
    <rect x="9" y="9" width="16" height="5" fill="${S}" opacity="0.45"/>
    <rect x="29" y="9" width="7" height="5" fill="none" stroke="${S}" stroke-width="1" opacity="0.5"/>
    <g stroke="${INK2}" stroke-width="1.5" stroke-linecap="round" opacity="0.42">${lines}</g>
    <g clip-path="url(#fxregulatory-docclip)">
      <g class="fx-regulatory-docscan">
        <rect x="0" y="-18" width="56" height="18" fill="url(#fxregulatory-scanline)"/>
        <line x1="0" y1="0" x2="56" y2="0" stroke="${A2}" stroke-width="1.2" opacity="0.9"/>
      </g>
    </g>
    <!-- small HUD tag beside the stack -->
    <g class="fx-regulatory-tag" fill="none" stroke="${A}" stroke-width="1" opacity="0.6">
      <path d="M-10,8 V-2 H-2"/>
      <path d="M-10,68 V78 H-2"/>
    </g>
  </g>`;
}

function pan(sign) {
  // Hanging point is the local origin (a beam end). The .fx-regulatory-pan group counter-rotates
  // against the beam so the pan stays level.
  return `
    <g transform="translate(${sign * BEAM_HALF},0)">
      <g class="fx-regulatory-pan">
        <g stroke="${S}" stroke-width="1" stroke-linecap="round" opacity="0.75">
          <line x1="0" y1="0" x2="-22" y2="46"/>
          <line x1="0" y1="0" x2="22" y2="46"/>
          <line x1="0" y1="0" x2="0" y2="46" opacity="0.5"/>
        </g>
        <path d="M-27,46 Q0,64 27,46 Z" fill="url(#fxregulatory-pan)" stroke="none"/>
        <path d="M-27,46 Q0,64 27,46" fill="none" stroke="${A}" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="-27" y1="46" x2="27" y2="46" stroke="${A2}" stroke-width="1.25" opacity="0.9"/>
        <circle cx="0" cy="0" r="2.2" fill="${A2}" opacity="0.95"/>
        <path class="fx-regulatory-panring" d="M-18,52 Q0,61 18,52" fill="none" stroke="${S}" stroke-width="0.8" opacity="0.5"/>
      </g>
    </g>`;
}

function scales() {
  const { x, y } = PIVOT;
  const H = BEAM_HALF;
  return `
  <g class="fx-regulatory-scales" transform="translate(${x},${y})">
    <!-- post, bracket and plinth (static) -->
    <g fill="none" stroke="${A}" stroke-width="1.5" stroke-linecap="round">
      <line x1="0" y1="10" x2="0" y2="88" opacity="0.9"/>
      <line x1="-3" y1="20" x2="-3" y2="84" stroke-width="0.8" opacity="0.35"/>
      <line x1="3" y1="20" x2="3" y2="84" stroke-width="0.8" opacity="0.35"/>
      <path d="M-9,16 L0,2 L9,16 Z" opacity="0.9"/>
      <path d="M-26,88 H26 L21,94 H-21 Z" opacity="0.9"/>
      <path d="M-34,94 H34 V98 H-34 Z" opacity="0.6"/>
      <path d="M-42,98 H42" opacity="0.35"/>
    </g>
    <!-- orbit ring around the hub -->
    <g class="fx-regulatory-orbit">
      <circle r="15" fill="none" stroke="${S}" stroke-width="0.9" stroke-dasharray="4 8" opacity="0.6"/>
    </g>
    <g class="fx-regulatory-orbit-b">
      <circle r="22" fill="none" stroke="${A}" stroke-width="0.7" stroke-dasharray="1.5 14" opacity="0.45"/>
    </g>
    <!-- pulses rising from the hub -->
    <g class="fx-regulatory-pulses" fill="none" stroke="${A}" stroke-width="1">
      <circle class="fx-regulatory-pulse fx-regulatory-pulse--1" r="8"/>
      <circle class="fx-regulatory-pulse fx-regulatory-pulse--2" r="8"/>
    </g>
    <!-- beam sways; pans counter-rotate -->
    <g class="fx-regulatory-beam">
      <line x1="${-H}" y1="0" x2="${H}" y2="0" stroke="${A}" stroke-width="2" stroke-linecap="round"/>
      <line x1="${-H + 8}" y1="-3.5" x2="${H - 8}" y2="-3.5" stroke="${A}" stroke-width="0.8" opacity="0.4"/>
      <line x1="${-H}" y1="-6" x2="${-H}" y2="6" stroke="${A2}" stroke-width="1.5"/>
      <line x1="${H}" y1="-6" x2="${H}" y2="6" stroke="${A2}" stroke-width="1.5"/>
      ${[-60, -30, 30, 60].map((dx) => `<line x1="${dx}" y1="-2" x2="${dx}" y2="2" stroke="${A2}" stroke-width="1" opacity="0.6"/>`).join('')}
      ${pan(-1)}
      ${pan(1)}
    </g>
    <!-- hub -->
    <g filter="url(#fxregulatory-glow)">
      <circle r="6" fill="#131d33" stroke="${A2}" stroke-width="1.5"/>
      <circle class="fx-regulatory-hub" r="2.4" fill="${A2}"/>
    </g>
    <!-- finial -->
    <circle cx="0" cy="-6" r="2" fill="${A2}" opacity="0.9" filter="url(#fxregulatory-glow-soft)"/>
  </g>`;
}

function seal() {
  const { x, y } = SEAL;
  const ticks = Array.from({ length: 48 }, (_, i) => {
    const a = (Math.PI / 180) * (i * 7.5);
    const long = i % 4 === 0;
    const r1 = long ? 36 : 39, r2 = 43;
    return `<line x1="${(r1 * Math.cos(a)).toFixed(2)}" y1="${(r1 * Math.sin(a)).toFixed(2)}" x2="${(r2 * Math.cos(a)).toFixed(2)}" y2="${(r2 * Math.sin(a)).toFixed(2)}" opacity="${long ? 0.9 : 0.5}"/>`;
  }).join('');
  const star = (r, n, rot) => Array.from({ length: n }, (_, i) => {
    const a = (Math.PI / 180) * (360 / n * i + rot);
    return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  // laurel: short dashes along two arcs
  const laurel = (dir) => Array.from({ length: 7 }, (_, i) => {
    const a = (Math.PI / 180) * (90 + dir * (18 + i * 12));
    const r1 = 24, r2 = 29;
    return `<line x1="${(r1 * Math.cos(a)).toFixed(2)}" y1="${(r1 * Math.sin(a)).toFixed(2)}" x2="${(r2 * Math.cos(a)).toFixed(2)}" y2="${(r2 * Math.sin(a)).toFixed(2)}"/>`;
  }).join('');
  return `
  <g class="fx-regulatory-seal" transform="translate(${x},${y})">
    <circle r="46" fill="#0a1020" opacity="0.55"/>
    <g class="fx-regulatory-seal-ticks" stroke="${A}" stroke-width="1.1" stroke-linecap="round">${ticks}</g>
    <circle r="44" fill="none" stroke="${A}" stroke-width="1.25" opacity="0.85"/>
    <g class="fx-regulatory-seal-dash">
      <circle r="33" fill="none" stroke="${S}" stroke-width="1" stroke-dasharray="10 6" opacity="0.6"/>
    </g>
    <g class="fx-regulatory-seal-laurel" fill="none" stroke="${S}" stroke-width="1.2" stroke-linecap="round" opacity="0.7">
      <path d="M-24.7,8.2 A26,26 0 0 1 -7.9,-24.8" />
      <path d="M24.7,8.2 A26,26 0 0 0 7.9,-24.8" />
      ${laurel(1)}${laurel(-1)}
    </g>
    <circle r="19" fill="none" stroke="${A}" stroke-width="0.9" opacity="0.6"/>
    <g class="fx-regulatory-seal-star">
      <polygon points="${star(15, 4, 0)}" fill="none" stroke="${A2}" stroke-width="1.2" opacity="0.85"/>
      <polygon points="${star(15, 4, 45)}" fill="none" stroke="${A2}" stroke-width="1.2" opacity="0.85"/>
    </g>
    <g class="fx-regulatory-seal-star-b">
      <polygon points="${star(8, 4, 0)}" fill="none" stroke="${S}" stroke-width="1" opacity="0.8"/>
    </g>
    <g filter="url(#fxregulatory-glow)">
      <circle class="fx-regulatory-seal-core" r="2.6" fill="${A2}"/>
    </g>
    <!-- tag brackets beside the seal -->
    <g class="fx-regulatory-tag" fill="none" stroke="${A}" stroke-width="1" opacity="0.6">
      <path d="M56,-40 H64 V-30"/>
      <path d="M56,40 H64 V30"/>
    </g>
  </g>`;
}

function hud() {
  const br = `fill="none" stroke="${A}" stroke-width="1.5" opacity="0.8"`;
  return `
  <g class="fx-regulatory-hud">
    <path d="M14,34 L14,14 L34,14" ${br}/>
    <path d="M746,34 L746,14 L726,14" ${br}/>
    <path d="M14,166 L14,186 L34,186" ${br}/>
    <path d="M746,166 L746,186 L726,186" ${br}/>
    <!-- status squares: all one colour, blink in a slow sequence; decorative only -->
    <g class="fx-regulatory-leds" fill="${S}">
      ${Array.from({ length: 6 }, (_, i) => `<rect class="fx-regulatory-led fx-regulatory-led--${i + 1}" x="${112 + i * 9}" y="178" width="5" height="5"/>`).join('')}
      ${Array.from({ length: 6 }, (_, i) => `<rect class="fx-regulatory-led fx-regulatory-led--${6 - i}" x="${600 + i * 9}" y="16" width="5" height="5"/>`).join('')}
    </g>
    <g class="fx-regulatory-glyphs" fill="${INK3}" font-size="8" letter-spacing="2.2">
      <text x="42" y="22">SYS</text>
      <text x="42" y="184" class="fx-regulatory-blink">ARCHIVE</text>
      <text x="718" y="22" text-anchor="end" class="fx-regulatory-blink fx-regulatory-blink--b">LINK</text>
      <text x="718" y="184" text-anchor="end">TELEMETRY</text>
    </g>
    <!-- reticle around the scales -->
    <g class="fx-regulatory-reticle" fill="none" stroke="${S}" stroke-width="1" opacity="0.5">
      <path d="M${PIVOT.x - 128},44 V32 H${PIVOT.x - 116}"/>
      <path d="M${PIVOT.x + 128},44 V32 H${PIVOT.x + 116}"/>
      <path d="M${PIVOT.x - 128},150 V162 H${PIVOT.x - 116}"/>
      <path d="M${PIVOT.x + 128},150 V162 H${PIVOT.x + 116}"/>
    </g>
    <g class="fx-regulatory-bar">
      <rect x="-70" y="0" width="70" height="200" fill="url(#fxregulatory-bar)"/>
      <line x1="-35" y1="0" x2="-35" y2="200" stroke="${S}" stroke-width="1" opacity="0.26"/>
    </g>
    <rect x="0" y="0" width="760" height="200" fill="url(#fxregulatory-vig)"/>
  </g>`;
}

export function render() {
  return `<svg class="fx-regulatory" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true" focusable="false">
    ${defs()}
    ${background()}
    ${documents()}
    ${seal()}
    ${scales()}
    ${hud()}
  </svg>`;
}
