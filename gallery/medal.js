/* The medal room. Three framed clips from the first 5K play on the wall. Lace up, run the course together,
   jump the cones, cross under the arch, and the medal goes on its hook. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, hex, mix, rgb, wrap, TAU, R, dab, foliage, PAL, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif';
const INK = '#2c2a3d', PAPER = '#fbf3df';
const ITEMS = [
  { id: 'finish', kind: 'clip', label: 'The finish', title: 'Coming up to the finish', tall: true },
  { id: 'medal', kind: 'clip', label: 'Medal on', title: 'Medal on', tall: true },
  { id: 'us', kind: 'clip', label: 'Medals up', title: 'All of us, medals up', tall: false },
  { id: 'train1', kind: 'photo', label: 'Training days', title: 'Training days', tall: true },
  { id: 'train2', kind: 'photo', label: 'The crew', title: 'Training days, the four of us', tall: false }
];
const LOOK = {
  /* Jana ran in plum, bib 1502 */
  j: { jacket: '#5c2a4a', dark: '#44203a', legs: '#4a2040', skin: '#f0c7a6', hair: '#573726', hdark: '#40281b', hi: 'rgba(196,142,88,.9)', lo: 'rgba(58,34,22,.55)', wave: 1, bib: '1502' },
  f: { jacket: '#22222a', dark: '#16161c', legs: '#1c1c22', skin: '#c99a74', hair: '#17141a', hdark: '#0c0a0f', hi: 'rgba(110,102,132,.75)', lo: 'rgba(0,0,0,.4)', wave: .25, bib: '1504' }
};
const TOTAL = 9200, SPEED = 232, FEET = 92;
let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false;
const img = {}; for (const c of ITEMS) { const im = new Image(); im.onload = () => { im.ok = true; }; im.src = `media/${c.id}.jpg`; img[c.id] = im; }
const M = { phase: 'room', earned: false, dist: 0, v: 0, y: 0, vy: 0, fy: 0, fvy: 0, ph: 0, slow: 0, obs: [], ft: 0, mt: 0, cool: 0 };
const parts = [], says = [], moth = { x: 60, y: 200 };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };
const Y = y => VH - y;

