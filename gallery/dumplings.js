/* The dumpling place. Find the things that are always there, order the usual, mix the dipping sauce,
   then carry each dumpling to your plate without dropping it, and finish with the scallion noodles. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, hex, mix, rgb, TAU, R, dab, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif', DISPLAY = '"Fraunces", "Iowan Old Style", Georgia, serif';
const INK = '#2c2a3d', PAPER = '#fbf3df', SKIN = '#c99a74', HAIR = '#17141a';
const FIND = [
  { id: 'cat', clue: 'While we wait: find the gold one that never stops waving.' },
  { id: 'lantern', clue: 'Find something red hanging from the ceiling.' },
  { id: 'tree', clue: 'Find the tree that never comes down.' },
  { id: 'sign', clue: 'Find the sign that sends us to the ATM.' },
  { id: 'vinegar', clue: 'Find the black vinegar.' },
  { id: 'chili', clue: 'Find the chili oil.' }
];
const SLOTS = [[-36, -8], [-12, -15], [14, -13], [38, -5], [-25, 8], [1, 7], [27, 10], [-50, 3]];
let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false;
const fresh = () => ({ phase: 'look', fi: 0, idle: 0, pop: {}, order: 0, arrive: 0, vin: 0, chi: 0, shots: [], dump: [], held: null, grip: 1, hover: 0, eaten: 0, face: 'smile', faceT: 0, steal: null, stolen: 0, slurp: 0, slurping: false, wait: 0, cool: 0 });
let D = fresh();
const parts = [], says = [], moth = { x: 60, y: 200 };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };

/* ------------------------------------------------------------------ the room */
function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S;
  const wide = VW >= 760, cxm = VW / 2, ty = VH - 400, fx = wide ? cxm - 410 : 6, ftop = ty - (wide ? 146 : 236);
  L = { wide, cxm, ty, fridge: { x: fx, w: 136, top: ftop },
    cat: { x: fx + 40, y: ftop }, tree: { x: fx + 104, y: ftop },
    sign: { x: wide ? cxm + 330 : VW - 62, y: wide ? ty - 210 : ty - 300 },
    lanterns: wide ? [[cxm - 250, 120], [cxm + 200, 90], [cxm + 470, 130]] : [[VW * .46, 124], [VW * .9, 96]],
    bowl: { x: cxm + 14, y: ty + 104 }, noodle: { x: cxm - 122, y: ty + 76 }, dish: { x: cxm - 66, y: ty + 236 },
    vinegar: { x: cxm + 150, y: ty + 150 }, chili: { x: cxm + 118, y: ty + 250 }, plate: { x: cxm + 24, y: VH - 20 } };
  const key = `${Math.round(VW)}x${Math.round(VH)}`; if (!SPR || SPR.key !== key) SPR = { key, room: G.spr(VW, VH, drawRoom, clamp(S * G.DPR, 1, 2.5)) };
  $('dui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function drawRoom(g, w, h) {
  const r = R(888), ty = L.ty, cxm = L.cxm;
  /* wood-panelled wall */
  g.fillStyle = '#c98a45'; g.fillRect(0, 0, w, ty + 12);
  for (let i = 0; i < w * .5; i++) dab(g, r() * w, r() * ty, 8 + r() * 26, 30 + r() * 90, (r() - .5) * .08, r() < .5 ? '#d9a05a' : '#b3742f', .16);
  g.globalAlpha = 1; g.lineCap = 'round';
  for (let i = 0; i < w * 1.3; i++) { const x = r() * w, y = r() * ty, l = 40 + r() * 170; g.strokeStyle = r() < .55 ? 'rgba(140,82,30,.3)' : 'rgba(240,188,112,.3)'; g.lineWidth = .7 + r() * 1.5; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + (r() - .5) * 16, y + l * .3, x + (r() - .5) * 16, y + l * .7, x + (r() - .5) * 8, y + l); g.stroke(); }
  for (let x = 60 + r() * 60; x < w; x += 150 + r() * 80) { const y = 80 + r() * (ty - 240); g.strokeStyle = 'rgba(130,74,26,.3)'; g.lineWidth = 1.3; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(x - k * 7, y + 150); g.bezierCurveTo(x - k * 7, y + 60 - k * 12, x + k * 7, y + 60 - k * 12, x + k * 7, y + 150); g.stroke(); } }
  for (let x = 86; x < w; x += 172) { g.fillStyle = 'rgba(96,52,16,.4)'; g.fillRect(x, 0, 1.6, ty); g.fillStyle = 'rgba(255,214,150,.22)'; g.fillRect(x + 1.6, 0, 1.4, ty); }
  let gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,236,190,0)'); gr.addColorStop(.3, 'rgba(255,236,190,.12)'); gr.addColorStop(.42, 'rgba(255,236,190,0)'); gr.addColorStop(.72, 'rgba(255,236,190,.1)'); gr.addColorStop(.84, 'rgba(255,236,190,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, ty);
  g.fillStyle = '#b3742f'; g.fillRect(0, ty - 128, w, 18); g.fillStyle = 'rgba(255,220,160,.5)'; g.fillRect(0, ty - 128, w, 2.4); g.fillStyle = 'rgba(80,40,10,.3)'; g.fillRect(0, ty - 110, w, 3); g.fillStyle = '#d9b25c'; g.fillRect(0, ty - 121, w, 3);
  /* drop ceiling with a strip light */
  g.fillStyle = '#ece6d6'; g.fillRect(0, 0, w, 52); g.strokeStyle = 'rgba(120,110,90,.3)'; g.lineWidth = 1; for (let x = (cxm % 86) - 86; x < w; x += 86) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 52); g.stroke(); }
  g.beginPath(); g.moveTo(0, 26); g.lineTo(w, 26); g.stroke(); g.fillStyle = 'rgba(70,40,20,.3)'; g.fillRect(0, 52, w, 4);
  g.fillStyle = '#fffdf0'; rr(g, cxm - 122, 4, 158, 20, 3); g.fill();
  gr = g.createLinearGradient(0, 52, 0, 300); gr.addColorStop(0, 'rgba(255,244,210,.22)'); gr.addColorStop(1, 'rgba(255,244,210,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(cxm - 150, 52); g.lineTo(cxm + 70, 52); g.lineTo(cxm + 220, 300); g.lineTo(cxm - 300, 300); g.fill();
  /* the drinks fridge the lucky cat sits on */
  const f = L.fridge; g.fillStyle = 'rgba(50,25,10,.3)'; g.fillRect(f.x + 6, f.top + 6, f.w, ty - f.top);
  g.fillStyle = '#1c1b20'; rr(g, f.x, f.top, f.w, ty - f.top + 20, 5); g.fill(); g.fillStyle = '#34353c'; g.fillRect(f.x, f.top, f.w, 5);
  const rows = L.wide ? 2 : 3; g.fillStyle = '#f4f1e6'; rr(g, f.x + 10, f.top + 22, f.w - 20, rows * 46 + 12, 3); g.fill();
  const drinks = ['#e2572c', '#3f8f4a', '#d9a03c', '#3f6fa8', '#c7301c', '#6fa83f', '#e9c15a', '#8a5a34'];
  for (let i = 0; i < rows * 4; i++) { const bx = f.x + 20 + (i % 4) * 27, by = f.top + 34 + ((i / 4) | 0) * 46; g.fillStyle = drinks[i % 8]; rr(g, bx, by + 8, 13, 26, 3); g.fill(); g.fillRect(bx + 4, by, 5, 9); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(bx + 2, by + 16, 9, 6); }
  g.fillStyle = '#6e6f78'; g.fillRect(f.x + f.w - 9, f.top + 30, 3, rows * 40);
  /* the chair across the table */
  g.fillStyle = '#8a2d22'; rr(g, cxm - 84, ty - 176, 168, 190, 10); g.fill(); g.fillStyle = 'rgba(255,190,150,.2)'; rr(g, cxm - 84, ty - 176, 168, 7, 4); g.fill();
  /* the floral tablecloth */
  g.fillStyle = 'rgba(50,25,10,.4)'; g.fillRect(0, ty - 5, w, 8);
  gr = g.createLinearGradient(0, ty, 0, h); gr.addColorStop(0, '#ece4cb'); gr.addColorStop(1, '#f6f0dc'); g.fillStyle = gr; g.fillRect(0, ty, w, h - ty);
  g.strokeStyle = 'rgba(200,174,84,.5)'; g.lineWidth = 5; for (let y = ty + 14; y < h + 20; y += 27) { g.beginPath(); for (let x = -10; x <= w + 10; x += 10) g.lineTo(x, y + Math.sin(x * .09 + y * .4) * 5); g.stroke(); }
  for (let i = 0; i < w * (h - ty) / 9000; i++) {
    const x = r() * w, y = ty + 16 + r() * (h - ty - 20), col = r() < .6 ? '#9a5a8a' : '#cf93ae';
    g.strokeStyle = 'rgba(80,66,74,.75)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 20, y + 12); g.quadraticCurveTo(x - 6, y + 2, x + 16, y - 8); g.moveTo(x - 4, y + 2); g.lineTo(x + 6, y + 14); g.stroke();
    for (let k = 0; k < 4; k++) dab(g, x - 18 + k * 10 + r() * 4, y + 9 - k * 5 + r() * 4, 4, 2, r() * 3, '#5d4f58', .8);
    for (const [fx, fy, fs] of [[0, 0, 1], [18, -10, .7], [-14, 10, .6]]) { for (let p = 0; p < 5; p++) dab(g, x + fx + Math.cos(p * 1.26) * 5 * fs, y + fy + Math.sin(p * 1.26) * 5 * fs, 4.6 * fs, 3.4 * fs, p, col, .9); dab(g, x + fx, y + fy, 2 * fs, 2 * fs, 0, '#f4e0a0', 1); }
    g.globalAlpha = 1;
  }
  gr = g.createLinearGradient(0, ty, 0, ty + 30); gr.addColorStop(0, 'rgba(70,40,20,.25)'); gr.addColorStop(1, 'rgba(70,40,20,0)'); g.fillStyle = gr; g.fillRect(0, ty, w, 30);
  /* water pitcher and cups; chopsticks in their green sleeves */
  const px = L.wide ? cxm - 330 : 34, py = ty + 78;
  g.fillStyle = 'rgba(60,40,20,.2)'; ell(g, px + 4, py + 2, 44, 9); g.fill();
  g.fillStyle = 'rgba(120,170,220,.5)'; g.beginPath(); g.moveTo(px - 36, py - 104); g.lineTo(px - 32, py); g.lineTo(px + 32, py); g.lineTo(px + 36, py - 104); g.closePath(); g.fill(); g.fillStyle = 'rgba(190,220,245,.55)'; g.fillRect(px - 34, py - 70, 68, 68);
  g.strokeStyle = 'rgba(235,245,255,.9)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(px - 36, py - 104); g.lineTo(px - 32, py); g.lineTo(px + 32, py); g.lineTo(px + 36, py - 104); g.stroke(); g.fillStyle = '#5f9fd8'; rr(g, px - 40, py - 114, 80, 12, 4); g.fill();
  for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.2; g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(px + 50, py + 34 - i * 7 - 44); g.lineTo(px + 54, py + 34 - i * 7); g.lineTo(px + 86, py + 34 - i * 7); g.lineTo(px + 90, py + 34 - i * 7 - 44); g.closePath(); g.fill(); g.stroke(); }
  const sx = L.wide ? cxm - 260 : 24, sy = ty + 322;
  for (const [dx, dy, a] of [[0, 0, -.12], [14, 12, -.05]]) { g.save(); g.translate(sx + dx, sy + dy); g.rotate(a); g.fillStyle = '#f7f4ea'; rr(g, 0, 0, 120, 13, 2); g.fill(); g.fillStyle = '#4f9a54'; g.fillRect(0, 0, 44, 13); g.fillStyle = '#f7f4ea'; for (let k = 0; k < 3; k++) g.fillRect(8 + k * 11, 3, 6, 7); g.fillStyle = '#e6cf9c'; g.fillRect(118, 3, 26, 3); g.fillRect(118, 8, 26, 3); g.restore(); }
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
  /* the waving paw */
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
function bowl(g, x, y, rx) {
  const ry = rx * .46;
  g.fillStyle = 'rgba(60,40,20,.25)'; ell(g, x + 5, y + ry * 1.5, rx * .86, ry * .5); g.fill();
  g.fillStyle = '#17161a'; g.beginPath(); g.moveTo(x - rx, y); g.bezierCurveTo(x - rx, y + ry * 1.4, x - rx * .5, y + ry * 1.9, x - rx * .34, y + ry * 1.9); g.lineTo(x + rx * .34, y + ry * 1.9); g.bezierCurveTo(x + rx * .5, y + ry * 1.9, x + rx, y + ry * 1.4, x + rx, y); g.closePath(); g.fill();
  g.fillStyle = '#26252b'; ell(g, x, y, rx, ry); g.fill(); g.fillStyle = '#0f0f12'; ell(g, x, y + 2, rx - 6, ry - 4); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1.6; ell(g, x, y, rx - 2, ry - 1.4, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
}
function dumpling(g, x, y, rot, dip, top, sc = 1) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
  const gr = g.createLinearGradient(0, -12, 0, 10); gr.addColorStop(0, '#fbf2dc'); gr.addColorStop(1, '#e2cfa6');
  g.fillStyle = gr; g.beginPath(); g.moveTo(-20, 3); g.bezierCurveTo(-18, -14, 18, -14, 20, 3); g.bezierCurveTo(12, 11, -12, 11, -20, 3); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(150,120,70,.55)'; g.lineWidth = 1.1; g.lineCap = 'round'; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 5, -9 + Math.abs(i) * 1.2); g.lineTo(i * 5.6, -3 + Math.abs(i)); g.stroke(); }
  if (dip > 0) { g.save(); g.beginPath(); g.moveTo(-20, 3); g.bezierCurveTo(-18, -14, 18, -14, 20, 3); g.bezierCurveTo(12, 11, -12, 11, -20, 3); g.clip(); g.fillStyle = `rgba(110,30,14,${.6 * dip})`; g.fillRect(-22, -2, 44, 16); g.fillStyle = `rgba(214,60,24,${.8 * dip})`; for (const [fx, fy] of [[-10, 3], [-2, 6], [7, 2], [13, 5], [-15, 5]]) g.fillRect(fx, fy, 2.2, 1.6); g.restore(); }
  if (top) { for (const [fx, fy, c] of [[-8, -4, '#8e3a1c'], [3, -6, '#a8461e'], [10, -2, '#7a2a14'], [-2, -1, '#4f9a44'], [6, -8, '#6fb04e'], [-11, -7, '#4f9a44']]) { g.fillStyle = c; g.fillRect(fx, fy, 3.4, 2.6); } }
  g.restore();
}
function friend(g, t) {
  const x = L.cxm, hy = L.ty - 132, ty = L.ty, f = D.face, blink = !G.RM && (t % 3.7) < .12;
  g.fillStyle = HAIR; g.beginPath(); g.moveTo(x - 40, hy - 16); g.bezierCurveTo(x - 54, hy - 64, x + 54, hy - 64, x + 40, hy - 16); g.bezierCurveTo(x + 60, hy + 30, x + 52, hy + 100, x + 66, ty + 12); g.lineTo(x - 66, ty + 12); g.bezierCurveTo(x - 52, hy + 100, x - 60, hy + 30, x - 40, hy - 16); g.closePath(); g.fill();
  const sw = g.createLinearGradient(x - 90, 0, x + 90, 0); sw.addColorStop(0, '#b3242e'); sw.addColorStop(1, '#8e1a24');
  g.fillStyle = sw; g.beginPath(); g.moveTo(x - 96, ty + 14); g.quadraticCurveTo(x - 92, ty - 52, x - 38, ty - 66); g.lineTo(x + 38, ty - 66); g.quadraticCurveTo(x + 92, ty - 52, x + 96, ty + 14); g.closePath(); g.fill();
  g.fillStyle = SKIN; g.fillRect(x - 12, hy + 28, 24, 30); g.fillStyle = '#9a1c26'; ell(g, x, ty - 66, 22, 9); g.fill(); g.fillStyle = SKIN; ell(g, x, ty - 70, 13, 6); g.fill();
  g.fillStyle = SKIN; ell(g, x, hy, 33, 39); g.fill();
  /* hair falling either side of a centre part */
  g.fillStyle = HAIR; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(x, hy - 41); g.bezierCurveTo(x + d * 30, hy - 46, x + d * 42, hy - 12, x + d * 37, hy + 16); g.bezierCurveTo(x + d * 31, hy - 6, x + d * 18, hy - 27, x, hy - 33); g.fill(); }
  g.lineCap = 'round'; for (const d of [-1, 1]) { g.strokeStyle = HAIR; g.lineWidth = 17; g.beginPath(); g.moveTo(x + d * 36, hy + 8); g.bezierCurveTo(x + d * 40, hy + 50, x + d * 34, ty - 50, x + d * 46, ty + 6); g.stroke(); g.strokeStyle = 'rgba(96,88,116,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + d * 38, hy + 10); g.bezierCurveTo(x + d * 43, hy + 50, x + d * 37, ty - 50, x + d * 48, ty); g.stroke(); }
  g.strokeStyle = '#e9c15a'; g.lineWidth = 2; for (const d of [-1, 1]) { g.beginPath(); g.arc(x + d * 31, hy + 20, 4.6, 0, TAU); g.stroke(); }
  /* face */
  g.strokeStyle = '#231a1c'; g.lineWidth = 2.2; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(x + d * 7, hy - 9); g.quadraticCurveTo(x + d * 14, hy - 13, x + d * 21, hy - 9); g.stroke(); }
  for (const d of [-1, 1]) {
    if (f !== 'smile' || blink) { g.strokeStyle = '#231a1c'; g.lineWidth = 2.2; g.beginPath(); g.arc(x + d * 13, hy + 3, 5, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    else { g.fillStyle = '#2b1c18'; ell(g, x + d * 13, hy + 1, 3.8, 4.8); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + d * 13 + 1.2, hy - .6, 1.3, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(214,96,86,.3)'; ell(g, x + d * 19, hy + 13, 7, 4.4); g.fill();
  }
  g.strokeStyle = 'rgba(120,70,50,.6)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 1, hy + 8); g.quadraticCurveTo(x + 2.4, hy + 12, x - 1, hy + 13); g.stroke();
  if (f === 'laugh') { g.fillStyle = '#7a1c24'; g.beginPath(); g.moveTo(x - 10, hy + 20); g.quadraticCurveTo(x, hy + 36, x + 10, hy + 20); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 7, hy + 20, 14, 3); }
  else if (f === 'yum') { g.fillStyle = SKIN; ell(g, x + 15, hy + 20, 8, 7); g.fill(); g.strokeStyle = '#8e3a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 7, hy + 23); g.quadraticCurveTo(x, hy + 27, x + 7, hy + 22); g.stroke(); }
  else { g.strokeStyle = '#8e3a3a'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x - 9, hy + 21); g.quadraticCurveTo(x, hy + 29, x + 9, hy + 21); g.stroke(); }
}
function stealPose() {
  /* where her chopsticks are, and whether they are carrying something */
  const rest = [L.cxm + 78, L.ty + 4], st = D.steal; if (!st) return { x: rest[0], y: rest[1], carry: false };
  const d = D.dump[st.i], from = [L.bowl.x + d.sx, L.bowl.y + d.sy - 8], mouth = [L.cxm + 6, L.ty - 104], p = st.t;
  if (p < .4) { const k = sm(p, 0, .4); return { x: lerp(rest[0], from[0], k), y: lerp(rest[1], from[1], k), carry: false, reach: true }; }
  if (p < .9) { const k = sm(p, .48, .9); return { x: lerp(from[0], mouth[0], k), y: lerp(from[1], mouth[1], k), carry: true, reach: true }; }
  const k = sm(p, .9, 1); return { x: lerp(mouth[0], rest[0], k), y: lerp(mouth[1], rest[1], k), carry: false };
}
function sauceCol() { const n = D.vin + D.chi; return n ? mix(hex('#2a1812'), hex('#b02a16'), D.chi / n * .85) : hex('#2a1812'); }

/* ------------------------------------------------------------------ play */
function say(text, x, y) { says.push({ text, x: clamp(x, 100, VW - 100), y, life: 2.2 }); }
function burst(x, y, cols, n) { if (G.RM) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 30 + Math.random() * 110; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: .7, c: cols[Math.random() * cols.length | 0], s: 1.5 + Math.random() * 2.2 }); } }
function face(f, d = 1.3) { D.face = f; D.faceT = d; }
function setStep() {
  const p = D.phase, left = 6 - D.eaten;
  $('dstep').textContent = p === 'look' ? FIND[D.fi].clue : p === 'order' ? 'The usual: scallion dumplings and scallion noodles.' : p === 'sauce' ? 'Mix your dipping sauce. Tap the black vinegar and the chili oil.' : p === 'eat' ? `Pick up a dumpling, dip it, and bring it to your plate. Go slowly, they slip. ${left} to go.` : p === 'noodles' ? 'Now the scallion noodles. Hold the bowl to slurp.' : 'All gone.';
  $('dnext').hidden = !(p === 'sauce' && D.vin + D.chi >= 2);
}
function spot(id) {
  if (id === 'cat') return [L.cat.x, L.cat.y - 44, 34, 50]; if (id === 'tree') return [L.tree.x, L.tree.y - 46, 34, 52];
  if (id === 'lantern') return [L.lanterns[0][0], 52 + L.lanterns[0][1], 36, 44]; if (id === 'sign') return [L.sign.x, L.sign.y, 58, 40];
  if (id === 'vinegar') return [L.vinegar.x, L.vinegar.y - 44, 30, 54]; return [L.chili.x, L.chili.y - 28, 34, 38];
}
function found() {
  const id = FIND[D.fi].id, [x, y] = spot(id); D.pop[id] = 1; D.idle = 0; burst(x, y, ['#fff6da', '#ffd27a', '#f7a8c4'], 16);
  tone(988, .14, 'sine', .07); tone(1319, .3, 'sine', .06, .09); if (id === 'cat') tone(2637, .5, 'sine', .04, .2);
  if (++D.fi >= FIND.length) { D.phase = 'order'; D.order = 0; face('yum', 2); }
  setStep();
}
function addSauce(k) {
  if (D.vin + D.chi >= 8) { say("That's plenty.", L.dish.x, L.dish.y - 50); return; }
  const from = k === 'v' ? L.vinegar : L.chili; D.shots.push({ k, t: 0, x0: from.x - (k === 'v' ? 4 : 0), y0: from.y - (k === 'v' ? 92 : 50) }); D.pop[k === 'v' ? 'vinegar' : 'chili'] = 1;
  if (k === 'v') tone(520, .16, 'sine', .05, 0, .5); else tone(300, .08, 'triangle', .05);
}
function eat(d) { d.state = 'eaten'; D.held = null; D.eaten++; tone(330, .07, 'sine', .08); tone(262, .09, 'sine', .08, .08); burst(L.plate.x, L.plate.y - 30, ['#fbf2dc', '#b02a16', '#6fb04e'], 10); say(['Mmm.', 'So good.', 'One more.', 'Yes.', 'Perfect.', 'Last one.'][Math.min(5, D.eaten - 1)], L.plate.x, L.plate.y - 80); face('yum'); setStep(); }
function dropIt() { const d = D.dump[D.held.i]; d.state = 'fall'; d.ft = 0; d.x = D.held.x; d.y = D.held.y; D.held = null; D.grip = 1; tone(196, .12, 'triangle', .07, 0, .7); say('Slippery.', d.x, d.y - 40); face('laugh', 1.6); [660, 590, 520].forEach((f, i) => tone(f, .07, 'triangle', .035, .15 + i * .1)); }
function finish() { $('ddone').hidden = false; $('dagain').focus(); [784, 988, 1175, 1568].forEach((f, i) => tone(f, .5, 'sine', .07, i * .13)); }
function update(dt) {
  const t = G.time, p = D.phase;
  for (const k in D.pop) D.pop[k] = Math.max(0, D.pop[k] - dt * .9);
  if (D.faceT > 0) { D.faceT -= dt; if (D.faceT <= 0) D.face = 'smile'; }
  D.cool -= dt;
  if (p === 'look') D.idle += dt;
  if (p === 'order') { D.order += dt; if (D.order > 2.6) { D.arrive = Math.min(1, D.arrive + dt * 1.6); if (D.arrive >= 1) { D.dump = SLOTS.map(([sx, sy], i) => ({ sx, sy, state: 'bowl', dip: 0, rot: (R(i + 3)() - .5) * .9 })); D.phase = 'sauce'; setStep(); tone(1568, .4, 'sine', .06); } } }
  for (let i = D.shots.length - 1; i >= 0; i--) { const s = D.shots[i]; s.t += dt / .42; if (s.t >= 1) { D.shots.splice(i, 1); if (s.k === 'v') D.vin++; else D.chi++; burst(L.dish.x, L.dish.y, [rgb(sauceCol())], 6); tone(240, .08, 'sine', .06, 0, .7); setStep(); } }
  if (p === 'eat') {
    const h = D.held;
    if (h) {
      h.v *= Math.exp(-dt * 7); D.grip = clamp(D.grip + dt * .9 - Math.max(0, h.v - 480) / 260 * dt, 0, 1);
      const d = D.dump[h.i], inDish = Math.hypot(h.x - L.dish.x, (h.y - L.dish.y) * 1.6) < 34;
      if (inDish && d.dip < 1) { D.hover += dt; if (D.hover > .28) { d.dip = 1; tone(240, .1, 'sine', .07, 0, .7); burst(h.x, h.y, [rgb(sauceCol())], 8); } } else if (!inDish) D.hover = 0;
      if (Math.abs(h.x - L.plate.x) < 112 && h.y > L.plate.y - 58) { if (d.dip >= 1) eat(d); else if (D.cool <= 0) { D.cool = 2; say('Dip it first.', h.x, h.y - 44); tone(300, .08, 'triangle', .04); } }
      else if (D.grip <= 0) dropIt();
    }
    for (const d of D.dump) if (d.state === 'fall') { d.ft += dt; if (d.ft > .9) { d.state = 'bowl'; d.dip = 0; } }
    if (!D.steal && ((D.eaten === 2 && D.stolen === 0) || (D.eaten === 4 && D.stolen === 1))) { const i = D.dump.findIndex((d, j) => d.state === 'bowl' && (!D.held || D.held.i !== j)); if (i >= 0) D.steal = { i, t: 0, said: false }; }
    if (D.steal) { const st = D.steal; st.t += dt / 1.9; if (st.t > .44 && !st.said) { st.said = true; D.dump[st.i].state = 'stolen'; D.stolen++; say('Mine.', L.bowl.x, L.bowl.y - 60); tone(880, .08, 'triangle', .05); } if (st.t > .88) face('yum', 1); if (st.t >= 1) D.steal = null; }
    if (!D.steal && !D.held && D.dump.length && D.dump.every(d => d.state === 'eaten' || d.state === 'stolen')) { D.phase = 'noodles'; setStep(); }
  }
  if (p === 'noodles' && D.slurping) { D.slurp = Math.min(1, D.slurp + dt / 3.4); if (!G.RM && Math.random() < dt * 9) tone(300 + D.slurp * 300 + Math.random() * 80, .12, 'sine', .03, 0, 1.6); if (D.slurp >= 1) { D.slurping = false; D.phase = 'done'; D.wait = 1.5; setStep(); face('yum', 3); } }
  if (p === 'done' && D.wait > 0) { D.wait -= dt; if (D.wait <= 0) finish(); }
  for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= dt; q.vy += 300 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) parts.splice(i, 1); }
  for (let i = says.length - 1; i >= 0; i--) { const q = says[i]; q.life -= dt; q.y -= 12 * dt; if (q.life <= 0) says.splice(i, 1); }
  moth.x = lerp(moth.x, (L.wide ? L.cxm + 150 : VW - 70) + Math.sin(t * .8) * 14, 1 - Math.exp(-dt * 2)); moth.y = lerp(moth.y, L.ty - 180 + Math.sin(t * 2.1) * 10, 1 - Math.exp(-dt * 2));
}
function tag(g, text, x, y, a) {
  g.font = `700 14.5px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(text).width + 20; g.globalAlpha = a;
  g.fillStyle = 'rgba(40,22,12,.25)'; rr(g, x - w / 2 + 1.5, y - 10.5, w, 25, 12.5); g.fill(); g.fillStyle = PAPER; rr(g, x - w / 2, y - 12.5, w, 25, 12.5); g.fill(); g.fillStyle = INK; g.fillText(text, x, y + .5); g.globalAlpha = 1;
}
function sticks(g, x, y, fx, fy) { g.lineCap = 'round'; for (const o of [-3.4, 3.4]) { g.strokeStyle = '#b89a62'; g.lineWidth = 5; g.beginPath(); g.moveTo(fx + o * 2.4, fy); g.lineTo(x + o * .6, y); g.stroke(); g.strokeStyle = '#ecd8a8'; g.lineWidth = 3.2; g.stroke(); } }
function frame(dt) {
  if (!L || !SPR) return;
  update(dt);
  const t = G.time, g = cx, p = D.phase, ty = L.ty, q = SPR.room.width / VW, pop = id => D.pop[id] || 0;
  g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(SPR.room, 0, 0, VW, VH);
  for (const [i, [x, len]] of L.lanterns.entries()) lantern(g, x, len, t, i === 0 ? pop('lantern') : 0);
  cat(g, L.cat.x, L.cat.y, t, pop('cat')); tree(g, L.tree.x, L.tree.y, t, pop('tree')); sign(g, L.sign.x, L.sign.y, pop('sign'), t);
  friend(g, t);
  g.drawImage(SPR.room, 0, (ty - 6) * q, VW * q, (VH - ty + 6) * q, 0, ty - 6, VW, VH - ty + 6);
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
  if (p === 'order' && D.order < 2.9) { const a = sm(D.order, 0, .3) * (1 - sm(D.order, 2.5, 2.9)); g.save(); g.globalAlpha = a; g.translate(L.cxm, ty + 110); g.rotate(-.04); g.fillStyle = 'rgba(60,30,10,.25)'; rr(g, -97, -47, 200, 104, 4); g.fill(); g.fillStyle = '#fffdf4'; rr(g, -100, -50, 200, 104, 4); g.fill();
    g.fillStyle = '#5c5870'; g.font = `700 11px ${UI}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('TABLE FOR TWO', -84, -28); g.fillStyle = INK; g.font = `600 16px ${UI}`;
    if (D.order > .5) g.fillText('Scallion dumplings', -84, -2); if (D.order > 1.1) g.fillText('Scallion noodles', -84, 22); if (D.order > 1.7) { g.fillStyle = '#b8402e'; g.font = `italic 600 18px ${DISPLAY}`; g.fillText('the usual', 4, 44); } g.restore(); g.globalAlpha = 1; }
  if (D.arrive > 0) {
    g.globalAlpha = D.arrive; const dy = (1 - sm(D.arrive, 0, 1)) * -30, n = L.noodle, b = L.bowl;
    bowl(g, n.x, n.y + dy, 68);
    { g.save(); ell(g, n.x, n.y + 2 + dy, 60, 26); g.clip(); g.fillStyle = '#3a2416'; g.fillRect(n.x - 70, n.y - 30 + dy, 140, 70); const r = R(44), cnt = 3 + 30 * (1 - D.slurp); g.lineCap = 'round';
      for (let i = 0; i < cnt; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .82, x0 = n.x + Math.cos(a) * d * 56, y0 = n.y + 2 + dy + Math.sin(a) * d * 23, a2 = r() * TAU, l = 16 + r() * 16; for (const pass of [0, 1]) { g.strokeStyle = pass ? '#f3dea0' : '#b9944a'; g.lineWidth = pass ? 2.6 : 4.4; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + Math.cos(a2 + 1) * l * .6, y0 + Math.sin(a2 + 1) * l * .3, x0 + Math.cos(a2) * l, y0 + Math.sin(a2) * l * .45); g.stroke(); } }
      for (let i = 0; i < cnt * .8; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .8, x0 = n.x + Math.cos(a) * d * 54, y0 = n.y + dy + Math.sin(a) * d * 22; g.fillStyle = '#dcf0b4'; ell(g, x0, y0, 3.6, 2.4); g.fill(); g.strokeStyle = '#4f8f38'; g.lineWidth = 1.8; g.stroke(); }
      g.restore(); }
    bowl(g, b.x, b.y + dy, 86);
    for (const d of D.dump) if (d.state === 'bowl') dumpling(g, b.x + d.sx, b.y + d.sy + dy, d.rot, 0, true);
    g.globalAlpha = 1;
    /* the little sauce dish, and her paper plate */
    const ds = L.dish; g.fillStyle = 'rgba(60,40,20,.2)'; ell(g, ds.x + 3, ds.y + 5, 38, 18); g.fill(); g.fillStyle = '#fbf8ee'; ell(g, ds.x, ds.y, 38, 19); g.fill(); g.fillStyle = '#e6e0d0'; ell(g, ds.x, ds.y + 1, 31, 14.5); g.fill();
    const amt = Math.min(1, (D.vin + D.chi) / 5); if (amt > 0) { g.fillStyle = rgb(sauceCol()); ell(g, ds.x, ds.y + 1.5, 10 + 19 * amt, 5 + 8 * amt); g.fill(); const r = R(31); for (let i = 0; i < D.chi * 5; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .8; g.fillStyle = r() < .5 ? '#e0802c' : '#d6401c'; g.fillRect(ds.x + Math.cos(a) * d * (9 + 18 * amt), ds.y + 1 + Math.sin(a) * d * (4 + 7 * amt), 2.2, 1.6); } g.fillStyle = 'rgba(255,255,255,.3)'; ell(g, ds.x - 6, ds.y - 1, 6, 2); g.fill(); }
  }
  if (p === 'eat' || p === 'noodles' || p === 'done') { const pl = L.plate; g.fillStyle = 'rgba(60,40,20,.2)'; ell(g, pl.x + 4, pl.y + 4, 112, 38); g.fill(); g.fillStyle = '#fdfbf4'; ell(g, pl.x, pl.y, 112, 38); g.fill(); g.strokeStyle = 'rgba(160,150,130,.4)'; g.lineWidth = 1.4; ell(g, pl.x, pl.y, 86, 27); g.stroke(); for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; g.beginPath(); g.moveTo(pl.x + Math.cos(a) * 90, pl.y + Math.sin(a) * 29); g.lineTo(pl.x + Math.cos(a) * 108, pl.y + Math.sin(a) * 36); g.stroke(); } }
  for (const s of D.shots) { const k = s.t, x = lerp(s.x0, L.dish.x, k), y = lerp(s.y0, L.dish.y, k) - Math.sin(k * Math.PI) * 90; g.fillStyle = s.k === 'v' ? '#2a1812' : '#b02a16'; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); g.beginPath(); g.arc(x + 5, y + 6, 2.6, 0, TAU); g.fill(); }
  for (const d of D.dump) if (d.state === 'fall') { const k = Math.min(1, d.ft / .9), bx = L.bowl.x + d.sx, by = L.bowl.y + d.sy; dumpling(g, lerp(d.x, bx, sm(k, .45, 1)), lerp(Math.min(d.y + 40, VH - 60), by, sm(k, .45, 1)) - Math.sin(sm(k, .45, 1) * Math.PI) * 60, d.rot + k * 3, d.dip, false); }
  /* her arm and chopsticks, reaching in when she steals one */
  { const sp = stealPose(), sx = L.cxm + 70, sy = ty - 40; g.lineCap = 'round'; g.strokeStyle = '#a01e28'; g.lineWidth = 21; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + 40, (sy + sp.y) / 2 + 10, sp.x + 12, sp.y - 8); g.stroke();
    if (sp.reach) sticks(g, sp.x - 4, sp.y + 14, sp.x + 20, sp.y - 30); else sticks(g, sp.x - 34, sp.y - 60, sp.x + 14, sp.y - 4);
    if (sp.carry) dumpling(g, sp.x - 5, sp.y + 16, D.dump[D.steal.i].rot, 0, true, .92);
    g.fillStyle = SKIN; g.beginPath(); g.arc(sp.x + 14, sp.y - 8, 11, 0, TAU); g.fill(); }
  /* noodles on the way up */
  if (p === 'noodles' && D.slurping) { const n = L.noodle, hx = n.x + 20, hy = n.y - 96 + Math.sin(t * 9) * 4; g.lineCap = 'round'; for (let i = 0; i < 7; i++) { const o = (i - 3) * 5; for (const pass of [0, 1]) { g.strokeStyle = pass ? '#f3dea0' : '#b9944a'; g.lineWidth = pass ? 2.6 : 4.4; g.beginPath(); g.moveTo(n.x + o * 2, n.y + 4); g.bezierCurveTo(n.x + o * 2 + Math.sin(t * 12 + i) * 6, n.y - 30, hx + o + Math.sin(t * 10 + i * 2) * 5, hy + 50, hx + o * .5, hy); g.stroke(); } } sticks(g, hx, hy, hx + 100, hy + 150); }
  if (D.held) { const h = D.held, d = D.dump[h.i], wob = (1 - D.grip) * Math.sin(t * 46) * .5; sticks(g, h.x, h.y + 2, h.x + 110, h.y + 170); dumpling(g, h.x + wob * 6, h.y, d.rot + wob, d.dip, d.dip < 1, 1.08); }
  for (const pt of parts) { g.fillStyle = pt.c; g.globalAlpha = Math.min(1, pt.life * 2.5); g.beginPath(); g.arc(pt.x, pt.y, pt.s, 0, TAU); g.fill(); } g.globalAlpha = 1;
  /* nudges */
  const pu = .5 + .5 * Math.sin(t * 5); g.strokeStyle = `rgba(255,250,220,${.55 + .4 * pu})`; g.lineWidth = 3.5;
  if (p === 'look' && D.idle > 11) { const [x, y, rx, ry] = spot(FIND[D.fi].id); ell(g, x, y, rx + 6 + pu * 4, ry + 6 + pu * 4); g.stroke(); }
  if (p === 'sauce' && D.vin + D.chi === 0) { for (const id of ['vinegar', 'chili']) { const [x, y, rx, ry] = spot(id); ell(g, x, y, rx + 4 + pu * 3, ry + 4 + pu * 3); g.stroke(); } }
  if (p === 'eat' && !D.held && D.eaten === 0) { ell(g, L.bowl.x, L.bowl.y, 92 + pu * 4, 46 + pu * 3); g.stroke(); }
  if (p === 'eat' && D.held) { const d = D.dump[D.held.i]; if (d.dip < 1) { ell(g, L.dish.x, L.dish.y, 44 + pu * 4, 24 + pu * 3); g.stroke(); } else { ell(g, L.plate.x, L.plate.y - 4, 96 + pu * 4, 30 + pu * 3, Math.PI, TAU); g.stroke(); } }
  if (p === 'noodles' && !D.slurping && D.slurp < .05) { ell(g, L.noodle.x, L.noodle.y, 74 + pu * 4, 38 + pu * 3); g.stroke(); }
  if (p === 'noodles' && D.slurp > 0) { g.fillStyle = PAPER; rr(g, L.noodle.x - 60, L.noodle.y + 66, 120, 12, 6); g.fill(); g.fillStyle = '#f2b45c'; rr(g, L.noodle.x - 57, L.noodle.y + 69, Math.max(8, 114 * D.slurp), 6, 3); g.fill(); }
  for (const s of says) tag(g, s.text, s.x, s.y, Math.min(1, s.life * 2));
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
  if (p === 'sauce') { if (hit('vinegar', x, y)) addSauce('v'); else if (hit('chili', x, y)) addSauce('c'); return; }
  if (p === 'eat' && !D.held) {
    let best = -1, bd = 34; D.dump.forEach((d, i) => { if (d.state !== 'bowl' || (D.steal && D.steal.i === i)) return; const dd = Math.hypot(x - (L.bowl.x + d.sx), y - (L.bowl.y + d.sy)); if (dd < bd) { bd = dd; best = i; } });
    if (best < 0 && Math.hypot(x - L.bowl.x, (y - L.bowl.y) * 2) < 90) best = D.dump.findIndex((d, i) => d.state === 'bowl' && !(D.steal && D.steal.i === i));
    if (best >= 0) { const lift = e.pointerType === 'mouse' ? 0 : 46; D.dump[best].state = 'held'; D.held = { i: best, x, y: y - lift, lift, v: 0, ts: e.timeStamp }; D.grip = 1; D.hover = 0; tone(620, .05, 'triangle', .04); try { cv.setPointerCapture(e.pointerId); } catch (_) { /* fine without capture */ } e.preventDefault(); }
    return;
  }
  if (p === 'noodles' && Math.hypot(x - L.noodle.x, (y - L.noodle.y) * 1.6) < 90) { D.slurping = true; try { cv.setPointerCapture(e.pointerId); } catch (_) { /* fine without capture */ } e.preventDefault(); }
});
cv.addEventListener('pointermove', e => {
  if (!active || !D.held) return; const [x, y0] = pt(e), h = D.held, y = y0 - h.lift, dtm = Math.max(.008, (e.timeStamp - h.ts) / 1000);
  h.v = lerp(h.v, Math.hypot(x - h.x, y - h.y) / dtm, .5); h.ts = e.timeStamp; h.x = x; h.y = y;
});
const letGo = () => { if (D.held) { const d = D.dump[D.held.i]; if (d.state === 'held') d.state = 'bowl'; D.held = null; } D.slurping = false; };
cv.addEventListener('pointerup', letGo); cv.addEventListener('pointercancel', letGo);
addEventListener('keydown', e => {
  if (!active || e.metaKey || e.ctrlKey || !$('ddone').hidden || (e.key !== ' ' && e.key !== 'Enter')) return; if (e.target && e.target.tagName === 'BUTTON') return; e.preventDefault();
  const p = D.phase;
  if (p === 'look') found(); else if (p === 'sauce') addSauce(D.vin <= D.chi ? 'v' : 'c');
  else if (p === 'eat' && !D.held && !e.repeat) { const d = D.dump.find((d, i) => d.state === 'bowl' && !(D.steal && D.steal.i === i)); if (d) { d.dip = 1; eat(d); } }
  else if (p === 'noodles') D.slurping = true;
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
  enter() { active = true; $('dui').hidden = false; layout(); setStep(); soundLabel(); moth.x = VW - 70; moth.y = L.ty - 180; if (document.fonts && document.fonts.load) { document.fonts.load('700 14px Nunito'); document.fonts.load('italic 600 18px Fraunces'); } },
  leave() { active = false; letGo(); $('dui').hidden = true; },
  debug: { get D() { return D; }, get L() { return L; }, get S() { return S; }, spot, found, addSauce }
};
})();
