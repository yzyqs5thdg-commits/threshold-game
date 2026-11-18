/* The kitchen. Bowls ride the counter runner toward the bell; read the ticket,
   ladle in the right Maggi, then drag on the toppings before the bowl gets there. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, hex, mix, rgb, wrap, TAU, R, dab, foliage, PAL, glow } = G;
const $ = id => document.getElementById(id);
const ST = [
  { id: 'regular', label: 'Regular' }, { id: 'spicy', label: 'Spicy cheesy' }, { id: 'scallion', label: 'Scallions' },
  { id: 'cheese', label: 'Cheese' }, { id: 'cream', label: 'Cream' }, { id: 'chilli', label: 'Chilli oil' }
];
const TOPS = ['scallion', 'cheese', 'cream', 'chilli'];
const NAME = { regular: 'Regular Maggi', spicy: 'Spicy Cheesy Maggi', scallion: 'Scallions', cheese: 'Cheese', cream: 'Cream', chilli: 'Chilli oil' };
const POT = { regular: 'Regular pot', spicy: 'Spicy cheesy pot' };
/* broth centre, broth edge, noodle light, noodle dark */
const BROTH = { regular: ['#f2c552', '#dfa02c', '#fbe9a0', '#c9942e'], spicy: ['#ee8236', '#cc4f1e', '#fcd482', '#b55a1c'] };
const GOAL = 8, UI = '"Nunito", "Avenir Next", system-ui, sans-serif', DISPLAY = '"Fraunces", "Iowan Old Style", Georgia, serif';
const INK = '#2c2a3d', INK_SOFT = '#5c5870', PAPER = '#fbf3df', OK = '#4c8a3f', MISS = '#b8402e';
let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false;
const K = { state: 'intro', served: 0, streak: 0, n: 0, order: null, bowl: null, held: null, endless: false, runner: 0, bell: 0, parts: [], says: [], steam: [], acted: false };
const moth = { x: 300, y: 120 };

/* ------------------------------------------------------------------ sound */
const tone = G.tone;
const sfx = {
  pick() { tone(520, .05, 'triangle', .04); },
  plop() { tone(380, .14, 'sine', .1, 0, .55); tone(240, .12, 'sine', .06, .05, .7); },
  sprinkle() { for (let i = 0; i < 4; i++) tone(1300 + Math.random() * 900, .04, 'triangle', .035, i * .035); },
  drizzle() { tone(640, .22, 'sine', .05, 0, 1.6); },
  nope() { tone(300, .08, 'triangle', .05, 0, .8); },
  wrong() { tone(233, .16, 'triangle', .07, 0, .8); tone(196, .22, 'triangle', .07, .12, .8); },
  bell() { tone(1568, .7, 'sine', .1); tone(2349, .5, 'sine', .05, .01); tone(3136, .3, 'sine', .025, .02); },
  win() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, .5, 'sine', .08, i * .13)); }
};

/* ------------------------------------------------------------------ layout */
function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S;
  const wide = VW >= 760, cols = wide ? 6 : 3, rows = wide ? 1 : 2;
  const cw = wide ? Math.min(200, (VW - 40) / 6) : (VW - 16) / 3, ch = wide ? 172 : 150;
  const stH = rows * ch + 14, beltH = 172, beltY = VH - stH - beltH, x0 = (VW - cols * cw) / 2;
  const cells = ST.map((s, i) => ({ x: x0 + (i % cols) * cw + cw / 2, y: VH - stH + 6 + ((i / cols) | 0) * ch + ch * .44, w: cw, h: ch }));
  let inset = 0; try { inset = Math.max(0, (parseFloat(getComputedStyle($('khud')).paddingTop) || 12) - 12) / S; } catch (e) { /* keep 0 */ }
  L = { wide, cw, ch, stH, beltH, beltY, backH: beltY, cells, bowlY: beltY + 62, tx: wide ? 30 : 14, ty: (wide ? 24 : 14) + inset };
  const key = `${Math.round(VW)}x${Math.round(VH)}`; if (!SPR || SPR.key !== key) build(key);
  $('kui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function build(key) { const q = clamp(S * G.DPR, 1, 2.5); SPR = { key, back: G.spr(VW, L.backH, drawBack, q), counter: G.spr(VW, L.beltH + L.stH, drawCounter, q) }; }
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };

