/* The rooftop. Unpack the takeout, pour the right wine into the right glass, say cheers,
   stay while the evening falls, then answer the brick tower when it winks. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, hex, mix, rgb, wrap, TAU, R, dab, PAL, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif';
const INK = '#2c2a3d', PAPER = '#fbf3df', MISS = '#b8402e';
const WINE = { orange: '#e8a23a', red: '#7a1426' };
const NOTES = [523, 587, 659, 784, 880, 1047];
const FLASH = ['#ffd27a', '#ffb86b', '#ff9e7a', '#f7a8c4', '#b9c8ff', '#c8f0e0'].map(hex);
const P3 = (a, b, c) => [hex(a), hex(b), hex(c)];
const SKY = { top: P3('#5b86c9', '#4a6fba', '#1c2748'), mid: P3('#9cc0e8', '#93a6d6', '#33416f'), hor: P3('#f9dcab', '#f2b59c', '#6a6f98') };
const k3 = (k, e) => e < .5 ? mix(k[0], k[1], sm(e, 0, .5)) : mix(k[1], k[2], sm(e, .5, 1));
const STEP = {
  unpack: "Dinner's here. Tap the bag to unpack it.",
  pour: 'Pour the wine. Drag a bottle over a glass and hold it there.',
  cheers: 'Tap the glasses to say cheers.',
  dusk: 'Stay for the sunset.',
  tower: 'The tower is winking. Tap its windows in the same order.',
  free: "Tap the tower's windows to play them."
};
let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false;
const fgCv = document.createElement('canvas'), fg = fgCv.getContext('2d');
const T = { phase: 'unpack', e: .05, unpack: 0, fill: { j: 0, f: 0 }, held: null, pour: null, cheers: -1, clinked: false, seq: [], show: null, wait: 0, input: 0, round: 0, flash: [0, 0, 0, 0, 0, 0], says: [], parts: [], steam: [], sayCool: 0, plane: -1 };
const moth = { x: 100, y: 300 };
const Y = y => VH - y;
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };

/* ------------------------------------------------------------------ layout and sprites */
function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S;
  const wide = VW >= 760, cxm = wide ? VW / 2 - 40 : VW / 2 - 28, sp = wide ? 180 : 132, tw = wide ? 150 : 112, tx = VW - tw - (wide ? 70 : 6);
  const win = []; for (let i = 0; i < 6; i++) win.push({ x: tx + tw * .36 - 15, y: 352 + i * 46, w: 30, h: 30 });
  /* the far skyline, kept so that lights can twinkle on real buildings */
  const r = R(606), far = []; let x = -8;
  while (x < VW + 8) { const bw = 9 + r() * 20, bh = 26 + Math.pow(r(), 2.2) * 120 + 12 * Math.sin(x * .011); far.push({ x, w: bw, h: bh, t: r(), kind: 'box' }); x += bw - 1 + r() * 5; }
  for (const [f, bw, bh, kind] of [[.2, 8, 176, 'thin'], [.34, 9, 214, 'thin'], [.43, 12, 178, 'crown'], [.53, 8, 198, 'thin'], [.62, 7.5, 166, 'thin'], [.78, 24, 150, 'spire']]) far.push({ x: tx * f, w: bw, h: bh, t: r(), kind });
  L = { wide, cxm, sp, tw, tx, win, far, floor: 150, par: 205, rail: 362, base: 292, jx: cxm - sp, fx: cxm + sp,
    gj: { x: cxm - 54, y: 170 }, gf: { x: cxm + 54, y: 170 }, bo: { x: cxm - 19, y: 187 }, br: { x: cxm + 19, y: 187 }, bag: { x: cxm, y: 158 } };
  fgCv.width = cv.width; fgCv.height = cv.height;
  const key = `${Math.round(VW)}x${Math.round(VH)}`; if (!SPR || SPR.key !== key) build(key);
  $('rui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function build(key) {
  const q = clamp(S * G.DPR, 1, 2.5), mk = (w, h, f, a) => G.spr(w, h, (g, ww, hh) => f(g, ww, hh, a), q);
  SPR = { key, far: [mk(VW, 250, drawFar, false), mk(VW, 250, drawFar, true)], mid: [mk(VW, 130, drawMid, false), mk(VW, 130, drawMid, true)],
    tower: [mk(L.tw, 460, drawTower, false), mk(L.tw, 460, drawTower, true)], fg: mk(VW, L.rail + 14, drawDeck) };
}
function shape(g, b, h) {
  const top = h - b.h; g.fillRect(b.x, top, b.w, b.h);
  if (b.kind === 'spire') { g.fillRect(b.x + b.w * .22, top - b.h * .16, b.w * .56, b.h * .17); g.fillRect(b.x + b.w * .38, top - b.h * .26, b.w * .24, b.h * .11); g.fillRect(b.x + b.w * .47, top - b.h * .46, b.w * .06, b.h * .21); }
  else if (b.kind === 'crown') { g.beginPath(); g.moveTo(b.x, top + 1); g.lineTo(b.x + b.w / 2, top - 22); g.lineTo(b.x + b.w, top + 1); g.fill(); g.fillRect(b.x + b.w / 2 - .6, top - 34, 1.2, 13); }
}
function drawFar(g, w, h, night) {
  const r = R(909);
  for (const b of L.far) {
    const top = h - b.h;
    if (!night) {
      g.fillStyle = rgb(mix(hex('#8ea2c6'), hex('#d9b9a4'), b.t * .6)); shape(g, b, h);
      g.fillStyle = 'rgba(255,214,160,.5)'; g.fillRect(b.x + b.w * .6, top, b.w * .4, b.h);
      g.fillStyle = 'rgba(60,80,130,.13)'; for (let y = top + 4; y < h; y += 5) g.fillRect(b.x + 1, y, b.w - 2, 1.2);
    } else {
      g.fillStyle = rgb(mix(hex('#1a2344'), hex('#28315c'), b.t)); shape(g, b, h);
      for (let y = top + 3; y < h - 2; y += 4.4) for (let x = b.x + 1.4; x < b.x + b.w - 1.6; x += 3.2) if (r() < .4) { g.fillStyle = r() < .2 ? '#cfe0ff' : r() < .5 ? '#fff0c0' : '#ffd98a'; g.fillRect(x, y, 1.5, 2.1); }
    }
  }
  const hz = g.createLinearGradient(0, h - 60, 0, h); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(1, night ? 'rgba(255,190,130,.16)' : 'rgba(255,236,210,.4)'); g.fillStyle = hz; g.fillRect(0, h - 60, w, 60);
}
function drawMid(g, w, h, night) {
  const r = R(321); let x = -20;
  while (x < w) {
    const bw = 46 + r() * 70, bh = 30 + r() * 58, top = h - 36 - bh;
    g.fillStyle = night ? rgb(mix(hex('#161c34'), hex('#232b4a'), r())) : ['#b98a6a', '#cdb090', '#a8705a', '#dcc6a4', '#8f7868'][r() * 5 | 0]; g.fillRect(x, top, bw, bh + 36);
    if (!night) { g.fillStyle = 'rgba(255,222,172,.34)'; g.fillRect(x + bw * .7, top, bw * .3, bh + 36); g.fillStyle = 'rgba(50,50,80,.42)'; }
    for (let yy = top + 6; yy < h - 34; yy += 10) for (let xx = x + 5; xx < x + bw - 6; xx += 9) { if (night) { if (r() < .27) { g.fillStyle = r() < .3 ? '#fff0c0' : '#ffd98a'; g.fillRect(xx, yy, 2.8, 3.6); } } else g.fillRect(xx, yy, 3, 4); }
    if (r() < .3) { const tx = x + bw * (.25 + r() * .5); g.fillStyle = night ? '#141a30' : '#6e5646'; g.fillRect(tx - 6, top - 9, 1.6, 9); g.fillRect(tx + 4.4, top - 9, 1.6, 9); g.fillRect(tx - 8, top - 24, 16, 16); g.beginPath(); g.moveTo(tx - 9, top - 24); g.lineTo(tx, top - 32); g.lineTo(tx + 9, top - 24); g.fill(); }
    x += bw + r() * 6 - 2;
  }
  for (let i = 0; i < w * .7; i++) { const k = r(); dab(g, r() * w, h - r() * r() * 56 - 2, 12 + r() * 14, 8 + r() * 7, 0, night ? rgb(mix(hex('#0d171c'), hex('#182a2c'), k)) : rgb(mix(PAL.deep[1], PAL.yg[2], k * .7)), .95); }
  g.globalAlpha = 1;
  if (night) { g.fillStyle = '#ffd98a'; for (let i = 0; i < 26; i++) g.fillRect(w * .46 + i * 3.2 + r() * 2, h - 6 - i * 1.5, 1.8, 1.8); for (let i = 0; i < w * .06; i++) g.fillRect(r() * w, h - 4 - r() * 40, 1.6, 1.6); }
}
function drawTower(g, w, h, night) {
  const r = R(55);
  g.fillStyle = night ? '#2a1b25' : '#9a5646'; g.fillRect(0, 22, w, h - 22);
  for (let i = 0; i < 260; i++) dab(g, r() * w, 22 + r() * (h - 22), 6 + r() * 14, 2 + r() * 3, 0, night ? (r() < .5 ? '#34232d' : '#21151e') : (r() < .5 ? '#ad6654' : '#864737'), .5);
  g.globalAlpha = 1; g.fillStyle = 'rgba(40,10,10,.15)'; for (let y = 26; y < h; y += 7) g.fillRect(0, y, w, 1);
  const face = g.createLinearGradient(w * .72, 0, w, 0); face.addColorStop(0, night ? 'rgba(120,120,190,.1)' : 'rgba(255,200,140,.42)'); face.addColorStop(1, night ? 'rgba(120,120,190,.02)' : 'rgba(255,200,140,.2)'); g.fillStyle = face; g.fillRect(w * .72, 22, w * .28, h);
  g.fillStyle = 'rgba(30,10,20,.3)'; g.fillRect(w * .72 - 1, 22, 1.6, h);
  g.fillStyle = night ? '#3a2a36' : '#dcd2c2'; g.fillRect(-2, 16, w + 4, 8); g.fillStyle = night ? '#1d141c' : '#5a4a48'; g.fillRect(w * .3, 0, w * .34, 17);
  for (let i = 0; i < 9; i++) { const y = 44 + i * 44; g.fillStyle = night ? (r() < .6 ? '#ffe9a6' : '#3a3550') : '#b7ccdc'; g.fillRect(w * .82, y, 11, 13); g.strokeStyle = night ? 'rgba(0,0,0,.3)' : '#e9dfc8'; g.lineWidth = 1; g.strokeRect(w * .82, y, 11, 13); }
}
function drawDeck(g, w, h) {
  const r = R(404), fy = h - L.floor, py = h - L.par, cxm = L.cxm;
  /* pavers */
  let gr = g.createLinearGradient(0, fy, 0, h); gr.addColorStop(0, '#d8d1c4'); gr.addColorStop(1, '#bdb4a4'); g.fillStyle = gr; g.fillRect(0, fy, w, L.floor);
  for (let i = 0; i < w * .5; i++) dab(g, r() * w, fy + r() * L.floor, 14 + r() * 40, 3 + r() * 6, 0, r() < .5 ? '#e6dfd2' : '#a9a090', .16);
  g.globalAlpha = 1; g.strokeStyle = 'rgba(90,80,70,.28)'; g.lineWidth = 1;
  for (let k = 1; k <= 5; k++) { const y = fy + L.floor * Math.pow(k / 6, 1.7); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(cxm + i * 84, fy); g.lineTo(cxm + i * 190, h); g.stroke(); }
  /* brick parapet with a stone cap */
  g.fillStyle = '#9a5646'; g.fillRect(0, py, w, L.par - L.floor);
  for (let i = 0; i < w * .5; i++) dab(g, r() * w, py + r() * (L.par - L.floor), 8 + r() * 12, 2.4 + r() * 2, 0, r() < .5 ? '#b06a56' : '#834636', .5);
  g.globalAlpha = 1; g.fillStyle = 'rgba(235,215,200,.38)';
  for (let row = 0; row < 7; row++) { const y = py + 8 + row * 7; g.fillRect(0, y, w, 1); for (let x = (row % 2) * 11; x < w; x += 22) g.fillRect(x, y - 7, 1, 7); }
  g.fillStyle = '#ded6c8'; g.fillRect(0, py - 1, w, 7); g.fillStyle = 'rgba(60,30,20,.3)'; g.fillRect(0, py + 6, w, 2);
  gr = g.createLinearGradient(0, fy, 0, fy + 26); gr.addColorStop(0, 'rgba(50,30,30,.34)'); gr.addColorStop(1, 'rgba(50,30,30,0)'); g.fillStyle = gr; g.fillRect(0, fy, w, 26);
  /* mesh railing */
  const top = h - L.rail, mh = L.rail - L.par;
  g.save(); g.beginPath(); g.rect(0, top, w, mh); g.clip(); g.strokeStyle = 'rgba(228,228,238,.4)'; g.lineWidth = .9; g.beginPath();
  for (let x = -mh * 2; x < w + mh * 2; x += 20) { g.moveTo(x, py); g.lineTo(x + mh * .9, top); g.moveTo(x, py); g.lineTo(x - mh * .9, top); }
  g.stroke(); g.restore();
  g.fillStyle = '#1d1e22'; g.fillRect(0, top - 5, w, 6);
  for (let i = -6; i <= 6; i++) { const x = cxm + i * 214; g.fillRect(x - 9, top, 7, mh); g.fillRect(x + 2, top, 7, mh); }
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, top - 5, w, 1.4);
  /* the wall light on the middle post */
  g.fillStyle = '#2a2b30'; rr(g, cxm - 8, h - 268, 16, 26, 3); g.fill(); g.fillStyle = '#3a3b42'; rr(g, cxm - 10, h - 271, 20, 6, 2); g.fill();
}

