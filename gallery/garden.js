/* Central Park, a year of it. The two of them walk one long path through the park while the seasons turn:
   spring blossom, the lake in summer, autumn leaves, snow at dusk. Thirteen things along the way each open a picture. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, hex, mix, rgb, wrap, TAU, R, dab, foliage, PAL, glow, tone } = G;
const $ = id => document.getElementById(id);
const TOTAL = 6500, ZONE = 1700, FEET = 100, LX0 = 1860, LX1 = 2800;
const H4 = a => a.map(hex);
const C = {
  skyT: H4(['#8fc8ee', '#5fa8e8', '#86b4dc', '#4f5f96']), skyB: H4(['#e9f4f2', '#d9effa', '#fbe4bc', '#d8c6d6']),
  grass: H4(['#a6cc72', '#6fa84e', '#b39a52', '#eef2f6']), grassD: H4(['#7fb05a', '#4f8a40', '#8f7a3c', '#dbe3ec']), path: H4(['#aaa4a2', '#a49e9c', '#9a8e86', '#c9d0d8'])
};
const PINKP = H4(['#b8527c', '#e8709c', '#f6b0c8', '#fde4ea']), WHITEP = H4(['#b9c4b0', '#e6ecd8', '#fbfbf2', '#ffffff']), FRESHP = H4(['#4f8a40', '#7fb05a', '#a6cc72', '#d6ec9a']);
const NAMES = ['Spring', 'Summer', 'Autumn', 'Winter'];
const MARKS = [
  { id: 'dusk', media: 'photo', x: 260, prop: 'pink', ty: 250 }, { id: 'pink', media: 'photo', x: 560, prop: 'pink2', ty: 262 }, { id: 'white', media: 'photo', x: 860, prop: 'white', ty: 250 },
  { id: 'park', media: 'clip', x: 1160, prop: 'bench', ty: 130 }, { id: 'lake', media: 'clip', x: 1960, prop: 'boat', ty: 120 }, { id: 'rock', media: 'photo', x: 2520, prop: 'rock', ty: 130 },
  { id: 'flowers', media: 'photo', x: 2980, prop: 'bed', ty: 130 }, { id: 'tarot', media: 'photo', x: 3620, prop: 'cards', ty: 140 }, { id: 'story', media: 'photo', x: 3960, prop: 'wine', ty: 150 },
  { id: 'bench', media: 'photo', x: 4300, prop: 'plaque', ty: 130 }, { id: 'autumn', media: 'photo', x: 4640, prop: 'leaves', ty: 210 }, { id: 'sleds', media: 'clip', x: 5500, prop: 'sleds', ty: 130 }, { id: 'snow', media: 'photo', x: 5950, prop: 'snow', ty: 120 }
];
let S = 1, VW = 0, VH = 0, HZ = 0, BASE = 0, SPR = null, active = false, camX = 0, camInit = false, target = null, keyDir = 0, down = false, pending = null, near = null, view = null, endShown = false, endT = 0, stepKey = '';
const P = { x: 120, v: 0, dir: 1, phase: 0 }, seen = new Set(), moth = { x: 160, y: 300 };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };
const seasonAt = x => { const u = clamp(x / ZONE, 0, 3.999), i = Math.floor(u); return Math.min(3, i + sm(u - i, .78, 1)); };
const mixS = (a, s) => { const i = Math.min(2, Math.floor(s)); return mix(a[i], a[i + 1], s - i); };
const still = () => (G.RM ? 0 : 1);

/* ------------------------------------------------------------------ sprites: trees for each season, the far treeline, the skyline */
const TREES = (() => { const r = R(1857), a = []; for (let x = 60; x < TOTAL + 200; x += 150 + r() * 130) { if (x > LX0 - 60 && x < LX1 + 60) continue; if (MARKS.some(m => Math.abs(m.x - x) < 120)) continue; a.push({ x, sc: .78 + r() * .34, k: r(), j: r() }); } return a; })();
function layout() {
  S = Math.min(G.W / 430, G.H / 720); if (G.H > G.W * 1.3) S *= 1.25; VW = G.W / S; VH = G.H / S; HZ = VH - 262; BASE = VH - 152; camInit = false;
  if (!SPR) build(); $('gui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function build() {
  const q = clamp(S * G.DPR, 1, 2);
  const tree = (seed, pal, h, bare) => G.spr(320, h + 20, (g, w, hh) => {
    const r = R(seed), bx = w / 2, by = hh - 2, tx = bx + (r() - .5) * 30, ty = by - h * .46, ends = [], paths = [];
    g.fillStyle = '#4a3a32'; g.beginPath(); g.moveTo(bx - 11, by); g.quadraticCurveTo(bx - 5, by - h * .25, tx - 4, ty); g.lineTo(tx + 4, ty); g.quadraticCurveTo(bx + 6, by - h * .25, bx + 11, by); g.fill();
    g.lineCap = 'round'; for (let i = 0; i < (bare ? 9 : 6); i++) { const kk = .5 + i * (bare ? .06 : .09), sx = lerp(bx, tx, kk), sy = lerp(by, ty, kk), d = i % 2 ? 1 : -1, ex = sx + d * (36 + r() * 70), ey = sy - 50 - r() * 60; paths.push([sx, sy, sx + d * 22, sy - 28, ex, ey, 4.4 - i * .35]); ends.push([ex, ey]); if (bare) for (let k = 0; k < 2; k++) paths.push([lerp(sx, ex, .6), lerp(sy, ey, .6), ex + (r() - .5) * 30, ey - 10, ex + (r() - .5) * 60, ey - 26 - r() * 30, 1.8]); }
    for (const [a, b, c, d2, e, f, lw] of paths) { g.strokeStyle = '#4a3a32'; g.lineWidth = lw; g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(c, d2, e, f); g.stroke(); }
    if (bare) { g.strokeStyle = 'rgba(255,255,255,.92)'; for (const [a, b, c, d2, e, f, lw] of paths) { g.lineWidth = Math.max(1.4, lw * .55); g.beginPath(); g.moveTo(a, b - lw * .5); g.quadraticCurveTo(c, d2 - lw * .5, e, f - lw * .5); g.stroke(); } return; }
    const cyc = ty - h * .14; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + r(), d = .4 + r() * .4; ends.push([tx + Math.cos(a) * d * 90, cyc + Math.sin(a) * d * h * .16]); }
    ends.sort((p, q2) => q2[1] - p[1]); for (const [ex, ey] of ends) foliage(g, r, ex, ey - 12, 50 + r() * 24, 36 + r() * 16, pal, 130); foliage(g, r, tx, cyc - h * .05, 70, 48, pal, 160);
  }, q);
  const far = (seed, cols, snow) => G.spr(600, 150, (g, w, h) => { const r = R(seed); for (let i = 0; i < 150; i++) { const x = r() * w, y = h - r() * r() * 110 - 4, rx = 22 + r() * 22, ry = 16 + r() * 14, c = cols[r() * cols.length | 0]; for (const o of [-w, 0, w]) dab(g, x + o, y, rx, ry, 0, c, snow ? .6 : .95); } if (snow) for (let i = 0; i < 90; i++) { const x = r() * w, y = h - r() * 120; for (const o of [-w, 0, w]) dab(g, x + o, y, 14 + r() * 14, 3, 0, '#ffffff', .8); } g.globalAlpha = 1; }, q);
  SPR = {
    pink: tree(11, PINKP, 300), pink2: tree(12, PINKP, 330), white: tree(13, WHITEP, 310), fresh: tree(14, FRESHP, 320), green: tree(15, PAL.deep, 340), green2: tree(16, PAL.yg, 310), gold: tree(17, PAL.gold, 330), rust: tree(18, PAL.rust, 300), bare: tree(19, null, 320, true), bare2: tree(20, null, 290, true),
    far: [far(1, ['#9cc47a', '#b6d68a', '#f4c0d0', '#fbe4ea', '#7fb06a']), far(2, ['#3f7a40', '#4f8a48', '#6fa85a', '#2f6a3c']), far(3, ['#d9953a', '#b9602e', '#e8c860', '#8a7a3c', '#c8502c']), far(4, ['#8a8490', '#9a94a0', '#77707c'], true)],
    sky: G.spr(900, 240, (g, w, h) => { const r = R(59); for (let x = 0; x < w; x += 20 + r() * 30) { const bw = 18 + r() * 30, bh = 40 + r() * r() * 110; g.fillStyle = r() < .5 ? '#a9bcd4' : '#b9c8dc'; g.fillRect(x, h - bh, bw, bh); g.fillStyle = 'rgba(255,255,255,.25)'; for (let y = h - bh + 6; y < h; y += 9) g.fillRect(x + 3, y, bw - 6, 2); } g.fillStyle = '#9fb0cc'; g.fillRect(250, h - 130, 96, 130); for (const tx of [258, 314]) { g.fillRect(tx, h - 200, 24, 200); g.fillRect(tx + 7, h - 222, 10, 24); g.fillRect(tx + 11, h - 234, 2, 12); } for (const [tx, th] of [[620, 230], [690, 204], [744, 216]]) { g.fillStyle = '#b4c2d8'; g.fillRect(tx, h - th, 9, th); } }, q)
  };
}

