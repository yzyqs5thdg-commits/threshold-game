/* The Mexico wing. A museum to walk through: a rotunda, then six halls of dioramas, glass cases and field recordings,
   each one a moment from the trip. Looking closer opens the real photo or clip. It ends on a bench under the dawn sky. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, hex, mix, rgb, wrap, TAU, R, dab, foliage, PAL, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif', DISPLAY = '"Fraunces", "Iowan Old Style", Georgia, serif';
const INK = '#2c2a3d', PAPER = '#fbf3df', BRASS = '#c9a45c';
const JK = { skin: '#f0c7a6', hair: '#573726', hi: 'rgba(196,142,88,.9)', coat: '#232a45' }, FK = { skin: '#c99a74', hair: '#17141a', hi: 'rgba(110,102,132,.75)', coat: '#cdb48e' };
const HALLS = [
  { id: 'rot', name: 'THE MEXICO WING', x0: 0, x1: 900, wall: ['#efe4cc', '#dccdb0'], trim: '#b08f5c' },
  { id: 'sea', name: 'HALL OF THE SEA', x0: 900, x1: 2200, wall: ['#17456a', '#0d2c4a'], trim: '#5fa6c8' },
  { id: 'cen', name: 'HALL OF CENOTES', x0: 2200, x1: 3500, wall: ['#234844', '#142e30'], trim: '#6fb09c' },
  { id: 'jun', name: 'HALL OF THE JUNGLE', x0: 3500, x1: 4400, wall: ['#487552', '#2f553c'], trim: '#e2c06a' },
  { id: 'food', name: 'HALL OF FOOD AND DRINK', x0: 4400, x1: 5800, wall: ['#33273c', '#1e1626'], trim: '#c99a5c' },
  { id: 'eve', name: 'HALL OF EVENINGS', x0: 5800, x1: 7100, wall: ['#44366a', '#2a2046'], trim: '#f2b45c' },
  { id: 'sky', name: 'HALL OF THE SKY', x0: 7100, x1: 8100, wall: ['#222e58', '#151d3c'], trim: '#a9bcee' }
];
const HBY = Object.fromEntries(HALLS.map(h => [h.id, h])), TOTAL = 8100, FEET = 96, BENCH = 7690;
const EX = [
  { id: 'boat', hall: 'sea', x: 1210, w: 290, h: 210, kind: 'dio', scene: boat, media: 'clip', tall: true, label: 'The boat', title: 'Field recording: the boat', text: 'One specimen, observed on deck between swims. Waves at the camera and appears delighted.' },
  { id: 'under', hall: 'sea', x: 1610, w: 300, h: 210, kind: 'dio', scene: under, media: 'clip', tall: true, label: 'Below the surface', title: 'Field recording: below the surface', text: 'A snorkeller in clear green water above the sea grass. Stops to wave, then keeps swimming.' },
  { id: 'mask', hall: 'sea', x: 1970, kind: 'case', obj: maskObj, media: 'clip', tall: true, label: 'Mask and snorkel', title: 'Mask, snorkel and life vest', text: 'Worn in open water. Recorded mid-laugh, holding on to the float.' },
  { id: 'cave', hall: 'cen', x: 2540, w: 320, h: 230, kind: 'dio', scene: cave, media: 'photo', tall: true, label: 'The cave cenote', title: 'Cenote, under the stalactites', text: 'Two swimmers in water this blue, lit from a gap in the rock overhead, arms around each other.' },
  { id: 'swim', hall: 'cen', x: 2930, w: 290, h: 200, kind: 'dio', scene: swim, media: 'photo', tall: false, label: 'The open cenote', title: 'Open cenote, with life jackets', text: 'Dark green water and rings of ripples. One swimmer mid hair flip, the other smiling up at the camera.' },
  { id: 'rain', hall: 'cen', x: 3280, w: 280, h: 200, kind: 'dio', scene: rain, media: 'clip', tall: true, label: 'The downpour', title: 'Field recording: the downpour', text: 'Rain coming down hard on red ground, watched from under the roof. The sign reads KIN-HA.' },
  { id: 'atv', hall: 'jun', x: 3950, w: 370, h: 240, kind: 'dio', scene: atvScene, media: 'photo', tall: false, label: 'The quad bike', title: 'Jungle transport, heavily muddied', text: 'Driver: Jana, laughing. Passenger: holding on, also laughing. Helmets: orange, both.' },
  { id: 'negroni', hall: 'food', x: 4690, kind: 'case', obj: negroni, media: 'photo', tall: true, label: 'Two cocktails', title: 'Two cocktails, baby corn garnish', text: 'A matched pair on white coasters, served in a bar lined with records.' },
  { id: 'paleta', hall: 'food', x: 4990, kind: 'case', obj: paleta, media: 'photo', tall: true, label: 'Paleta', title: 'Paleta, in progress', text: 'Collected at La Michoacana. Photographed mid-bite.' },
  { id: 'tacos', hall: 'food', x: 5290, kind: 'case', obj: tacos, media: 'photo', tall: true, label: 'Car tacos', title: 'Lunch, back seat of a car', text: 'Tacos, guacamole and lime, on plates balanced on knees.' },
  { id: 'shots', hall: 'food', x: 5570, kind: 'case', obj: shots, media: 'photo', tall: true, label: 'The toast', title: 'A toast across the table', text: 'One pink with a coconut rim, one green and cream. Raised at the same time.' },
  { id: 'swing', hall: 'eve', x: 6130, w: 290, h: 240, kind: 'dio', scene: swingScene, media: 'photo', tall: true, label: 'The swing', title: 'Swing under the tree of lights', text: 'A rope swing hung from a tree strung with bulbs, at dusk. The sign above it reads IKÚ.' },
  { id: 'twirl', hall: 'eve', x: 6520, kind: 'case', big: true, obj: costume, media: 'photo', tall: true, label: 'The skirt', title: 'Evening wear, in motion', text: 'Floral skirt and cream top, caught mid-turn on a street of neon.' },
  { id: 'show', hall: 'eve', x: 6860, w: 280, h: 200, kind: 'dio', scene: show, media: 'clip', tall: true, label: 'The show', title: 'Field recording: the show', text: 'Fire, aerialists overhead, and a crowd with its arms up.' },
  { id: 'dawn', hall: 'sky', x: 7620, w: 540, h: 300, kind: 'dome', scene: dawn, media: 'photo', tall: true, label: 'Dawn', title: 'Dawn over the water', text: 'Rays fan out from the horizon, pink and blue, over thatched umbrellas and empty loungers.' }
];
EX.forEach((e, i) => { e.no = String(i + 1).padStart(2, '0'); });
const STAMPS = ['sea', 'cen', 'jun', 'food', 'eve', 'sky'];
let S = 1, VW = 0, VH = 0, E = 0, DY = 255, active = false, camX = 0, camInit = false, target = null, keyDir = 0, down = false, pending = null, near = null, hallNow = '', endShown = false;
const P = { x: 170, v: 0, dir: 1, phase: 0, seated: false, sitT: 0 };
const seen = new Set(), says = [], moth = { x: 220, y: 300 };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };
const arch = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, [r, r, 4, 4]); };
function spaced(g, text, x, y, sp, align) { let w = 0; for (const ch of text) w += g.measureText(ch).width + sp; let lx = align === 'center' ? x - w / 2 : x; g.textAlign = 'left'; for (const ch of text) { g.fillText(ch, lx, y); lx += g.measureText(ch).width + sp; } return w; }
function layout() { S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S; E = VH - 170; DY = clamp(E * .43, 255, 340); camInit = false; $('xui').style.fontSize = clamp(16 * S, 13, 18) + 'px'; }

/* ------------------------------------------------------------------ small figures used inside the exhibits */
function bust(g, x, y, s, k, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = o.hair || k.hair; ell(g, 0, -2, 15, 16); g.fill(); if (!o.up) { rr(g, -15, -2, 30, o.len || 30, 10); g.fill(); }
  if (o.top) { g.fillStyle = o.top; g.beginPath(); g.moveTo(-21, 36); g.quadraticCurveTo(-19, 14, -6, 12); g.lineTo(6, 12); g.quadraticCurveTo(19, 14, 21, 36); g.closePath(); g.fill(); }
  g.fillStyle = k.skin; g.fillRect(-4, 8, 8, 8); ell(g, 0, 0, 11.5, 13); g.fill();
  g.fillStyle = o.hair || k.hair; g.beginPath(); g.moveTo(-12, -2); g.quadraticCurveTo(-11, -15, 0, -14); g.quadraticCurveTo(11, -15, 12, -2); g.quadraticCurveTo(6, -10, 0, -10); g.quadraticCurveTo(-6, -10, -12, -2); g.fill();
  if (o.helmet) { g.fillStyle = o.helmet; g.beginPath(); g.ellipse(0, -5, 14.5, 12.5, 0, Math.PI, 0); g.fill(); g.fillRect(-14.5, -6, 29, 3); }
  g.lineCap = 'round';
  if (o.mask) { g.fillStyle = '#23262c'; rr(g, -10.5, -6, 21, 10.5, 4); g.fill(); g.fillStyle = 'rgba(160,210,236,.55)'; rr(g, -8.5, -4.5, 7.5, 7.5, 2); g.fill(); rr(g, 1, -4.5, 7.5, 7.5, 2); g.fill(); g.strokeStyle = '#d8e83a'; g.lineWidth = 2.8; g.beginPath(); g.moveTo(11, 7); g.lineTo(13.5, -19); g.stroke(); }
  else { g.strokeStyle = '#2b2024'; g.lineWidth = 1.5; for (const d of [-1, 1]) { g.beginPath(); if (o.joy) g.arc(d * 4.6, -1, 2.3, Math.PI * 1.1, Math.PI * 1.9); else g.arc(d * 4.6, -1.5, .9, 0, TAU); g.stroke(); } }
  g.fillStyle = 'rgba(224,104,98,.35)'; for (const d of [-1, 1]) { ell(g, d * 7, 4.4, 3, 2); g.fill(); }
  if (o.joy) { g.fillStyle = '#7a1c24'; g.beginPath(); g.moveTo(-4.2, 5); g.quadraticCurveTo(0, 11.5, 4.2, 5); g.closePath(); g.fill(); } else { g.strokeStyle = '#8e3a3a'; g.lineWidth = 1.3; g.beginPath(); g.arc(0, 4, 3.4, .15 * Math.PI, .85 * Math.PI); g.stroke(); }
  g.restore();
}
function rider(g, x, y, k, reach) {
  g.lineCap = 'round'; g.strokeStyle = k.skin; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 15, y + 4); g.lineTo(x + 13, y + 22); g.stroke();
  g.fillStyle = '#1c1c22'; rr(g, x - 9, y - 34, 18, 36, 7); g.fill();
  g.strokeStyle = k.skin; g.beginPath(); g.moveTo(x + 2, y - 28); g.lineTo(x + reach, y - 17); g.stroke();
  G.hair(g, x - 5, y - 45, { len: 30, w: 6, flow: .55, wave: .5, col: k.hair, dark: k.hair, hi: k.hi, lo: 'rgba(0,0,0,.3)', t: G.time });
  g.fillStyle = k.skin; g.beginPath(); g.arc(x + 1, y - 44, 9, 0, TAU); g.fill();
  g.fillStyle = '#f0622c'; g.beginPath(); g.arc(x + 1, y - 47, 10.5, Math.PI, 0); g.fill(); g.fillRect(x - 10, y - 48, 22, 3.4);
  g.fillStyle = '#7a1c24'; g.beginPath(); g.moveTo(x + 3, y - 41); g.quadraticCurveTo(x + 6, y - 35, x + 9, y - 41); g.fill();
}
function atv(g, x, y, sc, t, riders) {
  g.save(); g.translate(x, y); g.scale(sc, sc); const spin = riders ? t * 6 : .4;
  for (const wx of [-44, 44]) { g.fillStyle = '#22201e'; g.beginPath(); g.arc(wx, -24, 24, 0, TAU); g.fill(); g.strokeStyle = '#4a443c'; g.lineWidth = 5; g.setLineDash([5, 5]); g.beginPath(); g.arc(wx, -24, 22.5, spin, spin + TAU); g.stroke(); g.setLineDash([]); g.fillStyle = '#8a8478'; g.beginPath(); g.arc(wx, -24, 9, 0, TAU); g.fill(); }
  g.translate(0, riders && !G.RM ? Math.sin(t * 9) * 1.5 : 0);
  g.fillStyle = '#3a4a8c'; g.beginPath(); g.moveTo(-64, -44); g.quadraticCurveTo(-44, -66, -22, -50); g.lineTo(-4, -56); g.lineTo(26, -58); g.quadraticCurveTo(52, -68, 68, -46); g.lineTo(58, -34); g.lineTo(-56, -34); g.closePath(); g.fill();
  g.fillStyle = '#22242c'; rr(g, -36, -66, 46, 12, 6); g.fill();
  g.strokeStyle = '#b9b4a8'; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(40, -63); g.lineTo(72, -63); g.moveTo(62, -46); g.lineTo(78, -40); g.lineTo(76, -24); g.stroke();
  g.strokeStyle = '#22242c'; g.lineWidth = 4; g.beginPath(); g.moveTo(26, -58); g.lineTo(21, -82); g.lineTo(31, -86); g.stroke();
  g.fillStyle = '#fff3c0'; g.beginPath(); g.arc(63, -52, 5, 0, TAU); g.fill();
  const r = R(7); for (let i = 0; i < 30; i++) dab(g, -66 + r() * 136, -64 + r() * 44, 2 + r() * 5, 1.5 + r() * 3, r() * 3, '#9a8a68', .75); g.globalAlpha = 1;
  if (riders) { rider(g, -24, -66, FK, 14); rider(g, 0, -66, JK, 24); }
  g.restore();
}
function swimmer(g, x, y, sc, t) {
  g.save(); g.translate(x, y); g.scale(sc, sc); const k = G.RM ? .3 : Math.sin(t * 3); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = JK.skin; g.lineWidth = 9; g.beginPath(); g.moveTo(-30, 2); g.lineTo(-62, 2 + k * 7); g.lineTo(-88, 6 + k * 12); g.moveTo(-30, 4); g.lineTo(-60, 6 - k * 7); g.lineTo(-86, 4 - k * 12); g.stroke();
  g.fillStyle = '#23262c'; for (const s of [1, -1]) { g.beginPath(); g.ellipse(-99, 5 + s * k * 12, 15, 5, s * k * .3, 0, TAU); g.fill(); }
  g.fillStyle = '#1c1c22'; rr(g, -38, -8, 20, 18, 6); g.fill();
  g.fillStyle = '#f07a2c'; rr(g, -20, -11, 40, 23, 7); g.fill(); g.fillStyle = '#d8d4c8'; g.fillRect(-10, -11, 5, 23); g.fillRect(4, -11, 5, 23);
  G.hair(g, 22, -8, { len: 50, w: 8.5, flow: 1, wave: 1, curl: 0, col: JK.hair, dark: '#40281b', hi: JK.hi, lo: 'rgba(58,34,22,.5)', t });
  g.strokeStyle = JK.skin; g.lineWidth = 7; g.beginPath(); g.moveTo(14, 4); g.lineTo(42, 12 + k * 3); g.lineTo(64, 6); g.stroke();
  g.fillStyle = JK.skin; g.beginPath(); g.arc(30, -2, 11, 0, TAU); g.fill();
  g.fillStyle = '#23262c'; rr(g, 31, -8, 11, 11, 3); g.fill(); g.fillStyle = 'rgba(160,210,236,.6)'; rr(g, 33, -6, 7, 7, 2); g.fill();
  g.strokeStyle = '#d8e83a'; g.lineWidth = 3; g.beginPath(); g.moveTo(35, 5); g.quadraticCurveTo(24, 3, 24, -22); g.stroke();
  g.restore();
}
function backSit(g, x, y, k) {
  g.fillStyle = k.coat; rr(g, x - 27, y - 62, 54, 70, 18); g.fill(); g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x - .7, y - 50, 1.4, 54);
  g.fillStyle = k.hair; ell(g, x, y - 84, 17, 19); g.fill(); rr(g, x - 17.5, y - 90, 35, 68, 16); g.fill();
  g.strokeStyle = k.hi; g.lineCap = 'round'; for (const [o, w] of [[-8, 2], [1, 1.4], [9, 1.8]]) { g.lineWidth = w; g.beginPath(); g.moveTo(x + o * .6, y - 98); g.bezierCurveTo(x + o + 4, y - 70, x + o - 4, y - 46, x + o, y - 26); g.stroke(); }
}

