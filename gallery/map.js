/* The map. The hub of the whole gift: a painted island city with a little place for every memory, and two
   islands across the water. Tap a place and the two of them travel there. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, hex, mix, rgb, wrap, TAU, R, dab, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif', DISPLAY = '"Fraunces", "Iowan Old Style", Georgia, serif';
const INK = '#2c2a3d', PAPER = '#fbf3df';
/* w: position on a wide screen, t: on a tall one, as fractions of the map area */
const PLACES = [
  { id: 'frontdoor', name: 'The front door', w: [.15, .21], t: [.21, .095] }, { id: 'kitchen', name: 'Maggi kitchen', w: [.29, .16], t: [.5, .085] }, { id: 'chai', name: 'Chai coffee', w: [.43, .15], t: [.79, .095] }, { id: 'booth', name: 'The photo booth', w: [.575, .21], t: [.5, .605] }, { id: 'tarot', name: 'The Columbia steps', w: [.485, .345], t: [.5, .475] },
  { id: 'road', name: 'The river road', w: [.08, .47], t: [.17, .225] }, { id: 'rooftop', name: 'The rooftop', w: [.22, .5], t: [.2, .355] }, { id: 'garden', name: 'Central Park', w: [.37, .5], t: [.5, .215] }, { id: 'un', name: 'The UN', w: [.59, .52], t: [.83, .225] },
  { id: 'medal', name: 'The 5K', w: [.13, .79], t: [.2, .485] }, { id: 'city', name: 'The subway', w: [.29, .8], t: [.5, .345] }, { id: 'table', name: 'Table for two', w: [.44, .78], t: [.8, .355] }, { id: 'dumplings', name: 'Spicy Village', w: [.57, .8], t: [.8, .485] },
  { id: 'bahamas', name: 'The Bahamas', w: [.85, .27], t: [.26, .86], isle: 1 }, { id: 'mexico', name: 'Mexico', w: [.84, .74], t: [.74, .86], isle: 2 }
];
const BY = Object.fromEntries(PLACES.map(p => [p.id, p]));
const EDGES = {
  w: 'frontdoor-kitchen kitchen-chai road-rooftop rooftop-garden garden-un medal-city city-table table-dumplings frontdoor-rooftop kitchen-garden rooftop-city garden-table un-dumplings road-medal frontdoor-road chai-booth booth-un chai-tarot tarot-garden tarot-un',
  t: 'frontdoor-kitchen kitchen-chai road-garden garden-un rooftop-city city-table medal-tarot tarot-dumplings frontdoor-road kitchen-garden chai-un road-rooftop garden-city un-table rooftop-medal table-dumplings city-tarot tarot-booth'
};
let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false, hover = null, focus = -1, cur = 'frontdoor', trip = null;
const visited = new Set(), moth = { x: 0, y: 0 }, av = { x: 0, y: 0, dir: 1, phase: 0 };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };
const still = () => (G.RM ? 0 : 1);

