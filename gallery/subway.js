/* The city. The two of them ride a subway car through their New York: each stop is a place, and the poster on the
   platform wall is the real photo. The last stop comes up above ground, at night, with the moon beside the tower. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, wrap, TAU, R, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif';
const INK = '#2c2a3d', PAPER = '#fbf3df', SPAN = 2000;
const ST = [
  { id: 'train', name: 'Our train', col: '#d8262c', items: [{ id: 'train', title: 'On the train', text: 'Laughing on the way somewhere. The joke is lost; the photo is not.' }] },
  { id: 'stadium', name: 'The stadium', col: '#27375c', items: [{ id: 'stadium', title: 'The ballgame', text: 'Matching caps, and a cookie dressed as a baseball.' }, { id: 'blanket', media: 'clip', title: 'Under the blanket', text: 'Matching caps and one blanket between us.' }] },
  { id: 'gym', name: 'The gym', col: '#6a3058', items: [{ id: 'gym', title: 'Mirror check', text: 'Three of us in the mirror. Proof that we went.' }] },
  { id: 'home', name: 'Home', col: '#b3242e', items: [{ id: 'cards', media: 'clip', title: 'The card reading', text: 'Cards spread out on the bed, and you mid-reading.' }] },
  { id: 'river', name: 'East River', col: '#2f7fa8', items: [{ id: 'river', title: 'The study spot', text: 'Books open by the water, the bridge behind us. Some studying happened.' }] },
  { id: 'bridge', name: 'Brooklyn Bridge', col: '#8a6a52', items: [{ id: 'bridge', title: 'Walking the bridge', text: 'The whole skyline behind us, and both of us grinning at the camera instead.' }] },
  { id: 'park', name: 'Central Park', col: '#3f8a4a', items: [{ id: 'park', title: 'By the pond', text: 'Green everywhere, and a bouquet with a doll in the middle of it.' }] },
  { id: 'village', name: 'The Village', col: '#c8402c', items: [{ id: 'village', title: 'Ice cream this way', text: 'A hug in the middle of the crosswalk. The sign had a point.' }] },
  { id: 'downtown', name: 'Downtown', col: '#5a5a66', items: [{ id: 'street', title: 'Waiting to cross', text: 'Grey sky, a yellow bus, and your hair doing the most.' }, { id: 'friend', title: "You've got a friend", text: 'The wall said it first. You laughed. It is true.' }] },
  { id: 'spritz', name: 'The pâtisserie', col: '#8e1a2a', items: [{ id: 'spritz', title: 'Two spritzes', text: 'One orange, one pale yellow, and something very interesting above us.' }] },
  { id: 'pub', name: 'The pub', col: '#2f6a3c', items: [{ id: 'pub', title: 'At the bar', text: 'White turtleneck, black fur, heads together.' }] },
  { id: 'rooftop', name: 'The rooftop', col: '#33273c', items: [{ id: 'rooftop', title: 'Candle and moon', text: 'One candle, the moon through the clouds, and you looking off at something.' }] },
  { id: 'view', name: 'The view', col: '#1c2748', night: true, items: [{ id: 'view', title: 'The top of the city', text: 'All of it lit up below us.' }, { id: 'selfie', title: 'Cheek to cheek', text: 'Above everything, squeezed into one frame.' }, { id: 'moon', title: 'The moon and the tower', text: 'The moon showed up right next to the spire.' }] }
];
const img = {}; for (const s of ST) { const im = new Image(); im.onload = () => { im.ok = true; }; im.src = `media/ny_${s.items[0].id}.jpg`; img[s.id] = im; }
let S = 1, VW = 0, VH = 0, L = null, active = false, view = null, endShown = false, poster = null;
const C = { at: 0, pos: 0, move: null, speed: 0 }, seen = new Set(), moth = { x: 80, y: 200 };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };

function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S; const wide = VW >= 760, ty = wide ? 70 : 108, wy0 = ty + 76, wh = clamp(VH * .36, 220, 300);
  L = { wide, ty, wy0, wh, wy1: wy0 + wh, seat: wy0 + wh + 100, px: VW * (wide ? .64 : .68), gx: wide ? VW * .2 : 62 };
  $('sui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function setStep() {
  const s = ST[C.at], m = C.move; $('sstep').textContent = m ? `Next stop: ${ST[m.to].name}.` : `This is ${s.name}. Tap the poster to look closer.`;
  $('sstops').textContent = `Stop ${C.at + 1} of ${ST.length}`; $('sprev').disabled = !!m || C.at === 0; $('snext').disabled = !!m || C.at === ST.length - 1; $('slook').disabled = !!m;
}
function ride(to) { if (C.move || to < 0 || to >= ST.length) return; C.move = { from: C.at, to, u: 0 }; setStep(); tone(523, .18, 'sine', .06); tone(415, .3, 'sine', .06, .18); }
const vid = $('svid'), pic = $('simg');
function show() { const s = view.st, it = s.items[view.i], clip = it.media === 'clip'; vid.pause(); vid.hidden = !clip; pic.hidden = clip; if (clip) { pic.removeAttribute('src'); vid.muted = !G.sound; vid.loop = true; vid.poster = `media/ny_${it.id}.jpg`; vid.src = `media/ny_${it.id}.mp4`; const p = vid.play(); if (p && p.catch) p.catch(() => { /* she can press play herself */ }); } else { vid.removeAttribute('src'); vid.load(); } $('sno').textContent = `${s.name}` + (s.items.length > 1 ? `  ·  ${view.i + 1} of ${s.items.length}` : ''); $('stitle').textContent = it.title; $('stext').textContent = it.text; if (!clip) { pic.alt = it.title; pic.src = `media/ny_${it.id}.jpg`; } $('snav').hidden = s.items.length < 2; $('sp').disabled = view.i === 0; $('sn').disabled = view.i === s.items.length - 1; }
function look() { if (C.move) return; view = { st: ST[C.at], i: 0 }; seen.add(ST[C.at].id); $('sview').hidden = false; show(); $('sclose').focus(); tone(660, .1, 'sine', .05); }
function closeView() { const s = view && view.st; vid.pause(); vid.removeAttribute('src'); vid.load(); $('sview').hidden = true; pic.removeAttribute('src'); view = null; if (s && s.night && !endShown) { endShown = true; setTimeout(() => { if (active) { $('send').hidden = false; $('sstay').focus(); [523, 659, 784, 1047].forEach((f, i) => tone(f, .9, 'sine', .05, i * .22)); } }, 1200); } }

