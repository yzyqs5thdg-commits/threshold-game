// THRESHOLD fx module: "supply" vignette.
// An abstract route map: wireframe coastlines, dashed shipping lanes and a land
// route, small vessel glyphs looping along the lanes, a slow radial ping at the
// main hub, and a lat/long graticule behind. Purely decorative: it carries no
// information about the scenario or the experimental condition, and it takes
// no input. All styling and motion live in public/fx/supply.css.

// Lane geometry (viewBox 0 0 760 200). The same strings are used for the
// drawn lanes (as SVG path data) and in supply.css as CSS offset-paths for
// the moving glyphs, so keep them in sync if you edit one.
const LANE_WEST = 'M205 70 Q 300 56 400 100';
const LANE_EAST = 'M640 35 Q 520 48 400 100';
const LANE_FAR = 'M120 85 Q 260 104 400 100';
const LANE_SOUTH = 'M400 100 Q 330 150 240 128';
const LAND_ROUTE = 'M400 100 C 430 128 480 142 540 150 C 580 158 620 150 660 135';

const COAST_NW =
  'M-20 -20 L300 -20 L292 -2 L262 12 L252 34 L222 46 L205 70 L170 80 L150 66 L120 85 L82 90 L52 110 L-20 118 Z';
const COAST_S =
  'M-20 220 L780 220 L780 150 L740 140 L700 150 L660 135 L620 120 L580 126 L540 110 L500 116 L470 102 L440 110 L400 100 L372 118 L330 125 L300 116 L262 130 L240 128 L190 145 L150 150 L110 141 L70 160 L30 158 L-20 170 Z';
const COAST_NE = 'M560 -20 L780 -20 L780 60 L740 56 L700 46 L680 30 L640 35 L600 20 L575 0 Z';

function vessel(cls) {
  // A small hull with a container on deck. Rotation follows the lane via offset-rotate.
  return `<g class="fx-supply-vessel ${cls}">
      <path class="fx-supply-wake" d="M-9 0 H-26"/>
      <path class="fx-supply-hull" d="M-8 0 L-5 -3.2 H5 L8.5 0 L5 3.2 H-5 Z"/>
      <rect class="fx-supply-box" x="-3.5" y="-1.6" width="7" height="3.2" rx="0.6"/>
      <circle class="fx-supply-vessel-light" cx="0" cy="0" r="9"/>
    </g>`;
}

function truck(cls) {
  return `<g class="fx-supply-vessel ${cls}">
      <path class="fx-supply-wake fx-supply-wake-land" d="M-8 0 H-20"/>
      <rect class="fx-supply-hull" x="-7" y="-3" width="11" height="6" rx="1"/>
      <rect class="fx-supply-box" x="4.5" y="-2" width="3.5" height="4" rx="0.6"/>
      <circle class="fx-supply-vessel-light" cx="0" cy="0" r="8"/>
    </g>`;
}

function port(x, y, cls = '') {
  return `<g class="fx-supply-port ${cls}" transform="translate(${x} ${y})">
      <circle class="fx-supply-port-halo" r="9"/>
      <circle class="fx-supply-port-ring" r="5"/>
      <circle class="fx-supply-port-dot" r="1.6"/>
    </g>`;
}

