/* THRESHOLD fx: "geo" vignette.
   A holographic wireframe globe for the top of the Geopolitical incident card.
   Pure decorative string; carries no information about the incident or the experimental condition.
   All ids are prefixed "fxgeo-", all classes "fx-geo-". Styles live in /fx/geo.css.

   Rendering: 760x200 viewBox, preserveAspectRatio slice. On narrow banners (~360x160) the visible
   window is roughly x 155..605, so the globe, markers, orbit and reticle sit inside that band; the
   wings (x<150, x>610) only hold secondary dressing that is fine to crop.

   Geometry: orthographic globe seen from a 22 degree elevation. Latitude rings are static ellipses
   (rotation about the polar axis leaves them in place). Meridians are unit circles under an animated
   skewX + scale transform (SMIL animateTransform), which is the exact projection of a great circle
   through the poles at longitude lambda; each has a bright front half and a dim back half so the
   spin reads as a sphere turning rather than ellipses breathing. The three location markers are HUD
   "locks" on the front face: identical glyphs, identical ring motion, only their phase differs. */

const R = 78;                       // globe radius (viewBox units)
const C = { x: 380, y: 100 };       // globe centre
const TILT = -14;                   // screen tilt of the polar axis (degrees)
const BETA = (22 * Math.PI) / 180;  // viewer elevation above the equatorial plane
const CB = Math.cos(BETA);
const SB = Math.sin(BETA);
const HALF_TURN = 18;               // seconds for a meridian to travel 180 degrees (full spin = 36s)
const MERIDIANS = 6;

const f2 = (n) => (Math.abs(n) < 0.005 ? '0' : n.toFixed(2));

/* ---- projection helpers ------------------------------------------------------------------- */

// Point on the sphere at latitude `lat`, longitude `lon` (degrees, lon measured from the viewer),
// projected to globe-local screen coordinates (y down). Returns [x, y, depth] where depth > 0 = front.
function project(lat, lon) {
  const th = (lat * Math.PI) / 180;
  const la = (lon * Math.PI) / 180;
  const x = R * Math.cos(th) * Math.sin(la);
  const y = R * (SB * Math.cos(la) * Math.cos(th) - CB * Math.sin(th));
  const depth = Math.cos(th) * Math.cos(la) * CB + Math.sin(th) * SB;
  return [x, y, depth];
}

// Meridian transform for longitude lambda (radians): unit circle -> skewX(alpha) scale(a, Rv) [rotate(delta) for halves]
function meridianFrame(lam) {
  const delta = Math.atan((SB * Math.cos(lam)) / CB);
  const Rv = R * Math.sqrt(CB * CB + SB * SB * Math.cos(lam) ** 2);
  const a = R * Math.sin(lam) * Math.cos(delta);
  const c = R * Math.sin(lam) * Math.sin(delta);
  const alpha = (Math.atan(c / Rv) * 180) / Math.PI;
  return { alpha, a, Rv, delta: (delta * 180) / Math.PI };
}

const SAMPLES = 36;
const FRAMES = Array.from({ length: SAMPLES + 1 }, (_, k) => meridianFrame((Math.PI * k) / SAMPLES));
const SKEW_VALUES = FRAMES.map((f) => f2(f.alpha)).join(';');
const SCALE_VALUES = FRAMES.map((f) => `${f2(f.a)},${f2(f.Rv)}`).join(';');
const ROT_VALUES = FRAMES.map((f) => f2(f.delta)).join(';');
// Right half-ellipse faces the viewer for lambda in (0,90), the left half for (90,180). Cross-fade at the limb.
const FRONT_R = { values: '1;1;0;0;1', keyTimes: '0;0.47;0.5;0.97;1' };
const FRONT_L = { values: '0;0;1;1;0', keyTimes: '0;0.47;0.5;0.97;1' };

/* ---- fixed subject geometry ---------------------------------------------------------------- */

// Three identical HUD-locked markers on the front face. Nothing distinguishes them but phase.
const MARKERS = [
  project(30, -40),
  project(6, 38),
  project(-28, -4),
];