/* ------------------------------------------------------------------ things along the path (origin at the foot of each) */
function bench(g, plaque) {
  g.fillStyle = '#1c2420'; for (const x of [-36, 32]) { g.fillRect(x, -30, 4, 30); g.fillRect(x - 2, -62, 4, 34); } g.strokeStyle = '#1c2420'; g.lineWidth = 3; g.lineCap = 'round'; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * 40, -30); g.quadraticCurveTo(d * 50, -44, d * 40, -48); g.stroke(); }
  g.fillStyle = '#3f6048'; for (const y of [-62, -52, -42]) { rr(g, -44, y, 88, 7, 2); g.fill(); } rr(g, -46, -30, 92, 7, 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(-44, -62, 88, 1.6); g.fillRect(-46, -30, 92, 1.6);
  if (plaque) { g.fillStyle = '#d9dce2'; rr(g, -13, -61.5, 26, 6, 1); g.fill(); g.fillStyle = '#8f949c'; g.fillRect(-9, -59.4, 18, .9); g.fillRect(-7, -57.6, 14, .9); }
}
function lamp(g) { g.fillStyle = '#26302c'; g.beginPath(); g.moveTo(-7, 0); g.lineTo(-3, -20); g.lineTo(-2.4, -150); g.lineTo(2.4, -150); g.lineTo(3, -20); g.lineTo(7, 0); g.fill(); g.fillRect(-6, -154, 12, 5); g.fillStyle = '#f4ecd2'; g.beginPath(); g.moveTo(-6, -154); g.lineTo(-10, -178); g.lineTo(10, -178); g.lineTo(6, -154); g.fill(); g.fillStyle = '#26302c'; g.beginPath(); g.moveTo(-13, -178); g.lineTo(0, -192); g.lineTo(13, -178); g.fill(); g.fillRect(-1, -198, 2, 7); }
function table(g) { g.strokeStyle = '#5a4434'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-34, -50); g.lineTo(-48, 0); g.moveTo(34, -50); g.lineTo(48, 0); g.stroke(); g.fillStyle = '#6e5440'; rr(g, -74, -30, 148, 7, 2); g.fill(); g.fillStyle = '#7a5c44'; rr(g, -60, -54, 120, 8, 2); g.fill(); g.fillStyle = '#93725a'; g.beginPath(); g.moveTo(-60, -54); g.lineTo(60, -54); g.lineTo(50, -66); g.lineTo(-50, -66); g.fill(); }
const PROP = {
  bench(g) { bench(g, false); }, plaque(g) { bench(g, true); },
  boat(g) { g.strokeStyle = '#c9a67a'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-10, -22); g.lineTo(52, -2); g.stroke(); g.fillStyle = '#3f6048'; g.beginPath(); g.moveTo(-58, -26); g.lineTo(58, -26); g.quadraticCurveTo(48, -2, 30, 0); g.lineTo(-34, 0); g.quadraticCurveTo(-52, -4, -58, -26); g.fill(); g.fillStyle = '#c9a67a'; g.fillRect(-56, -28, 112, 4); g.fillRect(-16, -24, 6, 12); g.fillRect(16, -24, 6, 12); },
  rock(g) { g.fillStyle = '#7a7672'; g.beginPath(); g.moveTo(-62, 0); g.lineTo(-48, -30); g.lineTo(-14, -48); g.lineTo(30, -40); g.lineTo(60, -14); g.lineTo(66, 0); g.fill(); g.fillStyle = 'rgba(232,222,206,.55)'; g.beginPath(); g.moveTo(-48, -30); g.lineTo(-14, -48); g.lineTo(30, -40); g.lineTo(4, -26); g.fill(); g.fillStyle = 'rgba(50,46,66,.25)'; g.beginPath(); g.moveTo(4, -26); g.lineTo(30, -40); g.lineTo(60, -14); g.lineTo(66, 0); g.lineTo(10, 0); g.fill(); },
  bed(g) { const r = R(31); g.fillStyle = '#3f6a40'; rr(g, -84, -26, 168, 26, 10); g.fill(); g.fillStyle = 'rgba(255,255,255,.1)'; rr(g, -80, -26, 160, 6, 4); g.fill(); for (let i = 0; i < 46; i++) { const x = -78 + r() * 156, hh = 30 + r() * 34; g.strokeStyle = '#4f8a40'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, -24); g.lineTo(x + (r() - .5) * 6, -hh); g.stroke(); dab(g, x, -hh, 4.4, 4, 0, ['#e85f9c', '#a886e0', '#f6b0c8', '#8f8fe8', '#c8324a', '#f2cf62'][r() * 6 | 0], 1); } g.globalAlpha = 1; },
  cards(g) { table(g); const r = R(5); for (let i = 0; i < 12; i++) { const x = -42 + i * 7.4; g.fillStyle = i % 2 ? '#2fa3a8' : '#3fb8b8'; g.beginPath(); g.moveTo(x, -57); g.lineTo(x + 9, -57); g.lineTo(x + 7 + r(), -63.5); g.lineTo(x - 2, -63.5); g.fill(); } g.fillStyle = '#f3ecd8'; g.beginPath(); g.moveTo(38, -78); g.lineTo(52, -78); g.lineTo(50, -58); g.lineTo(40, -58); g.fill(); },
  wine(g) { table(g); for (const [x, c, cap] of [[-22, '#c9c23a', '#b9b02c'], [-4, '#f0a03c', '#f08a2c']]) { g.fillStyle = 'rgba(255,255,255,.35)'; rr(g, x - 6, -96, 12, 38, 3); g.fill(); g.fillStyle = c; rr(g, x - 5, -84, 10, 25, 2); g.fill(); g.fillStyle = cap; g.fillRect(x - 2.6, -106, 5.2, 12); g.fillStyle = '#fbf6ea'; g.fillRect(x - 5, -78, 10, 10); } for (const x of [22, 38]) { g.fillStyle = '#f3ecd8'; g.beginPath(); g.moveTo(x - 6, -76); g.lineTo(x + 6, -76); g.lineTo(x + 4.6, -58); g.lineTo(x - 4.6, -58); g.fill(); } },
  leaves(g) { lamp(g); const r = R(8); for (let i = 0; i < 70; i++) { const a = r() * Math.PI, k = Math.sqrt(r()); dab(g, 44 + Math.cos(a) * k * 46, -Math.sin(a) * k * 24, 6 + r() * 4, 3 + r() * 2, r() * 3, ['#d9a53a', '#c66c32', '#e8c860', '#a8582c'][r() * 4 | 0], 1); } g.globalAlpha = 1; },
  sleds(g) { for (const [x, a] of [[-18, -.24], [26, .2]]) { g.save(); g.translate(x, -34); g.rotate(a); g.fillStyle = '#b82a22'; ell(g, 0, 0, 16, 34); g.fill(); g.fillStyle = '#e04a3a'; ell(g, -2, -2, 12, 29); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; ell(g, -6, -14, 3, 10); g.fill(); g.strokeStyle = '#f4ead6'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, -30, 6, Math.PI, 0); g.stroke(); g.restore(); } g.fillStyle = '#fff'; ell(g, 4, 0, 50, 8); g.fill(); },
  snow(g) { g.fillStyle = '#fff'; ell(g, 0, 0, 62, 20); g.fill(); g.beginPath(); g.ellipse(0, -4, 44, 30, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(160,180,210,.3)'; g.beginPath(); g.ellipse(8, -4, 34, 22, 0, Math.PI * 1.5, 0); g.lineTo(8, -4); g.fill(); for (const [x, y, s] of [[-50, -4, 8], [-34, -2, 6], [48, -4, 9], [58, 0, 6], [36, -1, 5]]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - s * .6, s, 0, TAU); g.fill(); g.fillStyle = 'rgba(160,180,210,.35)'; g.beginPath(); g.arc(x + 1.5, y - s * .4, s * .7, 0, Math.PI); g.fill(); } }
};
function token(g, x, y, kind, done, t, i) {
  const pu = done ? 0 : .5 + .5 * Math.sin(t * 3 + i * 1.7);
  if (!done) { g.globalCompositeOperation = 'lighter'; glow(g, x, y, 40 + pu * 10, '255,244,210', .55 + .3 * pu); g.globalCompositeOperation = 'source-over'; }
  g.save(); g.translate(x, y + Math.sin(t * 1.6 + i) * 4 * still()); g.scale(done ? .86 : 1.08 + .07 * pu, done ? .86 : 1.08 + .07 * pu); g.globalAlpha = done ? .78 : 1;
  g.fillStyle = 'rgba(40,40,70,.2)'; g.beginPath(); g.arc(1.5, 2.5, 22, 0, TAU); g.fill(); g.fillStyle = '#fffdf6'; g.beginPath(); g.arc(0, 0, 22, 0, TAU); g.fill(); g.strokeStyle = done ? '#b9b2a4' : '#f2b45c'; g.lineWidth = 2.4; g.stroke();
  g.rotate(Math.sin(t * .8 + i) * .1 * still()); g.lineCap = 'round';
  if (kind === 0) { for (let p = 0; p < 5; p++) { g.save(); g.rotate(p * TAU / 5); g.fillStyle = '#f08fb0'; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-7, -6, -6, -16, 0, -15); g.bezierCurveTo(6, -16, 7, -6, 0, 0); g.fill(); g.restore(); } g.fillStyle = '#f6b02c'; g.beginPath(); g.arc(0, 0, 3.4, 0, TAU); g.fill(); }
  else if (kind === 1) { g.strokeStyle = '#f2b02c'; g.lineWidth = 2.4; for (let p = 0; p < 10; p++) { const a = p / 10 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 9, Math.sin(a) * 9); g.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); g.stroke(); } g.fillStyle = '#f6c22c'; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill(); }
  else if (kind === 2) { g.fillStyle = '#d9772c'; g.beginPath(); g.moveTo(0, 14); g.bezierCurveTo(-16, 6, -14, -12, 0, -16); g.bezierCurveTo(14, -12, 16, 6, 0, 14); g.fill(); g.strokeStyle = '#8f4426'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, 17); g.lineTo(0, -11); g.moveTo(0, 2); g.lineTo(-7, -4); g.moveTo(0, 2); g.lineTo(7, -4); g.moveTo(0, -5); g.lineTo(-5, -10); g.moveTo(0, -5); g.lineTo(5, -10); g.stroke(); }
  else { g.strokeStyle = '#5f9fd8'; g.lineWidth = 2.2; for (let p = 0; p < 6; p++) { g.save(); g.rotate(p * TAU / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -15); g.moveTo(0, -9); g.lineTo(-4, -13); g.moveTo(0, -9); g.lineTo(4, -13); g.stroke(); g.restore(); } }
  g.restore(); g.globalAlpha = 1;
}

