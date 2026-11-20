/* The steps. The two of them sit on the steps at Columbia; she reads the cards for Jana, who asks whether
   everything will work out, and draws the Sun, the Star and the Magician. Each card changes the evening a little. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, TAU, R, dab, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif', DISPLAY = '"Fraunces", "Iowan Old Style", Georgia, serif';
const INK = '#2c2a3d', PAPER = '#fbf3df', GOLD = '#e9b44c';
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };
const CARDS = [{ id: 'sun', no: 'XIX', name: 'THE SUN', say: 'The Sun', glow: '255,206,110' }, { id: 'star', no: 'XVII', name: 'THE STAR', say: 'The Star', glow: '170,200,255' }, { id: 'mag', no: 'I', name: 'THE MAGICIAN', say: 'The Magician', glow: '255,150,130' }];
const NFAN = 9;
let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false;
let T = null, parts = [];
const fresh = () => ({ phase: 'ask', t: 0, fan: [], picks: [], turned: 0, mood: { sun: 0, star: 0, mag: 0 }, want: { sun: 0, star: 0, mag: 0 }, joy: 0, over: 0 });

/* ------------------------------------------------------------------ the cards */
function star8(g, x, y, r, r2 = r * .42) { g.beginPath(); for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + i * Math.PI / 8, q = i % 2 ? r2 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); }
function cardBack(g, w, h) {
  g.fillStyle = PAPER; rr(g, 0, 0, w, h, w * .08); g.fill(); const m = w * .06; let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1c2748'); gr.addColorStop(1, '#3a2f66'); g.fillStyle = gr; rr(g, m, m, w - 2 * m, h - 2 * m, w * .05); g.fill();
  g.strokeStyle = GOLD; g.lineWidth = Math.max(.8, w * .014); rr(g, m * 1.9, m * 1.9, w - m * 3.8, h - m * 3.8, w * .035); g.stroke();
  g.fillStyle = GOLD; star8(g, w / 2, h / 2, w * .2); g.fill(); g.fillStyle = '#1c2748'; g.beginPath(); g.arc(w / 2, h / 2, w * .06, 0, TAU); g.fill();
  const r = R(31); for (let i = 0; i < 26; i++) { const x = m * 2.6 + r() * (w - m * 5.2), y = m * 2.6 + r() * (h - m * 5.2); if (Math.hypot(x - w / 2, y - h / 2) < w * .26) continue; g.fillStyle = `rgba(255,236,170,${.4 + r() * .6})`; star8(g, x, y, w * (.012 + r() * .02)); g.fill(); }
  g.strokeStyle = GOLD; g.lineWidth = Math.max(.7, w * .01); for (const d of [-1, 1]) { g.beginPath(); g.arc(w / 2, h / 2 + d * h * .3, w * .1, d > 0 ? Math.PI : 0, d > 0 ? TAU : Math.PI); g.stroke(); }
}
function cardFace(g, w, h, c) {
  g.fillStyle = PAPER; rr(g, 0, 0, w, h, w * .08); g.fill(); const m = w * .07, px = m, py = h * .12, pw = w - 2 * m, ph = h * .72;
  g.save(); rr(g, px, py, pw, ph, w * .04); g.clip(); g.translate(px, py);
  if (c.id === 'sun') {
    let gr = g.createLinearGradient(0, 0, 0, ph); gr.addColorStop(0, '#fde7a0'); gr.addColorStop(1, '#f7b65a'); g.fillStyle = gr; g.fillRect(0, 0, pw, ph);
    const sx = pw / 2, sy = ph * .34, sr = pw * .2; g.fillStyle = '#f29a2c'; for (let i = 0; i < 16; i++) { const a = i * TAU / 16; g.save(); g.translate(sx, sy); g.rotate(a); g.beginPath(); if (i % 2) { g.moveTo(-sr * .16, -sr * .9); g.quadraticCurveTo(sr * .2, -sr * 1.4, -sr * .05, -sr * 1.8); g.quadraticCurveTo(sr * .3, -sr * 1.35, sr * .16, -sr * .9); } else { g.moveTo(-sr * .18, -sr * .9); g.lineTo(0, -sr * 2.05); g.lineTo(sr * .18, -sr * .9); } g.fill(); g.restore(); }
    g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(sx, sy, sr, 0, TAU); g.fill(); g.strokeStyle = '#d87a1c'; g.lineWidth = Math.max(.8, pw * .012); g.stroke();
    g.lineCap = 'round'; g.lineWidth = Math.max(.9, pw * .018); for (const d of [-1, 1]) { g.beginPath(); g.arc(sx + d * sr * .4, sy - sr * .02, sr * .2, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); } g.beginPath(); g.arc(sx, sy + sr * .22, sr * .34, .2, Math.PI - .2); g.stroke(); g.fillStyle = 'rgba(240,120,90,.45)'; for (const d of [-1, 1]) { ell(g, sx + d * sr * .62, sy + sr * .3, sr * .16, sr * .1); g.fill(); }
    g.fillStyle = '#7fb85a'; g.fillRect(0, ph * .9, pw, ph * .1); g.fillStyle = '#d9cdb8'; g.fillRect(0, ph * .76, pw, ph * .15); g.strokeStyle = 'rgba(120,100,80,.5)'; g.lineWidth = Math.max(.5, pw * .006); for (let i = 0; i < 3; i++) { const y = ph * (.76 + i * .05); g.beginPath(); g.moveTo(0, y); g.lineTo(pw, y); g.stroke(); for (let x = (i % 2) * pw * .08; x < pw; x += pw * .16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + ph * .05); g.stroke(); } }
    for (let i = 0; i < 4; i++) { const fx = pw * (.16 + i * .226), fy = ph * (.66 - (i % 2) * .05), fr = pw * .07; g.strokeStyle = '#4f8a3c'; g.lineWidth = Math.max(1, pw * .02); g.beginPath(); g.moveTo(fx, ph * .78); g.lineTo(fx, fy); g.stroke(); g.fillStyle = '#f6c21c'; for (let k = 0; k < 10; k++) { const a = k * TAU / 10; ell(g, fx + Math.cos(a) * fr, fy + Math.sin(a) * fr, fr * .5, fr * .5); g.fill(); } g.fillStyle = '#6a431e'; g.beginPath(); g.arc(fx, fy, fr * .62, 0, TAU); g.fill(); }
  } else if (c.id === 'star') {
    let gr = g.createLinearGradient(0, 0, 0, ph); gr.addColorStop(0, '#182250'); gr.addColorStop(.7, '#3b4f94'); gr.addColorStop(1, '#5f7fb8'); g.fillStyle = gr; g.fillRect(0, 0, pw, ph);
    g.globalCompositeOperation = 'lighter'; glow(g, pw / 2, ph * .27, pw * .5, '255,230,150', .5); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#ffd86a'; star8(g, pw / 2, ph * .27, pw * .2); g.fill(); g.fillStyle = '#fff8dc'; star8(g, pw / 2, ph * .27, pw * .1); g.fill();
    g.fillStyle = '#fbfaf0'; for (const [x, y, q] of [[.16, .12, .05], [.84, .1, .055], [.1, .36, .045], [.9, .36, .05], [.27, .5, .04], [.73, .5, .045], [.5, .56, .035]]) { star8(g, pw * x, ph * y, pw * q); g.fill(); }
    g.fillStyle = '#26366e'; g.beginPath(); g.moveTo(0, ph * .74); g.quadraticCurveTo(pw * .25, ph * .6, pw * .5, ph * .72); g.quadraticCurveTo(pw * .78, ph * .62, pw, ph * .72); g.lineTo(pw, ph); g.lineTo(0, ph); g.fill();
    g.fillStyle = '#4f8a5c'; g.beginPath(); g.moveTo(0, ph * .84); g.quadraticCurveTo(pw * .3, ph * .76, pw * .52, ph * .86); g.lineTo(pw * .52, ph); g.lineTo(0, ph); g.fill();
    g.fillStyle = '#9fd0ee'; ell(g, pw * .7, ph * .93, pw * .36, ph * .08); g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = Math.max(.6, pw * .008); for (const k of [.5, .78]) { ell(g, pw * .68, ph * .93, pw * .26 * k, ph * .05 * k); g.stroke(); }
    g.save(); g.translate(pw * .44, ph * .7); g.rotate(.75); g.fillStyle = '#c8683c'; g.beginPath(); g.ellipse(0, 0, pw * .08, pw * .11, 0, 0, TAU); g.fill(); g.fillRect(-pw * .04, -pw * .15, pw * .08, pw * .06); g.strokeStyle = '#8a3f1e'; g.lineWidth = Math.max(.7, pw * .012); g.beginPath(); g.arc(pw * .08, -pw * .02, pw * .05, -1.2, 1.2); g.stroke(); g.restore();
    g.strokeStyle = '#cfeaff'; g.lineWidth = Math.max(1, pw * .022); g.lineCap = 'round'; g.beginPath(); g.moveTo(pw * .52, ph * .66); g.quadraticCurveTo(pw * .66, ph * .68, pw * .68, ph * .9); g.stroke(); g.lineWidth = Math.max(.7, pw * .012); g.beginPath(); g.moveTo(pw * .53, ph * .68); g.quadraticCurveTo(pw * .62, ph * .72, pw * .62, ph * .9); g.stroke();
  } else {
    let gr = g.createLinearGradient(0, 0, 0, ph); gr.addColorStop(0, '#f9e59a'); gr.addColorStop(1, '#f3cf6a'); g.fillStyle = gr; g.fillRect(0, 0, pw, ph);
    const hx = pw / 2, hr = pw * .125, hy = ph * .33;
    /* roses along the top, lilies and roses below */
    g.strokeStyle = '#4f8a3c'; g.lineWidth = Math.max(.9, pw * .016); g.beginPath(); g.moveTo(0, ph * .06); g.quadraticCurveTo(pw / 2, ph * .0, pw, ph * .06); g.stroke(); for (let i = 0; i < 7; i++) { const x = pw * (.07 + i * .143), y = ph * (.055 - Math.sin(i / 6 * Math.PI) * .028); g.fillStyle = '#c8262c'; g.beginPath(); g.arc(x, y, pw * .04, 0, TAU); g.fill(); g.fillStyle = '#8e181e'; g.beginPath(); g.arc(x, y, pw * .017, 0, TAU); g.fill(); }
    /* the lemniscate over her head */
    g.strokeStyle = '#c8861c'; g.lineWidth = Math.max(1, pw * .022); g.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, d = 1 + Math.sin(a) * Math.sin(a), x = hx + pw * .13 * Math.cos(a) / d, y = hy - hr * 1.75 + pw * .13 * Math.sin(a) * Math.cos(a) / d; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
    /* robe, cloak and arms: one hand raises the wand, the other points to the ground */
    g.fillStyle = '#b8262c'; g.beginPath(); g.moveTo(hx - hr * 1.5, hy + hr * 1.3); g.quadraticCurveTo(hx - hr * 2.5, ph * .62, hx - hr * 2.1, ph * .9); g.lineTo(hx + hr * 2.1, ph * .9); g.quadraticCurveTo(hx + hr * 2.5, ph * .62, hx + hr * 1.5, hy + hr * 1.3); g.fill();
    g.fillStyle = '#fbf8f0'; g.beginPath(); g.moveTo(hx - hr * .9, hy + hr * 1.25); g.lineTo(hx - hr * 1.2, ph * .9); g.lineTo(hx + hr * 1.2, ph * .9); g.lineTo(hx + hr * .9, hy + hr * 1.25); g.fill(); g.strokeStyle = '#c8861c'; g.lineWidth = Math.max(.8, pw * .014); g.beginPath(); g.moveTo(hx - hr * 1.02, ph * .58); g.lineTo(hx + hr * 1.02, ph * .58); g.stroke();
    g.lineCap = 'round'; g.strokeStyle = '#fbf8f0'; g.lineWidth = hr * .62; g.beginPath(); g.moveTo(hx - hr * 1.2, hy + hr * 1.6); g.lineTo(hx - hr * 2.5, hy - hr * .3); g.moveTo(hx + hr * 1.2, hy + hr * 1.6); g.lineTo(hx + hr * 2.4, hy + hr * 3.1); g.stroke();
    g.fillStyle = G.people.j.skin; g.beginPath(); g.arc(hx - hr * 2.55, hy - hr * .5, hr * .36, 0, TAU); g.arc(hx + hr * 2.45, hy + hr * 3.3, hr * .36, 0, TAU); g.fill();
    g.strokeStyle = '#fffdf4'; g.lineWidth = Math.max(1.2, pw * .02); g.beginPath(); g.moveTo(hx - hr * 2.55, hy + hr * .1); g.lineTo(hx - hr * 2.55, hy - hr * 2); g.stroke(); g.fillStyle = '#ffe9a8'; star8(g, hx - hr * 2.55, hy - hr * 2.2, hr * .5); g.fill();
    G.headFront(g, 'j', { x: hx, y: hy, r: hr, len: hr * 2.5, expr: 'smile' });
    /* the table, with the cup, the coin, the sword and the wand */
    const ty = ph * .74; g.fillStyle = '#8a5c38'; g.fillRect(pw * .1, ty, pw * .8, ph * .05); g.fillStyle = '#6e4628'; g.fillRect(pw * .16, ty + ph * .05, pw * .06, ph * .25); g.fillRect(pw * .78, ty + ph * .05, pw * .06, ph * .25);
    g.fillStyle = '#e9b44c'; g.beginPath(); g.moveTo(pw * .17, ty - ph * .075); g.lineTo(pw * .29, ty - ph * .075); g.lineTo(pw * .26, ty - ph * .03); g.lineTo(pw * .2, ty - ph * .03); g.fill(); g.fillRect(pw * .222, ty - ph * .03, pw * .016, ph * .02); g.fillRect(pw * .195, ty - ph * .012, pw * .07, ph * .012);
    g.beginPath(); g.arc(pw * .42, ty - ph * .035, pw * .05, 0, TAU); g.fill(); g.fillStyle = '#8a5c1c'; star8(g, pw * .42, ty - ph * .035, pw * .034); g.fill();
    g.strokeStyle = '#b4bac4'; g.lineWidth = Math.max(1.2, pw * .022); g.beginPath(); g.moveTo(pw * .54, ty - ph * .012); g.lineTo(pw * .72, ty - ph * .06); g.stroke(); g.strokeStyle = '#e9b44c'; g.lineWidth = Math.max(1.4, pw * .028); g.beginPath(); g.moveTo(pw * .55, ty - ph * .035); g.lineTo(pw * .575, ty + ph * .003); g.stroke();
    g.strokeStyle = '#7a4a2a'; g.lineWidth = Math.max(1.2, pw * .024); g.beginPath(); g.moveTo(pw * .76, ty - ph * .01); g.lineTo(pw * .88, ty - ph * .05); g.stroke();
    for (let i = 0; i < 6; i++) { const x = pw * (.08 + i * .168), y = ph * (.95 + (i % 2) * .02); if (i % 2) { g.fillStyle = '#fbf8f0'; for (const a of [-.6, 0, .6]) { g.beginPath(); g.ellipse(x + Math.sin(a) * pw * .03, y - pw * .03, pw * .018, pw * .04, a, 0, TAU); g.fill(); } } else { g.fillStyle = '#c8262c'; g.beginPath(); g.arc(x, y - pw * .02, pw * .04, 0, TAU); g.fill(); } g.fillStyle = '#4f8a3c'; g.fillRect(x - pw * .006, y, pw * .012, ph * .05); }
  }
  g.restore(); g.strokeStyle = 'rgba(44,42,61,.5)'; g.lineWidth = Math.max(.7, w * .008); rr(g, px, py, pw, ph, w * .04); g.stroke();
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${h * .058}px ${DISPLAY}`; g.fillText(c.no, w / 2, h * .064); let fs = h * .056; g.font = `800 ${fs}px ${UI}`; while (g.measureText(c.name).width > w * .84 && fs > 5) { fs -= .5; g.font = `800 ${fs}px ${UI}`; } g.fillText(c.name, w / 2, h * .915);
}

/* ------------------------------------------------------------------ layout */
function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S; const wide = VW >= 760, mid = VW / 2;
  const seat = wide ? VH - 190 : VH - 250, sc = wide ? 1.32 : 1, sep = wide ? Math.min(310, VW * .25) : 122, cw = wide ? 150 : 112, ch = cw / .6, gap = wide ? 28 : 12, sy = wide ? 72 : 96;
  const fw = wide ? 60 : 43, fh = fw / .6, fsp = wide ? 37 : 41, fy = wide ? seat - 40 : seat + 112;
  L = { wide, mid, seat, sc, jx: mid - sep, fx: mid + sep, cw, ch, sy, slot: i => mid + (i - 1) * (cw + gap), fw, fh, fan: i => { const u = i - (NFAN - 1) / 2; return { x: mid + u * fsp, y: fy + Math.abs(u) * Math.abs(u) * (wide ? 1.5 : 1), rot: u * .045 }; }, plaza: wide ? 262 : 270, bw: wide ? Math.min(660, VW * .56) : 404 };
  const q = clamp(S * G.DPR, 1, 2.5);
  SPR = { place: G.spr(VW, VH, drawPlace, q), back: G.spr(cw, ch, cardBack, clamp(q * 1.2, 1, 3)) };
  for (const c of CARDS) SPR[c.id] = G.spr(cw, ch, (g, w, h) => cardFace(g, w, h, c), clamp(q * 1.2, 1, 3));
  $('qui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}

/* ------------------------------------------------------------------ the steps, the library and the statue (no sky: that is painted live) */
function drawPlace(g, w, h) {
  const r = R(1754), mid = L.mid, py = L.plaza, bw = L.bw, k = L.wide ? 1 : .68, bx = mid - bw / 2;
  /* trees at the edges */
  for (const d of [-1, 1]) for (let i = 0; i < 3; i++) { const x = mid + d * (bw / 2 + 60 + i * 90 * k), y = py - 30 - i * 8; g.fillStyle = '#4a3528'; g.fillRect(x - 4, y, 8, 60); for (let j = 0; j < 9; j++) dab(g, x + (r() - .5) * 90 * k, y - 20 - r() * 80 * k, 26 + r() * 22, 20 + r() * 14, r() * 3, j % 2 ? '#3f6a48' : '#55825a', .95); g.globalAlpha = 1; }
  /* the library: wings, the colonnade, the attic and the dome */
  const wallH = 124 * k, colH = 104 * k, top = py - wallH;
  g.fillStyle = '#9fa8a0'; g.beginPath(); g.ellipse(mid, top - 46 * k, bw * .27, 78 * k, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(mid - bw * .06, top - 60 * k, bw * .12, 50 * k, -.2, Math.PI, 0); g.fill();
  g.fillStyle = '#d9cfba'; g.fillRect(mid - bw * .3, top - 52 * k, bw * .6, 54 * k); g.fillStyle = '#c4b8a0'; g.fillRect(mid - bw * .32, top - 56 * k, bw * .64, 7 * k);
  let gr = g.createLinearGradient(0, top, 0, py); gr.addColorStop(0, '#e9dfca'); gr.addColorStop(1, '#d6cab2'); g.fillStyle = gr; g.fillRect(bx, top, bw, wallH);
  for (const d of [-1, 1]) for (let i = 0; i < 2; i++) { const x = mid + d * bw * (.33 + i * .1) - 9 * k; g.fillStyle = '#5a5f74'; g.fillRect(x, top + 30 * k, 18 * k, 60 * k); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x, top + 30 * k, 18 * k, 4 * k); }
  const cx0 = mid - bw * .27, cwid = bw * .54; g.fillStyle = '#4a4458'; g.fillRect(cx0, top + 18 * k, cwid, colH); g.fillStyle = '#6a5a48'; for (let i = 0; i < 3; i++) g.fillRect(mid - 52 * k + i * 38 * k, top + 50 * k, 28 * k, colH - 32 * k);
  g.fillStyle = '#c4b8a0'; g.fillRect(cx0 - 10 * k, top + 4 * k, cwid + 20 * k, 16 * k); g.fillStyle = '#efe6d2'; g.fillRect(cx0 - 14 * k, top, cwid + 28 * k, 6 * k);
  for (let i = 0; i < 10; i++) { const x = cx0 + cwid * (i + .5) / 10; gr = g.createLinearGradient(x - 8 * k, 0, x + 8 * k, 0); gr.addColorStop(0, '#f4ecd8'); gr.addColorStop(1, '#cfc3aa'); g.fillStyle = gr; g.fillRect(x - 7 * k, top + 26 * k, 14 * k, colH - 12 * k); g.fillStyle = '#efe6d2'; g.fillRect(x - 10 * k, top + 20 * k, 20 * k, 7 * k); g.fillRect(x - 9 * k, py - 5 * k, 18 * k, 5 * k); }
  g.fillStyle = 'rgba(60,50,40,.25)'; g.fillRect(bx, py - 2, bw, 3);
  /* the steps: bands of tread and riser, growing towards us */
  const sw0 = bw + 60 * k; let y = py, i = 0; g.fillStyle = '#d9cfba'; g.fillRect(0, py, w, h - py);
  while (y < L.seat - 22) { const sh = 9 + i * 1.5, tr = sh * .56, x0 = mid - sw0 / 2 - i * 14, ww = sw0 + i * 28; g.fillStyle = i % 9 === 4 ? '#f1e9d8' : '#ebe2cf'; g.fillRect(x0, y, ww, tr); g.fillStyle = '#c6baa2'; g.fillRect(x0, y + tr, ww, sh - tr); y += sh; i++; }
  g.fillStyle = '#efe7d4'; g.fillRect(0, y, w, L.seat + 2 - y); g.fillStyle = '#c0b49c'; g.fillRect(0, L.seat + 2, w, 44 * L.sc); g.fillStyle = '#e9e0cc'; g.fillRect(0, L.seat + 2 + 44 * L.sc, w, 16); g.fillStyle = '#b8ac94'; g.fillRect(0, L.seat + 18 + 44 * L.sc, w, 8);
  const pv = L.seat + 26 + 44 * L.sc; gr = g.createLinearGradient(0, pv, 0, h); gr.addColorStop(0, '#cdbfa8'); gr.addColorStop(1, '#b9aa92'); g.fillStyle = gr; g.fillRect(0, pv, w, h - pv); g.strokeStyle = 'rgba(90,70,50,.18)'; g.lineWidth = 1; for (let yy = pv + 22; yy < h; yy += 30) { g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); for (let x = (Math.round(yy / 30) % 2) * 34; x < w; x += 68) { g.beginPath(); g.moveTo(x, yy - 30); g.lineTo(x, yy); g.stroke(); } }
  for (let j = 0; j < w * h / 5000; j++) dab(g, r() * w, py + r() * (h - py), 20 + r() * 50, 4 + r() * 8, 0, r() < .5 ? '#fff8e8' : '#a89880', .1); g.globalAlpha = 1;
  /* the cheek walls with their lamps */
  for (const d of [-1, 1]) { const x = mid + d * (sw0 / 2 + 46 * k); g.fillStyle = '#cfc3aa'; g.fillRect(x - 26 * k, py - 18 * k, 52 * k, 60 * k); g.fillStyle = '#e6dcc6'; g.fillRect(x - 30 * k, py - 24 * k, 60 * k, 8 * k); g.fillStyle = '#2c3038'; g.fillRect(x - 2.5 * k, py - 96 * k, 5 * k, 74 * k); g.fillRect(x - 9 * k, py - 28 * k, 18 * k, 5 * k); g.fillStyle = '#f4ecd2'; g.beginPath(); g.arc(x, py - 104 * k, 11 * k, 0, TAU); g.fill(); g.strokeStyle = '#2c3038'; g.lineWidth = 1.4; g.stroke(); }
  /* the statue on its pedestal, arms open, halfway up */
  const ay = py + (L.wide ? 60 : 46), s = L.wide ? 1.2 : .82; g.save(); g.translate(mid, ay); g.scale(s, s);
  g.fillStyle = '#b8ac94'; g.fillRect(-46, 40, 92, 9); g.fillStyle = '#d9cfba'; g.fillRect(-36, 0, 72, 42); g.fillStyle = '#efe6d2'; g.fillRect(-42, -6, 84, 8); g.fillStyle = 'rgba(60,50,40,.14)'; g.fillRect(12, 0, 24, 42);
  g.fillStyle = '#3f5648'; g.fillRect(-24, -62, 48, 58); g.fillRect(-28, -70, 8, 18); g.fillRect(20, -70, 8, 18);
  g.fillStyle = '#56735f'; g.beginPath(); g.moveTo(-23, -4); g.quadraticCurveTo(-27, -40, -11, -54); g.lineTo(11, -54); g.quadraticCurveTo(27, -40, 23, -4); g.fill(); g.fillStyle = '#6a8a72'; ell(g, 0, -14, 24, 11); g.fill();
  g.lineCap = 'round'; g.strokeStyle = '#56735f'; g.lineWidth = 7; g.beginPath(); g.moveTo(-11, -48); g.lineTo(-36, -64); g.moveTo(11, -48); g.lineTo(36, -62); g.stroke(); g.strokeStyle = '#7fa088'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(38, -40); g.lineTo(38, -98); g.stroke(); g.fillStyle = '#7fa088'; star8(g, 38, -101, 5); g.fill();
  g.fillStyle = '#56735f'; g.beginPath(); g.arc(0, -64, 9, 0, TAU); g.fill(); g.strokeStyle = '#7fa088'; g.lineWidth = 2; g.beginPath(); g.arc(0, -66, 9, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.fillStyle = '#8fae98'; g.fillRect(-9, -24, 18, 6); g.strokeStyle = 'rgba(160,200,170,.5)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-14, -44); g.quadraticCurveTo(-18, -24, -12, -8); g.moveTo(6, -46); g.quadraticCurveTo(12, -28, 8, -10); g.stroke(); g.restore();
}

/* ------------------------------------------------------------------ the two of them, sitting on a step */
function sitter(g, who, x, t, o) {
  const k = G.people[who], d = who === 'j' ? 1 : -1, sc = L.sc, jt = who === 'j' && G.janaTop(), c = jt || (who === 'j' ? { top: '#27305a', dark: '#1a2144', leg: '#2b3350', shoe: '#f4f0e6' } : { top: '#cdb48e', dark: '#a98f69', leg: '#26262e', shoe: '#3a2c20' });
  g.save(); g.translate(x, L.seat); g.scale(d * sc, sc); g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillStyle = 'rgba(40,30,30,.16)'; ell(g, 10, 4, 54, 7); g.fill();
  g.fillStyle = c.leg; rr(g, 34, -10, 21, 54, 10); g.fill(); g.fillStyle = c.shoe; rr(g, 32, 36, 38, 13, 6); g.fill(); g.fillStyle = c.leg; rr(g, -18, -27, 72, 27, 13); g.fill();
  const gr = g.createLinearGradient(-28, 0, 24, 0); gr.addColorStop(0, c.dark); gr.addColorStop(1, c.top); g.fillStyle = gr; g.beginPath(); g.moveTo(-24, 2); g.quadraticCurveTo(-32, -42, -19, -72); g.quadraticCurveTo(-6, -86, 9, -82); g.quadraticCurveTo(25, -74, 23, -42); g.quadraticCurveTo(23, -12, 19, 2); g.closePath(); g.fill();
  const reach = o.reach || 0, lift = o.lift || 0, ex = 24 + reach * 6, ey = -36 - lift * 6, hx = 44 + reach * 30, hy = -30 - lift * 26;
  g.strokeStyle = 'rgba(20,16,30,.25)'; g.lineWidth = 16; g.beginPath(); g.moveTo(4, -64); g.lineTo(ex, ey); g.lineTo(hx, hy); g.stroke(); g.strokeStyle = c.top; g.lineWidth = 13.5; g.stroke(); g.fillStyle = k.skin; g.beginPath(); g.arc(hx + 3, hy, 7, 0, TAU); g.fill();
  G.head(g, who, { x: 5, y: -106 + (o.nod || 0), r: 22, len: 74, expr: o.expr || 'smile', blink: !G.RM && ((t + (who === 'f' ? 1.7 : 0)) % 3.9) < .12, tilt: o.tilt || 0 });
  g.restore();
}
function bubble(g, text, x, y, a, tail) {
  g.font = `700 ${L.wide ? 17 : 15}px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(text).width + 30, h = L.wide ? 40 : 36, bx = clamp(x, w / 2 + 10, VW - w / 2 - 10); g.globalAlpha = a;
  g.fillStyle = 'rgba(28,39,72,.2)'; rr(g, bx - w / 2 + 2, y - h / 2 + 3, w, h, h / 2); g.fill(); g.fillStyle = PAPER; rr(g, bx - w / 2, y - h / 2, w, h, h / 2); g.fill(); g.beginPath(); g.moveTo(x + tail * 6, y + h / 2 - 2); g.lineTo(x + tail * 20, y + h / 2 - 2); g.lineTo(x + tail * 4, y + h / 2 + 12); g.fill();
  g.fillStyle = INK; g.fillText(text, bx, y + 1); g.globalAlpha = 1;
}

