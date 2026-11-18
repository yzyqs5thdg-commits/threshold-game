/* Table for two. A tasting menu of everything they have eaten together: each course arrives under a cloche,
   lifting it shows the dish and then the real photo. The window, the flowers and the frames on the wall open too. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, TAU, R, dab, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif';
const INK = '#2c2a3d', PAPER = '#fbf3df';
const COURSES = [
  { id: 'pretzel', name: 'To start: the pretzel', items: [{ id: 'pretzel', title: 'The pretzel', text: 'Bigger than your face, and you proved it.' }] },
  { id: 'brunch', name: 'Brunch outside', items: [{ id: 'brunch', title: 'Brunch outside', text: 'Shakshuka in its little pan, and the smile you make at food.' }] },
  { id: 'mojito', name: 'The Cuban café', items: [{ id: 'mojito', title: 'The Cuban café', text: 'More mint than glass.' }] },
  { id: 'sushi', name: 'Sushi', items: [{ id: 'sushi', title: 'Sushi', text: 'One piece held up for the camera before anyone was allowed to eat.' }] },
  { id: 'feast', name: 'The feast', items: [{ id: 'feast', title: 'The feast', text: 'We ordered everything. The table can confirm.' }] },
  { id: 'street', name: 'Street food at night', items: [{ id: 'street', title: 'Street food at night', text: 'Little stools, bright lights, chopsticks.' }] },
  { id: 'pasta', name: 'Dinner at home', items: [{ id: 'pasta', title: 'Dinner at home', text: 'Rigatoni, a salad, and two spritzes in the fancy glasses.' }] },
  { id: 'wine', name: 'The wine flight', items: [{ id: 'wine', title: 'The wine flight', text: 'Four reds named in chalk, three whites waiting behind them.' }, { id: 'trick', title: 'The party trick', text: 'A wine glass, balanced where a wine glass should not be.' }] },
  { id: 'maggi', name: 'And to finish: Maggi', items: [{ id: 'maggi', title: 'And to finish, Maggi', text: 'Held like something precious, which it is.' }] }
];
const EXTRA = {
  window: { name: 'Out the window', items: [{ id: 'bridge', title: 'Under the bridge', text: 'Sunset behind the skyline, and you on the rocks by the water.' }] },
  flowers: { name: 'The flowers', items: [{ id: 'flowers', title: 'The flowers', text: 'A whole bouquet, and the biggest smile on the street.' }] },
  vest: { name: 'On the wall', items: [{ id: 'vest', title: 'Outfit check', text: 'Green vest, hands on hips, ready to go.' }] },
  boat: { name: 'On the wall', items: [{ id: 'boat', title: 'The boat party', text: 'Three of us, mid-song and slightly blurred.' }] }
};
const img = {}; for (const k of ['vest', 'boat']) { const im = new Image(); im.onload = () => { im.ok = true; }; im.src = `media/tb_${k}.jpg`; img[k] = im; }
let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false, view = null;
const T = { i: 0, state: 'arrive', t: 0, done: 0, endShown: false }, says = [], moth = { x: 0, y: 0 };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };

function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S; const wide = VW >= 760, cxm = VW / 2, ty = VH - 250;
  L = { wide, cxm, ty, jx: cxm - (wide ? 210 : 112), fx: cxm + (wide ? 210 : 112), cy: ty + 78,
    win: wide ? { x: cxm - 140, y: 66, w: 280, h: 176 } : { x: 16, y: 130, w: 150, h: 130 },
    fr: wide ? { vest: { x: cxm - 350, y: 84, w: 112, h: 150 }, boat: { x: cxm + 238, y: 84, w: 112, h: 150 } } : { vest: { x: VW - 196, y: 130, w: 80, h: 107 }, boat: { x: VW - 98, y: 130, w: 80, h: 107 } },
    fl: wide ? { x: cxm - 400, y: ty + 96 } : { x: 46, y: ty + 168 }, cd: wide ? { x: cxm + 400, y: ty + 96 } : { x: VW - 46, y: ty + 168 } };
  const key = `${Math.round(VW)}x${Math.round(VH)}`; if (!SPR || SPR.key !== key) SPR = { key, room: G.spr(VW, VH, drawRoom, clamp(S * G.DPR, 1, 2.5)) };
  $('tbui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function drawRoom(g, w, h) {
  const r = R(808), ty = L.ty, W = L.win, wy = ty - 150;
  let gr = g.createLinearGradient(0, 0, 0, wy); gr.addColorStop(0, '#c97a6a'); gr.addColorStop(1, '#e0a08a'); g.fillStyle = gr; g.fillRect(0, 0, w, wy);
  for (let i = 0; i < w * .5; i++) dab(g, r() * w, r() * wy, 14 + r() * 40, 5 + r() * 12, 0, r() < .5 ? '#ecb49c' : '#b96a5c', .14); g.globalAlpha = 1;
  /* white tile below, like the pretzel place */
  g.fillStyle = '#f4efe4'; g.fillRect(0, wy, w, ty - wy); g.strokeStyle = 'rgba(60,50,50,.45)'; g.lineWidth = 1; for (let row = 0; row * 22 < ty - wy; row++) { const y = wy + row * 22; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = (row % 2) * 24 - 24; x < w; x += 48) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 22); g.stroke(); } }
  g.fillStyle = '#3a2c2c'; g.fillRect(0, wy - 6, w, 6);
  /* the window: the bridge at sunset */
  g.fillStyle = 'rgba(60,30,20,.25)'; rr(g, W.x - 6, W.y - 4, W.w + 20, W.h + 20, 8); g.fill(); g.fillStyle = '#3a2c2c'; rr(g, W.x - 9, W.y - 9, W.w + 18, W.h + 18, 7); g.fill();
  g.save(); g.beginPath(); g.rect(W.x, W.y, W.w, W.h); g.clip();
  gr = g.createLinearGradient(0, W.y, 0, W.y + W.h); gr.addColorStop(0, '#7f9fd0'); gr.addColorStop(.6, '#f2c9a0'); gr.addColorStop(.75, '#f6b070'); gr.addColorStop(.76, '#6f8fb0'); gr.addColorStop(1, '#4a6a94'); g.fillStyle = gr; g.fillRect(W.x, W.y, W.w, W.h);
  const hz = W.y + W.h * .76; for (let x = W.x; x < W.x + W.w; x += 6 + r() * 9) { const bh = 8 + r() * r() * 46; g.fillStyle = r() < .5 ? '#5a5a7a' : '#6a6480'; g.fillRect(x, hz - bh, 5 + r() * 7, bh); }
  g.fillStyle = 'rgba(255,220,170,.5)'; for (let i = 0; i < 30; i++) g.fillRect(W.x + r() * W.w, hz + 3 + r() * (W.h * .22), 8 + r() * 14, 1.4);
  const bx = W.x + W.w * .3; g.fillStyle = '#3f5f8c'; g.fillRect(bx - 9, W.y + 6, 18, hz - W.y); g.fillStyle = '#f2c9a0'; rr(g, bx - 4, W.y + 26, 8, 34, 4); g.fill(); g.fillStyle = '#3f5f8c'; g.fillRect(W.x, W.y + W.h * .36, W.w, 9);
  g.strokeStyle = '#3f5f8c'; g.lineWidth = 2; g.beginPath(); g.moveTo(W.x - 20, W.y + W.h * .3); g.quadraticCurveTo(bx - 60, W.y + W.h * .3, bx, W.y + 6); g.quadraticCurveTo(bx + 150, W.y + W.h * .42, W.x + W.w + 40, W.y + 2); g.stroke(); g.lineWidth = .7; for (let x = W.x + 6; x < W.x + W.w; x += 9) { g.beginPath(); g.moveTo(x, W.y + W.h * .36); g.lineTo(x, W.y + W.h * (x < bx ? .1 + .2 * (bx - x) / (bx - W.x) : .06 + .3 * Math.pow(1 - Math.abs(x - bx - 150) / 150, 2) * (x < bx + 150 ? 1 : .6))); g.stroke(); }
  g.restore(); g.strokeStyle = '#3a2c2c'; g.lineWidth = 4; g.beginPath(); g.moveTo(W.x + W.w / 2, W.y); g.lineTo(W.x + W.w / 2, W.y + W.h); g.stroke();
  /* string lights and globe lamps */
  g.strokeStyle = 'rgba(40,24,24,.6)'; g.lineWidth = 1.2; g.beginPath(); for (let x = 0; x < w; x += 150) { g.moveTo(x, 30); g.quadraticCurveTo(x + 75, 60, x + 150, 30); } g.stroke();
  for (const fx of L.wide ? [.14, .86] : [.3, .72]) { const x = w * fx, y = L.wide ? 300 : 340; g.strokeStyle = '#3a2c2c'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, y - 30); g.stroke(); gr = g.createRadialGradient(x - 8, y - 10, 4, x, y, 32); gr.addColorStop(0, '#fffdf6'); gr.addColorStop(1, '#f0e4cc'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 30, 0, TAU); g.fill(); }
  /* the tabletop */
  g.fillStyle = 'rgba(40,24,16,.35)'; g.fillRect(0, ty - 4, w, 8); gr = g.createLinearGradient(0, ty, 0, h); gr.addColorStop(0, '#fbf6ea'); gr.addColorStop(1, '#e9dfcc'); g.fillStyle = gr; g.fillRect(0, ty, w, h - ty);
  g.strokeStyle = 'rgba(200,70,60,.22)'; g.lineWidth = 10; for (let x = (L.cxm % 44) - 44; x < w; x += 44) { g.beginPath(); g.moveTo(x, ty); g.lineTo(L.cxm + (x - L.cxm) * 1.5, h); g.stroke(); } for (let k = 0; k < 6; k++) { const y = ty + (h - ty) * Math.pow((k + .5) / 6, 1.3); g.lineWidth = 6 + k * 2; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  gr = g.createLinearGradient(0, ty, 0, ty + 26); gr.addColorStop(0, 'rgba(70,40,20,.22)'); gr.addColorStop(1, 'rgba(70,40,20,0)'); g.fillStyle = gr; g.fillRect(0, ty, w, 26);
}