/* ------------------------------------------------------------------ the room */
function drawBack(g, w, h) {
  const r = R(2024), th = 84, ty = h - th;
  let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e2bb7a'); gr.addColorStop(1, '#f2d9a2'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w * .7; i++) dab(g, r() * w, r() * ty, 14 + r() * 44, 5 + r() * 12, (r() - .5) * .6, r() < .5 ? '#f8e7ba' : '#d3a865', .13);
  g.globalAlpha = 1;
  /* tile backsplash */
  g.fillStyle = '#efe6d2'; g.fillRect(0, ty, w, th);
  const ts = 28;
  for (let x = -6; x < w; x += ts) for (let y = ty + 1; y < h; y += ts) {
    g.fillStyle = rgb(mix(hex('#86b3a4'), hex(r() < .5 ? '#a6cdbb' : '#6f9f90'), r())); g.fillRect(x + 1, y + 1, ts - 2, ts - 2);
    if (r() < .16) { g.fillStyle = '#f4ead2'; g.beginPath(); g.moveTo(x + ts / 2, y + 6); g.lineTo(x + ts - 6, y + ts / 2); g.lineTo(x + ts / 2, y + ts - 6); g.lineTo(x + 6, y + ts / 2); g.fill(); g.fillStyle = '#d9a03c'; g.beginPath(); g.arc(x + ts / 2, y + ts / 2, 2.6, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x + 2, y + 2, ts - 4, 3);
  }
  g.fillStyle = '#7d5435'; g.fillRect(0, ty - 9, w, 9); g.fillStyle = 'rgba(255,220,170,.35)'; g.fillRect(0, ty - 9, w, 2);

  /* window onto the evening */
  const ww = L.wide ? 250 : 186, wh = Math.min(236, ty - 9 - (L.wide ? 50 : 112)), wx = L.wide ? w * .5 - ww / 2 : w - ww - 18, wy = ty - 9 - wh - 14;
  g.fillStyle = 'rgba(70,40,20,.2)'; rr(g, wx - 8, wy - 4, ww + 22, wh + 20, 10); g.fill();
  g.fillStyle = '#7a4f33'; rr(g, wx - 9, wy - 9, ww + 18, wh + 14, 9); g.fill();
  g.save(); rr(g, wx, wy, ww, wh, 4); g.clip();
  gr = g.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, '#2a4384'); gr.addColorStop(.5, '#7684c0'); gr.addColorStop(.86, '#f1b59c'); gr.addColorStop(1, '#f7cfa8'); g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
  for (let i = 0; i < 9; i++) { const x = wx + ww * (.12 + i * .07) + r() * 10, y = wy + wh * .36 - Math.sin(i / 8 * Math.PI) * 16 * r(), rad = 9 + r() * 12; gr = g.createRadialGradient(x - 3, y - 4, 1, x, y, rad); gr.addColorStop(0, '#ffe0c6'); gr.addColorStop(1, '#b99cc0'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); }
  for (let x = wx - 4; x < wx + ww; x += 9 + r() * 12) {
    const bw = 8 + r() * 12, bh = 16 + r() * 56 * (r() < .3 ? 1.4 : .8), by = wy + wh - 22;
    g.fillStyle = '#3b4576'; g.fillRect(x, by - bh, bw, bh + 24);
    g.fillStyle = '#ffd98a'; for (let yy = by - bh + 3; yy < by; yy += 5) for (let xx = x + 2; xx < x + bw - 2; xx += 3.6) if (r() < .36) g.fillRect(xx, yy, 1.6, 2.2);
  }
  for (let i = 0; i < 40; i++) dab(g, wx + r() * ww, wy + wh - 6 - r() * 20, 9 + r() * 10, 6 + r() * 5, 0, r() < .5 ? '#22343c' : '#2c4640', .95);
  g.globalAlpha = .08; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(wx + ww * .1, wy); g.lineTo(wx + ww * .32, wy); g.lineTo(wx + ww * .05, wy + wh); g.lineTo(wx - ww * .17, wy + wh); g.fill(); g.globalAlpha = 1;
  /* gingham valance */
  g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + ww, wy); g.lineTo(wx + ww, wy + 30); for (let x = wx + ww; x > wx; x -= ww / 8) g.arc(x - ww / 16, wy + 30, ww / 16, 0, Math.PI); g.closePath();
  g.save(); g.clip(); g.fillStyle = '#f6ecd6'; g.fillRect(wx, wy, ww, 60);
  g.fillStyle = 'rgba(201,70,59,.5)'; for (let x = wx; x < wx + ww; x += 16) g.fillRect(x, wy, 8, 60); for (let y = wy; y < wy + 60; y += 16) g.fillRect(wx, y, ww, 8);
  g.restore(); g.restore();
  g.strokeStyle = '#7a4f33'; g.lineWidth = 5; g.beginPath(); g.moveTo(wx + ww / 2, wy + 30); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh * .58); g.lineTo(wx + ww, wy + wh * .58); g.stroke();
  g.fillStyle = '#a8774c'; rr(g, wx - 16, wy + wh + 2, ww + 32, 10, 3); g.fill(); g.fillStyle = 'rgba(255,230,190,.4)'; g.fillRect(wx - 14, wy + wh + 2, ww + 28, 2);
  for (const [k, pal] of [[.18, PAL.deep], [.5, PAL.yg], [.82, PAL.deep]]) {
    const px = wx + ww * k, sy = wy + wh + 2;
    g.fillStyle = '#c0683e'; g.beginPath(); g.moveTo(px - 14, sy - 22); g.lineTo(px + 14, sy - 22); g.lineTo(px + 10, sy); g.lineTo(px - 10, sy); g.fill(); g.fillStyle = '#d98456'; g.fillRect(px - 15, sy - 25, 30, 5);
    foliage(g, r, px, sy - 40, 19, 20, pal, 46);
  }
  /* shelves and the things on them */
  const shelf = (x0, x1, y) => {
    if (x1 - x0 < 70) return;
    g.fillStyle = 'rgba(70,40,20,.18)'; g.fillRect(x0 - 4, y + 7, x1 - x0 + 12, 5);
    g.fillStyle = '#8a5e3c'; rr(g, x0 - 6, y, x1 - x0 + 12, 8, 2); g.fill(); g.fillStyle = 'rgba(255,225,180,.4)'; g.fillRect(x0 - 5, y, x1 - x0 + 10, 2);
    g.fillStyle = '#6e4628'; for (const bx of [x0 + 10, x1 - 14]) { g.beginPath(); g.moveTo(bx, y + 8); g.lineTo(bx + 5, y + 8); g.lineTo(bx + 5, y + 22); g.fill(); }
    let x = x0 + 6;
    while (x < x1 - 30) {
      const k = r() * 5 | 0;
      if (k === 0 || k === 4) { const jw = 22 + r() * 8, jh = 34 + r() * 22, col = ['#c7301c', '#e2c05a', '#7a5230', '#f4ead2', '#5f8f4a'][r() * 5 | 0]; g.fillStyle = 'rgba(255,255,255,.5)'; rr(g, x, y - jh, jw, jh, 5); g.fill(); g.fillStyle = col; rr(g, x + 2, y - jh * .72, jw - 4, jh * .72 - 2, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x + 4, y - jh + 8, 3, jh - 14); g.fillStyle = '#8a5e3c'; rr(g, x - 1, y - jh - 5, jw + 2, 7, 2); g.fill(); x += jw + 9; }
      else if (k === 1) { for (let i = 0; i < 3; i++) { g.fillStyle = i % 2 ? '#e9eef4' : '#fbf6ea'; g.beginPath(); g.moveTo(x, y - 9 - i * 7); g.quadraticCurveTo(x + 21, y + 9 - i * 7, x + 42, y - 9 - i * 7); g.fill(); g.strokeStyle = '#3f6fa8'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y - 9 - i * 7); g.lineTo(x + 42, y - 9 - i * 7); g.stroke(); } x += 52; }
      else if (k === 2) { for (let i = 0; i < 3; i++) { g.fillStyle = '#f2c230'; rr(g, x + (i % 2) * 2, y - 12 - i * 11, 44, 10, 3); g.fill(); g.fillStyle = '#d6402b'; g.fillRect(x + 14 + (i % 2) * 2, y - 12 - i * 11, 14, 10); } x += 56; }
      else { g.fillStyle = ['#3f6f78', '#b5533c', '#d9a03c'][r() * 3 | 0]; rr(g, x, y - 36, 28, 36, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x + 4, y - 26, 20, 10); g.fillStyle = '#e8e3d8'; rr(g, x - 1, y - 40, 30, 6, 2); g.fill(); x += 38; }
    }
  };
  if (L.wide) {
    const rx0 = wx + ww + 50, rx1 = w - 34;
    shelf(rx0, rx1, ty - 46); shelf(246, wx - 44, ty - 46);
    if (rx1 - rx0 > 120) {
      /* rail with pots and strings of chillies and garlic */
      g.strokeStyle = '#3a3436'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(rx0, 74); g.lineTo(rx1, 74); g.stroke();
      let x = rx0 + 28, i = 0;
      while (x < rx1 - 24) {
        g.strokeStyle = '#3a3436'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 74); g.lineTo(x, 84); g.stroke();
        const k = i++ % 5;
        if (k === 0) { g.strokeStyle = '#6e4628'; g.lineWidth = 5; g.beginPath(); g.moveTo(x, 84); g.lineTo(x, 112); g.stroke(); gr = g.createRadialGradient(x - 6, 128, 2, x, 134, 24); gr.addColorStop(0, '#eaa56a'); gr.addColorStop(1, '#b0642f'); g.fillStyle = gr; g.beginPath(); g.arc(x, 134, 23, 0, TAU); g.fill(); g.strokeStyle = 'rgba(90,40,10,.4)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, 134, 17, 0, TAU); g.stroke(); }
        else if (k === 1) { for (let j = 0; j < 9; j++) dab(g, x + (j % 2 ? 4 : -4), 90 + j * 7, 3.4, 7.5, j % 2 ? .5 : -.5, j % 3 ? '#c7301c' : '#e0492c', 1); g.globalAlpha = 1; }
        else if (k === 2) { g.strokeStyle = '#c9ccd2'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 84); g.lineTo(x, 138); g.stroke(); g.fillStyle = '#c9ccd2'; ell(g, x, 146, 11, 9); g.fill(); g.fillStyle = 'rgba(60,60,80,.3)'; ell(g, x + 2, 147, 7, 5.5); g.fill(); }
        else if (k === 3) { for (let j = 0; j < 5; j++) { dab(g, x + (j % 2 ? 6 : -6), 94 + j * 10, 8, 7, 0, '#f4ecdc', 1); dab(g, x + (j % 2 ? 6 : -6) + 2, 96 + j * 10, 5, 4.5, 0, '#dccfb8', .7); } g.globalAlpha = 1; }
        else { g.strokeStyle = '#3a3436'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, 84); g.lineTo(x, 104); g.stroke(); g.fillStyle = '#4a4648'; g.beginPath(); g.moveTo(x - 20, 104); g.lineTo(x + 20, 104); g.lineTo(x + 16, 136); g.lineTo(x - 16, 136); g.fill(); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x - 15, 108, 5, 24); }
        x += 58;
      }
    }
  } else shelf(16, wx - 26, ty - 34);
}