/* ------------------------------------------------------------------ layout and sprites */
function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S;
  const wide = VW >= 1180, cxm = VW / 2;
  let frames;
  if (wide) { let x = cxm - 445; frames = [[112, 199], [112, 199], [224, 126], [126, 168], [196, 147]].map(([w, h]) => { const f = { x, y: 250 - h / 2, w, h }; x += w + 30; return f; }); }
  else frames = [{ x: cxm - 172, y: 280, w: 96, h: 171 }, { x: cxm - 54, y: 280, w: 96, h: 171 }, { x: cxm - 62, y: 104, w: 236, h: 133 }, { x: cxm + 64, y: 280, w: 108, h: 144 }, { x: cxm - 180, y: 498, w: 140, h: 105 }];
  L = { wide, cxm, frames, hook: wide ? { x: cxm - 520, y: 150 } : { x: 76, y: 104 }, bib: wide ? { x: cxm + 530, y: 250 } : { x: cxm + 100, y: 562 },
    bench: { x: wide ? cxm : cxm - 40, y: VH - (wide ? 150 : 190) }, floor: VH - (wide ? 96 : 120) };
  const key = `${Math.round(VW)}x${Math.round(VH)}`, q = clamp(S * G.DPR, 1, 2.5);
  if (!SPR || SPR.key !== key) SPR = { key, room: G.spr(VW, VH, drawRoom, q), litter: G.spr(600, 150, drawLitter, q), line: G.spr(600, 190, drawTreeline, q) };
  $('mui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function drawRoom(g, w, h) {
  const r = R(1502), fl = L.floor, wy = fl - (L.wide ? 150 : 168);
  let gr = g.createLinearGradient(0, 0, 0, wy); gr.addColorStop(0, '#ecd2ac'); gr.addColorStop(1, '#f4e2c2'); g.fillStyle = gr; g.fillRect(0, 0, w, wy);
  for (let i = 0; i < w * .7; i++) dab(g, r() * w, r() * wy, 14 + r() * 44, 5 + r() * 12, (r() - .5) * .6, r() < .5 ? '#f9ecd2' : '#dcbb8c', .14);
  g.globalAlpha = 1;
  /* panelled wainscot, skirting, floorboards */
  g.fillStyle = '#5f8a80'; g.fillRect(0, wy, w, fl - wy); for (let i = 0; i < w * .4; i++) dab(g, r() * w, wy + r() * (fl - wy), 12 + r() * 30, 4 + r() * 8, 0, r() < .5 ? '#6f9a90' : '#4f7a70', .2);
  g.globalAlpha = 1; g.fillStyle = '#f3ead4'; g.fillRect(0, wy - 8, w, 10); g.fillStyle = 'rgba(40,60,56,.3)'; g.fillRect(0, wy + 2, w, 3);
  for (let x = (L.cxm % 120) - 120; x < w; x += 120) { g.strokeStyle = 'rgba(30,54,50,.35)'; g.lineWidth = 1.4; rr(g, x + 14, wy + 18, 92, fl - wy - 38, 3); g.stroke(); g.strokeStyle = 'rgba(190,220,210,.25)'; g.beginPath(); g.moveTo(x + 15, wy + fl - wy - 21); g.lineTo(x + 15, wy + 19); g.lineTo(x + 105, wy + 19); g.stroke(); }
  g.fillStyle = '#f3ead4'; g.fillRect(0, fl - 12, w, 12);
  gr = g.createLinearGradient(0, fl, 0, h); gr.addColorStop(0, '#b9834e'); gr.addColorStop(1, '#8f5f36'); g.fillStyle = gr; g.fillRect(0, fl, w, h - fl);
  g.strokeStyle = 'rgba(70,40,16,.35)'; g.lineWidth = 1.2; for (let k = 1; k < 5; k++) { const y = fl + (h - fl) * Math.pow(k / 5, 1.5); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  for (let i = -10; i <= 10; i++) { g.beginPath(); g.moveTo(L.cxm + i * 90, fl); g.lineTo(L.cxm + i * 170, h); g.stroke(); }
  g.fillStyle = 'rgba(50,30,14,.3)'; g.fillRect(0, fl, w, 5);
  /* a rug, the bench, and a plant that has gone autumn */
  const b = L.bench; g.fillStyle = '#b5533c'; ell(g, b.x, fl + (h - fl) * .52, 210, (h - fl) * .34); g.fill(); g.strokeStyle = '#f4d9a0'; g.lineWidth = 3; ell(g, b.x, fl + (h - fl) * .52, 190, (h - fl) * .28); g.stroke();
  g.fillStyle = 'rgba(50,30,14,.3)'; ell(g, b.x, fl + 10, 150, 12); g.fill();
  g.fillStyle = '#6e4628'; for (const dx of [-124, 114]) g.fillRect(b.x + dx, b.y + 10, 10, fl - b.y); g.fillStyle = '#a8774c'; rr(g, b.x - 140, b.y, 280, 16, 5); g.fill(); g.fillStyle = 'rgba(255,230,190,.4)'; g.fillRect(b.x - 136, b.y + 1, 272, 2.4);
  const px = L.wide ? L.cxm - 300 : w - 44; g.fillStyle = '#c0683e'; g.beginPath(); g.moveTo(px - 26, fl - 50); g.lineTo(px + 26, fl - 50); g.lineTo(px + 19, fl + 6); g.lineTo(px - 19, fl + 6); g.fill(); g.fillStyle = '#d98456'; g.fillRect(px - 29, fl - 56, 58, 9);
  g.strokeStyle = '#6a4a32'; g.lineWidth = 3; g.lineCap = 'round'; for (const a of [-.5, -.1, .35]) { g.beginPath(); g.moveTo(px, fl - 54); g.quadraticCurveTo(px + a * 40, fl - 110, px + a * 90, fl - 150); g.stroke(); foliage(g, r, px + a * 90, fl - 158, 30, 24, a < 0 ? PAL.gold : PAL.rust, 44); }
}
function drawLitter(g, w, h) { const r = R(31), cs = ['#d9a53a', '#c66c32', '#e8c860', '#a8582c', '#8f4426', '#e2ae40']; for (let i = 0; i < 520; i++) { const x = r() * w, y = r() * h, s = 2.6 + r() * 3.4; for (const o of [-w, 0, w]) dab(g, x + o, y, s, s * .5, r() * 3, cs[r() * 6 | 0], .9); } g.globalAlpha = 1; }
function drawTreeline(g, w, h) { const r = R(47); for (let i = 0; i < 26; i++) { const x = r() * w, pal = [PAL.gold, PAL.rust, PAL.yg, PAL.gold][r() * 4 | 0]; for (const o of [-w, 0, w]) foliage(g, R(i * 7 + 1), x + o, h - 50 - r() * 60, 60, 50, pal, 60); } g.fillStyle = 'rgba(244,236,216,.45)'; g.fillRect(0, 0, w, h); }

/* ------------------------------------------------------------------ the medal, the bib, the shoes */
function medal(g, x, y, sc, lanyard) {
  g.save(); g.translate(x, y); g.scale(sc, sc);
  if (lanyard) { g.fillStyle = '#e8641c'; g.beginPath(); g.moveTo(-9, -300); g.lineTo(9, -300); g.lineTo(22, -78); g.lineTo(-22, -78); g.fill(); g.fillStyle = '#f08a3c'; g.fillRect(-3, -300, 6, 224); }
  const dia = s => { g.beginPath(); g.moveTo(0, -s); g.lineTo(s, 0); g.lineTo(0, s); g.lineTo(-s, 0); g.closePath(); };
  g.fillStyle = 'rgba(60,30,10,.25)'; g.save(); g.translate(4, 6); dia(84); g.fill(); g.restore();
  const gold = g.createLinearGradient(-80, -80, 80, 80); gold.addColorStop(0, '#f6de8c'); gold.addColorStop(.5, '#d9a93c'); gold.addColorStop(1, '#f2cf62'); g.fillStyle = gold; dia(84); g.fill();
  g.save(); dia(74); g.clip();
  g.fillStyle = '#f08a2c'; g.fillRect(-80, -80, 160, 160); g.fillStyle = '#f6c544'; g.fillRect(-80, 4, 160, 30); g.fillStyle = '#e8641c'; g.fillRect(-80, 34, 160, 60);
  g.fillStyle = '#4a2a1c'; for (const tx of [-58, -40, 44, 60]) { g.fillRect(tx, -30, 4, 70); g.fillRect(tx - 8, -10, 20, 3); g.fillRect(tx - 5, 6, 14, 3); }
  /* the running turkey */
  for (let i = 0; i < 7; i++) { g.save(); g.translate(8, 2); g.rotate(-1.5 + i * .34); g.fillStyle = i % 2 ? '#8a5a3c' : '#b98452'; rr(g, -7, -50, 14, 46, 7); g.fill(); g.fillStyle = '#f4ead6'; rr(g, -7, -50, 14, 9, 5); g.fill(); g.restore(); }
  g.fillStyle = '#7a4a2e'; ell(g, -2, 8, 23, 20); g.fill(); g.fillStyle = '#5e3620'; ell(g, 4, 10, 12, 9); g.fill();
  g.strokeStyle = '#f2cf62'; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-8, 24); g.lineTo(-20, 38); g.moveTo(6, 26); g.lineTo(16, 34); g.stroke(); g.fillStyle = '#d6402b'; ell(g, -24, 40, 8, 4.4); g.fill(); ell(g, 20, 36, 8, 4.4); g.fill();
  g.fillStyle = '#f4ead6'; g.beginPath(); g.moveTo(-14, -2); g.quadraticCurveTo(-26, -20, -22, -34); g.lineTo(-10, -30); g.quadraticCurveTo(-12, -14, -4, -4); g.fill(); g.beginPath(); g.arc(-18, -36, 10, 0, TAU); g.fill();
  g.fillStyle = '#f6c544'; g.beginPath(); g.moveTo(-27, -37); g.lineTo(-38, -32); g.lineTo(-27, -30); g.fill(); g.fillStyle = '#d6402b'; ell(g, -27, -25, 3.4, 6); g.fill(); g.fillStyle = '#2b2024'; g.beginPath(); g.arc(-20, -38, 2, 0, TAU); g.fill();
  g.restore(); g.strokeStyle = '#a8742a'; g.lineWidth = 1.6; dia(74); g.stroke();
  /* ribbon across the bottom */
  g.fillStyle = '#c9501a'; g.beginPath(); g.moveTo(-88, 34); g.lineTo(-74, 50); g.lineTo(-88, 66); g.lineTo(-60, 62); g.lineTo(-60, 38); g.fill(); g.beginPath(); g.moveTo(88, 34); g.lineTo(74, 50); g.lineTo(88, 66); g.lineTo(60, 62); g.lineTo(60, 38); g.fill();
  g.fillStyle = '#e8641c'; g.beginPath(); g.moveTo(-72, 30); g.quadraticCurveTo(0, 14, 72, 30); g.lineTo(72, 64); g.quadraticCurveTo(0, 48, -72, 64); g.closePath(); g.fill(); g.strokeStyle = '#f2cf62'; g.lineWidth = 1.6; g.stroke();
  g.fillStyle = '#fbf3df'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 9px ${UI}`; g.fillText('TRC', 0, 30); g.font = `800 15px ${UI}`; g.fillText('TURKEY TROT', 0, 44);
  g.fillStyle = '#e8641c'; rr(g, -17, 62, 34, 18, 4); g.fill(); g.strokeStyle = '#f2cf62'; g.stroke(); g.fillStyle = '#fbf3df'; g.font = `800 12px ${UI}`; g.fillText('5K', 0, 71.5);
  g.restore();
}
function bib(g, x, y, num, sc = 1) {
  g.save(); g.translate(x, y); g.scale(sc, sc); g.rotate(-.04);
  g.fillStyle = 'rgba(60,30,10,.2)'; rr(g, -57, -38, 120, 84, 5); g.fill(); g.fillStyle = '#fdfbf4'; rr(g, -60, -42, 120, 84, 5); g.fill();
  g.fillStyle = '#17161a'; g.font = `800 40px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(num, 0, -10);
  g.fillStyle = '#4a3a8c'; g.beginPath(); g.roundRect(-60, 18, 120, 24, [0, 0, 5, 5]); g.fill(); g.fillStyle = '#fdfbf4'; g.font = `800 9px ${UI}`; g.fillText('LIVE RESULTS', 0, 30.5);
  g.fillStyle = '#d9a03c'; for (const [px, py] of [[-52, -34], [52, -34]]) { g.beginPath(); g.arc(px, py, 3, 0, TAU); g.fill(); }
  g.restore();
}
function shoe(g, x, y, col) {
  g.fillStyle = '#f4f1e8'; rr(g, x - 30, y - 7, 62, 8, 4); g.fill();
  g.fillStyle = col; g.beginPath(); g.moveTo(x - 28, y - 7); g.quadraticCurveTo(x - 30, y - 30, x - 12, y - 32); g.lineTo(x - 2, y - 24); g.quadraticCurveTo(x + 18, y - 22, x + 30, y - 12); g.lineTo(x + 31, y - 7); g.closePath(); g.fill();
  g.strokeStyle = '#f4f1e8'; g.lineWidth = 1.6; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x - 6 + i * 6, y - 25 + i * 2); g.lineTo(x + i * 6, y - 18 + i * 2); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.25)'; rr(g, x - 24, y - 18, 16, 6, 3); g.fill();
}

