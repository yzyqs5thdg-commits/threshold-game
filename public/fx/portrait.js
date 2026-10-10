/* THRESHOLD fx: Dr. Vale portrait.
   A stylised, gender-neutral analyst bust on a "secure line" video panel, drawn as a geometric /
   wireframe-shaded figure with an amber rim light from the right and blue fill tones.
   Pure decorative string: it knows nothing about the participant, the condition or any decision, and
   renders identically for everyone. No text. The host overlays a "Live" tag at the top-left corner, so
   that corner (roughly x < 80, y < 42 in viewBox units) carries nothing of interest.
   Ids are prefixed "fxportrait-", classes "fx-portrait-"; motion lives in /fx/portrait.css.
   Rendering: 150x200 viewBox, preserveAspectRatio slice, sized by the .portrait container (150x200 on
   desktop, 96x128 on phones). Palette: the design tokens only (#0a1020 #0e1628 #131d33 #182440 #233150
   #2f4169 #e8edf8 #aab6d0 #8593b1 #e9b94c #f3cf7a #7fb3ff), mixed by opacity. */

const W = 150;
const H = 200;
// Head centre: everything about the face is placed relative to this point.
const HEAD = { x: 75, y: 92 };

function hexTilePath(r) {
  // One flat-bottomed hexagon tile plus its two half neighbours; tiles as (sqrt3*r) x (3r).
  const w = Math.sqrt(3) * r;
  const h = 3 * r;
  const hex = (cx, cy) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 90);
      pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return `M${pts.join(' L')} Z`;
  };
  return { w: w.toFixed(2), h: h.toFixed(2), d: `${hex(w / 2, r)} ${hex(0, 2.5 * r)} ${hex(w, 2.5 * r)}` };
}

function defs() {
  const tile = hexTilePath(9);
  return `
  <defs>
    <linearGradient id="fxportrait-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#182440"/>
      <stop offset="0.55" stop-color="#0e1628"/>
      <stop offset="1" stop-color="#0a1020"/>
    </linearGradient>
    <pattern id="fxportrait-hex" width="${tile.w}" height="${tile.h}" patternUnits="userSpaceOnUse">
      <path d="${tile.d}" fill="none" stroke="#7fb3ff" stroke-width="0.5" opacity="0.14"/>
    </pattern>
    <pattern id="fxportrait-scan" width="3" height="3" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="3" height="1" fill="#e8edf8" opacity="0.04"/>
    </pattern>
    <radialGradient id="fxportrait-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#e9b94c" stop-opacity="0.26"/>
      <stop offset="0.5" stop-color="#e9b94c" stop-opacity="0.07"/>
      <stop offset="1" stop-color="#e9b94c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fxportrait-cool" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#7fb3ff" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#7fb3ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fxportrait-vig" cx="50%" cy="45%" r="70%">
      <stop offset="0.55" stop-color="#0a1020" stop-opacity="0"/>
      <stop offset="1" stop-color="#0a1020" stop-opacity="0.8"/>
    </radialGradient>
    <linearGradient id="fxportrait-skin" x1="0" y1="0" x2="1" y2="0.35">
      <stop offset="0" stop-color="#233150"/>
      <stop offset="1" stop-color="#2f4169"/>
    </linearGradient>
    <linearGradient id="fxportrait-lit" x1="0" y1="0" x2="1" y2="0.3">
      <stop offset="0.35" stop-color="#8593b1" stop-opacity="0"/>
      <stop offset="1" stop-color="#8593b1" stop-opacity="0.3"/>
    </linearGradient>
    <linearGradient id="fxportrait-neck" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#182440"/>
      <stop offset="1" stop-color="#2f4169"/>
    </linearGradient>
    <linearGradient id="fxportrait-hair" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#131d33"/>
      <stop offset="1" stop-color="#0a1020"/>
    </linearGradient>
    <linearGradient id="fxportrait-coat" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0e1628"/>
      <stop offset="0.5" stop-color="#131d33"/>
      <stop offset="1" stop-color="#182440"/>
    </linearGradient>
    <linearGradient id="fxportrait-rim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f3cf7a" stop-opacity="0"/>
      <stop offset="0.3" stop-color="#f3cf7a" stop-opacity="0.95"/>
      <stop offset="0.75" stop-color="#e9b94c" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#e9b94c" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fxportrait-rim-h" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e9b94c" stop-opacity="0"/>
      <stop offset="0.6" stop-color="#e9b94c" stop-opacity="0.7"/>
      <stop offset="1" stop-color="#f3cf7a" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="fxportrait-sweep" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7fb3ff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#7fb3ff" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#7fb3ff" stop-opacity="0"/>
    </linearGradient>
    ${eye()}
  </defs>`;
}