/* ------------------------------------------------------------------ what is under the cloche */
const plate = g => { g.fillStyle = 'rgba(60,40,20,.2)'; ell(g, 3, 5, 58, 19); g.fill(); g.fillStyle = '#fdfbf4'; ell(g, 0, 0, 58, 19); g.fill(); g.strokeStyle = 'rgba(150,140,120,.4)'; g.lineWidth = 1; ell(g, 0, 0, 44, 13); g.stroke(); };
const DISH = {
  pretzel(g) { plate(g); g.lineCap = 'round'; for (const [c, w] of [['#6e3a16', 12], ['#a8642c', 8]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(-18, 2); g.bezierCurveTo(-56, -22, -32, -64, -6, -44); g.bezierCurveTo(6, -34, 10, -14, 18, 2); g.moveTo(18, 2); g.bezierCurveTo(56, -22, 32, -64, 6, -44); g.bezierCurveTo(-6, -34, -10, -14, -18, 2); g.stroke(); } const r = R(3); g.fillStyle = '#fffdf6'; for (let i = 0; i < 26; i++) { const a = r() * TAU; g.fillRect(Math.cos(a) * (18 + r() * 14), -26 + Math.sin(a) * (18 + r() * 12), 2, 2); } },
  brunch(g) { plate(g); g.fillStyle = '#1c1c1e'; rr(g, 28, -8, 44, 9, 4); g.fill(); ell(g, -4, -6, 38, 14); g.fill(); g.fillStyle = '#c8402c'; ell(g, -4, -8, 32, 10.5); g.fill(); for (const x of [-16, 8]) { g.fillStyle = '#fffdf6'; ell(g, x, -9, 11, 6); g.fill(); g.fillStyle = '#f2b02c'; ell(g, x + 1, -9, 4.4, 3); g.fill(); } g.fillStyle = '#3f8a3c'; ell(g, -3, -13, 6, 3); g.fill(); g.fillStyle = '#d9b06a'; rr(g, -54, -12, 26, 11, 5); g.fill(); },
  mojito(g, t) { g.fillStyle = 'rgba(60,40,20,.2)'; ell(g, 2, 4, 22, 6); g.fill(); g.fillStyle = 'rgba(230,245,235,.75)'; rr(g, -16, -66, 32, 68, 4); g.fill(); const r = R(5); for (let i = 0; i < 22; i++) dab(g, -11 + r() * 22, -58 + r() * 52, 5, 3.4, r() * 3, r() < .5 ? '#3f8a3c' : '#6fb04e', .95); g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.5; rr(g, -16, -66, 32, 68, 4); g.stroke(); g.strokeStyle = '#fdfbf4'; g.lineWidth = 3; g.beginPath(); g.moveTo(4, -10); g.lineTo(14, -84); g.stroke(); },
  sushi(g) { plate(g); for (const [x, c] of [[-30, '#f08a6a'], [-8, '#8fc04a'], [14, '#f08a6a'], [34, '#f2cf62']]) { g.fillStyle = '#17161a'; ell(g, x, -8, 12, 11); g.fill(); g.fillStyle = '#fffdf6'; ell(g, x, -9, 9, 8); g.fill(); g.fillStyle = c; ell(g, x, -9, 4, 3.6); g.fill(); } g.fillStyle = '#9ac84a'; ell(g, -48, -2, 5, 3.4); g.fill(); },
  feast(g) { plate(g); for (const [x, y, c, s] of [[-34, -8, '#c8641c', 1], [-6, -14, '#7a3a1c', 1], [24, -8, '#d98a2c', 1], [-18, 2, '#5f9a3c', .7]]) { g.fillStyle = '#e6e8ee'; ell(g, x, y, 15 * s, 8 * s); g.fill(); g.fillStyle = c; ell(g, x, y - 1.5, 12 * s, 6 * s); g.fill(); } g.fillStyle = '#e9c070'; ell(g, 34, -22, 16, 11); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; ell(g, 30, -26, 6, 3); g.fill(); },
  street(g) { g.fillStyle = 'rgba(60,40,20,.2)'; ell(g, 3, 5, 52, 16); g.fill(); g.fillStyle = '#5f8fd0'; ell(g, 0, 0, 52, 16); g.fill(); const r = R(7); for (let i = 0; i < 16; i++) dab(g, -30 + r() * 44, -6 + r() * 8, 6, 3.4, r() * 3, r() < .6 ? '#3a1c3a' : '#c9a66a', 1); g.globalAlpha = 1; g.fillStyle = '#4f9a44'; ell(g, 34, -12, 15, 10); g.fill(); g.fillStyle = '#3f7f38'; ell(g, 34, -13, 11, 6.4); g.fill(); g.strokeStyle = '#ecd8a8'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-8, -6); g.lineTo(-52, -44); g.moveTo(-2, -8); g.lineTo(-44, -50); g.stroke(); },
  pasta(g) { plate(g); g.fillStyle = '#fdfbf4'; g.beginPath(); g.moveTo(-36, -14); g.quadraticCurveTo(-30, 8, 0, 8); g.quadraticCurveTo(30, 8, 36, -14); g.fill(); g.strokeStyle = '#27375c'; g.lineWidth = 2.4; for (let i = -5; i <= 5; i++) { g.beginPath(); g.moveTo(i * 6, -12); g.lineTo(i * 5, 6); g.stroke(); } g.fillStyle = '#f4ead0'; ell(g, 0, -15, 35, 9); g.fill(); const r = R(9); for (let i = 0; i < 12; i++) { g.fillStyle = '#ecd9a4'; rr(g, -26 + r() * 44, -22 + r() * 9, 11, 6, 3); g.fill(); } g.fillStyle = 'rgba(244,236,170,.9)'; rr(g, 46, -56, 10, 30, 3); g.fill(); g.strokeStyle = '#9ac84a'; g.lineWidth = 2; g.beginPath(); g.moveTo(51, -26); g.lineTo(51, 0); g.stroke(); },
  wine(g) { g.fillStyle = 'rgba(60,40,20,.2)'; rr(g, -60, -4, 126, 22, 3); g.fill(); g.fillStyle = '#e2c79a'; rr(g, -64, -10, 128, 22, 3); g.fill(); g.fillStyle = '#17161a'; g.fillRect(-64, 4, 128, 9); g.strokeStyle = '#c8d86a'; g.lineWidth = 1.2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-52 + i * 32, 10); g.quadraticCurveTo(-46 + i * 32, 5, -38 + i * 32, 10); g.stroke(); } for (let i = 0; i < 4; i++) { const x = -48 + i * 32; g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(x - 6, -46); g.lineTo(x - 4, -34); g.quadraticCurveTo(x - 14, -24, x - 12, -8); g.lineTo(x + 12, -8); g.quadraticCurveTo(x + 14, -24, x + 4, -34); g.lineTo(x + 6, -46); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.2; g.stroke(); g.fillStyle = '#4a101c'; g.beginPath(); g.moveTo(x - 12.5, -22); g.lineTo(x - 11.5, -9); g.lineTo(x + 11.5, -9); g.lineTo(x + 12.5, -22); g.closePath(); g.fill(); } },
  maggi(g) { plate(g); g.save(); g.translate(0, -20); g.rotate(-.12); g.fillStyle = '#f6d21c'; rr(g, -44, -20, 88, 40, 5); g.fill(); g.fillStyle = '#d82a1c'; ell(g, -24, -6, 14, 8); g.fill(); g.fillStyle = '#c8402c'; g.beginPath(); g.arc(14, 0, 14, 0, TAU); g.fill(); g.fillStyle = '#f2cf62'; g.beginPath(); g.arc(14, 0, 10, 0, TAU); g.fill(); g.fillStyle = '#2f62c0'; rr(g, -40, 6, 30, 8, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-42, -18, 84, 3); g.restore(); }
};
function cloche(g, lift) {
  g.save(); g.translate(0, -lift * 130); g.globalAlpha = 1 - sm(lift, .5, 1); const gr = g.createLinearGradient(-60, 0, 60, 0); gr.addColorStop(0, '#f4f6f8'); gr.addColorStop(.5, '#b4bac4'); gr.addColorStop(1, '#7d838e');
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, 4, 62, 62, 0, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = '#8f949c'; rr(g, -66, 2, 132, 7, 3); g.fill(); g.fillStyle = gr; g.beginPath(); g.arc(0, -62, 8, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-26, -28, 9, 22, .5, 0, TAU); g.fill(); g.restore(); g.globalAlpha = 1;
}
function person(g, x, who, t, joy) {
  const y = L.ty + 6, j = who === 'j', k = G.people[who], z = L.wide ? 1.35 : 1.1;
  g.save(); g.translate(x, y); g.scale(z, z); g.translate(-x, -y);
  g.fillStyle = j ? '#b3242e' : '#1c1c22'; g.beginPath(); g.moveTo(x - 56, y); g.quadraticCurveTo(x - 54, y - 62, x - 20, y - 66); g.lineTo(x + 20, y - 66); g.quadraticCurveTo(x + 54, y - 62, x + 56, y); g.closePath(); g.fill();
  g.fillStyle = k.skin; g.beginPath(); g.moveTo(x - 22, y - 66); g.quadraticCurveTo(x, y - 46, x + 22, y - 66); g.fill(); g.fillRect(x - 8, y - 84, 16, 20);
  G.headFront(g, who, { x, y: y - 112 + Math.sin(t * 1.6 + (j ? 0 : 1)) * 1.2 * (G.RM ? 0 : 1), r: 32, len: 78, expr: joy ? 'joy' : 'smile', blink: !G.RM && ((t + (j ? 0 : 1.7)) % 3.6) < .12 });
  g.restore();
}

