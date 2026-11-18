/* Chai coffee: make an iced dirty chai your own way. Spice the chai, catch it before it boils over,
   brew the moka pot, pick a milk and pour, shake it or keep the layers, then whip the cold foam. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, hex, mix, rgb, TAU, R, dab, foliage, PAL, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif';
const INK = '#2c2a3d', PAPER = '#fbf3df', LAMP = '#f2b45c', OKC = '#4c8a3f';
const SPICES = [{ id: 'rose', label: 'Rose' }, { id: 'saffron', label: 'Saffron' }, { id: 'cinnamon', label: 'Cinnamon' }, { id: 'cardamom', label: 'Cardamom' }];
const SHOTS = [{ id: 1, label: 'One shot' }, { id: 2, label: 'Two shots' }];
const MILKS = [{ id: 'whole', label: 'Whole' }, { id: 'oat', label: 'Oat' }, { id: 'almond', label: 'Almond' }, { id: 'coconut', label: 'Coconut' }, { id: 'soy', label: 'Soy' }, { id: 'pistachio', label: 'Pistachio' }];
const MODES = [{ id: 'shake', label: 'Shake it' }, { id: 'layers', label: 'Keep the layers' }];
const FOAMS = [{ id: 'cheese', label: 'Cream cheese' }, { id: 'salt', label: 'Maldon salt' }, { id: 'fsaffron', label: 'Saffron' }];
const MILK = { whole: ['#fbf6ea', '#fdfaf2', '#4a7fc0'], oat: ['#efe0c2', '#efe2c4', '#b98a4c'], almond: ['#f2e2cc', '#f3e6d2', '#8a5a34'], coconut: ['#fdfaf2', '#fdfaf2', '#6e4628'], soy: ['#f3ebd0', '#f1ecd0', '#5f8f4a'], pistachio: ['#dde6bd', '#e6eccb', '#7a9a4a'] };
const STEP = {
  spice: "Chai's on the stove. Tap what goes in.",
  boil: "It's rising. Tap the pan to take it off before it boils over.",
  moka: 'Coffee next. One shot or two, then light the stove.',
  brew: 'Wait for the gurgle.',
  ready: "It's ready. Tap the moka pot to take it off.",
  milk: 'Pick a milk.',
  pour: 'Chai, milk, then coffee, over ice.',
  mode: 'Shake it like a cocktail, or keep the layers?',
  shake: 'Drag the shaker up and down.',
  spour: 'Back over the ice.',
  foam: 'Cold foam. Tap what goes in, then hold the jug to whip it.',
  fpour: 'Foam on top.',
  done: 'One iced dirty chai.'
};
const NEXT = { spice: 'Bring it to a boil', moka: 'Light the stove', milk: 'Pour it together' };
let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false;
const fresh = () => ({ step: 'spice', spices: {}, level: .45, over: 0, flame: true, lifted: false, shots: 2, lit: false, brew: 0, milk: 'oat', pour: 0, D: { chai: 0, milk: 0, esp: 0, shaken: false, sh: 0, foam: 0 }, inShaker: false, shake: 0, shY: 0, drag: null, foamAdd: {}, whip: 0, holding: false, fpour: 0, spour: 0, wait: 0, gx: 0 });
let C = fresh();
const parts = [], says = [], steam = [], moth = { x: 80, y: 200 };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };

/* ------------------------------------------------------------------ the room */
function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S;
  L = { wide: VW >= 760, cxm: VW / 2, ct: VH - 420, base: VH - 284, trayY: VH - 166, K: 1.3 };
  const key = `${Math.round(VW)}x${Math.round(VH)}`; if (!SPR || SPR.key !== key) SPR = { key, room: G.spr(VW, VH, drawRoom, clamp(S * G.DPR, 1, 2.5)) };
  $('cui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function drawRoom(g, w, h) {
  const r = R(4711), ct = L.ct;
  let gr = g.createLinearGradient(0, 0, 0, ct); gr.addColorStop(0, '#c9d6bd'); gr.addColorStop(1, '#e2e8d0'); g.fillStyle = gr; g.fillRect(0, 0, w, ct);
  for (let i = 0; i < w * .7; i++) dab(g, r() * w, r() * ct, 14 + r() * 44, 5 + r() * 12, (r() - .5) * .6, r() < .5 ? '#eef2df' : '#b3c4a6', .14);
  g.globalAlpha = 1;
  /* a band of cream tiles above the counter */
  g.fillStyle = '#f3ecd9'; g.fillRect(0, ct - 52, w, 52);
  for (let x = -4; x < w; x += 26) { g.fillStyle = r() < .5 ? '#f8f2e2' : '#ece3cc'; g.fillRect(x + 1, ct - 51, 24, 24); g.fillRect(x + 1, ct - 25, 24, 24); if (r() < .3) { g.fillStyle = '#6f9bbf'; g.beginPath(); g.arc(x + 13, ct - 39 + (r() < .5 ? 26 : 0), 3.4, 0, TAU); g.fill(); } }
  g.fillStyle = '#6f9bbf'; g.fillRect(0, ct - 55, w, 3);
  /* window with morning light and a branch outside */
  const ww = L.wide ? 270 : 190, wh = Math.min(250, ct - (L.wide ? 150 : 190)), wx = L.wide ? w * .5 - ww / 2 : w - ww - 18, wy = L.wide ? 30 : 104;
  g.fillStyle = 'rgba(60,70,50,.16)'; rr(g, wx - 6, wy - 3, ww + 20, wh + 20, 10); g.fill();
  g.fillStyle = '#fbf6ea'; rr(g, wx - 9, wy - 9, ww + 18, wh + 16, 9); g.fill();
  g.save(); rr(g, wx, wy, ww, wh, 4); g.clip();
  gr = g.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, '#a9d6f0'); gr.addColorStop(.7, '#dff0f2'); gr.addColorStop(1, '#fdf1cf'); g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
  for (let i = 0; i < 7; i++) { const x = wx + ww * (.15 + i * .1), y = wy + wh * .3 - Math.sin(i / 6 * Math.PI) * 14, rad = 12 + r() * 12; gr = g.createRadialGradient(x - 3, y - 5, 1, x, y, rad); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#dbe9f4'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); }
  g.strokeStyle = '#6a4a32'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(wx + ww + 6, wy + wh * .2); g.quadraticCurveTo(wx + ww * .6, wy + wh * .3, wx + ww * .34, wy + wh * .62); g.stroke();
  for (let i = 0; i < 7; i++) foliage(g, r, wx + ww * (.36 + i * .1), wy + wh * (.58 - i * .055) + (i % 2) * 14, 26, 18, i % 2 ? PAL.yg : PAL.deep, 34);
  for (let i = 0; i < 18; i++) dab(g, wx + r() * ww, wy + wh - r() * 26, 14, 9, 0, r() < .5 ? '#6f9a4e' : '#4f8648', .95);
  g.globalAlpha = .1; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(wx + ww * .1, wy); g.lineTo(wx + ww * .3, wy); g.lineTo(wx + ww * .02, wy + wh); g.lineTo(wx - ww * .18, wy + wh); g.fill(); g.globalAlpha = 1;
  g.restore();
  g.strokeStyle = '#fbf6ea'; g.lineWidth = 5; g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh * .5); g.lineTo(wx + ww, wy + wh * .5); g.stroke();
  g.fillStyle = '#fbf6ea'; rr(g, wx - 16, wy + wh + 4, ww + 32, 10, 3); g.fill(); g.fillStyle = 'rgba(60,70,50,.2)'; g.fillRect(wx - 12, wy + wh + 14, ww + 24, 3);
  /* a shelf of tins, a little plant, a stack of glasses */
  const shelf = (x0, x1, y) => {
    if (x1 - x0 < 80) return;
    g.fillStyle = 'rgba(60,70,50,.16)'; g.fillRect(x0 - 4, y + 8, x1 - x0 + 12, 5); g.fillStyle = '#c99a62'; rr(g, x0 - 6, y, x1 - x0 + 12, 8, 2); g.fill(); g.fillStyle = 'rgba(255,240,210,.5)'; g.fillRect(x0 - 5, y, x1 - x0 + 10, 2);
    let x = x0 + 6, i = 0;
    while (x < x1 - 34) {
      const k = i++ % 4;
      if (k === 0) { g.fillStyle = ['#b5533c', '#d9a03c', '#3f6f78'][r() * 3 | 0]; rr(g, x, y - 38, 28, 38, 4); g.fill(); g.fillStyle = '#f4ead6'; rr(g, x + 4, y - 28, 20, 12, 2); g.fill(); g.fillStyle = '#e8e3d8'; rr(g, x - 1, y - 42, 30, 6, 2); g.fill(); x += 38; }
      else if (k === 1) { g.fillStyle = '#c0683e'; g.beginPath(); g.moveTo(x, y - 20); g.lineTo(x + 26, y - 20); g.lineTo(x + 22, y); g.lineTo(x + 4, y); g.fill(); foliage(g, r, x + 13, y - 36, 18, 18, PAL.deep, 40); x += 40; }
      else if (k === 2) { for (let j = 0; j < 2; j++) { g.fillStyle = 'rgba(255,255,255,.5)'; rr(g, x + j * 22, y - 34, 18, 34, 3); g.fill(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.2; g.stroke(); } x += 54; }
      else { g.fillStyle = 'rgba(255,255,255,.5)'; rr(g, x, y - 44, 24, 44, 5); g.fill(); g.fillStyle = ['#9db86a', '#9a5a2c', '#e8a6b4'][r() * 3 | 0]; rr(g, x + 2, y - 30, 20, 28, 4); g.fill(); g.fillStyle = '#8a5e3c'; rr(g, x - 1, y - 49, 26, 7, 2); g.fill(); x += 34; }
    }
  };
  if (L.wide) { shelf(wx + ww + 90, w - 40, 196); shelf(wx + ww + 90, w - 40, 104); shelf(40, wx - 90, 196); } else shelf(18, wx - 26, 300);
  /* the counter */
  gr = g.createLinearGradient(0, ct, 0, h); gr.addColorStop(0, '#e2c59a'); gr.addColorStop(1, '#c29a66'); g.fillStyle = gr; g.fillRect(0, ct, w, h - ct);
  for (let i = 0; i < w; i++) dab(g, r() * w, ct + r() * (h - ct), 20 + r() * 90, 1.2 + r() * 2.4, 0, r() < .5 ? '#eed6ae' : '#b08752', .2);
  g.globalAlpha = 1; g.fillStyle = 'rgba(255,245,220,.55)'; g.fillRect(0, ct, w, 2.4);
  gr = g.createLinearGradient(0, ct, 0, ct + 22); gr.addColorStop(0, 'rgba(90,60,30,.22)'); gr.addColorStop(1, 'rgba(90,60,30,0)'); g.fillStyle = gr; g.fillRect(0, ct, w, 22);
  /* sunlight falling across everything from the window */
  g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,236,180,.07)';
  for (const [a, b] of [[.1, .5], [.62, .95]]) { g.beginPath(); g.moveTo(wx + ww * a, wy + wh); g.lineTo(wx + ww * b, wy + wh); g.lineTo(wx + ww * b + 330, h); g.lineTo(wx + ww * a + 250, h); g.fill(); }
  g.globalCompositeOperation = 'source-over';
}