export function render() {
  return `<svg class="fx-supply" viewBox="0 0 760 200" width="100%" height="100%"
  preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <filter id="fxsupply-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="fxsupply-glow-soft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="5"/>
    </filter>
    <radialGradient id="fxsupply-vignette" cx="50%" cy="50%" r="70%">
      <stop offset="0" stop-color="#0a1020" stop-opacity="0"/>
      <stop offset="0.7" stop-color="#0a1020" stop-opacity="0.15"/>
      <stop offset="1" stop-color="#0a1020" stop-opacity="0.75"/>
    </radialGradient>
    <radialGradient id="fxsupply-hubglow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#e9b94c" stop-opacity="0.35"/>
      <stop offset="0.5" stop-color="#e9b94c" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#e9b94c" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fxsupply-sweep" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#7fb3ff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#7fb3ff" stop-opacity="0.16"/>
      <stop offset="0.52" stop-color="#f3cf7a" stop-opacity="0.3"/>
      <stop offset="0.56" stop-color="#7fb3ff" stop-opacity="0.07"/>
      <stop offset="1" stop-color="#7fb3ff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fxsupply-land" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#1c2a4a" stop-opacity="1"/>
      <stop offset="1" stop-color="#182440" stop-opacity="1"/>
    </linearGradient>
    <pattern id="fxsupply-scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="#ffffff" opacity="0.055"/>
    </pattern>
    <pattern id="fxsupply-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="1" fill="#7fb3ff" opacity="0.13"/>
    </pattern>
  </defs>

  <!-- ground -->
  <rect class="fx-supply-ground" x="-20" y="-20" width="800" height="240" fill="#0a1020"/>

  <!-- graticule: gently curved lat/long so it reads as a projected map -->
  <g class="fx-supply-grat" fill="none" stroke="#7fb3ff" stroke-width="0.8" opacity="0.13">
    <path d="M-20 30 Q 380 14 780 30"/>
    <path d="M-20 70 Q 380 58 780 70"/>
    <path d="M-20 110 Q 380 104 780 110"/>
    <path d="M-20 150 Q 380 156 780 150"/>
    <path d="M-20 190 Q 380 202 780 190"/>
    <path d="M60 -20 Q 50 100 60 220"/>
    <path d="M160 -20 Q 154 100 160 220"/>
    <path d="M260 -20 Q 257 100 260 220"/>
    <path d="M380 -20 L380 220"/>
    <path d="M500 -20 Q 503 100 500 220"/>
    <path d="M600 -20 Q 606 100 600 220"/>
    <path d="M700 -20 Q 710 100 700 220"/>
  </g>

  <!-- landmasses -->
  <g class="fx-supply-land">
    <path class="fx-supply-landfill" d="${COAST_NW}" fill="url(#fxsupply-land)"/>
    <path class="fx-supply-landfill" d="${COAST_S}" fill="url(#fxsupply-land)"/>
    <path class="fx-supply-landfill" d="${COAST_NE}" fill="url(#fxsupply-land)"/>
    <path class="fx-supply-landhatch" d="${COAST_NW}" fill="url(#fxsupply-hatch)"/>
    <path class="fx-supply-landhatch" d="${COAST_S}" fill="url(#fxsupply-hatch)"/>
    <path class="fx-supply-landhatch" d="${COAST_NE}" fill="url(#fxsupply-hatch)"/>
    <!-- coast glow and coast line -->
    <g class="fx-supply-coastglow" fill="none" stroke="#7fb3ff" stroke-width="4" opacity="0.18" filter="url(#fxsupply-glow-soft)">
      <path d="${COAST_NW}"/><path d="${COAST_S}"/><path d="${COAST_NE}"/>
    </g>
    <g class="fx-supply-coast" fill="none" stroke="#aab6d0" stroke-width="1.25" stroke-linejoin="round" opacity="0.7">
      <path d="${COAST_NW}"/><path d="${COAST_S}"/><path d="${COAST_NE}"/>
    </g>
    <!-- inland contour hints -->
    <g class="fx-supply-contour" fill="none" stroke="#2f4169" stroke-width="1" opacity="0.8">
      <path d="M-20 160 Q 120 170 250 160 Q 400 150 560 170 Q 680 182 780 172"/>
      <path d="M-20 190 Q 200 200 420 185 Q 600 178 780 196"/>
      <path d="M-20 80 Q 60 60 130 48 Q 200 36 270 -10"/>
      <path d="M600 -20 Q 640 -2 700 10 Q 740 18 780 20"/>
    </g>
  </g>

  <!-- sea texture: scattered wave glyphs -->
  <g class="fx-supply-waves" fill="none" stroke="#7fb3ff" stroke-width="0.9" stroke-linecap="round" opacity="0.22">
    <path d="M300 40 q4 -3 8 0 q4 3 8 0"/>
    <path d="M470 60 q4 -3 8 0 q4 3 8 0"/>
    <path d="M520 95 q4 -3 8 0 q4 3 8 0"/>
    <path d="M340 90 q4 -3 8 0 q4 3 8 0"/>
    <path d="M250 85 q4 -3 8 0 q4 3 8 0"/>
    <path d="M580 70 q4 -3 8 0 q4 3 8 0"/>
    <path d="M440 30 q4 -3 8 0 q4 3 8 0"/>
    <path d="M190 110 q4 -3 8 0 q4 3 8 0"/>
    <path d="M620 100 q4 -3 8 0 q4 3 8 0"/>
    <path d="M700 90 q4 -3 8 0 q4 3 8 0"/>
    <path d="M90 120 q4 -3 8 0 q4 3 8 0"/>
    <path d="M400 55 q4 -3 8 0 q4 3 8 0"/>
  </g>

  <!-- inland depots and feeder links -->
  <g class="fx-supply-depots">
    <g fill="none" stroke="#7b89a8" stroke-width="0.9" stroke-dasharray="2 4" opacity="0.6">
      <path d="M540 150 L500 176"/>
      <path d="M400 100 L352 150"/>
      <path d="M660 135 L706 168"/>
      <path d="M240 128 L186 160"/>
      <path d="M205 70 L158 24"/>
    </g>
    <g fill="#131d33" stroke="#aab6d0" stroke-width="1" opacity="0.8">
      <rect class="fx-supply-depot fx-supply-depot-1" x="497" y="173" width="6" height="6" transform="rotate(45 500 176)"/>
      <rect class="fx-supply-depot fx-supply-depot-2" x="349" y="147" width="6" height="6" transform="rotate(45 352 150)"/>
      <rect class="fx-supply-depot fx-supply-depot-3" x="703" y="165" width="6" height="6" transform="rotate(45 706 168)"/>
      <rect class="fx-supply-depot fx-supply-depot-1" x="183" y="157" width="6" height="6" transform="rotate(45 186 160)"/>
      <rect class="fx-supply-depot fx-supply-depot-2" x="155" y="21" width="6" height="6" transform="rotate(45 158 24)"/>
    </g>
  </g>

  <!-- hub glow pool -->
  <circle class="fx-supply-hubpool" cx="400" cy="100" r="70" fill="url(#fxsupply-hubglow)"/>

  <!-- lanes -->
  <g class="fx-supply-lanes" fill="none" stroke-linecap="round">
    <g class="fx-supply-lanehalo" stroke="#7fb3ff" stroke-width="5" opacity="0.08">
      <path d="${LANE_WEST}"/><path d="${LANE_EAST}"/><path d="${LANE_FAR}"/><path d="${LANE_SOUTH}"/>
    </g>
    <path class="fx-supply-lane fx-supply-lane-a" d="${LANE_WEST}" stroke="#7fb3ff" stroke-width="1.4"/>
    <path class="fx-supply-lane fx-supply-lane-b" d="${LANE_EAST}" stroke="#7fb3ff" stroke-width="1.4"/>
    <path class="fx-supply-lane fx-supply-lane-c" d="${LANE_FAR}" stroke="#7fb3ff" stroke-width="1.4"/>
    <path class="fx-supply-lane fx-supply-lane-d" d="${LANE_SOUTH}" stroke="#7fb3ff" stroke-width="1.4"/>
    <path class="fx-supply-landhalo" d="${LAND_ROUTE}" stroke="#e9b94c" stroke-width="5" opacity="0.08"/>
    <path class="fx-supply-landroute" d="${LAND_ROUTE}" stroke="#e9b94c" stroke-width="1.4"/>
  </g>

  <!-- ports -->
  ${port(205, 70)}
  ${port(640, 35, 'fx-supply-port-late')}
  ${port(120, 85, 'fx-supply-port-mid')}
  ${port(240, 128, 'fx-supply-port-late')}
  ${port(540, 150, 'fx-supply-port-mid')}
  ${port(660, 135)}

  <!-- main hub with radial ping -->
  <g class="fx-supply-hub" transform="translate(400 100)">
    <g class="fx-supply-ping" fill="none" stroke="#e9b94c" stroke-width="1.2">
      <circle class="fx-supply-ping-ring fx-supply-ping-1" r="34"/>
      <circle class="fx-supply-ping-ring fx-supply-ping-2" r="34"/>
      <circle class="fx-supply-ping-ring fx-supply-ping-3" r="34"/>
    </g>
    <g class="fx-supply-hub-orbit" fill="none" stroke="#f3cf7a" stroke-width="1" opacity="0.55">
      <circle r="17" stroke-dasharray="3 7"/>
    </g>
    <g class="fx-supply-hub-orbit-2" fill="none" stroke="#7fb3ff" stroke-width="0.9" opacity="0.5">
      <circle r="24" stroke-dasharray="1.5 14"/>
    </g>
    <g filter="url(#fxsupply-glow)">
      <path class="fx-supply-hub-core" d="M0 -9 L8 -4.5 L8 4.5 L0 9 L-8 4.5 L-8 -4.5 Z" fill="#131d33" stroke="#f3cf7a" stroke-width="1.5"/>
      <circle class="fx-supply-hub-dot" r="2.4" fill="#f3cf7a"/>
    </g>
    <g class="fx-supply-hub-ticks" stroke="#e9b94c" stroke-width="1" opacity="0.7">
      <path d="M0 -14 V-11 M0 11 V14 M-14 0 H-11 M11 0 H14"/>
    </g>
  </g>

  <!-- moving glyphs (positioned via CSS offset-path along the lanes) -->
  <g class="fx-supply-traffic" filter="url(#fxsupply-glow)">
    ${vessel('fx-supply-v-a1')}
    ${vessel('fx-supply-v-a2')}
    ${vessel('fx-supply-v-b1')}
    ${vessel('fx-supply-v-c1')}
    ${vessel('fx-supply-v-d1')}
    ${truck('fx-supply-t-1')}
    ${truck('fx-supply-t-2')}
  </g>

  <!-- compass ring (unlabeled) -->
  <g class="fx-supply-compass" transform="translate(555 72)" fill="none" stroke="#7fb3ff" opacity="0.5">
    <circle r="14" stroke-width="0.9"/>
    <circle r="9" stroke-width="0.7" stroke-dasharray="2 3"/>
    <path d="M0 -17 V-13 M0 13 V17 M-17 0 H-13 M13 0 H17" stroke-width="1"/>
    <g class="fx-supply-compass-needle" stroke="#f3cf7a" stroke-width="1.2">
      <path d="M0 -6 L2.4 0 L0 6 L-2.4 0 Z" fill="#131d33"/>
    </g>
  </g>

  <!-- sweep -->
  <rect class="fx-supply-sweep" x="0" y="-20" width="180" height="240" fill="url(#fxsupply-sweep)"/>

  <!-- scanlines and vignette -->
  <rect class="fx-supply-scan" x="-20" y="-20" width="800" height="240" fill="url(#fxsupply-scan)"/>
  <rect class="fx-supply-vig" x="-20" y="-20" width="800" height="240" fill="url(#fxsupply-vignette)"/>

  <!-- HUD foreground -->
  <g class="fx-supply-hud" fill="none" stroke="#e9b94c" stroke-width="1.25" opacity="0.85">
    <path d="M12 30 V12 H30"/>
    <path d="M748 30 V12 H730"/>
    <path d="M12 170 V188 H30"/>
    <path d="M748 170 V188 H730"/>
    <!-- inner frame marks that survive the phone crop -->
    <path d="M170 18 V12 H176" opacity="0.6"/>
    <path d="M590 18 V12 H584" opacity="0.6"/>
    <path d="M170 182 V188 H176" opacity="0.6"/>
    <path d="M590 182 V188 H584" opacity="0.6"/>
  </g>
  <g class="fx-supply-ticks" stroke="#aab6d0" stroke-width="1" opacity="0.35">
    <path d="M300 12 V16 M320 12 V19 M340 12 V16 M360 12 V16 M380 12 V21 M400 12 V16 M420 12 V16 M440 12 V19 M460 12 V16"/>
    <path d="M300 188 V184 M320 188 V181 M340 188 V184 M360 188 V184 M380 188 V179 M400 188 V184 M420 188 V184 M440 188 V181 M460 188 V184"/>
  </g>
  <g class="fx-supply-glyphs" fill="#7b89a8">
    <text class="fx-supply-text" x="38" y="21">ROUTE</text>
    <text class="fx-supply-text" x="38" y="187">LINK</text>
    <text class="fx-supply-text fx-supply-text-r" x="722" y="21">TELEMETRY</text>
    <text class="fx-supply-text fx-supply-text-r fx-supply-text-blink" x="722" y="187">SYS</text>
  </g>
  <g class="fx-supply-cursor" fill="none" stroke="#7fb3ff" stroke-width="1" opacity="0.6">
    <path d="M-6 0 H-2 M2 0 H6 M0 -6 V-2 M0 2 V6"/>
  </g>
</svg>`;
}