/* ------------------------------------------------------------------ play */
function setStep() {
  const n = NAMES[Math.round(seasonAt(P.x))]; $('gstep').textContent = seen.size === 0 && P.x < 200 ? 'Central Park, in spring. Tap or hold ahead of them to walk. Tap anything that glows.' : `${n} in Central Park.`;
  $('gcount').textContent = `Memories ${seen.size} of ${MARKS.length}`;
}
const vid = $('gvid'), pic = $('gimg');
function open(m) {
  seen.add(m.id); view = m; pending = null; target = null; keyDir = 0; P.v = 0; const photo = m.media === 'photo'; vid.hidden = photo; pic.hidden = !photo;
  if (photo) { pic.alt = 'A photo from Central Park'; pic.src = `media/gd_${m.id}.jpg`; } else { vid.muted = !G.sound; vid.loop = true; vid.poster = `media/gd_${m.id}.jpg`; vid.src = `media/gd_${m.id}.mp4`; const p = vid.play(); if (p && p.catch) p.catch(() => { /* she can press play herself */ }); }
  $('gview').hidden = false; $('gclose').focus(); tone(784, .16, 'sine', .06); tone(1175, .3, 'sine', .04, .08); setStep();
}
function closeView() { vid.pause(); vid.removeAttribute('src'); vid.load(); pic.removeAttribute('src'); $('gview').hidden = true; view = null; }
function update(dt) {
  const t = G.time, free = $('gview').hidden && $('gend').hidden; let want = 0;
  if (free) { if (keyDir) { want = keyDir; target = null; pending = null; } else if (target != null) { const dx = target - P.x; if (Math.abs(dx) < 6) { target = null; if (pending) open(pending); } else want = Math.sign(dx); } }
  P.v = lerp(P.v, want * 150, 1 - Math.exp(-dt * 9)); if (Math.abs(P.v) < 1 && !want) P.v = 0; if (want) P.dir = want;
  P.x = clamp(P.x + P.v * dt, 90, TOTAL - 160); P.phase += Math.abs(P.v) * dt * .064;
  const camT = clamp(P.x - VW * (VW < 700 ? .5 : .44 - .08 * P.dir), 0, TOTAL - VW); camX = camInit ? lerp(camX, camT, 1 - Math.exp(-dt * 3)) : camT; camInit = true;
  near = null; let best = 120; for (const m of MARKS) { const d = Math.abs(m.x - P.x); if (d < best) { best = d; near = m; } }
  $('glook').hidden = !near || !free;
  const key = Math.round(seasonAt(P.x)) + '|' + seen.size + '|' + (P.x < 200); if (key !== stepKey) { stepKey = key; setStep(); }
  if (seen.size === MARKS.length && free && !endShown) { endT += dt; if (endT > 1.4) { endShown = true; $('gend').hidden = false; $('gstay').focus(); [523, 659, 784, 1047].forEach((f, i) => tone(f, .9, 'sine', .05, i * .22)); } }
  moth.x = lerp(moth.x, P.x + P.dir * 60 + Math.sin(t * 1.1) * 14, 1 - Math.exp(-dt * 2.4)); moth.y = lerp(moth.y, VH - FEET - 190 + Math.sin(t * 2.3) * 12, 1 - Math.exp(-dt * 3));
}
function tile(g, s, yTop, off) { if (!s.pat) s.pat = g.createPattern(s, 'repeat'); const q = s.width / s.uw; g.save(); g.translate(-wrap(off, s.uw), yTop); g.scale(1 / q, 1 / q); g.fillStyle = s.pat; g.fillRect(0, 3, (VW + s.uw) * q, s.height - 3); g.restore(); }
function band(g, y, h, arr) { const gr = g.createLinearGradient(0, 0, VW, 0); for (let k = 0; k <= 6; k++) gr.addColorStop(k / 6, rgb(mixS(arr, seasonAt(camX + VW * k / 6)))); g.fillStyle = gr; g.fillRect(0, y, VW, h); }
function treeFor(tr) { const se = seasonAt(tr.x), i = Math.min(3, Math.floor(se) + (tr.j < se - Math.floor(se) ? 1 : 0)); return i === 0 ? [SPR.pink, SPR.white, SPR.fresh, SPR.pink2][tr.k * 4 | 0] : i === 1 ? (tr.k < .5 ? SPR.green : SPR.green2) : i === 2 ? (tr.k < .55 ? SPR.gold : SPR.rust) : (tr.k < .5 ? SPR.bare : SPR.bare2); }
function frame(dt) {
  if (!SPR) return; update(dt);
  const t = G.time, g = cx, k = S * G.DPR, sc = seasonAt(camX + VW / 2), dusk = sm(sc, 2.45, 3), sx = wx => wx - camX, on = x => x > -260 && x < VW + 260;
  g.setTransform(k, 0, 0, k, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  /* sky, clouds, the buildings beyond the trees */
  const sg = g.createLinearGradient(0, Math.min(0, HZ - 500), 0, HZ); sg.addColorStop(0, rgb(mixS(C.skyT, sc))); sg.addColorStop(1, rgb(mixS(C.skyB, sc))); g.fillStyle = sg; g.fillRect(0, 0, VW, HZ + 2);
  const cl = G.SP && G.SP.clouds; if (cl) for (const [i, fx, cy, s2, sp] of [[0, .1, 300, .9, 3], [2, .5, 380, 1.1, 2], [4, .84, 260, .7, 4], [1, .32, 200, .45, 1.5]]) { const s = cl[i], w = s[0].uw * s2, h = s[0].uh * s2, span = VW + 700, x = wrap(fx * span + t * sp * still() - camX * .05, span) - 350, y = HZ - cy - h; if (y + h < 0) continue; g.globalAlpha = .9 * (1 - dusk); g.drawImage(s[0], x, y, w, h); g.globalAlpha = .7 * dusk; g.drawImage(s[1], x, y, w, h); } g.globalAlpha = .85; tile(g, SPR.sky, HZ - 236, camX * .1); g.globalAlpha = 1;
  if (dusk > 0) { g.fillStyle = `rgba(60,70,130,${.35 * dusk})`; g.fillRect(0, HZ - 236, VW, 238); const w = R(4); g.fillStyle = `rgba(255,224,150,${dusk})`; for (let i = 0; i < 70; i++) g.fillRect(wrap(w() * 900 - camX * .1, VW + 40) - 20, HZ - 10 - w() * 120, 2, 2.6); }
  const i0 = Math.min(2, Math.floor(sc)); tile(g, SPR.far[i0], HZ - 130, camX * .4); g.globalAlpha = sc - i0; tile(g, SPR.far[i0 + 1], HZ - 130, camX * .4); g.globalAlpha = 1;
  /* the meadow, the sledding hill, the lake with its white bridge */
  band(g, HZ, BASE - HZ + 4, C.grass);
  { const x = sx(5520); if (x > -520 && x < VW + 520) { g.fillStyle = '#fbfcfe'; g.beginPath(); g.ellipse(x, HZ + 30, 420, 60, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(160,180,214,.2)'; g.beginPath(); g.ellipse(x + 60, HZ + 30, 330, 44, 0, Math.PI * 1.5, 0); g.lineTo(x + 60, HZ + 30); g.fill(); } }
  { const x0 = sx(LX0), x1 = sx(LX1); if (x1 > -20 && x0 < VW + 20) { const wy = HZ + 6, wh = BASE - 16 - wy, wg = g.createLinearGradient(0, wy, 0, wy + wh); wg.addColorStop(0, '#9fc8d6'); wg.addColorStop(1, '#5f9fb8'); g.fillStyle = wg; rr(g, x0, wy, x1 - x0, wh, 34); g.fill();
    const r = R(6); g.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 46; i++) { const lx = LX0 + 40 + r() * (LX1 - LX0 - 110), ly = wy + 8 + r() * (wh - 16), a = .5 + .5 * Math.sin(t * (1 + r()) + i); g.globalAlpha = a * .7; g.fillRect(sx(lx), ly, 10 + r() * 22, 1.4); } g.globalAlpha = 1;
    const bx0 = sx(2190), bx1 = sx(2590), by = wy + 34; g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 5; g.beginPath(); g.moveTo(bx0, by + 4); g.quadraticCurveTo((bx0 + bx1) / 2, by + 44, bx1, by + 4); g.stroke();
    g.fillStyle = '#f4f1e6'; g.beginPath(); g.moveTo(bx0, by); g.quadraticCurveTo((bx0 + bx1) / 2, by - 44, bx1, by); g.lineTo(bx1, by + 6); g.quadraticCurveTo((bx0 + bx1) / 2, by - 30, bx0, by + 6); g.fill(); g.strokeStyle = '#f4f1e6'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx0, by - 12); g.quadraticCurveTo((bx0 + bx1) / 2, by - 56, bx1, by - 12); g.stroke(); g.lineWidth = 1.2; for (let i = 0; i <= 20; i++) { const u = i / 20, x = lerp(bx0, bx1, u), y = by - 44 * 2 * u * (1 - u); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 12); g.stroke(); }
    for (const [bx, ph] of [[2060, 0], [2700, 2]]) { const x = sx(bx + Math.sin(t * .12 + ph) * 50 * still()), y = wy + wh * .62; g.fillStyle = '#7a5c44'; g.beginPath(); g.moveTo(x - 22, y - 6); g.lineTo(x + 22, y - 6); g.quadraticCurveTo(x + 16, y + 3, x + 8, y + 3); g.lineTo(x - 10, y + 3); g.quadraticCurveTo(x - 18, y + 2, x - 22, y - 6); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x - 24, y + 5, 48, 1.4); } } }
  /* trees, the low fence, lamps and benches, then whatever holds a memory */
  for (const tr of TREES) { const x = sx(tr.x); if (!on(x)) continue; const s = treeFor(tr); g.drawImage(s, x - s.uw * tr.sc / 2, BASE - 6 - s.uh * tr.sc, s.uw * tr.sc, s.uh * tr.sc); }
  g.strokeStyle = '#26302c'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, BASE - 16); g.lineTo(VW, BASE - 16); g.moveTo(0, BASE - 8); g.lineTo(VW, BASE - 8); g.stroke(); g.lineWidth = 2.4; g.beginPath(); for (let wx = Math.floor(camX / 64) * 64; wx < camX + VW + 64; wx += 64) { g.moveTo(sx(wx), BASE); g.lineTo(sx(wx), BASE - 18); } g.stroke();
  for (let wx = 400; wx < TOTAL; wx += 480) { const x = sx(wx); if (!on(x) || MARKS.some(m => Math.abs(m.x - wx) < 90)) continue; g.save(); g.translate(x, BASE); lamp(g); g.restore(); }
  for (let wx = 720; wx < TOTAL; wx += 860) { const x = sx(wx); if (!on(x) || MARKS.some(m => Math.abs(m.x - wx) < 130)) continue; g.save(); g.translate(x, BASE + 2); bench(g, false); g.restore(); }
  for (const m of MARKS) { const x = sx(m.x); if (!on(x)) continue; if (SPR[m.prop]) { const s = SPR[m.prop], z = 1.28; g.drawImage(s, x - s.uw * z / 2, BASE - 4 - s.uh * z, s.uw * z, s.uh * z); } else { g.save(); g.translate(x, BASE + 2); PROP[m.prop](g, t); g.restore(); } }
  /* the path, the two of them, the near verge */
  band(g, BASE, 92, C.path); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, BASE, VW, 3); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(0, BASE + 3, VW, 2);
  { const r = R(21); for (let i = 0; i < 90; i++) { const wx = r() * TOTAL, x = sx(wx), y = BASE + 8 + r() * 80, se = seasonAt(wx); if (x < -10 || x > VW + 10) continue; if (se < .7) dab(g, x, y, 3.4, 1.8, r() * 3, r() < .5 ? '#f6b0c8' : '#fde4ea', .9); else if (se > 1.6 && se < 2.7) dab(g, x, y, 4.4, 2.2, r() * 3, ['#d9a53a', '#c66c32', '#e8c860'][r() * 3 | 0], .9); } g.globalAlpha = 1; }
  const walk = Math.min(1, Math.abs(P.v) / 60), outfit = seasonAt(P.x) < 1.6 ? 'skirt' : 'coat', fy = VH - FEET;
  G.figure(g, P.x - P.dir * 54 - camX, fy - 6, 'f', { dir: P.dir, phase: P.phase + 1.4, walk, outfit, sc: 1.26 }); G.figure(g, P.x - camX, fy, 'j', { dir: P.dir, phase: P.phase, walk, outfit, sc: 1.32 });
  band(g, VH - 62, 62, C.grassD); g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(0, VH - 62, VW, 3);
  /* evening comes with the snow: the lamps light */
  if (dusk > 0) { g.fillStyle = `rgba(30,34,84,${.3 * dusk})`; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'lighter'; for (let wx = 400; wx < TOTAL; wx += 480) { const x = sx(wx); if (!on(x)) continue; glow(g, x, BASE - 166, 120, '255,206,130', .6 * dusk); glow(g, x, BASE - 166, 20, '255,244,214', .9 * dusk); g.save(); g.translate(x, BASE + 44); g.scale(1, .24); glow(g, 0, 0, 170, '255,196,120', .3 * dusk); g.restore(); } g.globalCompositeOperation = 'source-over'; }
  /* petals, seeds, leaves or snow, depending on where they are in the year */
  if (!G.RM) { const r = R(8); for (let i = 0; i < 54; i++) { const fx = r(), fyy = r(), v = 22 + r() * 30, ph = r() * 6, x = wrap(fx * (VW + 100) - camX * 1.05 + Math.sin(t * .7 + ph) * 26, VW + 100) - 50, se = seasonAt(x + camX); let y = wrap(fyy * VH + t * v, VH + 40) - 20;
    if (se < .62) { g.save(); g.translate(x, y); g.rotate(t * 1.6 + ph); g.fillStyle = i % 2 ? '#f6b0c8' : '#fde4ea'; ell(g, 0, 0, 4.4, 2.4); g.fill(); g.restore(); }
    else if (se < 1.55) { if (i % 4 === 0) { y = wrap(fyy * VH - t * 8, VH + 40) - 20; g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); } }
    else if (se < 2.55) { g.save(); g.translate(x, y); g.rotate(t * 2 + ph); g.fillStyle = ['#e2ae40', '#cf7436', '#f0d066', '#b9602e'][i % 4]; ell(g, 0, 0, 5, 2.4); g.fill(); g.restore(); }
    else { g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.arc(x, y, 1.6 + (i % 3), 0, TAU); g.fill(); } } }
  MARKS.forEach((m, i) => { const x = sx(m.x); if (on(x)) token(g, x, BASE - m.ty, Math.round(seasonAt(m.x)), seen.has(m.id), t, i); });
  g.globalCompositeOperation = 'lighter'; glow(g, moth.x - camX, moth.y, 48, '255,214,130', .34 + .2 * dusk + .08 * Math.sin(t * 6)); g.globalCompositeOperation = 'source-over';
  { const mx = moth.x - camX, f = G.RM ? .6 : Math.abs(Math.sin(t * 17)); g.fillStyle = 'rgba(255,246,214,.94)'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(mx + d * (2 + 4.5 * f), moth.y - 2, 1.6 + 5 * f, 5.4, d * .5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(mx + d * (1.5 + 3 * f), moth.y + 4, 1.2 + 3 * f, 3.4, d * -.4, 0, TAU); g.fill(); } g.fillStyle = '#ffd874'; ell(g, mx, moth.y, 2.2, 4.6); g.fill(); }
  G.paper(g, .3 + .1 * dusk);
}