function drawNoodles(g, pts, light, dark) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const p of pts) for (const pass of [0, 1]) { g.strokeStyle = pass ? light : dark; g.lineWidth = pass ? 2.6 : 4.6; g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[2], p[3], p[4], p[5]); g.quadraticCurveTo(p[6], p[7], p[8], p[9]); g.stroke(); }
}
function genNoodles(r, rx, ry, n) {
  const a = [];
  for (let i = 0; i < n; i++) {
    const an = r() * TAU, d = Math.sqrt(r()) * .82, p = [Math.cos(an) * d * rx, Math.sin(an) * d * ry]; let px = p[0], py = p[1], t = r() * TAU; const l = 13 + r() * 14;
    for (let k = 0; k < 2; k++) { const c = t + (r() - .5) * 2.4; p.push(px + Math.cos(c) * l * .7, py + Math.sin(c) * l * .4); px += Math.cos(t) * l; py += Math.sin(t) * l * .5; p.push(px, py); t += (r() - .5) * 2.6; }
    a.push(p);
  }
  return a;
}
function broth(g, kind, x, y, rx, ry) {
  const c = BROTH[kind], gr = g.createRadialGradient(x - rx * .2, y - ry * .2, 2, x, y, rx);
  gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); g.fillStyle = gr; g.fillRect(x - rx - 2, y - ry - 2, rx * 2 + 4, ry * 2 + 4);
}
function spicyBits(g, r, rx, ry, n) {
  for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .8; dab(g, Math.cos(a) * d * rx, Math.sin(a) * d * ry, 5 + r() * 8, 3 + r() * 4, r() * 3, '#fbe3a0', .8); }
  for (let i = 0; i < n * 2; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .9; dab(g, Math.cos(a) * d * rx, Math.sin(a) * d * ry, 1.4, 1, r() * 3, '#8e1e12', .9); }
  g.globalAlpha = 1;
}
function drawPot(g, kind, r) {
  const c = kind === 'regular' ? ['#7ba2c2', '#55799a', '#3b5c7c'] : ['#dc6052', '#b84236', '#8c2c26'];
  g.fillStyle = '#2e2a2c'; rr(g, -68, -6, 18, 10, 4); g.fill(); rr(g, 50, -6, 18, 10, 4); g.fill();
  const gr = g.createLinearGradient(-54, 0, 54, 0); gr.addColorStop(0, c[0]); gr.addColorStop(.55, c[1]); gr.addColorStop(1, c[2]);
  g.fillStyle = gr; g.beginPath(); g.moveTo(-54, -8); g.lineTo(-50, 30); g.quadraticCurveTo(0, 48, 50, 30); g.lineTo(54, -8); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-42, 12); g.quadraticCurveTo(-41, 26, -36, 32); g.stroke();
  g.fillStyle = '#f4efe4'; ell(g, 0, -8, 54, 27); g.fill(); g.fillStyle = '#3a3034'; ell(g, 0, -8, 50, 24); g.fill();
  g.save(); ell(g, 0, -5, 47, 21); g.clip(); g.translate(0, -5); broth(g, kind, 0, 0, 47, 21);
  drawNoodles(g, genNoodles(r, 47, 21, 16), BROTH[kind][2], BROTH[kind][3]); if (kind === 'spicy') spicyBits(g, r, 47, 21, 7); g.restore();
  /* ladle handle */
  g.strokeStyle = '#8f949c'; g.lineWidth = 7; g.beginPath(); g.moveTo(16, -8); g.lineTo(54, -60); g.stroke();
  g.strokeStyle = '#d9dce2'; g.lineWidth = 4.2; g.beginPath(); g.moveTo(16, -8); g.lineTo(54, -60); g.stroke();
  g.strokeStyle = '#8f949c'; g.lineWidth = 3; g.beginPath(); g.arc(58, -64, 5, .6, 4.4); g.stroke();
}
const ring = (g, x, y, s) => { g.fillStyle = '#dcf0b4'; ell(g, x, y, s, s * .64); g.fill(); g.strokeStyle = '#4f8f38'; g.lineWidth = 2.3; g.stroke(); };
const shred = (g, x, y, rot, l) => { g.lineCap = 'round'; for (const pass of [0, 1]) { g.strokeStyle = pass ? '#ffeaa4' : '#e2b54c'; g.lineWidth = pass ? 2.6 : 4.2; g.beginPath(); g.moveTo(x - Math.cos(rot) * l, y - Math.sin(rot) * l * .6); g.quadraticCurveTo(x + Math.sin(rot) * 3, y - 2, x + Math.cos(rot) * l, y + Math.sin(rot) * l * .6); g.stroke(); } };
function drawJug(g) {
  g.strokeStyle = '#e4dccb'; g.lineWidth = 6; g.beginPath(); g.moveTo(20, -14); g.quadraticCurveTo(40, -8, 22, 14); g.stroke();
  const gr = g.createLinearGradient(-24, 0, 24, 0); gr.addColorStop(0, '#fffdf6'); gr.addColorStop(1, '#ddd3c0');
  g.fillStyle = gr; g.beginPath(); g.moveTo(-20, -28); g.lineTo(-30, -34); g.lineTo(-22, -20); g.quadraticCurveTo(-30, 10, -18, 28); g.lineTo(18, 28); g.quadraticCurveTo(28, 8, 20, -28); g.closePath(); g.fill();
  g.fillStyle = '#fffaf0'; ell(g, -2, -28, 20, 6); g.fill(); g.strokeStyle = '#d6cbb6'; g.lineWidth = 1.2; g.stroke();
  g.strokeStyle = '#3f6fa8'; g.lineWidth = 3; g.beginPath(); g.moveTo(-24, 6); g.quadraticCurveTo(0, 12, 24, 6); g.stroke();
  g.lineWidth = 1.2; g.beginPath(); g.moveTo(-23, 12); g.quadraticCurveTo(0, 18, 23, 12); g.stroke();
}
function drawStation(g, id, r) {
  g.fillStyle = 'rgba(40,22,12,.22)'; ell(g, 3, 34, 56, 13); g.fill();
  if (id === 'regular' || id === 'spicy') return drawPot(g, id, r);
  if (id === 'scallion' || id === 'cheese') {
    const wood = id === 'scallion';
    let gr = g.createLinearGradient(-46, 0, 46, 0); gr.addColorStop(0, wood ? '#c99a62' : '#fffdf6'); gr.addColorStop(1, wood ? '#8a5e3c' : '#d6cbb6');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-46, -2); g.bezierCurveTo(-44, 26, -28, 36, -18, 37); g.lineTo(18, 37); g.bezierCurveTo(28, 36, 44, 26, 46, -2); g.closePath(); g.fill();
    g.fillStyle = wood ? '#d7ab74' : '#fffdf6'; ell(g, 0, -2, 46, 22); g.fill();
    g.fillStyle = wood ? '#6e4628' : '#cfc3ad'; ell(g, 0, 0, 40, 17); g.fill();
    if (!wood) { g.strokeStyle = '#3f6fa8'; g.lineWidth = 2; ell(g, 0, 10, 42, 22, .15 * Math.PI, .85 * Math.PI); g.stroke(); }
    for (let i = 0; i < 46; i++) { const a = r() * TAU, d = Math.sqrt(r()), x = Math.cos(a) * d * 33, y = -5 + Math.sin(a) * d * 13 - (1 - d) * 9; if (wood) ring(g, x, y, 3.6 + r() * 2); else shred(g, x, y, r() * 3, 6 + r() * 4); }
    return;
  }
  if (id === 'cream') return drawJug(g);
  /* chilli oil jar */
  g.fillStyle = '#8f949c'; rr(g, -50, 24, 24, 8, 3); g.fill(); g.fillStyle = '#d9dce2'; g.fillRect(-48, 24, 20, 2.4);
  g.strokeStyle = '#8f949c'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(4, -6); g.lineTo(30, -58); g.stroke(); g.strokeStyle = '#d9dce2'; g.lineWidth = 3.4; g.stroke();
  let gr = g.createLinearGradient(0, -14, 0, 30); gr.addColorStop(0, '#d8431f'); gr.addColorStop(.7, '#b02a16'); gr.addColorStop(1, '#6e150c');
  g.fillStyle = gr; rr(g, -22, -14, 44, 44, 8); g.fill();
  for (let i = 0; i < 26; i++) dab(g, -17 + r() * 34, 8 + r() * 19, 1.8, 1.2, r() * 3, r() < .5 ? '#5c120a' : '#f0a04a', .9);
  g.globalAlpha = 1; g.fillStyle = 'rgba(255,255,255,.22)'; rr(g, -26, -34, 52, 66, 10); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.6; rr(g, -26, -34, 52, 66, 10); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.5)'; rr(g, -20, -26, 5, 48, 2.5); g.fill();
}
function drawCounter(g, w, h) {
  const r = R(77), bh = L.beltH;
  let gr = g.createLinearGradient(0, 0, 0, bh); gr.addColorStop(0, '#d8aa6e'); gr.addColorStop(1, '#c09056'); g.fillStyle = gr; g.fillRect(0, 0, w, bh);
  for (let i = 0; i < w * .5; i++) dab(g, r() * w, r() * bh, 20 + r() * 70, 1.2 + r() * 2, 0, r() < .5 ? '#e6bd84' : '#a97a44', .22);
  g.globalAlpha = 1; g.strokeStyle = 'rgba(90,50,20,.16)'; g.lineWidth = 1; for (const y of [20, 48, 84]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  gr = g.createLinearGradient(0, 0, 0, 22); gr.addColorStop(0, 'rgba(70,35,10,.34)'); gr.addColorStop(1, 'rgba(70,35,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, 22);
  /* the runner the bowls ride on */
  g.fillStyle = 'rgba(70,35,10,.2)'; g.fillRect(0, 103, w, 62); g.fillStyle = '#f5ecd8'; g.fillRect(0, 98, w, 62);
  for (let i = 0; i < w * .4; i++) dab(g, r() * w, 100 + r() * 58, 12 + r() * 30, 1 + r() * 2, 0, r() < .5 ? '#fffaf0' : '#e2d6bc', .35);
  g.globalAlpha = 1; g.fillStyle = '#c9463b'; g.fillRect(0, 104, w, 3.2); g.fillRect(0, 151, w, 3.2);
  g.fillStyle = 'rgba(201,70,59,.5)'; g.fillRect(0, 110, w, 1.2); g.fillRect(0, 147, w, 1.2);
  g.fillStyle = '#8d643c'; g.fillRect(0, bh - 8, w, 8); g.fillStyle = 'rgba(255,225,180,.45)'; g.fillRect(0, bh - 8, w, 1.6);
  /* stack of clean bowls where they come from */
  for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#efe6d4' : '#fbf6ea'; g.beginPath(); g.moveTo(8, 86 - i * 9); g.quadraticCurveTo(36, 116 - i * 9, 64, 86 - i * 9); g.fill(); g.strokeStyle = '#3f6fa8'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(8, 86 - i * 9); g.lineTo(64, 86 - i * 9); g.stroke(); }
  /* the near counter, the hob and what sits on it */
  gr = g.createLinearGradient(0, bh, 0, h); gr.addColorStop(0, '#a17148'); gr.addColorStop(1, '#7e5336'); g.fillStyle = gr; g.fillRect(0, bh, w, h - bh);
  for (let i = 0; i < w * .8; i++) dab(g, r() * w, bh + r() * (h - bh), 20 + r() * 80, 1.2 + r() * 2.4, 0, r() < .5 ? '#b98a5c' : '#6b442a', .2);
  g.globalAlpha = 1; gr = g.createLinearGradient(0, bh, 0, bh + 20); gr.addColorStop(0, 'rgba(40,20,8,.4)'); gr.addColorStop(1, 'rgba(40,20,8,0)'); g.fillStyle = gr; g.fillRect(0, bh, w, 20);
  const c0 = L.cells[0], c1 = L.cells[1], oy = L.beltY;
  g.fillStyle = 'rgba(30,16,8,.3)'; rr(g, c0.x - L.cw * .46 + 3, c0.y - oy - 50, c1.x - c0.x + L.cw * .92, 116, 12); g.fill();
  g.fillStyle = '#3b3739'; rr(g, c0.x - L.cw * .46, c0.y - oy - 54, c1.x - c0.x + L.cw * .92, 116, 12); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 1.5; rr(g, c0.x - L.cw * .46 + 3, c0.y - oy - 51, c1.x - c0.x + L.cw * .92 - 6, 110, 10); g.stroke();
  for (const c of [c0, c1]) { g.strokeStyle = '#1c191b'; g.lineWidth = 6; ell(g, c.x, c.y - oy + 26, 52, 17); g.stroke(); g.fillStyle = '#d8d2c8'; g.beginPath(); g.arc(c.x - 22, c.y - oy + 54, 4, 0, TAU); g.arc(c.x + 22, c.y - oy + 54, 4, 0, TAU); g.fill(); }
  L.cells.forEach((c, i) => { g.save(); g.translate(c.x, c.y - oy); drawStation(g, ST[i].id, r); g.restore(); });
}

/* ------------------------------------------------------------------ the bowl and what goes in it */
function newBowl() { return { x: -110, v: 0, base: null, tops: {}, items: [], noodles: null, seed: Math.random() * 1e9 | 0, pop: 0, done: false, wrong: false, missed: false, wt: 0 }; }
function makeOrder(n) {
  const base = n === 0 ? 'regular' : n === 1 ? 'spicy' : Math.random() < .5 ? 'regular' : 'spicy';
  const k = n === 0 ? 0 : n === 1 ? 1 : n < 4 ? 2 : n < 6 ? 3 : 2 + (Math.random() * 3 | 0);
  const pool = TOPS.slice().sort(() => Math.random() - .5).slice(0, k), tops = {};
  for (const t of pool) tops[t] = n >= 4 && t !== 'cream' && Math.random() < .3 ? 2 : 1;
  return { base, tops, no: n + 1 };
}
function addTopping(b, type) {
  const r = R((b.seed + b.items.length * 7919) >>> 0), at = () => { const a = r() * TAU, d = Math.sqrt(r()) * .86; return [Math.cos(a) * d * 54, 5 + Math.sin(a) * d * 22]; };
  if (type === 'scallion') for (let i = 0; i < 8; i++) { const [x, y] = at(); b.items.push({ t: 's', x, y, s: 3.6 + r() * 1.8 }); }
  else if (type === 'cheese') for (let i = 0; i < 11; i++) { const [x, y] = at(); b.items.push({ t: 'c', x, y, rot: r() * 3, l: 6 + r() * 4 }); }
  else if (type === 'cream') { const x0 = (r() - .5) * 26, y0 = 5 + (r() - .5) * 8, pts = [], ph = r() * TAU; for (let i = 0; i <= 26; i++) { const k = i / 26, a = ph + k * TAU * 1.7, rad = 6 + k * 32; pts.push([x0 + Math.cos(a) * rad, y0 + Math.sin(a) * rad * .42]); } b.items.push({ t: 'm', pts }); }
  else { const drops = []; for (let i = 0; i < 10; i++) { const [x, y] = at(); drops.push([x, y, 2.2 + r() * 2.6]); } const flakes = []; for (let i = 0; i < 9; i++) flakes.push(at()); b.items.push({ t: 'o', drops, flakes }); }
}
function drawBowl(g, b, x, y) {
  g.save(); g.translate(x, y);
  g.fillStyle = 'rgba(60,35,20,.24)'; ell(g, 5, 80, 74, 13); g.fill();
  const s = 1 + .07 * b.pop; g.scale(s, s); if (b.wrong) g.rotate(Math.sin(b.wt * 34) * .05 * Math.max(0, 1 - b.wt * 1.6));
  let gr = g.createLinearGradient(-80, 0, 80, 0); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(.6, '#f0e7d5'); gr.addColorStop(1, '#cfc3b0');
  g.fillStyle = '#d8ccb8'; rr(g, -32, 72, 64, 10, 4); g.fill();
  g.fillStyle = gr; g.beginPath(); g.moveTo(-80, 0); g.bezierCurveTo(-80, 44, -58, 74, -36, 78); g.lineTo(36, 78); g.bezierCurveTo(58, 74, 80, 44, 80, 0); g.closePath(); g.fill();
  g.strokeStyle = '#3f6fa8'; g.lineWidth = 3.4; ell(g, 0, 16, 73, 40, .08 * Math.PI, .92 * Math.PI); g.stroke();
  g.lineWidth = 1.2; ell(g, 0, 25, 67, 38, .1 * Math.PI, .9 * Math.PI); g.stroke();
  g.fillStyle = '#3f6fa8'; for (let i = -4; i <= 4; i++) { g.beginPath(); g.arc(i * 13, 48 + Math.cos(i / 4 * 1.3) * 14 - 10, 1.8, 0, TAU); g.fill(); }
  g.fillStyle = '#fdf8ec'; ell(g, 0, 0, 80, 40); g.fill(); g.strokeStyle = 'rgba(63,111,168,.7)'; g.lineWidth = 1.4; ell(g, 0, 0, 77.5, 38); g.stroke();
  gr = g.createLinearGradient(0, -30, 0, 36); gr.addColorStop(0, '#c9bca4'); gr.addColorStop(1, '#efe6d2'); g.fillStyle = gr; ell(g, 0, 3, 70, 33); g.fill();
  if (b.base) {
    g.save(); ell(g, 0, 5, 66, 30); g.clip(); broth(g, b.base, 0, 5, 66, 30);
    g.save(); g.translate(0, 5); drawNoodles(g, b.noodles, BROTH[b.base][2], BROTH[b.base][3]); if (b.base === 'spicy') spicyBits(g, R(b.seed), 60, 26, 8); g.restore();
    for (const it of b.items) {
      if (it.t === 's') ring(g, it.x, it.y, it.s);
      else if (it.t === 'c') shred(g, it.x, it.y, it.rot, it.l);
      else if (it.t === 'm') { g.lineCap = 'round'; g.lineJoin = 'round'; for (const pass of [0, 1]) { g.strokeStyle = pass ? '#fffdf6' : 'rgba(214,196,160,.8)'; g.lineWidth = pass ? 4.6 : 6.4; g.beginPath(); it.pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } }
      else { g.fillStyle = 'rgba(214,60,24,.2)'; ell(g, 0, 5, 56, 24); g.fill(); for (const [dx, dy, dr] of it.drops) { g.fillStyle = '#c7301c'; ell(g, dx, dy, dr, dr * .66); g.fill(); g.fillStyle = 'rgba(255,196,140,.8)'; ell(g, dx - dr * .3, dy - dr * .2, dr * .3, dr * .2); g.fill(); } g.fillStyle = '#6e150c'; for (const [fx, fy] of it.flakes) g.fillRect(fx, fy, 2, 1.4); }
    }
    g.restore();
    g.strokeStyle = 'rgba(120,80,30,.25)'; g.lineWidth = 2; ell(g, 0, 5, 66, 30); g.stroke();
  }
  g.restore();
}
function drawHeld(g, h) {
  const x = h.x, y = h.y - h.lift, r = R(31);
  g.save(); g.translate(x, y);
  if (h.id === 'regular' || h.id === 'spicy') {
    g.rotate(-.12); g.strokeStyle = '#8f949c'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(16, -6); g.lineTo(50, -58); g.stroke(); g.strokeStyle = '#d9dce2'; g.lineWidth = 4.2; g.stroke();
    g.fillStyle = '#a9aeb6'; g.beginPath(); g.ellipse(0, 2, 25, 17, 0, 0, Math.PI); g.fill(); g.fillStyle = '#d9dce2'; ell(g, 0, 0, 25, 14); g.fill();
    g.save(); ell(g, 0, 0, 21, 11); g.clip(); broth(g, h.id, 0, 0, 21, 11); drawNoodles(g, genNoodles(r, 21, 11, 5), BROTH[h.id][2], BROTH[h.id][3]); g.restore();
  } else if (h.id === 'scallion') for (let i = 0; i < 7; i++) ring(g, (r() - .5) * 26, (r() - .5) * 16, 4 + r() * 1.6);
  else if (h.id === 'cheese') for (let i = 0; i < 9; i++) shred(g, (r() - .5) * 26, (r() - .5) * 16, r() * 3, 6 + r() * 4);
  else if (h.id === 'cream') { g.rotate(-.75); g.scale(.82, .82); drawJug(g); }
  else { g.strokeStyle = '#8f949c'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(10, -6); g.lineTo(40, -52); g.stroke(); g.strokeStyle = '#d9dce2'; g.lineWidth = 3.4; g.stroke(); g.fillStyle = '#d9dce2'; ell(g, 0, 0, 15, 10); g.fill(); g.fillStyle = '#c7301c'; ell(g, 0, 0, 11.5, 7); g.fill(); g.fillStyle = 'rgba(255,196,140,.8)'; ell(g, -3, -2, 3.5, 1.8); g.fill(); }
  g.restore();
}

/* ------------------------------------------------------------------ the ticket */
function ticketRows() {
  const o = K.order, b = K.bowl || { tops: {} }, rows = [{ boxes: [b.base === o.base], text: POT[o.base] }];
  const need = TOPS.filter(t => o.tops[t]);
  for (const t of need) { const n = o.tops[t], have = b.tops[t] || 0; rows.push({ boxes: Array.from({ length: n }, (_, i) => have > i), text: NAME[t] + (n > 1 ? ', twice' : '') }); }
  if (!need.length) rows.push({ plain: 'No toppings' });
  if (b.base && b.base !== o.base) rows.push({ bad: POT[b.base] });
  for (const t of TOPS) if ((b.tops[t] || 0) > (o.tops[t] || 0)) rows.push({ bad: o.tops[t] ? 'Too much ' + NAME[t].toLowerCase() : NAME[t] });
  return rows;
}
function drawTicket(g) {
  const o = K.order; if (!o) return;
  const rows = ticketRows(), w = 196, h = 74 + rows.length * 27 + 10;
  g.save(); g.translate(L.tx + w / 2, L.ty); g.rotate(Math.sin(G.time * 1.1) * .012 * (G.RM ? 0 : 1) - .018); g.translate(-w / 2, 8);
  g.fillStyle = 'rgba(60,35,15,.22)'; rr(g, 4, 5, w, h, 5); g.fill(); g.fillStyle = PAPER; rr(g, 0, 0, w, h, 5); g.fill();
  g.fillStyle = INK_SOFT; g.font = `700 11px ${UI}`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  let lx = 16; for (const ch of ('ORDER ' + o.no)) { g.fillText(ch, lx, 26); lx += g.measureText(ch).width + 1.6; }
  let fs = 21; g.font = `italic 600 ${fs}px ${DISPLAY}`; while (g.measureText(NAME[o.base]).width > w - 30 && fs > 14) { fs--; g.font = `italic 600 ${fs}px ${DISPLAY}`; }
  g.fillStyle = INK; g.fillText(NAME[o.base], 16, 52);
  g.strokeStyle = 'rgba(92,88,112,.5)'; g.lineWidth = 1; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(14, 64); g.lineTo(w - 14, 64); g.stroke(); g.setLineDash([]);
  rows.forEach((row, i) => {
    const y = 74 + i * 27;
    if (row.plain) { g.fillStyle = INK_SOFT; g.font = `italic 400 15px ${DISPLAY}`; g.fillText(row.plain, 16, y + 16); return; }
    if (row.bad) { g.strokeStyle = MISS; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(17, y + 5); g.lineTo(28, y + 16); g.moveTo(28, y + 5); g.lineTo(17, y + 16); g.stroke(); g.fillStyle = MISS; g.font = `700 14.5px ${UI}`; g.fillText(row.bad, 38, y + 16); return; }
    let bx = 15;
    for (const on of row.boxes) {
      g.strokeStyle = INK_SOFT; g.lineWidth = 1.5; rr(g, bx, y + 3, 15, 15, 3); g.stroke();
      if (on) { g.strokeStyle = OK; g.lineWidth = 2.8; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(bx + 2.5, y + 10.5); g.lineTo(bx + 6.5, y + 15); g.lineTo(bx + 15, y + 3.5); g.stroke(); }
      bx += 20;
    }
    g.fillStyle = INK; g.font = `600 14.5px ${UI}`; g.fillText(row.text, bx + 3, y + 16);
  });
  /* clothes peg */
  g.fillStyle = '#c99a62'; rr(g, w / 2 - 7, -14, 14, 30, 3); g.fill(); g.fillStyle = 'rgba(90,50,20,.35)'; g.fillRect(w / 2 - .7, -14, 1.4, 30); g.fillStyle = '#8f949c'; g.fillRect(w / 2 - 8, -2, 16, 3);
  g.restore();
}
function announce() {
  const o = K.order, list = TOPS.filter(t => o.tops[t]).map(t => NAME[t].toLowerCase() + (o.tops[t] > 1 ? ' twice' : ''));
  $('klive').textContent = `Order ${o.no}: ${NAME[o.base]}${list.length ? ' with ' + list.join(', ') : ', no toppings'}.`;
}
function hud() { $('kcount').textContent = K.endless ? `Served ${K.served}` : `Served ${K.served} of ${GOAL}`; }

/* ------------------------------------------------------------------ play */
function say(text, x, y, col = INK) { K.says.push({ text, x: clamp(x, 80, VW - 80), y, life: 1.6, col }); }
function splash(x, y, cols, n) { if (G.RM) return; for (let i = 0; i < n; i++) K.parts.push({ x: x + (Math.random() - .5) * 60, y: y + (Math.random() - .5) * 16, vx: (Math.random() - .5) * 150, vy: -80 - Math.random() * 150, life: .7, c: cols[Math.random() * cols.length | 0], s: 2 + Math.random() * 2.6 }); }
function add(id) {
  const b = K.bowl; if (K.state !== 'play' || !b || b.done || b.wrong || b.missed) return;
  K.acted = true;
  if (id === 'regular' || id === 'spicy') {
    if (b.base) { say('Already ladled', b.x, L.bowlY - 62); sfx.nope(); return; }
    b.base = id; b.noodles = genNoodles(R(b.seed), 62, 27, 30); sfx.plop(); splash(b.x, L.bowlY, [BROTH[id][0], BROTH[id][2]], 12);
  } else {
    if (!b.base) { say('Maggi first', b.x, L.bowlY - 62); sfx.nope(); return; }
    b.tops[id] = (b.tops[id] || 0) + 1; addTopping(b, id);
    if (id === 'scallion' || id === 'cheese') sfx.sprinkle(); else sfx.drizzle();
    splash(b.x, L.bowlY, { scallion: ['#4f8f38', '#dcf0b4'], cheese: ['#ffeaa4', '#e2b54c'], cream: ['#fffdf6'], chilli: ['#c7301c', '#f0a04a'] }[id], 9);
  }
  b.pop = 1;
  const o = K.order; let wrong = b.base !== o.base, complete = true;
  for (const t of TOPS) { const have = b.tops[t] || 0, need = o.tops[t] || 0; if (have > need) wrong = true; if (have < need) complete = false; }
  if (wrong) { b.wrong = true; K.streak = 0; say('Not on the ticket', b.x, L.bowlY - 62, MISS); sfx.wrong(); }
  else if (complete) { b.done = true; K.bell = 1; say('Order up!', b.x, L.bowlY - 62, OK); sfx.bell(); }
}
function nextBowl() {
  const b = K.bowl;
  if (b && b.done) { K.served++; K.streak++; K.n++; K.order = makeOrder(K.n); hud(); if (K.served === GOAL && !K.endless) win(); }
  else { K.streak = 0; if (K.n >= 2) K.order = makeOrder(K.n); }
  K.bowl = newBowl(); announce();
}
function win() { K.state = 'won'; $('kwin').hidden = false; sfx.win(); $('kmore').focus(); }
function update(dt) {
  const b = K.bowl; K.bell = Math.max(0, K.bell - dt * 1.5);
  if (K.state === 'play' && b) {
    const T = K.n === 0 ? 26 : clamp(17 - K.streak * 1.3, 8.5, 17), v0 = (VW + 240) / T;
    if (b.wrong) b.wt += dt;
    if (b.done || b.missed || (b.wrong && b.wt > .75)) b.v = Math.min(b.v + dt * 2600, 1500); else b.v = b.wrong ? 0 : v0;
    b.x += b.v * dt; K.runner += b.v * dt; b.pop = Math.max(0, b.pop - dt * 5);
    if (!b.done && !b.wrong && !b.missed && b.x > VW - 24) { b.missed = true; K.streak = 0; say('That one got away', VW - 110, L.bowlY - 62, MISS); sfx.nope(); }
    if (b.x > VW + 130) nextBowl();
  }
  if (!G.RM && Math.random() < dt * 7) { const c = L.cells[Math.random() * 2 | 0]; K.steam.push({ x: c.x + (Math.random() - .5) * 50, y: c.y - 12, vx: (Math.random() - .5) * 8, life: 1, s: 8 + Math.random() * 6 }); }
  if (!G.RM && b && b.base && Math.random() < dt * 5) K.steam.push({ x: b.x + (Math.random() - .5) * 70, y: L.bowlY - 4, vx: (Math.random() - .5) * 8 + b.v * .15, life: 1, s: 8 + Math.random() * 6 });
  for (let i = K.steam.length - 1; i >= 0; i--) { const p = K.steam[i]; p.life -= dt * .7; p.y -= 34 * dt; p.x += p.vx * dt; p.s += dt * 9; if (p.life <= 0) K.steam.splice(i, 1); }
  for (let i = K.parts.length - 1; i >= 0; i--) { const p = K.parts[i]; p.life -= dt; p.vy += 620 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) K.parts.splice(i, 1); }
  for (let i = K.says.length - 1; i >= 0; i--) { const s = K.says[i]; s.life -= dt; s.y -= 22 * dt; if (s.life <= 0) K.says.splice(i, 1); }
  const follow = b && b.done && b.x < VW, mx = follow ? b.x : L.tx + 240 + Math.sin(G.time * .9) * 14, my = follow ? L.bowlY - 96 : L.ty + 70 + Math.sin(G.time * 2.1) * 10;
  moth.x = lerp(moth.x, mx, 1 - Math.exp(-dt * 3)); moth.y = lerp(moth.y, my, 1 - Math.exp(-dt * 3));
}
function nextNeeded() {
  const b = K.bowl, o = K.order; if (!b || !o || b.done || b.wrong || b.missed) return -1;
  if (!b.base) return ST.findIndex(s => s.id === o.base);
  const t = TOPS.find(t => (b.tops[t] || 0) < (o.tops[t] || 0)); return t ? ST.findIndex(s => s.id === t) : -1;
}
function tag(g, text, x, y, col = INK, a = 1, fs = 14) {
  g.font = `700 ${fs}px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = g.measureText(text).width + 18; g.globalAlpha = a;
  g.fillStyle = 'rgba(40,22,12,.25)'; rr(g, x - w / 2 + 1.5, y - 10, w, 23, 11.5); g.fill();
  g.fillStyle = PAPER; rr(g, x - w / 2, y - 12, w, 23, 11.5); g.fill(); g.fillStyle = col; g.fillText(text, x, y + .5); g.globalAlpha = 1;
}
function frame(dt) {
  if (!L || !SPR) return;
  update(dt);
  const t = G.time, g = cx; g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(SPR.back, 0, 0, VW, L.backH);
  g.drawImage(SPR.counter, 0, L.beltY, VW, L.beltH + L.stH);
  /* the runner's weave slides along with the bowl */
  g.fillStyle = 'rgba(201,70,59,.6)'; const ry = L.beltY + 129;
  for (let x = wrap(K.runner, 46) - 46; x < VW + 46; x += 46) { g.beginPath(); g.moveTo(x, ry - 6); g.lineTo(x + 6, ry); g.lineTo(x, ry + 6); g.lineTo(x - 6, ry); g.fill(); }
  /* the bell at the pass */
  g.save(); g.translate(VW - 44, L.beltY + 94); g.fillStyle = 'rgba(60,35,20,.24)'; ell(g, 2, 2, 30, 6); g.fill(); g.fillStyle = '#6e4628'; rr(g, -28, -6, 56, 8, 3); g.fill();
  g.rotate(Math.sin(t * 38) * .16 * K.bell); let gr = g.createLinearGradient(-24, 0, 24, 0); gr.addColorStop(0, '#f6d27a'); gr.addColorStop(.5, '#d9a03c'); gr.addColorStop(1, '#a8742a'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, -6, 24, 22, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#a8742a'; g.fillRect(-2.5, -36, 5, 9); g.beginPath(); g.arc(0, -37, 4.5, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; ell(g, -10, -17, 4, 8); g.fill(); g.restore();
  drawTicket(g);
  if (K.bowl) drawBowl(g, K.bowl, K.bowl.x, L.bowlY);
  /* flames, steam, labels */
  for (const c of [L.cells[0], L.cells[1]]) for (let k = 0; k < 9; k++) { const fx = c.x + (k - 4) * 10, fy = c.y + 49 - (1 - Math.pow((k - 4) / 4, 2)) * -4, fh = 7 + 3 * Math.sin(t * 15 + k * 2.1 + c.x) * (G.RM ? 0 : 1); g.fillStyle = 'rgba(104,170,255,.9)'; g.beginPath(); g.moveTo(fx - 3.4, fy); g.quadraticCurveTo(fx, fy - fh * 2, fx + 3.4, fy); g.fill(); g.fillStyle = 'rgba(222,242,255,.9)'; g.beginPath(); g.moveTo(fx - 1.5, fy); g.quadraticCurveTo(fx, fy - fh, fx + 1.5, fy); g.fill(); }
  for (const p of K.steam) { g.fillStyle = `rgba(255,252,244,${p.life * .16})`; g.beginPath(); g.arc(p.x, p.y, p.s, 0, TAU); g.fill(); }
  const want = K.state === 'play' && K.n < 2 ? nextNeeded() : -1;
  L.cells.forEach((c, i) => {
    if (i === want) { const pu = .5 + .5 * Math.sin(t * 5); g.strokeStyle = `rgba(255,236,170,${.55 + .4 * pu})`; g.lineWidth = 4; ell(g, c.x, c.y + 4, 66 + pu * 5, 50 + pu * 4); g.stroke(); }
    tag(g, ST[i].label, c.x, c.y + L.ch * .44 - 6, INK, K.held && K.held.from === i ? .6 : 1, L.wide ? 14 : 13.5);
  });
  if (K.state === 'play' && !K.acted && K.bowl && K.bowl.x > 40) tag(g, 'Drag the ladle to the bowl', clamp(L.cells[0].x + 30, 110, VW - 110), L.cells[0].y - 84, INK, 1, 14);
  for (const p of K.parts) { g.fillStyle = p.c; g.globalAlpha = Math.min(1, p.life * 2.5); g.beginPath(); g.arc(p.x, p.y, p.s, 0, TAU); g.fill(); } g.globalAlpha = 1;
  if (K.held) drawHeld(g, K.held);
  for (const s of K.says) tag(g, s.text, s.x, s.y, s.col, Math.min(1, s.life * 2), 15);
  /* the moth, and lamplight over the counter */
  g.globalCompositeOperation = 'lighter'; glow(g, moth.x, moth.y, 50, '255,214,130', .45 + .1 * Math.sin(t * 6));
  glow(g, VW / 2, L.beltY - 30, Math.max(520, VW * .6), '255,186,104', .13); g.globalCompositeOperation = 'source-over';
  { const f = G.RM ? .6 : Math.abs(Math.sin(t * 17)); g.fillStyle = 'rgba(255,246,214,.94)'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(moth.x + d * (2 + 4.5 * f), moth.y - 2, 1.6 + 5 * f, 5.4, d * .5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(moth.x + d * (1.5 + 3 * f), moth.y + 4, 1.2 + 3 * f, 3.4, d * -.4, 0, TAU); g.fill(); } g.fillStyle = '#ffd874'; ell(g, moth.x, moth.y, 2.2, 4.6); g.fill(); }
  G.paper(g, .42);
}

/* ------------------------------------------------------------------ input and wiring */
const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
cv.addEventListener('pointerdown', e => {
  if (!active || K.state !== 'play') return;
  const [x, y] = pt(e), i = L.cells.findIndex(c => Math.abs(x - c.x) < c.w / 2 && Math.abs(y - (c.y + 8)) < c.h / 2); if (i < 0) return;
  K.held = { id: ST[i].id, x, y, lift: e.pointerType === 'mouse' ? 6 : 54, from: i }; sfx.pick();
  try { cv.setPointerCapture(e.pointerId); } catch (_) { /* fine without capture */ }
  e.preventDefault();
});
cv.addEventListener('pointermove', e => { if (active && K.held) [K.held.x, K.held.y] = pt(e); });
cv.addEventListener('pointerup', () => {
  if (!active || !K.held) return; const h = K.held, b = K.bowl; K.held = null;
  if (b && Math.abs(h.x - b.x) < 108 && Math.abs(h.y - h.lift - (L.bowlY + 10)) < 88) add(h.id);
});
cv.addEventListener('pointercancel', () => { K.held = null; });
addEventListener('keydown', e => { if (!active || K.state !== 'play' || e.metaKey || e.ctrlKey) return; const i = '123456'.indexOf(e.key); if (i >= 0) add(ST[i].id); });
$('kstart').addEventListener('click', () => { K.state = 'play'; $('kintro').hidden = true; tone(660, .08, 'sine', .05); });
$('kleave').addEventListener('click', () => G.go('road', { atDoor: true }));
$('kback').addEventListener('click', () => { $('kwin').hidden = true; K.endless = true; K.state = 'play'; hud(); G.go('road', { atDoor: true }); });
$('kmore').addEventListener('click', () => { $('kwin').hidden = true; K.endless = true; K.state = 'play'; hud(); });
const soundLabel = () => { $('ksound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('ksound').setAttribute('aria-pressed', G.sound); };
$('ksound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });

G.scenes.kitchen = {
  frame, resize: layout,
  enter() {
    active = true; $('kui').hidden = false; layout();
    if (!K.order) { K.order = makeOrder(0); K.bowl = newBowl(); }
    $('kintro').hidden = K.state !== 'intro'; $('kwin').hidden = K.state !== 'won'; hud(); announce(); soundLabel();
    if (document.fonts && document.fonts.load) { document.fonts.load(`700 14px Nunito`); document.fonts.load(`italic 600 21px Fraunces`); }
  },
  leave() { active = false; K.held = null; $('kui').hidden = true; },
  debug: { K, add, start() { $('kstart').click(); } }
};
})();