function backdrop() {
  return `
  <g class="fx-portrait-bg">
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#fxportrait-bg)"/>
    <rect class="fx-portrait-hexgrid" x="-20" y="-20" width="${W + 40}" height="${H + 40}" fill="url(#fxportrait-hex)"/>
    <ellipse cx="112" cy="78" rx="78" ry="92" fill="url(#fxportrait-halo)"/>
    <ellipse cx="48" cy="150" rx="70" ry="80" fill="url(#fxportrait-cool)"/>
    <g class="fx-portrait-ring" transform="translate(${HEAD.x},${HEAD.y})">
      <circle r="60" fill="none" stroke="#7fb3ff" stroke-width="0.8" stroke-dasharray="2 7" opacity="0.35"/>
      <path d="M-46,-38.6 A60,60 0 0 1 -12,-58.8" fill="none" stroke="#7fb3ff" stroke-width="1.6" stroke-linecap="round" opacity="0.4"/>
      <path d="M46,38.6 A60,60 0 0 1 12,58.8" fill="none" stroke="#e9b94c" stroke-width="1.6" stroke-linecap="round" opacity="0.4"/>
    </g>
    <circle cx="${HEAD.x}" cy="${HEAD.y}" r="48" fill="none" stroke="#e9b94c" stroke-width="0.6" opacity="0.18"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#fxportrait-scan)"/>
  </g>`;
}

function torso() {
  // Jacket with notched lapels over a collared shirt. The right side (viewer's right) catches the amber rim light.
  return `
  <g class="fx-portrait-torso">
    <path d="M8,200 C10,170 30,152 60,145 L66,141 L75,170 L84,141 L90,145 C120,152 140,170 142,200 Z" fill="url(#fxportrait-coat)"/>
    <path d="M60,145 L66,141 L75,170 L71,200 L48,200 L52,164 Z" fill="#182440" opacity="0.9"/>
    <path d="M90,145 L84,141 L75,170 L79,200 L102,200 L98,164 Z" fill="#233150" opacity="0.9"/>
    <path d="M66,141 L84,141 L75,170 Z" fill="#2f4169"/>
    <path d="M64,140 L66,141 L75,156 L72,160 L62,146 Z" fill="#8593b1" opacity="0.5"/>
    <path d="M86,140 L84,141 L75,156 L78,160 L88,146 Z" fill="#aab6d0" opacity="0.6"/>
    <path d="M66,141 L75,156 M84,141 L75,156" fill="none" stroke="#0a1020" stroke-width="0.8" opacity="0.5"/>
    <path d="M75,170 L75,200" stroke="#0a1020" stroke-width="1.2" opacity="0.5"/>
    <g fill="none" stroke="#7fb3ff" stroke-width="0.5" opacity="0.22">
      <path d="M10,196 L30,160 L60,145 M30,160 L52,164 L48,200 M30,160 L34,200"/>
      <path d="M140,196 L120,160 L90,145 M120,160 L98,164 L102,200 M120,160 L116,200"/>
      <path d="M52,164 L60,145 M98,164 L90,145"/>
    </g>
    <path d="M90,145 C118,152 136,168 141,194" fill="none" stroke="url(#fxportrait-rim-h)" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
    <path d="M84,141 L90,145" fill="none" stroke="#f3cf7a" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>
  </g>`;
}