/* ------------------------------------------------------------------ things on the table */
function drawGlass(g, x, y, fill, col, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.6; g.lineCap = 'round';
  ell(g, 0, 0, 10, 2.6); g.stroke(); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -22); g.stroke();
  const bowl = () => { g.beginPath(); g.moveTo(-11, -52); g.bezierCurveTo(-15, -36, -9, -23, 0, -22); g.bezierCurveTo(9, -23, 15, -36, 11, -52); g.closePath(); };
  if (fill > 0) { g.save(); bowl(); g.clip(); g.fillStyle = col; const lv = -22 - 20 * fill; g.fillRect(-16, lv, 32, 34); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(-16, lv, 32, 1.6); g.restore(); }
  g.fillStyle = 'rgba(255,255,255,.12)'; bowl(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-7.5, -46); g.quadraticCurveTo(-9.5, -36, -6, -29); g.stroke();
  g.restore();
}
function drawBottle(g, x, y, kind, rot = 0, level = 1) {
  g.save(); g.translate(x, y); g.rotate(rot);
  const body = () => { g.beginPath(); g.moveTo(-9, 0); g.lineTo(-9, -42); g.quadraticCurveTo(-9, -54, -3.4, -58); g.lineTo(-3.4, -76); g.lineTo(3.4, -76); g.lineTo(3.4, -58); g.quadraticCurveTo(9, -54, 9, -42); g.lineTo(9, 0); g.closePath(); };
  if (kind === 'orange') {
    g.fillStyle = 'rgba(255,255,255,.22)'; body(); g.fill(); g.save(); body(); g.clip(); g.fillStyle = WINE.orange; g.fillRect(-10, -8 - 46 * level, 20, 60); g.restore();
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; body(); g.stroke();
    g.fillStyle = '#f6efdc'; rr(g, -8.2, -36, 16.4, 24, 1.5); g.fill(); g.fillStyle = '#e07a2c'; g.fillRect(-5, -32, 4, 5); g.fillRect(1.5, -25, 4.5, 3); g.beginPath(); g.arc(3, -31, 2.2, 0, TAU); g.fill(); g.fillRect(-5.5, -19, 3, 4);
    g.fillStyle = '#d9a03c'; rr(g, -4, -80, 8, 9, 1.5); g.fill();
  } else {
    const gr = g.createLinearGradient(-9, 0, 9, 0); gr.addColorStop(0, '#2c3a30'); gr.addColorStop(1, '#141c18'); g.fillStyle = gr; body(); g.fill();
    g.fillStyle = '#efe7cf'; rr(g, -8.4, -38, 16.8, 27, 1.5); g.fill(); g.fillStyle = '#8f8468'; g.fillRect(-5.5, -33, 11, 1.2); g.fillRect(-4, -29, 8, 1); g.fillRect(-6, -18, 12, 1.2); g.fillStyle = '#7a1426'; g.fillRect(-2.5, -26, 5, 5);
    g.fillStyle = '#5a1420'; rr(g, -4, -80, 8, 20, 1.5); g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-6.5, -50, 1.8, 40);
  g.restore();
}
function drawBag(g, x, y, k) {
  g.save(); g.translate(x, y); g.scale(1, 1 - k * .1); g.globalAlpha = 1 - k;
  g.strokeStyle = '#a57c50'; g.lineWidth = 2; g.beginPath(); g.moveTo(-12, -54); g.quadraticCurveTo(0, -72, 12, -54); g.stroke();
  const gr = g.createLinearGradient(-30, 0, 30, 0); gr.addColorStop(0, '#d2a66e'); gr.addColorStop(1, '#a87c4c'); g.fillStyle = gr; g.beginPath(); g.moveTo(-27, 0); g.lineTo(-30, -52); g.lineTo(-22, -58); g.lineTo(30, -55); g.lineTo(27, 0); g.closePath(); g.fill();
  g.fillStyle = 'rgba(90,50,20,.22)'; g.beginPath(); g.moveTo(-30, -52); g.lineTo(-22, -58); g.lineTo(-18, 0); g.lineTo(-27, 0); g.fill();
  g.fillStyle = '#fbf6ea'; g.fillRect(-4, -50, 18, 24); g.fillStyle = 'rgba(60,60,80,.4)'; for (let i = 0; i < 5; i++) g.fillRect(-1, -46 + i * 4, 12 - (i % 2) * 4, 1);
  g.restore(); g.globalAlpha = 1;
}
function drawDinner(g, x, y, k) {
  const pop = i => clamp(k * 4 - i, 0, 1), up = v => (1 - v) * 14;
  /* foil tray, two folded boxes, a tub of soup, chopsticks */
  let v = pop(0); if (v > 0) { g.globalAlpha = v; g.fillStyle = '#b9bcc4'; rr(g, x + 22, y - 12 + up(v), 40, 12, 2); g.fill(); g.fillStyle = '#e6e8ee'; rr(g, x + 20, y - 15 + up(v), 44, 5, 2); g.fill(); g.fillStyle = '#c98a3a'; g.fillRect(x + 24, y - 13 + up(v), 36, 2); }
  v = pop(1); if (v > 0) for (const [dx, s] of [[-52, 1], [-24, .9]]) {
    g.globalAlpha = v; g.save(); g.translate(x + dx, y + up(v) - (s < 1 ? 5 : 0)); g.scale(s, s);
    g.fillStyle = '#f7f3ea'; g.beginPath(); g.moveTo(-11, 0); g.lineTo(-15, -24); g.lineTo(15, -24); g.lineTo(11, 0); g.closePath(); g.fill();
    g.fillStyle = '#e2dccf'; g.beginPath(); g.moveTo(-15, -24); g.lineTo(-6, -34); g.lineTo(0, -24); g.fill(); g.fillStyle = '#fffdf6'; g.beginPath(); g.moveTo(15, -24); g.lineTo(5, -36); g.lineTo(-1, -24); g.fill();
    g.strokeStyle = '#8f949c'; g.lineWidth = 1; g.beginPath(); g.moveTo(-14, -20); g.quadraticCurveTo(0, -46, 14, -20); g.stroke();
    g.strokeStyle = '#c9463b'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-5, -15); g.lineTo(5, -15); g.moveTo(-4, -10); g.lineTo(4, -10); g.stroke(); g.restore();
  }
  v = pop(2); if (v > 0) { g.globalAlpha = v; const yy = y + up(v) + 2; g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(-16 + x, yy - 26); g.lineTo(-13 + x, yy); g.lineTo(13 + x, yy); g.lineTo(16 + x, yy - 26); g.fill(); g.fillStyle = '#c9772e'; g.beginPath(); g.moveTo(-15.4 + x, yy - 21); g.lineTo(-13 + x, yy - 1); g.lineTo(13 + x, yy - 1); g.lineTo(15.4 + x, yy - 21); g.fill(); g.fillStyle = '#e0934a'; ell(g, x, yy - 22, 15.6, 3.6); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.2; ell(g, x, yy - 26, 16, 3.8); g.stroke(); }
  v = pop(3); if (v > 0) { g.globalAlpha = v; g.strokeStyle = '#d9b98a'; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 76, y - 2); g.lineTo(x - 40, y + 5); g.moveTo(x - 76, y + 2); g.lineTo(x - 41, y + 8); g.stroke(); }
  g.globalAlpha = 1;
}
function drawTable(g) {
  const x = L.cxm, yn = Y(150), yf = Y(196);
  g.fillStyle = 'rgba(40,30,40,.28)'; ell(g, x, Y(62), 104, 13); g.fill();
  g.fillStyle = '#1c1d21'; for (const dx of [-90, 84]) g.fillRect(x + dx, yn, 6, 86); for (const dx of [-76, 72]) g.fillRect(x + dx, yf + 10, 4, 70);
  g.fillStyle = '#2b2c31'; g.beginPath(); g.moveTo(x - 86, yf); g.lineTo(x + 86, yf); g.lineTo(x + 100, yn); g.lineTo(x - 100, yn); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1; for (let i = 1; i < 6; i++) { const y = lerp(yf, yn, i / 6); g.beginPath(); g.moveTo(x - 86 - 14 * i / 6, y); g.lineTo(x + 86 + 14 * i / 6, y); g.stroke(); }
  g.fillStyle = '#1c1d21'; g.fillRect(x - 100, yn, 200, 7); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x - 100, yn, 200, 1.2);
}