// Great-circle-ish arcs: quadratic Beziers whose control point lifts off the surface.
function arcPath(p, q) {
  const mx = (p[0] + q[0]) / 2;
  const my = (p[1] + q[1]) / 2;
  const d = Math.hypot(mx, my) || 1;
  const lift = R * 1.62;
  const cx = (mx / d) * lift;
  const cy = (my / d) * lift;
  return `M${f2(p[0])},${f2(p[1])} Q${f2(cx)},${f2(cy)} ${f2(q[0])},${f2(q[1])}`;
}
const ARCS = [
  arcPath(MARKERS[0], MARKERS[1]),
  arcPath(MARKERS[1], MARKERS[2]),
  arcPath(MARKERS[2], MARKERS[0]),
];

// Deterministic star field (no Math.random: identical for every participant and every render).
function stars() {
  const out = [];
  let s = 1337;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 44; i++) {
    const x = 8 + rnd() * 744;
    const y = 8 + rnd() * 184;
    // keep the disc clear so stars read as background
    if (Math.hypot(x - C.x, y - C.y) < R + 8) continue;
    const r = 0.5 + rnd() * 0.9;
    const v = 1 + (i % 5);
    out.push(`<circle class="fx-geo-star fx-geo-star--v${v}" cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="#e8edf8"/>`);
  }
  return out.join('');
}

/* ---- scene parts --------------------------------------------------------------------------- */

function defs() {
  return `
  <defs>
    <pattern id="fxgeo-grid" width="38" height="38" patternUnits="userSpaceOnUse">
      <path d="M38,0 L0,0 L0,38" fill="none" stroke="#7fb3ff" stroke-width="0.6" opacity="0.14"/>
    </pattern>
    <pattern id="fxgeo-scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="4" height="1" fill="#ffffff" opacity="0.035"/>
    </pattern>
    <radialGradient id="fxgeo-vig" cx="50%" cy="50%" r="62%">
      <stop offset="0" stop-color="#0a1020" stop-opacity="0"/>
      <stop offset="0.6" stop-color="#0a1020" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#0a1020" stop-opacity="0.9"/>
    </radialGradient>
    <radialGradient id="fxgeo-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#7fb3ff" stop-opacity="0.2"/>
      <stop offset="0.55" stop-color="#7fb3ff" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#7fb3ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fxgeo-sphere" cx="36%" cy="32%" r="78%">
      <stop offset="0" stop-color="#7fb3ff" stop-opacity="0.22"/>
      <stop offset="0.5" stop-color="#182440" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#0a1020" stop-opacity="0.95"/>
    </radialGradient>
    <radialGradient id="fxgeo-limb" cx="50%" cy="50%" r="50%">
      <stop offset="0.82" stop-color="#7fb3ff" stop-opacity="0"/>
      <stop offset="0.97" stop-color="#7fb3ff" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#7fb3ff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fxgeo-bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7fb3ff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#7fb3ff" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#7fb3ff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fxgeo-scanline" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7fb3ff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#7fb3ff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#7fb3ff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="fxgeo-disc"><circle r="${R}"/></clipPath>
    <filter id="fxgeo-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="fxgeo-glow-soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="1.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="fxgeo-blur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3"/>
    </filter>
  </defs>`;
}

function background() {
  const rings = [118, 150, 186].map((r, i) =>
    `<circle class="fx-geo-bgring fx-geo-bgring--${i + 1}" cx="${C.x}" cy="${C.y}" r="${r}" fill="none" stroke="#7fb3ff" stroke-width="0.7" stroke-dasharray="${i === 1 ? '2 10' : '1 5'}" opacity="${0.22 - i * 0.05}"/>`).join('');
  return `
  <g class="fx-geo-bg">
    <rect x="0" y="0" width="760" height="200" fill="#0a1020"/>
    <circle cx="${C.x}" cy="${C.y}" r="200" fill="url(#fxgeo-halo)"/>
    <rect class="fx-geo-grid" x="-40" y="-40" width="840" height="280" fill="url(#fxgeo-grid)"/>
    <g class="fx-geo-stars">${stars()}</g>
    ${rings}
    <g class="fx-geo-ticks" stroke="#7b89a8" stroke-width="1" opacity="0.5">
      ${Array.from({ length: 37 }, (_, i) => {
        const x = 20 + i * 20;
        const h = i % 5 === 0 ? 7 : 3;
        return `<line x1="${x}" y1="${194 - h}" x2="${x}" y2="194"/>`;
      }).join('')}
      <line x1="20" y1="194" x2="740" y2="194" opacity="0.6"/>
    </g>
    <rect x="0" y="0" width="760" height="200" fill="url(#fxgeo-scan)"/>
  </g>`;
}