/* ------------------------------------------------------------------ the two runners */
function runner(g, x, y, who, ph, air, cheer, sc, medalOn) {
  G.figure(g, x, y, who, { dir: 1, phase: ph, run: true, air, cheer, outfit: 'run', sc: sc * 1.08, medal: medalOn });
}

/* ------------------------------------------------------------------ play */
function say(text, x, y) { says.push({ text, x: clamp(x, 90, VW - 90), y, life: 1.8 }); }
function burst(x, y, n) { if (G.RM) return; const cs = ['#d9a53a', '#c66c32', '#e8c860', '#f2cf62', '#e8641c']; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 60 + Math.random() * 220; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 160, life: 1.4, c: cs[Math.random() * 5 | 0], s: 2.4 + Math.random() * 3, r: Math.random() * 6 }); } }
function setStep() {
  const p = M.phase;
  $('mstep').textContent = p === 'room' ? (M.earned ? 'Tap a frame to open it. Tap the running shoes to run it again.' : 'Tap a frame to open it. Tap the running shoes to run the 5K and bring the medal home.') : p === 'run' ? 'Tap to jump the cones and the leaf piles. Five kilometres, together.' : 'Finished. Together.';
  $('mdist').hidden = p === 'room';
}
function startRun() {
  const r = R((Math.random() * 1e9) | 0); M.obs = []; let x = 760;
  while (x < TOTAL - 520) { M.obs.push({ x, kind: r() < .68 ? 'cone' : 'pile', hit: false }); x += 400 + r() * 300; }
  Object.assign(M, { phase: 'run', dist: 0, v: 0, y: 0, vy: 0, fy: 0, fvy: 0, ph: 0, slow: 0, ft: 0, mt: 0 }); parts.length = says.length = 0; setStep(); tone(660, .1, 'sine', .06); tone(880, .16, 'sine', .06, .12);
}
function jump() { if (M.phase === 'run' && M.y === 0) { M.vy = 540; tone(440, .12, 'sine', .05, 0, 1.5); } }
function update(dt) {
  const t = G.time, p = M.phase, jx = L.jx; M.cool -= dt;
  if (p === 'run' || p === 'finish') {
    const target = p === 'run' ? SPEED * (M.slow > 0 ? .45 : 1) : 0; M.v = lerp(M.v, target, 1 - Math.exp(-dt * (p === 'run' ? 3 : 1.6))); M.slow -= dt;
    M.dist += M.v * dt; M.ph += M.v * dt * .052;
    for (const who of ['', 'f']) { const yk = who + 'y', vk = who ? 'fvy' : 'vy'; if (M[yk] > 0 || M[vk] > 0) { M[vk] -= 1500 * dt; M[yk] = Math.max(0, M[yk] + M[vk] * dt); if (M[yk] === 0) M[vk] = 0; } }
    for (const o of M.obs) {
      const sx = o.x - M.dist + jx, half = o.kind === 'cone' ? 15 : 38, tall = o.kind === 'cone' ? 30 : 16;
      if (!o.fj && sx - (jx - 52) < SPEED * .27 + half && M.fy === 0) { o.fj = true; M.fvy = 540; }
      if (!o.hit && Math.abs(sx - jx) < half + 8 && M.y < tall) { o.hit = true; M.slow = 1; say('Oof.', jx, Y(FEET + 150)); tone(196, .12, 'triangle', .07, 0, .7); burst(sx, Y(FEET + 10), 8); }
    }
    $('mdist').textContent = `${Math.min(5, M.dist / TOTAL * 5).toFixed(1)} km`;
    if (p === 'run' && M.dist >= TOTAL) { M.phase = 'finish'; M.ft = 0; setStep(); burst(jx + 60, Y(FEET + 180), 60); [784, 988, 1175, 1568].forEach((f, i) => tone(f, .5, 'sine', .07, i * .13)); }
    if (p === 'finish') { M.ft += dt; if (M.ft > 2.3) { M.phase = 'medal'; M.mt = 0; tone(1568, .6, 'sine', .08); tone(2349, .5, 'sine', .04, .02); } }
  }
  if (p === 'medal') { M.mt += dt; if (M.mt > 2 && $('mcard').hidden) { $('mcard').hidden = false; $('mhang').focus(); } }
  for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= dt; q.vy += 260 * dt; q.vx *= 1 - dt; q.x += q.vx * dt; q.y += q.vy * dt; q.r += dt * 5; if (q.life <= 0) parts.splice(i, 1); }
  for (let i = says.length - 1; i >= 0; i--) { const q = says[i]; q.life -= dt; q.y -= 14 * dt; if (q.life <= 0) says.splice(i, 1); }
  const mx = p === 'room' ? L.hook.x + 70 + Math.sin(t * .8) * 12 : jx + 70 + Math.sin(t * .9) * 12, my = p === 'room' ? L.hook.y + 30 + Math.sin(t * 2.1) * 10 : Y(FEET + 190) + Math.sin(t * 2.1) * 10;
  moth.x = lerp(moth.x, mx, 1 - Math.exp(-dt * 2.4)); moth.y = lerp(moth.y, my, 1 - Math.exp(-dt * 2.4));
}
function tag(g, text, x, y, a) {
  g.font = `700 14.5px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(text).width + 20; g.globalAlpha = a;
  g.fillStyle = 'rgba(40,22,12,.25)'; rr(g, x - w / 2 + 1.5, y - 10.5, w, 25, 12.5); g.fill(); g.fillStyle = PAPER; rr(g, x - w / 2, y - 12.5, w, 25, 12.5); g.fill(); g.fillStyle = INK; g.fillText(text, x, y + .5); g.globalAlpha = 1;
}
function tile(g, s, yTop, off) { if (!s.pat) s.pat = g.createPattern(s, 'repeat'); const q = s.width / s.uw; g.save(); g.translate(-wrap(off, s.uw), yTop); g.scale(1 / q, 1 / q); g.fillStyle = s.pat; g.fillRect(0, 0, (VW + s.uw) * q, s.height); g.restore(); }
function drawRoomScene(g, t) {
  g.drawImage(SPR.room, 0, 0, VW, VH);
  /* the frames */
  L.frames.forEach((f, i) => {
    const c = ITEMS[i], im = img[c.id];
    g.fillStyle = 'rgba(70,40,14,.28)'; rr(g, f.x - 7, f.y - 5, f.w + 20, f.h + 20, 5); g.fill();
    g.fillStyle = '#6e4628'; rr(g, f.x - 10, f.y - 10, f.w + 20, f.h + 20, 5); g.fill(); g.fillStyle = '#a8774c'; rr(g, f.x - 7, f.y - 7, f.w + 14, f.h + 14, 4); g.fill(); g.fillStyle = '#f6efdc'; g.fillRect(f.x - 3, f.y - 3, f.w + 6, f.h + 6);
    g.save(); g.beginPath(); g.rect(f.x, f.y, f.w, f.h); g.clip();
    if (im.ok) { const s = Math.max(f.w / im.width, f.h / im.height), dw = im.width * s, dh = im.height * s; g.drawImage(im, f.x + (f.w - dw) / 2, f.y + (f.h - dh) / 2, dw, dh); }
    else { const gr = g.createLinearGradient(0, f.y, 0, f.y + f.h); gr.addColorStop(0, '#cfe0ec'); gr.addColorStop(.6, '#e8c860'); gr.addColorStop(1, '#c66c32'); g.fillStyle = gr; g.fillRect(f.x, f.y, f.w, f.h); }
    if (c.kind === 'clip') { g.fillStyle = 'rgba(28,39,72,.16)'; g.fillRect(f.x, f.y, f.w, f.h); } g.restore();
    const px = f.x + f.w / 2, py = f.y + f.h / 2, pu = 1 + .05 * Math.sin(t * 3 + i); if (c.kind === 'clip') { g.fillStyle = 'rgba(251,243,223,.92)'; g.beginPath(); g.arc(px, py, 17 * pu, 0, TAU); g.fill(); g.fillStyle = INK; g.beginPath(); g.moveTo(px - 5, py - 8); g.lineTo(px + 9, py); g.lineTo(px - 5, py + 8); g.fill(); }
    g.font = `700 11.5px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const tw = g.measureText(c.label).width + 14; g.fillStyle = '#d9b25c'; rr(g, px - tw / 2, f.y + f.h + 14, tw, 18, 3); g.fill(); g.fillStyle = '#3a2a1a'; g.fillText(c.label, px, f.y + f.h + 23.5);
  });
  /* the hook, with or without its medal */
  const h = L.hook; g.fillStyle = '#8a6a48'; g.beginPath(); g.arc(h.x, h.y, 5, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(h.x - 1.4, h.y - 1.4, 1.6, 0, TAU); g.fill();
  if (M.earned) { g.save(); g.translate(h.x, h.y); g.rotate(Math.sin(t * 1.4) * .03 * (G.RM ? 0 : 1)); medal(g, 0, 118, .52, true); g.restore(); }
  else { g.setLineDash([5, 5]); g.strokeStyle = 'rgba(110,70,40,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(h.x, h.y + 74); g.lineTo(h.x + 44, h.y + 118); g.lineTo(h.x, h.y + 162); g.lineTo(h.x - 44, h.y + 118); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(h.x, h.y + 6); g.lineTo(h.x, h.y + 74); g.stroke(); g.setLineDash([]); }
  bib(g, L.bib.x, L.bib.y, '1502', L.wide ? 1 : .84);
  const b = L.bench; shoe(g, b.x - 40, b.y, '#5c2a4a'); shoe(g, b.x + 34, b.y, '#22222a');
  const pu = .5 + .5 * Math.sin(t * 5); g.strokeStyle = `rgba(255,250,220,${.5 + .4 * pu})`; g.lineWidth = 3.5; ell(g, b.x, b.y - 14, 92 + pu * 4, 34 + pu * 3); g.stroke();
}
function drawRunScene(g, t) {
  const d = M.dist, jx = L.jx, hy = Y(176);
  let gr = g.createLinearGradient(0, 0, 0, hy); gr.addColorStop(0, '#c4dcec'); gr.addColorStop(1, '#f6eed8'); g.fillStyle = gr; g.fillRect(0, 0, VW, hy + 2);
  const cl = G.SP && G.SP.clouds; if (cl) for (const [i, fx, cy, sc] of [[0, .1, 330, .8], [2, .55, 430, 1], [4, .85, 300, .6]]) { const s = cl[i][0], w = s.uw * sc, span = VW + 700; g.globalAlpha = .8; g.drawImage(s, wrap(fx * span - d * .03 + t * 3, span) - 350, hy - cy, w, s.uh * sc); } g.globalAlpha = 1;
  tile(g, SPR.line, hy - 176, d * .22);
  const sp = G.SP; if (sp) {
    const first = Math.floor((d * .6 - 300) / 250); for (let k = first; k < first + Math.ceil(VW / 250) + 4; k++) { const s = sp.trees[((k * 7) % 6 + 6) % 6], sc = .86 + ((k * 13) % 5) * .06, x = k * 250 - d * .6 + ((k * 37) % 90); g.drawImage(s, x - s.uw * sc / 2, Y(168) - s.uh * sc, s.uw * sc, s.uh * sc); }
    tile(g, sp.vergeFar, Y(176) - 20, d); tile(g, sp.path, Y(138), d);
  } else { g.fillStyle = '#93a04e'; g.fillRect(0, Y(176), VW, 40); g.fillStyle = '#a29aa6'; g.fillRect(0, Y(138), VW, 92); }
  g.globalAlpha = .85; tile(g, SPR.litter, Y(168), d); g.globalAlpha = 1;
  /* kilometre posts, cones along the last stretch, the far leg of the arch */
  g.font = `800 15px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let km = 1; km <= 4; km++) { const x = TOTAL * km / 5 - d + jx; if (x < -60 || x > VW + 60) continue; g.fillStyle = '#6e4628'; g.fillRect(x - 2.5, Y(150 + 86), 5, 86); g.fillStyle = '#fdfbf4'; rr(g, x - 26, Y(150 + 118), 52, 34, 5); g.fill(); g.strokeStyle = '#e8641c'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#e8641c'; g.fillText(km + 'K', x, Y(150 + 100)); }
  const ax = TOTAL - d + jx + 60, cone = (x, y, s) => { g.fillStyle = 'rgba(40,30,30,.25)'; ell(g, x + 2, y + 1, 15 * s, 4 * s); g.fill(); g.fillStyle = '#e8641c'; g.beginPath(); g.moveTo(x - 11 * s, y); g.lineTo(x - 3 * s, y - 30 * s); g.lineTo(x + 3 * s, y - 30 * s); g.lineTo(x + 11 * s, y); g.closePath(); g.fill(); g.fillStyle = '#fdfbf4'; g.fillRect(x - 7 * s, y - 15 * s, 14 * s, 5 * s); g.fillStyle = '#c9501a'; rr(g, x - 14 * s, y - 2 * s, 28 * s, 4 * s, 2); g.fill(); };
  for (let i = 1; i <= 6; i++) { const x = ax - i * 96; if (x > -30 && x < VW + 30) cone(x, Y(142), .8); }
  const leg = (x, y0, w) => { g.fillStyle = 'rgba(40,30,30,.22)'; ell(g, x + 3, Y(y0 - 2), w * .8, 6); g.fill(); const lg = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); lg.addColorStop(0, '#d8ee56'); lg.addColorStop(1, '#9cba1e'); g.fillStyle = lg; rr(g, x - w / 2, Y(y0 + 300), w, 300, w / 2); g.fill(); g.fillStyle = 'rgba(60,80,10,.18)'; for (let k = 0; k < 4; k++) g.fillRect(x - w / 2, Y(y0 + 60 + k * 60), w, 2); g.fillStyle = 'rgba(255,255,255,.3)'; rr(g, x - w / 2 + 5, Y(y0 + 284), 5, 262, 2.5); g.fill(); };
  const beam = () => { const x0 = ax - 40, y0 = Y(34 + 300), x1 = ax + 120, y1 = Y(150 + 300); g.lineCap = 'round'; g.strokeStyle = '#9cba1e'; g.lineWidth = 40; g.beginPath(); g.moveTo(x0, y0 + 18); g.lineTo(x1, y1 + 16); g.stroke(); g.strokeStyle = '#c8e23e'; g.lineWidth = 30; g.beginPath(); g.moveTo(x0, y0 + 14); g.lineTo(x1, y1 + 12); g.stroke(); };
  const arch = ax > -320 && ax < VW + 320;
  if (arch) { leg(ax + 120, 150, 36); beam(); }
  /* things in the way */
  for (const o of M.obs) { const x = o.x - d + jx; if (x < -80 || x > VW + 80) continue; if (o.kind === 'cone') cone(x, Y(FEET - 2), 1); else { const r = R(o.x | 0); g.fillStyle = 'rgba(40,30,30,.2)'; ell(g, x, Y(FEET - 3), 44, 6); g.fill(); for (let i = 0; i < 46; i++) { const a = r() * Math.PI, k = Math.sqrt(r()); dab(g, x + Math.cos(a) * k * 40, Y(FEET - 2) - Math.sin(a) * k * 20, 5 + r() * 4, 2.6 + r() * 2, r() * 3, ['#d9a53a', '#c66c32', '#e8c860', '#a8582c'][r() * 4 | 0], 1); } g.globalAlpha = 1; } }
  /* the two of them */
  const still = M.phase !== 'run' && M.v < 30, fin = M.phase !== 'run', wob = M.slow > 0 ? Math.sin(t * 30) * 3 : 0;
  runner(g, jx - 52, Y(FEET + 14 + M.fy), 'f', M.ph + 1.9, M.fy > 0, still, 1.12, M.phase === 'medal' || (fin && M.ft > 1.5));
  runner(g, jx + wob, Y(FEET + M.y), 'j', M.ph, M.y > 0, still, 1.2, M.phase === 'medal' || (fin && M.ft > 1.5));
  if (sp) tile(g, sp.vergeNear, Y(46) - 22, d + 140); else { g.fillStyle = '#869843'; g.fillRect(0, Y(46), VW, 46); }
  /* the banner under the beam, and the near leg in front of everything */
  if (arch) {
    g.save(); g.translate(ax + 40, Y(34 + 300) - 58 + 62); g.transform(1, -.725, 0, 1, 0, 0);
    g.strokeStyle = '#6e7f1c'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-50, -34); g.lineTo(-50, -46); g.moveTo(50, -34); g.lineTo(50, -46); g.stroke();
    const bg = g.createLinearGradient(0, -34, 0, 34); bg.addColorStop(0, '#5a3020'); bg.addColorStop(1, '#c9501a'); g.fillStyle = bg; rr(g, -56, -34, 112, 68, 3); g.fill();
    g.fillStyle = '#fbf3df'; g.font = `800 17px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TURKEY', 0, -6); g.fillText('TROT', 0, 12); g.font = `800 6.5px ${UI}`; g.fillText('THE RIVERSIDE CHURCH', 0, -24); g.fillStyle = '#f2cf62'; g.font = `800 8px ${UI}`; g.fillText('5K  ·  FINISH', 0, 27); g.restore();
    leg(ax - 40, 34, 44);
  }
  if (!G.RM) { const lr = R(5); for (let i = 0; i < 18; i++) { const lw = VW + 120, lh = VH, x = wrap(lr() * lw - d * 1.1 - t * 30, lw) - 60, y = wrap(lr() * lh + t * (26 + lr() * 30), lh), s = 2.4 + lr() * 2.4; g.save(); g.translate(x + Math.sin(t * 1.4 + i) * 14, y); g.rotate(t * 2 + i); g.fillStyle = ['#e2ae40', '#cf7436', '#f0d066', '#b9602e'][i % 4]; ell(g, 0, 0, s, s * .45); g.fill(); g.restore(); } }
  if (M.phase === 'medal') { const k = sm(M.mt, 0, 1.1); g.fillStyle = `rgba(28,39,72,${.45 * k})`; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'lighter'; const my = Math.max(150, VH * .27); glow(g, VW / 2, my, 240 * k, '255,220,140', .4 * k); g.globalCompositeOperation = 'source-over'; g.save(); g.translate(VW / 2, my); g.rotate(Math.sin(t * 1.6) * .05); medal(g, 0, 0, lerp(.1, 1.1, k), false); g.restore(); }
}
function frame(dt) {
  if (!L || !SPR) return;
  L.jx = Math.min(VW * .34, 260); update(dt);
  const t = G.time, g = cx; g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  if (M.phase === 'room') drawRoomScene(g, t); else drawRunScene(g, t);
  for (const q of parts) { g.save(); g.translate(q.x, q.y); g.rotate(q.r); g.globalAlpha = Math.min(1, q.life * 1.6); g.fillStyle = q.c; ell(g, 0, 0, q.s, q.s * .5); g.fill(); g.restore(); } g.globalAlpha = 1;
  for (const s of says) tag(g, s.text, s.x, s.y, Math.min(1, s.life * 2));
  g.globalCompositeOperation = 'lighter'; glow(g, moth.x, moth.y, 46, '255,214,130', .34 + .08 * Math.sin(t * 6)); g.globalCompositeOperation = 'source-over';
  { const f = G.RM ? .6 : Math.abs(Math.sin(t * 17)); g.fillStyle = 'rgba(255,246,214,.94)'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(moth.x + d * (2 + 4.5 * f), moth.y - 2, 1.6 + 5 * f, 5.4, d * .5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(moth.x + d * (1.5 + 3 * f), moth.y + 4, 1.2 + 3 * f, 3.4, d * -.4, 0, TAU); g.fill(); } g.fillStyle = '#ffd874'; ell(g, moth.x, moth.y, 2.2, 4.6); g.fill(); }
  G.paper(g, .3);
}