/* ------------------------------------------------------------------ the two of them, seen from behind */
const LOOK = {
  /* Jana: navy coat with a cream collar, long wavy brown hair with lighter streaks */
  j: { coat: '#232a45', dark: '#191e35', skin: '#f0c7a6', hair: '#573726', hi: 'rgba(196,142,88,.9)', lo: 'rgba(58,34,22,.55)', wave: 1, len: 140 },
  /* her friend: tan trench coat, long black hair */
  f: { coat: '#cdb48e', dark: '#a98f69', skin: '#c99a74', hair: '#17141a', hi: 'rgba(86,78,104,.85)', lo: 'rgba(0,0,0,.5)', wave: .4, len: 130 }
};
function drawPerson(g, x, who, t) {
  const d = who === 'j' ? 1 : -1, k = LOOK[who];
  g.fillStyle = 'rgba(40,30,40,.3)'; ell(g, x, Y(34), 62, 11); g.fill();
  g.fillStyle = '#24252a'; rr(g, x - 54, Y(106), 108, 74, 9); g.fill(); g.fillStyle = 'rgba(255,255,255,.08)'; rr(g, x - 54, Y(106), 108, 8, 5); g.fill();
  /* outer arm, then the coat */
  g.strokeStyle = k.dark; g.lineWidth = 21; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - d * 33, Y(204)); g.quadraticCurveTo(x - d * 46, Y(170), x - d * 40, Y(128)); g.stroke();
  const gr = g.createLinearGradient(x - 46, 0, x + 46, 0); gr.addColorStop(0, d > 0 ? k.dark : k.coat); gr.addColorStop(1, d > 0 ? k.coat : k.dark);
  g.fillStyle = gr; g.beginPath(); g.moveTo(x - 46, Y(98)); g.bezierCurveTo(x - 50, Y(160), x - 44, Y(206), x - 30, Y(218)); g.lineTo(x + 30, Y(218)); g.bezierCurveTo(x + 44, Y(206), x + 50, Y(160), x + 46, Y(98)); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, Y(206)); g.lineTo(x, Y(100)); g.stroke();
  if (who === 'f') { g.fillStyle = k.dark; g.fillRect(x - 47, Y(152), 94, 9); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x - 47, Y(152), 94, 1.4); rr(g, x - 8, Y(155), 16, 15, 2); g.fillStyle = '#8f7650'; g.fill(); }
  g.save(); g.translate(x, 0); g.scale(d, 1);
  const r = R(who === 'j' ? 12 : 29);
  if (who === 'j') { for (let i = 0; i < 46; i++) { const a = r() * TAU, q = Math.sqrt(r()); dab(g, Math.cos(a) * q * 37, Y(214) + Math.sin(a) * q * 11, 6 + r() * 4, 4.5 + r() * 3, 0, r() < .5 ? '#f4ead6' : '#e2d5bc', 1); } g.globalAlpha = 1; }
  else { g.fillStyle = k.dark; ell(g, 0, Y(215), 34, 9); g.fill(); g.fillStyle = k.coat; ell(g, 0, Y(218), 30, 7); g.fill(); }
  g.fillStyle = k.skin; ell(g, 5, Y(250), 20, 22); g.fill();
  const still = G.RM ? 0 : 1, sw = Math.sin(t * 1.3 + d) * 2.2 * still, sw2 = Math.sin(t * 1.7 + 1 + d) * 1.8 * still, W = v => 24 + (v - 24) * k.wave, E = k.len;
  g.fillStyle = k.hair; g.beginPath(); g.moveTo(-16, Y(266)); g.bezierCurveTo(-10, Y(282), 18, Y(282), 22, Y(262));
  g.bezierCurveTo(W(26), Y(236), W(14), Y(226), W(26) + sw, Y(198)); g.bezierCurveTo(W(36) + sw, Y(176), W(22) + sw2, Y(160), W(26) + sw2, Y(E));
  g.quadraticCurveTo(2, Y(E - 12), -W(24) + sw2, Y(E)); g.bezierCurveTo(-W(20) + sw2, Y(162), -W(34) + sw, Y(178), -W(26) + sw, Y(200)); g.bezierCurveTo(-W(16), Y(226), -W(26), Y(244), -16, Y(266)); g.closePath(); g.fill();
  g.lineCap = 'round'; for (let i = 0; i < 9; i++) { const ox = -18 + i * 5 + r() * 3, hi = i % 3 === 1, bend = 6 * k.wave; g.strokeStyle = hi ? k.hi : k.lo; g.lineWidth = hi ? 2.4 : 1.6; g.beginPath(); g.moveTo(ox * .7, Y(268 - Math.abs(ox) * .4)); g.bezierCurveTo(ox + bend, Y(236), ox - bend + sw * .6, Y(200), ox * 1.25 + sw, Y(172)); g.quadraticCurveTo(ox * 1.3 + bend + sw2, Y(156), ox * 1.25 + sw2, Y(E + 4)); g.stroke(); }
  g.fillStyle = k.skin; ell(g, 21, Y(248), 4.6, 9); g.fill();
  if (who === 'j') { g.fillStyle = '#e9c15a'; g.beginPath(); g.arc(22, Y(238), 2.6, 0, TAU); g.fill(); }
  else { g.strokeStyle = '#e9c15a'; g.lineWidth = 1.8; g.beginPath(); g.arc(22.5, Y(236), 4, 0, TAU); g.stroke(); }
  g.restore();
}
function drawArm(g, x, who, hx, hy) {
  const d = who === 'j' ? 1 : -1, k = LOOK[who], sx = x + d * 30, sy = Y(204), mx = (sx + hx) / 2, my = (sy + hy) / 2 + 26;
  g.lineCap = 'round'; g.strokeStyle = k.coat; g.lineWidth = 19; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(mx, my, hx, hy); g.stroke();
  if (who === 'j') { g.strokeStyle = '#f1e6d0'; g.lineWidth = 20; g.beginPath(); g.moveTo(lerp(mx, hx, .7), lerp(my, hy, .78)); g.lineTo(hx, hy); g.stroke(); }
  else { g.strokeStyle = k.dark; g.lineWidth = 19.5; g.beginPath(); g.moveTo(lerp(mx, hx, .86), lerp(my, hy, .9)); g.lineTo(hx, hy); g.stroke(); }
  g.fillStyle = k.skin; g.beginPath(); g.arc(hx + d * 5, hy - 3, 7.5, 0, TAU); g.fill();
}