// Tilted satellite orbit; split into a back half (behind the globe) and a front half (in front).
// The satellite is drawn twice on the same motion path: a dim copy behind the globe and a bright
// copy in front that fades out while it is on the far side, so the globe genuinely occludes it.
const ORBIT = { rx: 136, ry: 36, rot: -26 };
const ORBIT_PATH = `M0,${ORBIT.ry} A${ORBIT.rx},${ORBIT.ry} 0 0 1 ${-ORBIT.rx},0 A${ORBIT.rx},${ORBIT.ry} 0 0 1 0,${-ORBIT.ry} A${ORBIT.rx},${ORBIT.ry} 0 0 1 ${ORBIT.rx},0 A${ORBIT.rx},${ORBIT.ry} 0 0 1 0,${ORBIT.ry}`;
function satellite(front) {
  const op = front ? 'values="1;1;0;0;1;1" keyTimes="0;0.22;0.27;0.73;0.78;1"' : 'values="0.35;0.35;0.35"';
  return `
    <g class="fx-geo-sat" filter="url(#fxgeo-glow-soft)">
      <g transform="rotate(${-ORBIT.rot})">
        <rect x="-3" y="-3" width="6" height="6" fill="#0a1020" stroke="#f3cf7a" stroke-width="1.2"/>
        <line x1="-13" y1="0" x2="-5" y2="0" stroke="#7fb3ff" stroke-width="1.4"/>
        <line x1="5" y1="0" x2="13" y2="0" stroke="#7fb3ff" stroke-width="1.4"/>
        <line x1="-13" y1="-2.5" x2="-13" y2="2.5" stroke="#7fb3ff" stroke-width="1.2"/>
        <line x1="13" y1="-2.5" x2="13" y2="2.5" stroke="#7fb3ff" stroke-width="1.2"/>
        <circle r="1.2" fill="#f3cf7a"/>
      </g>
      <animateMotion dur="24s" begin="-6s" repeatCount="indefinite" path="${ORBIT_PATH}"/>
      <animate attributeName="opacity" dur="24s" begin="-6s" repeatCount="indefinite" calcMode="linear" ${op}/>
    </g>`;
}
function orbitBack() {
  const { rx, ry, rot } = ORBIT;
  return `
  <g class="fx-geo-orbit-back" transform="translate(${C.x},${C.y}) rotate(${rot})" fill="none">
    <path d="M${-rx},0 A${rx},${ry} 0 0 1 ${rx},0" stroke="#7fb3ff" stroke-width="1" stroke-dasharray="3 7" opacity="0.28"/>
    ${satellite(false)}
  </g>`;
}
function orbitFront() {
  const { rx, ry, rot } = ORBIT;
  return `
  <g class="fx-geo-orbit" transform="translate(${C.x},${C.y}) rotate(${rot})" fill="none">
    <path d="M${rx},0 A${rx},${ry} 0 0 1 ${-rx},0" stroke="#7fb3ff" stroke-width="1.1" opacity="0.55"/>
    ${satellite(true)}
  </g>`;
}

function latitudeRings() {
  // Back halves dim, front halves bright; both static.
  return [-60, -30, 0, 30, 60].map((lat) => {
    const th = (lat * Math.PI) / 180;
    const rx = R * Math.cos(th);
    const ry = rx * SB;
    const cy = -R * Math.sin(th) * CB;
    const w = lat === 0 ? 1.1 : 0.8;
    return `
      <path d="M${f2(-rx)},${f2(cy)} A${f2(rx)},${f2(ry)} 0 0 1 ${f2(rx)},${f2(cy)}" fill="none" stroke="#7fb3ff" stroke-width="${w}" opacity="0.18"/>
      <path d="M${f2(-rx)},${f2(cy)} A${f2(rx)},${f2(ry)} 0 0 0 ${f2(rx)},${f2(cy)}" fill="none" stroke="#7fb3ff" stroke-width="${w}" opacity="${lat === 0 ? 0.6 : 0.42}"/>`;
  }).join('');
}

