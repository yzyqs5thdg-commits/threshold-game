/* Spicy Village. Jana and her friend sit across the table from each other: find the things that are always there, order the usual,
   split the ten dumplings half and half in one go, put the sauce straight on, eat, and share the scallion noodles. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, hex, mix, rgb, TAU, R, dab, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif', DISPLAY = '"Fraunces", "Iowan Old Style", Georgia, serif';
const INK = '#2c2a3d', PAPER = '#fbf3df', OKC = '#4c8a3f', MISS = '#b8402e';
const WHO = {
  /* Jana: long wavy brown hair with lighter streaks, the green knit sweater */
  j: { skin: '#f0c7a6', hair: '#573726', hi: 'rgba(196,142,88,.85)', top: ['#2b5f4f', '#1b4034'], collar: '#17382d', brow: '#3b2a22', wave: 1, pants: '#3d4f73', shoe: '#f1ede4' },
  /* her friend: long black hair, the red sweater */
  f: { skin: '#c99a74', hair: '#17141a', hi: 'rgba(96,88,116,.6)', top: ['#b3242e', '#8e1a24'], collar: '#9a1c26', brow: '#231a1c', wave: 0, pants: '#26262e', shoe: '#17161a' }
};
const FIND = [
  { id: 'cat', clue: 'While we wait at Spicy Village: find the gold one that never stops waving.' },
  { id: 'lantern', clue: 'Find something red hanging from the ceiling.' },
  { id: 'tree', clue: 'Find the tree that never comes down.' },
  { id: 'sign', clue: 'Find the sign that sends us to the ATM.' },
  { id: 'vinegar', clue: 'Find the black vinegar.' },
  { id: 'chili', clue: 'Find the chili oil.' }
];
const SLOTS = [[-52, -3], [-31, -16], [-7, -19], [17, -16], [41, -11], [57, 4], [-40, 9], [-15, 2], [9, 7], [33, 13]];
const PLATE = [[-34, -4], [-12, -10], [12, -9], [34, -3], [0, 6]];
let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false;
const fresh = () => ({ phase: 'look', fi: 0, idle: 0, pop: {}, order: 0, arrive: 0, dump: [], line: null, fly: 0, taps: 0, shots: [], act: { j: null, f: null }, queue: 0, fwait: .8, face: { j: { f: 'smile', t: 0 }, f: { f: 'smile', t: 0 } }, slurp: 0, slurping: false, wait: 0, cool: 0 });
let D = fresh();
const parts = [], says = [], moth = { x: 60, y: 200 };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };

/* ------------------------------------------------------------------ the room */
function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S;
  const wide = VW >= 760, cxm = VW / 2, ty = VH - 400, frx = cxm - 68, ftop = ty - (wide ? 146 : 236), half = wide ? 285 : cxm - 96, po = wide ? 172 : 70;
  L = { wide, cxm, ty, tl: cxm - half, tr: cxm + half, jx: cxm - half - (wide ? 58 : 48), fx: cxm + half + (wide ? 58 : 48), hy: ty - 58, seat: ty + 96,
    ps: wide ? .85 : .64, ds: wide ? .88 : .72, br: wide ? 90 : 82, nr: wide ? 64 : 52,
    fridge: { x: frx, w: 136, top: ftop }, cat: { x: frx + 40, y: ftop }, tree: { x: frx + 104, y: ftop },
    sign: { x: wide ? cxm + 360 : VW - 62, y: wide ? ty - 200 : ty - 300 }, name: { x: wide ? cxm - 250 : 96, y: wide ? 110 : 134 },
    lanterns: wide ? [[cxm - 430, 110], [cxm + 210, 84], [cxm + 500, 130]] : [[VW - 168, 70], [VW * .9, 96]],
    pj: { x: cxm - po, y: ty + 70 }, pf: { x: cxm + po, y: ty + 70 }, noodle: { x: cxm, y: ty + (wide ? 120 : 150) }, bowl: { x: cxm, y: ty + 262 },
    vinegar: wide ? { x: cxm + 200, y: ty + 300 } : { x: cxm - 80, y: ty + 388 }, chili: wide ? { x: cxm + 170, y: ty + 384 } : { x: cxm + 74, y: ty + 390 } };
  const key = `${Math.round(VW)}x${Math.round(VH)}`, q = clamp(S * G.DPR, 1, 2.5); if (!SPR || SPR.key !== key) SPR = { key, room: G.spr(VW, VH, drawRoom, q), table: G.spr(VW, VH - ty + 10, drawTable, q) };
  $('dui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function drawRoom(g, w, h) {
  const r = R(888), ty = L.ty, cxm = L.cxm;
  /* wood-panelled wall */
  g.fillStyle = '#c98a45'; g.fillRect(0, 0, w, ty + 12);
  for (let i = 0; i < w * .5; i++) dab(g, r() * w, r() * ty, 8 + r() * 26, 30 + r() * 90, (r() - .5) * .08, r() < .5 ? '#d9a05a' : '#b3742f', .16);
  g.globalAlpha = 1; g.lineCap = 'round';
  for (let i = 0; i < w * 1.3; i++) { const x = r() * w, y = r() * ty, l = 40 + r() * 170; g.strokeStyle = r() < .55 ? 'rgba(140,82,30,.3)' : 'rgba(240,188,112,.3)'; g.lineWidth = .7 + r() * 1.5; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + (r() - .5) * 16, y + l * .3, x + (r() - .5) * 16, y + l * .7, x + (r() - .5) * 8, y + l); g.stroke(); }
  for (let x = 60 + r() * 60; x < w; x += 150 + r() * 80) { const y = 80 + r() * Math.max(10, ty - 240); g.strokeStyle = 'rgba(130,74,26,.3)'; g.lineWidth = 1.3; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(x - k * 7, y + 150); g.bezierCurveTo(x - k * 7, y + 60 - k * 12, x + k * 7, y + 60 - k * 12, x + k * 7, y + 150); g.stroke(); } }
  for (let x = 86; x < w; x += 172) { g.fillStyle = 'rgba(96,52,16,.4)'; g.fillRect(x, 0, 1.6, ty); g.fillStyle = 'rgba(255,214,150,.22)'; g.fillRect(x + 1.6, 0, 1.4, ty); }
  let gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,236,190,0)'); gr.addColorStop(.3, 'rgba(255,236,190,.12)'); gr.addColorStop(.42, 'rgba(255,236,190,0)'); gr.addColorStop(.72, 'rgba(255,236,190,.1)'); gr.addColorStop(.84, 'rgba(255,236,190,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, ty);
  g.fillStyle = '#b3742f'; g.fillRect(0, ty - 128, w, 18); g.fillStyle = 'rgba(255,220,160,.5)'; g.fillRect(0, ty - 128, w, 2.4); g.fillStyle = 'rgba(80,40,10,.3)'; g.fillRect(0, ty - 110, w, 3); g.fillStyle = '#d9b25c'; g.fillRect(0, ty - 121, w, 3);
  /* drop ceiling with a strip light */
  g.fillStyle = '#ece6d6'; g.fillRect(0, 0, w, 52); g.strokeStyle = 'rgba(120,110,90,.3)'; g.lineWidth = 1; for (let x = (cxm % 86) - 86; x < w; x += 86) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 52); g.stroke(); }
  g.beginPath(); g.moveTo(0, 26); g.lineTo(w, 26); g.stroke(); g.fillStyle = 'rgba(70,40,20,.3)'; g.fillRect(0, 52, w, 4);
  g.fillStyle = '#fffdf0'; rr(g, cxm - 122, 4, 158, 20, 3); g.fill();
  gr = g.createLinearGradient(0, 52, 0, 300); gr.addColorStop(0, 'rgba(255,244,210,.22)'); gr.addColorStop(1, 'rgba(255,244,210,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(cxm - 150, 52); g.lineTo(cxm + 70, 52); g.lineTo(cxm + 220, 300); g.lineTo(cxm - 300, 300); g.fill();
  /* the drinks fridge the lucky cat sits on */
  const f = L.fridge, rows = L.wide ? 2 : 3; g.fillStyle = 'rgba(50,25,10,.3)'; g.fillRect(f.x + 6, f.top + 6, f.w, ty - f.top);
  g.fillStyle = '#1c1b20'; rr(g, f.x, f.top, f.w, ty - f.top + 20, 5); g.fill(); g.fillStyle = '#34353c'; g.fillRect(f.x, f.top, f.w, 5);
  g.fillStyle = '#f4f1e6'; rr(g, f.x + 10, f.top + 22, f.w - 20, rows * 46 + 12, 3); g.fill();
  const drinks = ['#e2572c', '#3f8f4a', '#d9a03c', '#3f6fa8', '#c7301c', '#6fa83f', '#e9c15a', '#8a5a34'];
  for (let i = 0; i < rows * 4; i++) { const bx = f.x + 20 + (i % 4) * 27, by = f.top + 34 + ((i / 4) | 0) * 46; g.fillStyle = drinks[i % 8]; rr(g, bx, by + 8, 13, 26, 3); g.fill(); g.fillRect(bx + 4, by, 5, 9); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(bx + 2, by + 16, 9, 6); }
  g.fillStyle = '#6e6f78'; g.fillRect(f.x + f.w - 9, f.top + 30, 3, rows * 40);
  /* tiled floor */
  g.fillStyle = '#d3ccb6'; g.fillRect(0, ty, w, h - ty);
  for (let i = 0; i < w * .5; i++) dab(g, r() * w, ty + r() * (h - ty), 20 + r() * 50, 6 + r() * 12, 0, r() < .5 ? '#e0dac6' : '#bfb8a2', .25);
  g.globalAlpha = 1; g.strokeStyle = 'rgba(110,100,80,.35)'; g.lineWidth = 1.2; for (let y = ty + 44; y < h; y += 58) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } for (let x = (cxm % 58) - 58; x < w; x += 58) { g.beginPath(); g.moveTo(x, ty); g.lineTo(x, h); g.stroke(); }
  g.fillStyle = '#8f5a2a'; g.fillRect(0, ty - 6, w, 12); g.fillStyle = 'rgba(255,220,160,.35)'; g.fillRect(0, ty - 6, w, 2); g.fillStyle = 'rgba(50,25,10,.25)'; g.fillRect(0, ty + 6, w, 4);
}
function drawTable(g, w, h) {
  const r = R(889), tl = L.tl, tr = L.tr, cxm = L.cxm, y0 = 10;
  g.fillStyle = 'rgba(50,30,14,.22)'; rr(g, tl - 12, y0 + 10, tr - tl + 24, h + 20, 16); g.fill();
  g.save(); rr(g, tl, y0 - 4, tr - tl, h + 40, 12); g.clip();
  let gr = g.createLinearGradient(0, y0, 0, h); gr.addColorStop(0, '#ece4cb'); gr.addColorStop(1, '#f6f0dc'); g.fillStyle = gr; g.fillRect(tl, 0, tr - tl, h);
  g.strokeStyle = 'rgba(200,174,84,.5)'; g.lineWidth = 5; for (let y = y0 + 14; y < h + 20; y += 27) { g.beginPath(); for (let x = tl - 10; x <= tr + 10; x += 10) g.lineTo(x, y + Math.sin(x * .09 + y * .4) * 5); g.stroke(); }
  for (let i = 0; i < (tr - tl) * h / 9000; i++) {
    const x = tl + r() * (tr - tl), y = y0 + 16 + r() * (h - 30), col = r() < .6 ? '#9a5a8a' : '#cf93ae';
    g.strokeStyle = 'rgba(80,66,74,.75)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 20, y + 12); g.quadraticCurveTo(x - 6, y + 2, x + 16, y - 8); g.moveTo(x - 4, y + 2); g.lineTo(x + 6, y + 14); g.stroke();
    for (let k = 0; k < 4; k++) dab(g, x - 18 + k * 10 + r() * 4, y + 9 - k * 5 + r() * 4, 4, 2, r() * 3, '#5d4f58', .8);
    for (const [fx, fy, fs] of [[0, 0, 1], [18, -10, .7], [-14, 10, .6]]) { for (let p = 0; p < 5; p++) dab(g, x + fx + Math.cos(p * 1.26) * 5 * fs, y + fy + Math.sin(p * 1.26) * 5 * fs, 4.6 * fs, 3.4 * fs, p, col, .9); dab(g, x + fx, y + fy, 2 * fs, 2 * fs, 0, '#f4e0a0', 1); }
    g.globalAlpha = 1;
  }
  gr = g.createLinearGradient(0, y0, 0, y0 + 30); gr.addColorStop(0, 'rgba(70,40,20,.25)'); gr.addColorStop(1, 'rgba(70,40,20,0)'); g.fillStyle = gr; g.fillRect(tl, y0, tr - tl, 30);
  for (const [x0, x1] of [[tl, tl + 12], [tr, tr - 12]]) { gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(110,90,50,.3)'); gr.addColorStop(1, 'rgba(110,90,50,0)'); g.fillStyle = gr; g.fillRect(Math.min(x0, x1), 0, 12, h); }
  g.restore();
  if (!L.wide) return;
  /* water pitcher and cups; chopsticks in their green sleeves */
  const px = cxm - 200, py = y0 + 350;
  g.fillStyle = 'rgba(60,40,20,.2)'; ell(g, px + 4, py + 2, 44, 9); g.fill();
  g.fillStyle = 'rgba(120,170,220,.5)'; g.beginPath(); g.moveTo(px - 36, py - 104); g.lineTo(px - 32, py); g.lineTo(px + 32, py); g.lineTo(px + 36, py - 104); g.closePath(); g.fill(); g.fillStyle = 'rgba(190,220,245,.55)'; g.fillRect(px - 34, py - 70, 68, 68);
  g.strokeStyle = 'rgba(235,245,255,.9)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(px - 36, py - 104); g.lineTo(px - 32, py); g.lineTo(px + 32, py); g.lineTo(px + 36, py - 104); g.stroke(); g.fillStyle = '#5f9fd8'; rr(g, px - 40, py - 114, 80, 12, 4); g.fill();
  for (let i = 0; i < 3; i++) { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.2; g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(px - 92, py + 20 - i * 7 - 44); g.lineTo(px - 88, py + 20 - i * 7); g.lineTo(px - 56, py + 20 - i * 7); g.lineTo(px - 52, py + 20 - i * 7 - 44); g.closePath(); g.fill(); g.stroke(); }
  for (const [dx, dy, a] of [[0, 0, -.1], [10, 11, -.04]]) { g.save(); g.translate(cxm - 70 + dx, y0 + 366 + dy); g.rotate(a); g.fillStyle = '#f7f4ea'; rr(g, 0, 0, 110, 12, 2); g.fill(); g.fillStyle = '#4f9a54'; g.fillRect(0, 0, 40, 12); g.fillStyle = '#f7f4ea'; for (let k = 0; k < 3; k++) g.fillRect(7 + k * 10, 3, 5.5, 6); g.fillStyle = '#e6cf9c'; g.fillRect(108, 2.5, 24, 3); g.fillRect(108, 7, 24, 3); g.restore(); }
}

/* ------------------------------------------------------------------ things that move */
function lantern(g, x, len, t, k) {
  const a = Math.sin(t * 1.1 + x) * (.03 + .16 * k) * (G.RM ? .2 : 1);
  g.save(); g.translate(x, 52); g.rotate(a); g.strokeStyle = '#7a1c14'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, len - 26); g.stroke(); g.translate(0, len);
  const gr = g.createRadialGradient(-6, -6, 2, 0, 0, 30); gr.addColorStop(0, '#f0624a'); gr.addColorStop(1, '#b3211a'); g.fillStyle = gr; ell(g, 0, 0, 27, 24); g.fill();
  g.strokeStyle = 'rgba(120,20,12,.5)'; g.lineWidth = 1; for (const rx of [9, 19]) { ell(g, 0, 0, rx, 24); g.stroke(); }
  g.fillStyle = '#e2b53c'; rr(g, -11, -29, 22, 7, 2); g.fill(); rr(g, -11, 22, 22, 7, 2); g.fill();
  g.strokeStyle = '#c7301c'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 29); g.lineTo(0, 40); g.stroke(); g.fillStyle = '#e2b53c'; g.beginPath(); g.arc(0, 43, 3.4, 0, TAU); g.fill();
  g.strokeStyle = '#c7301c'; g.lineWidth = 1.2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 1.6, 46); g.lineTo(i * 2.6, 66); g.stroke(); }
  g.restore();
}
function cat(g, x, y, t, k) {
  g.save(); g.translate(x, y);
  const gold = g.createLinearGradient(-26, 0, 26, 0); gold.addColorStop(0, '#f2cf62'); gold.addColorStop(1, '#c99a2c');
  g.fillStyle = gold; ell(g, 0, -24, 25, 26); g.fill(); g.fillStyle = '#fbf3df'; ell(g, 0, -18, 14, 17); g.fill();
  g.save(); g.translate(-20, -44); g.rotate(-.3 + Math.sin(t * (2.2 + k * 9)) * (.28 + .2 * k) * (G.RM ? .3 : 1)); g.fillStyle = gold; rr(g, -8, -34, 16, 38, 8); g.fill(); g.fillStyle = '#fbf3df'; ell(g, 0, -28, 6.5, 5.5); g.fill(); g.restore();
  g.fillStyle = gold; ell(g, 0, -60, 23, 20); g.fill();
  for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * 20, -70); g.lineTo(d * 17, -88); g.lineTo(d * 5, -76); g.fill(); g.fillStyle = '#c7301c'; g.beginPath(); g.moveTo(d * 17, -72); g.lineTo(d * 15.5, -82); g.lineTo(d * 9, -75); g.fill(); g.fillStyle = gold; }
  g.fillStyle = '#fbf3df'; ell(g, 0, -55, 14, 11); g.fill();
  g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.5; g.lineCap = 'round'; for (const d of [-1, 1]) { g.beginPath(); g.arc(d * 9, -62, 4, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.moveTo(d * 12, -54); g.lineTo(d * 24, -56); g.moveTo(d * 12, -51); g.lineTo(d * 23, -49); g.stroke(); }
  g.fillStyle = '#d9534a'; g.beginPath(); g.arc(0, -56, 2, 0, TAU); g.fill(); g.beginPath(); g.arc(0, -52, 3.4, 0, Math.PI); g.stroke();
  g.fillStyle = '#c7301c'; rr(g, -16, -45, 32, 6, 3); g.fill(); g.fillStyle = '#f2cf62'; g.beginPath(); g.arc(0, -38, 4.4, 0, TAU); g.fill();
  g.fillStyle = '#e2b53c'; rr(g, 6, -34, 18, 30, 6); g.fill(); g.strokeStyle = '#9a7420'; g.lineWidth = 1; rr(g, 9, -30, 12, 22, 3); g.stroke();
  g.fillStyle = gold; ell(g, -12, -2, 9, 5); g.fill(); ell(g, 12, -2, 9, 5); g.fill();
  g.restore();
}
function tree(g, x, y, t, k) {
  g.fillStyle = '#7a4a2a'; rr(g, x - 9, y - 12, 18, 12, 2); g.fill();
  for (let i = 0; i < 4; i++) { const w = 30 - i * 6, yy = y - 12 - i * 19; g.fillStyle = i % 2 ? '#2f6a3c' : '#255a34'; g.beginPath(); g.moveTo(x - w, yy); g.lineTo(x, yy - 30); g.lineTo(x + w, yy); g.closePath(); g.fill(); }
  const r = R(14), cols = ['255,90,80', '90,170,255', '255,210,90', '120,230,130', '255,140,220'];
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) { const row = r() * 4 | 0, w = (30 - row * 6) * (r() - .5) * 1.5, yy = y - 16 - row * 19 - r() * 14, tw = G.RM ? .7 : .5 + .5 * Math.sin(t * (2 + k * 12) + i * 2.4); glow(g, x + w, yy, 7 + k * 6, cols[i % 5], (.5 + .5 * k) * tw); g.fillStyle = `rgba(${cols[i % 5]},${.6 + .4 * tw})`; g.fillRect(x + w - 1.2, yy - 1.2, 2.4, 2.4); }
  g.globalCompositeOperation = 'source-over';
}
function sign(g, x, y, k, t) {
  g.save(); g.translate(x, y); g.rotate(.05 + Math.sin(t * 30) * .05 * k);
  g.fillStyle = 'rgba(60,30,10,.25)'; g.fillRect(-49, -31, 102, 66); g.fillStyle = '#c5e6da'; g.fillRect(-52, -34, 102, 66);
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-20, -40, 38, 11);
  g.fillStyle = '#243a44'; g.font = `800 19px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CASH', -1, -10); g.fillText('ONLY', -1, 13);
  g.restore();
}
function nameBoard(g, x, y) {
  g.fillStyle = 'rgba(60,30,10,.3)'; rr(g, x - 83, y - 19, 170, 44, 6); g.fill(); g.fillStyle = '#a8231c'; rr(g, x - 86, y - 22, 172, 44, 6); g.fill();
  g.strokeStyle = '#e9c15a'; g.lineWidth = 1.6; rr(g, x - 81, y - 17, 162, 34, 4); g.stroke();
  g.fillStyle = '#fbf3df'; g.font = `800 15px ${UI}`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const text = 'SPICY VILLAGE'; let w = 0; for (const ch of text) w += g.measureText(ch).width + 1.8; let lx = x - w / 2 + .9; for (const ch of text) { g.fillText(ch, lx, y + .5); lx += g.measureText(ch).width + 1.8; }
}
function bowl(g, x, y, rx) {
  const ry = rx * .46;
  g.fillStyle = 'rgba(60,40,20,.25)'; ell(g, x + 5, y + ry * 1.5, rx * .86, ry * .5); g.fill();
  g.fillStyle = '#17161a'; g.beginPath(); g.moveTo(x - rx, y); g.bezierCurveTo(x - rx, y + ry * 1.4, x - rx * .5, y + ry * 1.9, x - rx * .34, y + ry * 1.9); g.lineTo(x + rx * .34, y + ry * 1.9); g.bezierCurveTo(x + rx * .5, y + ry * 1.9, x + rx, y + ry * 1.4, x + rx, y); g.closePath(); g.fill();
  g.fillStyle = '#26252b'; ell(g, x, y, rx, ry); g.fill(); g.fillStyle = '#0f0f12'; ell(g, x, y + 2, rx - 6, ry - 4); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1.6; ell(g, x, y, rx - 2, ry - 1.4, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
}
function plate(g, p) {
  g.save(); g.translate(p.x, p.y); g.scale(L.ps, L.ps);
  g.fillStyle = 'rgba(60,40,20,.2)'; ell(g, 3, 4, 76, 27); g.fill(); g.fillStyle = '#fdfbf4'; ell(g, 0, 0, 76, 27); g.fill();
  g.strokeStyle = 'rgba(160,150,130,.4)'; g.lineWidth = 1.2; ell(g, 0, 0, 58, 19); g.stroke(); for (let i = 0; i < 22; i++) { const a = i / 22 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 61, Math.sin(a) * 20.5); g.lineTo(Math.cos(a) * 73, Math.sin(a) * 25.5); g.stroke(); }
  g.restore();
}
function dumpling(g, x, y, rot, vin, chi, top, sc = 1) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
  const body = () => { g.beginPath(); g.moveTo(-20, 3); g.bezierCurveTo(-18, -14, 18, -14, 20, 3); g.bezierCurveTo(12, 11, -12, 11, -20, 3); g.closePath(); };
  const gr = g.createLinearGradient(0, -12, 0, 10); gr.addColorStop(0, '#fbf2dc'); gr.addColorStop(1, '#e2cfa6'); g.fillStyle = gr; body(); g.fill();
  g.strokeStyle = 'rgba(150,120,70,.55)'; g.lineWidth = 1.1; g.lineCap = 'round'; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 5, -9 + Math.abs(i) * 1.2); g.lineTo(i * 5.6, -3 + Math.abs(i)); g.stroke(); }
  if (vin > 0 || chi > 0) {
    g.save(); body(); g.clip();
    if (vin > 0) { g.strokeStyle = `rgba(42,24,18,${.75 * vin})`; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-18, -2); g.bezierCurveTo(-8, -8, -4, 6, 4, -3); g.bezierCurveTo(9, -8, 13, 5, 19, 0); g.stroke(); g.fillStyle = `rgba(42,24,18,${.35 * vin})`; g.fillRect(-22, 3, 44, 10); }
    if (chi > 0) { g.fillStyle = `rgba(200,52,24,${.5 * chi})`; ell(g, 2, 0, 15, 6); g.fill(); for (const [fx, fy] of [[-11, -3], [-4, 2], [3, -4], [9, 1], [14, -2], [-14, 3], [0, -1]]) { g.fillStyle = `rgba(${fx % 2 ? '122,26,14' : '226,96,36'},${chi})`; g.fillRect(fx, fy, 2.4, 1.8); } }
    g.restore();
  }
  if (top) { for (const [fx, fy, c] of [[-8, -4, '#8e3a1c'], [3, -6, '#a8461e'], [10, -2, '#7a2a14'], [-2, -1, '#4f9a44'], [6, -8, '#6fb04e'], [-11, -7, '#4f9a44']]) { g.fillStyle = c; g.fillRect(fx, fy, 3.4, 2.6); } }
  g.restore();
}
function person(g, who, t) {
  const k = WHO[who], d = who === 'j' ? 1 : -1, x = who === 'j' ? L.jx : L.fx, hy = L.hy, seat = L.seat, fl = seat + 84, f = D.face[who].f, blink = !G.RM && ((t + (who === 'j' ? 1.3 : 0)) % 3.7) < .12, wv = k.wave ? 1 : 0;
  g.save(); g.translate(x, 0); g.scale(d, 1); g.lineCap = 'round'; g.lineJoin = 'round';
  /* chair */
  g.fillStyle = '#74281e'; rr(g, -57, hy + 34, 11, fl - hy - 34, 4); g.fill(); rr(g, 26, seat + 6, 9, fl - seat - 6, 3); g.fill();
  g.fillStyle = '#8a2d22'; rr(g, -60, seat, 98, 12, 5); g.fill(); rr(g, -60, hy + 28, 15, 74, 6); g.fill(); g.fillStyle = 'rgba(255,190,150,.2)'; g.fillRect(-58, seat + 1, 94, 2);
  /* shin and shoe, mostly under the table */
  g.fillStyle = k.pants; rr(g, 44, seat - 14, 22, fl - seat + 6, 9); g.fill(); g.fillStyle = k.shoe; rr(g, 42, fl - 10, 38, 12, 6); g.fill();
  /* long hair down her back */
  g.fillStyle = k.hair; g.beginPath(); g.moveTo(-2, hy - 33); g.bezierCurveTo(-40, hy - 36, -46, hy + 8, -38 - wv * 6, hy + 46); g.bezierCurveTo(-30 + wv * 4, hy + 74, -50 - wv * 4, hy + 100, -38, hy + 130);
  g.lineTo(-10, hy + 126); g.bezierCurveTo(-18, hy + 90, -6, hy + 60, -12, hy + 18); g.closePath(); g.fill();
  for (const [o, w] of [[-8, 2.2], [-17, 1.6]]) { g.strokeStyle = k.hi; g.lineWidth = w; g.beginPath(); g.moveTo(-20 + o * .4, hy - 14); g.bezierCurveTo(-34 + o * .3 - wv * 4, hy + 30, -22 + o + wv * 6, hy + 70, -26 + o * .6 - wv * 3, hy + 122); g.stroke(); }
  g.fillStyle = k.pants; rr(g, -22, seat - 26, 90, 28, 14); g.fill();
  /* sweater */
  const sw = g.createLinearGradient(-30, 0, 28, 0); sw.addColorStop(0, k.top[1]); sw.addColorStop(1, k.top[0]); g.fillStyle = sw;
  g.beginPath(); g.moveTo(-26, seat + 2); g.quadraticCurveTo(-34, hy + 90, -24, hy + 52); g.quadraticCurveTo(-14, hy + 36, 4, hy + 38); g.quadraticCurveTo(24, hy + 44, 26, hy + 74); g.quadraticCurveTo(28, seat - 30, 22, seat + 2); g.closePath(); g.fill();
  if (who === 'j') { g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-18 + i * 12, hy + 60); g.lineTo(-22 + i * 12, seat - 6); g.stroke(); } }
  g.fillStyle = k.skin; g.fillRect(-5, hy + 22, 15, 22); g.fillStyle = k.collar; ell(g, 3, hy + 41, 15, 6); g.fill();
  if (who === 'j') { g.strokeStyle = '#e9c15a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-3, hy + 36); g.quadraticCurveTo(8, hy + 46, 14, hy + 38); g.stroke(); }
  /* head in profile */
  g.fillStyle = k.skin; g.beginPath(); g.arc(2, hy, 30, 0, TAU); g.fill(); g.beginPath(); g.moveTo(29, hy - 4); g.quadraticCurveTo(39, hy + 6, 30, hy + 10); g.fill();
  g.fillStyle = k.hair; g.beginPath(); g.moveTo(25, hy - 18); g.quadraticCurveTo(8, hy - 41, -14, hy - 31); g.quadraticCurveTo(-37, hy - 12, -30, hy + 24); g.lineTo(-12, hy + 24); g.quadraticCurveTo(-16, hy - 4, 2, hy - 14); g.quadraticCurveTo(14, hy - 20, 25, hy - 18); g.fill();
  g.strokeStyle = k.hair; g.lineWidth = 11; g.beginPath(); g.moveTo(-8, hy - 6); if (wv) { g.bezierCurveTo(0, hy + 24, -18, hy + 46, -6, hy + 72); g.quadraticCurveTo(2, hy + 90, -8, hy + 106); } else g.bezierCurveTo(-10, hy + 30, -7, hy + 70, -9, hy + 106); g.stroke();
  g.strokeStyle = k.hi; g.lineWidth = 2; g.beginPath(); g.moveTo(-5, hy - 4); if (wv) { g.bezierCurveTo(3, hy + 24, -15, hy + 46, -3, hy + 72); g.quadraticCurveTo(5, hy + 90, -5, hy + 104); } else g.bezierCurveTo(-7, hy + 30, -4, hy + 70, -6, hy + 104); g.stroke();
  if (who === 'j') { g.fillStyle = '#e9c15a'; g.beginPath(); g.arc(1, hy + 21, 3.4, 0, TAU); g.fill(); } else { g.strokeStyle = '#e9c15a'; g.lineWidth = 2; g.beginPath(); g.arc(1, hy + 23, 4.6, 0, TAU); g.stroke(); }
  g.strokeStyle = k.brow; g.lineWidth = who === 'j' ? 2.8 : 2.4; g.beginPath(); g.moveTo(10, hy - 12); g.quadraticCurveTo(17, hy - 16, 24, hy - 11); g.stroke();
  if (f !== 'smile' || blink) { g.strokeStyle = '#231a1c'; g.lineWidth = 2.2; g.beginPath(); g.arc(17, hy, 5, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
  else { g.fillStyle = who === 'j' ? '#4a2c1c' : '#2b1c18'; ell(g, 18, hy - 3, 3.4, 4.6); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(19.2, hy - 4.6, 1.2, 0, TAU); g.fill(); }
  g.fillStyle = `rgba(224,104,98,${f === 'yum' ? .5 : .3})`; ell(g, 11, hy + 11, f === 'yum' ? 10 : 7, f === 'yum' ? 6.4 : 4.4); g.fill();
  const lip = who === 'j' ? '#c4606a' : '#8e3a3a';
  if (f === 'laugh') { g.fillStyle = '#7a1c24'; g.beginPath(); g.moveTo(15, hy + 12); g.quadraticCurveTo(22, hy + 27, 30, hy + 11); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(18, hy + 12, 10, 2.6); }
  else { g.strokeStyle = lip; g.lineWidth = 2.2; g.beginPath(); g.moveTo(17, hy + 15); g.quadraticCurveTo(23, hy + 20, 29, hy + 13); g.stroke(); }
  g.restore();
}
/* where each of them is holding her chopsticks, and what is on them */
function tip(who, t) {
  const d = who === 'j' ? 1 : -1, x = who === 'j' ? L.jx : L.fx, pl = who === 'j' ? L.pj : L.pf, rest = [pl.x - d * 8, pl.y - 36], mouth = [x + d * 32, L.hy + 14], a = D.act[who];
  if (D.phase === 'noodles' && D.slurping) { const u = G.RM ? .5 : .5 + .5 * Math.sin(t * 4.2 + (who === 'f' ? 1.6 : 0)), from = [L.noodle.x - d * 22, L.noodle.y - 12]; return { p: [lerp(from[0], mouth[0], u), lerp(from[1], mouth[1], u)], carry: 'noodles', up: u, d, x }; }
  if (!a) return { p: rest, carry: null, up: 0, d, x };
  const dd = D.dump[a.i], from = [pl.x + dd.px, pl.y + dd.py - 6]; let p, carry = null, up = 0;
  if (a.t < .22) { const k = sm(a.t, 0, .22); p = [lerp(rest[0], from[0], k), lerp(rest[1], from[1], k)]; }
  else if (a.t < .75) { up = sm(a.t, .27, .75); p = [lerp(from[0], mouth[0], up), lerp(from[1], mouth[1], up)]; carry = a.i; }
  else { up = 1 - sm(a.t, .75, 1); p = [lerp(rest[0], mouth[0], up), lerp(rest[1], mouth[1], up)]; }
  return { p, carry, up, d, x };
}
function sticks(g, x, y, fx, fy) { g.lineCap = 'round'; for (const o of [-3.2, 3.2]) { g.strokeStyle = '#b89a62'; g.lineWidth = 4.6; g.beginPath(); g.moveTo(fx + o * 2, fy); g.lineTo(x + o * .5, y); g.stroke(); g.strokeStyle = '#ecd8a8'; g.lineWidth = 3; g.stroke(); } }
function arm(g, who, t) {
  const k = WHO[who], T = tip(who, t), d = T.d, up = T.up, hx = T.p[0] + lerp(-d * 22, d * 8, up), hyy = T.p[1] + lerp(-26, 22, up), sx = T.x + d * 6, sy = L.hy + 62;
  if (T.carry === 'noodles') { g.lineCap = 'round'; for (let i = 0; i < 5; i++) { const o = (i - 2) * 4; for (const pass of [0, 1]) { g.strokeStyle = pass ? '#f3dea0' : '#b9944a'; g.lineWidth = pass ? 2.4 : 4; g.beginPath(); g.moveTo(L.noodle.x - d * 16 + o * 2, L.noodle.y + 2); g.bezierCurveTo(L.noodle.x - d * 16 + o * 2 + Math.sin(t * 11 + i) * 6, L.noodle.y - 40, T.p[0] + o + Math.sin(t * 9 + i * 2) * 5, T.p[1] + 50, T.p[0] + o * .4, T.p[1]); g.stroke(); } } }
  g.lineCap = 'round'; g.strokeStyle = k.top[0]; g.lineWidth = 20; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo((sx + hx) / 2 - d * 6, Math.max(sy, hyy) + 34, hx, hyy); g.stroke();
  sticks(g, T.p[0], T.p[1], hx + (hx - T.p[0]) * .5, hyy + (hyy - T.p[1]) * .5);
  if (typeof T.carry === 'number') { const dd = D.dump[T.carry]; dumpling(g, T.p[0], T.p[1] + 3, dd.rot, dd.vin, dd.chi, true, L.ds + .08); }
  g.fillStyle = k.skin; g.beginPath(); g.arc(hx, hyy, 10, 0, TAU); g.fill();
}

/* ------------------------------------------------------------------ play */
function say(text, x, y, col = INK) { says.push({ text, x: clamp(x, 100, VW - 100), y, life: 2.4, col }); }
function burst(x, y, cols, n) { if (G.RM) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 30 + Math.random() * 110; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: .7, c: cols[Math.random() * cols.length | 0], s: 1.5 + Math.random() * 2.2 }); } }
function face(who, f, d = 1.3) { D.face[who].f = f; D.face[who].t = d; }
const mine = who => D.dump.filter(d => d.owner === who && d.state === 'plate');
function setStep() {
  const p = D.phase;
  $('dstep').textContent = p === 'look' ? FIND[D.fi].clue : p === 'order' ? 'The usual: scallion dumplings and scallion noodles.'
    : p === 'split' ? 'Ten dumplings, half and half. Draw one line across the bowl with five on each side.' : p === 'fly' ? 'Five each, in one go.'
    : p === 'sauce' ? 'Sauce goes straight on. Tap the black vinegar and the chili oil.' : p === 'eat' ? `Tap your dumplings to eat them. ${mine('j').length + (D.act.j ? 1 : 0)} left.`
    : p === 'noodles' ? 'Now the scallion noodles. Hold the bowl and you both slurp.' : 'All gone.';
  $('dnext').hidden = !(p === 'sauce' && D.taps >= 2);
}
function spot(id) {
  if (id === 'cat') return [L.cat.x, L.cat.y - 44, 34, 50]; if (id === 'tree') return [L.tree.x, L.tree.y - 46, 34, 52];
  if (id === 'lantern') return [L.lanterns[0][0], 52 + L.lanterns[0][1], 36, 44]; if (id === 'sign') return [L.sign.x, L.sign.y, 58, 40];
  if (id === 'vinegar') return [L.vinegar.x, L.vinegar.y - 44, 30, 54]; return [L.chili.x, L.chili.y - 28, 34, 38];
}
function found() {
  const id = FIND[D.fi].id, [x, y] = spot(id); D.pop[id] = 1; D.idle = 0; burst(x, y, ['#fff6da', '#ffd27a', '#f7a8c4'], 16);
  tone(988, .14, 'sine', .07); tone(1319, .3, 'sine', .06, .09); if (id === 'cat') tone(2637, .5, 'sine', .04, .2);
  if (++D.fi >= FIND.length) { D.phase = 'order'; D.order = 0; face('j', 'yum', 2); face('f', 'yum', 2); }
  setStep();
}
/* how many dumplings fall on each side of the line she is drawing */
function sides(l) { let a = 0, b = 0; for (const d of D.dump) { const c = (l.x1 - l.x0) * (L.bowl.y + d.sy - l.y0) - (l.y1 - l.y0) * (L.bowl.x + d.sx - l.x0); d.side = c > 0; if (c > 0) a++; else b++; } return [a, b]; }
function split(l) {
  const [a, b] = sides(l);
  if (a !== 5) { say(`That's ${Math.max(a, b)} and ${Math.min(a, b)}. Half and half.`, L.bowl.x, L.bowl.y - 76, MISS); tone(300, .08, 'triangle', .05); return; }
  const cxs = s => D.dump.filter(d => d.side === s).reduce((n, d) => n + d.sx - d.sy * .3, 0), jSide = cxs(true) < cxs(false);
  let nj = 0, nf = 0; for (const d of D.dump) { d.owner = d.side === jSide ? 'j' : 'f'; const s = PLATE[d.owner === 'j' ? nj++ : nf++]; d.px = s[0] * L.ps; d.py = s[1] * L.ps; d.state = 'fly'; }
  D.phase = 'fly'; D.fly = 0; tone(988, .14, 'sine', .07); tone(1319, .3, 'sine', .06, .09); setStep();
}
function autoSplit() { const l = { x0: L.bowl.x - 100, y0: L.bowl.y - 4, x1: L.bowl.x + 100, y1: L.bowl.y - 4 }; for (let k = 0; k < 40 && sides(l)[0] !== 5; k++) { l.y0 += (k % 2 ? 1 : -1) * k * .8; l.y1 -= (k % 2 ? 1 : -1) * k * .5; } split(l); }
function addSauce(k) {
  if (D.taps >= 6) { say("That's plenty.", L.cxm, L.pj.y - 50); return; }
  D.taps++; const from = k === 'v' ? L.vinegar : L.chili, x0 = from.x - (k === 'v' ? 4 : 0), y0 = from.y - (k === 'v' ? 92 : 50);
  D.shots.push({ k, t: 0, x0, y0, to: 'j' }, { k, t: -.5, x0, y0, to: 'f' }); D.pop[k === 'v' ? 'vinegar' : 'chili'] = 1;
  if (k === 'v') tone(520, .16, 'sine', .05, 0, .5); else tone(300, .08, 'triangle', .05); setStep();
}
function take(who) { const d = mine(who)[0]; if (!d || D.act[who]) return false; d.state = 'lift'; D.act[who] = { i: D.dump.indexOf(d), t: 0, done: false }; return true; }
function finish() { $('ddone').hidden = false; $('dagain').focus(); [784, 988, 1175, 1568].forEach((f, i) => tone(f, .5, 'sine', .07, i * .13)); }
function update(dt) {
  const t = G.time, p = D.phase;
  for (const k in D.pop) D.pop[k] = Math.max(0, D.pop[k] - dt * .9);
  for (const w of ['j', 'f']) if (D.face[w].t > 0) { D.face[w].t -= dt; if (D.face[w].t <= 0) D.face[w].f = 'smile'; }
  D.cool -= dt;
  if (p === 'look') D.idle += dt;
  if (p === 'order') { D.order += dt; if (D.order > 2.6) { D.arrive = Math.min(1, D.arrive + dt * 1.6); if (D.arrive >= 1) { D.dump = SLOTS.map(([sx, sy], i) => ({ sx: sx * L.br / 90, sy: sy * L.br / 90, state: 'bowl', owner: null, px: 0, py: 0, vin: 0, chi: 0, rot: (R(i + 3)() - .5) * .9 })); D.phase = 'split'; setStep(); tone(1568, .4, 'sine', .06); } } }
  if (p === 'fly') { D.fly = Math.min(1, D.fly + dt / (G.RM ? .5 : 1.5)); if (D.fly >= 1) { for (const d of D.dump) d.state = 'plate'; D.phase = 'sauce'; face('j', 'yum'); face('f', 'yum'); tone(240, .1, 'sine', .07); setStep(); } }
  for (let i = D.shots.length - 1; i >= 0; i--) { const s = D.shots[i]; s.t += dt / .42; if (s.t >= 1) { D.shots.splice(i, 1); const pl = s.to === 'j' ? L.pj : L.pf; for (const d of D.dump) if (d.owner === s.to) { if (s.k === 'v') d.vin = Math.min(1, d.vin + .4); else d.chi = Math.min(1, d.chi + .4); } burst(pl.x, pl.y, [s.k === 'v' ? '#2a1812' : '#c8341a'], 7); tone(240, .08, 'sine', .05, 0, .7); } }
  if (p === 'eat') {
    if (D.queue > 0 && !D.act.j) { if (take('j')) D.queue--; else D.queue = 0; }
    if (!D.act.f) { D.fwait -= dt; if (D.fwait <= 0 && take('f')) D.fwait = .5 + Math.random() * .5; }
    for (const w of ['j', 'f']) { const a = D.act[w]; if (!a) continue; a.t += dt / 1.15;
      if (a.t >= .75 && !a.done) { a.done = true; D.dump[a.i].state = 'eaten'; face(w, 'yum', 1.1); tone(w === 'j' ? 330 : 294, .07, 'sine', .07); tone(w === 'j' ? 262 : 233, .09, 'sine', .07, .08); if (w === 'j') { say(['Mmm.', 'So good.', 'One more.', 'Yes.', 'Last one.'][Math.min(4, 4 - mine('j').length)], L.jx + 40, L.hy - 62); setStep(); } }
      if (a.t >= 1) D.act[w] = null; }
    if (!D.act.j && !D.act.f && D.dump.every(d => d.state === 'eaten')) { D.phase = 'noodles'; setStep(); }
  }
  if (p === 'noodles' && D.slurping) { D.slurp = Math.min(1, D.slurp + dt / 3.6); if (!G.RM && Math.random() < dt * 9) tone(300 + D.slurp * 300 + Math.random() * 80, .12, 'sine', .03, 0, 1.6); if (D.slurp >= 1) { D.slurping = false; D.phase = 'done'; D.wait = 1.6; setStep(); face('j', 'yum', 3); face('f', 'laugh', 3); } }
  if (p === 'done' && D.wait > 0) { D.wait -= dt; if (D.wait <= 0) finish(); }
  for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= dt; q.vy += 300 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) parts.splice(i, 1); }
  for (let i = says.length - 1; i >= 0; i--) { const q = says[i]; q.life -= dt; q.y -= 12 * dt; if (q.life <= 0) says.splice(i, 1); }
  moth.x = lerp(moth.x, (L.wide ? L.cxm + 120 : L.cxm - 80) + Math.sin(t * .8) * 12, 1 - Math.exp(-dt * 2)); moth.y = lerp(moth.y, L.ty - (L.wide ? 60 : 30) + Math.sin(t * 2.1) * 10, 1 - Math.exp(-dt * 2));
}
function tag(g, text, x, y, a, col = INK) {
  g.font = `700 14.5px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(text).width + 20; g.globalAlpha = a;
  g.fillStyle = 'rgba(40,22,12,.25)'; rr(g, x - w / 2 + 1.5, y - 10.5, w, 25, 12.5); g.fill(); g.fillStyle = PAPER; rr(g, x - w / 2, y - 12.5, w, 25, 12.5); g.fill(); g.fillStyle = col; g.fillText(text, x, y + .5); g.globalAlpha = 1;
}
function frame(dt) {
  if (!L || !SPR) return;
  update(dt);
  const t = G.time, g = cx, p = D.phase, ty = L.ty, pop = id => D.pop[id] || 0;
  g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(SPR.room, 0, 0, VW, VH);
  for (const [i, [x, len]] of L.lanterns.entries()) lantern(g, x, len, t, i === 0 ? pop('lantern') : 0);
  nameBoard(g, L.name.x, L.name.y);
  cat(g, L.cat.x, L.cat.y, t, pop('cat')); tree(g, L.tree.x, L.tree.y, t, pop('tree')); sign(g, L.sign.x, L.sign.y, pop('sign'), t);
  person(g, 'j', t); person(g, 'f', t);
  g.drawImage(SPR.table, 0, ty - 10, VW, VH - ty + 10);
  plate(g, L.pj); plate(g, L.pf);
  /* condiments: the yellow bottle and the jar with its spoon */
  { const v = L.vinegar, k = pop('vinegar'); g.save(); g.translate(v.x, v.y - Math.sin(k * Math.PI) * 10); g.rotate(-Math.sin(k * Math.PI) * .2);
    g.fillStyle = 'rgba(60,40,20,.22)'; ell(g, 4, 2, 26, 7); g.fill(); const gr = g.createLinearGradient(-22, 0, 22, 0); gr.addColorStop(0, '#f6d23c'); gr.addColorStop(1, '#d2a514'); g.fillStyle = gr; rr(g, -22, -66, 44, 66, 9); g.fill();
    g.beginPath(); g.moveTo(-16, -66); g.quadraticCurveTo(-14, -82, -5, -84); g.lineTo(-3, -98); g.lineTo(3, -98); g.lineTo(5, -84); g.quadraticCurveTo(14, -82, 16, -66); g.fill();
    g.fillStyle = '#fbf6ea'; rr(g, -16, -38, 32, 14, 2); g.fill(); g.fillStyle = '#2c2a3d'; g.font = `700 5.4px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Black Vinegar', 0, -30.6); g.fillStyle = 'rgba(255,255,255,.4)'; rr(g, -17, -60, 5, 50, 2.5); g.fill(); g.restore(); }
  { const c = L.chili, k = pop('chili'); g.save(); g.translate(c.x, c.y - Math.sin(k * Math.PI) * 6);
    g.fillStyle = 'rgba(60,40,20,.22)'; ell(g, 4, 2, 30, 8); g.fill(); g.strokeStyle = '#8f949c'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(4 + Math.sin(k * 14) * 8, -30); g.lineTo(22 + Math.sin(k * 14) * 8, -72); g.stroke(); g.strokeStyle = '#d9dce2'; g.lineWidth = 2.6; g.stroke();
    const gr = g.createLinearGradient(0, -40, 0, 0); gr.addColorStop(0, '#a82414'); gr.addColorStop(1, '#4a100a'); g.fillStyle = gr; rr(g, -24, -40, 48, 40, 7); g.fill(); const r = R(6); for (let i = 0; i < 26; i++) { g.fillStyle = r() < .5 ? '#2e0a06' : '#e0802c'; g.fillRect(-20 + r() * 40, -20 + r() * 17, 2.2, 1.6); }
    g.fillStyle = 'rgba(255,255,255,.2)'; rr(g, -27, -50, 54, 52, 9); g.fill(); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; rr(g, -21, -44, 5, 38, 2.5); g.fill(); g.restore(); }
  /* the order slip, then the food */
  if (p === 'order' && D.order < 2.9) { const a = sm(D.order, 0, .3) * (1 - sm(D.order, 2.5, 2.9)); g.save(); g.globalAlpha = a; g.translate(L.cxm, ty + 220); g.rotate(-.04); g.fillStyle = 'rgba(60,30,10,.25)'; rr(g, -107, -47, 220, 104, 4); g.fill(); g.fillStyle = '#fffdf4'; rr(g, -110, -50, 220, 104, 4); g.fill();
    g.fillStyle = '#a8231c'; g.font = `800 11px ${UI}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('SPICY VILLAGE  ·  TABLE FOR TWO', -94, -28); g.fillStyle = INK; g.font = `600 16px ${UI}`;
    if (D.order > .5) g.fillText('Scallion dumplings', -94, -2); if (D.order > 1.1) g.fillText('Scallion noodles', -94, 22); if (D.order > 1.7) { g.fillStyle = MISS; g.font = `italic 600 18px ${DISPLAY}`; g.fillText('the usual', 10, 44); } g.restore(); g.globalAlpha = 1; }
  if (D.arrive > 0) {
    g.globalAlpha = D.arrive; const dy = (1 - sm(D.arrive, 0, 1)) * -30, n = L.noodle, b = L.bowl;
    g.save(); g.translate(n.x, n.y + dy); g.scale(L.nr / 64, L.nr / 64); g.translate(-n.x, -n.y - dy);
    bowl(g, n.x, n.y + dy, 64);
    { g.save(); ell(g, n.x, n.y + 2 + dy, 56, 24); g.clip(); g.fillStyle = '#3a2416'; g.fillRect(n.x - 70, n.y - 30 + dy, 140, 70); const r = R(44), cnt = 3 + 30 * (1 - D.slurp); g.lineCap = 'round';
      for (let i = 0; i < cnt; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .82, x0 = n.x + Math.cos(a) * d * 52, y0 = n.y + 2 + dy + Math.sin(a) * d * 21, a2 = r() * TAU, l = 16 + r() * 16; for (const pass of [0, 1]) { g.strokeStyle = pass ? '#f3dea0' : '#b9944a'; g.lineWidth = pass ? 2.6 : 4.4; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + Math.cos(a2 + 1) * l * .6, y0 + Math.sin(a2 + 1) * l * .3, x0 + Math.cos(a2) * l, y0 + Math.sin(a2) * l * .45); g.stroke(); } }
      for (let i = 0; i < cnt * .8; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .8, x0 = n.x + Math.cos(a) * d * 50, y0 = n.y + dy + Math.sin(a) * d * 20; g.fillStyle = '#dcf0b4'; ell(g, x0, y0, 3.6, 2.4); g.fill(); g.strokeStyle = '#4f8f38'; g.lineWidth = 1.8; g.stroke(); }
      g.restore(); }
    g.restore();
    bowl(g, b.x, b.y + dy, L.br);
    for (const d of D.dump) if (d.state === 'bowl') dumpling(g, b.x + d.sx, b.y + d.sy + dy, d.rot, 0, 0, true);
    g.globalAlpha = 1;
  }
  for (const d of D.dump) {
    const pl = d.owner === 'j' ? L.pj : L.pf;
    if (d.state === 'plate') dumpling(g, pl.x + d.px, pl.y + d.py, d.rot, d.vin, d.chi, true, L.ds);
    else if (d.state === 'fly') { const k = sm(D.fly, d.owner === 'j' ? 0 : .3, d.owner === 'j' ? .7 : 1); dumpling(g, lerp(L.bowl.x + d.sx, pl.x + d.px, k), lerp(L.bowl.y + d.sy, pl.y + d.py, k) - Math.sin(k * Math.PI) * 70, d.rot + Math.sin(k * Math.PI) * .5, 0, 0, true, lerp(1, L.ds, k)); }
  }
  for (const s of D.shots) if (s.t > 0) { const pl = s.to === 'j' ? L.pj : L.pf, k = s.t, x = lerp(s.x0, pl.x, k), y = lerp(s.y0, pl.y - 6, k) - Math.sin(k * Math.PI) * 110; g.fillStyle = s.k === 'v' ? '#2a1812' : '#b02a16'; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); g.beginPath(); g.arc(x + 5, y + 6, 2.6, 0, TAU); g.fill(); g.beginPath(); g.arc(x - 6, y + 9, 2, 0, TAU); g.fill(); }
  arm(g, 'j', t); arm(g, 'f', t);
  /* the line she draws across the bowl, laid down like a chopstick */
  if (D.line && p === 'split') { const l = D.line, [a, b] = sides(l), ok = a === 5, len = Math.hypot(l.x1 - l.x0, l.y1 - l.y0) || 1, nx = -(l.y1 - l.y0) / len, ny = (l.x1 - l.x0) / len, mx = (l.x0 + l.x1) / 2, my = (l.y0 + l.y1) / 2;
    g.lineCap = 'round'; g.strokeStyle = 'rgba(60,40,20,.3)'; g.lineWidth = 7; g.beginPath(); g.moveTo(l.x0 + 2, l.y0 + 3); g.lineTo(l.x1 + 2, l.y1 + 3); g.stroke(); g.strokeStyle = ok ? '#bfe0a8' : '#ecd8a8'; g.lineWidth = 6; g.beginPath(); g.moveTo(l.x0, l.y0); g.lineTo(l.x1, l.y1); g.stroke();
    if (len > 40) { tag(g, String(a), mx + nx * 44, my + ny * 44, 1, ok ? OKC : INK); tag(g, String(b), mx - nx * 44, my - ny * 44, 1, ok ? OKC : INK); } }
  for (const pt of parts) { g.fillStyle = pt.c; g.globalAlpha = Math.min(1, pt.life * 2.5); g.beginPath(); g.arc(pt.x, pt.y, pt.s, 0, TAU); g.fill(); } g.globalAlpha = 1;
  /* nudges */
  const pu = .5 + .5 * Math.sin(t * 5); g.strokeStyle = `rgba(255,250,220,${.55 + .4 * pu})`; g.lineWidth = 3.5;
  if (p === 'look' && D.idle > 11) { const [x, y, rx, ry] = spot(FIND[D.fi].id); ell(g, x, y, rx + 6 + pu * 4, ry + 6 + pu * 4); g.stroke(); }
  if (p === 'split' && !D.line) { ell(g, L.bowl.x, L.bowl.y, L.br + 8 + pu * 4, L.br * .5 + 5 + pu * 3); g.stroke(); }
  if (p === 'sauce' && D.taps === 0) { for (const id of ['vinegar', 'chili']) { const [x, y, rx, ry] = spot(id); ell(g, x, y, rx + 4 + pu * 3, ry + 4 + pu * 3); g.stroke(); } }
  if (p === 'eat' && mine('j').length === 5 && !D.act.j) { ell(g, L.pj.x, L.pj.y, 82 * L.ps + pu * 4, 32 * L.ps + pu * 3); g.stroke(); }
  if (p === 'noodles' && !D.slurping && D.slurp < .05) { ell(g, L.noodle.x, L.noodle.y, L.nr + 6 + pu * 4, L.nr * .5 + 4 + pu * 3); g.stroke(); }
  if (p === 'noodles' && D.slurp > 0) { g.fillStyle = PAPER; rr(g, L.noodle.x - 60, L.noodle.y + 62, 120, 12, 6); g.fill(); g.fillStyle = '#f2b45c'; rr(g, L.noodle.x - 57, L.noodle.y + 65, Math.max(8, 114 * D.slurp), 6, 3); g.fill(); }
  for (const s of says) tag(g, s.text, s.x, s.y, Math.min(1, s.life * 2), s.col);
  g.globalCompositeOperation = 'lighter'; glow(g, moth.x, moth.y, 46, '255,214,130', .34 + .08 * Math.sin(t * 6)); g.globalCompositeOperation = 'source-over';
  { const f = G.RM ? .6 : Math.abs(Math.sin(t * 17)); g.fillStyle = 'rgba(255,246,214,.94)'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(moth.x + d * (2 + 4.5 * f), moth.y - 2, 1.6 + 5 * f, 5.4, d * .5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(moth.x + d * (1.5 + 3 * f), moth.y + 4, 1.2 + 3 * f, 3.4, d * -.4, 0, TAU); g.fill(); } g.fillStyle = '#ffd874'; ell(g, moth.x, moth.y, 2.2, 4.6); g.fill(); }
  G.paper(g, .36);
}

/* ------------------------------------------------------------------ input and wiring */
const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
const hit = (id, x, y) => { const [sx, sy, rx, ry] = spot(id); return Math.abs(x - sx) < rx + 6 && Math.abs(y - sy) < ry + 6; };
cv.addEventListener('pointerdown', e => {
  if (!active || !L || !$('ddone').hidden) return; const [x, y] = pt(e), p = D.phase;
  if (p === 'look') { if (hit(FIND[D.fi].id, x, y)) found(); else if (FIND.some(f => hit(f.id, x, y)) && D.cool <= 0) { D.cool = 1.2; say('Not that one.', x, y - 40); tone(300, .08, 'triangle', .04); } return; }
  if (p === 'split' && Math.hypot(x - L.bowl.x, y - L.bowl.y) < 210) { D.line = { x0: x, y0: y, x1: x, y1: y }; try { cv.setPointerCapture(e.pointerId); } catch (_) { /* fine without capture */ } e.preventDefault(); return; }
  if (p === 'sauce') { if (hit('vinegar', x, y)) addSauce('v'); else if (hit('chili', x, y)) addSauce('c'); return; }
  if (p === 'eat' && Math.abs(x - L.pj.x) < 96 * L.ps + 14 && Math.abs(y - L.pj.y) < 50) { if (D.queue < mine('j').length) D.queue++; return; }
  if (p === 'noodles' && Math.hypot(x - L.noodle.x, (y - L.noodle.y) * 1.5) < 100) { D.slurping = true; try { cv.setPointerCapture(e.pointerId); } catch (_) { /* fine without capture */ } e.preventDefault(); }
});
cv.addEventListener('pointermove', e => { if (!active || !D.line) return; const [x, y] = pt(e); D.line.x1 = x; D.line.y1 = y; });
const letGo = () => { if (D.line && D.phase === 'split') { const l = D.line; D.line = null; if (Math.hypot(l.x1 - l.x0, l.y1 - l.y0) > 50) split(l); } D.line = null; D.slurping = false; };
cv.addEventListener('pointerup', letGo); cv.addEventListener('pointercancel', () => { D.line = null; D.slurping = false; });
addEventListener('keydown', e => {
  if (!active || e.metaKey || e.ctrlKey || !$('ddone').hidden || (e.key !== ' ' && e.key !== 'Enter')) return; if (e.target && e.target.tagName === 'BUTTON') return; e.preventDefault();
  const p = D.phase;
  if (p === 'look') found(); else if (p === 'split') autoSplit(); else if (p === 'sauce') addSauce(D.taps % 2 ? 'c' : 'v');
  else if (p === 'eat' && !e.repeat) { if (D.queue < mine('j').length) D.queue++; } else if (p === 'noodles') D.slurping = true;
});
addEventListener('keyup', e => { if (active && (e.key === ' ' || e.key === 'Enter')) D.slurping = false; });
const soundLabel = () => { $('dsound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('dsound').setAttribute('aria-pressed', G.sound); };
$('dsound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
$('dnext').addEventListener('click', () => { if (D.phase === 'sauce') { D.phase = 'eat'; setStep(); tone(700, .08, 'sine', .05); } });
$('dleave').addEventListener('click', () => G.go('road', { atDoor: true }));
$('dagain').addEventListener('click', () => { $('ddone').hidden = true; D = fresh(); D.fi = FIND.length - 1; D.phase = 'order'; parts.length = says.length = 0; setStep(); });
$('dback').addEventListener('click', () => { $('ddone').hidden = true; D = fresh(); G.go('road', { atDoor: true }); });

G.scenes.dumplings = {
  frame, resize: layout,
  enter() { active = true; $('dui').hidden = false; layout(); setStep(); soundLabel(); moth.x = VW - 60; moth.y = L.ty - 214; if (document.fonts && document.fonts.load) { document.fonts.load('700 14px Nunito'); document.fonts.load('800 15px Nunito'); document.fonts.load('italic 600 18px Fraunces'); } },
  leave() { active = false; D.line = null; D.slurping = false; $('dui').hidden = true; },
  debug: { get D() { return D; }, get L() { return L; }, get S() { return S; }, spot, found, addSauce, sides }
};
})();