/* ------------------------------------------------------------------ play */
function say(text, x, y, col = INK) { T.says.push({ text, x: clamp(x, 100, VW - 100), y, life: 2.4, col }); }
function setStep(p) { $('rstep').textContent = p === 'tower' ? `${STEP.tower} Round ${Math.min(T.round + 1, 3)} of 3.` : STEP[p] || ''; }
function go(p) { T.phase = p; setStep(p); }
function sparkle(x, y, n, cols) { if (G.RM) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 40 + Math.random() * 130; T.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: .8, c: cols[Math.random() * cols.length | 0], s: 1.5 + Math.random() * 2 }); } }
function unpack() { if (T.phase !== 'unpack' || T.unpack > 0) return; T.unpack = .001; for (let i = 0; i < 4; i++) tone(700 + Math.random() * 900, .05, 'triangle', .03, i * .05); }
function finishPour(who) { T.fill[who] = 1; tone(880, .14, 'sine', .06); tone(1320, .2, 'sine', .04, .08); T.held = null; T.pour = null; if (T.fill.j >= 1 && T.fill.f >= 1) go('cheers'); }
function cheers() { if (T.phase !== 'cheers' || T.cheers >= 0) return; T.cheers = 0; T.clinked = false; }
function newSeq(n) { T.seq = Array.from({ length: n }, () => Math.random() * 6 | 0); for (let i = 1; i < n; i++) if (T.seq[i] === T.seq[i - 1]) T.seq[i] = (T.seq[i] + 1 + (Math.random() * 4 | 0)) % 6; T.wait = 1.1; T.show = null; T.input = -1; }
function flash(i) { T.flash[i] = 1; tone(NOTES[i], .32, 'sine', .09); tone(NOTES[i] * 2, .2, 'sine', .025, .01); }
function press(i) {
  if (T.phase === 'free') { flash(i); return; }
  if (T.phase !== 'tower' || T.show || T.input < 0) return;
  flash(i);
  if (i !== T.seq[T.input]) { tone(196, .25, 'triangle', .06, .12, .8); say('Watch it again', L.tx - 40, Y(520), MISS); T.wait = 1.3; T.input = -1; return; }
  if (++T.input < T.seq.length) return;
  T.round++; T.input = -1;
  if (T.round >= 3) { T.phase = 'won'; T.wait = 1.6; [0, 1, 2, 3, 4, 5].forEach(k => setTimeout(() => { if (active) flash(k); }, 250 + k * 130)); }
  else { setStep('tower'); setTimeout(() => { if (T.phase === 'tower') newSeq(3 + T.round); }, 500); }
}
function win() { T.phase = 'free'; setStep('free'); $('rwin').hidden = false; $('rstay').focus(); [784, 988, 1175, 1568].forEach((f, i) => tone(f, .5, 'sine', .07, i * .13)); }