/* ------------------------------------------------------------------ the land */
function blob(g, b, grow) {
  const r = R(b.seed), n = 30, pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a), k = 1 / Math.pow(Math.pow(Math.abs(c), 3) + Math.pow(Math.abs(s), 3), 1 / 3), wob = 1 + (r() - .5) * .13; pts.push([b.x + c * k * (b.rx * wob + grow), b.y + s * k * (b.ry * wob + grow)]); }
  g.beginPath(); g.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2); for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } g.closePath();
}
const inside = (b, x, y) => Math.pow(Math.abs((x - b.x) / b.rx), 3) + Math.pow(Math.abs((y - b.y) / b.ry), 3) < .86;
const onLand = (x, y) => L.lands.some(b => inside(b, x, y));
function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S; const wide = VW >= 760, mx = 22, my = wide ? 62 : 104, mw = VW - 44, mh = VH - my - 18, key = wide ? 'w' : 't';
  const at = (fx, fy) => [mx + mw * fx, my + mh * fy], pos = {}; for (const p of PLACES) pos[p.id] = at(p[key][0], p[key][1]);
  const mk = (c, rx, ry, seed) => ({ x: c[0], y: c[1], rx, ry, seed });
  const lands = wide ? [mk(at(.335, .5), mw * .335, mh * .485, 7), mk(at(.85, .25), mw * .115, mh * .2, 21), mk(at(.84, .73), mw * .125, mh * .2, 33)]
    : [mk(at(.5, .335), mw * .5 - 2, mh * .345, 7), mk(at(.26, .855), mw * .235, mh * .105, 21), mk(at(.74, .855), mw * .235, mh * .105, 33)];
  const dock = wide ? at(.665, .5) : at(.5, .68);
  L = { wide, key, pos, lands, dock, z: wide ? 1 : .74, rose: wide ? at(.97, .5) : at(.9, .715), edges: EDGES[key].split(' ').map(e => e.split('-')) };
  SPR = { back: G.spr(VW, VH, drawBack, clamp(S * G.DPR, 1, 2.5)) };
  const c = pos[cur]; av.x = c[0] + 40 * L.z; av.y = c[1] + 12 * L.z; $('mapui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function drawBack(g, w, h) {
  const r = R(1492);
  let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5fb6cc'); gr.addColorStop(1, '#3f8fb4'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h / 5200; i++) dab(g, r() * w, r() * h, 30 + r() * 70, 8 + r() * 16, (r() - .5) * .4, r() < .5 ? '#7fcfdc' : '#3a86ac', .12);
  g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.6; g.lineCap = 'round';
  for (let i = 0; i < w * h / 16000; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x - 9, y); g.quadraticCurveTo(x - 4.5, y - 5, x, y); g.quadraticCurveTo(x + 4.5, y - 5, x + 9, y); g.stroke(); }
  for (const [i, b] of L.lands.entries()) {
    g.fillStyle = 'rgba(170,240,228,.42)'; blob(g, b, 26); g.fill(); g.fillStyle = 'rgba(200,250,238,.5)'; blob(g, b, 15); g.fill(); g.fillStyle = '#f3e4b8'; blob(g, b, 7); g.fill();
    gr = g.createLinearGradient(0, b.y - b.ry, 0, b.y + b.ry); gr.addColorStop(0, i ? '#a8d47a' : '#a6cf78'); gr.addColorStop(1, i ? '#7fb85a' : '#86b862'); g.fillStyle = gr; blob(g, b, 0); g.fill();
    g.save(); blob(g, b, 0); g.clip(); for (let k = 0; k < b.rx * b.ry / 110; k++) dab(g, b.x + (r() - .5) * 2 * b.rx, b.y + (r() - .5) * 2 * b.ry, 12 + r() * 26, 6 + r() * 10, r() * 3, r() < .5 ? '#bfe08c' : '#6fa650', .22); g.globalAlpha = 1; g.restore();
  }
  /* streets between the places */
  const P = L.pos, road = (col, lw, dash) => { g.strokeStyle = col; g.lineWidth = lw; g.setLineDash(dash); for (const [a, b] of L.edges) { const p = P[a], q = P[b], mxx = (p[0] + q[0]) / 2 + (p[1] - q[1]) * .08, myy = (p[1] + q[1]) / 2 + (q[0] - p[0]) * .08; g.beginPath(); g.moveTo(p[0], p[1] + 8); g.quadraticCurveTo(mxx, myy + 8, q[0], q[1] + 8); g.stroke(); } g.setLineDash([]); };
  road('rgba(90,110,70,.25)', 13 * L.z, []); road('#efe2c0', 9 * L.z, []); road('rgba(190,160,110,.7)', 1.4, [5, 6]);
  /* little trees wherever there is room */
  for (let i = 0; i < w * h / 2600; i++) { const x = r() * w, y = r() * h, k = r(); if (!onLand(x, y) || Object.values(P).some(p => Math.abs(p[0] - x) < 46 * L.z && Math.abs(p[1] - y) < 44 * L.z)) continue; const s = (5 + r() * 5) * L.z; g.fillStyle = 'rgba(40,70,40,.2)'; ell(g, x + 2, y + s * .5, s, s * .4); g.fill(); g.fillStyle = k < .14 ? '#f4a8c0' : k < .24 ? '#e2a53a' : k < .6 ? '#4f9a50' : '#3f8444'; g.beginPath(); g.arc(x, y - s * .3, s, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.arc(x - s * .3, y - s * .6, s * .45, 0, TAU); g.fill(); }
  /* a dock, and a compass rose */
  const d = L.dock; g.fillStyle = '#a8845c'; if (L.wide) g.fillRect(d[0] - 4, d[1] - 6, 34, 12); else g.fillRect(d[0] - 6, d[1] - 4, 12, 30);
  const c = L.rose, cr = L.wide ? 26 : 17; g.save(); g.translate(c[0] - (L.wide ? cr + 6 : 0), c[1]); g.fillStyle = 'rgba(251,243,223,.85)'; g.beginPath(); g.arc(0, 0, cr, 0, TAU); g.fill(); g.strokeStyle = 'rgba(44,42,61,.5)'; g.lineWidth = 1.2; g.stroke();
  for (let i = 0; i < 4; i++) { g.save(); g.rotate(i * TAU / 4); g.fillStyle = i ? '#2c2a3d' : '#b8402e'; g.beginPath(); g.moveTo(0, -cr + 3); g.lineTo(5, 0); g.lineTo(-5, 0); g.fill(); g.restore(); }
  g.fillStyle = PAPER; g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill(); g.restore();
}