/* ------------------------------------------------------------------ the painted scenes inside each diorama (origin at the window's top-left) */
function boat(g, w, h, t) {
  let gr = g.createLinearGradient(0, 0, 0, h * .5); gr.addColorStop(0, '#7fb6e6'); gr.addColorStop(1, '#e4f2f6'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.85)'; for (const [x, y, s] of [[.2, .14, 30], [.34, .2, 22], [.74, .12, 34], [.86, .2, 24]]) { ell(g, w * x + Math.sin(t * .2) * 6, h * y, s, s * .42); g.fill(); }
  gr = g.createLinearGradient(0, h * .42, 0, h * .7); gr.addColorStop(0, '#5fa6c2'); gr.addColorStop(1, '#2f7f9c'); g.fillStyle = gr; g.fillRect(0, h * .42, w, h * .3);
  g.fillStyle = 'rgba(255,255,255,.5)'; const r = R(3); for (let i = 0; i < 16; i++) g.fillRect(wrap(r() * w + t * 14, w), h * (.45 + r() * .2), 10 + r() * 16, 1.4);
  g.fillStyle = '#f4f6f8'; g.beginPath(); g.moveTo(0, h * .66); g.quadraticCurveTo(w * .5, h * .6, w, h * .7); g.lineTo(w, h); g.lineTo(0, h); g.fill(); g.fillStyle = 'rgba(120,150,180,.25)'; g.fillRect(0, h * .9, w, h * .1);
  const wv = G.RM ? 0 : Math.sin(t * 7) * .35; g.strokeStyle = JK.skin; g.lineWidth = 11; g.lineCap = 'round'; g.beginPath(); g.moveTo(w * .5 - 44, h * .78); g.lineTo(w * .5 - 70 + Math.sin(wv) * 16, h * .36); g.stroke(); g.fillStyle = JK.skin; g.beginPath(); g.arc(w * .5 - 70 + Math.sin(wv) * 20, h * .3, 10, 0, TAU); g.fill();
  bust(g, w * .5, h * .5, 2.6, JK, { top: '#b9a8e0', joy: true, hair: '#3b2a26', len: 26 });
}
function under(g, w, h, t) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8fe0d2'); gr.addColorStop(1, '#2a8792'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.1)'; for (let i = 0; i < 5; i++) { const x = w * (.1 + i * .2) + Math.sin(t * .5 + i) * 14; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 26, 0); g.lineTo(x + 70, h); g.lineTo(x + 10, h); g.fill(); }
  const r = R(9); g.lineCap = 'round'; for (let i = 0; i < 26; i++) { const x = r() * w, hh = 30 + r() * 60, sw = Math.sin(t * 1.3 + i) * 10 * (G.RM ? .2 : 1); g.strokeStyle = r() < .5 ? '#2c6a5a' : '#3f8a6a'; g.lineWidth = 3 + r() * 3; g.beginPath(); g.moveTo(x, h + 4); g.quadraticCurveTo(x + sw * .4, h - hh * .5, x + sw, h - hh); g.stroke(); }
  for (let i = 0; i < 16; i++) { const x = r() * w, y = wrap(r() * h - t * (14 + r() * 20), h); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(x + Math.sin(t + i) * 3, y, 1.5 + r() * 2.5, 0, TAU); g.stroke(); }
  swimmer(g, wrap(t * 22, w + 240) - 120, h * .3 + Math.sin(t) * 6, .62, t);
}
function maskObj(g) {
  g.fillStyle = '#8a7a5c'; g.fillRect(-2, -30, 4, 30); ell(g, 0, 0, 22, 5); g.fill();
  g.fillStyle = '#f07a2c'; rr(g, -28, -78, 56, 50, 9); g.fill(); g.fillStyle = '#c95a18'; g.fillRect(-2, -78, 4, 50); g.fillStyle = '#d8d4c8'; g.fillRect(-28, -64, 56, 5); g.fillRect(-28, -46, 56, 5); g.fillStyle = '#23262c'; rr(g, -6, -66, 12, 8, 2); g.fill(); rr(g, -6, -48, 12, 8, 2); g.fill();
  g.fillStyle = '#23262c'; rr(g, -24, -112, 48, 24, 9); g.fill(); g.fillStyle = 'rgba(160,210,236,.6)'; rr(g, -20, -108, 18, 16, 5); g.fill(); rr(g, 2, -108, 18, 16, 5); g.fill();
  g.strokeStyle = '#d8e83a'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(26, -94); g.quadraticCurveTo(38, -96, 36, -128); g.stroke(); g.fillStyle = '#23262c'; rr(g, 20, -98, 10, 8, 3); g.fill();
}
function cave(g, w, h, t) {
  let gr = g.createLinearGradient(0, 0, 0, h * .55); gr.addColorStop(0, '#8a7a60'); gr.addColorStop(1, '#3c3428'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = R(21); for (let i = 0; i < 46; i++) { const x = r() * w, l = 14 + r() * 46, ww = 4 + r() * 8; g.fillStyle = r() < .5 ? '#a8987a' : '#6b5f4a'; g.beginPath(); g.moveTo(x - ww, 0); g.lineTo(x, l + (i % 3) * 10); g.lineTo(x + ww, 0); g.fill(); }
  gr = g.createLinearGradient(0, h * .5, 0, h); gr.addColorStop(0, '#0d3d6a'); gr.addColorStop(1, '#082644'); g.fillStyle = gr; g.fillRect(0, h * .5, w, h * .5);
  g.globalCompositeOperation = 'lighter'; glow(g, w * .42, h * .6, 70, '90,220,255', .5 + .15 * Math.sin(t * 1.2)); g.fillStyle = 'rgba(255,250,220,.13)'; g.beginPath(); g.moveTo(w * .7, 0); g.lineTo(w * .86, 0); g.lineTo(w * .6, h); g.lineTo(w * .3, h); g.fill(); g.globalCompositeOperation = 'source-over';
  g.strokeStyle = 'rgba(190,230,255,.35)'; g.lineWidth = 1.4; for (let i = 0; i < 14; i++) { const y = h * (.54 + r() * .44), x = r() * w, l = 14 + r() * 30; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y + Math.sin(t * 2 + i) * 3, x + l, y); g.stroke(); }
  const bx = w * .58, by = h * .7; bust(g, bx - 17, by, 1.25, FK, { top: '#1c1c22', len: 22 }); bust(g, bx + 17, by + 2, 1.25, JK, { top: '#9fb8e8', joy: true, len: 22 });
  g.fillStyle = '#0b2f55'; g.fillRect(bx - 60, by + 24, 120, 40); g.strokeStyle = 'rgba(210,240,255,.6)'; for (let i = 0; i < 3; i++) { const k = wrap(t * .5 + i / 3, 1); g.globalAlpha = 1 - k; g.lineWidth = 1.6; ell(g, bx, by + 26, 34 + k * 46, 7 + k * 9); g.stroke(); } g.globalAlpha = 1;
  g.fillStyle = '#4a3626'; g.beginPath(); g.moveTo(0, h * .84); g.lineTo(w * .44, h); g.lineTo(0, h); g.fill(); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, h * (.84 + i * .04)); g.lineTo(w * (.44 - i * .11), h); g.stroke(); }
}
function swim(g, w, h, t) {
  g.fillStyle = '#0d241f'; g.fillRect(0, 0, w, h); const cx0 = w * .5, cy0 = h * .56;
  for (let i = 0; i < 7; i++) { const k = wrap(t * .22 + i / 7, 1); g.strokeStyle = `rgba(170,220,200,${.4 * (1 - k)})`; g.lineWidth = 2; ell(g, cx0, cy0, 30 + k * w * .55, 12 + k * h * .42); g.stroke(); }
  const r = R(4); for (let i = 0; i < 6; i++) dab(g, w * r() * .4, h * r() * .3, 5, 2.4, r() * 3, r() < .5 ? '#9ac84a' : '#d8a83a', .9); g.globalAlpha = 1;
  G.hair(g, w * .3, h * .44, { len: 44, w: 9, flow: .9, wave: 1, curl: 0, col: '#6a3f28', dark: '#4a2a1c', hi: JK.hi, lo: 'rgba(58,34,22,.5)', t });
  bust(g, w * .36, h * .5, 1.5, JK, { top: '#2a5fc0', up: true, joy: true }); bust(g, w * .66, h * .55, 1.5, FK, { top: '#2a5fc0', len: 20 });
  g.fillStyle = 'rgba(13,36,31,.92)'; g.fillRect(0, h * .5 + 34, w, h); g.strokeStyle = 'rgba(200,240,220,.5)'; g.lineWidth = 1.6; for (const x of [.36, .66]) { ell(g, w * x, h * .5 + 36 + (x > .5 ? 8 : 0), 34, 6); g.stroke(); }
}
function rain(g, w, h, t) {
  g.fillStyle = '#b9c9c0'; g.fillRect(0, 0, w, h); const r = R(12);
  for (let i = 0; i < 70; i++) dab(g, r() * w, h * (.12 + r() * .46), 14 + r() * 22, 12 + r() * 18, 0, ['#3c6a4a', '#4f8058', '#2f5a40', '#6a9a6a'][r() * 4 | 0], .75); g.globalAlpha = 1;
  g.fillStyle = 'rgba(200,214,208,.35)'; g.fillRect(0, 0, w, h * .62);
  g.fillStyle = '#b0463a'; g.fillRect(0, h * .62, w, h * .38); g.fillStyle = 'rgba(255,220,210,.18)'; for (let i = 0; i < 6; i++) { ell(g, r() * w, h * (.7 + r() * .26), 30 + r() * 30, 4); g.fill(); }
  g.font = `800 ${h * .14}px ${UI}`; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; let lx = w * .3; for (const [ch, c] of [['K', '#e8408a'], ['I', '#f08a2c'], ['N', '#e8c83a'], ['-', '#6fb04e'], ['H', '#3f8fd8'], ['A', '#e8408a']]) { g.fillStyle = c; g.fillText(ch, lx, h * .64); lx += g.measureText(ch).width + 3; }
  g.fillStyle = '#3a2a1c'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, h * .1); g.lineTo(0, h * .2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.2; for (let i = 0; i < 60; i++) { const x = r() * (w + 40), y = wrap(r() * h + t * (420 + r() * 200), h + 30) - 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5, y + 22); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 14; i++) { const k = wrap(t * 3 + r(), 1); ell(g, r() * w, h * (.66 + r() * .32), 2 + k * 6, 1 + k * 1.6); g.globalAlpha = 1 - k; g.fill(); } g.globalAlpha = 1;
}
function atvScene(g, w, h, t) {
  let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9fd08a'); gr.addColorStop(1, '#3f7a4a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = R(30);
  for (let i = 0; i < 50; i++) dab(g, r() * w, r() * h * .7, 16 + r() * 26, 12 + r() * 16, r() * 3, ['#2f6a3c', '#4f9a4a', '#6fb85a', '#255a34'][r() * 4 | 0], .6); g.globalAlpha = 1;
  for (const px of [.14, .84]) { g.strokeStyle = '#7a5a3a'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(w * px, h); g.quadraticCurveTo(w * px + 10, h * .5, w * px - 6, h * .18); g.stroke(); for (let i = 0; i < 9; i++) { const a = -Math.PI + i * .4 + Math.sin(t * .8 + i) * .04; g.strokeStyle = i % 2 ? '#3f8a3c' : '#5fae4a'; g.lineWidth = 7; g.beginPath(); g.moveTo(w * px - 6, h * .18); g.quadraticCurveTo(w * px - 6 + Math.cos(a) * 50, h * .18 + Math.sin(a) * 50 - 14, w * px - 6 + Math.cos(a) * 92, h * .18 + Math.sin(a) * 70 + 22); g.stroke(); } }
  g.fillStyle = '#dccba6'; g.beginPath(); g.moveTo(0, h * .72); g.quadraticCurveTo(w * .5, h * .66, w, h * .76); g.lineTo(w, h); g.lineTo(0, h); g.fill();
  for (let i = 0; i < 26; i++) dab(g, r() * w, h * (.74 + r() * .24), 14 + r() * 22, 4 + r() * 5, 0, r() < .6 ? 'rgba(90,80,60,.25)' : 'rgba(255,246,214,.4)', 1); g.globalAlpha = 1;
  g.fillStyle = 'rgba(60,50,40,.3)'; ell(g, w * .5, h * .9, 100, 9); g.fill(); atv(g, w * .5, h * .9, 1.3, t, true);
  if (!G.RM) for (let i = 0; i < 8; i++) { const k = wrap(t * 1.6 + r(), 1); g.fillStyle = `rgba(154,138,104,${.7 * (1 - k)})`; g.beginPath(); g.arc(w * .5 - 70 - k * 50, h * .9 - 10 - Math.sin(k * 3) * 26 * r(), 2 + r() * 3, 0, TAU); g.fill(); }
}
function negroni(g, t) {
  for (const dx of [-25, 25]) {
    g.fillStyle = '#fdfbf4'; ell(g, dx, 0, 22, 5); g.fill(); g.fillStyle = 'rgba(255,255,255,.2)'; rr(g, dx - 17, -40, 34, 40, 5); g.fill();
    g.fillStyle = 'rgba(214,62,40,.9)'; rr(g, dx - 15, -27, 30, 25, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; rr(g, dx - 9, -32, 16, 15, 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.3; rr(g, dx - 17, -40, 34, 40, 5); g.stroke();
    g.save(); g.translate(dx, -42); g.rotate(-.12); g.fillStyle = '#f0d268'; g.beginPath(); g.ellipse(0, 0, 19, 4.6, 0, 0, TAU); g.fill(); g.fillStyle = '#b9944a'; for (let i = -5; i <= 5; i++) g.fillRect(i * 3.2, -1.6 + (i % 2), 1.2, 1.2); g.restore();
  }
  if (!G.RM) { const k = .5 + .5 * Math.sin(t * 2); g.fillStyle = `rgba(255,255,255,${k * .8})`; g.beginPath(); g.arc(-12, -34, 1.6, 0, TAU); g.fill(); }
}
function paleta(g) {
  g.fillStyle = '#e6cf9c'; rr(g, -3, -34, 6, 34, 3); g.fill(); g.fillStyle = '#fdfbf4'; g.beginPath(); g.moveTo(-14, -30); g.lineTo(14, -34); g.lineTo(10, -14); g.lineTo(-8, -12); g.fill();
  const gr = g.createLinearGradient(-16, 0, 16, 0); gr.addColorStop(0, '#f08a3c'); gr.addColorStop(1, '#c8401c'); g.fillStyle = gr; g.beginPath(); g.roundRect(-16, -92, 32, 62, [9, 9, 4, 4]); g.fill();
  const r = R(8); for (let i = 0; i < 22; i++) dab(g, -12 + r() * 24, -86 + r() * 52, 1.6 + r() * 2.6, 1.2 + r() * 2, r() * 3, r() < .45 ? '#f6d05a' : '#8e1e12', .9); g.globalAlpha = 1;
  g.fillStyle = 'rgba(255,255,255,.3)'; rr(g, -12, -86, 4, 46, 2); g.fill();
}
function tacos(g) {
  g.fillStyle = '#e8cdb0'; ell(g, 16, -8, 44, 14); g.fill(); g.fillStyle = '#f2dcc2'; ell(g, 16, -9, 36, 10); g.fill(); g.fillStyle = '#e8c878'; ell(g, 18, -12, 30, 9); g.fill();
  const r = R(15); for (let i = 0; i < 26; i++) dab(g, -4 + r() * 46, -19 + r() * 11, 3 + r() * 4, 1.6 + r() * 2, r() * 3, ['#f08a2c', '#5f9a3c', '#5a3a5c', '#fbf3df', '#d8c070'][r() * 5 | 0], .95); g.globalAlpha = 1;
  g.fillStyle = '#9ac84a'; g.beginPath(); g.arc(-12, -14, 8, Math.PI, 0); g.fill(); g.fillStyle = '#dcf0a0'; g.beginPath(); g.arc(-12, -14, 5.5, Math.PI, 0); g.fill();
  g.fillStyle = '#e8cdb0'; ell(g, -36, -4, 22, 8); g.fill(); for (let i = 0; i < 12; i++) dab(g, -46 + r() * 20, -10 + r() * 6, 5, 3.4, 0, r() < .7 ? '#8fc04a' : '#6fa03a', 1); g.fillStyle = '#d8402c'; g.fillRect(-38, -9, 3, 2.4); g.globalAlpha = 1;
}
function shots(g, t) {
  const tilt = G.RM ? 0 : Math.sin(t * 1.6) * .08;
  for (const [dx, top, bot, rim] of [[-17, '#f4b0c0', '#f09ab0', true], [17, '#b9c88a', '#f4ecc8', false]]) {
    g.save(); g.translate(dx, 0); g.rotate(dx < 0 ? tilt : -tilt);
    g.fillStyle = 'rgba(255,255,255,.2)'; rr(g, -9, -52, 18, 52, 3); g.fill(); g.fillStyle = bot; g.fillRect(-7.5, -24, 15, 20); g.fillStyle = top; g.fillRect(-7.5, -46, 15, 22);
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.3; rr(g, -9, -52, 18, 52, 3); g.stroke();
    if (rim) { g.fillStyle = '#fffdf6'; for (let i = 0; i < 9; i++) g.fillRect(-9 + i * 2.2, -54 + (i % 2), 1.8, 4); }
    g.restore();
  }
  if (!G.RM) { const k = wrap(t * .8, 1); g.strokeStyle = `rgba(255,246,200,${1 - k})`; g.lineWidth = 1.4; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * (4 + k * 6), -58 + Math.sin(a) * (4 + k * 6)); g.lineTo(Math.cos(a) * (8 + k * 12), -58 + Math.sin(a) * (8 + k * 12)); g.stroke(); } }
}
function swingScene(g, w, h, t) {
  let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5a5c94'); gr.addColorStop(.7, '#d89a8c'); gr.addColorStop(1, '#8a7a6a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = R(18);
  g.fillStyle = '#2c2a3a'; g.fillRect(w * .66, h * .5, w * .4, h * .3); g.fillStyle = '#ffd98a'; for (let i = 0; i < 4; i++) g.fillRect(w * (.7 + i * .075), h * .58, 12, 20);
  g.fillStyle = '#b9a98c'; g.fillRect(0, h * .8, w, h * .2);
  g.strokeStyle = '#4a3a2c'; g.lineCap = 'round'; g.lineWidth = 34; g.beginPath(); g.moveTo(w * .2, h); g.quadraticCurveTo(w * .22, h * .5, w * .34, h * .22); g.stroke(); g.lineWidth = 16; g.beginPath(); g.moveTo(w * .3, h * .3); g.quadraticCurveTo(w * .6, h * .1, w * .96, h * .16); g.stroke();
  for (let i = 0; i < 60; i++) { const x = r() * w, y = r() * h * .4, a = r() * TAU; g.strokeStyle = ['#3f7a3c', '#5f9a4a', '#2f5a34', '#8ab04e'][r() * 4 | 0]; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * 16, y + Math.sin(a) * 8 + 8, x + Math.cos(a) * 34, y + Math.sin(a) * 14 + 16); g.stroke(); }
  g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { const x = r() * w, y = r() * h * .46, tw = G.RM ? .8 : .6 + .4 * Math.sin(t * 2.4 + i * 1.9); glow(g, x, y, 13, '255,210,120', .8 * tw); g.fillStyle = `rgba(255,244,200,${tw})`; g.fillRect(x - 1.4, y - 1.4, 2.8, 2.8); } g.globalCompositeOperation = 'source-over';
  const px = w * .62, py = h * .16, a = G.RM ? .05 : Math.sin(t * 1.4) * .13; g.save(); g.translate(px, py); g.rotate(a);
  g.strokeStyle = '#d8d2c4'; g.lineWidth = 3; g.beginPath(); g.moveTo(-30, 0); g.lineTo(-30, h * .62); g.moveTo(30, 0); g.lineTo(30, h * .62); g.stroke();
  g.fillStyle = '#b9cf8a'; rr(g, -38, 8, 76, 54, 3); g.fill(); g.strokeStyle = 'rgba(60,80,30,.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-38, 26); g.lineTo(38, 26); g.moveTo(-38, 44); g.lineTo(38, 44); g.stroke(); g.fillStyle = '#23262c'; g.font = `800 22px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('IKÚ', 0, 36);
  const sy = h * .62; g.strokeStyle = JK.skin; g.lineWidth = 6; g.beginPath(); g.moveTo(-6, sy - 2); g.lineTo(4, sy + 16); g.lineTo(-2, sy + 34); g.moveTo(8, sy - 2); g.lineTo(14, sy + 16); g.lineTo(6, sy + 34); g.stroke();
  g.fillStyle = '#23283a'; rr(g, -15, sy - 12, 30, 14, 5); g.fill(); bust(g, 0, sy - 44, 1.15, JK, { top: '#b99a4c', len: 30 }); g.fillStyle = '#3a2c20'; rr(g, -40, sy, 80, 6, 2); g.fill(); g.restore();
}
function costume(g, t) {
  const turn = G.RM ? 1 : .8 + .2 * Math.cos(t * .8), sw = G.RM ? 0 : Math.sin(t * 1.6) * 5, r = R(26);
  g.fillStyle = BRASS; ell(g, 0, 0, 26, 6); g.fill(); g.fillRect(-2, -70, 4, 70);
  g.save(); g.scale(turn, 1);
  g.beginPath(); g.moveTo(-13, -150); g.bezierCurveTo(-30, -110, -44 + sw, -60, -54 + sw, -28); for (let i = 0; i <= 10; i++) g.lineTo(-54 + sw + i * 11, -28 + (i % 2 ? 7 : 0) - (i > 6 ? (i - 6) * 9 : 0)); g.bezierCurveTo(40 + sw, -90, 24, -120, 13, -150); g.closePath(); g.fillStyle = '#fbf0c8'; g.fill();
  g.save(); g.clip(); for (let i = 0; i < 34; i++) { const x = -56 + r() * 116, y = -146 + r() * 126; dab(g, x, y, 5 + r() * 4, 4.4 + r() * 3, r() * 3, r() < .6 ? '#ee8fa0' : '#f6b8a4', .95); dab(g, x + 1, y, 2, 1.8, 0, '#d8627c', .9); dab(g, x + 7, y + 4, 4.4, 2, r() * 3, '#7aa85a', .9); } g.globalAlpha = 1;
  g.strokeStyle = 'rgba(160,140,90,.35)'; g.lineWidth = 1.2; for (const yy of [-104, -62]) { g.beginPath(); g.moveTo(-60, yy + 8); g.quadraticCurveTo(0, yy - 6, 60, yy + 8); g.stroke(); } g.restore();
  g.fillStyle = '#efe6d2'; g.beginPath(); g.moveTo(-15, -150); g.quadraticCurveTo(-24, -186, -19, -204); g.quadraticCurveTo(0, -214, 19, -204); g.quadraticCurveTo(24, -186, 15, -150); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(150,130,100,.5)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-14, -202); g.lineTo(10, -160); g.moveTo(14, -202); g.lineTo(-6, -176); g.stroke();
  g.fillStyle = '#f6eede'; g.beginPath(); g.moveTo(8, -162); g.lineTo(28 + sw * .6, -150); g.lineTo(22 + sw * .6, -132); g.lineTo(6, -152); g.fill();
  g.fillStyle = '#d8ccb4'; ell(g, 0, -212, 6, 5); g.fill(); g.restore();
}
function show(g, w, h, t) {
  g.fillStyle = '#170c0a'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'lighter'; glow(g, w * .5, h * .72, w * .6, '255,120,30', .7 + .15 * Math.sin(t * 5)); glow(g, w * .3, h * .5, 60, '255,220,160', .5);
  for (let i = 0; i < 5; i++) { const x = w * (.12 + i * .19), a = Math.sin(t * .9 + i * 1.7) * 30; g.fillStyle = 'rgba(255,170,70,.13)'; g.beginPath(); g.moveTo(x - 4, 10); g.lineTo(x + 4, 10); g.lineTo(x + a + 40, h); g.lineTo(x + a - 40, h); g.fill(); g.fillStyle = 'rgba(255,230,180,.9)'; g.beginPath(); g.arc(x, 10, 3.4, 0, TAU); g.fill(); }
  g.globalCompositeOperation = 'source-over'; g.fillStyle = '#0c0706'; g.fillRect(0, 0, w, 8);
  for (let i = 0; i < 3; i++) { const x = w * (.3 + i * .2) + Math.sin(t * 1.2 + i * 2) * 14, y = h * (.3 + (i % 2) * .08); g.strokeStyle = 'rgba(20,10,8,.9)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(w * (.3 + i * .2), 8); g.lineTo(x, y); g.stroke(); g.fillStyle = '#140a08'; g.beginPath(); g.arc(x, y + 5, 4, 0, TAU); g.fill(); g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y + 8); g.lineTo(x + 3, y + 22); g.lineTo(x - 5, y + 34); g.moveTo(x + 3, y + 22); g.lineTo(x + 12, y + 30); g.moveTo(x, y + 10); g.lineTo(x - 10, y + 2); g.stroke(); }
  const r = R(33); for (let i = 0; i < 50; i++) { const x = r() * w + Math.sin(t + i) * 6, y = wrap(r() * h + t * (30 + r() * 50), h); g.fillStyle = r() < .5 ? 'rgba(255,220,120,.9)' : 'rgba(255,150,60,.9)'; g.fillRect(x, y, 2, 2 + r() * 2); }
  g.fillStyle = '#0c0706'; for (let i = 0; i < 16; i++) { const x = i * w / 15 + r() * 8 - 4, y = h - 12 - r() * 12; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); g.fillRect(x - 11, y + 6, 22, 30); if (i % 3 === 0) { g.strokeStyle = '#0c0706'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 8, y + 8); g.lineTo(x + 14, y - 16 - Math.sin(t * 4 + i) * 4); g.stroke(); } }
}
function dawn(g, w, h, t) {
  const b = sm(P.sitT, 0, 3.5), hz = h * .7, ox = w * .44;
  let gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, rgb(mix([52, 72, 128], [108, 146, 204], b))); gr.addColorStop(.7, rgb(mix([112, 136, 190], [176, 204, 232], b))); gr.addColorStop(1, rgb(mix([196, 168, 190], [248, 218, 210], b))); g.fillStyle = gr; g.fillRect(0, 0, w, hz + 1);
  const st = R(2); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${(1 - b) * (.3 + .5 * st()) * (.6 + .4 * Math.sin(t * 2 + i))})`; g.fillRect(st() * w, st() * hz * .7, 1.5, 1.5); }
  for (let i = 0; i < 11; i++) { const a0 = Math.PI * (1.04 + i * .084) + Math.sin(t * .2) * .01, a1 = a0 + Math.PI * .05, L = w * 1.2; g.fillStyle = i % 2 ? `rgba(255,206,214,${.1 + .26 * b})` : `rgba(150,196,244,${.08 + .22 * b})`; g.beginPath(); g.moveTo(ox, hz); g.lineTo(ox + Math.cos(a0) * L, hz + Math.sin(a0) * L); g.lineTo(ox + Math.cos(a1) * L, hz + Math.sin(a1) * L); g.fill(); }
  g.globalCompositeOperation = 'lighter'; glow(g, ox, hz, w * .3, '255,220,200', .2 + .4 * b); g.globalCompositeOperation = 'source-over';
  gr = g.createLinearGradient(0, hz, 0, h * .82); gr.addColorStop(0, '#7fb8b8'); gr.addColorStop(1, '#3f8f98'); g.fillStyle = gr; g.fillRect(0, hz, w, h * .12); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; for (let i = 0; i < 5; i++) { const y = hz + 5 + i * 6; g.beginPath(); for (let x = 0; x <= w; x += 12) g.lineTo(x, y + Math.sin(x * .05 + t * 1.2 + i) * 1.4); g.stroke(); }
  g.fillStyle = '#e6d9c0'; g.fillRect(0, h * .82, w, h * .18);
  for (const [fx, s] of [[.2, .8], [.4, 1], [.58, .82], [.8, 1.05]]) { const x = w * fx, y = h * .84 + s * 10; g.fillStyle = '#4a3428'; g.fillRect(x - 2.5 * s, y - 54 * s, 5 * s, 56 * s); g.fillStyle = '#6f6050'; g.beginPath(); g.moveTo(x, y - 86 * s); g.quadraticCurveTo(x + 40 * s, y - 62 * s, x + 46 * s, y - 44 * s); g.quadraticCurveTo(x, y - 54 * s, x - 46 * s, y - 44 * s); g.quadraticCurveTo(x - 40 * s, y - 62 * s, x, y - 86 * s); g.fill(); g.strokeStyle = 'rgba(40,30,20,.3)'; g.lineWidth = 1; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(x, y - 84 * s); g.lineTo(x + i * 13 * s, y - 46 * s); g.stroke(); } g.fillStyle = '#8a6a58'; rr(g, x + 14 * s, y - 8 * s, 30 * s, 5 * s, 2); g.fill(); rr(g, x - 44 * s, y - 8 * s, 30 * s, 5 * s, 2); g.fill(); }
}

/* ------------------------------------------------------------------ the building */
function plaque(g, e, x, y) {
  g.font = `700 11.5px ${UI}`; g.textBaseline = 'middle'; const text = `No. ${e.no}  ·  ${e.label}`, w = g.measureText(text).width + (e.media === 'clip' ? 36 : 22);
  g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, x - w / 2 + 1.5, y - 9, w, 22, 3); g.fill(); g.fillStyle = seen.has(e.id) ? '#e2cf9a' : BRASS; rr(g, x - w / 2, y - 11, w, 22, 3); g.fill();
  g.fillStyle = '#3a2a1a'; g.textAlign = 'left'; let tx = x - w / 2 + 11; if (e.media === 'clip') { g.beginPath(); g.moveTo(tx, y - 5); g.lineTo(tx + 8, y); g.lineTo(tx, y + 5); g.fill(); tx += 14; } g.fillText(text, tx, y + .5);
}
function ropes(g, x, w) {
  const y = E + 26; g.strokeStyle = '#a8231c'; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - w / 2, y - 40); g.quadraticCurveTo(x, y - 18, x + w / 2, y - 40); g.stroke();
  for (const px of [x - w / 2, x + w / 2]) { g.fillStyle = 'rgba(0,0,0,.25)'; ell(g, px + 2, y + 1, 11, 3.4); g.fill(); g.fillStyle = BRASS; g.fillRect(px - 2, y - 44, 4, 44); ell(g, px, y, 9, 3); g.fill(); g.beginPath(); g.arc(px, y - 46, 4.4, 0, TAU); g.fill(); }
}
function drawExhibit(g, e, x, t) {
  const hall = HBY[e.hall], lit = near === e && !P.seated, pu = .5 + .5 * Math.sin(t * 5);
  if (e.kind === 'case') {
    const gh = e.big ? 250 : 136, top = E - 128 - gh;
    const sp = g.createLinearGradient(0, top - 150, 0, E - 128); sp.addColorStop(0, 'rgba(255,240,200,0)'); sp.addColorStop(1, 'rgba(255,240,200,.2)'); g.fillStyle = sp; g.beginPath(); g.moveTo(x - 12, top - 150); g.lineTo(x + 12, top - 150); g.lineTo(x + 76, E - 128); g.lineTo(x - 76, E - 128); g.fill();
    g.fillStyle = 'rgba(0,0,0,.3)'; ell(g, x + 4, E + 2, 70, 8); g.fill(); const pg = g.createLinearGradient(x - 62, 0, x + 62, 0); pg.addColorStop(0, '#5a4c5c'); pg.addColorStop(1, '#2e2434'); g.fillStyle = pg; rr(g, x - 62, E - 128, 124, 130, 3); g.fill(); g.fillStyle = hall.trim; g.fillRect(x - 66, E - 132, 132, 6);
    g.fillStyle = 'rgba(255,246,220,.1)'; rr(g, x - 58, top, 116, gh, 4); g.fill(); g.globalCompositeOperation = 'lighter'; glow(g, x, E - 170, 80, '255,236,190', .22); g.globalCompositeOperation = 'source-over';
    g.save(); g.translate(x, E - 136); e.obj(g, t); g.restore();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.6; rr(g, x - 58, top, 116, gh, 4); g.stroke(); g.fillStyle = 'rgba(255,255,255,.12)'; rr(g, x - 50, top + 8, 8, gh - 16, 4); g.fill();
    plaque(g, e, x, E - 100);
    if (lit) { g.strokeStyle = `rgba(255,240,190,${.5 + .4 * pu})`; g.lineWidth = 3; rr(g, x - 64 - pu * 3, top - 6 - pu * 3, 128 + pu * 6, gh + 12 + pu * 6, 8); g.stroke(); }
    return;
  }
  const w = e.w, h = e.h, dome = e.kind === 'dome', y = dome ? E - 118 - h : E - DY - h / 2;
  const shape = pad => { if (dome) { g.beginPath(); g.moveTo(x - w / 2 - pad, y + h + pad * .4); g.ellipse(x, y + h, w / 2 + pad, h + pad, 0, Math.PI, 0); g.closePath(); } else arch(g, x - w / 2 - pad, y - pad, w + pad * 2, h + pad * 2, 20 + pad); };
  g.globalCompositeOperation = 'lighter'; glow(g, x, y + h / 2, Math.max(w, h) * .95, '255,236,190', .1); g.globalCompositeOperation = 'source-over';
  g.fillStyle = 'rgba(0,0,0,.3)'; g.save(); g.translate(3, 5); shape(14); g.fill(); g.restore(); g.fillStyle = hall.trim; shape(14); g.fill(); g.fillStyle = '#15100c'; shape(4); g.fill();
  g.save(); shape(0); g.clip(); g.translate(x - w / 2, y); e.scene(g, w, h, t); g.restore();
  g.save(); shape(0); g.clip(); g.fillStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.moveTo(x - w * .42, y); g.lineTo(x - w * .2, y); g.lineTo(x - w * .45, y + h); g.lineTo(x - w * .67, y + h); g.fill(); const ig = g.createLinearGradient(0, y, 0, y + 30); ig.addColorStop(0, 'rgba(0,0,0,.4)'); ig.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = ig; g.fillRect(x - w / 2, y, w, 30); g.restore();
  if (dome) { g.strokeStyle = 'rgba(169,188,238,.35)'; g.lineWidth = 1.2; for (let i = 1; i < 6; i++) { g.beginPath(); g.ellipse(x, y + h, (w / 2) * i / 6, h, 0, Math.PI, 0); g.stroke(); } }
  plaque(g, e, x, y + h + (dome ? 22 : 34));
  if (lit) { g.strokeStyle = `rgba(255,240,190,${.5 + .4 * pu})`; g.lineWidth = 3; shape(19 + pu * 3); g.stroke(); }
}
function drawHall(g, H, i, t) {
  const x0 = Math.max(0, H.x0 - camX), x1 = Math.min(VW, H.x1 - camX); if (x1 <= 0 || x0 >= VW) return;
  const gr = g.createLinearGradient(0, 0, 0, E); gr.addColorStop(0, H.wall[0]); gr.addColorStop(1, H.wall[1]); g.fillStyle = gr; g.fillRect(x0, 0, x1 - x0 + 1, E);
  for (let wx = Math.ceil(H.x0 / 260) * 260; wx < H.x1; wx += 260) { g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(wx - camX - 3, 0, 6, E - 96); }
  const sx = wx => wx - camX, fy = Math.max(96, E - 452);
  /* what makes each hall itself */
  if (H.id === 'rot') {
    const dx = sx(74); g.fillStyle = '#5a3a26'; arch(g, dx - 62, E - 262, 124, 262, 60); g.fill(); g.fillStyle = '#74492e'; arch(g, dx - 54, E - 254, 52, 254, 50); g.fill(); arch(g, dx + 2, E - 254, 52, 254, 50); g.fill(); g.fillStyle = BRASS; g.beginPath(); g.arc(dx - 8, E - 120, 4, 0, TAU); g.arc(dx + 8, E - 120, 4, 0, TAU); g.fill();
    const bx = sx(292), by = E - 340; g.fillStyle = 'rgba(0,0,0,.2)'; rr(g, bx - 82, by + 4, 170, 214, 6); g.fill(); g.fillStyle = '#2c3a34'; rr(g, bx - 86, by, 172, 214, 6); g.fill(); g.strokeStyle = BRASS; g.lineWidth = 2; rr(g, bx - 80, by + 6, 160, 202, 4); g.stroke();
    g.fillStyle = BRASS; g.font = `800 12px ${UI}`; g.textBaseline = 'middle'; spaced(g, 'TODAY IN THE WING', bx, by + 24, 1.4, 'center'); g.font = `600 11.5px ${UI}`; g.fillStyle = '#efe6d2'; HALLS.slice(1).forEach((h2, k) => { g.textAlign = 'left'; g.fillText(`${k + 1}`, bx - 66, by + 52 + k * 25); g.fillText(h2.name.charAt(0) + h2.name.slice(1).toLowerCase(), bx - 46, by + 52 + k * 25); if (STAMPS.includes(h2.id) && EX.some(e => e.hall === h2.id && seen.has(e.id))) { g.fillStyle = '#9fd08a'; g.beginPath(); g.arc(bx + 64, by + 52 + k * 25, 4, 0, TAU); g.fill(); g.fillStyle = '#efe6d2'; } });
    const nx = sx(520), ny = fy - 20; g.strokeStyle = '#6e5a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(nx - 60, 0); g.lineTo(nx - 60, ny); g.moveTo(nx + 60, 0); g.lineTo(nx + 60, ny); g.stroke(); const sw = Math.sin(t * .8) * 2 * (G.RM ? 0 : 1);
    g.fillStyle = '#b8402e'; g.beginPath(); g.moveTo(nx - 70, ny); g.lineTo(nx + 70, ny); g.lineTo(nx + 70 + sw, ny + 190); g.lineTo(nx + sw, ny + 168); g.lineTo(nx - 70 + sw, ny + 190); g.closePath(); g.fill();
    g.fillStyle = '#f2cf62'; g.beginPath(); g.arc(nx, ny + 46, 18, 0, TAU); g.fill(); g.strokeStyle = '#f2cf62'; g.lineWidth = 3; g.lineCap = 'round'; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + t * .1; g.beginPath(); g.moveTo(nx + Math.cos(a) * 24, ny + 46 + Math.sin(a) * 24); g.lineTo(nx + Math.cos(a) * 32, ny + 46 + Math.sin(a) * 32); g.stroke(); }
    g.fillStyle = '#fbf3df'; g.font = `800 23px ${UI}`; g.textBaseline = 'middle'; spaced(g, 'MEXICO', nx, ny + 100, 3, 'center'); g.font = `700 7.5px ${UI}`; spaced(g, 'A PERMANENT COLLECTION', nx, ny + 124, .7, 'center');
    const ax = sx(700); g.fillStyle = 'rgba(0,0,0,.2)'; ell(g, ax + 4, E + 6, 124, 12); g.fill(); g.fillStyle = '#cfc2a8'; rr(g, ax - 116, E - 44, 232, 48, 6); g.fill(); g.fillStyle = '#e6dcc6'; rr(g, ax - 122, E - 52, 244, 12, 4); g.fill();
    g.strokeStyle = '#8a7a5c'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(ax + 30, E - 52); g.lineTo(ax + 44, E - 150); g.stroke();
    g.save(); g.translate(ax - 52, E - 54); g.rotate(-.5); atv(g, 58, 2, 1.25, t, false); g.restore(); plaque(g, { no: '00', label: 'Quad bike, mounted', media: 'photo', id: '_' }, ax, E - 22);
  } else if (H.id === 'sea') {
    g.strokeStyle = 'rgba(140,210,240,.12)'; g.lineWidth = 2; for (let k = 0; k < 9; k++) { g.beginPath(); for (let x = x0; x <= x1; x += 16) g.lineTo(x, 60 + k * (E - 180) / 9 + Math.sin((x + camX) * .02 + t * (.8 + k * .1) + k) * 8); g.stroke(); }
    const mx = sx(1560), my = Math.max(130, E - 418) + Math.sin(t * .9) * 5; g.strokeStyle = 'rgba(220,235,245,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(mx - 70, 0); g.lineTo(mx - 60, my - 8); g.moveTo(mx + 50, 0); g.lineTo(mx + 40, my - 12); g.stroke(); swimmer(g, mx, my, 1.55, t);
  } else if (H.id === 'cen') {
    const r = R(52); for (let wx = H.x0 + 40; wx < H.x1 - 40; wx += 26 + r() * 30) { const l = 16 + r() * 54, ww = 5 + r() * 9; g.fillStyle = r() < .5 ? '#3a5f58' : '#1a3836'; g.beginPath(); g.moveTo(sx(wx) - ww, 0); g.lineTo(sx(wx), l); g.lineTo(sx(wx) + ww, 0); g.fill(); }
    g.globalCompositeOperation = 'lighter'; for (const wx of [2740, 3110]) { glow(g, sx(wx), E - 40, 110, '80,210,240', .1 + .04 * Math.sin(t + wx)); } g.globalCompositeOperation = 'source-over';
  } else if (H.id === 'jun') {
    const r = R(61); for (const wx of [3630, 4290]) { g.fillStyle = '#b5683e'; g.beginPath(); g.moveTo(sx(wx) - 30, E - 56); g.lineTo(sx(wx) + 30, E - 56); g.lineTo(sx(wx) + 22, E + 8); g.lineTo(sx(wx) - 22, E + 8); g.fill(); g.lineCap = 'round'; for (let k = 0; k < 9; k++) { const a = -Math.PI * .95 + k * .36 + Math.sin(t * .7 + k) * .03; g.strokeStyle = k % 2 ? '#3f8a3c' : '#5fae4a'; g.lineWidth = 8; g.beginPath(); g.moveTo(sx(wx), E - 56); g.quadraticCurveTo(sx(wx) + Math.cos(a) * 60, E - 56 + Math.sin(a) * 150, sx(wx) + Math.cos(a) * 120, E - 150 + Math.sin(a) * 110); g.stroke(); } }
    for (let k = 0; k < 16; k++) { const wx = H.x0 + 60 + r() * (H.x1 - H.x0 - 120); g.strokeStyle = 'rgba(30,70,40,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(sx(wx), 0); g.quadraticCurveTo(sx(wx) + 14, 40 + r() * 60, sx(wx) - 6 + Math.sin(t + k) * 4, 90 + r() * 110); g.stroke(); }
  } else if (H.id === 'eve') {
    g.strokeStyle = 'rgba(20,16,30,.6)'; g.lineWidth = 1.2; g.beginPath(); for (let wx = H.x0 + 40; wx < H.x1 - 40; wx += 180) { g.moveTo(sx(wx), fy + 26); g.quadraticCurveTo(sx(wx + 90), fy + 62, sx(wx + 180), fy + 26); } g.stroke();
    g.globalCompositeOperation = 'lighter'; for (let wx = H.x0 + 40, k = 0; wx < H.x1 - 40; wx += 30, k++) { const u = ((wx - H.x0 - 40) % 180) / 180, y = fy + 26 + Math.sin(u * Math.PI) * 18, tw = G.RM ? .8 : .7 + .3 * Math.sin(t * 2.6 + k * 1.3); glow(g, sx(wx), y, 12, '255,206,120', .7 * tw); g.fillStyle = 'rgba(255,244,200,.95)'; g.fillRect(sx(wx) - 1.2, y - 1.2, 2.4, 2.4); }
    for (const [wx, c, wy] of [[6390, '255,80,160', 0], [6650, '80,180,255', 30]]) { glow(g, sx(wx), E - 300 + wy, 60, c, .22); g.fillStyle = `rgba(${c},.85)`; rr(g, sx(wx) - 4, E - 350 + wy, 8, 100, 4); g.fill(); } g.globalCompositeOperation = 'source-over';
  } else if (H.id === 'sky') {
    const st = R(77); for (let k = 0; k < 90; k++) { const wx = H.x0 + st() * (H.x1 - H.x0), y = st() * (E - 120); g.fillStyle = `rgba(255,250,230,${(.3 + .5 * st()) * (.6 + .4 * Math.sin(t * (1 + st() * 2) + k))})`; g.fillRect(sx(wx), y, 1.6, 1.6); }
    const px = sx(7990), py = E - 250; g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, px - 78, py + 4, 160, 104, 5); g.fill(); g.fillStyle = BRASS; rr(g, px - 82, py, 164, 104, 5); g.fill(); g.strokeStyle = 'rgba(60,40,20,.4)'; g.lineWidth = 1.2; rr(g, px - 76, py + 6, 152, 92, 3); g.stroke();
    g.fillStyle = '#3a2a1a'; g.textBaseline = 'middle'; g.font = `700 9px ${UI}`; spaced(g, 'THE MEXICO WING', px, py + 26, 1.4, 'center'); g.font = `italic 600 25px ${DISPLAY}`; g.textAlign = 'center'; g.fillText('for Jana', px, py + 56); g.font = `700 9px ${UI}`; spaced(g, 'WITH LOVE', px, py + 84, 1.6, 'center');
  }
  /* wainscot, and the hall's name lettered high on the wall */
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x0, E - 96, x1 - x0 + 1, 96); g.globalAlpha = .7; g.fillStyle = H.trim; g.fillRect(x0, E - 99, x1 - x0 + 1, 4); g.fillRect(x0, E - 8, x1 - x0 + 1, 8); g.fillRect(x0, 0, x1 - x0 + 1, 10); g.globalAlpha = 1;
  if (i > 0) { g.fillStyle = H.trim; g.font = `800 17px ${UI}`; g.textBaseline = 'middle'; const tw = spaced(g, H.name, sx(H.x0 + 74), fy, 3.2); g.font = `700 9.5px ${UI}`; g.globalAlpha = .75; spaced(g, `MEXICO WING  ·  GALLERY ${i} OF 6`, sx(H.x0 + 74), fy + 22, 1.6); g.fillRect(sx(H.x0 + 74), fy - 16, tw - 3, 1.6); g.globalAlpha = 1; }
}
function drawPier(g, bx) {
  const x = bx - camX; if (x < -60 || x > VW + 60) return; const gr = g.createLinearGradient(x - 36, 0, x + 36, 0); gr.addColorStop(0, '#e2d6bc'); gr.addColorStop(.5, '#cdbf9f'); gr.addColorStop(1, '#a89878'); g.fillStyle = gr; g.fillRect(x - 34, 0, 68, E);
  g.fillStyle = 'rgba(90,70,40,.2)'; for (const o of [-18, 0, 18]) g.fillRect(x + o - 1, 34, 2, E - 100); g.fillStyle = '#e9dfc8'; rr(g, x - 42, 12, 84, 22, 3); g.fill(); rr(g, x - 42, E - 60, 84, 60, 3); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 34, 0, 8, E);
}

/* ------------------------------------------------------------------ play */
function say(text, x, y) { says.push({ text, x: clamp(x, 110, VW - 110), y, life: 2.6 }); }
const hallAt = x => HALLS.find(h => x >= h.x0 && x < h.x1) || HALLS[HALLS.length - 1];
const stamped = () => STAMPS.filter(id => EX.some(e => e.hall === id && seen.has(e.id))).length;
function setStep() {
  const H = hallAt(P.x), i = HALLS.indexOf(H);
  $('xstep').textContent = P.seated ? 'Dawn over the water.' : i === 0 ? 'Welcome to the Mexico wing. Tap or hold ahead of her to walk. Tap an exhibit to look closer.' : `${H.name.charAt(0) + H.name.slice(1).toLowerCase()}. Gallery ${i} of 6.`;
  $('xstamps').textContent = `Ticket stamped ${stamped()} of 6`;
}
const vid = $('xvid'), pic = $('ximg');
function open(e) {
  const before = stamped(); seen.add(e.id); pending = null; target = null; keyDir = 0; P.v = 0;
  $('xno').textContent = `Mexico wing  ·  No. ${e.no}`; $('xtitle').textContent = e.title; $('xtext').textContent = e.text; const photo = e.media === 'photo'; vid.hidden = photo; pic.hidden = !photo;
  if (photo) { pic.alt = e.title; pic.src = `media/mx_${e.id}.jpg`; } else { vid.muted = !G.sound; vid.loop = true; vid.poster = `media/mx_${e.id}.jpg`; vid.src = `media/mx_${e.id}.mp4`; const p = vid.play(); if (p && p.catch) p.catch(() => { /* she can press play herself */ }); }
  $('xview').hidden = false; $('xclose').focus(); tone(660, .1, 'sine', .05);
  if (stamped() > before) { opened = HBY[e.hall].name; }
  setStep();
}
let opened = null;
function closeView() { vid.pause(); vid.removeAttribute('src'); vid.load(); pic.removeAttribute('src'); $('xview').hidden = true; if (opened) { say(`Ticket stamped: ${opened.charAt(0) + opened.slice(1).toLowerCase()}`, P.x - camX, VH - FEET - 210); tone(988, .14, 'sine', .07); tone(1319, .3, 'sine', .06, .09); opened = null; } }
function sit() { if (P.seated) { P.seated = false; P.x = BENCH - 70; $('xsit').textContent = 'Sit down'; } else { P.seated = true; P.sitT = 0; target = null; keyDir = 0; P.v = 0; $('xsit').textContent = 'Stand up'; tone(523, .5, 'sine', .05); tone(784, .7, 'sine', .04, .2); } setStep(); }
function update(dt) {
  const t = G.time; let want = 0;
  if (!P.seated && $('xview').hidden && $('xend').hidden) { if (keyDir) { want = keyDir; target = null; pending = null; } else if (target != null) { const dx = target - P.x; if (Math.abs(dx) < 6) { target = null; if (pending) open(pending); } else want = Math.sign(dx); } }
  P.v = lerp(P.v, want * 158, 1 - Math.exp(-dt * 9)); if (Math.abs(P.v) < 1 && !want) P.v = 0; if (want) P.dir = want;
  P.x = clamp(P.x + P.v * dt, 150, TOTAL - 70); P.phase += Math.abs(P.v) * dt * .064;
  if (P.seated) { P.sitT += dt; if (P.sitT > 5 && !endShown) { endShown = true; $('xend').hidden = false; $('xstay').focus(); [523, 659, 784, 1047].forEach((f, i) => tone(f, .9, 'sine', .05, i * .22)); } }
  const camT = clamp((P.seated ? 7620 - VW / 2 : P.x - VW * (VW < 700 ? .5 : .44 - .1 * P.dir)), 0, TOTAL - VW); camX = camInit ? lerp(camX, camT, 1 - Math.exp(-dt * 3)) : camT; camInit = true;
  near = null; let best = 130; for (const e of EX) { const d = Math.abs(e.x - P.x); if (d < best) { best = d; near = e; } }
  const atBench = Math.abs(P.x - (BENCH - 40)) < 110;
  $('xlook').hidden = !near || P.seated; if (near) $('xlook').textContent = `Look closer: ${near.label}`; $('xsit').hidden = !(atBench || P.seated);
  const H = hallAt(P.x).id + (P.seated ? 's' : ''); if (H !== hallNow) { hallNow = H; setStep(); }
  for (let i = says.length - 1; i >= 0; i--) { const q = says[i]; q.life -= dt; q.y -= 12 * dt; if (q.life <= 0) says.splice(i, 1); }
  const mx = P.seated ? BENCH + 4 : P.x + P.dir * 46 + Math.sin(t * 1.1) * 14, my = P.seated ? VH - FEET - 150 + Math.sin(t * 2) * 4 : VH - FEET - 186 + Math.sin(t * 2.3) * 12;
  moth.x = lerp(moth.x, mx, 1 - Math.exp(-dt * 2.4)); moth.y = lerp(moth.y, my, 1 - Math.exp(-dt * 3));
}
function frame(dt) {
  if (!E) return; update(dt);
  const t = G.time, g = cx; g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  HALLS.forEach((H, i) => drawHall(g, H, i, t));
  for (const e of EX) { const x = e.x - camX, hw = (e.w || 130) / 2 + 60; if (x > -hw && x < VW + hw) drawExhibit(g, e, x, t); }
  for (let i = 1; i < HALLS.length; i++) drawPier(g, HALLS[i].x0);
  /* polished floor: it takes on each hall's colour */
  let gr = g.createLinearGradient(0, E, 0, VH); gr.addColorStop(0, '#d2c5ac'); gr.addColorStop(1, '#a2957c'); g.fillStyle = gr; g.fillRect(0, E, VW, VH - E);
  for (const H of HALLS) { const x0 = Math.max(0, H.x0 - camX), x1 = Math.min(VW, H.x1 - camX); if (x1 > 0 && x0 < VW && H.id !== 'rot') { g.fillStyle = H.wall[1]; g.globalAlpha = .55; g.fillRect(x0, E, x1 - x0 + 1, VH - E); g.globalAlpha = 1; } }
  g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 1.2; for (let wx = Math.floor(camX / 110) * 110 - 220; wx < camX + VW + 330; wx += 110) { const x = wx - camX; g.beginPath(); g.moveTo(x, E); g.lineTo(VW / 2 + (x - VW / 2) * 1.5, VH); g.stroke(); } for (const k of [.2, .48, .8]) { g.beginPath(); g.moveTo(0, E + (VH - E) * k); g.lineTo(VW, E + (VH - E) * k); g.stroke(); }
  gr = g.createLinearGradient(0, E, 0, E + 40); gr.addColorStop(0, 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, E, VW, 40); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, E, VW, 3);
  for (const e of EX) if (e.kind !== 'case') { const x = e.x - camX; if (x > -400 && x < VW + 400) ropes(g, x, e.w + 50); }
  /* the bench under the dome, and whoever is on it */
  const bx = BENCH - camX, by = VH - FEET - 34; if (bx > -200 && bx < VW + 200) {
    g.fillStyle = 'rgba(0,0,0,.25)'; ell(g, bx, VH - FEET + 4, 112, 9); g.fill(); g.fillStyle = '#3a2c20'; g.fillRect(bx - 88, by + 8, 9, 30); g.fillRect(bx + 79, by + 8, 9, 30);
    backSit(g, bx + 40, by, FK); if (P.seated) backSit(g, bx - 40, by, JK);
    g.fillStyle = '#6e4e34'; rr(g, bx - 100, by, 200, 12, 5); g.fill(); g.fillStyle = 'rgba(255,220,170,.3)'; g.fillRect(bx - 96, by + 1, 192, 2);
  }
  if (!P.seated) G.jana(g, P.x - camX, VH - FEET, P.dir, P.phase, Math.abs(P.v) > 6, Math.min(1, Math.abs(P.v) / 60));
  for (const q of says) { g.font = `700 14.5px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(q.text).width + 22; g.globalAlpha = Math.min(1, q.life * 2); g.fillStyle = PAPER; rr(g, q.x - w / 2, q.y - 13, w, 26, 13); g.fill(); g.fillStyle = INK; g.fillText(q.text, q.x, q.y + .5); g.globalAlpha = 1; }
  g.globalCompositeOperation = 'lighter'; glow(g, moth.x - camX, moth.y, 50, '255,214,130', .42 + .1 * Math.sin(t * 6)); g.globalCompositeOperation = 'source-over';
  { const mx = moth.x - camX, f = G.RM ? .6 : Math.abs(Math.sin(t * 17)); g.fillStyle = 'rgba(255,246,214,.94)'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(mx + d * (2 + 4.5 * f), moth.y - 2, 1.6 + 5 * f, 5.4, d * .5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(mx + d * (1.5 + 3 * f), moth.y + 4, 1.2 + 3 * f, 3.4, d * -.4, 0, TAU); g.fill(); } g.fillStyle = '#ffd874'; ell(g, mx, moth.y, 2.2, 4.6); g.fill(); }
  G.paper(g, .4);
}