/* ------------------------------------------------------------------ input and wiring */
const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
const busy = () => !active || !$('gview').hidden || !$('gend').hidden;
cv.addEventListener('pointerdown', e => {
  if (busy()) return; const [x, y] = pt(e), wx = x + camX, m = MARKS.find(m => Math.abs(wx - m.x) < 60 && y > BASE - m.ty - 50 && y < BASE + 10);
  if (m) { if (Math.abs(m.x - P.x) < 150) open(m); else { pending = m; target = m.x; } return; }
  down = true; pending = null; target = clamp(wx, 90, TOTAL - 160);
});
cv.addEventListener('pointermove', e => { if (down && !busy()) target = clamp(pt(e)[0] + camX, 90, TOTAL - 160); });
addEventListener('pointerup', () => { down = false; }); addEventListener('pointercancel', () => { down = false; });
const KEYS = { ArrowRight: 1, d: 1, D: 1, ArrowLeft: -1, a: -1, A: -1 };
addEventListener('keydown', e => {
  if (!active || e.metaKey || e.ctrlKey) return; if (!$('gview').hidden) { if (e.key === 'Escape') closeView(); return; }
  if (busy()) return; if (KEYS[e.key]) { keyDir = KEYS[e.key]; e.preventDefault(); } else if ((e.key === ' ' || e.key === 'Enter') && !(e.target && e.target.tagName === 'BUTTON')) { e.preventDefault(); if (near) open(near); }
});
addEventListener('keyup', e => { if (KEYS[e.key] === keyDir) keyDir = 0; });
const soundLabel = () => { $('gsound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('gsound').setAttribute('aria-pressed', G.sound); };
$('gsound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
$('gleave').addEventListener('click', () => G.go('map'));
$('glook').addEventListener('click', () => { if (near) open(near); });
$('gclose').addEventListener('click', closeView); $('gview').addEventListener('click', e => { if (e.target === $('gview')) closeView(); });
$('gstay').addEventListener('click', () => { $('gend').hidden = true; }); $('gback').addEventListener('click', () => { $('gend').hidden = true; G.go('map'); });

G.scenes.garden = {
  frame, resize: layout,
  enter() { active = true; $('gui').hidden = false; layout(); stepKey = ''; setStep(); soundLabel(); moth.x = P.x + 60; moth.y = VH - FEET - 190; },
  leave() { active = false; if (!$('gview').hidden) closeView(); $('gend').hidden = true; target = null; keyDir = 0; down = false; P.v = 0; $('gui').hidden = true; },
  debug: { P, MARKS, seen, open, get S() { return S; }, get camX() { return camX; }, set camInit(v) { camInit = v; } }
};
})();
