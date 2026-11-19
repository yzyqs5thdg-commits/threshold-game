/* The Bahamas. An island-hopping boat trip: the two of them sail from the villa in the morning, drop anchor at each
   memory, come home under the pink sky, and finish with dinner at the marina. Each stop holds postcards: the real photos and clips. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, hex, mix, rgb, wrap, TAU, R, dab, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif';
const INK = '#2c2a3d', PAPER = '#fbf3df';
const P4 = a => a.map(hex), KT = [0, .55, .82, 1];
const k4 = (k, t) => { for (let i = 0; i < 3; i++) if (t <= KT[i + 1]) return mix(k[i], k[i + 1], sm((t - KT[i]) / (KT[i + 1] - KT[i]))); return k[3]; };
const SKY = { top: P4(['#2f7fd6', '#3f78c8', '#5d6fc0', '#0e1638']), mid: P4(['#7fc0ee', '#9fc0e4', '#c79ad0', '#1c2a5c']), hor: P4(['#dff3f6', '#fbe2b8', '#ffc2b0', '#38447a']) };
const SEA = { a: P4(['#7fe0d6', '#86d2c6', '#c7a0c4', '#24467a']), b: P4(['#1f9fb8', '#2a8fae', '#3a6f9c', '#0c1c3c']) };
/* what they wore that evening: black top and jeans, red polka-dot halter and jeans */
const EVE = { j: { top: '#2a2226', dark: '#1a1418', leg: '#27375c', shoe: '#3a2c20', trim: '#2a2226' }, f: { top: '#8e1a2a', dark: '#6e1220', leg: '#27375c', shoe: '#3a2c20', trim: '#8e1a2a' } };
const TOTAL = 7300;
let S = 1, VW = 0, VH = 0, HZ = 0, ISL = 0, BY = 0, Z = 1, active = false, camX = 0, camInit = false, target = null, keyDir = 0, down = false, near = null, T = 0, endShown = false, stepKey = '';
const layCv = document.createElement('canvas'), lay = layCv.getContext('2d');
const B = { x: 300, v: 0, dir: 1, max: 300 };
const got = new Set(), says = [], dolphins = [], moth = { x: 300, y: 300 };
let dolT = 3, view = null, justGot = null;
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };
const still = () => (G.RM ? 0 : 1);