function neck() {
  return `
  <g class="fx-portrait-neck">
    <path d="M65,114 L85,114 L86,140 C83,144 67,144 64,140 Z" fill="url(#fxportrait-neck)"/>
    <path d="M65,114 L85,114 L84,126 C80,130 70,130 66,126 Z" fill="#0a1020" opacity="0.55"/>
    <path d="M85.5,118 L86,139" fill="none" stroke="url(#fxportrait-rim)" stroke-width="2" stroke-linecap="round"/>
  </g>`;
}

function face() {
  const { x, y } = HEAD;
  // Face outline: a slightly angular jaw, drawn relative to the head centre.
  const outline = 'M-24,-6 C-24,-24 -14,-36 0,-36 C14,-36 24,-24 24,-6 C24,8 21,20 13,28 C9,32 4,35 0,35 C-4,35 -9,32 -13,28 C-21,20 -24,8 -24,-6 Z';
  return `
  <g class="fx-portrait-head" transform="translate(${x},${y})">
    <path d="${outline}" fill="url(#fxportrait-skin)"/>
    <path d="${outline}" fill="url(#fxportrait-lit)"/>
    <g class="fx-portrait-facets" fill="#0a1020">
      <path d="M-24,-6 L-14,-2 L-20,14 Z" opacity="0.28"/>
      <path d="M-20,14 L-14,-2 L-8,14 L-13,28 Z" opacity="0.2"/>
      <path d="M-24,-6 L-18,-26 L-14,-2 Z" opacity="0.16"/>
      <path d="M-13,28 L-8,14 L0,20 L0,35 Z" opacity="0.14"/>
      <path d="M-8,14 L0,4 L0,20 Z" opacity="0.08"/>
    </g>
    <g class="fx-portrait-facets" fill="#aab6d0">
      <path d="M24,-6 L14,-2 L20,14 Z" opacity="0.1"/>
      <path d="M20,14 L14,-2 L8,14 L13,28 Z" opacity="0.07"/>
      <path d="M24,-6 L18,-26 L14,-2 Z" opacity="0.12"/>
      <path d="M0,-36 L14,-34 L18,-26 L0,-26 Z" opacity="0.06"/>
      <path d="M0,-26 L0,4 L14,-2 L18,-26 Z" opacity="0.05"/>
      <path d="M13,28 L8,14 L0,20 L0,35 Z" opacity="0.04"/>
    </g>
    <g class="fx-portrait-wire" fill="none" stroke="#7fb3ff" stroke-width="0.45" opacity="0.26">
      <path d="M-24,-6 L-14,-2 L-20,14 L-13,28 M-14,-2 L-8,14 L0,20 L0,35 M-8,14 L0,4 M-14,-2 L0,4 M-18,-26 L-14,-2 M-18,-26 L0,-26 L18,-26 M0,-26 L0,4"/>
      <path d="M24,-6 L14,-2 L20,14 L13,28 M14,-2 L8,14 L0,20 M8,14 L0,4 M14,-2 L0,4 M18,-26 L14,-2 M14,-34 L18,-26"/>
    </g>
    <path d="M16,2 C20,8 19,16 14,24" fill="none" stroke="#aab6d0" stroke-width="1.2" stroke-linecap="round" opacity="0.22"/>
    <path d="M-16,26 C-8,34 8,34 16,26" fill="none" stroke="#0a1020" stroke-width="2.4" stroke-linecap="round" opacity="0.28"/>
    <path d="M-24,-8 C-29,-10 -31,0 -27,6 C-25,9 -23,7 -23,4 Z" fill="#233150"/>
    <path d="M24,-8 C29,-10 31,0 27,6 C25,9 23,7 23,4 Z" fill="#2f4169"/>
    <path d="M26,-6 C28,-3 28,2 26,4" fill="none" stroke="#f3cf7a" stroke-width="1.3" stroke-linecap="round" opacity="0.85"/>
    <path d="M-25,-4 C-28,-22 -18,-40 -2,-43 C16,-46 31,-34 27,-8 C26,-14 24,-18 20,-20 L14,-23 C8,-26 2,-25 -4,-24 C-12,-23 -17,-20 -19,-14 C-20,-10 -21,-6 -22,-2 C-23,0 -25,0 -25,-4 Z" fill="url(#fxportrait-hair)"/>
    <path d="M-19,-14 C-14,-24 -4,-32 8,-31 L14,-23 C8,-26 2,-25 -4,-24 C-12,-23 -17,-20 -19,-14 Z" fill="#233150" opacity="0.5"/>
    <path d="M8,-31 L14,-23 L20,-20 C22,-26 22,-34 16,-39 Z" fill="#182440" opacity="0.55"/>
    <path d="M-2,-43 C6,-42 12,-40 16,-39 L8,-31 C2,-34 -6,-34 -12,-30 Z" fill="#233150" opacity="0.35"/>
    <path d="M-22,-2 C-21,-10 -18,-18 -12,-24" fill="none" stroke="#2f4169" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/>
    <path d="M-12,-30 C-6,-34 2,-34 8,-31" fill="none" stroke="#2f4169" stroke-width="0.7" stroke-linecap="round" opacity="0.5"/>
    <path d="M14,-23 L20,-20" fill="none" stroke="#2f4169" stroke-width="0.7" stroke-linecap="round" opacity="0.6"/>
    <path d="M0,-42 C12,-41 24,-33 27,-18" fill="none" stroke="url(#fxportrait-rim)" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>
    <path d="M-17,-9 C-13,-12 -7,-12 -3,-10" fill="none" stroke="#0a1020" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
    <path d="M3,-10 C7,-12 13,-12 17,-9" fill="none" stroke="#0a1020" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
    <g transform="translate(0,1)">
      <g class="fx-portrait-blink">
        <use href="#fxportrait-eye" x="-10"/><use href="#fxportrait-eye" x="10"/>
      </g>
    </g>
    <path d="M1,-4 C0.5,2 -1,8 -3.5,11 C-2,13 2,13 4,11.5" fill="none" stroke="#0a1020" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
    <path d="M4.5,10 C6,10.5 6.5,12 5,13" fill="none" stroke="#aab6d0" stroke-width="0.9" stroke-linecap="round" opacity="0.35"/>
    <path d="M-7,21 C-3,22.8 3,22.8 7,21" fill="none" stroke="#0a1020" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
    <path d="M-5,23.6 C-2,25 2,25 5,23.6" fill="none" stroke="#aab6d0" stroke-width="0.8" stroke-linecap="round" opacity="0.3"/>
    <path d="M21,-24 C26,-14 26,6 18,24" fill="none" stroke="url(#fxportrait-rim)" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M18,24 C15,29 10,33 4,35" fill="none" stroke="#e9b94c" stroke-width="1.4" stroke-linecap="round" opacity="0.55"/>
    ${headset()}
  </g>`;
}