/* ------------------------------------------------------------------ the clip viewer, input and wiring */
const vid = $('mvid'), pic = $('mimg');
function watch(i) {
  const c = ITEMS[i], photo = c.kind === 'photo'; $('mcap').textContent = c.title; $('mview').hidden = false; vid.hidden = photo; pic.hidden = !photo;
  if (photo) { pic.classList.toggle('wide', !c.tall); pic.alt = c.title; pic.src = `media/${c.id}.jpg`; }
  else { vid.classList.toggle('wide', !c.tall); vid.muted = !G.sound; vid.loop = true; vid.poster = `media/${c.id}.jpg`; vid.src = `media/${c.id}.mp4`; const p = vid.play(); if (p && p.catch) p.catch(() => { /* she can press play herself */ }); }
  $('mclose').focus();
}
function closeView() { vid.pause(); vid.removeAttribute('src'); vid.load(); pic.removeAttribute('src'); $('mview').hidden = true; }
vid.addEventListener('error', () => { if (!$('mview').hidden && vid.getAttribute('src')) $('mcap').textContent = "This clip isn't loaded here."; });
pic.addEventListener('error', () => { if (!$('mview').hidden && pic.getAttribute('src')) $('mcap').textContent = "This photo isn't loaded here."; });
const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
cv.addEventListener('pointerdown', e => {
  if (!active || !L || !$('mcard').hidden || !$('mview').hidden) return; const [x, y] = pt(e);
  if (M.phase === 'run') { jump(); e.preventDefault(); return; }
  if (M.phase !== 'room') return;
  const i = L.frames.findIndex(f => x > f.x - 12 && x < f.x + f.w + 12 && y > f.y - 12 && y < f.y + f.h + 30); if (i >= 0) { watch(i); return; }
  if (Math.abs(x - L.bench.x) < 110 && Math.abs(y - (L.bench.y - 14)) < 50) startRun();
});
addEventListener('keydown', e => {
  if (!active || e.metaKey || e.ctrlKey) return;
  if (e.key === 'Escape' && !$('mview').hidden) { closeView(); return; }
  if (!$('mcard').hidden || !$('mview').hidden || (e.target && e.target.tagName === 'BUTTON')) return;
  if (M.phase === 'run' && (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter')) { e.preventDefault(); if (!e.repeat) jump(); }
  else if (M.phase === 'room') { const i = '12345'.indexOf(e.key); if (i >= 0) watch(i); else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); startRun(); } }
});
const soundLabel = () => { $('msound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('msound').setAttribute('aria-pressed', G.sound); };
$('msound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
$('mleave').addEventListener('click', () => { if (M.phase !== 'room') { M.phase = 'room'; setStep(); } else G.go('map'); });
$('mhang').addEventListener('click', () => { $('mcard').hidden = true; M.earned = true; M.phase = 'room'; setStep(); burst(L.hook.x, L.hook.y + 110, 30); });
$('mclose').addEventListener('click', closeView);
$('mview').addEventListener('click', e => { if (e.target === $('mview')) closeView(); });

G.scenes.medal = {
  frame, resize: layout,
  enter() { active = true; $('mui').hidden = false; layout(); if (M.phase !== 'room') M.phase = 'room'; setStep(); soundLabel(); moth.x = L.hook.x + 70; moth.y = L.hook.y + 30; if (document.fonts && document.fonts.load) { document.fonts.load('700 14px Nunito'); document.fonts.load('800 15px Nunito'); } },
  leave() { active = false; if (!$('mview').hidden) closeView(); $('mcard').hidden = true; $('mui').hidden = true; },
  debug: { M, get L() { return L; }, get S() { return S; }, startRun, jump, TOTAL }
};
})();