/* ------------------------------------------------------------------ what passes outside the window */
function outside(g, t) {
  const X = C.pos * SPAN, y0 = L.wy0, h = L.wh, sx = wx => wx - X + L.px, sp = C.speed; poster = null;
  g.fillStyle = '#15161c'; g.fillRect(0, y0, VW, h);
  /* tunnel: cables and lights streaking by */
  g.strokeStyle = 'rgba(90,96,110,.5)'; g.lineWidth = 2; for (const k of [.2, .28, .8]) { g.beginPath(); g.moveTo(0, y0 + h * k); g.lineTo(VW, y0 + h * k); g.stroke(); }
  for (let wx = Math.floor((X - L.px) / 260) * 260; wx < X + VW; wx += 260) { const x = sx(wx), w = 8 + sp * 26; g.fillStyle = 'rgba(255,220,150,.85)'; rr(g, x - w / 2, y0 + h * .14, w, 5, 2.5); g.fill(); g.fillStyle = 'rgba(70,74,86,.8)'; g.fillRect(x + 120, y0, 10 + sp * 10, h); }
  for (let i = 0; i < ST.length; i++) {
    const s = ST[i], c = sx(i * SPAN); if (c < -760 || c > VW + 760) continue; const x0 = c - 620, x1 = c + 620;
    if (s.night) {
      /* above ground at last: the skyline, the lit spire and the orange moon */
      const gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, '#0b1030'); gr.addColorStop(1, '#2a2f5c'); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, h);
      const r = R(77); for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(255,250,235,${.3 + .6 * r()})`; g.fillRect(x0 + r() * 1240, y0 + r() * h * .6, 1.5, 1.5); }
      for (let x = x0; x < x1; x += 14 + r() * 26) { const bw = 12 + r() * 26, bh = h * (.18 + r() * r() * .5); g.fillStyle = r() < .5 ? '#161a36' : '#1e2446'; g.fillRect(x, y0 + h - bh, bw, bh); g.fillStyle = '#ffd98a'; for (let yy = y0 + h - bh + 4; yy < y0 + h - 4; yy += 6) for (let xx = x + 3; xx < x + bw - 3; xx += 5) if (r() < .34) g.fillRect(xx, yy, 2, 3); }
      const tx = c - 250, tb = y0 + h; g.fillStyle = '#1c2a6a'; g.fillRect(tx - 26, tb - h * .62, 52, h * .62); g.fillStyle = '#f08a2c'; g.fillRect(tx - 20, tb - h * .7, 40, h * .09); g.fillStyle = '#39d0e0'; g.fillRect(tx - 9, tb - h * .86, 18, h * .17); g.fillStyle = '#3f6fe8'; g.fillRect(tx - 2.5, tb - h * .99, 5, h * .14);
      g.fillStyle = '#ffd98a'; for (let yy = tb - h * .6; yy < tb - 6; yy += 7) for (let xx = tx - 22; xx < tx + 22; xx += 6) if (r() < .5) g.fillRect(xx, yy, 2.4, 3.4);
      g.globalCompositeOperation = 'lighter'; glow(g, tx, tb - h * .8, 70, '80,160,255', .5); glow(g, tx - 110, y0 + h * .3, 44, '255,170,80', .5); g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#f2a54a'; g.beginPath(); g.ellipse(tx - 110, y0 + h * .3, 15, 17, -.5, 0, TAU); g.fill(); g.fillStyle = 'rgba(180,90,30,.4)'; ell(g, tx - 106, y0 + h * .32, 6, 8); g.fill();
    } else {
      g.fillStyle = '#efe9da'; g.fillRect(x0, y0, x1 - x0, h); g.strokeStyle = 'rgba(150,140,120,.3)'; g.lineWidth = 1; g.beginPath(); for (let x = x0; x <= x1; x += 22) { g.moveTo(x, y0); g.lineTo(x, y0 + h); } for (let yy = y0 + 12; yy < y0 + h; yy += 14) { g.moveTo(x0, yy); g.lineTo(x1, yy); } g.stroke();
      g.fillStyle = s.col; g.fillRect(x0, y0 + 14, x1 - x0, 34); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x0, y0 + 14, x1 - x0, 3); g.fillRect(x0, y0 + 45, x1 - x0, 3);
      g.fillStyle = '#fbf6ea'; g.font = `800 19px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; for (const o of [-420, 0, 420]) g.fillText(s.name.toUpperCase(), c + o, y0 + 32);
      g.fillStyle = '#f2cf2c'; g.fillRect(x0, y0 + h - 10, x1 - x0, 10); g.fillStyle = '#3d5a4c'; for (const o of [-330, 330]) { g.fillRect(c + o - 9, y0, 18, h); g.fillStyle = '#4f7462'; g.fillRect(c + o - 9, y0, 5, h); g.fillStyle = '#3d5a4c'; }
    }
    /* the poster: the real photo, framed on the wall */
    const im = img[s.id], ar = im.ok ? im.width / im.height : .75, ph = Math.min(h - 96, 190), pw = Math.min(ph * ar, L.wide ? 250 : 150), ph2 = pw / ar, px = c - pw / 2, py = y0 + 60 + (h - 78 - ph2) / 2;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(px - 5, py - 3, pw + 14, ph2 + 14); g.fillStyle = '#17161a'; g.fillRect(px - 8, py - 8, pw + 16, ph2 + 16); g.fillStyle = '#fbf6ea'; g.fillRect(px - 5, py - 5, pw + 10, ph2 + 10);
    if (im.ok) g.drawImage(im, px, py, pw, ph2); else { g.fillStyle = s.col; g.fillRect(px, py, pw, ph2); }
    if (i === C.at && !C.move) poster = { x: px - 8, y: py - 8, w: pw + 16, h: ph2 + 16 };
  }
}
function seated(g, x, who, t, mv) {
  const seat = L.seat, j = who === 'j', top = j ? '#22222a' : '#e9e2d0', jeans = j ? '#27375c' : '#4a6a9c', flr = seat + 92, z = L.wide ? 1.3 : 1.12;
  g.save(); g.translate(x, seat); g.scale(z, z); g.translate(-x, -seat);
  g.fillStyle = jeans; rr(g, x - 26, seat - 18, 52, 26, 12); g.fill(); rr(g, x - 24, seat - 2, 19, flr - seat - 4, 8); g.fill(); rr(g, x + 5, seat - 2, 19, flr - seat - 4, 8); g.fill();
  g.fillStyle = j ? '#8a7a5c' : '#f4f0e6'; rr(g, x - 28, flr - 12, 25, 13, 6); g.fill(); rr(g, x + 3, flr - 12, 25, 13, 6); g.fill();
  g.fillStyle = top; rr(g, x - 24, seat - 78, 48, 70, 16); g.fill(); g.fillStyle = G.people[who].skin; g.fillRect(x - 6, seat - 88, 12, 14);
  if (!j) { g.fillStyle = '#1c1a1e'; rr(g, x - 20, seat - 44, 40, 32, 9); g.fill(); g.strokeStyle = '#1c1a1e'; g.lineWidth = 3; g.beginPath(); g.arc(x, seat - 44, 13, Math.PI, 0); g.stroke(); } else { g.fillStyle = '#17161a'; rr(g, x - 22, seat - 34, 44, 20, 9); g.fill(); }
  g.save(); g.translate(x, seat - 114 + Math.sin(t * (j ? 9 : 2) + (j ? 0 : 1)) * (j ? 1.6 : .6) * (G.RM ? 0 : 1)); if (j) g.scale(-1, 1); G.head(g, who, { r: 25, len: 62, expr: j ? 'joy' : 'smile', blink: !G.RM && ((t + (j ? 0 : 1.7)) % 3.6) < .12, flow: 0, t: t + mv }); g.restore();
  g.restore();
}
function update(dt) {
  const t = G.time, m = C.move;
  if (m) { m.u = Math.min(1, m.u + dt / 3.2); const e = m.u * m.u * (3 - 2 * m.u); C.pos = lerp(m.from, m.to, e); C.speed = Math.sin(m.u * Math.PI); if (!G.RM && Math.random() < dt * 14 * C.speed) tone(70 + Math.random() * 40, .08, 'triangle', .03);
    if (m.u >= 1) { C.at = m.to; C.pos = m.to; C.move = null; C.speed = 0; setStep(); tone(659, .22, 'sine', .07); tone(523, .4, 'sine', .07, .22); } }
  moth.x = lerp(moth.x, L.px - 150 + Math.sin(t * .8) * 12, 1 - Math.exp(-dt * 2)); moth.y = lerp(moth.y, L.wy1 + 30 + Math.sin(t * 2.1) * 8, 1 - Math.exp(-dt * 2));
}
function frame(dt) {
  if (!L) return; update(dt);
  const t = G.time, g = cx, k = S * G.DPR, sh = G.RM ? 0 : Math.sin(t * 31) * 1.2 * C.speed, y0 = L.wy0, y1 = L.wy1;
  g.setTransform(k, 0, 0, k, 0, sh * k); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  /* the car: steel walls, the long window, the bench */
  let gr = g.createLinearGradient(0, 0, 0, VH); gr.addColorStop(0, '#c9ccd2'); gr.addColorStop(.5, '#b4b8c0'); gr.addColorStop(1, '#9a9ea8'); g.fillStyle = gr; g.fillRect(0, -4, VW, VH + 8);
  g.save(); g.beginPath(); g.rect(0, y0, VW, L.wh); g.clip(); outside(g, t); g.fillStyle = 'rgba(255,255,255,.05)'; g.beginPath(); g.moveTo(VW * .1, y0); g.lineTo(VW * .22, y0); g.lineTo(VW * .1, y1); g.lineTo(-VW * .02, y1); g.fill(); g.restore();
  g.fillStyle = '#8f949c'; g.fillRect(0, y0 - 8, VW, 8); g.fillRect(0, y1, VW, 8); for (let x = VW / 2 % 380 - 380; x < VW + 20; x += 380) { if (Math.abs(x - L.px) < 150) continue; g.fillStyle = '#a9aeb6'; g.fillRect(x - 13, y0, 26, L.wh); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x - 13, y0, 4, L.wh); }
  g.fillStyle = 'rgba(60,64,74,.25)'; g.fillRect(0, y1 + 8, VW, 4);
  /* route map and the sign */
  const m = C.move, cur = ST[C.at], led = m ? `NEXT STOP: ${ST[m.to].name.toUpperCase()}` : `THIS IS: ${cur.name.toUpperCase()}`;
  g.font = `800 12px ${UI}`; const lw = Math.min(VW - 24, g.measureText(led).width + 34); g.fillStyle = '#17161a'; rr(g, VW / 2 - lw / 2, L.ty, lw, 26, 6); g.fill(); g.fillStyle = '#ffb53c'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(led, VW / 2, L.ty + 13.5);
  const mw = Math.min(560, VW / 2 - 60), mx0 = L.wide ? VW / 2 - mw : 30, mx1 = L.wide ? VW / 2 + mw : VW - 30, my = L.ty + 46; g.strokeStyle = '#fbf6ea'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(mx0, my); g.lineTo(mx1, my); g.stroke(); g.strokeStyle = '#d8262c'; g.lineWidth = 5; g.beginPath(); g.moveTo(mx0, my); g.lineTo(lerp(mx0, mx1, C.pos / (ST.length - 1)), my); g.stroke();
  ST.forEach((s, i) => { const x = lerp(mx0, mx1, i / (ST.length - 1)), on = i === C.at && !m; g.fillStyle = seen.has(s.id) ? '#d8262c' : '#fbf6ea'; g.beginPath(); g.arc(x, my, on ? 8 : 5.5, 0, TAU); g.fill(); g.strokeStyle = '#17161a'; g.lineWidth = 1.6; g.stroke(); if (L.wide) { g.fillStyle = '#2c2a3d'; g.font = `${on ? 800 : 600} 9.5px ${UI}`; g.fillText(s.name, x, my + 16); } });
  /* bench, the two of them, the floor */
  const seat = L.seat; g.fillStyle = '#8f949c'; g.fillRect(0, seat + 16, VW, 12); gr = g.createLinearGradient(0, seat - 40, 0, seat + 20); gr.addColorStop(0, '#f08a2c'); gr.addColorStop(1, '#d86a1c'); g.fillStyle = gr; rr(g, -10, seat - 44, VW + 20, 62, 10); g.fill(); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(0, seat - 44, VW, 4); g.fillStyle = '#f2b02c'; for (let x = VW / 2 % 150 - 150; x < VW; x += 150) g.fillRect(x, seat - 44, 3, 62);
  g.fillStyle = '#3a3c44'; g.fillRect(0, seat + 28, VW, 66); g.fillStyle = '#26272e'; g.fillRect(0, seat + 92, VW, VH - seat); const r = R(13); for (let i = 0; i < VW * .25; i++) { g.fillStyle = `rgba(255,255,255,${.05 + r() * .12})`; g.fillRect(r() * VW, seat + 94 + r() * (VH - seat - 94), 1.6, 1.6); }
  seated(g, L.gx, 'f', t, 0); seated(g, L.gx + (L.wide ? 108 : 92), 'j', t, 1.3);
  /* a pole in the foreground */
  const px = L.wide ? L.gx + 250 : 14; gr = g.createLinearGradient(px - 7, 0, px + 7, 0); gr.addColorStop(0, '#f4f6f8'); gr.addColorStop(.5, '#b4bac4'); gr.addColorStop(1, '#7d838e'); g.fillStyle = gr; g.fillRect(px - 7, -4, 14, VH + 8);
  if (poster) { const pu = .5 + .5 * Math.sin(t * 5); g.strokeStyle = `rgba(255,240,190,${.55 + .4 * pu})`; g.lineWidth = 3; rr(g, poster.x - 5 - pu * 3, poster.y - 5 - pu * 3, poster.w + 10 + pu * 6, poster.h + 10 + pu * 6, 6); g.stroke(); }
  g.globalCompositeOperation = 'lighter'; glow(g, moth.x, moth.y, 46, '255,214,130', .34 + .08 * Math.sin(t * 6)); g.globalCompositeOperation = 'source-over';
  { const f = G.RM ? .6 : Math.abs(Math.sin(t * 17)); g.fillStyle = 'rgba(255,246,214,.94)'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(moth.x + d * (2 + 4.5 * f), moth.y - 2, 1.6 + 5 * f, 5.4, d * .5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(moth.x + d * (1.5 + 3 * f), moth.y + 4, 1.2 + 3 * f, 3.4, d * -.4, 0, TAU); g.fill(); } g.fillStyle = '#ffd874'; ell(g, moth.x, moth.y, 2.2, 4.6); g.fill(); }
  G.paper(g, .36);
}