/* ------------------------------------------------------------------ pieces of scenery */
function palm(g, x, y, h, lean, t, i) {
  const sw = Math.sin(t * .9 + i) * 3 * still(), tx = x + lean + sw, ty = y - h; g.lineCap = 'round';
  g.strokeStyle = '#8a6a48'; g.lineWidth = 9; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * .15, y - h * .6, tx, ty); g.stroke();
  g.strokeStyle = 'rgba(255,230,190,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 2, y - 6); g.quadraticCurveTo(x + lean * .15 - 2, y - h * .6, tx - 2, ty + 6); g.stroke();
  for (let k = 0; k < 8; k++) { const a = -Math.PI * .98 + k * Math.PI * .137 + Math.sin(t * .8 + k + i) * .04 * still(), L = h * .52; g.strokeStyle = k % 2 ? '#3f8a3c' : '#55a84a'; g.lineWidth = 6; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * L * .6, ty + Math.sin(a) * L * .7 - 10, tx + Math.cos(a) * L, ty + Math.sin(a) * L * .5 + L * .34); g.stroke(); }
  g.fillStyle = '#6a4a2c'; g.beginPath(); g.arc(tx - 4, ty + 5, 4, 0, TAU); g.arc(tx + 4, ty + 6, 4, 0, TAU); g.fill();
}
function sand(g, w) { const gr = g.createLinearGradient(0, -22, 0, 14); gr.addColorStop(0, '#f8eed2'); gr.addColorStop(1, '#dcc89a'); g.fillStyle = gr; g.beginPath(); g.moveTo(-w / 2, 12); g.bezierCurveTo(-w * .42, -24, w * .42, -24, w / 2, 12); g.closePath(); g.fill(); }
function pier(g, len) {
  g.fillStyle = '#6e5034'; for (let y = 16; y < len; y += 30) { g.fillRect(-18, y, 5, 18); g.fillRect(13, y, 5, 18); }
  g.fillStyle = '#b08a5c'; g.fillRect(-15, 0, 30, len); g.strokeStyle = 'rgba(70,45,20,.35)'; g.lineWidth = 1; for (let y = 6; y < len; y += 7) { g.beginPath(); g.moveTo(-15, y); g.lineTo(15, y); g.stroke(); }
  g.fillStyle = 'rgba(255,235,200,.3)'; g.fillRect(-15, 0, 3, len);
}
function signpost(g, x, name) {
  g.font = `800 10.5px ${UI}`; const w = g.measureText(name).width + 16;
  g.fillStyle = '#6e5034'; g.fillRect(x - 2.5, -40, 5, 46); g.fillStyle = '#fbf3df'; rr(g, x - w / 2, -58, w, 20, 3); g.fill(); g.strokeStyle = '#6e5034'; g.lineWidth = 1.5; g.stroke();
  g.fillStyle = '#3a2a1a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, x, -47.5);
}
function lounger(g, x) { g.fillStyle = '#fbfaf4'; rr(g, x, -12, 30, 6, 2); g.fill(); g.fillStyle = '#f2c21c'; for (let i = 0; i < 4; i++) g.fillRect(x + 2 + i * 7.5, -12, 3.5, 6); g.fillStyle = '#d8d4c8'; g.fillRect(x + 3, -6, 2, 6); g.fillRect(x + 25, -6, 2, 6); }
function villa(g, t, eve) {
  g.save(); g.translate(-60, 0);
  g.fillStyle = '#fbfaf4'; g.fillRect(-170, -150, 150, 150); g.fillStyle = 'rgba(120,140,170,.16)'; g.fillRect(-170, -150, 14, 150); g.fillStyle = '#e6e2d6'; g.fillRect(-178, -158, 226, 9);
  for (const [x, y, w, h] of [[-150, -136, 36, 46], [-100, -136, 62, 46], [-150, -62, 36, 62], [-100, -62, 62, 62]]) { g.fillStyle = '#9fc4cc'; g.fillRect(x, y, w, h); g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(x, y, w, h); g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.stroke(); }
  g.fillStyle = '#efece2'; g.fillRect(-178, -80, 226, 8); g.fillRect(40, -150, 6, 150);
  if (eve) { G.figure(g, -2, -80, 'j', { sc: .5, dir: 1, outfit: 'run', bib: false, colors: EVE.j, expr: 'joy', t }); G.figure(g, 22, -80, 'f', { sc: .5, dir: -1, outfit: 'run', bib: false, colors: EVE.f, t }); }
  g.strokeStyle = '#fff'; g.lineWidth = 2.4; for (const y of [-88, -97, -106]) { g.beginPath(); g.moveTo(-20, y); g.lineTo(46, y); g.stroke(); } g.lineWidth = 3.4; g.beginPath(); g.moveTo(-20, -110); g.lineTo(46, -110); g.stroke();
  g.fillStyle = '#fff'; rr(g, 62, -10, 112, 13, 6); g.fill(); g.fillStyle = '#4fd0d8'; rr(g, 66, -8, 104, 8, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(76 + Math.sin(t) * 6 * still(), -6, 22, 1.4);
  lounger(g, 186); lounger(g, 226);
  palm(g, 318, 0, 126, 24, t, 1); palm(g, 290, 0, 100, -30, t, 2);
  /* the hammock, between a white post and the palm */
  const sw = Math.sin(t * (eve ? 3 : 1.2)) * (eve ? 3 : 1.5) * still(); g.fillStyle = '#fbfaf4'; g.fillRect(262, -50, 5, 50);
  g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.moveTo(266, -46); g.quadraticCurveTo(292 + sw, -8, 320, -50); g.quadraticCurveTo(292 + sw, -30, 266, -46); g.fill();
  g.strokeStyle = 'rgba(200,196,180,.9)'; g.lineWidth = 1; for (let i = 1; i < 6; i++) { const u = i / 6, x = lerp(266, 320, u) + sw * Math.sin(u * Math.PI); g.beginPath(); g.moveTo(x, -46 + Math.sin(u * Math.PI) * 8); g.lineTo(x, -46 + Math.sin(u * Math.PI) * 30); g.stroke(); }
  if (eve) { const k = Math.sin(t * 7) * 4 * still(); g.lineCap = 'round'; for (const [x0, x1, kk] of [[284, 276, k], [292, 290, -k], [298, 304, k], [304, 314, -k]]) { g.strokeStyle = '#27375c'; g.lineWidth = 5; g.beginPath(); g.moveTo(x0 + sw, -30); g.lineTo(x1 + sw, -56 + kk); g.stroke(); g.fillStyle = '#f0c7a6'; g.beginPath(); g.arc(x1 + sw, -59 + kk, 3, 0, TAU); g.fill(); } }
  g.restore();
}
function villaL(g, t, n) {
  g.save(); g.translate(-60, 0);
  for (const [x, y, w, h] of [[-150, -136, 36, 46], [-100, -136, 62, 46], [-150, -62, 36, 62], [-100, -62, 62, 62]]) { g.fillStyle = `rgba(255,214,140,${.5 * n})`; g.fillRect(x, y, w, h); glow(g, x + w / 2, y + h / 2, 60, '255,196,120', .22 * n); }
  glow(g, 118, -4, 70, '120,230,240', .25 * n); g.restore();
}
function cafe(g, t) {
  g.fillStyle = '#f2c21c'; g.fillRect(-90, -100, 180, 100); g.fillStyle = 'rgba(160,110,0,.14)'; g.fillRect(-90, -100, 180, 12);
  g.fillStyle = '#6a5446'; g.beginPath(); g.moveTo(-106, -100); g.lineTo(-54, -158); g.lineTo(54, -158); g.lineTo(106, -100); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; for (let y = -150; y < -100; y += 9) { const k = (y + 158) / 58; g.beginPath(); g.moveTo(-54 - 52 * k, y); g.lineTo(54 + 52 * k, y); g.stroke(); }
  g.fillStyle = '#fbfaf4'; g.fillRect(-108, -104, 216, 7);
  const panes = (x, y, w, h, nx, ny) => { g.fillStyle = '#fbfaf4'; g.fillRect(x - 4, y - 4, w + 8, h + 8); g.fillStyle = '#4a6474'; g.fillRect(x, y, w, h); g.strokeStyle = '#fbfaf4'; g.lineWidth = 2; g.beginPath(); for (let i = 1; i < nx; i++) { g.moveTo(x + w * i / nx, y); g.lineTo(x + w * i / nx, y + h); } for (let i = 1; i < ny; i++) { g.moveTo(x, y + h * i / ny); g.lineTo(x + w, y + h * i / ny); } g.stroke(); };
  panes(-74, -76, 52, 46, 3, 3); panes(40, -80, 34, 78, 2, 4);
  g.fillStyle = '#5a3a2c'; rr(g, -8, -80, 13, 24, 2); g.fill(); g.fillStyle = 'rgba(255,240,200,.6)'; g.fillRect(-5, -76, 7, 16);
  g.fillStyle = '#fbfaf4'; g.beginPath(); g.moveTo(84, -22); g.lineTo(108, -22); g.lineTo(104, 0); g.lineTo(88, 0); g.fill(); g.lineCap = 'round'; g.strokeStyle = '#8e2a3a'; g.lineWidth = 6; for (const a of [-.7, -.2, .3, .8]) { g.beginPath(); g.moveTo(96, -22); g.quadraticCurveTo(96 + a * 14, -46, 96 + a * 30, -62); g.stroke(); }
  G.figure(g, 6, 2, 'j', { sc: .5, dir: -1, outfit: 'skirt', t });
  g.fillStyle = '#c9a67a'; rr(g, -8, -43, 7, 10, 2); g.fill(); g.fillStyle = '#fbfaf4'; g.fillRect(-9, -44, 9, 2.4);
}
function cafeL(g, t, n) { glow(g, -1, -68, 46, '255,214,140', .6 * n); }
function sandbar(g, t) {
  g.fillStyle = '#f3e8c8'; ell(g, -30, 6, 160, 8); g.fill();
  g.save(); g.translate(160, 18 + Math.sin(t * 1.6) * 2 * still()); g.rotate(Math.sin(t * 1.2) * .08 * still()); g.fillStyle = '#e23b2e'; rr(g, -9, -32, 18, 32, 5); g.fill(); g.fillStyle = '#fbfaf4'; g.fillRect(-9, -20, 18, 7); g.fillStyle = '#f2cf62'; g.beginPath(); g.arc(0, -35, 3.4, 0, TAU); g.fill(); g.restore();
  const y = 46 + Math.sin(t * 1.5) * 1.5 * still();
  G.headFront(g, 'f', { x: -36, y, r: 12, len: 15, expr: 'joy' }); G.headFront(g, 'j', { x: -8, y: y + 1, r: 12, len: 15, expr: 'joy' });
  g.fillStyle = 'rgba(126,224,214,.95)'; ell(g, -22, y + 17, 46, 9); g.fill();
  for (let i = 0; i < 3; i++) { const k = wrap(t * .4 + i / 3, 1); g.strokeStyle = `rgba(255,255,255,${.7 * (1 - k)})`; g.lineWidth = 1.5; ell(g, -22, y + 14, 34 + k * 34, 6 + k * 6); g.stroke(); }
}
function nap(g, t) {
  palm(g, 130, 0, 122, -26, t, 3);
  g.strokeStyle = '#d9dce2'; g.lineWidth = 3; g.beginPath(); g.moveTo(-78, 0); g.lineTo(-78, -116); g.stroke();
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#fbfaf4' : '#2fa8a0'; g.beginPath(); g.moveTo(-78, -116); g.ellipse(-78, -116, 74, 36, 0, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); g.closePath(); g.fill(); }
  g.strokeStyle = '#8f949c'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-56, -36); g.lineTo(-28, -16); g.lineTo(64, -16); g.moveTo(-20, -16); g.lineTo(-20, 0); g.moveTo(54, -16); g.lineTo(54, 0); g.stroke();
  g.fillStyle = '#fbfaf4'; rr(g, 14, -30, 52, 14, 7); g.fill(); g.fillStyle = 'rgba(160,170,180,.5)'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(22 + i * 6.4, -23 + (i % 2) * 3, 1.3, 0, TAU); g.fill(); }
  g.save(); g.translate(-46, -40); g.rotate(-1.05); G.head(g, 'j', { r: 12, len: 22, blink: true, ear: false, t: 0 });
  g.fillStyle = '#17161a'; rr(g, 0, -1, 5.4, 4.6, 1.4); g.fill(); rr(g, 6.2, -1.2, 4.6, 4.4, 1.4); g.fill(); g.restore();
  g.fillStyle = '#2f6a54'; g.beginPath(); g.moveTo(-38, -24); g.quadraticCurveTo(-8, -52, 26, -30); g.lineTo(26, -16); g.lineTo(-30, -16); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(-30, -26); g.quadraticCurveTo(-8, -46, 16, -32); g.quadraticCurveTo(-8, -40, -30, -26); g.fill();
  g.fillStyle = '#c9a67a'; rr(g, 72, -18, 22, 18, 5); g.fill(); g.strokeStyle = '#a8845a'; g.lineWidth = 1.4; g.beginPath(); g.arc(83, -18, 8, Math.PI, 0); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { const k = wrap(t * .3 + i / 3, 1); g.globalAlpha = Math.sin(k * Math.PI); g.font = `800 ${10 + k * 9}px ${UI}`; g.fillText('z', -40 + k * 26 + Math.sin(k * 6) * 4, -64 - k * 44); } g.globalAlpha = 1;
}
function frog(g, t) {
  g.fillStyle = '#d8262c'; g.fillRect(-120, -136, 240, 136); g.strokeStyle = 'rgba(120,10,14,.45)'; g.lineWidth = 1; for (let y = -124; y < 0; y += 12) { g.beginPath(); g.moveTo(-120, y); g.lineTo(120, y); g.stroke(); }
  g.fillStyle = '#fbfaf4'; g.fillRect(-128, -144, 256, 10);
  g.fillStyle = '#17161a'; g.fillRect(34, -130, 30, 124); g.fillStyle = '#3f9a4a'; g.fillRect(64, -130, 10, 62); g.fillStyle = '#e2a02c'; g.fillRect(64, -68, 10, 62);
  g.strokeStyle = '#fbfaf4'; g.lineWidth = 1.2; for (let i = 0; i < 20; i++) { g.beginPath(); g.moveTo(36, -126 + i * 6); g.lineTo(i % 4 ? 44 : 54, -126 + i * 6); g.stroke(); }
  g.fillStyle = '#8e1a20'; rr(g, -112, -120, 132, 40, 3); g.fill(); g.fillStyle = '#fbfaf4'; g.font = `800 10px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('YOU MUST BE THIS', -46, -107); g.fillText('TALL TO DRINK!', -46, -93);
  g.fillStyle = '#f2cf62'; g.beginPath(); g.moveTo(22, -108); g.lineTo(34, -100); g.lineTo(22, -92); g.fill();
  /* the frog on the wall */
  g.lineCap = 'round'; g.strokeStyle = '#3f8f4a'; g.lineWidth = 7; g.beginPath(); g.moveTo(-44, -40); g.lineTo(30, -72); g.stroke();
  g.fillStyle = '#fbfaf4'; rr(g, -78, -46, 36, 34, 8); g.fill(); g.fillStyle = '#3f8f4a'; ell(g, -62, -60, 20, 17); g.fill(); g.fillStyle = '#9fd08a'; ell(g, -56, -54, 12, 9); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(-68, -70, 8, 0, TAU); g.fill(); g.fillStyle = '#17161a'; g.beginPath(); g.arc(-66, -69, 3.4, 0, TAU); g.fill(); g.fillStyle = '#d9b46a'; ell(g, -70, -80, 22, 6); g.fill(); ell(g, -72, -84, 12, 8); g.fill();
  G.figure(g, 100, 2, 'j', { sc: .5, dir: -1, outfit: 'skirt', expr: 'joy', t });
  g.fillStyle = '#f2cf2c'; g.fillRect(-166, -46, 8, 48); g.fillStyle = '#f6b27a'; g.beginPath(); g.moveTo(-196, -80); g.lineTo(-180, -100); g.lineTo(-144, -100); g.lineTo(-128, -80); g.lineTo(-162, -44); g.closePath(); g.fill();
  g.fillStyle = '#fbf3df'; g.fillRect(-200, -86, 76, 14); g.fillStyle = '#2c2a3d'; g.font = `800 8.5px ${UI}`; g.fillText('TROPHY WIFE', -162, -78.5);
}
function frogL(g, t, n) { const a = .25 + .35 * n; for (const [x, c, ph] of [[-80, '255,60,200', 0], [0, '80,255,140', 2], [80, '90,120,255', 4]]) glow(g, x, -70, 110, c, a * (.5 + .5 * Math.sin(t * 2.2 + ph))); }
function marina(g, t) {
  g.fillStyle = '#f4f6fa'; g.beginPath(); g.moveTo(-40, -58); g.lineTo(262, -58); g.lineTo(240, -98); g.lineTo(-12, -98); g.closePath(); g.fill(); rr(g, 20, -126, 176, 30, 6); g.fill(); rr(g, 60, -148, 104, 24, 6); g.fill();
  g.fillRect(102, -196, 5, 50); g.fillRect(84, -166, 44, 4); g.beginPath(); g.arc(90, -178, 10, 0, TAU); g.arc(120, -174, 8, 0, TAU); g.fill();
  g.fillStyle = '#27375c'; rr(g, 34, -118, 146, 10, 4); g.fill(); rr(g, 72, -142, 80, 8, 3); g.fill(); for (let x = 0; x < 230; x += 22) { g.beginPath(); g.arc(x, -78, 3, 0, TAU); g.fill(); }
  g.fillStyle = '#b89878'; g.fillRect(-196, 0, 392, 18); g.fillStyle = '#c9a98a'; g.fillRect(-196, -12, 392, 14); g.fillStyle = 'rgba(255,240,220,.4)'; g.fillRect(-196, -12, 392, 2);
  g.fillStyle = '#c9a98a'; g.fillRect(-196, -66, 392, 8); g.fillRect(-196, -20, 392, 8); for (let x = -186; x <= 186; x += 18.6) { g.fillRect(x - 2, -58, 4, 38); ell(g, x, -38, 5.5, 11); g.fill(); }
  /* her friend holds out the fork; Jana closes her eyes */
  g.fillStyle = '#8e1a2a'; rr(g, -92, -54, 34, 42, 12); g.fill(); g.fillStyle = '#fbe6e6'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(-86 + (i % 3) * 11 + ((i / 3 | 0) % 2) * 5, -46 + (i / 3 | 0) * 11, 1.6, 0, TAU); g.fill(); }
  G.head(g, 'f', { x: -74, y: -79, r: 17, len: 44, t });
  g.save(); g.translate(76, 0); g.scale(-1, 1); g.fillStyle = '#4a342c'; rr(g, -16, -52, 34, 40, 12); g.fill(); G.head(g, 'j', { x: 2, y: -77, r: 17, len: 44, expr: 'yum', t }); g.restore();
  g.fillStyle = '#8f8676'; g.fillRect(-4, -26, 8, 14); g.fillStyle = '#b9b2a4'; rr(g, -56, -36, 112, 10, 4); g.fill();
  g.fillStyle = '#fbfaf4'; ell(g, 2, -40, 24, 8); g.fill(); const r = R(8); g.lineCap = 'round'; for (let i = 0; i < 14; i++) { g.strokeStyle = i % 3 ? '#f0a03c' : '#e2742c'; g.lineWidth = 2; const x = -14 + r() * 32, y = -43 + r() * 5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 5, y - 5, x + 10, y + 1); g.stroke(); }
  g.strokeStyle = '#dcab82'; g.lineWidth = 6; g.beginPath(); g.moveTo(-62, -48); g.quadraticCurveTo(-30, -38, 14, -58); g.stroke(); g.strokeStyle = '#d9dce2'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, -58); g.lineTo(40, -64); g.stroke();
  for (let i = 0; i < 4; i++) { g.strokeStyle = '#f0a03c'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(38 + i, -62); g.quadraticCurveTo(30 + Math.sin(t * 2 + i) * 3 * still(), -52, 14 + i * 3, -42); g.stroke(); } g.fillStyle = '#f0a03c'; ell(g, 41, -65, 6, 5); g.fill();
  g.fillStyle = 'rgba(244,236,170,.9)'; rr(g, -42, -54, 9, 18, 2); g.fill(); g.fillStyle = '#fbfaf4'; rr(g, 34, -46, 8, 10, 2); g.fill();
}
function marinaL(g, t, n) {
  g.fillStyle = `rgba(255,220,150,${.85 * n})`; rr(g, 34, -118, 146, 10, 4); g.fill(); rr(g, 72, -142, 80, 8, 3); g.fill(); for (let x = 0; x < 230; x += 22) { g.beginPath(); g.arc(x, -78, 3, 0, TAU); g.fill(); }
  glow(g, 107, -130, 150, '255,220,160', .3 * n); glow(g, 38, -44, 90, '255,200,120', (.45 + .08 * Math.sin(t * 9)) * n); glow(g, 104, -198, 14, '255,90,80', (.5 + .5 * Math.sin(t * 3)) * n);
  for (let i = 0; i < 12; i++) { const x = -190 + i * 34, y = -150 + Math.sin(i * 1.1) * 8; glow(g, x, y, 12, '255,214,140', .7 * n * (.7 + .3 * Math.sin(t * 2.4 + i))); g.fillStyle = `rgba(255,244,200,${n})`; g.fillRect(x - 1.2, y - 1.2, 2.4, 2.4); }
}

/* ------------------------------------------------------------------ the stops and their postcards */
const STOPS = [
  { id: 'home', x: 420, name: 'The villa', w: 600, sign: -276, draw: (g, t) => villa(g, t, false), items: [
    { id: 'selfie', media: 'photo', title: 'Morning at the villa', text: 'Three of us, one palm tree, and the wind doing whatever it wanted with our hair.' }] },
  { id: 'cafe', x: 1450, name: 'The yellow café', w: 340, sign: -136, draw: cafe, lights: cafeL, items: [
    { id: 'coffee', media: 'photo', title: 'The yellow café', text: 'Iced coffee against the yellowest wall on the island.' }] },
  { id: 'water', x: 2500, name: 'The clearest water', sign: -160, pier: false, draw: sandbar, items: [
    { id: 'helm', media: 'clip', title: 'At the helm', text: 'Under the blue canopy, heading out.' },
    { id: 'feet', media: 'photo', title: 'Feet up', text: 'Wet hair, red cup, nowhere to be.' },
    { id: 'swim', media: 'clip', title: 'The clearest water', text: 'Water this clear, and the two of us in the middle of it.' }] },
  { id: 'nap', x: 3520, name: 'Nap Cay', w: 400, sign: -170, draw: nap, items: [
    { id: 'nap', media: 'photo', title: 'Nap Cay', text: 'Sunglasses on, towel up to the chin, fully asleep.' }] },
  { id: 'frog', x: 4560, name: "Frog's Landing", w: 520, sign: 176, draw: frog, lights: frogL, items: [
    { id: 'tall', media: 'photo', title: 'The height check', text: 'You must be this tall to drink. You checked.' },
    { id: 'trophy', media: 'photo', title: 'Trophy wife', text: 'You found your sign.' },
    { id: 'dance', media: 'clip', title: 'The dance floor', text: 'Three of us, and every colour of light they had.' }] },
  { id: 'sunset', x: 5700, name: 'The villa at sunset', w: 600, sign: -276, draw: (g, t) => villa(g, t, true), lights: villaL, items: [
    { id: 'bag', media: 'photo', title: 'Golden hour on the deck', text: 'You, me, and the bag getting its own photo.' },
    { id: 'hamclip', media: 'clip', title: 'The hammock', text: 'Two people, one hammock, no chance.' },
    { id: 'hammock', media: 'photo', title: 'Still laughing', text: 'We could not stop.' },
    { id: 'sunset', media: 'photo', title: 'The pink sky', text: 'The sky did this, and we stood under it.' }] },
  { id: 'marina', x: 6850, name: 'The marina', sign: -222, draw: marina, lights: marinaL, items: [
    { id: 'pasta', media: 'photo', title: 'Dinner at the marina', text: 'One fork, held by me. Eyes closed, by you.' },
    { id: 'pastaclip', media: 'clip', title: 'Spaghetti, continued', text: 'A yacht behind us and the pasta in front.' }] }
];

function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S; Z = VW >= 760 ? 1.4 : 1.12; HZ = VH - 350; ISL = VH - 240; BY = VH - 118; camInit = false;
  layCv.width = cv.width; layCv.height = cv.height; $('bui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function seat(g, x, who, mv, t) {
  g.fillStyle = who === 'j' ? '#6b4a3a' : '#8e1a2a'; rr(g, x - 10, -54, 22, 40, 9); g.fill(); g.strokeStyle = G.people[who].skin; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 8, -46); g.lineTo(x + 20, -36); g.stroke();
  G.head(g, who, { x: x + 2, y: -72, r: 13, len: 32, flow: .04 + .3 * mv, blink: !G.RM && ((t + (who === 'f' ? 1.7 : 0)) % 3.6) < .12, expr: mv > .5 ? 'joy' : 'smile', t });
}
function boat(g, x, y, t) {
  const mv = Math.min(1, Math.abs(B.v) / 120);
  g.save(); g.translate(x, y + Math.sin(t * 2) * 3 * still()); g.rotate((Math.sin(t * 1.3) * .025 - mv * .03) * B.dir * still()); g.scale(B.dir * (Z > 1 ? 1.25 : 1), Z > 1 ? 1.25 : 1);
  if (mv > .05) for (let i = 0; i < 7; i++) { g.fillStyle = `rgba(255,255,255,${.6 * mv * (1 - i / 7)})`; ell(g, -92 - i * 17, 12 + Math.sin(t * 6 + i) * 2, 13 - i, 3.4); g.fill(); }
  g.strokeStyle = '#d9dce2'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-60, -18); g.lineTo(-54, -92); g.moveTo(44, -18); g.lineTo(38, -92); g.stroke();
  seat(g, -30, 'j', mv, t); seat(g, 16, 'f', mv, t);
  g.fillStyle = '#e6eaf0'; rr(g, 40, -42, 18, 26, 4); g.fill(); g.strokeStyle = 'rgba(160,200,230,.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(56, -40); g.lineTo(66, -58); g.stroke();
  const gr = g.createLinearGradient(0, -22, 0, 14); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#d6dde8'); g.fillStyle = gr; g.beginPath(); g.moveTo(-88, -22); g.lineTo(96, -22); g.quadraticCurveTo(88, 6, 62, 13); g.lineTo(-78, 13); g.quadraticCurveTo(-90, 0, -88, -22); g.closePath(); g.fill();
  g.strokeStyle = '#2f62c0'; g.lineWidth = 4; g.beginPath(); g.moveTo(-86, -10); g.lineTo(88, -10); g.stroke();
  g.fillStyle = '#2f62c0'; g.beginPath(); g.moveTo(-72, -92); g.quadraticCurveTo(-10, -108, 54, -92); g.lineTo(54, -86); g.quadraticCurveTo(-10, -99, -72, -86); g.closePath(); g.fill();
  g.strokeStyle = '#8f949c'; g.lineWidth = 2; g.beginPath(); g.moveTo(-84, -22); g.lineTo(-88, -52); g.stroke(); g.fillStyle = '#39c5d6'; g.beginPath(); g.moveTo(-88, -52); g.lineTo(-108 - Math.sin(t * 6) * 2, -47); g.lineTo(-88, -41); g.fill(); g.fillStyle = '#f2cf2c'; g.beginPath(); g.moveTo(-88, -49.5); g.lineTo(-100, -47); g.lineTo(-88, -44.5); g.fill();
  g.fillStyle = '#f2b45c'; g.beginPath(); g.arc(78, -28, 4, 0, TAU); g.fill();
  g.restore();
}
function dolphin(g, x, y, a) {
  g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#6f8fb0'; g.beginPath(); g.moveTo(-22, 0); g.quadraticCurveTo(-4, -13, 20, -3); g.lineTo(27, -1); g.quadraticCurveTo(8, 9, -22, 0); g.fill();
  g.beginPath(); g.moveTo(-2, -8); g.lineTo(-8, -18); g.lineTo(6, -8); g.fill(); g.beginPath(); g.moveTo(-20, 0); g.lineTo(-31, -8); g.lineTo(-27, 1); g.lineTo(-32, 7); g.fill();
  g.fillStyle = '#dbe6f0'; g.beginPath(); g.moveTo(-10, 3); g.quadraticCurveTo(8, 7, 22, 0); g.quadraticCurveTo(6, 2, -10, 3); g.fill(); g.fillStyle = '#1c2434'; g.beginPath(); g.arc(15, -3, 1.2, 0, TAU); g.fill(); g.restore();
}

/* ------------------------------------------------------------------ play */
function say(text, x, y) { says.push({ text, x: clamp(x, 110, VW - 110), y, life: 2.6 }); }
function setStep() {
  const ahead = STOPS.find(s => !got.has(s.id));
  $('bstep').textContent = near ? `${near.name}. Drop anchor to see the postcards.` : got.size === 0 && B.max < 600 ? 'Tap or hold ahead of the boat to sail. Drop anchor at each stop.' : ahead ? `Next stop: ${ahead.name}.` : 'Every shell found. Sail wherever you like.';
  $('bshells').textContent = `Shells ${got.size} of ${STOPS.length}`;
}
const vid = $('bvid'), pic = $('bimg');
function show() {
  const st = view.st, it = st.items[view.i], photo = it.media === 'photo';
  $('bno').textContent = `Postcard from ${st.name}` + (st.items.length > 1 ? `  ·  ${view.i + 1} of ${st.items.length}` : ''); $('btitle').textContent = it.title; $('btext').textContent = it.text;
  vid.pause(); vid.hidden = photo; pic.hidden = !photo; $('bnav').hidden = st.items.length < 2; $('bprev').disabled = view.i === 0; $('bnext').disabled = view.i === st.items.length - 1;
  if (photo) { vid.removeAttribute('src'); vid.load(); pic.alt = it.title; pic.src = `media/bh_${it.id}.jpg`; }
  else { pic.removeAttribute('src'); vid.muted = !G.sound; vid.loop = true; vid.poster = `media/bh_${it.id}.jpg`; vid.src = `media/bh_${it.id}.mp4`; const p = vid.play(); if (p && p.catch) p.catch(() => { /* she can press play herself */ }); }
}
function anchor() {
  if (!near) return; target = null; keyDir = 0; B.v = 0; view = { st: near, i: 0 }; if (!got.has(near.id)) { got.add(near.id); justGot = near; }
  $('bview').hidden = false; show(); $('bclose').focus(); tone(392, .12, 'sine', .06, 0, .7); tone(660, .12, 'sine', .05, .1); setStep();
}
function closeView() {
  const st = view && view.st; vid.pause(); vid.removeAttribute('src'); vid.load(); pic.removeAttribute('src'); $('bview').hidden = true; view = null;
  if (justGot) { say(`Shell found: ${justGot.name}`, B.x - camX, BY - 150); tone(988, .14, 'sine', .07); tone(1319, .3, 'sine', .06, .09); justGot = null; }
  if (st && st.id === 'marina' && !endShown) { endShown = true; setTimeout(() => { if (active) { $('bend').hidden = false; $('bstay').focus(); [523, 659, 784, 1047].forEach((f, i) => tone(f, .9, 'sine', .05, i * .22)); } }, 1400); }
}
function update(dt) {
  const t = G.time, free = $('bview').hidden && $('bend').hidden; let want = 0;
  if (free) { if (keyDir) { want = keyDir; target = null; } else if (target != null) { const dx = target - B.x; if (Math.abs(dx) < 8) target = null; else want = Math.sign(dx); } }
  B.v = lerp(B.v, want * 190, 1 - Math.exp(-dt * 2.6)); if (Math.abs(B.v) < 2 && !want) B.v = 0; if (want) B.dir = want;
  B.x = clamp(B.x + B.v * dt, 190, TOTAL - 190); B.max = Math.max(B.max, B.x); T = clamp((B.max - 420) / 6430, 0, 1);
  const camT = clamp(B.x - VW * (VW < 700 ? .5 : .42 - .08 * B.dir), 0, TOTAL - VW); camX = camInit ? lerp(camX, camT, 1 - Math.exp(-dt * 2.4)) : camT; camInit = true;
  near = STOPS.find(s => Math.abs(s.x - B.x) < 150) || null; $('banchor').hidden = !near || !free; if (near) $('banchor').textContent = `Drop anchor: ${near.name}`;
  const key = (near ? near.id : '') + got.size + (B.max < 600); if (key !== stepKey) { stepKey = key; setStep(); }
  /* dolphins keep the boat company by day */
  dolT -= dt; if (dolT < 0 && Math.abs(B.v) > 90 && T < .8 && !G.RM) { dolT = 5 + Math.random() * 5; for (let i = 0; i < 2; i++) dolphins.push({ x: B.x + B.dir * (150 + i * 46), t: -i * .22, d: B.dir }); }
  for (let i = dolphins.length - 1; i >= 0; i--) { const d = dolphins[i]; d.t += dt / 1.3; d.x += d.d * 120 * dt; if (d.t > 1) dolphins.splice(i, 1); }
  for (let i = says.length - 1; i >= 0; i--) { const q = says[i]; q.life -= dt; q.y -= 12 * dt; if (q.life <= 0) says.splice(i, 1); }
  moth.x = lerp(moth.x, B.x + B.dir * 96 + Math.sin(t * 1.1) * 12, 1 - Math.exp(-dt * 2.2)); moth.y = lerp(moth.y, BY - 150 + Math.sin(t * 2.3) * 10, 1 - Math.exp(-dt * 3));
}
function waveBand(g, y0, par, amp, col, t, foam) {
  g.fillStyle = col; g.beginPath(); g.moveTo(0, VH); for (let x = 0; x <= VW + 12; x += 12) g.lineTo(x, y0 + Math.sin((x + camX * par) * .028 + t * 1.3 * still()) * amp + Math.sin((x + camX * par) * .011 + t * .7 * still()) * amp); g.lineTo(VW, VH); g.closePath(); g.fill();
  g.strokeStyle = `rgba(255,255,255,${foam})`; g.lineWidth = 1.6; g.beginPath(); for (let x = 0; x <= VW + 12; x += 12) g.lineTo(x, y0 + Math.sin((x + camX * par) * .028 + t * 1.3 * still()) * amp + Math.sin((x + camX * par) * .011 + t * .7 * still()) * amp); g.stroke();
}
function frame(dt) {
  if (!ISL) return; update(dt);
  const t = G.time, g = cx, k = S * G.DPR, night = sm(T, .84, 1), gold = sm(T, .3, .55) * (1 - sm(T, .6, .8)), pink = sm(T, .62, .82) * (1 - sm(T, .86, .98));
  g.setTransform(k, 0, 0, k, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  /* sky, stars, sun and moon */
  const top = k4(SKY.top, T), mid = k4(SKY.mid, T), hor = k4(SKY.hor, T), sg = g.createLinearGradient(0, Math.min(0, HZ - 620), 0, HZ); sg.addColorStop(0, rgb(top)); sg.addColorStop(.6, rgb(mid)); sg.addColorStop(1, rgb(hor)); g.fillStyle = sg; g.fillRect(0, 0, VW, HZ + 1);
  if (night > 0) { const st = R(41); for (let i = 0; i < 110; i++) { g.fillStyle = `rgba(255,250,235,${night * (.3 + .6 * st()) * (.6 + .4 * Math.sin(t * (1 + st() * 2) + i))})`; const s2 = .8 + st(); g.fillRect(st() * VW, st() * (HZ - 20), s2, s2); } }
  const sunX = VW * (.74 - .12 * T), sunY = HZ - lerp(380, -40, sm(T / .9)), sunA = sm(HZ - sunY, -40, 50);
  g.globalCompositeOperation = 'lighter'; glow(g, sunX, sunY, 420, pink > .2 ? '255,150,150' : '255,214,150', (.2 + .3 * Math.max(gold, pink)) * sunA); g.globalCompositeOperation = 'source-over';
  if (sunA > 0) { const sd = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, 56); sd.addColorStop(0, `rgba(255,252,236,${sunA})`); sd.addColorStop(.36, `rgba(255,244,214,${sunA * .95})`); sd.addColorStop(.5, `rgba(255,224,180,${sunA * .35})`); sd.addColorStop(1, 'rgba(255,224,180,0)'); g.fillStyle = sd; g.fillRect(sunX - 56, sunY - 56, 112, 112); }
  const mx = VW * .26, my = Math.max(90, HZ - 300); if (night > 0) { g.globalCompositeOperation = 'lighter'; glow(g, mx, my, 100, '220,226,255', .25 * night); g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(255,250,230,${night})`; g.beginPath(); g.arc(mx, my, 17, 0, TAU); g.fill(); }
  const cl = G.SP && G.SP.clouds, dusk = sm(T, .45, .8);
  if (cl) for (const [i, fx, cy, sc, sp] of [[0, .06, 250, 1, 4], [2, .44, 330, 1.2, 3], [4, .8, 200, .7, 5], [1, .26, 120, .45, 2], [3, .64, 420, 1.1, 3.4], [5, .92, 90, .4, 2]]) {
    const s = cl[i], w = s[0].uw * sc, h = s[0].uh * sc, span = VW + 800, x = wrap(fx * span + t * sp * still() - camX * .04 * sc, span) - 400, y = HZ - cy - h; if (y + h < 0) continue;
    g.globalAlpha = 1 - dusk; if (dusk < 1) g.drawImage(s[0], x, y, w, h); g.globalAlpha = dusk * (1 - .72 * night); g.drawImage(s[1], x, y, w, h);
  }
  g.globalAlpha = 1;
  if (pink > 0) { const pg = g.createLinearGradient(0, HZ - 300, 0, HZ); pg.addColorStop(0, 'rgba(255,130,170,0)'); pg.addColorStop(1, `rgba(255,150,160,${.3 * pink})`); g.fillStyle = pg; g.fillRect(0, HZ - 300, VW, 300); }
  /* gulls, far islets, the sea */
  if (night < .6 && !G.RM) { g.strokeStyle = `rgba(60,70,100,${.7 * (1 - night)})`; g.lineWidth = 1.4; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { const bx = wrap(i * 420 + t * 26 - camX * .06, VW + 200) - 100, by = HZ - 150 - i * 44 + Math.sin(t + i) * 6, f = Math.sin(t * 8 + i * 1.3) * 3.4; g.beginPath(); g.moveTo(bx - 6, by - f); g.quadraticCurveTo(bx - 2, by - 1, bx, by + 1); g.quadraticCurveTo(bx + 2, by - 1, bx + 6, by - f); g.stroke(); } }
  const isc = mix(mix([60, 130, 100], hor, .45), [20, 28, 60], night * .8); g.fillStyle = rgb(isc); for (let i = 0; i < 16; i++) { const sx = i * 540 + 160 - camX * .16; if (sx < -200 || sx > VW + 200) continue; g.beginPath(); g.ellipse(sx, HZ + 1, 90 + (i * 53) % 80, 9 + (i * 31) % 12, 0, Math.PI, 0); g.fill(); }
  const sa = k4(SEA.a, T), sb = k4(SEA.b, T), wg = g.createLinearGradient(0, HZ, 0, VH); wg.addColorStop(0, rgb(mix(sa, hor, .35))); wg.addColorStop(.3, rgb(sa)); wg.addColorStop(1, rgb(sb)); g.fillStyle = wg; g.fillRect(0, HZ, VW, VH - HZ);
  g.globalCompositeOperation = 'lighter';
  if (sunA > 0 && T > .4) { g.save(); g.beginPath(); g.rect(0, HZ, VW, VH - HZ); g.clip(); g.translate(sunX, HZ); g.scale(1, 1.6); glow(g, 0, 0, 170, pink > .2 ? '255,170,160' : '255,220,160', .5 * sunA * sm(T, .4, .7)); g.restore(); }
  if (night > 0) { g.save(); g.beginPath(); g.rect(0, HZ, VW, VH - HZ); g.clip(); g.translate(mx, HZ); g.scale(.5, 2.4); glow(g, 0, 0, 150, '220,230,255', .3 * night); g.restore(); }
  g.globalCompositeOperation = 'source-over';
  const sp = R(77); for (let i = 0; i < 70; i++) { const d = sp(), y = HZ + 6 + d * (VH - HZ - 10), x = wrap(sp() * (VW + 200) - camX * (.2 + .8 * d) + t * 6 * still(), VW + 200) - 100, a = (.15 + .4 * d) * (.5 + .5 * Math.sin(t * (1 + sp() * 2) + i)); g.fillStyle = `rgba(255,255,255,${a * (1 - .5 * night)})`; g.fillRect(x, y, 6 + 30 * d, 1 + 1.4 * d); }
  for (const st of STOPS) { const x = st.x - camX; if (x < -500 || x > VW + 500) continue; g.fillStyle = `rgba(190,252,238,${.34 * (1 - .7 * night)})`; ell(g, x, ISL + 22, (st.w || 420) * .66 * Z, 46); g.fill(); }
  /* islands and the boat, on a layer the evening can wash over */
  const L = lay; L.setTransform(1, 0, 0, 1, 0, 0); L.clearRect(0, 0, layCv.width, layCv.height); L.setTransform(k, 0, 0, k, 0, 0);
  for (const st of STOPS) { const x = st.x - camX; if (x < -600 || x > VW + 600) continue; L.save(); L.translate(x, ISL); L.scale(Z, Z); if (st.w) sand(L, st.w); L.save(); L.translate(0, -9); st.draw(L, t); L.restore(); if (st.pier !== false) pier(L, (BY - ISL - 36) / Z); signpost(L, st.sign, st.name); L.restore(); }
  for (const d of dolphins) if (d.t > 0) { const u = d.t, y = BY - 26 - Math.sin(u * Math.PI) * 74; dolphin(L, d.x - camX, y, (d.d > 0 ? 0 : Math.PI) + (u - .5) * 2.2 * d.d); if (u < .12 || u > .88) { L.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 5; i++) { L.beginPath(); L.arc(d.x - camX + (i - 2) * 7, BY - 26 - Math.abs(i - 2) * -3 - 6, 2.4, 0, TAU); L.fill(); } } }
  boat(L, B.x - camX, BY, t);
  L.globalCompositeOperation = 'source-atop';
  if (gold > 0) { L.fillStyle = `rgba(255,176,90,${.12 * gold})`; L.fillRect(0, 0, VW, VH); } if (pink > 0) { L.fillStyle = `rgba(255,120,150,${.16 * pink})`; L.fillRect(0, 0, VW, VH); } if (night > 0) { L.fillStyle = `rgba(14,20,56,${.56 * night})`; L.fillRect(0, 0, VW, VH); }
  L.globalCompositeOperation = 'source-over';
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(layCv, 0, 0); g.setTransform(k, 0, 0, k, 0, 0);
  /* waves in front of the hull, then every light */
  waveBand(g, BY + 9, 1, 3, rgb(mix(sa, sb, .62), .9), t, .45); waveBand(g, BY + 52, 1.25, 4, rgb(mix(sa, sb, .85), .92), t + 2, .3); waveBand(g, BY + 96, 1.5, 5, rgb(sb, .95), t + 4, .2);
  const lit = Math.max(night, pink * .5); g.globalCompositeOperation = 'lighter';
  for (const st of STOPS) if (st.lights) { const x = st.x - camX; if (x < -600 || x > VW + 600) continue; g.save(); g.translate(x, ISL); g.scale(Z, Z); g.translate(0, -9); st.lights(g, t, st.id === 'frog' ? night : lit); g.restore(); }
  glow(g, B.x - camX + B.dir * 78 * (Z > 1 ? 1.25 : 1), BY - 28 * (Z > 1 ? 1.25 : 1), 60, '255,206,130', .7 * night); glow(g, moth.x - camX, moth.y, 48, '255,214,130', .3 + .2 * night + .08 * Math.sin(t * 6));
  g.globalCompositeOperation = 'source-over';
  { const x = moth.x - camX, f = G.RM ? .6 : Math.abs(Math.sin(t * 17)); g.fillStyle = 'rgba(255,246,214,.94)'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(x + d * (2 + 4.5 * f), moth.y - 2, 1.6 + 5 * f, 5.4, d * .5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x + d * (1.5 + 3 * f), moth.y + 4, 1.2 + 3 * f, 3.4, d * -.4, 0, TAU); g.fill(); } g.fillStyle = '#ffd874'; ell(g, x, moth.y, 2.2, 4.6); g.fill(); }
  for (const q of says) { g.font = `700 14.5px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(q.text).width + 22; g.globalAlpha = Math.min(1, q.life * 2); g.fillStyle = PAPER; rr(g, q.x - w / 2, q.y - 13, w, 26, 13); g.fill(); g.fillStyle = INK; g.fillText(q.text, q.x, q.y + .5); g.globalAlpha = 1; }
  G.paper(g, .3 + .1 * night);
}

/* ------------------------------------------------------------------ input and wiring */
const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
const busy = () => !active || !$('bview').hidden || !$('bend').hidden;
cv.addEventListener('pointerdown', ev => { if (busy()) return; const [x] = pt(ev); down = true; target = clamp(x + camX, 190, TOTAL - 190); });
cv.addEventListener('pointermove', ev => { if (down && !busy()) target = clamp(pt(ev)[0] + camX, 190, TOTAL - 190); });
addEventListener('pointerup', () => { down = false; }); addEventListener('pointercancel', () => { down = false; });
const KEYS = { ArrowRight: 1, d: 1, D: 1, ArrowLeft: -1, a: -1, A: -1 };
addEventListener('keydown', ev => {
  if (!active || ev.metaKey || ev.ctrlKey) return;
  if (!$('bview').hidden) { if (ev.key === 'Escape') closeView(); else if (ev.key === 'ArrowRight' && view.i < view.st.items.length - 1) { view.i++; show(); } else if (ev.key === 'ArrowLeft' && view.i > 0) { view.i--; show(); } return; }
  if (busy()) return;
  if (KEYS[ev.key]) { keyDir = KEYS[ev.key]; ev.preventDefault(); } else if ((ev.key === ' ' || ev.key === 'Enter') && !(ev.target && ev.target.tagName === 'BUTTON')) { ev.preventDefault(); anchor(); }
});
addEventListener('keyup', ev => { if (KEYS[ev.key] === keyDir) keyDir = 0; });
const soundLabel = () => { $('bsound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('bsound').setAttribute('aria-pressed', G.sound); };
$('bsound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
$('bleave').addEventListener('click', () => G.go('map'));
$('banchor').addEventListener('click', anchor);
$('bprev').addEventListener('click', () => { if (view && view.i > 0) { view.i--; show(); } });
$('bnext').addEventListener('click', () => { if (view && view.i < view.st.items.length - 1) { view.i++; show(); } });
$('bclose').addEventListener('click', closeView);
$('bview').addEventListener('click', ev => { if (ev.target === $('bview')) closeView(); });
$('bstay').addEventListener('click', () => { $('bend').hidden = true; });
$('bback').addEventListener('click', () => { $('bend').hidden = true; G.go('map'); });
vid.addEventListener('error', () => { if (!$('bview').hidden && vid.getAttribute('src')) $('btext').textContent += ' (This clip is not loaded here.)'; });

G.scenes.bahamas = {
  frame, resize: layout,
  enter() { active = true; $('bui').hidden = false; layout(); stepKey = ''; setStep(); soundLabel(); moth.x = B.x + 96; moth.y = BY - 126; if (document.fonts && document.fonts.load) { document.fonts.load('700 14px Nunito'); document.fonts.load('800 10px Nunito'); } },
  leave() { active = false; if (!$('bview').hidden) closeView(); $('bend').hidden = true; target = null; keyDir = 0; down = false; B.v = 0; $('bui').hidden = true; },
  debug: { B, STOPS, got, anchor, get S() { return S; }, get camX() { return camX; }, set camInit(v) { camInit = v; } }
};
})();
