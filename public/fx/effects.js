// THRESHOLD fx: "effects" — HUD extras and screen-transition effects used across the game.
//
// Purely decorative. Nothing here receives information about the participant, the condition or
// any decision; every function renders or plays identically on every call. Nothing drawn carries
// meaning: breathing status dots, a looping abstract waveform with no axis, chevrons, light sweeps,
// rings. Ids are prefixed "fxeffects-", classes "fx-effects-", keyframes "fxeffects-". Styles live in
// /fx/effects.css (no inline style attributes in markup; JS may set element.style).
//
// Every exported function is safe to call repeatedly, tolerates missing elements, never throws,
// and under prefers-reduced-motion simply sets the final state immediately.

const PREFIX = 'fx-effects-';
const TIMER_SLACK = 60; // ms added to overlay lifetimes so the last keyframe is always painted

function reducedMotion() {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function isElement(el) {
  return !!el && typeof el === 'object' && el.nodeType === 1 && typeof el.appendChild === 'function';
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms | 0)));

/** Give an element a positioning context if it has none (so absolute overlays sit inside it). */
function ensurePositioned(el) {
  try {
    const pos = getComputedStyle(el).position;
    if (pos === 'static' || !pos) el.style.position = 'relative';
  } catch {
    /* ignore */
  }
}

/**
 * Append an overlay <div class="fx-effects-<cls>"> with the given inner HTML, remove it after `ms`.
 * Returns the overlay (or null) — the caller awaits `wait(ms)` so timing never depends on
 * animationend events (which do not fire while a tab is hidden).
 */
function mountOverlay(el, cls, html, ms) {
  try {
    ensurePositioned(el);
    const o = document.createElement('div');
    o.className = PREFIX + cls;
    o.setAttribute('aria-hidden', 'true');
    if (html) o.innerHTML = html;
    el.appendChild(o);
    setTimeout(() => {
      try { if (o.parentNode) o.parentNode.removeChild(o); } catch { /* ignore */ }
    }, ms + TIMER_SLACK);
    return o;
  } catch {
    return null;
  }
}