const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
const busy = () => !active || !$('sview').hidden || !$('send').hidden;
cv.addEventListener('pointerdown', e => { if (busy() || !poster) return; const [x, y] = pt(e); if (x > poster.x - 14 && x < poster.x + poster.w + 14 && y > poster.y - 14 && y < poster.y + poster.h + 14) look(); });
addEventListener('keydown', e => {
  if (!active || e.metaKey || e.ctrlKey) return;
  if (!$('sview').hidden) { if (e.key === 'Escape') closeView(); else if (e.key === 'ArrowRight' && view.i < view.st.items.length - 1) { view.i++; show(); } else if (e.key === 'ArrowLeft' && view.i > 0) { view.i--; show(); } return; }
  if (busy() || (e.target && e.target.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter'))) return;
  if (e.key === 'ArrowRight') ride(C.at + 1); else if (e.key === 'ArrowLeft') ride(C.at - 1); else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); look(); }
});
const soundLabel = () => { $('ssound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('ssound').setAttribute('aria-pressed', G.sound); };
$('ssound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
$('sleave').addEventListener('click', () => G.go('map'));
$('sprev').addEventListener('click', () => ride(C.at - 1)); $('snext').addEventListener('click', () => ride(C.at + 1)); $('slook').addEventListener('click', look);
$('sp').addEventListener('click', () => { if (view && view.i > 0) { view.i--; show(); } }); $('sn').addEventListener('click', () => { if (view && view.i < view.st.items.length - 1) { view.i++; show(); } });
$('sclose').addEventListener('click', closeView); $('sview').addEventListener('click', e => { if (e.target === $('sview')) closeView(); });
$('sstay').addEventListener('click', () => { $('send').hidden = true; }); $('sback').addEventListener('click', () => { $('send').hidden = true; G.go('map'); });

G.scenes.city = {
  frame, resize: layout,
  enter() { active = true; $('sui').hidden = false; layout(); setStep(); soundLabel(); moth.x = L.px - 150; moth.y = L.wy1 + 30; if (document.fonts && document.fonts.load) { document.fonts.load('800 19px Nunito'); document.fonts.load('600 10px Nunito'); } },
  leave() { active = false; if (!$('sview').hidden) closeView(); $('send').hidden = true; $('sui').hidden = true; },
  debug: { C, ST, seen, ride, look, get poster() { return poster; }, get S() { return S; } }
};
})();
