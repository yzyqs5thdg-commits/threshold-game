/* THRESHOLD fx: "cyber" vignette.
   A holographic network map for the top of the Cybersecurity incident card.
   Pure decorative string; carries no information about the incident or the experimental condition.
   All ids are prefixed "fxcyber-", all classes "fx-cyber-". Styles live in /fx/cyber.css.
   Rendering: 760x200 viewBox, preserveAspectRatio slice. On narrow banners (~360x160) the
   visible window is roughly x 155..605, so the subject sits inside that band. */

const C = { x: 380, y: 100 };

// Node positions (viewBox units). 0 is the shielded core.
const NODES = [
  [380, 100], // 0 core
  [262, 62],  // 1
  [304, 152], // 2
  [468, 56],  // 3
  [500, 142], // 4
  [178, 112], // 5
  [588, 96],  // 6
  [124, 46],  // 7
  [648, 160], // 8
  [214, 168], // 9
  [556, 34],  // 10
  [690, 62],  // 11
  [84, 158],  // 12
  [432, 178], // 13
];

// Edges: [a, b, kind]  kind "a" = amber (core links), "s" = signal-blue secondary.
const EDGES = [
  [0, 1, 'a'], [0, 2, 'a'], [0, 3, 'a'], [0, 4, 'a'],
  [1, 5, 's'], [1, 7, 's'], [2, 9, 's'], [2, 5, 's'],
  [3, 10, 's'], [3, 6, 's'], [4, 6, 's'], [4, 13, 's'],
  [6, 8, 's'], [6, 11, 's'], [5, 12, 's'], [9, 12, 's'],
  [10, 11, 's'], [13, 8, 's'], [7, 5, 's'],
];

// Packets: [edgeIndex, reverse, variant 1..6]  (variant picks a duration/delay pair in CSS)
const PACKETS = [
  [0, false, 1], [1, true, 2], [2, false, 3], [3, true, 4],
  [4, false, 5], [6, true, 6], [8, false, 2], [9, true, 3],
  [10, false, 4], [12, true, 5], [13, false, 6], [14, true, 1],
  [16, false, 3], [17, true, 2], [15, false, 5], [5, true, 4],
];

// Nodes that emit a slow pulse ring (variant for stagger).
const PULSES = [[1, 1], [4, 2], [6, 3], [9, 4], [10, 5], [5, 6]];

function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

function edgePath(e) {
  const [a, b] = e;
  const [x1, y1] = NODES[a];
  const [x2, y2] = NODES[b];
  return `M${x1},${y1} L${x2},${y2}`;
}