/** Add a class for `ms` milliseconds, then remove it (used for CSS-driven flashes on the target itself). */
function pulseClass(el, cls, ms) {
  try {
    el.classList.remove(PREFIX + cls);
    // Force a restart if the class is re-applied while the previous animation is still running.
    void el.offsetWidth;
    el.classList.add(PREFIX + cls);
    setTimeout(() => {
      try { el.classList.remove(PREFIX + cls); } catch { /* ignore */ }
    }, ms + TIMER_SLACK);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// HUD extras: three status chips and an abstract looping waveform
// ---------------------------------------------------------------------------

/**
 * A periodic smooth trace over width `w`: a sum of sines with integer cycle counts so the path
 * tiles seamlessly when translated by exactly `w`. Returned path spans 2*w so a 0 → -w loop is
 * continuous. Amplitudes are symmetric about the midline: the trace oscillates, it never trends.
 */
function wavePath(w, h, parts, phase) {
  const mid = h / 2;
  const step = 3;
  const pts = [];
  for (let x = 0; x <= w * 2 + step; x += step) {
    let y = 0;
    for (const [cycles, amp] of parts) y += amp * Math.sin(((Math.PI * 2 * cycles) / w) * x + phase);
    pts.push(`${x},${(mid + y).toFixed(2)}`);
  }
  return `M${pts.join(' L')}`;
}

const WAVE_W = 216;
const WAVE_H = 46;
const WAVE_A = wavePath(WAVE_W, WAVE_H, [[2, 7], [5, 4.5], [9, 2.2]], 0.6);
const WAVE_B = wavePath(WAVE_W, WAVE_H, [[3, 5], [7, 3], [13, 1.4]], 2.1);

function hudWaveSvg() {
  const w = WAVE_W;
  const h = WAVE_H;
  return `
<svg class="${PREFIX}wave" viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="fxeffects-wave-fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.12" stop-color="#ffffff" stop-opacity="1"/>
      <stop offset="0.88" stop-color="#ffffff" stop-opacity="1"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <mask id="fxeffects-wave-mask">
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#fxeffects-wave-fade)"/>
    </mask>
    <pattern id="fxeffects-wave-dots" width="12" height="11.5" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.7" fill="#7fb3ff" opacity="0.28"/>
    </pattern>
    <pattern id="fxeffects-wave-scan" width="3" height="3" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="3" height="1" fill="#ffffff" opacity="0.05"/>
    </pattern>
    <linearGradient id="fxeffects-wave-trail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e9b94c" stop-opacity="0"/>
      <stop offset="1" stop-color="#e9b94c" stop-opacity="0.22"/>
    </linearGradient>
    <linearGradient id="fxeffects-wave-cursor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f3cf7a" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#f3cf7a" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#f3cf7a" stop-opacity="0"/>
    </linearGradient>
    <filter id="fxeffects-wave-glow" x="-10%" y="-40%" width="120%" height="180%">
      <feGaussianBlur stdDeviation="1.6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect x="0" y="0" width="${w}" height="${h}" fill="url(#fxeffects-wave-dots)"/>
  <line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1" stroke-dasharray="2 4"/>
  <g mask="url(#fxeffects-wave-mask)">
    <g class="${PREFIX}wave-b">
      <path d="${WAVE_B}" fill="none" stroke="#7fb3ff" stroke-width="1" stroke-opacity="0.42" stroke-linejoin="round"/>
    </g>
    <g class="${PREFIX}wave-a" filter="url(#fxeffects-wave-glow)">
      <path d="${WAVE_A}" fill="none" stroke="#e9b94c" stroke-width="1.4" stroke-opacity="0.9" stroke-linejoin="round"/>
    </g>
    <g class="${PREFIX}wave-cursor">
      <rect x="-22" y="0" width="22" height="${h}" fill="url(#fxeffects-wave-trail)"/>
      <rect x="-0.75" y="0" width="1.5" height="${h}" fill="url(#fxeffects-wave-cursor)"/>
    </g>
  </g>
  <rect x="0" y="0" width="${w}" height="${h}" fill="url(#fxeffects-wave-scan)"/>
  <g fill="none" stroke="#7fb3ff" stroke-opacity="0.55" stroke-width="1">
    <path d="M0.5,6 V0.5 H6"/><path d="M${w - 6},0.5 H${w - 0.5} V6"/>
    <path d="M0.5,${h - 6} V${h - 0.5} H6"/><path d="M${w - 6},${h - 0.5} H${w - 0.5} V${h - 6}"/>
  </g>
</svg>`;
}

const HUD_CHIPS = ['SECURE LINK', 'TELEMETRY', 'UPLINK'];

/** Three decorative "activity" squares; all equal size so nothing reads as a level or strength. */
function chipTicks() {
  return `<span class="${PREFIX}ticks"><i></i><i></i><i></i></span>`;
}

/**
 * Decorative status block for the HUD rail (fits a 216px-wide column). Identical on every call.
 * @returns {string} HTML
 */
export function renderHudExtras() {
  try {
    const chips = HUD_CHIPS.map((label, i) => `
    <div class="${PREFIX}chip ${PREFIX}chip-${i + 1}">
      <i class="${PREFIX}dot"></i>
      <span class="${PREFIX}chip-label">${label}</span>
      ${chipTicks()}
    </div>`).join('');
    return `
<div class="${PREFIX}hud" aria-hidden="true">
  <div class="${PREFIX}hud-head"><span>SYS</span><i></i><span>LINK</span></div>
  <div class="${PREFIX}chips">${chips}</div>
  <div class="${PREFIX}wavebox">${hudWaveSvg()}</div>
  <div class="${PREFIX}hud-foot"><span>TELEMETRY</span><span class="${PREFIX}hud-glyphs"><i></i><i></i><i></i><i></i><i></i><i></i></span></div>
</div>`;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Incoming banner above an incident card
// ---------------------------------------------------------------------------

function chevronSvg() {
  // Three thin chevrons that slide in staggered, then rest with a slow, quiet glow wave.
  const chev = (x, n) => `<path class="${PREFIX}chev ${PREFIX}chev-${n}" d="M${x},2 L${x + 5},8 L${x},14" fill="none" stroke="#e9b94c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<svg class="${PREFIX}incoming-chevrons" viewBox="0 0 24 16" width="24" height="16" aria-hidden="true" focusable="false">${chev(2, 1)}${chev(9, 2)}${chev(16, 3)}</svg>`;
}

/**
 * Slim decorative alert strip ("INCOMING · INC-01 · CYBERSECURITY") rendered above an incident
 * card: chevrons slide in, one sweep of light crosses the strip, then it settles. Same look for
 * every incident; `code` and `domain` are shown as plain escaped text.
 * @param {{ code?: string, domain?: string }} [opts]
 * @returns {string} HTML
 */
export function renderIncomingBanner({ code, domain } = {}) {
  try {
    const parts = ['INCOMING', code, domain].filter((p) => p != null && String(p).trim() !== '');
    const text = parts.map((p, i) => `<span class="${PREFIX}incoming-part ${PREFIX}incoming-part-${i + 1}">${escapeHtml(p)}</span>`)
      .join(`<span class="${PREFIX}incoming-sep">·</span>`);
    return `
<div class="${PREFIX}incoming" aria-hidden="true">
  <span class="${PREFIX}incoming-corner ${PREFIX}incoming-corner-l"></span>
  <span class="${PREFIX}incoming-corner ${PREFIX}incoming-corner-r"></span>
  ${chevronSvg()}
  <span class="${PREFIX}incoming-text">${text}</span>
  <span class="${PREFIX}incoming-rule"></span>
  <span class="${PREFIX}incoming-tail"><i class="${PREFIX}dot ${PREFIX}dot-small"></i>LINK</span>
  <span class="${PREFIX}incoming-sweep"></span>
</div>`;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// One-off panel / element effects
// ---------------------------------------------------------------------------

/**
 * One-off scanline sweep over a panel: a bright thin band with a trailing glow moves top → bottom
 * inside an injected overlay that is removed afterwards. ~500ms.
 * @param {HTMLElement} el
 * @returns {Promise<void>}
 */
export function scanSweep(el) {
  if (!isElement(el) || reducedMotion()) return Promise.resolve();
  const ms = 520;
  const o = mountOverlay(el, 'scan', `<i class="${PREFIX}scan-band"></i>`, ms);
  return o ? wait(ms) : Promise.resolve();
}

// decodeReveal state: element -> { original, token }. Keeping the original text here means a second
// call during a running decode still knows the true text instead of a half-scrambled snapshot.
const DECODING = new WeakMap();
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnopqrstuvwxyz0123456789#%&<>/|=+*';

/** Small deterministic hash → [0,1), used for per-character resolve jitter. */
function unitHash(i) {
  let x = (i + 1) * 2654435761;
  x = (x ^ (x >>> 15)) * 2246822519;
  x = (x ^ (x >>> 13)) * 3266489917;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

/**
 * Scramble-to-text decode: random glyphs resolve into the element's real characters, left to
 * right, finishing at exactly `duration` ms regardless of text length. Whitespace is never
 * scrambled, Unicode is handled per code point, and the exact original textContent is restored at
 * the end. Safe to call again while a decode is running on the same element.
 * @param {HTMLElement} el   Element whose textContent is the final text.
 * @param {{ duration?: number }} [opts]
 * @returns {Promise<void>}
 */
export function decodeReveal(el, { duration = 900 } = {}) {
  if (!isElement(el)) return Promise.resolve();
  let original;
  try {
    const prev = DECODING.get(el);
    original = prev ? prev.original : el.textContent;
  } catch {
    return Promise.resolve();
  }
  if (typeof original !== 'string') return Promise.resolve();

  const state = { original, token: Symbol('decode') };
  DECODING.set(el, state);
  const owns = () => DECODING.get(el) === state;

  const restore = () => {
    if (!owns()) return;
    try {
      el.textContent = original;
      el.classList.remove(PREFIX + 'decoding');
      if (state.minHeight !== undefined) el.style.minHeight = state.minHeight;
    } catch { /* ignore */ }
    DECODING.delete(el);
  };

  const ms = Number(duration);
  const chars = Array.from(original);
  const n = chars.length;
  if (reducedMotion() || !(ms > 0) || n === 0 || typeof requestAnimationFrame !== 'function') {
    restore();
    return Promise.resolve();
  }

  // Per-character resolve time as a fraction of the duration: a left→right wave with jitter.
  const thresholds = new Array(n);
  for (let i = 0; i < n; i++) {
    const base = n > 1 ? i / (n - 1) : 0;
    thresholds[i] = Math.min(0.97, 0.05 + base * 0.78 + unitHash(i) * 0.14);
  }

  try {
    state.minHeight = el.style.minHeight;
    const h = el.getBoundingClientRect().height;
    if (h > 0) el.style.minHeight = `${Math.ceil(h)}px`;
    el.classList.add(PREFIX + 'decoding');
  } catch { /* ignore */ }

  const start = performance.now();
  let lastScramble = -Infinity;
  let scrambled = new Array(n);
  let seed = 0x9e3779b9;
  const rnd = () => {
    seed ^= seed << 13; seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5; seed >>>= 0;
    return seed / 4294967296;
  };

  const frame = () => {
    if (!owns()) return;
    const now = performance.now();
    const p = Math.min(1, (now - start) / ms);
    if (p >= 1) return; // the timer below performs the final restore
    if (now - lastScramble >= 55) {
      // Refresh unresolved glyphs at ~18 Hz — a readable decode, not a strobe.
      lastScramble = now;
      for (let i = 0; i < n; i++) scrambled[i] = GLYPHS[(rnd() * GLYPHS.length) | 0];
    }
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      const c = chars[i];
      out[i] = p >= thresholds[i] || /\s/.test(c) ? c : scrambled[i];
    }
    try { el.textContent = out.join(''); } catch { /* ignore */ }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  return new Promise((resolve) => {
    setTimeout(() => { restore(); resolve(); }, ms);
    // If superseded by a later decode, resolve this one too so callers never hang.
    const poll = () => {
      if (!owns()) { resolve(); return; }
      if (performance.now() - start < ms) setTimeout(poll, 100);
    };
    setTimeout(poll, 100);
  });
}

/**
 * "Activation" effect for the executive badge: a bright sweep across it, a shimmer on the chip
 * (any `.badge__chip` inside), and a glow ring that expands and fades. ~800ms.
 * @param {HTMLElement} el
 * @returns {Promise<void>}
 */
export function badgeActivate(el) {
  if (!isElement(el) || reducedMotion()) return Promise.resolve();
  const ms = 820;
  const o = mountOverlay(el, 'badge', `
    <i class="${PREFIX}badge-ring"></i>
    <i class="${PREFIX}badge-ring ${PREFIX}badge-ring-2"></i>
    <i class="${PREFIX}badge-sweep"></i>
    <i class="${PREFIX}badge-corner ${PREFIX}badge-corner-tl"></i>
    <i class="${PREFIX}badge-corner ${PREFIX}badge-corner-tr"></i>
    <i class="${PREFIX}badge-corner ${PREFIX}badge-corner-bl"></i>
    <i class="${PREFIX}badge-corner ${PREFIX}badge-corner-br"></i>`, ms);
  if (!o) return Promise.resolve();
  pulseClass(el, 'badge-active', ms);
  try {
    const chip = el.querySelector('.badge__chip');
    if (chip) {
      ensurePositioned(chip);
      pulseClass(chip, 'chip-shimmer', ms);
    }
  } catch { /* ignore */ }
  return wait(ms);
}

/**
 * Confirmation effect when a decision is logged: a ring expands from the button and the button
 * flashes brighter for a moment. ~400ms. Identical whichever option was chosen.
 * @param {HTMLElement} buttonEl
 * @returns {Promise<void>}
 */
export function lockIn(buttonEl) {
  if (!isElement(buttonEl) || reducedMotion()) return Promise.resolve();
  const ms = 420;
  const o = mountOverlay(buttonEl, 'lock', `<i class="${PREFIX}lock-ring"></i><i class="${PREFIX}lock-ring ${PREFIX}lock-ring-2"></i>`, ms);
  if (!o) return Promise.resolve();
  pulseClass(buttonEl, 'flash', ms);
  return wait(ms);
}

/**
 * Stamp slam: scales from 1.6 → 1 with a slight rotation settle and a soft shockwave ring. ~600ms.
 * The element's resting transform (e.g. the stamp's slight tilt) is preserved as the end state.
 * @param {HTMLElement} el
 * @returns {Promise<void>}
 */
export function stampIn(el) {
  if (!isElement(el) || reducedMotion()) return Promise.resolve();
  const ms = 620;
  let rest = 'none';
  try {
    const t = getComputedStyle(el).transform;
    if (t && t !== 'none') rest = t;
  } catch { /* ignore */ }
  try { el.style.setProperty('--fxeffects-rest', rest === 'none' ? 'rotate(0deg)' : rest); } catch { /* ignore */ }
  const o = mountOverlay(el, 'stamp-wave', `<i class="${PREFIX}stamp-ring"></i><i class="${PREFIX}stamp-ring ${PREFIX}stamp-ring-2"></i>`, ms);
  if (!o) return Promise.resolve();
  pulseClass(el, 'stamp-in', ms);
  return wait(ms).then(() => {
    try { el.style.removeProperty('--fxeffects-rest'); } catch { /* ignore */ }
  });
}