/* ------------------------------------------------------------------ a little building for every place (origin at its doorstep) */
const wall = (g, x, w, h, c) => { g.fillStyle = c; g.fillRect(x, -h, w, h); g.fillStyle = 'rgba(40,30,60,.14)'; g.fillRect(x + w * .68, -h, w * .32, h); };
const gable = (g, x, w, h, rh, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(x - 5, -h); g.lineTo(x + w / 2, -h - rh); g.lineTo(x + w + 5, -h); g.closePath(); g.fill(); };
const win = (g, x, y, w, h) => { g.fillStyle = '#ffe9a6'; g.fillRect(x, y, w, h); g.strokeStyle = 'rgba(60,40,30,.45)'; g.lineWidth = 1; g.strokeRect(x, y, w, h); };
const shade = (g, w) => { g.fillStyle = 'rgba(30,50,40,.22)'; ell(g, 3, 2, w, w * .22); g.fill(); };
const puff = (g, x, y, t, n = 3) => { if (G.RM) return; for (let i = 0; i < n; i++) { const k = (t * .45 + i / n) % 1; g.fillStyle = `rgba(255,255,255,${.6 * (1 - k)})`; g.beginPath(); g.arc(x + Math.sin(k * 5 + i) * 3, y - k * 22, 2.5 + k * 4, 0, TAU); g.fill(); } };
const tree = (g, x, y, s, c) => { g.fillStyle = '#6a4a32'; g.fillRect(x - 1.5, y - s, 3, s); g.fillStyle = c; g.beginPath(); g.arc(x, y - s * 1.5, s * .9, 0, TAU); g.arc(x - s * .6, y - s, s * .6, 0, TAU); g.arc(x + s * .6, y - s, s * .6, 0, TAU); g.fill(); };
const palm = (g, x, y, h) => { g.strokeStyle = '#8a6a48'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y - h * .6, x + 6, y - h); g.stroke(); g.strokeStyle = '#3f8a3c'; g.lineWidth = 2.6; for (let i = 0; i < 6; i++) { const a = -Math.PI + i * .63; g.beginPath(); g.moveTo(x + 6, y - h); g.quadraticCurveTo(x + 6 + Math.cos(a) * 8, y - h + Math.sin(a) * 8 - 4, x + 6 + Math.cos(a) * 15, y - h + Math.sin(a) * 9 + 5); g.stroke(); } };
const ICON = {
  frontdoor(g) { shade(g, 26); wall(g, -19, 38, 58, '#9a5a48'); g.fillStyle = '#f3e6cc'; g.fillRect(-22, -62, 44, 5); for (const y of [-52, -36]) for (const x of [-14, 4]) win(g, x, y, 10, 11); g.fillStyle = '#d6c8ac'; g.fillRect(-12, -4, 24, 4); g.fillRect(-9, -8, 18, 4); g.fillStyle = '#b8262c'; g.beginPath(); g.roundRect(-6, -24, 12, 16, [6, 6, 0, 0]); g.fill(); g.fillStyle = '#f2cf62'; g.beginPath(); g.arc(3, -15, 1.2, 0, TAU); g.fill(); },
  kitchen(g, t) { shade(g, 32); g.fillStyle = '#a65e48'; g.fillRect(12, -62, 8, 20); wall(g, -26, 52, 34, '#f6ecd4'); gable(g, -26, 52, 34, 22, '#c8463a'); g.fillStyle = '#7a4a34'; g.fillRect(-5, -18, 11, 18); win(g, -20, -24, 10, 10); win(g, 11, -24, 10, 10); g.fillStyle = '#f6d21c'; g.beginPath(); g.arc(0, -40, 7.5, 0, TAU); g.fill(); g.strokeStyle = '#d8402c'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, -40, 4, .4, 4.8); g.stroke(); puff(g, 16, -64, t); },
  chai(g, t) { shade(g, 32); wall(g, -27, 54, 32, '#ead9b6'); g.fillStyle = '#6e5440'; g.fillRect(-29, -36, 58, 5); win(g, -20, -22, 24, 14); g.fillStyle = '#7a4a34'; g.fillRect(10, -20, 11, 20); for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#fbf6ea' : '#2fa3a8'; g.beginPath(); g.moveTo(-29 + i * 9.7, -31); g.lineTo(-19.3 + i * 9.7, -31); g.lineTo(-20.3 + i * 9.7, -24); g.lineTo(-30 + i * 9.7, -24); g.fill(); }
    g.fillStyle = '#b4bac4'; g.beginPath(); g.moveTo(-8, -36); g.lineTo(-5, -47); g.lineTo(5, -47); g.lineTo(8, -36); g.fill(); g.fillStyle = '#d9dce2'; g.beginPath(); g.moveTo(-5, -47); g.lineTo(-7, -58); g.lineTo(6, -58); g.lineTo(5, -47); g.fill(); g.fillStyle = '#26252b'; g.fillRect(6, -57, 5, 8); g.beginPath(); g.arc(0, -60, 2.4, 0, TAU); g.fill(); puff(g, -7, -60, t); },
  rooftop(g, t) { shade(g, 34); wall(g, 14, 18, 84, '#8f4f40'); for (let i = 0; i < 6; i++) win(g, 20, -78 + i * 12, 5, 6); wall(g, -26, 42, 54, '#b06a50'); g.fillStyle = '#efe4cc'; g.fillRect(-28, -57, 46, 4); for (const y of [-44, -28]) for (const x of [-20, -6]) win(g, x, y, 8, 9); g.fillStyle = '#5a3a2c'; g.fillRect(-9, -12, 10, 12);
    g.strokeStyle = '#25272e'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-25, -57); g.lineTo(-25, -74); g.moveTo(13, -57); g.lineTo(13, -74); g.moveTo(-25, -73); g.quadraticCurveTo(-6, -64, 13, -73); g.stroke(); for (let i = 1; i < 6; i++) { const u = i / 6, x = -25 + 38 * u, y = -73 + Math.sin(u * Math.PI) * 5; g.fillStyle = `rgba(255,224,140,${.7 + .3 * Math.sin(t * 3 + i)})`; g.beginPath(); g.arc(x, y, 1.8, 0, TAU); g.fill(); } g.fillStyle = '#e8a23a'; g.fillRect(-10, -64, 3, 7); g.fillStyle = '#7a1426'; g.fillRect(-4, -64, 3, 7); },
  dumplings(g, t) { shade(g, 32); wall(g, -26, 52, 30, '#b8402e'); g.fillStyle = '#3a2c2c'; g.beginPath(); g.moveTo(-36, -29); g.quadraticCurveTo(-30, -34, -24, -44); g.lineTo(24, -44); g.quadraticCurveTo(30, -34, 36, -29); g.quadraticCurveTo(0, -36, -36, -29); g.fill(); win(g, -20, -22, 18, 13); g.fillStyle = '#5a2a1e'; g.fillRect(6, -19, 12, 19); for (const x of [-28, 28]) { g.strokeStyle = '#7a1c14'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, -31); g.lineTo(x, -24); g.stroke(); g.fillStyle = '#e0392c'; ell(g, x, -19, 4.6, 5.4); g.fill(); g.fillStyle = '#f2cf62'; g.fillRect(x - 2, -25, 4, 1.6); }
    g.fillStyle = '#d9b98a'; rr(g, -9, -56, 18, 6, 2); g.fill(); rr(g, -9, -50, 18, 6, 2); g.fill(); g.fillStyle = '#fbf2dc'; g.beginPath(); g.ellipse(0, -56, 7, 4, 0, Math.PI, 0); g.fill(); puff(g, 0, -60, t); },
  medal(g) { shade(g, 34); tree(g, -30, 0, 9, '#e2a53a'); for (const x of [-16, 22]) { g.fillStyle = '#b6d430'; rr(g, x - 4, -48, 8, 48, 4); g.fill(); } g.fillStyle = '#c8e23e'; rr(g, -20, -54, 46, 9, 4.5); g.fill(); g.fillStyle = '#c9501a'; g.fillRect(-10, -45, 26, 11); g.fillStyle = '#fbf3df'; g.fillRect(-6, -41, 18, 2); g.fillStyle = '#e8641c'; g.beginPath(); g.moveTo(-2, -30); g.lineTo(3, -18); g.lineTo(8, -30); g.fill(); g.fillStyle = '#f2cf62'; g.beginPath(); g.moveTo(3, -22); g.lineTo(11, -14); g.lineTo(3, -6); g.lineTo(-5, -14); g.fill(); g.fillStyle = '#d9a03c'; g.beginPath(); g.arc(3, -14, 3, 0, TAU); g.fill(); },
  garden(g, t) { g.fillStyle = 'rgba(30,50,40,.2)'; rr(g, -44, -40, 92, 50, 10); g.fill(); g.fillStyle = '#8fc86a'; rr(g, -46, -44, 92, 50, 10); g.fill(); g.strokeStyle = '#5f9a48'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#7fc4dc'; ell(g, 12, -14, 20, 9); g.fill(); g.strokeStyle = '#fbf6ea'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, -15); g.quadraticCurveTo(12, -26, 24, -15); g.stroke(); g.strokeStyle = '#efe2c0'; g.lineWidth = 3; g.beginPath(); g.moveTo(-44, -8); g.quadraticCurveTo(-20, -4, -8, -24); g.quadraticCurveTo(0, -38, 30, -38); g.stroke();
    tree(g, -30, -22, 8, '#f4a8c0'); tree(g, -14, -34, 7, '#fbe4ea'); tree(g, 34, -22, 7, '#4f9a50'); tree(g, -32, 2, 6, '#e2a53a'); if (!G.RM) { g.fillStyle = '#f6b0c8'; for (let i = 0; i < 3; i++) { const k = (t * .3 + i / 3) % 1; g.fillRect(-34 + i * 8 + Math.sin(k * 6) * 3, -34 + k * 26, 2, 1.4); } } },
  city(g, t) { shade(g, 34); const x = Math.sin(t * .8) * 3 * still(); g.fillStyle = '#6e6f78'; g.fillRect(-34, -6, 68, 3); g.fillStyle = '#d9dce2'; rr(g, -30 + x, -30, 60, 24, 5); g.fill(); g.fillStyle = '#5f7f9c'; for (let i = 0; i < 4; i++) g.fillRect(-25 + x + i * 13, -26, 9, 9); g.fillStyle = '#d8262c'; g.fillRect(-30 + x, -13, 60, 3); g.fillStyle = '#26252b'; g.beginPath(); g.arc(-18 + x, -5, 4, 0, TAU); g.arc(18 + x, -5, 4, 0, TAU); g.fill();
    g.fillStyle = '#2f6a44'; g.fillRect(-2, -52, 3, 22); for (const [dx, c] of [[-10, '#d8262c'], [0, '#f2b02c'], [10, '#2f62c0']]) { g.fillStyle = c; g.beginPath(); g.arc(dx, -52, 5.4, 0, TAU); g.fill(); } },
  un(g, t) { shade(g, 34); g.fillStyle = '#e9e2d0'; g.beginPath(); g.ellipse(-18, -14, 15, 12, 0, Math.PI, 0); g.fill(); g.fillRect(-33, -14, 30, 14); wall(g, -2, 26, 74, '#7fb8c8'); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1; for (let y = -68; y < 0; y += 7) { g.beginPath(); g.moveTo(-2, y); g.lineTo(24, y); g.stroke(); } g.fillStyle = '#f4f1e6'; g.fillRect(-4, -76, 4, 76);
    ['#d8262c', '#2f62c0', '#3f9a4a', '#f2b02c', '#8e1a5a'].forEach((c, i) => { const fx = -34 + i * 6.6; g.strokeStyle = '#8f949c'; g.lineWidth = 1; g.beginPath(); g.moveTo(fx, 4); g.lineTo(fx, -12); g.stroke(); g.fillStyle = c; g.fillRect(fx, -12 + Math.sin(t * 5 + i) * .6 * still(), 5, 3.4); }); },
  table(g) { shade(g, 32); wall(g, -26, 52, 32, '#f4e6c8'); g.fillStyle = '#3a2c2c'; g.fillRect(-28, -36, 56, 4); win(g, -20, -20, 16, 13); g.fillStyle = '#7a4a34'; g.fillRect(4, -19, 12, 19); for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#fbf6ea' : '#c8463a'; g.beginPath(); g.moveTo(-28 + i * 9.4, -32); g.lineTo(-18.6 + i * 9.4, -32); g.lineTo(-19.6 + i * 9.4, -25); g.lineTo(-29 + i * 9.4, -25); g.fill(); }
    g.fillStyle = '#8f949c'; rr(g, -13, -39, 26, 3, 1.5); g.fill(); g.fillStyle = '#d9dce2'; g.beginPath(); g.ellipse(0, -39, 11, 12, 0, Math.PI, 0); g.fill(); g.beginPath(); g.arc(0, -52, 2.2, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; ell(g, -4, -45, 2, 4); g.fill(); },
  booth(g, t) { shade(g, 26); wall(g, -18, 36, 50, '#f3e6cc'); g.fillStyle = '#e0604a'; g.fillRect(-18, -12, 36, 4); g.fillStyle = '#b8262c'; rr(g, -21, -60, 42, 13, 4); g.fill(); for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(255,232,150,${.65 + .35 * Math.sin(t * 4 + i * 1.4) * still()})`; g.beginPath(); g.arc(-14 + i * 7, -53.5, 2, 0, TAU); g.fill(); }
    g.fillStyle = '#241820'; g.fillRect(-13, -42, 17, 42); g.fillStyle = '#b83246'; g.fillRect(-13, -42, 17, 25); g.fillStyle = '#84202f'; for (let i = 0; i < 3; i++) g.fillRect(-9 + i * 5.5, -42, 1.6, 25); g.fillStyle = '#fbfaf5'; g.fillRect(8, -40, 7, 21); g.fillStyle = '#5a5560'; for (let i = 0; i < 4; i++) g.fillRect(9, -39 + i * 5, 5, 3.8);
    const k = G.RM ? 1 : (t * .45) % 1; if (k < .12) { g.globalCompositeOperation = 'lighter'; glow(g, -4, -22, 34, '255,250,230', .9 * (1 - k / .12)); g.globalCompositeOperation = 'source-over'; } },
  tarot(g, t) { shade(g, 34); g.fillStyle = '#9fa8a0'; g.beginPath(); g.ellipse(0, -44, 17, 13, 0, Math.PI, 0); g.fill(); wall(g, -27, 54, 30, '#e9dfca'); g.fillStyle = '#efe6d2'; g.fillRect(-29, -46, 58, 5); g.fillStyle = '#4a4458'; g.fillRect(-19, -38, 38, 24); for (let i = 0; i < 6; i++) { g.fillStyle = '#f4ecd8'; g.fillRect(-18 + i * 6.6, -38, 3.4, 24); }
    for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#c6baa2' : '#ebe2cf'; g.fillRect(-30 - i * 2, -14 + i * 4, 60 + i * 4, 4); } const bob = Math.sin(t * 2) * 1.5 * still(); g.save(); g.translate(22, -26 + bob); g.rotate(.2); g.fillStyle = '#fbf3df'; rr(g, -6, -9, 12, 18, 2); g.fill(); g.fillStyle = '#1c2748'; rr(g, -4.6, -7.6, 9.2, 15.2, 1.4); g.fill(); g.fillStyle = '#e9b44c'; g.beginPath(); g.arc(0, 0, 2.6, 0, TAU); g.fill(); g.restore(); },
  road(g) { shade(g, 30); g.strokeStyle = '#a49e9c'; g.lineWidth = 11; g.lineCap = 'round'; g.beginPath(); g.moveTo(-28, 2); g.quadraticCurveTo(-4, -14, 26, -6); g.stroke(); g.strokeStyle = '#fbf6ea'; g.lineWidth = 1.4; g.setLineDash([4, 4]); g.stroke(); g.setLineDash([]); tree(g, -16, -14, 11, '#e2a53a'); tree(g, 6, -18, 9, '#c66c32'); g.fillStyle = '#26302c'; g.fillRect(22, -40, 2.4, 34); g.fillStyle = '#f4ecd2'; g.fillRect(19.6, -47, 7, 8); g.fillStyle = '#26302c'; g.beginPath(); g.moveTo(17.6, -47); g.lineTo(23.2, -53); g.lineTo(28.6, -47); g.fill(); },
  bahamas(g, t) { shade(g, 32); g.fillStyle = '#fbfaf4'; g.fillRect(-12, -28, 32, 28); g.fillStyle = '#e6e2d6'; g.fillRect(-14, -31, 36, 4); g.fillStyle = '#9fc4cc'; g.fillRect(-8, -22, 9, 9); g.fillRect(6, -22, 9, 9); g.fillRect(6, -10, 9, 10); palm(g, -26, 0, 34); g.fillStyle = '#4fd0d8'; rr(g, -8, 6, 26, 6, 3); g.fill();
    for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#fbfaf4' : '#f2c21c'; g.beginPath(); g.moveTo(30, -22); g.arc(30, -22, 12, Math.PI + i * Math.PI / 4, Math.PI + (i + 1) * Math.PI / 4); g.fill(); } g.fillStyle = '#8f949c'; g.fillRect(29.4, -22, 1.4, 22); },
  mexico(g, t) { shade(g, 34); palm(g, 26, 0, 36); g.fillStyle = '#e6dcc6'; g.fillRect(-28, -6, 50, 6); g.fillRect(-24, -34, 42, 4); g.fillStyle = '#f3ead4'; for (let i = 0; i < 4; i++) g.fillRect(-22 + i * 12, -30, 5, 24); g.fillStyle = '#e6dcc6'; g.beginPath(); g.moveTo(-28, -34); g.lineTo(-3, -50); g.lineTo(22, -34); g.fill(); g.fillStyle = '#b8402e'; g.fillRect(-8, -30, 10, 18); g.fillStyle = '#f2cf62'; g.beginPath(); g.arc(-3, -22, 3, 0, TAU); g.fill();
    g.fillStyle = '#3f8a3c'; for (const [x, y] of [[-34, -2], [-38, -10], [34, -4]]) { g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); } }
};

/* ------------------------------------------------------------------ travel */
function setStep() { const p = hover || (focus >= 0 ? PLACES[focus] : null); $('mapstep').textContent = trip ? `Off to ${trip.place.name}.` : p ? p.name : 'Tap a place on the map to go there.'; }
function travel(p) {
  if (trip || !active) return; const to = L.pos[p.id], tx = to[0] + 40 * L.z, ty = to[1] + 12 * L.z, d = Math.hypot(tx - av.x, ty - av.y);
  trip = { place: p, x0: av.x, y0: av.y, x1: tx, y1: ty, u: 0, dur: clamp(d / 420, .45, 1.5), sent: false }; av.dir = tx >= av.x ? 1 : -1; hover = null; setStep(); tone(660, .1, 'sine', .06); tone(880, .16, 'sine', .05, .1);
}
function update(dt) {
  const t = G.time;
  if (trip) { trip.u = Math.min(1, trip.u + dt / trip.dur); const k = sm(trip.u); av.x = lerp(trip.x0, trip.x1, k); av.y = lerp(trip.y0, trip.y1, k); av.phase += dt * 10; if (trip.u >= 1 && !trip.sent) { trip.sent = true; cur = trip.place.id; visited.add(cur); G.go(cur); } }
  moth.x = lerp(moth.x, av.x + 24 + Math.sin(t * 1.1) * 8, 1 - Math.exp(-dt * 3)); moth.y = lerp(moth.y, av.y - 62 + Math.sin(t * 2.3) * 6, 1 - Math.exp(-dt * 3));
}
function route(g, a, b, bend, t) { const mx = (a[0] + b[0]) / 2 + (a[1] - b[1]) * bend, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend; g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2; g.setLineDash([3, 8]); g.lineDashOffset = -t * 9 * still(); g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(mx, my, b[0], b[1]); g.stroke(); g.setLineDash([]); return u => [(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * mx + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * my + u * u * b[1]]; }
function frame(dt) {
  if (!L || !SPR) return; update(dt);
  const t = G.time, g = cx, z = L.z; g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(SPR.back, 0, 0, VW, VH);
  /* clouds drifting over the map */
  const cl = G.SP && G.SP.clouds; if (cl) for (const [i, fx, fy, sc, sp] of [[1, .1, .2, .5, 5], [3, .6, .58, .6, 4], [5, .85, .9, .45, 6]]) { const s = cl[i][0], w = s.uw * sc, span = VW + 500, x = wrap(fx * span + t * sp * still(), span) - 250, y = VH * fy; g.globalAlpha = .1; g.fillStyle = '#1c3a5a'; ell(g, x + w / 2 + 16, y + s.uh * sc + 22, w * .36, 10); g.fill(); g.globalAlpha = .6; g.drawImage(s, x, y, w, s.uh * sc); } g.globalAlpha = 1;
  /* sea routes: a sailboat to one island, a little plane to the other */
  const d = L.dock, ends = [L.pos.bahamas, L.pos.mexico].map((p, i) => { const b = L.lands[i + 1]; return L.wide ? [b.x - b.rx - 6, p[1] + 10] : [p[0], b.y - b.ry - 6]; });
  const r1 = route(g, d, ends[0], L.wide ? -.18 : .16, t), r2 = route(g, d, ends[1], L.wide ? .18 : -.16, t);
  { const u = G.RM ? .5 : .5 + .5 * Math.sin(t * .25), [x, y] = r1(u); g.fillStyle = '#fbfaf4'; g.beginPath(); g.moveTo(x, y - 17); g.lineTo(x + 9, y - 3); g.lineTo(x, y - 3); g.fill(); g.fillStyle = '#7a5c44'; g.beginPath(); g.moveTo(x - 9, y - 2); g.lineTo(x + 11, y - 2); g.lineTo(x + 7, y + 3); g.lineTo(x - 6, y + 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x - 10, y + 4, 22, 1.4); }
  { const u = G.RM ? .4 : (t * .07) % 1, [x, y] = r2(u), [x2, y2] = r2(Math.min(1, u + .02)), a = Math.atan2(y2 - y, x2 - x); g.fillStyle = 'rgba(30,60,90,.2)'; ell(g, x + 6, y + 14, 10, 3); g.fill(); g.save(); g.translate(x, y - 8); g.rotate(a); g.fillStyle = '#fbfaf4'; rr(g, -11, -2.6, 22, 5.2, 2.6); g.fill(); g.beginPath(); g.moveTo(-2, 0); g.lineTo(-7, -10); g.lineTo(-3, -10); g.lineTo(5, 0); g.lineTo(-3, 10); g.lineTo(-7, 10); g.fill(); g.fillStyle = '#c8463a'; g.fillRect(-11, -5, 4, 10); g.restore(); }
  /* the places */
  const order = PLACES.slice().sort((a, b) => L.pos[a.id][1] - L.pos[b.id][1]), fs = L.wide ? 12.5 : 11;
  for (const p of order) {
    const [x, y] = L.pos[p.id], hot = !trip && (hover === p || (focus >= 0 && PLACES[focus] === p)), going = trip && trip.place === p, k = (hot || going ? 1.16 : 1) * z, bob = hot ? Math.abs(Math.sin(t * 5)) * 3 : 0;
    if (hot || going) { g.globalCompositeOperation = 'lighter'; glow(g, x, y - 18 * z, 60 * z, '255,240,190', .5); g.globalCompositeOperation = 'source-over'; }
    g.save(); g.translate(x, y + 10 * z - bob); g.scale(k, k); ICON[p.id](g, t); g.restore();
    g.font = `700 ${fs}px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const star = visited.has(p.id), tw = g.measureText(p.name).width + 16 + (star ? 12 : 0), ly = y + 24 * z;
    g.fillStyle = 'rgba(30,40,50,.25)'; rr(g, x - tw / 2 + 1, ly - 8.5, tw, 19, 9.5); g.fill(); g.fillStyle = hot || going ? '#fff6d8' : PAPER; rr(g, x - tw / 2, ly - 10, tw, 19, 9.5); g.fill(); if (hot || going) { g.strokeStyle = '#f2b45c'; g.lineWidth = 1.6; g.stroke(); }
    g.fillStyle = INK; g.fillText(p.name, x + (star ? 6 : 0), ly); if (star) { g.fillStyle = '#e9a52c'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? 2.2 : 5; g.lineTo(x - tw / 2 + 10 + Math.cos(a) * rad, ly + Math.sin(a) * rad); } g.fill(); }
  }
  /* the two of them, in a little boat whenever they are over water */
  const walk = trip ? 1 : 0, sc = .46 * (L.wide ? 1 : .9);
  if (trip && !onLand(av.x, av.y - 6)) { g.fillStyle = 'rgba(255,255,255,.5)'; ell(g, av.x - av.dir * 22, av.y + 3, 16, 3); g.fill(); g.fillStyle = '#fbfaf4'; g.beginPath(); g.moveTo(av.x - 24, av.y - 8); g.lineTo(av.x + 24, av.y - 8); g.quadraticCurveTo(av.x + 18, av.y + 4, av.x + 10, av.y + 4); g.lineTo(av.x - 14, av.y + 4); g.quadraticCurveTo(av.x - 22, av.y + 2, av.x - 24, av.y - 8); g.fill(); g.fillStyle = '#2f62c0'; g.fillRect(av.x - 23, av.y - 5, 46, 2.4);
    G.figure(g, av.x - av.dir * 9, av.y - 6, 'f', { dir: av.dir, sc, outfit: 'coat' }); G.figure(g, av.x + av.dir * 7, av.y - 6, 'j', { dir: av.dir, sc, outfit: 'coat' }); }
  else { G.figure(g, av.x - av.dir * 15, av.y - 2, 'f', { dir: av.dir, phase: av.phase + 1.4, walk, sc, outfit: 'coat' }); G.figure(g, av.x + av.dir * 3, av.y, 'j', { dir: av.dir, phase: av.phase, walk, sc, outfit: 'coat' }); }
  g.globalCompositeOperation = 'lighter'; glow(g, moth.x, moth.y, 30, '255,214,130', .4 + .08 * Math.sin(t * 6)); g.globalCompositeOperation = 'source-over';
  { const f = G.RM ? .6 : Math.abs(Math.sin(t * 17)); g.fillStyle = 'rgba(255,246,214,.94)'; for (const dd of [-1, 1]) { g.beginPath(); g.ellipse(moth.x + dd * (1.4 + 3 * f), moth.y - 1.4, 1.2 + 3.4 * f, 3.8, dd * .5, 0, TAU); g.fill(); } g.fillStyle = '#ffd874'; ell(g, moth.x, moth.y, 1.6, 3.2); g.fill(); }
  G.paper(g, .3);
}