/* ------------------------------------------------------------------ the reading */
const LABEL = { ask: 'Shuffle the cards', pick: 'Draw a card', turn: 'Turn a card over' };
function setStep() {
  const p = T.phase; $('qstep').textContent = p === 'ask' ? 'Jana has a question for the cards.' : p === 'shuffle' ? 'Shuffling…' : p === 'pick' ? `Draw three cards. ${3 - T.picks.length} to go.` : p === 'turn' ? (T.turned ? CARDS.filter((c, i) => T.picks[i] && T.picks[i].up).map(c => c.say).join(', ') + '.' : 'Turn them over, one at a time.') : 'The Sun, the Star and the Magician.';
  const b = $('qdo'); b.hidden = !LABEL[p]; if (LABEL[p]) b.textContent = LABEL[p];
}
function shuffle() { if (T.phase !== 'ask') return; T.phase = 'shuffle'; T.t = 0; for (let i = 0; i < 9; i++) tone(240 + (i % 3) * 60, .03, 'square', .02, .1 + i * .13); setStep(); }
function pickCard(i) {
  if (T.phase !== 'pick' || T.picks.length >= 3) return; const f = T.fan[i]; if (!f || f.gone) return; f.gone = true; const p0 = L.fan(i);
  T.picks.push({ x0: p0.x, y0: p0.y, r0: p0.rot, u: 0, up: false, flip: 0 }); tone(523 + T.picks.length * 90, .1, 'sine', .06); if (T.picks.length === 3) { T.phase = 'turn'; T.t = 0; } setStep();
}
function turnCard(i) {
  if (T.phase !== 'turn') return; const p = T.picks[i]; if (!p || p.up || p.u < 1) return; p.up = true; T.turned++; const c = CARDS[i]; T.want[c.id] = 1; T.joy = 1.6;
  [[523, 659, 784], [587, 740, 988], [659, 831, 1047]][i].forEach((f, k) => tone(f, .5, 'sine', .06, k * .09));
  if (!G.RM) for (let k = 0; k < 26; k++) { const a = Math.random() * TAU, v = 40 + Math.random() * 120; parts.push({ x: L.slot(i), y: L.sy + L.ch / 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: 1 + Math.random() * .8, c: c.glow }); }
  if (T.turned === 3) { T.phase = 'answer'; T.t = 0; [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, .7, 'sine', .05, .5 + k * .14)); } setStep();
}
function next() { if (T.phase === 'ask') shuffle(); else if (T.phase === 'pick') { const left = T.fan.map((f, i) => (f.gone ? -1 : i)).filter(i => i >= 0); pickCard(left[Math.floor(left.length / 2)]); } else if (T.phase === 'turn') { const i = T.picks.findIndex(p => !p.up && p.u >= 1); if (i >= 0) turnCard(i); } }
function update(dt) {
  T.t += dt; T.joy = Math.max(0, T.joy - dt);
  for (const key in T.mood) T.mood[key] = lerp(T.mood[key], T.want[key], 1 - Math.exp(-dt * 1.6));
  if (T.phase === 'shuffle' && T.t > (G.RM ? .2 : 1.5)) { T.phase = 'pick'; T.t = 0; T.fan = Array.from({ length: NFAN }, (q, i) => ({ u: -i * .07, gone: false })); setStep(); }
  for (const f of T.fan) f.u = Math.min(1, f.u + dt * (G.RM ? 20 : 2.4));
  for (const p of T.picks) { p.u = Math.min(1, p.u + dt * (G.RM ? 20 : 2)); if (p.up) p.flip = Math.min(1, p.flip + dt * (G.RM ? 20 : 2.6)); }
  if (T.phase === 'answer' && !T.over && T.t > 3.4) { T.over = 1; $('qend').hidden = false; $('qstay').focus(); }
  for (const q of parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 40 * dt; q.vx *= .98; } parts = parts.filter(q => q.life > 0);
  if (T.mood.mag > .5 && !G.RM && Math.random() < dt * 9) { const who = Math.random() < .5 ? L.jx : L.fx; parts.push({ x: who + (Math.random() - .5) * 120, y: L.seat - Math.random() * 150 * L.sc, vx: (Math.random() - .5) * 14, vy: -18 - Math.random() * 20, life: 1.4, c: '255,236,170' }); }
}
function frame(dt) {
  if (!L || !SPR || !T) return; update(dt); const t = G.time, g = cx, m = T.mood, mid = L.mid, still = G.RM ? 0 : 1;
  g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  /* the sky: a grey-blue evening that the cards warm up and fill with stars */
  const sky = g.createLinearGradient(0, 0, 0, L.plaza); const mix = (a, b, k) => a.map((v, i) => Math.round(lerp(v, b[i], k))), top = mix(mix([124, 142, 176], [96, 120, 186], m.sun), [34, 44, 98], m.star * .85), low = mix([196, 190, 198], [255, 190, 120], m.sun);
  sky.addColorStop(0, `rgb(${top})`); sky.addColorStop(1, `rgb(${low})`); g.fillStyle = sky; g.fillRect(0, 0, VW, L.plaza + 4);
  if (m.sun > .01) { g.globalCompositeOperation = 'lighter'; glow(g, mid, L.plaza - 120, Math.max(VW * .5, 420), '255,196,96', .55 * m.sun); g.save(); g.translate(mid, L.plaza - 110); g.rotate(t * .05 * still); for (let i = 0; i < 14; i++) { g.rotate(TAU / 14); g.fillStyle = `rgba(255,214,130,${.09 * m.sun})`; g.beginPath(); g.moveTo(0, 0); g.lineTo(-26, -VW * .6); g.lineTo(26, -VW * .6); g.fill(); } g.restore(); g.globalCompositeOperation = 'source-over'; }
  if (m.star > .01) { const r = R(88); for (let i = 0; i < 46; i++) { const x = r() * VW, y = r() * (L.plaza - 60), tw = .55 + .45 * Math.sin(t * (1.5 + r() * 2) + i) * still; g.fillStyle = `rgba(255,250,230,${m.star * tw})`; star8(g, x, y, 1.6 + r() * 2.4); g.fill(); } g.globalCompositeOperation = 'lighter'; glow(g, mid + (L.wide ? 250 : 120), 54, 60, '255,240,190', .5 * m.star); g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(255,236,160,${m.star})`; star8(g, mid + (L.wide ? 250 : 120), 54, 11 + Math.sin(t * 2) * 1.5 * still); g.fill(); }
  g.drawImage(SPR.place, 0, 0, VW, VH);
  if (m.sun > .01) { g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(255,186,96,${.5 * m.sun})`; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'source-over'; }
  if (m.star > .01) { g.fillStyle = `rgba(30,36,90,${.16 * m.star})`; g.fillRect(0, 0, VW, VH); }
  /* lamps and the doors light up for the Magician */
  if (m.mag > .01) { const k = L.wide ? 1 : .68, sw0 = L.bw + 60 * k; g.globalCompositeOperation = 'lighter'; for (const d of [-1, 1]) glow(g, mid + d * (sw0 / 2 + 46 * k), L.plaza - 104 * k, 70 * k, '255,220,150', .7 * m.mag * (.9 + .1 * Math.sin(t * 5 + d) * still)); glow(g, mid, L.plaza - 40 * k, 110 * k, '255,200,120', .4 * m.mag); g.globalCompositeOperation = 'source-over'; }
  /* two pigeons */
  for (const [px, py, ph] of [[mid - (L.wide ? 420 : 170), L.plaza + 40, 0], [mid + (L.wide ? 470 : 176), L.plaza + 64, 2]]) { const peck = Math.max(0, Math.sin(t * 3 + ph)) * 3 * still; g.fillStyle = '#7d8590'; ell(g, px, py, 9, 6); g.fill(); g.fillStyle = '#5f6672'; g.beginPath(); g.arc(px + 8, py - 5 + peck, 4, 0, TAU); g.fill(); g.fillStyle = '#e9a52c'; g.fillRect(px + 11, py - 5 + peck, 3, 1.6); }
  /* the cloth and the deck between them */
  const cy = L.seat - 2, deckLeft = T.phase === 'ask' || T.phase === 'shuffle'; g.fillStyle = '#5a2a6a'; g.beginPath(); g.moveTo(mid - 62 * L.sc, cy); g.lineTo(mid + 62 * L.sc, cy); g.lineTo(mid + 52 * L.sc, cy - 12 * L.sc); g.lineTo(mid - 52 * L.sc, cy - 12 * L.sc); g.fill(); g.fillStyle = GOLD; for (let i = 0; i < 5; i++) { star8(g, mid + (i - 2) * 22 * L.sc, cy - 6 * L.sc, 2.4 * L.sc); g.fill(); }
  if (deckLeft) for (let i = 0; i < 5; i++) g.drawImage(SPR.back, mid - 15 * L.sc, cy - (30 + i * 1.6) * L.sc, 30 * L.sc, 22 * L.sc);
  if (T.phase === 'shuffle') for (let i = 0; i < 5; i++) { const u = ((T.t * 2.2 + i / 5) % 1), a = Math.PI * u; g.save(); g.translate(mid + Math.cos(a) * -34 * L.sc, cy - 34 * L.sc - Math.sin(a) * 40 * L.sc); g.rotate((u - .5) * 2); g.drawImage(SPR.back, -12 * L.sc, -20 * L.sc, 24 * L.sc, 40 * L.sc); g.restore(); }
  const shuf = T.phase === 'shuffle' ? 1 : 0, joy = T.joy > 0 || T.phase === 'answer';
  sitter(g, 'j', L.jx, t, { expr: joy ? 'joy' : 'smile', reach: T.phase === 'pick' ? .5 : .1, lift: T.phase === 'pick' ? .3 : 0, tilt: T.phase === 'ask' ? -.05 : 0 });
  sitter(g, 'f', L.fx, t, { expr: joy ? 'joy' : 'smile', reach: shuf ? .8 + .2 * Math.sin(T.t * 14) : T.phase === 'pick' ? .6 : .2, lift: shuf ? .5 + .4 * Math.sin(T.t * 14 + 1) : 0 });
  if (T.phase === 'ask' || T.phase === 'shuffle') bubble(g, 'Will everything work out?', L.jx + 60 * L.sc, L.seat - 168 * L.sc, clamp(T.phase === 'ask' ? T.t * 2 : 1.5 - T.t, 0, 1), -1);
  /* the fan to draw from */
  T.fan.forEach((f, i) => { if (f.gone || f.u <= 0) return; const p = L.fan(i), k = sm(clamp(f.u, 0, 1)), out = T.phase === 'pick' ? 1 : Math.max(0, 1 - T.t * 2), x = lerp(mid, p.x, k), y = lerp(cy - 30, p.y, k) - (T.phase === 'pick' ? Math.sin(t * 2 + i) * 1.5 * still : 0); if (out <= 0) return; g.save(); g.globalAlpha = out; g.translate(x, y); g.rotate(p.rot * k); g.fillStyle = 'rgba(28,39,72,.25)'; rr(g, -L.fw / 2 + 2, -L.fh / 2 + 3, L.fw, L.fh, 4); g.fill(); g.drawImage(SPR.back, -L.fw / 2, -L.fh / 2, L.fw, L.fh); g.restore(); });
  g.globalAlpha = 1;
  /* the three she drew */
  T.picks.forEach((p, i) => { const c = CARDS[i], k = sm(p.u), x = lerp(p.x0, L.slot(i), k), y = lerp(p.y0, L.sy + L.ch / 2, k), w = lerp(L.fw, L.cw, k), h = lerp(L.fh, L.ch, k), fl = p.up ? sm(p.flip) : 0, sx = Math.abs(Math.cos(fl * Math.PI)), face = fl > .5, bob = p.u >= 1 ? Math.sin(t * 1.6 + i * 1.3) * 2.5 * still : 0;
    if (p.up) { g.globalCompositeOperation = 'lighter'; glow(g, x, y + bob, w * 1.25, c.glow, .5 * fl); g.globalCompositeOperation = 'source-over'; }
    g.save(); g.translate(x, y + bob); g.rotate(p.r0 * (1 - k)); g.scale(Math.max(.02, sx), 1); g.fillStyle = 'rgba(28,39,72,.28)'; rr(g, -w / 2 + 4, -h / 2 + 6, w, h, w * .08); g.fill(); g.drawImage(face ? SPR[c.id] : SPR.back, -w / 2, -h / 2, w, h);
    if (!p.up && p.u >= 1 && T.phase === 'turn') { g.strokeStyle = `rgba(255,236,170,${.5 + .4 * Math.sin(t * 4 + i)})`; g.lineWidth = 2.5; rr(g, -w / 2 - 3, -h / 2 - 3, w + 6, h + 6, w * .09); g.stroke(); } g.restore(); });
  for (const q of parts) { g.fillStyle = `rgba(${q.c},${clamp(q.life, 0, 1)})`; star8(g, q.x, q.y, 2 + q.life * 2.4); g.fill(); }
  G.paper(g, .3);
}