/* ------------------------------------------------------------------ small things: icons for the board */
const petal = (g, x, y, rot, s) => dab(g, x, y, 5.5 * s, 3.6 * s, rot, ['#e98fa6', '#f4b6c4', '#d96f8c'][(Math.abs(x * 7 + y * 3) | 0) % 3], 1);
const thread = (g, x, y, rot, l) => { g.strokeStyle = '#d9541a'; g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(rot + .7) * l * .5, y + Math.sin(rot + .7) * l * .5, x + Math.cos(rot) * l, y + Math.sin(rot) * l); g.stroke(); };
const stick = (g, x, y, rot, l) => { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#8f5226'; rr(g, -l / 2, -3.6, l, 7.2, 3.2); g.fill(); g.fillStyle = '#b97a44'; g.fillRect(-l / 2 + 2, -3, l - 4, 2); g.fillStyle = '#5e3416'; ell(g, l / 2 - 1.5, 0, 2, 3.2); g.fill(); g.restore(); };
const pod = (g, x, y, rot) => { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#9db86a'; ell(g, 0, 0, 7.5, 4.2); g.fill(); g.strokeStyle = '#6f8a44'; g.lineWidth = 1; g.beginPath(); g.moveTo(-7, 0); g.lineTo(7, 0); g.stroke(); g.restore(); };
const flake = (g, x, y, rot, s) => { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#ffffff'; g.fillRect(-s, -s, s * 2, s * 2); g.strokeStyle = 'rgba(120,130,150,.6)'; g.lineWidth = .7; g.strokeRect(-s, -s, s * 2, s * 2); g.restore(); };
function carton(g, id) {
  const [, body, band] = MILK[id];
  g.fillStyle = body; g.beginPath(); g.moveTo(-13, 18); g.lineTo(-13, -10); g.lineTo(0, -22); g.lineTo(13, -10); g.lineTo(13, 18); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(60,50,40,.25)'; g.lineWidth = 1; g.stroke(); g.beginPath(); g.moveTo(-13, -10); g.lineTo(13, -10); g.stroke();
  g.fillStyle = band; g.fillRect(-13, -2, 26, 12); g.fillStyle = body; g.beginPath(); g.arc(0, 4, 4, 0, TAU); g.fill();
  g.fillStyle = band; g.fillRect(-3, -25, 6, 4);
}
function cup(g, x) { g.fillStyle = '#fbf6ea'; g.beginPath(); g.moveTo(x - 9, -6); g.lineTo(x - 7, 8); g.lineTo(x + 7, 8); g.lineTo(x + 9, -6); g.fill(); g.strokeStyle = '#fbf6ea'; g.lineWidth = 2.4; g.beginPath(); g.arc(x + 10, 1, 4.5, -1.2, 1.2); g.stroke(); g.fillStyle = '#3b2318'; ell(g, x, -6, 8, 2.6); g.fill(); g.fillStyle = '#e2d6c0'; ell(g, x, 10, 13, 3); g.fill(); }
const ICON = {
  rose(g) { g.fillStyle = '#e9dcc8'; g.beginPath(); g.ellipse(0, 6, 19, 12, 0, 0, Math.PI); g.fill(); g.fillStyle = '#f6eede'; ell(g, 0, 6, 19, 5.5); g.fill(); const r = R(3); for (let i = 0; i < 11; i++) petal(g, (r() - .5) * 26, 2 + (r() - .5) * 8 - (i % 3) * 2, r() * 3, 1); g.globalAlpha = 1; },
  saffron(g) { g.fillStyle = '#b5533c'; rr(g, -14, -4, 28, 22, 4); g.fill(); g.fillStyle = '#e9c15a'; g.fillRect(-14, 6, 28, 4); g.fillStyle = '#3a1410'; ell(g, 0, -4, 13, 4.6); g.fill(); const r = R(8); for (let i = 0; i < 8; i++) thread(g, (r() - .5) * 18, -4, -1.57 + (r() - .5) * 1.3, 9 + r() * 9); },
  fsaffron(g) { ICON.saffron(g); },
  cinnamon(g) { stick(g, -2, 4, -.5, 36); stick(g, 3, -2, -.25, 38); },
  cardamom(g) { pod(g, -9, -4, .4); pod(g, 8, -6, -.5); pod(g, -2, 7, -.2); pod(g, 11, 8, .7); },
  1(g) { cup(g, 0); }, 2(g) { cup(g, -13); cup(g, 13); },
  shake(g) { shaker(g, 0, 20, 0, .34); },
  layers(g) { g.save(); rr(g, -11, -20, 22, 40, 4); g.clip(); g.fillStyle = '#a8642e'; g.fillRect(-12, 4, 24, 18); g.fillStyle = '#efe0c2'; g.fillRect(-12, -8, 24, 13); g.fillStyle = '#3b2318'; g.fillRect(-12, -15, 24, 8); g.restore(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.6; rr(g, -11, -20, 22, 40, 4); g.stroke(); },
  cheese(g) { g.fillStyle = '#c9ccd2'; rr(g, -18, -8, 36, 20, 3); g.fill(); g.fillStyle = '#fffaf0'; rr(g, -4, -8, 22, 20, 3); g.fill(); g.fillStyle = '#4a7fc0'; g.fillRect(-18, -1, 14, 6); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-16, -6, 10, 2); },
  salt(g) { g.fillStyle = '#3f6f78'; g.beginPath(); g.ellipse(0, 6, 17, 11, 0, 0, Math.PI); g.fill(); g.fillStyle = '#5c8f98'; ell(g, 0, 6, 17, 5); g.fill(); const r = R(21); for (let i = 0; i < 10; i++) flake(g, (r() - .5) * 22, 3 + (r() - .5) * 6 - (i % 3) * 2, r() * 3, 1.8 + r() * 1.4); }
};
for (const m of MILKS) ICON[m.id] = g => carton(g, m.id);

/* ------------------------------------------------------------------ the things on the counter */
function hob(g, x, base, lit, t) {
  g.fillStyle = 'rgba(60,40,20,.22)'; ell(g, x + 4, base + 22, 136, 12); g.fill();
  g.fillStyle = '#2f2c2e'; rr(g, x - 128, base, 256, 22, 8); g.fill(); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x - 122, base + 1, 244, 1.6);
  g.fillStyle = '#d8d2c8'; g.beginPath(); g.arc(x + 104, base + 11, 5, 0, TAU); g.fill(); g.fillStyle = '#1c191b'; rr(g, x - 66, base - 7, 132, 9, 3); g.fill();
  if (lit) for (let k = 0; k < 11; k++) { const fx = x + (k - 5) * 11, fh = 9 + 4 * Math.sin(t * 15 + k * 2.1) * (G.RM ? 0 : 1); g.fillStyle = 'rgba(104,170,255,.9)'; g.beginPath(); g.moveTo(fx - 3.6, base - 6); g.quadraticCurveTo(fx, base - 6 - fh * 2, fx + 3.6, base - 6); g.fill(); g.fillStyle = 'rgba(222,242,255,.9)'; g.beginPath(); g.moveTo(fx - 1.6, base - 6); g.quadraticCurveTo(fx, base - 6 - fh, fx + 1.6, base - 6); g.fill(); }
}
const chaiCol = () => { let c = hex('#a8642e'); if (C.spices.rose) c = mix(c, hex('#c26a5a'), .18); if (C.spices.saffron) c = mix(c, hex('#d8962a'), .24); return c; };
function pan(g, x, base, t) {
  const rx = 88, ry = 26, top = base - 100, lv = clamp(C.level, 0, 1);
  g.fillStyle = '#2b2a2e'; rr(g, x + 80, top + 8, 100, 13, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x + 90, top + 10, 80, 2);
  let gr = g.createLinearGradient(x - rx, 0, x + rx, 0); gr.addColorStop(0, '#eef1f4'); gr.addColorStop(.5, '#b4bac4'); gr.addColorStop(1, '#7d838e');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x - rx, top); g.lineTo(x - rx + 8, base - 22); g.quadraticCurveTo(x, base - 4, x + rx - 8, base - 22); g.lineTo(x + rx, top); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - rx + 14, top + 22); g.lineTo(x - rx + 18, base - 34); g.stroke();
  g.fillStyle = '#f4f6f8'; ell(g, x, top, rx, ry); g.fill();
  gr = g.createLinearGradient(0, top - ry, 0, top + ry); gr.addColorStop(0, '#6f7580'); gr.addColorStop(1, '#a9afb9'); g.fillStyle = gr; ell(g, x, top, rx - 5, ry - 3); g.fill();
  /* chai, foaming up as it rises */
  g.save(); ell(g, x, top, rx - 5, ry - 3); g.clip();
  const ly = top + (1 - lv) * 30, lrx = rx - 7 - (1 - lv) * 8, lry = ry - 4 - (1 - lv) * 4, foam = sm(lv, .55, 1), c = chaiCol();
  g.fillStyle = rgb(mix(c, [236, 208, 160], foam * .75)); ell(g, x, ly, lrx, lry); g.fill();
  g.fillStyle = rgb(mix(c, [80, 40, 16], .1), 1 - foam); ell(g, x + 6, ly + 2, lrx * .7, lry * .66); g.fill();
  const r = R(40 + (C.step === 'boil' && !G.RM ? (t * 9 | 0) : 0)); for (let i = 0; i < 6 + foam * 26; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .9; g.fillStyle = `rgba(255,244,220,${.4 + r() * .4})`; g.beginPath(); g.arc(x + Math.cos(a) * d * lrx, ly + Math.sin(a) * d * lry, 1.4 + r() * 3 * (.4 + foam), 0, TAU); g.fill(); }
  const f = R(91), at = () => { const a = f() * TAU, d = Math.sqrt(f()) * .78; return [x + Math.cos(a) * d * lrx, ly + Math.sin(a) * d * lry]; };
  if (C.spices.cinnamon) for (let i = 0; i < 2; i++) { const [px, py] = at(); stick(g, px, py, f() * 3, 26); }
  if (C.spices.cardamom) for (let i = 0; i < 5; i++) { const [px, py] = at(); pod(g, px, py, f() * 3); }
  if (C.spices.rose) { for (let i = 0; i < 9; i++) { const [px, py] = at(); petal(g, px, py, f() * 3, .9); } g.globalAlpha = 1; }
  if (C.spices.saffron) for (let i = 0; i < 9; i++) { const [px, py] = at(); thread(g, px, py, f() * TAU, 9); }
  g.restore();
  if (C.over > 0) { g.fillStyle = `rgba(236,208,160,${C.over})`; for (const [dx, l] of [[-70, 44], [-52, 62], [-30, 38], [40, 54], [62, 40]]) { rr(g, x + dx, top + ry * Math.sqrt(1 - (dx / rx) ** 2) - 4, 9, l * C.over, 4.5); g.fill(); } ell(g, x, top + 2, rx - 2, ry - 1); g.fill(); }
}
function moka(g, x, base, t) {
  const sil = (x0, x1) => { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, '#f1f3f6'); gr.addColorStop(.45, '#b9bfc8'); gr.addColorStop(1, '#7b818c'); return gr; };
  g.strokeStyle = '#232226'; g.lineWidth = 9; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 36, base - 136); g.lineTo(x + 66, base - 126); g.lineTo(x + 60, base - 78); g.stroke();
  g.fillStyle = sil(x - 44, x + 44); g.beginPath(); g.moveTo(x - 44, base - 12); g.lineTo(x - 30, base - 76); g.lineTo(x + 30, base - 76); g.lineTo(x + 44, base - 12); g.closePath(); g.fill();
  g.fillStyle = '#8b919c'; g.fillRect(x - 31, base - 84, 62, 9);
  g.fillStyle = sil(x - 44, x + 44); g.beginPath(); g.moveTo(x - 30, base - 84); g.lineTo(x - 42, base - 144); g.lineTo(x - 56, base - 150); g.lineTo(x - 42, base - 152); g.lineTo(x + 40, base - 152); g.lineTo(x + 30, base - 84); g.closePath(); g.fill();
  g.fillStyle = '#9aa0aa'; g.beginPath(); g.moveTo(x - 42, base - 152); g.lineTo(x - 22, base - 170); g.lineTo(x + 22, base - 170); g.lineTo(x + 40, base - 152); g.closePath(); g.fill();
  g.fillStyle = '#232226'; g.beginPath(); g.arc(x, base - 176, 8, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(70,76,90,.35)'; g.lineWidth = 1.2; for (const k of [-.5, 0, .5]) { g.beginPath(); g.moveTo(x + k * 60, base - 13); g.lineTo(x + k * 40, base - 76); g.moveTo(x + k * 40, base - 84); g.lineTo(x + k * 56, base - 150); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 34, base - 22); g.lineTo(x - 23, base - 72); g.stroke();
  if (C.brew >= 1) { g.fillStyle = '#3b2318'; rr(g, x - 58, base - 150, 5, 5 + 3 * Math.sin(t * 20), 2); g.fill(); }
}
function shaker(g, x, base, rot, sc = 1) {
  g.save(); g.translate(x, base); g.rotate(rot); g.scale(sc, sc);
  const gr = g.createLinearGradient(-36, 0, 36, 0); gr.addColorStop(0, '#f1f3f6'); gr.addColorStop(.5, '#b9bfc8'); gr.addColorStop(1, '#7b818c');
  g.fillStyle = gr; g.beginPath(); g.moveTo(-26, 0); g.lineTo(-35, -84); g.lineTo(35, -84); g.lineTo(26, 0); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-35, -88); g.bezierCurveTo(-34, -118, -16, -124, -13, -126); g.lineTo(13, -126); g.bezierCurveTo(16, -124, 34, -118, 35, -88); g.closePath(); g.fill();
  g.fillStyle = '#8b919c'; g.fillRect(-36, -90, 72, 5); g.fillStyle = gr; rr(g, -13, -144, 26, 20, 5); g.fill();
  g.fillStyle = 'rgba(255,255,255,.6)'; rr(g, -27, -78, 5, 66, 2.5); g.fill();
  g.restore();
}
function layersOf() {
  const D = C.D, chai = chaiCol(), milk = hex(MILK[C.milk][0]), esp = hex('#3b2318');
  if (D.shaken) return [{ c: mix(mix(chai, milk, .52), esp, .16 + .07 * (C.shots - 1)), f: .82 * D.sh }, { c: mix(mix(chai, milk, .8), [255, 250, 240], .5), f: .06 * D.sh }];
  return [{ c: chai, f: .38 * D.chai }, { c: milk, f: .32 * D.milk }, { c: esp, f: (.1 + .05 * (C.shots - 1)) * D.esp }];
}
const foamCol = () => { let c = hex('#fffaf0'); if (C.foamAdd.cheese) c = mix(c, hex('#ffedc0'), .6); if (C.foamAdd.fsaffron) c = mix(c, hex('#f6cb5e'), .34); return c; };
function foamTop(g, x, y, w, n) {
  const r = R(63);
  if (C.foamAdd.salt) for (let i = 0; i < n; i++) flake(g, x + (r() - .5) * w, y + (r() - .5) * 5, r() * 3, 1.5 + r() * 1.3);
  if (C.foamAdd.fsaffron) for (let i = 0; i < n * .8; i++) thread(g, x + (r() - .5) * w, y + (r() - .5) * 5, r() * TAU, 8 + r() * 5);
}
function glass(g, x, base, t, done) {
  const h = 196, wt = 47, wb = 39, top = base - h, H = h - 16;
  const shape = i => { g.beginPath(); g.moveTo(x - wt + i, top); g.lineTo(x - wb + i, base - 8); g.quadraticCurveTo(x, base + 2 - i, x + wb - i, base - 8); g.lineTo(x + wt - i, top); g.closePath(); };
  g.fillStyle = 'rgba(60,40,20,.2)'; ell(g, x + 5, base + 2, 50, 9); g.fill();
  g.save(); shape(3); g.clip();
  const ls = C.inShaker ? [] : layersOf().filter(l => l.f > .001); let y = base - 4;
  ls.forEach((l, i) => {
    const lh = l.f * H; g.fillStyle = rgb(l.c); g.fillRect(x - 60, y - lh - .5, 120, lh + 1);
    if (i > 0 && !C.D.shaken) { const p = ls[i - 1], b = Math.min(16, lh, p.f * H), gr = g.createLinearGradient(0, y + b * .6, 0, y - b); gr.addColorStop(0, rgb(p.c)); gr.addColorStop(1, rgb(l.c)); g.fillStyle = gr; g.fillRect(x - 60, y - b, 120, b * 1.6); }
    y -= lh;
  });
  const ir = R(5); for (let i = 0; i < 8; i++) { const ix = x + (ir() - .5) * 52, iy = base - 22 - ir() * H * .74, s = 21 + ir() * 7, a = ir() * 1.4; g.save(); g.translate(ix, iy); g.rotate(a); g.fillStyle = iy > y ? 'rgba(255,255,255,.26)' : 'rgba(255,255,255,.4)'; rr(g, -s / 2, -s / 2, s, s, 5); g.fill(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.2; g.stroke(); g.restore(); }
  if (C.D.foam > 0 && !C.inShaker) { const fh = .13 * H * C.D.foam; g.fillStyle = rgb(foamCol()); g.fillRect(x - 60, y - fh, 120, fh + 1); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x - 60, y - fh, 120, 2.4); if (C.D.foam > .9) foamTop(g, x, y - fh + 5, 70, 9); y -= fh; }
  g.restore();
  if (done) { g.save(); g.translate(x + 16, top - 44); g.rotate(.2); g.fillStyle = '#f6ecd6'; g.fillRect(-4, 0, 8, 150); g.fillStyle = '#c9463b'; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(-4, i * 17); g.lineTo(4, i * 17 + 6); g.lineTo(4, i * 17 + 12); g.lineTo(-4, i * 17 + 6); g.fill(); } g.restore(); }
  g.fillStyle = 'rgba(255,255,255,.13)'; shape(0); g.fill(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.stroke();
  ell(g, x, top, wt, 5); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - wt + 9, top + 16); g.lineTo(x - wb + 6, base - 30); g.stroke();
  return y;
}
function jug(g, x, base, t, tilt) {
  g.save(); g.translate(x, base); g.rotate(tilt);
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 5; g.beginPath(); g.moveTo(36, -66); g.quadraticCurveTo(62, -50, 38, -22); g.stroke();
  const shape = () => { g.beginPath(); g.moveTo(-36, -84); g.lineTo(-48, -92); g.lineTo(-40, -76); g.quadraticCurveTo(-44, -20, -32, -2); g.lineTo(32, -2); g.quadraticCurveTo(44, -20, 38, -84); g.closePath(); };
  g.save(); shape(); g.clip(); const lv = .3 + .55 * C.whip, y = -2 - 84 * lv;
  g.fillStyle = rgb(mix(hex(MILK[C.milk][0]), foamCol(), .4 + .6 * C.whip)); g.fillRect(-50, y, 100, 90);
  const r = R(70 + (C.holding && !G.RM ? (t * 12 | 0) : 0)); for (let i = 0; i < 10 + C.whip * 40; i++) { g.fillStyle = `rgba(255,255,255,${.3 + r() * .4})`; g.beginPath(); g.arc((r() - .5) * 76, y + r() * 84 * lv, 1.2 + r() * 2.6, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-50, y, 100, 2.4); foamTop(g, 0, y + 6, 54, 5 + C.whip * 4);
  g.restore(); g.fillStyle = 'rgba(255,255,255,.14)'; shape(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.55)'; rr(g, -31, -74, 4.5, 58, 2); g.fill();
  if (tilt === 0) { const j = C.holding && !G.RM ? Math.sin(t * 70) * 1.6 : 0; g.strokeStyle = '#8f949c'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(26 + j, -170); g.lineTo(6 + j, -34); g.stroke(); g.strokeStyle = '#d9dce2'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#2b2a2e'; rr(g, 16 + j, -206, 20, 44, 7); g.fill(); g.strokeStyle = '#d9dce2'; g.lineWidth = 1.6; ell(g, 5 + j, -28, 8, 4); g.stroke(); }
  g.restore();
}
const stream = (g, x, y0, y1, col, w, t) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y0); g.bezierCurveTo(x + Math.sin(t * 9) * 2, lerp(y0, y1, .3), x - Math.sin(t * 11) * 2, lerp(y0, y1, .7), x, y1); g.stroke(); };
function meter(g, x, y, v, label) {
  g.font = `700 13px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(40,22,12,.25)'; rr(g, x - 79, y - 5, 160, 14, 7); g.fill(); g.fillStyle = PAPER; rr(g, x - 80, y - 7, 160, 14, 7); g.fill();
  g.fillStyle = LAMP; rr(g, x - 77, y - 4, Math.max(8, 154 * clamp(v, 0, 1)), 8, 4); g.fill();
  if (label) { const w = g.measureText(label).width + 18; g.fillStyle = PAPER; rr(g, x - w / 2, y - 34, w, 22, 11); g.fill(); g.fillStyle = INK; g.fillText(label, x, y - 22.5); }
}

/* ------------------------------------------------------------------ what's on offer, and how the game moves */
function chips() {
  const s = C.step; let list = null, kind = 'multi';
  if (s === 'spice') list = SPICES; else if (s === 'moka') { list = SHOTS; kind = 'one'; } else if (s === 'milk') { list = MILKS; kind = 'one'; } else if (s === 'mode') { list = MODES; kind = 'act'; } else if (s === 'foam' && C.whip === 0) list = FOAMS;
  if (!list) return [];
  const n = list.length, two = n > 4 && VW < 700, per = two ? Math.ceil(n / 2) : n, cw = Math.min(136, (VW - 36) / per);
  const on = id => s === 'spice' ? !!C.spices[id] : s === 'moka' ? C.shots === id : s === 'milk' ? C.milk === id : s === 'foam' ? !!C.foamAdd[id] : false;
  return list.map((o, i) => ({ ...o, kind, x: VW / 2 + ((two ? i % per : i) - (per - 1) / 2) * cw, y: L.trayY + (two ? ((i / per | 0) ? 42 : -42) : 0), w: cw - 8, h: two ? 76 : 122, sc: two ? .8 : 1.15, on: on(o.id) }));
}
function say(text, x, y) { says.push({ text, x: clamp(x, 110, VW - 110), y, life: 2.2 }); }
function drop(cols, n) { if (G.RM) return; for (let i = 0; i < n; i++) parts.push({ x: L.cxm + (Math.random() - .5) * 90, y: L.base - 190 - Math.random() * 40, vx: (Math.random() - .5) * 30, vy: 60 + Math.random() * 60, life: .7, c: cols[Math.random() * cols.length | 0], s: 2 + Math.random() * 2 }); }
function setStep(s) {
  C.step = s; const key = s === 'moka' && C.lit ? (C.brew >= 1 ? 'ready' : 'brew') : s; $('cstep').textContent = STEP[key];
  const nx = s === 'moka' && C.lit ? null : NEXT[s]; $('cnext').hidden = !nx; if (nx) $('cnext').textContent = nx;
}
function pick(c) {
  if (c.kind === 'multi') { const bag = C.step === 'spice' ? C.spices : C.foamAdd; bag[c.id] = !bag[c.id]; if (bag[c.id]) { for (let i = 0; i < 3; i++) tone(1100 + Math.random() * 900, .05, 'triangle', .035, i * .04); if (C.step === 'spice') drop({ rose: ['#e98fa6', '#f4b6c4'], saffron: ['#d9541a'], cinnamon: ['#8f5226'], cardamom: ['#9db86a'] }[c.id], 10); } else tone(420, .06, 'triangle', .03); }
  else if (c.kind === 'one') { if (C.step === 'moka') C.shots = c.id; else C.milk = c.id; tone(620, .06, 'triangle', .04); }
  else if (c.id === 'shake') { C.inShaker = true; setStep('shake'); tone(700, .08, 'sine', .05); }
  else { setStep('foam'); tone(700, .08, 'sine', .05); }
}
function next() {
  if (C.step === 'spice') setStep('boil');
  else if (C.step === 'moka' && !C.lit) { C.lit = true; setStep('moka'); tone(180, .1, 'triangle', .05); tone(900, .04, 'triangle', .03, .05); }
  else if (C.step === 'milk') setStep('pour');
}
function act() {
  /* a tap on whatever is on the stove */
  if (C.step === 'boil' && !C.lifted && C.over === 0) {
    if (C.level < .72) { say('Not yet. Let it rise.', L.cxm, L.base - 262); tone(300, .08, 'triangle', .04); return; }
    C.lifted = true; C.flame = false; C.wait = 1.1; say(C.level > .9 ? 'Just in time.' : 'Off the heat.', L.cxm, L.base - 262); tone(880, .14, 'sine', .06); tone(1320, .2, 'sine', .04, .08);
  } else if (C.step === 'moka' && C.brew >= 1) { tone(880, .14, 'sine', .06); setStep('milk'); }
}
function finish() {
  const sp = SPICES.filter(s => C.spices[s.id]).map(s => s.label.toLowerCase()), fo = FOAMS.filter(f => C.foamAdd[f.id]).map(f => f.label.replace('Maldon', 'MALDON').toLowerCase().replace('maldon', 'Maldon'));
  const join = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const name = (sp.length === 4 ? 'Fully spiced' : sp.length ? join(sp).replace(/^./, c => c.toUpperCase()) : 'Plain') + ' iced dirty chai';
  $('cname').textContent = name;
  const rows = [['Chai', (sp.length ? 'with ' + join(sp) : 'no extras') + (C.over ? '. It boiled over.' : '')], ['Coffee', (C.shots === 2 ? 'two shots' : 'one shot') + ' from the moka pot'], ['Milk', MILKS.find(m => m.id === C.milk).label.toLowerCase()], ['Mixed', C.D.shaken ? 'shaken like a cocktail' : 'layered over ice'], ['Cold foam', fo.length ? 'with ' + join(fo) : 'plain']];
  const ul = $('clist'); ul.textContent = ''; for (const [k, v] of rows) { const li = document.createElement('li'), b = document.createElement('b'); b.textContent = k; li.append(b, ' ' + v); ul.append(li); }
  $('cdone').hidden = false; $('cagain').focus(); [784, 988, 1175, 1568].forEach((f, i) => tone(f, .5, 'sine', .07, i * .13));
}
function update(dt) {
  const t = G.time, s = C.step;
  if (s === 'boil') {
    if (!C.lifted && C.over === 0) { C.level += dt * (.085 + .55 * Math.max(0, C.level - .6)); if (!G.RM && Math.random() < dt * (4 + C.level * 14)) tone(160 + Math.random() * 120 + C.level * 200, .05, 'sine', .02); if (C.level >= 1.02) { C.over = .01; C.flame = false; C.wait = 1.6; say('It boiled over. It always does.', L.cxm, L.base - 262); tone(233, .16, 'triangle', .06, 0, .8); tone(196, .22, 'triangle', .06, .12, .8); } }
    else { if (C.over > 0) C.over = Math.min(1, C.over + dt * 2.4); C.level = lerp(C.level, C.over ? .86 : .62, 1 - Math.exp(-dt * 3)); C.wait -= dt; if (C.wait <= 0) setStep('moka'); }
  }
  if (s === 'moka' && C.lit && C.brew < 1) { C.brew = Math.min(1, C.brew + dt / (3.6 + C.shots * .7)); if (!G.RM && Math.random() < dt * (3 + C.brew * 16)) tone(90 + Math.random() * 70 + C.brew * 120, .07, 'triangle', .022); if (C.brew >= 1) { setStep('moka'); tone(1568, .4, 'sine', .06); } }
  if (s === 'pour') { C.pour = Math.min(1, C.pour + dt / (G.RM ? 1.2 : 3.6)); C.D.chai = sm(C.pour, 0, .3); C.D.milk = sm(C.pour, .35, .65); C.D.esp = sm(C.pour, .7, 1); if (!G.RM && Math.random() < dt * 14) tone(500 + C.pour * 400 + Math.random() * 60, .06, 'sine', .016); if (C.pour >= 1) setStep('mode'); }
  if (s === 'shake') { C.shY = lerp(C.shY, C.drag ? C.drag.off : 0, 1 - Math.exp(-dt * 26)); if (C.shake >= 1) { C.drag = null; C.D.shaken = true; C.D.sh = 0; C.inShaker = false; setStep('spour'); tone(880, .14, 'sine', .06); } }
  if (s === 'spour') { C.shY = lerp(C.shY, 0, 1 - Math.exp(-dt * 10)); C.spour = Math.min(1, C.spour + dt / 1.3); C.D.sh = sm(C.spour, .15, 1); if (C.spour >= 1) setStep('foam'); }
  if (s === 'foam' && C.holding && C.whip < 1) { C.whip = Math.min(1, C.whip + dt / 2.4); if (!G.RM && Math.random() < dt * 22) tone(140 + Math.random() * 30, .05, 'sawtooth', .012); if (C.whip >= 1) { C.holding = false; setStep('fpour'); tone(880, .14, 'sine', .06); } }
  if (s === 'fpour') { C.fpour = Math.min(1, C.fpour + dt / 1.5); C.D.foam = sm(C.fpour, .25, 1); if (C.fpour >= 1) { setStep('done'); C.wait = 1.7; } }
  if (s === 'done' && C.wait > 0) { C.wait -= dt; if (C.wait <= 0) finish(); }
  C.gx = lerp(C.gx, s === 'shake' || s === 'spour' ? -96 : s === 'foam' || s === 'fpour' ? -74 : 0, 1 - Math.exp(-dt * 5));
  if (!G.RM && (s === 'spice' || s === 'boil' || (s === 'moka' && C.brew > .5)) && Math.random() < dt * 6) steam.push({ x: L.cxm + (Math.random() - .5) * 90 - (s === 'moka' ? 50 : 0), y: L.base - (s === 'moka' ? 150 : 104), life: 1, s: 8 + Math.random() * 6 });
  for (let i = steam.length - 1; i >= 0; i--) { const p = steam[i]; p.life -= dt * .6; p.y -= 34 * dt; p.s += dt * 9; if (p.life <= 0) steam.splice(i, 1); }
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) parts.splice(i, 1); }
  for (let i = says.length - 1; i >= 0; i--) { const q = says[i]; q.life -= dt; q.y -= 12 * dt; if (q.life <= 0) says.splice(i, 1); }
  moth.x = lerp(moth.x, L.cxm - 150 + Math.sin(t * .8) * 16, 1 - Math.exp(-dt * 2)); moth.y = lerp(moth.y, L.base - 210 + Math.sin(t * 2.1) * 10, 1 - Math.exp(-dt * 2));
}
function tag(g, text, x, y, a) {
  g.font = `700 14.5px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(text).width + 20; g.globalAlpha = a;
  g.fillStyle = 'rgba(40,22,12,.25)'; rr(g, x - w / 2 + 1.5, y - 10.5, w, 25, 12.5); g.fill(); g.fillStyle = PAPER; rr(g, x - w / 2, y - 12.5, w, 25, 12.5); g.fill(); g.fillStyle = INK; g.fillText(text, x, y + .5); g.globalAlpha = 1;
}
function frame(dt) {
  if (!L || !SPR) return;
  update(dt);
  const t = G.time, g = cx, s = C.step, x = L.cxm, b = L.base;
  g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(SPR.room, 0, 0, VW, VH);
  if (!G.RM) { const m = R(9); for (let i = 0; i < 22; i++) { const mx = (m() * VW + t * (4 + m() * 8)) % VW, my = (m() * L.ct + Math.sin(t * .4 + i) * 20 + L.ct) % L.ct; g.fillStyle = `rgba(255,248,220,${.25 + .25 * Math.sin(t + i)})`; g.fillRect(mx, my, 1.6, 1.6); } }
  g.save(); g.translate(x, b + 18); g.scale(L.K, L.K); g.translate(-x, -(b + 18));
  if (s === 'spice' || s === 'boil') { hob(g, x, b, C.flame, t); pan(g, x, b + (C.lifted ? -16 : 0), t); }
  else if (s === 'moka') { hob(g, x, b, C.lit && C.brew < 1, t); moka(g, x, b - 6, t); if (C.lit && C.brew < 1) meter(g, x, b + 44, C.brew, null); }
  else {
    const gx = x + C.gx, topY = glass(g, gx, b + 18, t, s === 'done');
    if (s === 'pour') { const p = C.pour, col = p < .33 ? rgb(chaiCol()) : p < .68 ? MILK[C.milk][0] : '#3b2318'; if ((p > .01 && p < .3) || (p > .35 && p < .65) || (p > .7 && p < .99)) stream(g, gx + (p < .33 ? -14 : p < .68 ? 0 : 14), b - 330, topY, col, p > .68 ? 3.4 : 5.5, t); }
    if (s === 'shake' || s === 'spour') { const p = C.spour, tip = sm(p, 0, .25) * (1 - sm(p, .85, 1)); shaker(g, x + 56 - tip * 70, b + 18 + C.shY - tip * 150, (C.drag ? Math.sin(t * 40) * .05 : 0) - tip * 2, 1); if (s === 'spour' && p > .15 && p < .9) stream(g, gx + 8, b - 230, topY, rgb(layersOf()[0].c), 5, t); if (s === 'shake') meter(g, x + 56, b + 60, C.shake, null); }
    if (s === 'foam' || s === 'fpour') { const p = C.fpour, tip = sm(p, 0, .25) * (1 - sm(p, .85, 1)); jug(g, x + 84 - tip * 86, b + 18 - tip * 210, t, -tip * 1.75); if (s === 'fpour' && p > .2 && p < .9) stream(g, gx + 10, b - 250, topY + 2, rgb(foamCol()), 7, t); if (s === 'foam' && C.whip > 0) meter(g, x + 84, b + 60, C.whip, null); }
    if (s === 'done') { g.globalCompositeOperation = 'lighter'; glow(g, gx, b - 90, 190, '255,226,160', .22 + .05 * Math.sin(t * 2)); g.globalCompositeOperation = 'source-over'; if (!G.RM) { const k = R(2); for (let i = 0; i < 10; i++) { const a = k() * TAU + t * .4, d = 90 + k() * 60, tw = .5 + .5 * Math.sin(t * 3 + i * 2); g.fillStyle = `rgba(255,244,200,${tw})`; g.beginPath(); g.arc(gx + Math.cos(a) * d, b - 90 + Math.sin(a) * d * .8, 1.6 + tw * 1.6, 0, TAU); g.fill(); } } }
  }
  for (const p of steam) { g.fillStyle = `rgba(255,255,255,${p.life * .2})`; g.beginPath(); g.arc(p.x, p.y, p.s, 0, TAU); g.fill(); }
  for (const p of parts) { g.fillStyle = p.c; g.globalAlpha = Math.min(1, p.life * 2.5); g.beginPath(); g.arc(p.x, p.y, p.s, 0, TAU); g.fill(); } g.globalAlpha = 1;
  /* a nudge toward whatever wants tapping */
  const pu = .5 + .5 * Math.sin(t * 5); g.strokeStyle = `rgba(255,250,220,${.55 + .4 * pu})`; g.lineWidth = 3.5;
  if ((s === 'boil' && C.level > .72 && !C.lifted && !C.over) || (s === 'moka' && C.brew >= 1)) { ell(g, x, b - 80, 108 + pu * 5, 96 + pu * 5); g.stroke(); }
  if (s === 'shake' && !C.drag && C.shake < .05) { ell(g, x + 56, b - 50, 50 + pu * 4, 86 + pu * 4); g.stroke(); }
  if (s === 'foam' && !C.holding && C.whip < .05) { ell(g, x + 84, b - 30, 58 + pu * 4, 62 + pu * 4); g.stroke(); }
  g.restore();
  /* the board, only while there is something on it */
  const cs = chips();
  if (cs.length) { const tw = Math.min(VW - 20, 820); g.fillStyle = 'rgba(90,55,25,.26)'; rr(g, VW / 2 - tw / 2 + 2, L.trayY - 86, tw, 178, 20); g.fill(); g.fillStyle = '#a97a4c'; rr(g, VW / 2 - tw / 2, L.trayY - 90, tw, 178, 20); g.fill(); g.strokeStyle = 'rgba(255,230,190,.35)'; g.lineWidth = 2; rr(g, VW / 2 - tw / 2 + 5, L.trayY - 85, tw - 10, 168, 16); g.stroke(); }
  for (const c of cs) {
    g.fillStyle = 'rgba(60,35,15,.2)'; rr(g, c.x - c.w / 2 + 1.5, c.y - c.h / 2 + 2.5, c.w, c.h, 14); g.fill();
    g.fillStyle = c.on ? PAPER : 'rgba(251,243,223,.62)'; rr(g, c.x - c.w / 2, c.y - c.h / 2, c.w, c.h, 14); g.fill();
    if (c.on) { g.strokeStyle = LAMP; g.lineWidth = 3; g.stroke(); g.fillStyle = OKC; g.beginPath(); g.arc(c.x + c.w / 2 - 12, c.y - c.h / 2 + 12, 7, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(c.x + c.w / 2 - 15.5, c.y - c.h / 2 + 12); g.lineTo(c.x + c.w / 2 - 12.8, c.y - c.h / 2 + 14.8); g.lineTo(c.x + c.w / 2 - 8.6, c.y - c.h / 2 + 9.4); g.stroke(); }
    g.save(); g.translate(c.x, c.y - c.h * .13); g.scale(c.sc, c.sc); ICON[c.id](g); g.restore(); g.globalAlpha = 1;
    let fs = c.h > 100 ? 14 : 12.5; g.font = `700 ${fs}px ${UI}`; while (g.measureText(c.label).width > c.w - 8 && fs > 10) { fs -= .5; g.font = `700 ${fs}px ${UI}`; }
    g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c.label, c.x, c.y + c.h / 2 - (c.h > 100 ? 17 : 12));
  }
  for (const q of says) tag(g, q.text, q.x, q.y, Math.min(1, q.life * 2));
  g.globalCompositeOperation = 'lighter'; glow(g, moth.x, moth.y, 46, '255,214,130', .3 + .08 * Math.sin(t * 6)); g.globalCompositeOperation = 'source-over';
  { const f = G.RM ? .6 : Math.abs(Math.sin(t * 17)); g.fillStyle = 'rgba(255,246,214,.94)'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(moth.x + d * (2 + 4.5 * f), moth.y - 2, 1.6 + 5 * f, 5.4, d * .5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(moth.x + d * (1.5 + 3 * f), moth.y + 4, 1.2 + 3 * f, 3.4, d * -.4, 0, TAU); g.fill(); } g.fillStyle = '#ffd874'; ell(g, moth.x, moth.y, 2.2, 4.6); g.fill(); }
  G.paper(g, .26);
}