function eye() {
  // Almond eye with a signal-blue iris, defined once about (0,0) so a scaleY blink closes on the eye line.
  return `<g id="fxportrait-eye">
      <path d="M-6,0 Q0,-4.2 6,0 Q0,4 -6,0 Z" fill="#e8edf8" opacity="0.88"/>
      <circle cx="0.6" cy="0" r="2.6" fill="#7fb3ff"/>
      <circle cx="0.6" cy="0" r="2.6" fill="none" stroke="#233150" stroke-width="0.7" opacity="0.8"/>
      <circle cx="0.6" cy="0" r="1.2" fill="#0a1020"/>
      <circle cx="1.8" cy="-1.1" r="0.7" fill="#f3cf7a" opacity="0.95"/>
      <path d="M-6,0 Q0,-4.2 6,0" fill="none" stroke="#0a1020" stroke-width="1.3" stroke-linecap="round" opacity="0.9"/>
      <path d="M-5,0.6 Q0,4 5,0.6" fill="none" stroke="#0a1020" stroke-width="0.6" stroke-linecap="round" opacity="0.4"/>
    </g>`;
}

function headset() {
  // Thin band over the hair, earpiece on the viewer's left, boom mic curving towards the mouth.
  return `
  <g class="fx-portrait-headset">
    <path d="M-28,-6 C-31,-30 -14,-47 2,-47 C18,-47 33,-32 29,-8" fill="none" stroke="#aab6d0" stroke-width="1.7" stroke-linecap="round" opacity="0.85"/>
    <path d="M-28,-6 C-31,-30 -14,-47 2,-47 C18,-47 33,-32 29,-8" fill="none" stroke="#e8edf8" stroke-width="0.5" stroke-linecap="round" opacity="0.45"/>
    <path d="M20,-42 C27,-36 31,-26 29,-12" fill="none" stroke="#f3cf7a" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>
    <rect x="-33" y="-10" width="9" height="15" rx="3.5" fill="#182440" stroke="#aab6d0" stroke-width="1.1"/>
    <rect x="-31" y="-7" width="5" height="9" rx="2" fill="#0a1020" opacity="0.8"/>
    <circle cx="-28.5" cy="-8" r="0.9" fill="#7fb3ff" opacity="0.9"/>
    <path d="M-29,5 C-29,16 -20,22 -10,24" fill="none" stroke="#aab6d0" stroke-width="1.5" stroke-linecap="round" opacity="0.85"/>
    <rect x="-13" y="21.5" width="7" height="4.6" rx="2.3" fill="#0a1020" stroke="#aab6d0" stroke-width="1"/>
    <rect x="24" y="-10" width="7" height="12" rx="3" fill="#182440" stroke="#aab6d0" stroke-width="1"/>
    <path d="M30.5,-8 L30.5,0" fill="none" stroke="#f3cf7a" stroke-width="1.2" stroke-linecap="round" opacity="0.9"/>
  </g>`;
}