function meridians() {
  const parts = [];
  for (let i = 0; i < MERIDIANS; i++) {
    const begin = `-${f2((HALF_TURN * i) / MERIDIANS)}s`;
    const anim = (type, values, extra = '') =>
      `<animateTransform attributeName="transform" type="${type}" dur="${HALF_TURN}s" begin="${begin}" repeatCount="indefinite" calcMode="linear" values="${values}" ${extra}/>`;
    const fade = (spec) =>
      `<animate attributeName="opacity" dur="${HALF_TURN}s" begin="${begin}" repeatCount="indefinite" calcMode="linear" values="${spec.values}" keyTimes="${spec.keyTimes}"/>`;
    parts.push(`
      <g class="fx-geo-meridian">${anim('skewX', SKEW_VALUES)}
        <g>${anim('scale', SCALE_VALUES)}
          <circle r="1" fill="none" stroke="#7fb3ff" stroke-width="0.8" opacity="0.16" vector-effect="non-scaling-stroke"/>
          <g>${anim('rotate', ROT_VALUES)}
            <path d="M0,-1 A1,1 0 0 1 0,1" fill="none" stroke="#7fb3ff" stroke-width="1" opacity="1" vector-effect="non-scaling-stroke">${fade(FRONT_R)}</path>
            <path d="M0,-1 A1,1 0 0 0 0,1" fill="none" stroke="#7fb3ff" stroke-width="1" opacity="0" vector-effect="non-scaling-stroke">${fade(FRONT_L)}</path>
          </g>
        </g>
      </g>`);
  }
  return `<g class="fx-geo-meridians" opacity="0.7">${parts.join('')}</g>`;
}

function globe() {
  const [, py] = project(90, 0);
  return `
  <g class="fx-geo-globe" transform="translate(${C.x},${C.y}) rotate(${TILT})">
    <circle r="${R + 14}" fill="#7fb3ff" opacity="0.08" filter="url(#fxgeo-blur)"/>
    <circle r="${R}" fill="url(#fxgeo-sphere)"/>
    <g clip-path="url(#fxgeo-disc)">
      ${latitudeRings()}
      ${meridians()}
      <g class="fx-geo-scanline">
        <rect x="${-R}" y="-7" width="${R * 2}" height="14" fill="url(#fxgeo-scanline)" opacity="0.38"/>
      </g>
    </g>
    <circle r="${R}" fill="url(#fxgeo-limb)"/>
    <circle r="${R}" fill="none" stroke="#7fb3ff" stroke-width="1.25" opacity="0.7"/>
    <line x1="0" y1="${f2(py - 16)}" x2="0" y2="${f2(py - 4)}" stroke="#7fb3ff" stroke-width="1" opacity="0.5"/>
    <line x1="0" y1="${f2(-py + 4)}" x2="0" y2="${f2(-py + 16)}" stroke="#7fb3ff" stroke-width="1" opacity="0.5"/>
  </g>`;
}

function arcs() {
  return `
  <g class="fx-geo-arcs" transform="translate(${C.x},${C.y}) rotate(${TILT})" fill="none" stroke-linecap="round">
    ${ARCS.map((d, i) => `
      <path d="${d}" stroke="#e9b94c" stroke-width="1.1" opacity="0.5"/>
      <path class="fx-geo-light fx-geo-light--tail fx-geo-light--v${i + 1}" d="${d}" pathLength="100" stroke="#e9b94c" stroke-width="1.8" stroke-dasharray="22 78" opacity="0.7"/>
      <path class="fx-geo-light fx-geo-light--head fx-geo-light--v${i + 1}" d="${d}" pathLength="100" stroke="#f3cf7a" stroke-width="2.6" stroke-dasharray="5 95" opacity="1" filter="url(#fxgeo-glow)"/>`).join('')}
  </g>`;
}

