/* The blossom garden. A cherry tree in full bloom by the lake; five blossoms each hold a memory from the park.
   When every one has been opened, evening falls, the lanterns light, and the garden wall says what it has to say. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, wrap, TAU, R, dab, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif';
const BLOOMS = [
  { id: 'dusk', media: 'photo', title: 'Blossoms at dusk', text: 'Pink branches against a blue evening, and you underneath them.' },
  { id: 'pink', media: 'photo', title: 'Under the pink tree', text: 'Eyes closed, hair flying, nose in a blossom.' },
  { id: 'white', media: 'photo', title: 'White blossom', text: 'Sitting on the rock under a whole tree of white.' },
  { id: 'park', media: 'clip', title: 'The park in bloom', text: 'The whole park had the same idea we did.' },
  { id: 'lake', media: 'clip', title: 'The lake', text: 'Still water, a tower behind the trees, and the birds on their branch.' }
];
const SPOTS = [[-.55, -.3], [0, -.62], [.55, -.28], [-.3, .34], [.42, .38]];
const BRANCH = [[-.7, -.05], [-.45, -.5], [-.15, -.72], [.2, -.6], [.5, -.35], [.75, 0], [.45, .3], [.1, .1], [-.25, -.15], [-.55, .35], [-.1, .5], [.25, .62], [-.82, .4]];
let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false, view = null, endShown = false, finT = 0;
const open = new Set(), parts = [], moth = { x: 0, y: 0 }; let fin = 0;
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };
const PINK = ['#f6b0c8', '#f08fb0', '#fbd0dc', '#e8709c', '#fde4ea'];

function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S; const wide = VW >= 760, cxm = VW / 2, gy = VH - (wide ? 110 : 120);
  const c = wide ? { x: cxm - 170, y: 250, rx: 340, ry: 180 } : { x: VW * .45, y: 300, rx: 185, ry: 170 };
  const wall = wide ? { x: cxm + 210, y: gy - 300, w: 360, h: 300 } : { x: VW - 205, y: gy - 300, w: 197, h: 300 };
  L = { wide, cxm, gy, c, wall, tx: wide ? c.x : VW * .3, spots: SPOTS.map(([u, v]) => [c.x + u * c.rx, c.y + v * c.ry]), branches: BRANCH.map(([u, v]) => [c.x + u * c.rx, c.y + v * c.ry]) };
  const key = `${Math.round(VW)}x${Math.round(VH)}`; if (!SPR || SPR.key !== key) SPR = { key, bg: G.spr(VW, VH, drawScene, clamp(S * G.DPR, 1, 2.5)) };
  $('gui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function drawScene(g, w, h) {
  const r = R(404), gy = L.gy, c = L.c, W = L.wall, hz = gy - 96;
  let gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, '#8fc8ee'); gr.addColorStop(1, '#e6f3f4'); g.fillStyle = gr; g.fillRect(0, 0, w, hz + 1);
  g.fillStyle = 'rgba(255,255,255,.85)'; for (const [x, y, s] of [[.12, .2, 46], [.2, .24, 30], [.7, .12, 54], [.8, .17, 34], [.5, .3, 26]]) { ell(g, w * x, hz * y + 60, s, s * .4); g.fill(); }
  /* the skyline across the lake, with the two towers */
  for (let x = -10; x < w; x += 16 + r() * 26) { const bw = 14 + r() * 26, bh = 20 + r() * r() * 80; g.fillStyle = r() < .5 ? '#a9bcd4' : '#b9c8dc'; g.fillRect(x, hz - bh, bw, bh); }
  for (const tx of [w * .28, w * .28 + 34]) { g.fillStyle = '#9fb0cc'; g.fillRect(tx, hz - 150, 20, 150); g.fillRect(tx + 6, hz - 172, 8, 24); }
  for (let i = 0; i < w * .14; i++) dab(g, r() * w, hz - r() * 16, 16 + r() * 14, 10 + r() * 8, 0, ['#7fb06a', '#9cc47a', '#f4c0d0', '#fdfbf4'][r() * 4 | 0], .9); g.globalAlpha = 1;
  gr = g.createLinearGradient(0, hz, 0, gy - 34); gr.addColorStop(0, '#9fc4d8'); gr.addColorStop(1, '#6f9fc0'); g.fillStyle = gr; g.fillRect(0, hz, w, 64);
  g.fillStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < 40; i++) g.fillRect(r() * w, hz + 4 + r() * 54, 8 + r() * 22, 1.3);
  gr = g.createLinearGradient(0, gy - 40, 0, h); gr.addColorStop(0, '#9cc46a'); gr.addColorStop(1, '#5f9a48'); g.fillStyle = gr; g.fillRect(0, gy - 40, w, h - gy + 40);
  for (let i = 0; i < w * .7; i++) dab(g, r() * w, gy - 36 + r() * (h - gy + 36), 8 + r() * 16, 3 + r() * 4, 0, r() < .5 ? '#b0d27a' : '#4f8a40', .4);
  for (let i = 0; i < 160; i++) dab(g, c.x + (r() - .5) * c.rx * 2.2, gy - 20 + r() * (h - gy + 10), 3.4, 2, r() * 3, PINK[r() * 5 | 0], .9); g.globalAlpha = 1;
  /* the white brick wall */
  g.fillStyle = 'rgba(40,60,30,.25)'; g.fillRect(W.x + 5, W.y + 6, W.w, W.h); g.fillStyle = '#fbf8f0'; g.fillRect(W.x, W.y, W.w, W.h);
  g.strokeStyle = 'rgba(120,110,100,.28)'; g.lineWidth = 1; for (let row = 0; row * 18 < W.h; row++) { const y = W.y + row * 18; g.beginPath(); g.moveTo(W.x, y); g.lineTo(W.x + W.w, y); g.stroke(); for (let x = W.x + (row % 2) * 22; x < W.x + W.w; x += 44) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, Math.min(y + 18, W.y + W.h)); g.stroke(); } }
  g.fillStyle = '#e6dfd0'; g.fillRect(W.x - 4, W.y - 8, W.w + 8, 10);
  /* trunk, branches, and a cloud of blossom */
  const tx = L.tx; g.lineCap = 'round'; g.strokeStyle = '#5a3c30'; g.lineWidth = 34; g.beginPath(); g.moveTo(tx, gy + 6); g.quadraticCurveTo(tx - 8, gy - 110, tx + (c.x - tx) * .5, c.y + c.ry * .5); g.stroke();
  g.strokeStyle = 'rgba(255,220,200,.18)'; g.lineWidth = 6; g.beginPath(); g.moveTo(tx - 9, gy); g.quadraticCurveTo(tx - 16, gy - 110, tx + (c.x - tx) * .5 - 8, c.y + c.ry * .5); g.stroke();
  const bx = tx + (c.x - tx) * .5, by = c.y + c.ry * .5; for (const [x, y] of L.branches) { g.strokeStyle = '#5a3c30'; g.lineWidth = 5 + r() * 5; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(lerp(bx, x, .5) + (r() - .5) * 60, lerp(by, y, .5) - 30, x, y); g.stroke(); }
  for (let i = 0; i < c.rx * c.ry / 34; i++) { const a = r() * TAU, d = Math.sqrt(r()); dab(g, c.x + Math.cos(a) * d * c.rx * 1.04, c.y + Math.sin(a) * d * c.ry * 1.04, 9 + r() * 12, 7 + r() * 9, r() * 3, PINK[r() * 5 | 0], .78); } g.globalAlpha = 1;
}
function flower(g, x, y, s, t, on, i) {
  const pu = on ? 0 : .5 + .5 * Math.sin(t * 3 + i * 1.7);
  if (!on) { g.globalCompositeOperation = 'lighter'; glow(g, x, y, 34 + pu * 8, '255,244,210', .5 + .3 * pu); g.globalCompositeOperation = 'source-over'; }
  g.save(); g.translate(x, y); g.rotate(i + Math.sin(t * .8 + i) * .08 * (G.RM ? 0 : 1)); g.scale(s * (on ? 1.15 : 1 + .06 * pu), s * (on ? 1.15 : 1 + .06 * pu));
  for (let p = 0; p < 5; p++) { g.save(); g.rotate(p * TAU / 5); g.fillStyle = on ? '#e8709c' : '#fde4ea'; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-9, -8, -8, -20, 0, -19); g.bezierCurveTo(8, -20, 9, -8, 0, 0); g.fill(); g.fillStyle = on ? '#f6a0c0' : '#fbd0dc'; g.beginPath(); g.ellipse(0, -11, 3.4, 6, 0, 0, TAU); g.fill(); g.restore(); }
  g.fillStyle = on ? '#f2cf62' : '#f6b02c'; g.beginPath(); g.arc(0, 0, 4.4, 0, TAU); g.fill(); g.fillStyle = '#c8402c'; for (let p = 0; p < 6; p++) g.fillRect(Math.cos(p) * 6 - .6, Math.sin(p) * 6 - .6, 1.4, 1.4);
  g.restore();
}
function setStep() {
  const left = BLOOMS.length - open.size; $('gstep').textContent = left > 0 ? `Tap a glowing blossom to open a memory. ${left} left.` : 'Evening in the garden.';
  $('gcount').textContent = `Blossoms ${open.size} of ${BLOOMS.length}`;
}
const vid = $('gvid'), pic = $('gimg');
function show(it, no) {
  view = it; const photo = it.media === 'photo'; $('gno').textContent = no; $('gtitle').textContent = it.title; $('gtext').textContent = it.text; vid.hidden = photo; pic.hidden = !photo;
  if (photo) { pic.alt = it.title; pic.src = `media/gd_${it.id}.jpg`; } else { vid.muted = !G.sound; vid.loop = true; vid.poster = `media/gd_${it.id}.jpg`; vid.src = `media/gd_${it.id}.mp4`; const p = vid.play(); if (p && p.catch) p.catch(() => { /* she can press play herself */ }); }
  $('gview').hidden = false; $('gclose').focus();
}
function pick(i) {
  const [x, y] = L.spots[i]; if (!G.RM) for (let k = 0; k < 16; k++) { const a = Math.random() * TAU, v = 30 + Math.random() * 90; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: 1.2, c: PINK[k % 5], r: Math.random() * 6 }); }
  open.add(i); tone(784 + i * 30, .16, 'sine', .06); tone(1175 + i * 30, .3, 'sine', .04, .08); show(BLOOMS[i], `Blossom ${open.size} of ${BLOOMS.length}`); setStep();
}
function closeView() {
  vid.pause(); vid.removeAttribute('src'); vid.load(); pic.removeAttribute('src'); $('gview').hidden = true; view = null;
}
function frame(dt) {
  if (!L || !SPR) return; const t = G.time, g = cx, c = L.c, W = L.wall, gy = L.gy, all = open.size === BLOOMS.length;
  if (all && $('gview').hidden && fin < 1) { fin = Math.min(1, fin + dt / 3.4); if (fin >= 1) { setStep(); tone(523, .6, 'sine', .05); tone(784, .8, 'sine', .04, .2); } }
  if (fin >= 1 && !endShown && active) { finT += dt; if (finT > 3) { endShown = true; $('gend').hidden = false; $('gstay').focus(); [523, 659, 784, 1047].forEach((f, i) => tone(f, .9, 'sine', .05, i * .22)); } }
  g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.drawImage(SPR.bg, 0, 0, VW, VH);
  /* the two of them, by the wall */
  const wc = W.x + W.w / 2, sc = L.wide ? 1.35 : 1.1, sp = L.wide ? 52 : 40;
  G.figure(g, wc - sp, gy + 12, 'j', { dir: 1, outfit: 'coat', sc, expr: fin >= 1 ? 'joy' : 'smile' }); G.figure(g, wc + sp, gy + 12, 'f', { dir: -1, outfit: 'coat', sc, expr: fin > .5 ? 'joy' : 'smile' });
  /* blossoms, falling petals */
  L.spots.forEach(([x, y], i) => flower(g, x, y, L.wide ? 1.5 : 1.3, t, open.has(i), i));
  if (!G.RM) { const pr = R(8); for (let i = 0; i < 34; i++) { const x = wrap(pr() * (VW + 100) + Math.sin(t * .7 + i) * 30 + t * 8, VW + 100) - 50, y = wrap(pr() * VH + t * (22 + pr() * 26), VH + 40) - 20; g.save(); g.translate(x, y); g.rotate(t * (1 + pr()) + i); g.fillStyle = PINK[i % 5]; g.globalAlpha = .9; g.beginPath(); g.ellipse(0, 0, 4.4, 2.4, 0, 0, TAU); g.fill(); g.restore(); } }
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; p.vy += 120 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 5; if (p.life <= 0) { parts.splice(i, 1); continue; } g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = Math.min(1, p.life * 1.6); g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, 5, 2.6, 0, 0, TAU); g.fill(); g.restore(); }
  g.globalAlpha = 1;
  /* evening, the lanterns, and the wall */
  if (fin > 0) {
    g.fillStyle = `rgba(30,34,84,${.36 * fin})`; g.fillRect(0, 0, VW, VH);
    const x0 = c.x + c.rx * .7, y0 = c.y + c.ry * .3, x1 = W.x + W.w, y1 = W.y - 12; g.strokeStyle = `rgba(30,24,30,${.7 * fin})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 40, x1, y1); g.stroke();
    g.globalCompositeOperation = 'lighter'; for (let i = 1; i < 10; i++) { const u = i / 10, x = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * (x0 + x1) / 2 + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * (Math.max(y0, y1) + 40) + u * u * y1, tw = G.RM ? .8 : .7 + .3 * Math.sin(t * 2.4 + i * 1.3); glow(g, x, y + 4, 22, '255,206,120', .8 * fin * tw); g.fillStyle = `rgba(255,244,200,${fin})`; g.fillRect(x - 1.6, y + 2, 3.2, 3.2); }
    glow(g, wc, W.y + 70, W.w * .7, '255,226,170', .3 * fin); g.globalCompositeOperation = 'source-over';
    const lines = L.wide ? ["YOU'VE GOT", 'A FRIEND'] : ["YOU'VE", 'GOT A', 'FRIEND'], fs = L.wide ? 38 : 28, total = lines.join('').length; let shown = Math.floor(sm(fin, .15, 1) * (total + 1));
    g.font = `800 ${fs}px ${UI}`; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#1c1a1e';
    lines.forEach((ln, k) => { let w = 0; for (const ch of ln) w += g.measureText(ch).width + 2; let lx = wc - w / 2; for (const ch of ln) { if (shown-- > 0) g.fillText(ch, lx, W.y + 44 + k * (fs + 8)); lx += g.measureText(ch).width + 2; } });
  }
  moth.x = lerp(moth.x, c.x + c.rx * .9 + Math.sin(t * .8) * 14, 1 - Math.exp(-dt * 2)); moth.y = lerp(moth.y, c.y + c.ry + 20 + Math.sin(t * 2.1) * 10, 1 - Math.exp(-dt * 2));
  g.globalCompositeOperation = 'lighter'; glow(g, moth.x, moth.y, 46, '255,214,130', .3 + .2 * fin + .08 * Math.sin(t * 6)); g.globalCompositeOperation = 'source-over';
  { const f = G.RM ? .6 : Math.abs(Math.sin(t * 17)); g.fillStyle = 'rgba(255,246,214,.94)'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(moth.x + d * (2 + 4.5 * f), moth.y - 2, 1.6 + 5 * f, 5.4, d * .5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(moth.x + d * (1.5 + 3 * f), moth.y + 4, 1.2 + 3 * f, 3.4, d * -.4, 0, TAU); g.fill(); } g.fillStyle = '#ffd874'; ell(g, moth.x, moth.y, 2.2, 4.6); g.fill(); }
  G.paper(g, .3 + .1 * fin);
}
const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
const busy = () => !active || !$('gview').hidden || !$('gend').hidden;
cv.addEventListener('pointerdown', e => {
  if (busy()) return; const [x, y] = pt(e); let best = -1, bd = 34; L.spots.forEach(([sx, sy], i) => { const d = Math.hypot(x - sx, y - sy); if (d < bd) { bd = d; best = i; } });
  if (best >= 0) { if (open.has(best)) show(BLOOMS[best], 'Blossom, again'); else pick(best); }
});
addEventListener('keydown', e => {
  if (!active || e.metaKey || e.ctrlKey) return; if (!$('gview').hidden) { if (e.key === 'Escape') closeView(); return; }
  if (busy() || (e.target && e.target.tagName === 'BUTTON') || (e.key !== ' ' && e.key !== 'Enter')) return; e.preventDefault();
  const i = BLOOMS.findIndex((_, k) => !open.has(k)); if (i >= 0) pick(i);
});
const soundLabel = () => { $('gsound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('gsound').setAttribute('aria-pressed', G.sound); };
$('gsound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
$('gleave').addEventListener('click', () => G.go('road', { atDoor: true }));
$('gclose').addEventListener('click', closeView); $('gview').addEventListener('click', e => { if (e.target === $('gview')) closeView(); });
$('gstay').addEventListener('click', () => { $('gend').hidden = true; }); $('gback').addEventListener('click', () => { $('gend').hidden = true; G.go('road', { atDoor: true }); });
vid.addEventListener('error', () => { if (!$('gview').hidden && vid.getAttribute('src')) $('gtext').textContent += ' (This clip is not loaded here.)'; });

G.scenes.garden = {
  frame, resize: layout,
  enter() { active = true; $('gui').hidden = false; layout(); setStep(); soundLabel(); moth.x = L.c.x; moth.y = L.c.y + L.c.ry; if (document.fonts && document.fonts.load) document.fonts.load('800 38px Nunito'); },
  leave() { active = false; if (!$('gview').hidden) { vid.pause(); $('gview').hidden = true; view = null; } $('gend').hidden = true; $('gui').hidden = true; },
  debug: { open, get fin() { return fin; }, get L() { return L; }, get S() { return S; } }
};
})();