function frame() {
  // Thin frame, corner brackets (the top-left corner is left clear for the host's Live tag), tick rail, sweep, vignette.
  const br = 'fill="none" stroke="#e9b94c" stroke-width="1.4" stroke-linecap="round" opacity="0.8"';
  return `
  <g class="fx-portrait-hud">
    <g class="fx-portrait-sweep">
      <rect x="0" y="-7" width="${W}" height="14" fill="url(#fxportrait-sweep)"/>
      <line x1="0" y1="0" x2="${W}" y2="0" stroke="#7fb3ff" stroke-width="0.8" opacity="0.4"/>
    </g>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#fxportrait-vig)"/>
    <rect x="4.5" y="4.5" width="${W - 9}" height="${H - 9}" rx="5" fill="none" stroke="#2f4169" stroke-width="1" opacity="0.9"/>
    <path d="M${W - 10},24 L${W - 10},10 L${W - 24},10" ${br}/>
    <path d="M10,${H - 24} L10,${H - 10} L24,${H - 10}" ${br}/>
    <path d="M${W - 10},${H - 24} L${W - 10},${H - 10} L${W - 24},${H - 10}" ${br}/>
    <g stroke="#8593b1" stroke-width="0.9" opacity="0.55">
      ${Array.from({ length: 7 }, (_, i) => {
        const y = 60 + i * 10;
        const w = i % 3 === 0 ? 5 : 2.5;
        return `<line x1="${W - 10}" y1="${y}" x2="${W - 10 - w}" y2="${y}"/>`;
      }).join('')}
    </g>
    <g stroke="#7fb3ff" stroke-width="0.9" opacity="0.5">
      <line x1="10" y1="48" x2="10" y2="60"/>
      <line x1="10" y1="64" x2="10" y2="68"/>
      <line x1="10" y1="72" x2="10" y2="76"/>
    </g>
  </g>`;
}

export function render() {
  // The bust breathes about its base: the translate/scale/untranslate sandwich pivots at (75,200).
  return `<svg class="fx-portrait" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true" focusable="false">
    ${defs()}
    ${backdrop()}
    <g transform="translate(${W / 2},${H})">
      <g class="fx-portrait-breathe">
        <g transform="scale(1.05) translate(${-W / 2},${-H})">
          ${torso()}
          ${neck()}
          ${face()}
        </g>
      </g>
    </g>
    ${frame()}
  </svg>`;
}