function markers() {
  // Identical glyphs; only the ring phase differs (v1..v3 in CSS), so no marker reads as special.
  return `
  <g class="fx-geo-markers" transform="translate(${C.x},${C.y}) rotate(${TILT})">
    ${MARKERS.map(([x, y], i) => `
      <g class="fx-geo-marker fx-geo-marker--v${i + 1}" transform="translate(${f2(x)},${f2(y)}) rotate(${-TILT})">
        <circle class="fx-geo-ring fx-geo-ring--a" r="12" fill="none" stroke="#e9b94c" stroke-width="0.9"/>
        <circle class="fx-geo-ring fx-geo-ring--b" r="12" fill="none" stroke="#e9b94c" stroke-width="0.9"/>
        <circle class="fx-geo-ring fx-geo-ring--c" r="12" fill="none" stroke="#e9b94c" stroke-width="0.9"/>
        <g class="fx-geo-lock" fill="none" stroke="#e9b94c" stroke-width="1.1" opacity="0.75">
          <path d="M-9,-4 L-9,-9 L-4,-9"/><path d="M9,-4 L9,-9 L4,-9"/>
          <path d="M-9,4 L-9,9 L-4,9"/><path d="M9,4 L9,9 L4,9"/>
        </g>
        <g filter="url(#fxgeo-glow)">
          <path d="M0,-5 L5,0 L0,5 L-5,0 Z" fill="#0a1020" stroke="#f3cf7a" stroke-width="1.3"/>
          <circle r="1.6" fill="#f3cf7a"/>
        </g>
      </g>`).join('')}
  </g>`;
}

function reticle() {
  const o = 104;
  const br = 'fill="none" stroke="#7fb3ff" stroke-width="1" opacity="0.5"';
  return `
  <g class="fx-geo-reticle">
    <g transform="translate(${C.x},${C.y})" fill="none">
      <g class="fx-geo-orbitring" stroke="#e9b94c">
        <circle r="92" stroke-width="0.9" stroke-dasharray="1 7" opacity="0.55"/>
        <path d="M0,-92 L0,-86" stroke-width="1.4" opacity="0.8"/>
        <path d="M0,92 L0,86" stroke-width="1.4" opacity="0.8"/>
        <path d="M-92,0 L-86,0" stroke-width="1.4" opacity="0.8"/>
        <path d="M92,0 L86,0" stroke-width="1.4" opacity="0.8"/>
      </g>
      <circle class="fx-geo-ping" r="${R}" fill="none" stroke="#e9b94c" stroke-width="1"/>
      <g class="fx-geo-orbitring-b" stroke="#7fb3ff" stroke-width="1.2" stroke-linecap="round" opacity="0.5">
        <path d="M-63.64,-63.64 A90,90 0 0 1 0,-90"/>
        <path d="M63.64,63.64 A90,90 0 0 1 0,90"/>
      </g>
    </g>
    <path d="M${C.x - o},${C.y - 26} L${C.x - o},${C.y - 44} L${C.x - o + 18},${C.y - 44}" ${br}/>
    <path d="M${C.x + o},${C.y - 26} L${C.x + o},${C.y - 44} L${C.x + o - 18},${C.y - 44}" ${br}/>
    <path d="M${C.x - o},${C.y + 26} L${C.x - o},${C.y + 44} L${C.x - o + 18},${C.y + 44}" ${br}/>
    <path d="M${C.x + o},${C.y + 26} L${C.x + o},${C.y + 44} L${C.x + o - 18},${C.y + 44}" ${br}/>
    <g class="fx-geo-glyphs" fill="#7b89a8" font-size="7.5" letter-spacing="2">
      <text x="${C.x - o + 2}" y="${C.y - 50}">GEO</text>
      <text x="${C.x + o - 2}" y="${C.y - 50}" text-anchor="end" class="fx-geo-blink">ORBIT</text>
      <text x="${C.x - o + 2}" y="${C.y + 58}" class="fx-geo-blink fx-geo-blink--b">LINK</text>
      <text x="${C.x + o - 2}" y="${C.y + 58}" text-anchor="end">TRACK</text>
    </g>
  </g>`;
}