/* ------------------------------------------------------------------ input and wiring */
const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
function pick(x, y) { let best = null, bd = 56 * L.z; for (const p of PLACES) { const q = L.pos[p.id], d = Math.hypot(x - q[0], (y - (q[1] - 10 * L.z)) * .8); if (d < bd) { bd = d; best = p; } } return best; }
cv.addEventListener('pointerdown', e => { if (!active || !L) return; if (!G.started) { G.begin(); return; } const [x, y] = pt(e), p = pick(x, y); if (p) travel(p); });
cv.addEventListener('pointermove', e => { if (!active || !L || trip || e.pointerType !== 'mouse') return; const [x, y] = pt(e), p = pick(x, y); if (p !== hover) { hover = p; focus = -1; setStep(); } });
addEventListener('keydown', e => {
  if (!active || trip || e.metaKey || e.ctrlKey || (e.target && e.target.tagName === 'BUTTON')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') { if (!G.started) G.begin(); const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1; focus = (focus + d + PLACES.length) % PLACES.length; hover = null; setStep(); e.preventDefault(); }
  else if ((e.key === ' ' || e.key === 'Enter') && focus >= 0) { e.preventDefault(); travel(PLACES[focus]); }
});
const soundLabel = () => { $('mapsound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('mapsound').setAttribute('aria-pressed', G.sound); };
$('mapsound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
$('mapward').addEventListener('click', () => { if (!G.started) G.begin(); if (!trip) G.go('wardrobe'); });

G.scenes.map = {
  frame, resize() { layout(); },
  enter() { active = true; trip = null; hover = null; $('mapui').hidden = false; $('title').hidden = G.started; layout(); moth.x = av.x + 24; moth.y = av.y - 62; setStep(); soundLabel(); if (document.fonts && document.fonts.load) document.fonts.load('700 12px Nunito'); },
  leave() { active = false; $('mapui').hidden = true; $('title').hidden = true; },
  debug: { PLACES, visited, travel, get L() { return L; }, get S() { return S; }, get cur() { return cur; } }
};
})();