/* ------------------------------------------------------------------ service */
function setStep() {
  const c = COURSES[T.i]; $('tbstep').textContent = T.state === 'over' ? 'The table is yours. Tap the window, the flowers or the frames.' : T.state === 'wait' ? `Course ${T.i + 1} of ${COURSES.length}: ${c.name}. Tap the cloche.` : T.state === 'lift' ? `Course ${T.i + 1} of ${COURSES.length}: ${c.name}.` : 'The next course is on its way. Look around: the window, the flowers, the frames.';
  $('tbcount').textContent = `Courses ${T.done} of ${COURSES.length}`;
}
const pic = $('tbimg');
function show() { const s = view.src, it = s.items[view.i]; $('tbno').textContent = s.name + (s.items.length > 1 ? `  ·  ${view.i + 1} of ${s.items.length}` : ''); $('tbtitle').textContent = it.title; $('tbtext').textContent = it.text; pic.alt = it.title; pic.src = `media/tb_${it.id}.jpg`; $('tbnav').hidden = s.items.length < 2; $('tbp').disabled = view.i === 0; $('tbn').disabled = view.i === s.items.length - 1; }
function open(src, course) { view = { src, i: 0, course }; $('tbview').hidden = false; show(); $('tbclose').focus(); }
function closeView() {
  const wasCourse = view && view.course; $('tbview').hidden = true; pic.removeAttribute('src'); view = null; if (!wasCourse) return;
  if (T.i < COURSES.length - 1) { T.i++; T.state = 'arrive'; T.t = 0; setStep(); }
  else { T.state = 'over'; setStep(); if (!T.endShown) { T.endShown = true; $('tbend').hidden = false; $('tbstay').focus(); [523, 659, 784, 1047].forEach((f, i) => tone(f, .9, 'sine', .05, i * .22)); } }
}
function lift() { if (T.state !== 'wait') return; T.state = 'lift'; T.t = 0; setStep(); tone(1568, .5, 'sine', .07); tone(2093, .4, 'sine', .04, .06); says.push({ text: ['Ooh.', 'Yes.', 'This one.', 'Obviously.', 'So much food.', 'Perfect.', 'We made this.', 'Cheers.', 'Of course.'][T.i], life: 1.8 }); }
function update(dt) {
  const t = G.time; T.t += dt;
  if (T.state === 'arrive' && T.t > 1.5) { T.state = 'wait'; T.t = 0; setStep(); tone(880, .1, 'sine', .05); }
  if (T.state === 'lift' && T.t > 2.3 && $('tbview').hidden) { T.done = Math.max(T.done, T.i + 1); setStep(); open(COURSES[T.i], true); }
  for (let i = says.length - 1; i >= 0; i--) { says[i].life -= dt; if (says[i].life <= 0) says.splice(i, 1); }
  moth.x = lerp(moth.x, L.cxm + Math.sin(t * .8) * 30, 1 - Math.exp(-dt * 2)); moth.y = lerp(moth.y, L.ty - (L.wide ? 100 : 190) + Math.sin(t * 2.1) * 10, 1 - Math.exp(-dt * 2));
}
function frame(dt) {
  if (!L || !SPR) return; update(dt);
  const t = G.time, g = cx, cxm = L.cxm, ty = L.ty; g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(SPR.room, 0, 0, VW, VH);
  /* frames with the real photos */
  for (const k of ['vest', 'boat']) { const f = L.fr[k], im = img[k]; g.save(); g.translate(f.x + f.w / 2, f.y + f.h / 2); g.rotate(k === 'vest' ? -.03 : .03); g.fillStyle = 'rgba(60,30,20,.25)'; g.fillRect(-f.w / 2 - 5, -f.h / 2 - 3, f.w + 14, f.h + 14); g.fillStyle = '#e9c15a'; g.fillRect(-f.w / 2 - 8, -f.h / 2 - 8, f.w + 16, f.h + 16); g.fillStyle = '#fbf6ea'; g.fillRect(-f.w / 2 - 4, -f.h / 2 - 4, f.w + 8, f.h + 8);
    g.beginPath(); g.rect(-f.w / 2, -f.h / 2, f.w, f.h); g.clip(); if (im.ok) { const s = Math.max(f.w / im.width, f.h / im.height); g.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s); } else { g.fillStyle = '#b9c86a'; g.fillRect(-f.w / 2, -f.h / 2, f.w, f.h); } g.restore(); }
  /* lights */
  g.globalCompositeOperation = 'lighter'; for (let x = 15, i = 0; x < VW; x += 30, i++) { const u = (x % 150) / 150, y = 30 + Math.sin(u * Math.PI) * 15, tw = G.RM ? .8 : .7 + .3 * Math.sin(t * 2.4 + i * 1.3); glow(g, x, y, 11, '255,206,120', .7 * tw); g.fillStyle = 'rgba(255,244,200,.95)'; g.fillRect(x - 1.2, y - 1.2, 2.4, 2.4); }
  for (const fx of L.wide ? [.14, .86] : [.3, .72]) glow(g, VW * fx, L.wide ? 300 : 340, 90, '255,230,180', .22); g.globalCompositeOperation = 'source-over';
  /* the two of them, behind the table */
  const joy = T.state === 'lift'; person(g, L.jx, 'j', t, joy); person(g, L.fx, 'f', t, joy);
  g.drawImage(SPR.room, 0, (ty - 4) * SPR.room.width / VW, SPR.room.width, (VH - ty + 4) * SPR.room.width / VW, 0, ty - 4, VW, VH - ty + 4);
  /* flowers and a candle */
  { const f = L.fl, r = R(12), sw = Math.sin(t * 1.1) * .02 * (G.RM ? 0 : 1); g.save(); g.translate(f.x, f.y); g.fillStyle = 'rgba(60,40,20,.2)'; ell(g, 2, 2, 24, 6); g.fill(); g.fillStyle = 'rgba(244,170,190,.6)'; g.beginPath(); g.moveTo(-14, -44); g.lineTo(-17, 0); g.lineTo(17, 0); g.lineTo(14, -44); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.2; g.stroke(); g.rotate(sw);
    for (let i = 0; i < 16; i++) { const a = -Math.PI * .5 + (r() - .5) * 2, d = 20 + r() * 34, x = Math.cos(a) * d * .9, y = -44 + Math.sin(a) * d; g.strokeStyle = '#3f8a3c'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -40); g.lineTo(x, y); g.stroke(); const c = ['#c8262c', '#f6b0c4', '#fffdf6', '#8e1a5a', '#f4d0e0'][i % 5]; for (let p = 0; p < 5; p++) dab(g, x + Math.cos(p * 1.26) * 6, y + Math.sin(p * 1.26) * 6, 6, 4.6, p, c, 1); dab(g, x, y, 3, 3, 0, i % 5 === 2 ? '#f2cf62' : c, 1); } g.globalAlpha = 1; g.restore(); }
  { const c = L.cd, fl = G.RM ? 0 : Math.sin(t * 13) * 1.4; g.fillStyle = 'rgba(60,40,20,.2)'; ell(g, c.x + 2, c.y + 2, 16, 5); g.fill(); g.fillStyle = '#f4ecc8'; rr(g, c.x - 11, c.y - 46, 22, 46, 4); g.fill(); g.fillStyle = '#f2b02c'; g.beginPath(); g.moveTo(c.x - 4, c.y - 46); g.quadraticCurveTo(c.x + fl, c.y - 66, c.x + 4, c.y - 46); g.fill(); g.globalCompositeOperation = 'lighter'; glow(g, c.x, c.y - 54, 60, '255,200,120', .4 + .05 * Math.sin(t * 9)); g.globalCompositeOperation = 'source-over'; }
  /* the course */
  const s = T.state, cyy = L.cy; g.save(); g.translate(cxm, cyy); g.scale(1.25, 1.25);
  if (s === 'lift' || s === 'over') { DISH[COURSES[T.i].id](g, t); if (s === 'lift' && !G.RM) for (let i = 0; i < 4; i++) { const k = (t * .5 + i / 4) % 1; g.fillStyle = `rgba(255,255,255,${.25 * (1 - k)})`; g.beginPath(); g.arc(-20 + i * 14 + Math.sin(t + i) * 4, -30 - k * 50, 6 + k * 8, 0, TAU); g.fill(); } }
  if (s === 'arrive') { const k = sm(T.t, .2, 1.3); g.translate(0, -(1 - k) * 60); g.globalAlpha = k; cloche(g, 0); g.globalAlpha = 1; } else if (s === 'wait') cloche(g, 0); else if (s === 'lift') cloche(g, sm(T.t, 0, .8));
  g.restore();
  const pu = .5 + .5 * Math.sin(t * 5); if (s === 'wait') { g.strokeStyle = `rgba(255,236,170,${.55 + .4 * pu})`; g.lineWidth = 3.5; ell(g, cxm, cyy - 34, 92 + pu * 4, 62 + pu * 4); g.stroke(); }
  for (const q of says) { const y = cyy - 150; g.font = `700 15px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(q.text).width + 26; g.globalAlpha = Math.min(1, q.life * 2); g.fillStyle = PAPER; rr(g, cxm - w / 2, y - 15, w, 30, 15); g.fill(); g.fillStyle = INK; g.fillText(q.text, cxm, y + .5); g.globalAlpha = 1; }
  g.globalCompositeOperation = 'lighter'; glow(g, moth.x, moth.y, 46, '255,214,130', .34 + .08 * Math.sin(t * 6)); g.globalCompositeOperation = 'source-over';
  { const f = G.RM ? .6 : Math.abs(Math.sin(t * 17)); g.fillStyle = 'rgba(255,246,214,.94)'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(moth.x + d * (2 + 4.5 * f), moth.y - 2, 1.6 + 5 * f, 5.4, d * .5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(moth.x + d * (1.5 + 3 * f), moth.y + 4, 1.2 + 3 * f, 3.4, d * -.4, 0, TAU); g.fill(); } g.fillStyle = '#ffd874'; ell(g, moth.x, moth.y, 2.2, 4.6); g.fill(); }
  G.paper(g, .36);
}

const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
const busy = () => !active || !$('tbview').hidden || !$('tbend').hidden;
const inR = (x, y, r, p = 10) => x > r.x - p && x < r.x + r.w + p && y > r.y - p && y < r.y + r.h + p;
cv.addEventListener('pointerdown', e => {
  if (busy()) return; const [x, y] = pt(e);
  if (T.state === 'wait' && Math.abs(x - L.cxm) < 96 && y > L.cy - 110 && y < L.cy + 34) { lift(); return; }
  if (T.state === 'lift') return;
  if (inR(x, y, L.win)) open(EXTRA.window); else if (inR(x, y, L.fr.vest)) open(EXTRA.vest); else if (inR(x, y, L.fr.boat)) open(EXTRA.boat); else if (Math.abs(x - L.fl.x) < 50 && y > L.fl.y - 110 && y < L.fl.y + 14) open(EXTRA.flowers);
  if (view) tone(660, .1, 'sine', .05);
});
addEventListener('keydown', e => {
  if (!active || e.metaKey || e.ctrlKey) return;
  if (!$('tbview').hidden) { if (e.key === 'Escape') closeView(); else if (e.key === 'ArrowRight' && view.i < view.src.items.length - 1) { view.i++; show(); } else if (e.key === 'ArrowLeft' && view.i > 0) { view.i--; show(); } return; }
  if (busy() || (e.target && e.target.tagName === 'BUTTON')) return; if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); lift(); } else if ('1234'.includes(e.key) && T.state !== 'lift') open(EXTRA[['window', 'flowers', 'vest', 'boat'][+e.key - 1]]);
});
const soundLabel = () => { $('tbsound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('tbsound').setAttribute('aria-pressed', G.sound); };
$('tbsound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
$('tbleave').addEventListener('click', () => G.go('road', { atDoor: true }));
$('tbp').addEventListener('click', () => { if (view && view.i > 0) { view.i--; show(); } }); $('tbn').addEventListener('click', () => { if (view && view.i < view.src.items.length - 1) { view.i++; show(); } });
$('tbclose').addEventListener('click', closeView); $('tbview').addEventListener('click', e => { if (e.target === $('tbview')) closeView(); });
$('tbstay').addEventListener('click', () => { $('tbend').hidden = true; });
$('tbagain').addEventListener('click', () => { $('tbend').hidden = true; Object.assign(T, { i: 0, state: 'arrive', t: 0, done: 0 }); setStep(); });
$('tbback').addEventListener('click', () => { $('tbend').hidden = true; G.go('road', { atDoor: true }); });

G.scenes.table = {
  frame, resize: layout,
  enter() { active = true; $('tbui').hidden = false; layout(); if (T.state === 'lift') { T.state = 'wait'; } setStep(); soundLabel(); moth.x = L.cxm; moth.y = L.ty - 120; if (document.fonts && document.fonts.load) document.fonts.load('700 15px Nunito'); },
  leave() { active = false; $('tbview').hidden = true; view = null; $('tbend').hidden = true; $('tbui').hidden = true; },
  debug: { T, COURSES, lift, get L() { return L; }, get S() { return S; } }
};
})();