/* ------------------------------------------------------------------ input and wiring */
const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
cv.addEventListener('pointerdown', e => {
  if (!active || !L || !T || !$('qend').hidden) return; const [x, y] = pt(e);
  if (T.phase === 'ask') { if (Math.abs(x - L.mid) < 90 * L.sc && Math.abs(y - (L.seat - 20 * L.sc)) < 60 * L.sc) shuffle(); }
  else if (T.phase === 'pick') { let best = -1, bd = L.fw * .9; T.fan.forEach((f, i) => { if (f.gone) return; const p = L.fan(i), d = Math.hypot(x - p.x, (y - p.y) * .5); if (d < bd) { bd = d; best = i; } }); if (best >= 0) pickCard(best); }
  else if (T.phase === 'turn') { for (let i = 0; i < 3; i++) if (Math.abs(x - L.slot(i)) < L.cw / 2 + 6 && Math.abs(y - (L.sy + L.ch / 2)) < L.ch / 2 + 6) turnCard(i); }
});
function reset() { T = fresh(); parts = []; $('qend').hidden = true; setStep(); }
$('qdo').addEventListener('click', next);
$('qstay').addEventListener('click', () => { $('qend').hidden = true; });
$('qagain').addEventListener('click', reset);
$('qback').addEventListener('click', () => G.go('map')); $('qleave').addEventListener('click', () => G.go('map'));
const soundLabel = () => { $('qsound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('qsound').setAttribute('aria-pressed', G.sound); };
$('qsound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
G.scenes.tarot = {
  frame, resize: layout,
  enter() { active = true; $('qui').hidden = false; soundLabel(); layout(); reset(); if (document.fonts && document.fonts.load) { document.fonts.load('600 20px Fraunces').then(() => { if (active) layout(); }).catch(() => { /* the fallback serif is fine */ }); document.fonts.load('800 14px Nunito'); } },
  leave() { active = false; $('qend').hidden = true; $('qui').hidden = true; },
  debug: { next, get T() { return T; }, get L() { return L; }, CARDS }
};
})();