/* ------------------------------------------------------------------ input and wiring */
const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
const busy = () => !active || !$('xview').hidden || !$('xend').hidden;
function hit(x, y) { const wx = x + camX; return EX.find(e => { if (e.kind === 'case') return Math.abs(wx - e.x) < 70 && y > E - 128 - (e.big ? 250 : 136) && y < E; const top = e.kind === 'dome' ? E - 118 - e.h : E - DY - e.h / 2; return Math.abs(wx - e.x) < e.w / 2 + 14 && y > top - 14 && y < top + e.h + 50; }); }
cv.addEventListener('pointerdown', ev => {
  if (busy() || P.seated) return; const [x, y] = pt(ev), e = hit(x, y);
  if (e) { if (Math.abs(e.x - P.x) < 150) open(e); else { pending = e; target = e.x; } return; }
  down = true; pending = null; target = clamp(x + camX, 150, TOTAL - 70);
});
cv.addEventListener('pointermove', ev => { if (down && !busy() && !P.seated) target = clamp(pt(ev)[0] + camX, 150, TOTAL - 70); });
addEventListener('pointerup', () => { down = false; }); addEventListener('pointercancel', () => { down = false; });
const KEYS = { ArrowRight: 1, d: 1, D: 1, ArrowLeft: -1, a: -1, A: -1 };
addEventListener('keydown', ev => {
  if (!active || ev.metaKey || ev.ctrlKey) return;
  if (ev.key === 'Escape' && !$('xview').hidden) { closeView(); return; }
  if (busy() || (ev.target && ev.target.tagName === 'BUTTON' && !KEYS[ev.key])) return;
  if (KEYS[ev.key] && !P.seated) { keyDir = KEYS[ev.key]; ev.preventDefault(); }
  else if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); if (near && !P.seated) open(near); else if (!$('xsit').hidden) sit(); }
});
addEventListener('keyup', ev => { if (KEYS[ev.key] === keyDir) keyDir = 0; });
const soundLabel = () => { $('xsound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('xsound').setAttribute('aria-pressed', G.sound); };
$('xsound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
$('xleave').addEventListener('click', () => G.go('road', { atDoor: true }));
$('xlook').addEventListener('click', () => { if (near) open(near); });
$('xsit').addEventListener('click', sit);
$('xclose').addEventListener('click', closeView);
$('xview').addEventListener('click', ev => { if (ev.target === $('xview')) closeView(); });
$('xstay').addEventListener('click', () => { $('xend').hidden = true; });
$('xback').addEventListener('click', () => { $('xend').hidden = true; G.go('road', { atDoor: true }); });
vid.addEventListener('error', () => { if (!$('xview').hidden && vid.getAttribute('src')) $('xtext').textContent += ' (This clip is not loaded here.)'; });

G.scenes.mexico = {
  frame, resize: layout,
  enter() { active = true; $('xui').hidden = false; layout(); hallNow = ''; setStep(); soundLabel(); moth.x = P.x + 46; moth.y = VH - FEET - 186; if (document.fonts && document.fonts.load) { document.fonts.load('700 14px Nunito'); document.fonts.load('800 17px Nunito'); document.fonts.load('italic 600 25px Fraunces'); } },
  leave() { active = false; if (!$('xview').hidden) closeView(); $('xend').hidden = true; target = null; keyDir = 0; down = false; P.v = 0; $('xui').hidden = true; },
  debug: { P, EX, seen, open, sit, get E() { return E; }, get DY() { return DY; }, get S() { return S; }, get camX() { return camX; }, set camInit(v) { camInit = v; } }
};
})();