/* ------------------------------------------------------------------ input and wiring */
const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
cv.addEventListener('pointerdown', e => {
  if (!active || !L || !$('cdone').hidden) return; const [px, py] = pt(e), s = C.step;
  const c = chips().find(c => Math.abs(px - c.x) < c.w / 2 + 3 && Math.abs(py - c.y) < c.h / 2 + 3); if (c) { pick(c); return; }
  const x = L.cxm + (px - L.cxm) / L.K, y = L.base + 18 + (py - L.base - 18) / L.K;
  if ((s === 'boil' || s === 'moka') && Math.abs(x - L.cxm) < 130 && y > L.base - 210 && y < L.base + 30) { act(); return; }
  if (s === 'shake' && Math.abs(x - (L.cxm + 56)) < 70 && y > L.base - 170 && y < L.base + 70) { C.drag = { y0: y, last: y, off: 0 }; try { cv.setPointerCapture(e.pointerId); } catch (_) { /* fine without capture */ } e.preventDefault(); return; }
  if (s === 'foam' && Math.abs(x - (L.cxm + 84)) < 80 && y > L.base - 220 && y < L.base + 40) { C.holding = true; try { cv.setPointerCapture(e.pointerId); } catch (_) { /* fine without capture */ } e.preventDefault(); }
});
cv.addEventListener('pointermove', e => {
  if (!active || !C.drag) return; const [, y] = pt(e), d = Math.abs(y - C.drag.last);
  C.drag.last = y; C.drag.off = clamp(y - C.drag.y0, -70, 50); C.shake = Math.min(1, C.shake + d / 1100);
  if (d > 6) tone(1500 + Math.random() * 1400, .03, 'triangle', .03);
});
const letGo = () => { C.drag = null; C.holding = false; };
cv.addEventListener('pointerup', letGo); cv.addEventListener('pointercancel', letGo);
addEventListener('keydown', e => {
  if (!active || e.metaKey || e.ctrlKey || !$('cdone').hidden) return;
  const cs = chips(), i = '123456'.indexOf(e.key); if (i >= 0 && cs[i]) { pick(cs[i]); return; }
  if (e.key !== ' ' && e.key !== 'Enter') return; if (e.target && e.target.tagName === 'BUTTON') return; e.preventDefault();
  if (C.step === 'boil' || (C.step === 'moka' && C.brew >= 1)) act(); else if (C.step === 'shake') { if (!e.repeat) { C.shake = Math.min(1, C.shake + .13); C.shY = -40; tone(1500 + Math.random() * 1400, .03, 'triangle', .03); } } else if (C.step === 'foam') C.holding = true; else if (!$('cnext').hidden) next();
});
addEventListener('keyup', e => { if (active && (e.key === ' ' || e.key === 'Enter')) C.holding = false; });
const soundLabel = () => { $('csound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('csound').setAttribute('aria-pressed', G.sound); };
$('csound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
$('cnext').addEventListener('click', next);
$('cleave').addEventListener('click', () => G.go('road', { atDoor: true }));
$('cagain').addEventListener('click', () => { $('cdone').hidden = true; C = fresh(); steam.length = parts.length = says.length = 0; setStep('spice'); });
$('cback').addEventListener('click', () => { $('cdone').hidden = true; C = fresh(); G.go('road', { atDoor: true }); });

G.scenes.chai = {
  frame, resize: layout,
  enter() { active = true; $('cui').hidden = false; layout(); setStep(C.step); soundLabel(); moth.x = L.cxm - 150; moth.y = L.base - 210; if (document.fonts && document.fonts.load) document.fonts.load('700 14px Nunito'); },
  leave() { active = false; letGo(); $('cui').hidden = true; },
  debug: { get C() { return C; }, get L() { return L; }, get S() { return S; }, chips, next, act, pick }
};
})();