function update(dt) {
  const t = G.time;
  if (T.phase === 'unpack' || T.phase === 'pour' || T.phase === 'cheers') T.e = Math.min(.24, T.e + dt * .004);
  if (T.unpack > 0 && T.unpack < 1) { T.unpack = Math.min(1, T.unpack + dt * 1.1); if (T.unpack >= 1 && T.phase === 'unpack') go('pour'); }
  T.sayCool -= dt;
  /* pouring */
  T.pour = null;
  if (T.held && T.phase === 'pour') {
    const h = T.held;
    for (const who of ['j', 'f']) { const gl = who === 'j' ? L.gj : L.gf; if (Math.abs(h.x - gl.x) < 44 && h.y < Y(gl.y) - 6 && h.y > Y(gl.y) - 170 && T.fill[who] < 1) {
      const right = (h.kind === 'orange') === (who === 'j');
      if (right) { T.pour = { who, side: h.x >= gl.x ? 1 : -1 }; T.fill[who] += dt / 1.5; if (!G.RM && Math.random() < dt * 20) tone(500 + T.fill[who] * 500 + Math.random() * 60, .06, 'sine', .018); if (T.fill[who] >= 1) finishPour(who); }
      else if (T.sayCool <= 0) { T.sayCool = 2.6; h.shake = .5; say(who === 'j' ? "Red's mine. Orange is yours." : "That's your orange. Mine's the red.", L.fx - 20, Y(330), MISS); tone(260, .12, 'triangle', .05, 0, .8); }
    } }
    if (h.shake) h.shake = Math.max(0, h.shake - dt);
  }
  /* cheers, then the evening falls */
  if (T.cheers >= 0 && T.cheers < 1) {
    T.cheers = Math.min(1, T.cheers + dt / 2.6);
    if (!T.clinked && T.cheers > .42) { T.clinked = true; tone(2093, .5, 'sine', .08); tone(2794, .6, 'sine', .05, .015); tone(3520, .3, 'sine', .02, .02); sparkle(L.cxm, Y(258), 22, ['#fff6da', '#ffd27a', '#f7a8c4']); say('Cheers', L.cxm, Y(300)); }
    if (T.cheers >= 1) { T.fill.j = T.fill.f = .78; go('dusk'); }
  }
  if (T.phase === 'dusk') { T.e = Math.min(1, T.e + dt / (G.RM ? 6 : 20)); if (T.e >= .985) { go('tower'); newSeq(3); } }
  /* the tower's turn */
  if (T.phase === 'tower' && T.input < 0 && !T.show) { T.wait -= dt; if (T.wait <= 0 && T.seq.length) T.show = { i: 0, t: 0 }; }
  if (T.show) { const s = T.show; if (s.t === 0) flash(T.seq[s.i]); s.t += dt; if (s.t > .62) { s.i++; s.t = 0; if (s.i >= T.seq.length) { T.show = null; T.input = 0; } } }
  if (T.phase === 'won') { T.wait -= dt; if (T.wait <= 0) win(); }
  for (let i = 0; i < 6; i++) T.flash[i] = Math.max(0, T.flash[i] - dt * 2.4);
  for (let i = T.says.length - 1; i >= 0; i--) { const s = T.says[i]; s.life -= dt; s.y -= 12 * dt; if (s.life <= 0) T.says.splice(i, 1); }
  for (let i = T.parts.length - 1; i >= 0; i--) { const p = T.parts[i]; p.life -= dt; p.vy += 220 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) T.parts.splice(i, 1); }
  if (!G.RM && T.unpack >= 1 && Math.random() < dt * 4) T.steam.push({ x: L.bag.x + (Math.random() - .5) * 24, y: Y(L.bag.y + 26), life: 1, s: 5 + Math.random() * 4 });
  for (let i = T.steam.length - 1; i >= 0; i--) { const p = T.steam[i]; p.life -= dt * .6; p.y -= 24 * dt; p.s += dt * 7; if (p.life <= 0) T.steam.splice(i, 1); }
  if (T.plane < 0 && T.e > .8 && Math.random() < dt * .05) T.plane = 0; if (T.plane >= 0) { T.plane += dt / 26; if (T.plane > 1) T.plane = -1; }
  const atTower = T.phase === 'tower' || T.phase === 'won', mx = atTower ? L.tx - 26 + Math.sin(t * .9) * 8 : L.jx - 70 + Math.sin(t * .8) * 14, my = atTower ? Y(430) + Math.sin(t * 2) * 12 : Y(330) + Math.sin(t * 2.1) * 10;
  moth.x = lerp(moth.x, mx, 1 - Math.exp(-dt * 1.6)); moth.y = lerp(moth.y, my, 1 - Math.exp(-dt * 1.6));
}
function tag(g, text, x, y, col, a) {
  g.font = `700 14.5px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(text).width + 20; g.globalAlpha = a;
  g.fillStyle = 'rgba(20,16,30,.3)'; rr(g, x - w / 2 + 1.5, y - 10.5, w, 25, 12.5); g.fill(); g.fillStyle = PAPER; rr(g, x - w / 2, y - 12.5, w, 25, 12.5); g.fill(); g.fillStyle = col; g.fillText(text, x, y + .5); g.globalAlpha = 1;
}
function frame(dt) {
  if (!L || !SPR) return;
  update(dt);
  const t = G.time, g = cx, e = T.e, night = sm(e, .45, 1), k = S * G.DPR, amb = G.RM ? 0 : 1;
  g.setTransform(k, 0, 0, k, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  /* sky */
  const by = Y(L.base), sg = g.createLinearGradient(0, Math.min(0, by - 760), 0, by);
  sg.addColorStop(0, rgb(k3(SKY.top, e))); sg.addColorStop(.6, rgb(k3(SKY.mid, e))); sg.addColorStop(1, rgb(k3(SKY.hor, e))); g.fillStyle = sg; g.fillRect(0, 0, VW, by + 2);
  const st = R(88); for (let i = 0; i < 120; i++) { const x = st() * VW, y = st() * (by - 150), tw = .55 + .45 * Math.sin(t * (1 + st() * 2) + i); g.fillStyle = `rgba(255,250,235,${night * tw * (.4 + st() * .6)})`; const s2 = .7 + st() * 1.1; g.fillRect(x, y, s2, s2); }
  const mx = VW * .2, my = Math.max(84, (by - 60) * .22);
  if (night > 0) { g.globalCompositeOperation = 'lighter'; glow(g, mx, my, 90, '220,226,255', .22 * night); g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(255,248,224,${night})`; g.beginPath(); g.arc(mx, my, 15, -.5 * Math.PI, .5 * Math.PI); g.bezierCurveTo(mx + 9, my + 8, mx + 9, my - 8, mx, my - 15); g.fill(); }
  const cl = G.SP && G.SP.clouds, duskA = sm(e, .12, .5);
  if (cl) for (const [i, fx, hy, sc, sp] of [[0, .08, 250, .9, 3], [2, .5, 380, 1.1, 2], [4, .86, 180, .6, 4], [1, .3, 110, .38, 1.4], [3, .68, 520, 1, 2.6], [5, .16, 640, 1.2, 2]]) {
    const s = cl[i], w = s[0].uw * sc, h = s[0].uh * sc, span = VW + 700, x = wrap(fx * span + t * sp * amb, span) - 350, y = by - hy - h; if (y + h < 0) continue;
    g.globalAlpha = (1 - duskA); if (duskA < 1) g.drawImage(s[0], x, y, w, h); g.globalAlpha = duskA * (1 - .68 * night); g.drawImage(s[1], x, y, w, h);
  }
  g.globalAlpha = 1;
  if (T.plane >= 0) { const px = lerp(-20, VW + 20, T.plane), py = lerp(by - 420, by - 470, T.plane); g.fillStyle = Math.sin(t * 7) > .2 ? 'rgba(255,90,80,.95)' : 'rgba(255,255,255,.55)'; g.fillRect(px, py, 2, 2); }
  /* skyline, the nearer blocks and the park, the tower */
  g.fillStyle = rgb(mix(mix(k3(SKY.hor, e), [150, 160, 190], .5), [24, 31, 62], sm(e, .32, .9))); g.fillRect(0, by - 1, VW, Y(L.par) - by + 2);
  g.drawImage(SPR.far[0], 0, by - 250, VW, 250); g.globalAlpha = sm(e, .32, .9); g.drawImage(SPR.far[1], 0, by - 250, VW, 250); g.globalAlpha = 1;
  if (night > .2) { const tr = R(17 + (t * 1.5 | 0)); g.fillStyle = `rgba(255,236,180,${night})`; for (let i = 0; i < 26; i++) { const b = L.far[tr() * L.far.length | 0]; g.fillRect(b.x + 1 + tr() * (b.w - 3), by - 4 - tr() * (b.h - 8), 1.7, 2.2); }
    g.globalCompositeOperation = 'lighter'; for (const b of L.far) if (b.kind !== 'box') { const tx = b.x + b.w / 2, ty = by - b.h - (b.kind === 'spire' ? b.h * .2 : 0); glow(g, tx, ty, b.kind === 'spire' ? 26 : 12, b.kind === 'spire' ? '120,255,170' : b.kind === 'crown' ? '255,120,150' : '220,230,255', .5 * night); if (b.kind === 'spire') glow(g, tx, ty + 18, 20, '255,90,90', .4 * night); } g.globalCompositeOperation = 'source-over'; }
  const my0 = Y(L.par) - 118; g.drawImage(SPR.mid[0], 0, my0, VW, 130); g.globalAlpha = sm(e, .3, .88); g.drawImage(SPR.mid[1], 0, my0, VW, 130); g.globalAlpha = 1;
  const ty0 = Y(L.par) - 452; g.drawImage(SPR.tower[0], L.tx, ty0, L.tw, 460); g.globalAlpha = sm(e, .3, .88); g.drawImage(SPR.tower[1], L.tx, ty0, L.tw, 460); g.globalAlpha = 1;
  L.win.forEach((w, i) => {
    const lit = sm(e, .5 + i * .06, .62 + i * .06), f = T.flash[i], x = w.x, y = Y(w.y + w.h);
    const c = mix(mix(hex('#a9c2d8'), hex('#fff0c4'), lit), FLASH[i], f); g.fillStyle = rgb(c); g.fillRect(x, y, w.w, w.h);
    g.strokeStyle = lit > .5 ? 'rgba(60,30,30,.4)' : '#e9dfc8'; g.lineWidth = 1.6; g.strokeRect(x, y, w.w, w.h); g.beginPath(); g.moveTo(x + w.w / 2, y); g.lineTo(x + w.w / 2, y + w.h); g.stroke();
    if (lit > 0 || f > 0) { g.globalCompositeOperation = 'lighter'; glow(g, x + 15, y + 15, 34 + f * 46, f > 0 ? `${FLASH[i][0]},${FLASH[i][1]},${FLASH[i][2]}` : '255,236,180', .3 * lit + .75 * f); g.globalCompositeOperation = 'source-over'; }
  });

  /* ---- the deck and everyone on it, on a layer the evening can wash over */
  const F = fg; F.setTransform(1, 0, 0, 1, 0, 0); F.clearRect(0, 0, fgCv.width, fgCv.height); F.setTransform(k, 0, 0, k, 0, 0);
  F.drawImage(SPR.fg, 0, Y(L.rail + 14), VW, L.rail + 14);
  drawPerson(F, L.jx, 'j', t); drawPerson(F, L.fx, 'f', t); drawTable(F);
  const h = T.held, c = T.cheers >= 0 ? T.cheers : 0, lift = c <= 0 ? 0 : c < .4 ? sm(c, 0, .4) : c < .6 ? 1 : 1 - sm(c, .6, 1);
  for (const kind of ['orange', 'red']) { const b = kind === 'orange' ? L.bo : L.br, lv = 1 - .3 * T.fill[kind === 'orange' ? 'j' : 'f']; if (!h || h.kind !== kind) drawBottle(F, b.x, Y(b.y), kind, 0, lv); }
  if (T.unpack < 1) drawBag(F, L.bag.x, Y(L.bag.y), T.unpack); if (T.unpack > 0) drawDinner(F, L.bag.x, Y(L.bag.y), T.unpack);
  const gp = (gl, d) => [lerp(gl.x, L.cxm - d * 9, lift), lerp(Y(gl.y), Y(240), lift), d * .3 * lift];
  const [jx, jy, jr] = gp(L.gj, 1), [fx, fy, fr] = gp(L.gf, -1);
  drawArm(F, L.jx, 'j', jx - 12, jy - 12 - 6 * lift); drawArm(F, L.fx, 'f', fx + 12, fy - 12 - 6 * lift);
  drawGlass(F, jx, jy, T.fill.j, WINE.orange, jr); drawGlass(F, fx, fy, T.fill.f, WINE.red, fr);
  if (h) {
    const lv = 1 - .3 * T.fill[h.kind === 'orange' ? 'j' : 'f'];
    if (T.pour) { const gl = T.pour.who === 'j' ? L.gj : L.gf, s = T.pour.side, bx = gl.x + s * 44, byy = Y(gl.y) - 86; drawBottle(F, bx, byy, h.kind, -s * 1.95, lv); F.strokeStyle = WINE[h.kind]; F.lineWidth = 2.6; F.lineCap = 'round'; F.beginPath(); F.moveTo(bx - s * 71, byy + 30); F.quadraticCurveTo(gl.x + s * 2, byy + 34, gl.x, Y(gl.y) - 26 - 18 * T.fill[T.pour.who]); F.stroke(); }
    else drawBottle(F, h.x + Math.sin(t * 50) * 5 * (h.shake || 0), h.y + 40, h.kind, clamp((h.x - h.px) * .02, -.4, .4), lv);
  }
  F.globalCompositeOperation = 'source-atop';
  const warm = 1 - sm(e, .3, .65); if (warm > 0) { F.fillStyle = `rgba(255,168,90,${.13 * warm})`; F.fillRect(0, 0, VW, VH); }
  if (night > 0) { F.fillStyle = `rgba(14,18,48,${.52 * night})`; F.fillRect(0, 0, VW, VH); }
  F.globalCompositeOperation = 'source-over';
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(fgCv, 0, 0); g.setTransform(k, 0, 0, k, 0, 0);

  /* ---- light: the wall lamp, fairy lights along the rail, glints, the moth */
  const on = sm(e, .34, .5);
  g.globalCompositeOperation = 'lighter';
  if (on > 0) {
    glow(g, L.cxm, Y(246), 170, '255,206,140', .4 * on * (.4 + .6 * night)); g.save(); g.translate(L.cxm, Y(176)); g.scale(1, .34); glow(g, 0, 0, 240, '255,200,130', .42 * on * (.3 + .7 * night)); g.restore();
    g.fillStyle = `rgba(255,246,220,${on})`; rr(g, L.cxm - 6, Y(244), 12, 5, 2); g.fill();
    for (let i = -6; i < 6; i++) for (let j = 1; j < 9; j++) { const u = j / 9, x = L.cxm + (i + u) * 214, y = Y(L.rail + 2) + Math.sin(u * Math.PI) * 15, fl = .8 + .2 * Math.sin(t * 3 + i * 7 + j * 1.7) * amb; if (x < -20 || x > VW + 20) continue; glow(g, x, y, 11, '255,214,140', .7 * on * fl); g.fillStyle = `rgba(255,244,210,${on})`; g.fillRect(x - 1, y - 1, 2, 2); }
  }
  glow(g, moth.x, moth.y, 50, '255,214,130', .2 + .28 * night + .08 * Math.sin(t * 6));
  g.globalCompositeOperation = 'source-over';
  if (on > 0) { g.strokeStyle = `rgba(30,30,36,${.5 * on})`; g.lineWidth = .7; g.beginPath(); for (let i = -6; i < 6; i++) { const x0 = L.cxm + i * 214; g.moveTo(x0, Y(L.rail + 2)); g.quadraticCurveTo(x0 + 107, Y(L.rail + 2) + 30, x0 + 214, Y(L.rail + 2)); } g.stroke(); }
  { const f = G.RM ? .6 : Math.abs(Math.sin(t * 17)); g.fillStyle = 'rgba(255,246,214,.94)'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(moth.x + d * (2 + 4.5 * f), moth.y - 2, 1.6 + 5 * f, 5.4, d * .5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(moth.x + d * (1.5 + 3 * f), moth.y + 4, 1.2 + 3 * f, 3.4, d * -.4, 0, TAU); g.fill(); } g.fillStyle = '#ffd874'; ell(g, moth.x, moth.y, 2.2, 4.6); g.fill(); }
  for (const p of T.steam) { g.fillStyle = `rgba(255,252,244,${p.life * .16})`; g.beginPath(); g.arc(p.x, p.y, p.s, 0, TAU); g.fill(); }
  for (const p of T.parts) { g.fillStyle = p.c; g.globalAlpha = Math.min(1, p.life * 2); g.beginPath(); g.arc(p.x, p.y, p.s, 0, TAU); g.fill(); } g.globalAlpha = 1;
  /* a nudge toward whatever comes next */
  const pu = .5 + .5 * Math.sin(t * 5); g.strokeStyle = `rgba(255,236,170,${.5 + .4 * pu})`; g.lineWidth = 3.5;
  if (T.phase === 'unpack' && T.unpack === 0) { ell(g, L.bag.x, Y(L.bag.y + 30), 44 + pu * 4, 42 + pu * 4); g.stroke(); }
  else if (T.phase === 'pour' && !h) { for (const b of [L.bo, L.br]) { ell(g, b.x, Y(b.y + 40), 17 + pu * 3, 46 + pu * 3); g.stroke(); } }
  else if (T.phase === 'cheers' && T.cheers < 0) { for (const gl of [L.gj, L.gf]) { ell(g, gl.x, Y(gl.y + 28), 20 + pu * 3, 34 + pu * 3); g.stroke(); } }
  for (const s of T.says) tag(g, s.text, s.x, s.y, s.col, Math.min(1, s.life * 2));
  G.paper(g, .36 + .1 * night);
}