function defs() {
  return `
  <defs>
    <pattern id="fxcyber-hex" width="31.18" height="54" patternUnits="userSpaceOnUse">
      <path d="M15.59,0 L31.18,9 L31.18,27 L15.59,36 L0,27 L0,9 Z M0,27 L15.59,36 L15.59,54 L0,63 L-15.59,54 L-15.59,36 Z M31.18,27 L46.77,36 L46.77,54 L31.18,63 L15.59,54 L15.59,36 Z"
            fill="none" stroke="#7fb3ff" stroke-width="0.6" opacity="0.13"/>
    </pattern>
    <pattern id="fxcyber-scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="4" height="1" fill="#ffffff" opacity="0.035"/>
    </pattern>
    <radialGradient id="fxcyber-vig" cx="50%" cy="50%" r="62%">
      <stop offset="0" stop-color="#0a1020" stop-opacity="0"/>
      <stop offset="0.62" stop-color="#0a1020" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#0a1020" stop-opacity="0.92"/>
    </radialGradient>
    <radialGradient id="fxcyber-core" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#f3cf7a" stop-opacity="0.55"/>
      <stop offset="0.45" stop-color="#e9b94c" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#e9b94c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fxcyber-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#7fb3ff" stop-opacity="0.18"/>
      <stop offset="0.6" stop-color="#7fb3ff" stop-opacity="0.04"/>
      <stop offset="1" stop-color="#7fb3ff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fxcyber-bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7fb3ff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#7fb3ff" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#7fb3ff" stop-opacity="0"/>
    </linearGradient>
    <filter id="fxcyber-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="fxcyber-glow-soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="1.1" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

function background() {
  return `
  <g class="fx-cyber-bg">
    <rect x="0" y="0" width="760" height="200" fill="#0a1020"/>
    <circle cx="${C.x}" cy="${C.y}" r="190" fill="url(#fxcyber-halo)"/>
    <rect class="fx-cyber-hexgrid" x="-40" y="-40" width="840" height="280" fill="url(#fxcyber-hex)"/>
    <rect x="0" y="0" width="760" height="200" fill="url(#fxcyber-scan)"/>
    <g class="fx-cyber-ticks" stroke="#7b89a8" stroke-width="1" opacity="0.5">
      ${Array.from({ length: 37 }, (_, i) => {
        const x = 20 + i * 20;
        const h = i % 5 === 0 ? 7 : 3;
        return `<line x1="${x}" y1="${194 - h}" x2="${x}" y2="194"/>`;
      }).join('')}
      <line x1="20" y1="194" x2="740" y2="194" opacity="0.6"/>
    </g>
  </g>`;
}

function edges() {
  return `
  <g class="fx-cyber-edges" fill="none" stroke-linecap="round">
    ${EDGES.map((e, i) => `<path class="fx-cyber-edge fx-cyber-edge--${e[2]}" d="${edgePath(e)}" stroke="${e[2] === 'a' ? '#e9b94c' : '#7fb3ff'}" stroke-width="${e[2] === 'a' ? 1.4 : 1.1}" opacity="${e[2] === 'a' ? 0.55 : 0.32}" data-i="${i}"/>`).join('')}
  </g>`;
}

function packets() {
  // Travel is SMIL animateMotion (no inline style, no JS). Durations 4.5-9s, negative begin staggers the loop.
  const V = { 1: [5.2, -0.4], 2: [6.4, -2.1], 3: [7.3, -3.6], 4: [8.6, -1.3], 5: [4.6, -2.9], 6: [9.1, -5.2] };
  return `
  <g class="fx-cyber-packets" filter="url(#fxcyber-glow-soft)">
    ${PACKETS.map(([ei, rev, v]) => {
      const e = EDGES[ei];
      const amber = e[2] === 'a';
      const col = amber ? '#f3cf7a' : '#7fb3ff';
      const [dur, begin] = V[v];
      const kp = rev ? 'keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : '';
      return `<g class="fx-cyber-pkt">
        <circle r="${amber ? 2.6 : 2.1}" fill="${col}" opacity="0.95"/>
        <circle r="${amber ? 5.5 : 4.5}" fill="${col}" opacity="0.18"/>
        <animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${edgePath(e)}" ${kp}/>
      </g>`;
    }).join('')}
  </g>`;
}

function nodes() {
  return `
  <g class="fx-cyber-nodes">
    ${NODES.slice(1).map(([x, y], i) => {
      const n = i + 1;
      const hub = [1, 2, 3, 4].includes(n);
      const col = hub ? '#e9b94c' : '#7fb3ff';
      return `<g class="fx-cyber-node" transform="translate(${x},${y})">
        <circle r="${hub ? 7.5 : 6}" fill="#0a1020" opacity="0.9"/>
        <circle r="${hub ? 7.5 : 6}" fill="none" stroke="${col}" stroke-width="1.25" opacity="${hub ? 0.85 : 0.6}"/>
        <circle r="${hub ? 2.4 : 1.8}" fill="${col}" opacity="0.95"/>
        ${hub ? `<circle class="fx-cyber-node-orbit" r="11" fill="none" stroke="${col}" stroke-width="0.8" stroke-dasharray="3 9" opacity="0.5"/>` : ''}
      </g>`;
    }).join('')}
  </g>
  <g class="fx-cyber-pulses" fill="none" stroke-width="1">
    ${PULSES.map(([n, v]) => {
      const [x, y] = NODES[n];
      const hub = [1, 2, 3, 4].includes(n);
      return `<g transform="translate(${x},${y})"><circle class="fx-cyber-pulse fx-cyber-pulse--v${v}" r="8" stroke="${hub ? '#e9b94c' : '#7fb3ff'}"/></g>`;
    }).join('')}
  </g>`;
}

function core() {
  // Core node + shield perimeter + radar sweep; everything is in a translated group so CSS transforms pivot at 0,0.
  return `
  <g class="fx-cyber-core" transform="translate(${C.x},${C.y})">
    <circle r="64" fill="url(#fxcyber-core)"/>
    <g class="fx-cyber-sweep">
      <path d="M0,0 L-10.07,-57.12 A58,58 0 0 1 0.00,-58.00 Z" fill="#e9b94c" opacity="0.48"/>
      <path d="M0,0 L-19.84,-54.50 A58,58 0 0 1 -10.07,-57.12 Z" fill="#e9b94c" opacity="0.36"/>
      <path d="M0,0 L-29.00,-50.23 A58,58 0 0 1 -19.84,-54.50 Z" fill="#e9b94c" opacity="0.26"/>
      <path d="M0,0 L-37.28,-44.43 A58,58 0 0 1 -29.00,-50.23 Z" fill="#e9b94c" opacity="0.18"/>
      <path d="M0,0 L-44.43,-37.28 A58,58 0 0 1 -37.28,-44.43 Z" fill="#e9b94c" opacity="0.12"/>
      <path d="M0,0 L-50.23,-29.00 A58,58 0 0 1 -44.43,-37.28 Z" fill="#e9b94c" opacity="0.07"/>
      <path d="M0,0 L-54.50,-19.84 A58,58 0 0 1 -50.23,-29.00 Z" fill="#e9b94c" opacity="0.035"/>
      <line x1="0" y1="0" x2="0" y2="-58" stroke="#f3cf7a" stroke-width="1.4" opacity="0.95"/>
      <circle cx="0" cy="-58" r="2" fill="#f3cf7a" opacity="0.9"/>
    </g>
    <circle class="fx-cyber-ring-outer" r="58" fill="none" stroke="#7fb3ff" stroke-width="1" stroke-dasharray="2 6" opacity="0.45"/>
    <circle r="46" fill="none" stroke="#e9b94c" stroke-width="0.8" opacity="0.25"/>
    <g class="fx-cyber-arcs" fill="none" stroke="#7fb3ff" stroke-width="1.5" stroke-linecap="round" opacity="0.55">
      <path d="M-36.77,-36.77 A52,52 0 0 1 36.77,-36.77"/>
      <path d="M36.77,36.77 A52,52 0 0 1 -36.77,36.77"/>
    </g>
    <g class="fx-cyber-arcs-b" fill="none" stroke="#e9b94c" stroke-width="1" stroke-linecap="round" opacity="0.35">
      <path d="M-66,0 A66,66 0 0 1 -33,-57.16"/>
      <path d="M66,0 A66,66 0 0 1 33,57.16"/>
    </g>
    <g class="fx-cyber-shield">
      <polygon points="${hexPoints(0, 0, 40)}" fill="none" stroke="#e9b94c" stroke-width="1.6" opacity="0.85"/>
      <polygon points="${hexPoints(0, 0, 34)}" fill="none" stroke="#e9b94c" stroke-width="0.8" stroke-dasharray="6 5" opacity="0.5"/>
      ${Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 180) * (60 * i - 90);
        const x1 = (40 * Math.cos(a)).toFixed(2), y1 = (40 * Math.sin(a)).toFixed(2);
        const x2 = (46 * Math.cos(a)).toFixed(2), y2 = (46 * Math.sin(a)).toFixed(2);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f3cf7a" stroke-width="1.6" opacity="0.9"/>`;
      }).join('')}
    </g>
    <g class="fx-cyber-shield-inner">
      <polygon points="${hexPoints(0, 0, 24)}" fill="none" stroke="#7fb3ff" stroke-width="1" opacity="0.55"/>
    </g>
    <g filter="url(#fxcyber-glow)">
      <polygon points="${hexPoints(0, 0, 12)}" fill="#131d33" stroke="#f3cf7a" stroke-width="1.5" opacity="0.98"/>
      <circle class="fx-cyber-heart" r="4" fill="#f3cf7a"/>
    </g>
  </g>`;
}

function hud() {
  const br = 'fill="none" stroke="#e9b94c" stroke-width="1.5" opacity="0.8"';
  return `
  <g class="fx-cyber-hud">
    <path d="M14,34 L14,14 L34,14" ${br}/>
    <path d="M746,34 L746,14 L726,14" ${br}/>
    <path d="M14,166 L14,186 L34,186" ${br}/>
    <path d="M746,166 L746,186 L726,186" ${br}/>
    <g class="fx-cyber-glyphs" fill="#7b89a8" font-size="8" letter-spacing="2.2">
      <text x="42" y="22">SYS</text>
      <text x="42" y="184" class="fx-cyber-blink">MESH</text>
      <text x="718" y="22" text-anchor="end" class="fx-cyber-blink fx-cyber-blink--b">LINK</text>
      <text x="718" y="184" text-anchor="end">TELEMETRY</text>
    </g>
    <g class="fx-cyber-reticle" fill="none" stroke="#7fb3ff" stroke-width="1" opacity="0.5">
      <path d="M${C.x - 92},${C.y - 10} L${C.x - 92},${C.y - 22} L${C.x - 80},${C.y - 22}"/>
      <path d="M${C.x + 92},${C.y - 10} L${C.x + 92},${C.y - 22} L${C.x + 80},${C.y - 22}"/>
      <path d="M${C.x - 92},${C.y + 10} L${C.x - 92},${C.y + 22} L${C.x - 80},${C.y + 22}"/>
      <path d="M${C.x + 92},${C.y + 10} L${C.x + 92},${C.y + 22} L${C.x + 80},${C.y + 22}"/>
    </g>
    <g class="fx-cyber-bar">
      <rect x="-70" y="0" width="70" height="200" fill="url(#fxcyber-bar)"/>
      <line x1="-35" y1="0" x2="-35" y2="200" stroke="#7fb3ff" stroke-width="1" opacity="0.28"/>
    </g>
    <rect x="0" y="0" width="760" height="200" fill="url(#fxcyber-vig)"/>
  </g>`;
}

export function render() {
  return `<svg class="fx-cyber" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true" focusable="false">
    ${defs()}
    ${background()}
    ${edges()}
    ${nodes()}
    ${packets()}
    ${core()}
    ${hud()}
  </svg>`;
}