// Left wing: a small radar reticle. Right wing: a small orbit tracker. Both abstract, cropped on phones.
function wings() {
  const L = { x: 112, y: 100 };
  const Rr = { x: 648, y: 100 };
  return `
  <g class="fx-geo-wings" fill="none">
    <g transform="translate(${L.x},${L.y})">
      <circle r="38" stroke="#7fb3ff" stroke-width="0.8" opacity="0.35"/>
      <circle r="26" stroke="#7fb3ff" stroke-width="0.7" stroke-dasharray="2 5" opacity="0.3"/>
      <circle r="13" stroke="#7fb3ff" stroke-width="0.7" opacity="0.3"/>
      <line x1="-38" y1="0" x2="38" y2="0" stroke="#7fb3ff" stroke-width="0.6" opacity="0.25"/>
      <line x1="0" y1="-38" x2="0" y2="38" stroke="#7fb3ff" stroke-width="0.6" opacity="0.25"/>
      <g class="fx-geo-radar">
        <path d="M0,0 L-13,-35.7 A38,38 0 0 1 0,-38 Z" fill="#7fb3ff" opacity="0.22"/>
        <path d="M0,0 L-24.4,-29.1 A38,38 0 0 1 -13,-35.7 Z" fill="#7fb3ff" opacity="0.1"/>
        <line x1="0" y1="0" x2="0" y2="-38" stroke="#7fb3ff" stroke-width="1.2" opacity="0.8"/>
      </g>
      <circle r="1.6" fill="#7fb3ff" opacity="0.8"/>
    </g>
    <g transform="translate(${Rr.x},${Rr.y})">
      <circle r="8" stroke="#e9b94c" stroke-width="1" opacity="0.55"/>
      <circle r="2.2" fill="#e9b94c" opacity="0.8"/>
      <g class="fx-geo-track fx-geo-track--1">
        <ellipse rx="40" ry="14" stroke="#7fb3ff" stroke-width="0.8" opacity="0.4"/>
        <circle cx="40" cy="0" r="2" fill="#7fb3ff" opacity="0.9"/>
      </g>
      <g class="fx-geo-track fx-geo-track--2" transform="rotate(60)">
        <ellipse rx="40" ry="14" stroke="#7fb3ff" stroke-width="0.8" opacity="0.3"/>
        <circle cx="-40" cy="0" r="2" fill="#7fb3ff" opacity="0.8"/>
      </g>
      <g class="fx-geo-track fx-geo-track--3" transform="rotate(-60)">
        <ellipse rx="40" ry="14" stroke="#7fb3ff" stroke-width="0.8" opacity="0.3"/>
        <circle cx="0" cy="-14" r="2" fill="#7fb3ff" opacity="0.8"/>
      </g>
    </g>
  </g>`;
}

function hud() {
  const br = 'fill="none" stroke="#e9b94c" stroke-width="1.5" opacity="0.8"';
  return `
  <g class="fx-geo-hud">
    <path d="M14,34 L14,14 L34,14" ${br}/>
    <path d="M746,34 L746,14 L726,14" ${br}/>
    <path d="M14,166 L14,186 L34,186" ${br}/>
    <path d="M746,166 L746,186 L726,186" ${br}/>
    <g class="fx-geo-glyphs" fill="#7b89a8" font-size="8" letter-spacing="2.2">
      <text x="42" y="22">SYS</text>
      <text x="42" y="184" class="fx-geo-blink fx-geo-blink--b">GRID</text>
      <text x="718" y="22" text-anchor="end" class="fx-geo-blink">UPLINK</text>
      <text x="718" y="184" text-anchor="end">TELEMETRY</text>
    </g>
    <g class="fx-geo-bar">
      <rect x="-90" y="0" width="180" height="200" fill="url(#fxgeo-bar)"/>
    </g>
    <rect x="0" y="0" width="760" height="200" fill="url(#fxgeo-vig)"/>
  </g>`;
}

/** Returns the complete SVG markup for the Geopolitical vignette (pure, side-effect free). */
export function render() {
  return `<svg class="fx-geo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true" focusable="false">
    ${defs()}
    ${background()}
    ${orbitBack()}
    ${globe()}
    ${arcs()}
    ${markers()}
    ${orbitFront()}
    ${reticle()}
    ${wings()}
    ${hud()}
  </svg>`;
}

/** Optional: freezes the SMIL (meridian spin, satellite) when the participant prefers reduced motion,
 *  and pauses it while the tab is hidden. CSS animations are handled by the stylesheet. Returns a cleanup. */
export function mount(svgEl) {
  if (!svgEl || typeof svgEl.pauseAnimations !== 'function') return () => {};
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const apply = () => {
    const still = (mq && mq.matches) || document.hidden;
    try { if (still) svgEl.pauseAnimations(); else svgEl.unpauseAnimations(); } catch { /* ignore */ }
  };
  apply();
  if (mq && typeof mq.addEventListener === 'function') mq.addEventListener('change', apply);
  document.addEventListener('visibilitychange', apply);
  return () => {
    if (mq && typeof mq.removeEventListener === 'function') mq.removeEventListener('change', apply);
    document.removeEventListener('visibilitychange', apply);
  };
}