/* ------------------------------------------------------------------ input and wiring */
const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
const hitWin = (x, y) => L.win.findIndex(w => Math.abs(x - (w.x + 15)) < 34 && Math.abs(y - Y(w.y + 15)) < 23);
cv.addEventListener('pointerdown', e => {
  if (!active || !L) return; const [x, y] = pt(e);
  const wi = hitWin(x, y); if (wi >= 0 && (T.phase === 'tower' || T.phase === 'free')) { press(wi); return; }
  if (T.phase === 'unpack') { if (Math.abs(x - L.bag.x) < 60 && Math.abs(y - Y(L.bag.y + 30)) < 60) unpack(); return; }
  if (T.phase === 'pour') {
    for (const kind of ['orange', 'red']) { const b = kind === 'orange' ? L.bo : L.br, done = T.fill[kind === 'orange' ? 'j' : 'f'] >= 1; if (!done && Math.abs(x - b.x) < (kind === 'orange' ? 26 : 26) && (kind === 'orange' ? x < L.cxm + 2 : x >= L.cxm - 2) && y > Y(b.y + 96) && y < Y(b.y - 14)) { T.held = { kind, x, y: y - (e.pointerType === 'mouse' ? 30 : 70), px: x, lift: e.pointerType === 'mouse' ? 30 : 70 }; tone(520, .05, 'triangle', .04); try { cv.setPointerCapture(e.pointerId); } catch (_) { /* fine without capture */ } e.preventDefault(); return; } }
    return;
  }
  if (T.phase === 'cheers' && Math.abs(x - L.cxm) < 130 && y > Y(300) && y < Y(120)) cheers();
});
cv.addEventListener('pointermove', e => { if (!active || !T.held) return; const [x, y] = pt(e); T.held.px = lerp(T.held.px, T.held.x, .5); T.held.x = x; T.held.y = y - T.held.lift; });
const letGo = () => { T.held = null; T.pour = null; };
cv.addEventListener('pointerup', letGo); cv.addEventListener('pointercancel', letGo);
addEventListener('keydown', e => {
  if (!active || e.metaKey || e.ctrlKey || !$('rwin').hidden) return;
  const i = '123456'.indexOf(e.key); if (i >= 0) { press(i); return; }
  if (e.key !== ' ' && e.key !== 'Enter') return; if (e.target && e.target.tagName === 'BUTTON') return;
  if (T.phase === 'unpack') unpack(); else if (T.phase === 'pour') { finishPour(T.fill.j < 1 ? 'j' : 'f'); } else if (T.phase === 'cheers') cheers();
});
const soundLabel = () => { $('rsound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('rsound').setAttribute('aria-pressed', G.sound); };
$('rsound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
$('rleave').addEventListener('click', () => G.go('road', { atDoor: true }));
$('rstay').addEventListener('click', () => { $('rwin').hidden = true; });
$('rback').addEventListener('click', () => { $('rwin').hidden = true; G.go('road', { atDoor: true }); });

G.scenes.rooftop = {
  frame, resize: layout,
  enter() { active = true; $('rui').hidden = false; layout(); setStep(T.phase); soundLabel(); moth.x = L.jx - 70; moth.y = Y(330); if (document.fonts && document.fonts.load) document.fonts.load('700 14px Nunito'); },
  leave() { active = false; letGo(); $('rui').hidden = true; },
  debug: { T, press, unpack, cheers, finishPour, get L() { return L; }, get S() { return S; }, Y: y => Y(y) }
};
})();
