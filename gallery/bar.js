/* The bar. The two of them sit at the counter and Jana works the menu: mezcal with lemon juice,
   the spritz bar, and the wines. She makes one for each of them, and then they clink. */
(() => {
'use strict';
const G = window.G; if (!G || !G.duo) return;
const { cv, cx, lerp, clamp, sm, TAU, R, dab, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif', DISPLAY = '"Fraunces", "Iowan Old Style", Georgia, serif';
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };
const ING = {
  mezcal: { name: 'Mezcal', col: [236, 230, 204], a: .5, bottle: '#d9cfa8', label: '#2f6a4a' },
  lemon: { name: 'Lemon juice', col: [248, 226, 104], a: .9, squeeze: true },
  aperol: { name: 'Aperol', col: [246, 126, 38], a: .92, bottle: '#f08a2c', label: '#fbf3df' },
  campari: { name: 'Campari', col: [204, 34, 46], a: .94, bottle: '#c8262c', label: '#fbf3df' },
  limoncello: { name: 'Limoncello', col: [250, 222, 82], a: .9, bottle: '#f2d24a', label: '#fbf3df' },
  elder: { name: 'Elderflower', col: [216, 230, 150], a: .8, bottle: '#cfe0a0', label: '#4f8a3c' },
  prosecco: { name: 'Prosecco', col: [246, 230, 162], a: .78, fizz: true, bottle: '#2f5a3c', label: '#e9b44c' },
  soda: { name: 'Soda', col: [228, 242, 248], a: .45, fizz: true, bottle: '#9fc4d8', label: '#fbf3df' },
  gin: { name: 'Hendrick\u2019s gin', col: [230, 238, 230], a: .4, bottle: '#2a2622', label: '#efe6d2' },
  tonic: { name: 'Classic tonic', col: [228, 242, 248], a: .45, fizz: true, bottle: '#9fc4d8', label: '#fbf3df' },
  medtonic: { name: 'Mediterranean tonic', col: [222, 240, 230], a: .5, fizz: true, bottle: '#8fc8b8', label: '#fbf3df' },
  eldertonic: { name: 'Elderflower tonic', col: [232, 238, 196], a: .55, fizz: true, bottle: '#cfe0a0', label: '#4f8a3c' },
  pinktonic: { name: 'Pink tonic', col: [247, 198, 206], a: .65, fizz: true, bottle: '#f0a8b4', label: '#fbf3df' },
  cuctonic: { name: 'Cucumber tonic', col: [212, 236, 206], a: .55, fizz: true, bottle: '#a8d49a', label: '#fbf3df' },
  red: { name: 'Red', col: [124, 22, 46], a: .96, bottle: '#2a1c24', label: '#fbf3df' },
  white: { name: 'White', col: [242, 228, 150], a: .8, bottle: '#8fa86a', label: '#fbf3df' },
  orange: { name: 'Orange', col: [228, 144, 58], a: .88, bottle: '#b8742c', label: '#fbf3df' },
  rose: { name: 'Rosé', col: [242, 150, 152], a: .85, bottle: '#e8a0a8', label: '#fbf3df' },
  bubbly: { name: 'Sparkling', col: [248, 234, 170], a: .76, fizz: true, bottle: '#2f5a3c', label: '#e9b44c' }
};
const MENU = {
  mezcal: { tab: 'Mezcal', title: 'Mezcal with lemon juice', pour: ['mezcal', 'lemon'], opts: [['rim', 'Rim', [['salt', 'Salt'], ['chilli', 'Chilli salt'], ['none', 'No rim']]], ['ice', 'Ice', [['on', 'On the rocks'], ['off', 'No ice']]], ['garnish', 'Garnish', [['lemon', 'Lemon wheel'], ['none', 'None']]]], start: { rim: 'salt', ice: 'on', garnish: 'lemon' } },
  spritz: { tab: 'Spritz', title: 'Spritz bar', pour: ['aperol', 'campari', 'limoncello', 'elder', 'prosecco', 'soda'], opts: [['garnish', 'Garnish', [['orange', 'Orange slice'], ['lemon', 'Lemon wheel'], ['olive', 'Olive'], ['mint', 'Mint'], ['none', 'None']]]], start: { rim: 'none', ice: 'on', garnish: 'orange' } },
  gin: { tab: 'G&T', title: 'Gin and tonic', pour: ['gin', 'tonic', 'medtonic', 'eldertonic', 'pinktonic', 'cuctonic'], opts: [['garnish', 'Garnish', [['cucumber', 'Cucumber'], ['lime', 'Lime'], ['lemon', 'Lemon wheel'], ['none', 'None']]], ['ice', 'Ice', [['on', 'Ice'], ['off', 'No ice']]]], start: { rim: 'none', ice: 'on', garnish: 'cucumber' } },
  wine: { tab: 'Wine', title: 'Wines', pour: ['red', 'white', 'orange', 'rose', 'bubbly'], single: true, opts: [], start: { rim: 'none', ice: 'off', garnish: 'none' } }
};
const CAP = 6;
const IDLE = { j: { dx: .1, tilt: .05 }, f: { dx: .1, tilt: .05 } };
const GOT = who => ({ j: Object.assign({ dx: .1, tilt: .05 }, who === 'j' ? { eyes: ['happy', 'happy'], mouth: 'grin' } : {}), f: Object.assign({ dx: .1, tilt: .05 }, who === 'f' ? { eyes: ['happy', 'happy'], mouth: 'grin' } : {}) });
const HX = .6, HY = 1.86;
const CHEERS = { j: { dx: .16, tilt: .1, expr: 'joy', hands: [{ k: 'fist', x: HX, y: HY, rot: .2, far: 0, from: .1 }] }, f: { dx: .16, tilt: .1, expr: 'joy', hands: [{ k: 'fist', x: HX, y: HY, rot: .2, far: 0, from: .1 }] } };
let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false, tab = 'mezcal';
/* how strong each pour is: enough of these and the evening ends at the jail */
const STRONG = { mezcal: 1, gin: 1, campari: .6, limoncello: .6, aperol: .5, elder: .4, prosecco: .4, bubbly: .45, red: .45, white: .45, orange: .45, rose: .45 }, LIMIT = 10;
let drunk = 0, hic = 0;
const tipsy = () => clamp(drunk / LIMIT, 0, 1);
let D = null, served = { j: null, f: null }, pour = null, phase = 'make', pt0 = 0, glad = null, parts = [], rounds = 0;
const empty = t => Object.assign({ tab: t, parts: {}, total: 0, level: 0 }, MENU[t].start);
const kindOf = d => (d.tab === 'mezcal' ? 'rocks' : d.tab === 'spritz' || d.tab === 'gin' ? 'balloon' : d.parts.bubbly ? 'flute' : 'wine');
function mixOf(d) { let r = 0, g = 0, b = 0, a = 0, n = 0, fizz = false; for (const id in d.parts) { const q = ING[id], k = d.parts[id]; r += q.col[0] * k; g += q.col[1] * k; b += q.col[2] * k; a += q.a * k; n += k; fizz = fizz || !!q.fizz; } return n ? { col: [r / n, g / n, b / n].map(Math.round), a: a / n, fizz } : { col: [255, 255, 255], a: 0, fizz: false }; }

/* ------------------------------------------------------------------ a glass: base at the origin, s tall */
const SHAPE = { rocks: { top: -.62, bot: -.07, rim: .31, wide: .3 }, balloon: { top: -.94, bot: -.34, rim: .28, wide: .37 }, wine: { top: -.95, bot: -.42, rim: .19, wide: .25 }, flute: { top: -.99, bot: -.38, rim: .105, wide: .125 } };
function bowl(g, kind, s) { const q = SHAPE[kind]; g.beginPath(); if (kind === 'rocks') { g.moveTo(-q.rim * s, q.top * s); g.lineTo(-q.rim * .84 * s, q.bot * s); g.lineTo(q.rim * .84 * s, q.bot * s); g.lineTo(q.rim * s, q.top * s); } else { const mid = lerp(q.top, q.bot, .45) * s; g.moveTo(-q.rim * s, q.top * s); g.bezierCurveTo(-q.wide * 1.22 * s, mid, -q.wide * .8 * s, q.bot * s, 0, q.bot * s); g.bezierCurveTo(q.wide * .8 * s, q.bot * s, q.wide * 1.22 * s, mid, q.rim * s, q.top * s); } g.closePath(); }
function wheel(g, x, y, r, col, rind) { g.fillStyle = rind; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, y, r * .82, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = Math.max(.6, r * .07); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(x - Math.cos(a) * r * .8, y - Math.sin(a) * r * .8); g.lineTo(x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8); g.stroke(); } }
function glass(g, x, y, s, d, t, frac) {
  const kind = kindOf(d), q = SHAPE[kind], m = mixOf(d), f = clamp(frac == null ? d.level : frac, 0, 1), ly = lerp(q.bot, lerp(q.top, q.bot, .1), f) * s, still = G.RM ? 0 : 1;
  g.save(); g.translate(x, y); g.lineJoin = 'round'; g.lineCap = 'round';
  g.fillStyle = 'rgba(20,10,20,.22)'; ell(g, s * .03, s * .01, s * (kind === 'rocks' ? .34 : .24), s * .035); g.fill();
  if (kind !== 'rocks') { g.fillStyle = 'rgba(236,244,248,.5)'; g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = Math.max(.8, s * .012); ell(g, 0, -s * .012, s * .19, s * .028); g.fill(); g.stroke(); g.fillRect(-s * .016, q.bot * s, s * .032, -q.bot * s - s * .02); }
  else { g.fillStyle = 'rgba(236,244,248,.55)'; rr(g, -q.rim * .86 * s, q.bot * s, q.rim * 1.72 * s, -q.bot * s, s * .03); g.fill(); }
  g.fillStyle = 'rgba(236,244,248,.2)'; bowl(g, kind, s); g.fill();
  g.save(); bowl(g, kind, s); g.clip();
  if (f > .005) { g.fillStyle = `rgba(${m.col},${m.a})`; g.fillRect(-s, ly, s * 2, q.bot * s - ly + 2); g.fillStyle = 'rgba(255,255,255,.28)'; ell(g, 0, ly, s * .5, s * .022); g.fill(); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(q.wide * .35 * s, ly, s, s); }
  if (d.ice === 'on') for (const [ix, k, a] of [[-.5, 0, .3], [.3, 1, -.4], [-.05, 2, .15]]) { const sz = s * (kind === 'rocks' ? .2 : .16), cy = Math.min(q.bot * s - sz * (.55 + k * .9 * (f < .15 ? 1 : 0)), ly + sz * (.5 + k * .55)) + Math.sin(t * 1.4 + k) * s * .006 * still; g.save(); g.translate(ix * q.wide * s, Math.min(cy, q.bot * s - sz * .55)); g.rotate(a); g.fillStyle = 'rgba(255,255,255,.42)'; g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = Math.max(.6, s * .01); rr(g, -sz / 2, -sz / 2, sz, sz, sz * .2); g.fill(); g.stroke(); g.restore(); }
  if (m.fizz && f > .05) for (let i = 0; i < 12; i++) { const u = (t * (.35 + (i % 4) * .08) + i * .37) % 1; g.fillStyle = `rgba(255,255,255,${.75 * (1 - u)})`; g.beginPath(); g.arc(Math.sin(i * 2.4) * q.wide * .7 * s + Math.sin(t * 2 + i) * s * .01 * still, lerp(q.bot * s, ly, G.RM ? (i / 12) : u), s * .012 + (i % 3) * s * .004, 0, TAU); g.fill(); }
  if (d.garnish === 'cucumber') { const rib = () => { g.beginPath(); g.moveTo(-q.rim * .55 * s, q.top * s + s * .03); g.bezierCurveTo(-q.wide * 1.05 * s, lerp(q.top, q.bot, .45) * s, -q.wide * .1 * s, lerp(q.top, q.bot, .5) * s, q.wide * .34 * s, lerp(q.top, q.bot, .86) * s); }; rib(); g.strokeStyle = '#4f8a3c'; g.lineWidth = s * .07; g.stroke(); rib(); g.strokeStyle = '#cfe8b0'; g.lineWidth = s * .048; g.stroke(); rib(); g.strokeStyle = 'rgba(120,170,90,.6)'; g.lineWidth = Math.max(.6, s * .008); g.setLineDash([s * .012, s * .03]); g.stroke(); g.setLineDash([]); }
  if (d.garnish === 'olive') { g.strokeStyle = '#8a5c38'; g.lineWidth = Math.max(1, s * .014); g.beginPath(); g.moveTo(-q.rim * .5 * s, q.top * s - s * .1); g.lineTo(q.wide * .3 * s, Math.max(ly + s * .12, q.top * s + s * .2)); g.stroke(); const ox = q.wide * .2 * s, oy = Math.max(ly + s * .07, q.top * s + s * .15); g.fillStyle = '#7a8a3c'; ell(g, ox, oy, s * .05, s * .04); g.fill(); g.fillStyle = '#c8262c'; g.beginPath(); g.arc(ox + s * .03, oy, s * .014, 0, TAU); g.fill(); }
  g.restore();
  if (d.garnish === 'olive') { g.strokeStyle = '#8a5c38'; g.lineWidth = Math.max(1, s * .014); g.beginPath(); g.moveTo(-q.rim * .5 * s, q.top * s - s * .1); g.lineTo(-q.rim * .3 * s, q.top * s); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = Math.max(1, s * .014); bowl(g, kind, s); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = Math.max(1, s * .02); g.beginPath(); g.moveTo(-q.rim * .78 * s, lerp(q.top, q.bot, .16) * s); g.lineTo(-q.rim * (kind === 'rocks' ? .7 : .95) * s, lerp(q.top, q.bot, .6) * s); g.stroke();
  if (d.rim !== 'none') { const rnd = R(5); for (let i = 0; i < 46; i++) { const u = rnd() * 2 - 1; g.fillStyle = d.rim === 'chilli' ? (rnd() < .6 ? '#d8502c' : '#f2c21c') : 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(u * q.rim * s, q.top * s + rnd() * s * .045 - s * .01, s * (.008 + rnd() * .008), 0, TAU); g.fill(); } }
  if (d.garnish === 'lime') wheel(g, q.rim * .92 * s, q.top * s - s * .015, s * .11, '#cfe86a', '#6aa82c');
  if (d.garnish === 'lemon' || d.garnish === 'orange') wheel(g, q.rim * .92 * s, q.top * s - s * .015, s * (kind === 'rocks' ? .13 : .12), d.garnish === 'lemon' ? '#f8e36a' : '#f6a23a', d.garnish === 'lemon' ? '#e9c21c' : '#e8781c');
  if (d.garnish === 'mint') for (const [a, k] of [[-.9, 1], [-.3, 1.15], [.3, 1], [-.6, .8]]) { g.save(); g.translate(-q.rim * .55 * s, q.top * s + s * .02); g.rotate(a); g.fillStyle = k > 1 ? '#5aa04a' : '#3f8a3c'; g.beginPath(); g.ellipse(0, -s * .07 * k, s * .035 * k, s * .075 * k, 0, 0, TAU); g.fill(); g.restore(); }
  g.restore();
}
function bottle(g, x, y, s, q, tilt) {
  g.save(); g.translate(x, y); g.rotate(tilt);
  if (q.squeeze) { g.fillStyle = '#e9c21c'; g.beginPath(); g.ellipse(0, 0, s * .2, s * .16, 0, Math.PI, 0); g.fill(); g.fillStyle = '#f8e36a'; ell(g, 0, 0, s * .18, s * .05); g.fill(); g.restore(); return; }
  g.fillStyle = q.bottle; rr(g, -s * .13, -s * .5, s * .26, s * .6, s * .05); g.fill(); g.beginPath(); g.moveTo(-s * .13, -s * .46); g.quadraticCurveTo(-s * .12, -s * .66, -s * .045, -s * .72); g.lineTo(-s * .045, -s * .95); g.lineTo(s * .045, -s * .95); g.lineTo(s * .045, -s * .72); g.quadraticCurveTo(s * .12, -s * .66, s * .13, -s * .46); g.fill();
  g.fillStyle = q.label; g.fillRect(-s * .13, -s * .32, s * .26, s * .24); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-s * .08, -s * .26, s * .16, s * .03); g.fillRect(-s * .06, -s * .2, s * .12, s * .02); g.fillStyle = '#e9b44c'; g.fillRect(-s * .05, -s * .98, s * .1, s * .06); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(-s * .1, -s * .48, s * .04, s * .54);
  g.restore();
}

/* ------------------------------------------------------------------ layout and the room */
function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S; const land = G.W > G.H, pr = $('zpanel').getBoundingClientRect(), cr = cv.getBoundingClientRect();
  const fw = land ? (pr.left - cr.left) / S : VW, fh = land ? VH : (pr.top - cr.top) / S, top = land ? 58 : 66, bar = land ? fh * .6 : fh * .62;
  const ph = bar - top + (land ? 18 : 10), pw = Math.min(fw - 16, ph * 4 / 3), gs = Math.min((fh - bar) * (land ? .92 : .96), fw * .34);
  L = { land, fw, fh, top, bar, px: (fw - pw) / 2, py: top, pw, ph, gx: fw / 2, gy: fh - (land ? 22 : 8), gs, sj: fw / 2 - pw * .37, sf: fw / 2 + pw * .37, sy: bar + (fh - bar) * .34, ss: (fh - bar) * (land ? .46 : .5) };
  SPR = { room: G.spr(VW, VH, drawRoom, clamp(S * G.DPR, 1, 2.5)) };
  $('zui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function drawRoom(g, w, h) {
  const r = R(4117), fw = L.fw, bar = L.bar, k = L.land ? 1 : .62;
  let gr = g.createLinearGradient(0, 0, 0, bar); gr.addColorStop(0, '#1f3a34'); gr.addColorStop(1, '#2c5248'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w * bar / 2600; i++) dab(g, r() * w, r() * bar, 20 + r() * 60, 8 + r() * 18, r() * 3, r() < .5 ? '#376a5c' : '#17302a', .12); g.globalAlpha = 1;
  /* a faint leaf pattern on the wall, and green tiles above the counter */
  g.strokeStyle = 'rgba(160,210,180,.07)'; g.lineWidth = 1.4; for (let yy = 20; yy < bar - 60; yy += 38) for (let xx = (Math.round(yy / 38) % 2) * 22 + 6; xx < w; xx += 44) { g.beginPath(); g.moveTo(xx, yy + 9); g.quadraticCurveTo(xx - 8, yy, xx, yy - 9); g.quadraticCurveTo(xx + 8, yy, xx, yy + 9); g.moveTo(xx, yy + 9); g.lineTo(xx, yy - 9); g.stroke(); }
  const sx = fw * .5, sw = L.land ? Math.min(fw * .6, 470) : fw - 22, sy = L.top + 6 * k, shh = 62 * k, ty = sy + shh * 2 + 24 * k;
  for (let yy = ty, row = 0; yy < bar; yy += 13 * k, row++) for (let xx = -30 + (row % 2) * 15 * k; xx < w; xx += 30 * k) { g.fillStyle = ['#2f6a58', '#2a6052', '#34745f'][Math.floor(r() * 3)]; g.fillRect(xx, yy, 29 * k, 12 * k); g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(xx, yy, 29 * k, 2 * k); }
  g.fillStyle = '#e9b44c'; g.fillRect(0, ty - 3 * k, w, 3 * k);
  /* two shelves of bottles in front of a mirror, with glasses hanging underneath */
  g.fillStyle = '#3a2a24'; rr(g, sx - sw / 2 - 8, sy - 8, sw + 16, shh * 2 + 26, 8); g.fill(); gr = g.createLinearGradient(0, sy, 0, sy + shh * 2); gr.addColorStop(0, '#5f7f86'); gr.addColorStop(1, '#3f5a62'); g.fillStyle = gr; g.fillRect(sx - sw / 2, sy, sw, shh * 2 + 10);
  g.fillStyle = 'rgba(255,255,255,.08)'; for (const u of [-.3, .12]) { g.beginPath(); g.moveTo(sx + sw * u, sy); g.lineTo(sx + sw * (u + .16), sy); g.lineTo(sx + sw * (u - .04), sy + shh * 2 + 10); g.lineTo(sx + sw * (u - .2), sy + shh * 2 + 10); g.fill(); }
  const cols = ['#2f5a3c', '#c8262c', '#f08a2c', '#d9cfa8', '#2a1c24', '#8fa86a', '#f2d24a', '#b8742c', '#e8a0a8', '#9fc4d8', '#5a2a6a', '#cfe0a0', '#2a2622'];
  for (let row = 0; row < 2; row++) { const by = sy + shh * (row + 1) + row * 5; g.fillStyle = '#6a4a38'; g.fillRect(sx - sw / 2, by, sw, 5); g.fillStyle = 'rgba(255,220,170,.25)'; g.fillRect(sx - sw / 2, by, sw, 1.4); let x = sx - sw / 2 + 12 * k;
    while (x < sx + sw / 2 - 16 * k) { const bw = (11 + r() * 8) * k, bh = shh * (.5 + r() * .36), c = cols[Math.floor(r() * cols.length)], kind = r();
      g.fillStyle = c; if (kind < .3) { g.beginPath(); g.ellipse(x + bw / 2, by - bh * .42, bw * .62, bh * .42, 0, 0, TAU); g.fill(); g.fillRect(x + bw * .34, by - bh * 1.2, bw * .32, bh * .5); } else { rr(g, x, by - bh, bw, bh, kind < .65 ? 2.5 * k : bw * .4); g.fill(); g.fillRect(x + bw * .32, by - bh - bh * .32, bw * .36, bh * .34); }
      g.fillStyle = ['#fbf3df', '#e9b44c', '#26252b'][Math.floor(r() * 3)]; g.fillRect(x + bw * .34, by - bh * (kind < .3 ? 1.26 : 1.36), bw * .32, bh * .07);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x + bw * .12, by - bh * .62, bw * .76, bh * .26); g.fillStyle = 'rgba(40,30,30,.35)'; g.fillRect(x + bw * .22, by - bh * .54, bw * .56, bh * .04); g.fillRect(x + bw * .3, by - bh * .46, bw * .4, bh * .03);
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x + 1.2, by - bh + 2, 2 * k, bh - 4); x += bw + (4 + r() * 7) * k; } }
  for (let x = sx - sw / 2 + 16 * k; x < sx + sw / 2 - 10 * k; x += 17 * k) { const gy = sy + shh * 2 + 18 * k; g.strokeStyle = 'rgba(236,244,248,.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 5 * k, gy); g.lineTo(x + 5 * k, gy); g.moveTo(x, gy); g.lineTo(x, gy + 7 * k); g.stroke(); g.fillStyle = 'rgba(236,244,248,.28)'; g.beginPath(); g.moveTo(x - 1, gy + 7 * k); g.quadraticCurveTo(x - 7 * k, gy + 10 * k, x - 5.5 * k, gy + 18 * k); g.lineTo(x + 5.5 * k, gy + 18 * k); g.quadraticCurveTo(x + 7 * k, gy + 10 * k, x + 1, gy + 7 * k); g.fill(); g.stroke(); }
  g.fillStyle = '#3a2a24'; g.fillRect(sx - sw / 2 - 4, sy + shh * 2 + 15 * k, sw + 8, 4 * k);
  if (L.land) {
    /* the chalkboard with the menu, to the left */
    const cx0 = 16, cw = sx - sw / 2 - 40, cy0 = sy + 2;
    if (cw > 80) { g.fillStyle = '#6a4a38'; rr(g, cx0 - 5, cy0 - 5, cw + 10, 136, 5); g.fill(); g.fillStyle = '#26302c'; g.fillRect(cx0, cy0, cw, 126); for (let i = 0; i < 30; i++) dab(g, cx0 + r() * cw, cy0 + r() * 126, 10 + r() * 20, 3 + r() * 5, r() * 3, '#fff', .03); g.globalAlpha = 1;
      g.fillStyle = '#f4f1e6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `italic 600 ${Math.min(20, cw * .17)}px ${DISPLAY}`; g.fillText('Menu', cx0 + cw / 2, cy0 + 19); g.font = `600 ${Math.min(13, cw * .105)}px ${UI}`; ['Mezcal + lemon', 'Spritz bar', 'Gin + tonic', 'Wines'].forEach((t, i) => g.fillText(t, cx0 + cw / 2, cy0 + 50 + i * 19));
      g.strokeStyle = 'rgba(244,241,230,.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx0 + cw * .22, cy0 + 34); g.lineTo(cx0 + cw * .78, cy0 + 34); g.stroke(); g.fillStyle = '#f2849a'; g.beginPath(); g.arc(cx0 + cw * .14, cy0 + 20, 3, 0, TAU); g.arc(cx0 + cw * .86, cy0 + 20, 3, 0, TAU); g.fill(); g.fillStyle = '#fbfaf4'; g.fillRect(cx0 + cw * .3, cy0 + 127, cw * .16, 3.5); g.fillStyle = '#f2849a'; g.fillRect(cx0 + cw * .52, cy0 + 127, cw * .1, 3.5); }
    /* to the right: two framed pictures and a plant on a shelf, under where the neon hangs */
    const rx = sx + sw / 2 + 22, rw = fw - rx - 12;
    if (rw > 80) { const py = sy + 96; for (const [u, cA, cB] of [[.06, '#f6b26a', '#3f6a8a'], [.54, '#e8a0a8', '#2c5248']]) { const fx = rx + rw * u, fwid = rw * .4; g.fillStyle = '#e9b44c'; g.fillRect(fx - 3, py - 3, fwid + 6, 46); g.fillStyle = cA; g.fillRect(fx, py, fwid, 40); g.fillStyle = cB; g.beginPath(); g.moveTo(fx, py + 40); g.lineTo(fx, py + 26); g.quadraticCurveTo(fx + fwid * .4, py + 12, fx + fwid, py + 24); g.lineTo(fx + fwid, py + 40); g.fill(); g.fillStyle = 'rgba(255,246,214,.9)'; g.beginPath(); g.arc(fx + fwid * .7, py + 12, 5, 0, TAU); g.fill(); } }
  }
  /* the counter: wood grain, a brass rail, and the things a bar keeps to hand */
  gr = g.createLinearGradient(0, bar, 0, h); gr.addColorStop(0, '#a8703f'); gr.addColorStop(.12, '#8f5a30'); gr.addColorStop(1, '#6e4224'); g.fillStyle = gr; g.fillRect(0, bar, w, h - bar); g.fillStyle = 'rgba(255,220,170,.28)'; g.fillRect(0, bar, w, 4); g.fillStyle = 'rgba(40,20,10,.25)'; g.fillRect(0, bar + 4, w, 3);
  g.strokeStyle = 'rgba(60,30,14,.2)'; g.lineWidth = 1.4; for (let i = 0; i < 22; i++) { const y = bar + 14 + r() * (h - bar - 20); g.beginPath(); g.moveTo(r() * w, y); g.bezierCurveTo(w * .3, y + (r() - .5) * 14, w * .6, y + (r() - .5) * 14, w, y + (r() - .5) * 10); g.stroke(); }
  for (let i = 0; i < 5; i++) { g.strokeStyle = 'rgba(40,20,10,.16)'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(r() * fw, bar + 30 + r() * (h - bar - 50), 14 * k, 5 * k, 0, 0, TAU); g.stroke(); }
  const ks = (L.fh - bar) / 270 * 1.3, iy = bar + (L.fh - bar) * .3, lx = Math.max(34 * ks, L.sj - L.ss * .55 - 62 * ks), rx2 = Math.min(fw - 30 * ks, L.sf + L.ss * .55 + 58 * ks);
  const shadow = (x, y, rx3) => { g.fillStyle = 'rgba(30,14,6,.28)'; ell(g, x + 3 * ks, y + 2 * ks, rx3, rx3 * .26); g.fill(); };
  /* left: a bowl of citrus, the shaker and a jigger */
  shadow(lx, iy, 30 * ks); for (const [fx, fy, c, rad] of [[-13, -15, '#f6d21c', 9], [0, -19, '#f08a2c', 10], [13, -15, '#b6d430', 9], [-5, -10, '#f6a23a', 9], [8, -9, '#f6d21c', 8.5]]) { g.fillStyle = c; g.beginPath(); g.arc(lx + fx * ks, iy + fy * ks, rad * ks, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.arc(lx + (fx - 3) * ks, iy + (fy - 3) * ks, rad * .3 * ks, 0, TAU); g.fill(); }
  g.fillStyle = '#efe6d2'; g.beginPath(); g.moveTo(lx - 27 * ks, iy - 12 * ks); g.quadraticCurveTo(lx - 22 * ks, iy + 4 * ks, lx - 9 * ks, iy + 2 * ks); g.lineTo(lx + 9 * ks, iy + 2 * ks); g.quadraticCurveTo(lx + 22 * ks, iy + 4 * ks, lx + 27 * ks, iy - 12 * ks); g.fill(); g.fillStyle = '#2f8a8c'; g.fillRect(lx - 25 * ks, iy - 11 * ks, 50 * ks, 2.4 * ks);
  { const x = lx + 44 * ks, y = iy + 22 * ks; shadow(x, y, 14 * ks); gr = g.createLinearGradient(x - 11 * ks, 0, x + 11 * ks, 0); gr.addColorStop(0, '#8f949c'); gr.addColorStop(.4, '#eef0f4'); gr.addColorStop(1, '#8f949c'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 8 * ks, y); g.lineTo(x + 8 * ks, y); g.lineTo(x + 11 * ks, y - 34 * ks); g.lineTo(x - 11 * ks, y - 34 * ks); g.fill(); g.beginPath(); g.moveTo(x - 10 * ks, y - 36 * ks); g.quadraticCurveTo(x, y - 54 * ks, x + 10 * ks, y - 36 * ks); g.fill(); rr(g, x - 4 * ks, y - 56 * ks, 8 * ks, 9 * ks, 2 * ks); g.fill(); g.fillStyle = 'rgba(40,40,50,.3)'; g.fillRect(x - 11 * ks, y - 36 * ks, 22 * ks, 1.6 * ks);
    const jx = x + 22 * ks; g.fillStyle = '#e9b44c'; g.beginPath(); g.moveTo(jx - 6 * ks, y - 18 * ks); g.lineTo(jx + 6 * ks, y - 18 * ks); g.lineTo(jx + 1.6 * ks, y - 9 * ks); g.lineTo(jx + 4.6 * ks, y); g.lineTo(jx - 4.6 * ks, y); g.lineTo(jx - 1.6 * ks, y - 9 * ks); g.fill(); }
  /* right: the ice bucket with its tongs, a jar of straws, napkins, and a candle (its flame is drawn live) */
  { const x = rx2, y = iy + 2 * ks; shadow(x, y, 26 * ks); gr = g.createLinearGradient(x - 22 * ks, 0, x + 22 * ks, 0); gr.addColorStop(0, '#8f949c'); gr.addColorStop(.35, '#f4f6f8'); gr.addColorStop(1, '#8f949c'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 17 * ks, y); g.lineTo(x + 17 * ks, y); g.lineTo(x + 22 * ks, y - 30 * ks); g.lineTo(x - 22 * ks, y - 30 * ks); g.fill();
    for (const [dx, dy] of [[-10, -34], [2, -37], [12, -33], [-2, -31]]) { g.fillStyle = 'rgba(236,246,252,.9)'; rr(g, x + dx * ks - 6 * ks, y + dy * ks - 5 * ks, 12 * ks, 10 * ks, 2 * ks); g.fill(); g.strokeStyle = 'rgba(160,190,210,.8)'; g.lineWidth = 1; g.stroke(); } g.fillStyle = 'rgba(40,40,50,.25)'; g.fillRect(x - 22 * ks, y - 30 * ks, 44 * ks, 2 * ks);
    g.strokeStyle = '#c4c8d0'; g.lineWidth = 2.4 * ks; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 15 * ks, y - 33 * ks); g.lineTo(x + 30 * ks, y - 52 * ks); g.moveTo(x + 19 * ks, y - 31 * ks); g.lineTo(x + 34 * ks, y - 49 * ks); g.stroke();
    const jx = x - 40 * ks, jy = iy + 24 * ks; shadow(jx, jy, 12 * ks); for (let i = 0; i < 5; i++) { g.strokeStyle = i % 2 ? '#c8463a' : '#fbfaf4'; g.lineWidth = 2.2 * ks; g.beginPath(); g.moveTo(jx + (i - 2) * 3 * ks, jy - 6 * ks); g.lineTo(jx + (i - 2) * 5.4 * ks, jy - 44 * ks); g.stroke(); } g.fillStyle = 'rgba(226,240,246,.55)'; rr(g, jx - 9 * ks, jy - 26 * ks, 18 * ks, 26 * ks, 3 * ks); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.2; g.stroke();
    const nx = x + 26 * ks, ny = iy + 30 * ks; shadow(nx, ny, 16 * ks); for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#fbf6ea' : '#efe6d2'; g.save(); g.translate(nx, ny - i * 2.4 * ks); g.rotate((i - 1.5) * .07); g.fillRect(-13 * ks, -9 * ks, 26 * ks, 9 * ks); g.restore(); } }
  { const x = Math.max(18 * ks, lx - 44 * ks), y = iy + 26 * ks; shadow(x, y, 9 * ks); g.fillStyle = 'rgba(255,236,200,.55)'; rr(g, x - 7 * ks, y - 15 * ks, 14 * ks, 15 * ks, 3 * ks); g.fill(); g.fillStyle = '#f4ead6'; g.fillRect(x - 5 * ks, y - 8 * ks, 10 * ks, 7 * ks); L.candle = [x, y - 11 * ks, ks]; }
  g.fillStyle = '#e9b44c'; g.fillRect(0, h - 5, w, 5);
}
SPR = null;

/* ------------------------------------------------------------------ making and serving */
function setStep() { const tp = Math.round(tipsy() * 100); $('ztipsy').textContent = tp >= 100 ? 'Tipsy: very' : `Tipsy ${tp}%`; $('zstep').textContent = phase === 'cheers' ? 'Cheers.' : served.j && !served.f ? 'One down. Now make the second.' : 'Make a drink for each of you.'; const n = D.total; $('zserve').disabled = !n || phase !== 'make'; $('zserve').textContent = served.j ? 'Serve the second' : 'Serve the first'; $('zclear').hidden = !n || phase !== 'make'; }
function render() {
  const body = $('zbody'), M = MENU[tab]; body.textContent = '';
  const chip = (label, sw, pressed, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; if (pressed != null) b.setAttribute('aria-pressed', pressed); if (sw) { const d = document.createElement('span'); d.className = 'sw'; d.style.background = sw; b.append(d); } b.append(label); b.addEventListener('click', fn); return b; };
  const head = t => { const h = document.createElement('h3'); h.textContent = t; body.append(h); const row = document.createElement('div'); row.className = 'chips'; body.append(row); return row; };
  let row = head(M.title); for (const id of M.pour) row.append(chip((M.single ? '' : 'Add ') + ING[id].name, `rgb(${ING[id].col})`, M.single ? !!D.parts[id] : null, () => add(id)));
  for (const [key, title, list] of M.opts) { row = head(title); for (const [id, name] of list) row.append(chip(name, null, D[key] === id, () => { if (phase !== 'make') return; D[key] = id; tone(784, .08, 'sine', .05); render(); })); }
  for (const b of document.querySelectorAll('#ztabs button')) b.setAttribute('aria-pressed', b.dataset.tab === tab);
  setStep();
}
function add(id) {
  if (phase !== 'make' || pour) return; const M = MENU[tab]; if (M.single && !D.parts[id]) { D.parts = {}; D.total = 0; D.level = 0; }
  if (D.total >= CAP) { tone(180, .12, 'square', .04); return; } const n = M.single ? 2 : 1; D.parts[id] = (D.parts[id] || 0) + n; D.total += n; pour = { id, t: 0 }; for (let i = 0; i < 5; i++) tone(520 + i * 60 + D.total * 30, .06, 'sine', .03, i * .09); render();
}
function serve() {
  if (phase !== 'make' || !D.total || pour) return; const who = served.j ? 'f' : 'j'; served[who] = { d: JSON.parse(JSON.stringify(D)), u: 0, frac: D.total / CAP }; glad = { who, t: 0 }; for (const id in D.parts) drunk += (STRONG[id] || 0) * D.parts[id]; D = empty(tab); tone(659, .12, 'sine', .06); tone(880, .2, 'sine', .05, .1);
  if (served.j && served.f) { phase = 'toast'; pt0 = 0; } render();
}
function again() { served = { j: null, f: null }; phase = 'make'; glad = null; D = empty(tab); $('zend').hidden = true; render(); }
function update(dt) {
  D.level = lerp(D.level, D.total / CAP, 1 - Math.exp(-dt * 5)); if (pour) { pour.t += dt; if (pour.t > .85) pour = null; }
  for (const who of ['j', 'f']) if (served[who]) served[who].u = Math.min(1, served[who].u + dt * 2.2);
  if (glad) { glad.t += dt; if (glad.t > 1.6) glad = null; }
  if (phase === 'toast') { pt0 += dt; if (pt0 > 1.1) { phase = 'cheers'; pt0 = 0; setStep(); } }
  else if (phase === 'cheers') { const was = pt0; pt0 += dt; if (was < .95 && pt0 >= .95) { tone(1760, .25, 'sine', .07); tone(2217, .3, 'sine', .05, .03); if (!G.RM) for (let i = 0; i < 22; i++) { const a = Math.random() * TAU, v = 30 + Math.random() * 110; parts.push({ x: L.px + L.pw / 2, y: L.py + L.ph * .4 + L.ph * .19 * (HY - .5), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: .8 + Math.random() * .7 }); } }
    if (pt0 > 1.3) for (const who of ['j', 'f']) served[who].frac = Math.max(.12, served[who].frac - dt * .28);
    if (pt0 > 3.6 && $('zend').hidden && phase === 'cheers') { phase = 'done'; rounds++; if (drunk >= LIMIT) { $('zbust').hidden = false; $('zjail').focus(); for (let i = 0; i < 8; i++) tone(i % 2 ? 660 : 880, .22, 'sine', .05, i * .24); } else { $('zend').hidden = false; $('zmore').focus(); } setStep(); } }
  if (tipsy() > .45 && phase === 'make' && !G.RM) { hic -= dt; if (hic <= 0) { hic = 2.4 + Math.random() * 3 - tipsy(); parts.push({ hic: Math.random() < .5 ? .29 : .71, x: 0, y: 0, vx: 0, vy: 0, life: 1.1 }); tone(520, .05, 'sine', .04); tone(760, .07, 'sine', .04, .06); } }
  for (const q of parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; if (!q.hic) q.vy += 120 * dt; } parts = parts.filter(q => q.life > 0);
}
function frame(dt) {
  if (!L || !SPR || !D) return; update(dt); const t = G.time, g = cx, still = G.RM ? 0 : 1;
  g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(SPR.room, 0, 0, VW, VH);
  /* three lamps over the bar */
  for (let i = 0; i < 3; i++) { const x = L.fw * (.22 + i * .28), y = L.top - 8 + (i === 1 ? 10 : 0); g.strokeStyle = '#17141c'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, y); g.stroke(); g.fillStyle = '#e9b44c'; g.beginPath(); g.moveTo(x - 16, y + 14); g.quadraticCurveTo(x, y - 10, x + 16, y + 14); g.fill(); g.globalCompositeOperation = 'lighter'; glow(g, x, y + 22, 120, '255,206,130', .2 + .02 * Math.sin(t * 2 + i) * still); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#fff3c8'; ell(g, x, y + 15, 7, 4); g.fill(); }
  /* a string of small lights over the shelves, a neon cocktail glass on the right, and the candle on the counter */
  { const k = L.land ? 1 : .62, n = Math.floor(L.fw / (26 * k)); g.strokeStyle = 'rgba(20,16,20,.6)'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i <= n; i++) { const x = L.fw * i / n, y = L.top - 6 + Math.sin(i / n * Math.PI * 3) * 4 + 6 * Math.sin(i / n * Math.PI); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
    for (let i = 1; i < n; i++) { const x = L.fw * i / n, y = L.top - 4 + Math.sin(i / n * Math.PI * 3) * 4 + 6 * Math.sin(i / n * Math.PI), tw = .6 + .4 * Math.sin(t * 2.2 + i * 1.7) * still; g.fillStyle = `rgba(255,${200 + (i % 3) * 20},${130 + (i % 2) * 60},${.55 + .45 * tw})`; g.beginPath(); g.arc(x, y, 2.2 * k + .6, 0, TAU); g.fill(); }
    if (L.land) { const sw = Math.min(L.fw * .6, 470), rx = L.fw * .5 + sw / 2 + 22, rw = L.fw - rx - 12; if (rw > 80) { const nx = rx + rw / 2, ny = L.top + 44, on = G.RM ? 1 : (Math.sin(t * 1.3) > -.96 ? 1 : .35) * (.92 + .08 * Math.sin(t * 31)); g.globalCompositeOperation = 'lighter'; glow(g, nx, ny, 70, '255,120,150', .3 * on); g.globalCompositeOperation = 'source-over';
        g.lineCap = 'round'; g.lineJoin = 'round'; for (const [lw, col] of [[7, `rgba(255,110,150,${.35 * on})`], [2.6, `rgba(255,214,226,${on})`]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(nx - 26, ny - 24); g.lineTo(nx + 26, ny - 24); g.lineTo(nx, ny + 6); g.closePath(); g.moveTo(nx, ny + 6); g.lineTo(nx, ny + 32); g.moveTo(nx - 15, ny + 32); g.lineTo(nx + 15, ny + 32); g.stroke(); }
        for (const [lw, col] of [[6, `rgba(170,255,150,${.3 * on})`], [2.2, `rgba(226,255,214,${on})`]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(nx + 10, ny - 16, 5, 0, TAU); g.moveTo(nx + 14, ny - 20); g.lineTo(nx + 26, ny - 34); g.stroke(); } } }
    if (L.candle) { const [x, y, ks] = L.candle, fl = 1 + .14 * Math.sin(t * 9) * still; g.globalCompositeOperation = 'lighter'; glow(g, x, y, 46 * ks, '255,190,110', .3 * fl); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#ffd874'; g.beginPath(); g.ellipse(x, y, 2.4 * ks, 5.4 * ks * fl, 0, 0, TAU); g.fill(); g.fillStyle = '#fff6d8'; g.beginPath(); g.ellipse(x, y + 1.4 * ks, 1.2 * ks, 2.6 * ks, 0, 0, TAU); g.fill(); } }
  /* the two of them, across the counter */
  const u = phase === 'cheers' || phase === 'done' ? clamp(pt0 / .95, 0, 1) : 0, P = u > 0 ? (phase === 'done' || u >= 1 ? CHEERS : G.duo.mix(IDLE, CHEERS, u)) : glad ? GOT(glad.who) : IDLE;
  g.save(); { const lv = tipsy(), sw = (Math.sin(t * 1.3) * .022 + Math.sin(t * .7 + 1) * .012) * lv * still; g.translate(L.px + L.pw / 2, L.bar); g.rotate(sw); g.translate(-L.px - L.pw / 2, -L.bar); }
  g.save(); g.translate(L.px, L.py); G.duo.draw(g, L.pw, L.ph, P, t); g.restore();
  const held = u >= .45, r = L.ph * .19;
  if (held) for (const [who, sg, bx] of [['j', 1, L.pw * .29], ['f', -1, L.pw * .71]]) { const sv = served[who]; if (!sv) continue; const ha = phase === 'done' ? 1 : sm((u - .45) / .55), k = G.people[who], x = L.px + bx + sg * (.16 + HX) * r - sg * r * .06, y = L.py + L.ph * .4 + HY * r + (1 - ha) * r * 3.6 + r * .3, gs = r * 1.08, lean = sg * (.16 + (u >= 1 ? .14 * Math.max(0, 1 - (pt0 - .95) * 3) : 0));
    g.save(); g.translate(x, y); g.rotate(lean); glass(g, 0, 0, gs, sv.d, t, sv.frac); const gk = kindOf(sv.d), gy = gk === 'rocks' ? -gs * .22 : -gs * .2, gw = gk === 'rocks' ? gs * .7 : gs * .26; g.fillStyle = k.skin; g.strokeStyle = k.shade; g.lineWidth = Math.max(1, gs * .02); rr(g, -gw / 2, gy - gs * .09, gw, gs * .2, gs * .07); g.fill(); g.stroke(); g.beginPath(); for (let i = 1; i < 4; i++) { g.moveTo(-gw / 2, gy - gs * .09 + i * gs * .05); g.lineTo(gw / 2, gy - gs * .09 + i * gs * .05); } g.globalAlpha = .5; g.stroke(); g.globalAlpha = 1; g.restore(); }
  g.restore();
  /* the counter again over their middles, then what is on it */
  g.save(); g.beginPath(); g.rect(0, L.bar, VW, VH - L.bar); g.clip(); g.drawImage(SPR.room, 0, 0, VW, VH); g.restore();
  for (const x of [L.sj, L.sf]) { g.fillStyle = 'rgba(30,14,6,.2)'; ell(g, x + 2, L.sy + 2, L.ss * .3, L.ss * .07); g.fill(); g.fillStyle = '#efe6d2'; ell(g, x, L.sy, L.ss * .28, L.ss * .06); g.fill(); g.strokeStyle = '#c8463a'; g.lineWidth = 1.2; ell(g, x, L.sy, L.ss * .21, L.ss * .042); g.stroke(); }
  if (!held) for (const [who, x] of [['j', L.sj], ['f', L.sf]]) { const sv = served[who]; if (!sv) continue; const k = sm(sv.u); g.globalAlpha = k; glass(g, lerp(L.gx, x, k), lerp(L.gy, L.sy, k), lerp(L.gs, L.ss, k), sv.d, t, sv.frac); g.globalAlpha = 1; }
  /* the glass she is making, and whatever is being poured */
  if (phase === 'make') { g.fillStyle = '#efe6d2'; rr(g, L.gx - L.gs * .3, L.gy - L.gs * .02, L.gs * .6, L.gs * .06, L.gs * .012); g.fill(); glass(g, L.gx, L.gy - L.gs * .04, L.gs, D, t);
    if (pour) { const q = ING[pour.id], k = sm(clamp(pour.t / .2, 0, 1)) * (1 - sm(clamp((pour.t - .65) / .2, 0, 1))), kind = kindOf(D), sh = SHAPE[kind], topY = L.gy - L.gs * .04 + sh.top * L.gs, bx = L.gx + L.gs * .42, by = topY - L.gs * .2;
      if (q.squeeze) { bottle(g, L.gx, by + L.gs * .02, L.gs * .8, q, 0); g.fillStyle = `rgba(${q.col},.9)`; for (let i = 0; i < 4; i++) { const uu = (pour.t * 2.2 + i / 4) % 1; g.beginPath(); g.ellipse(L.gx + (i - 1.5) * L.gs * .04, lerp(by + L.gs * .06, topY + L.gs * .3, uu), L.gs * .014, L.gs * .026, 0, 0, TAU); g.fill(); } }
      else { g.strokeStyle = `rgba(${q.col},${Math.max(.6, q.a)})`; g.lineWidth = L.gs * .028 * k; g.lineCap = 'round'; if (k > .05) { g.beginPath(); g.moveTo(bx - L.gs * .36, by - L.gs * .06); g.quadraticCurveTo(L.gx, by - L.gs * .04, L.gx, topY + L.gs * .32); g.stroke(); } bottle(g, bx, by, L.gs * .62, q, lerp(-.4, -1.85, k)); } } }
  for (const q of parts) { if (q.hic) { const x = L.px + L.pw * q.hic + (q.hic < .5 ? 1 : -1) * L.ph * .16, y = L.py + L.ph * .2 - (1.1 - q.life) * 22; g.globalAlpha = clamp(q.life * 2, 0, 1); g.font = `700 ${L.land ? 15 : 13}px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText('hic!').width + 20; g.fillStyle = '#fbf3df'; rr(g, x - w / 2, y - 13, w, 26, 13); g.fill(); g.fillStyle = '#2c2a3d'; g.fillText('hic!', x, y + 1); g.globalAlpha = 1; continue; } g.fillStyle = `rgba(255,236,170,${clamp(q.life, 0, 1)})`; g.beginPath(); g.arc(q.x, q.y, 1.6 + q.life * 2, 0, TAU); g.fill(); }
  if (!$('zbust').hidden && !G.RM) { g.fillStyle = Math.sin(t * 9) > 0 ? 'rgba(230,50,60,.2)' : 'rgba(60,90,240,.2)'; g.fillRect(0, 0, VW, VH); }
  G.paper(g, .32);
}
for (const b of document.querySelectorAll('#ztabs button')) b.addEventListener('click', () => { if (phase !== 'make' || tab === b.dataset.tab) return; tab = b.dataset.tab; D = empty(tab); pour = null; render(); });
$('zserve').addEventListener('click', serve); $('zclear').addEventListener('click', () => { if (phase === 'make') { D = empty(tab); pour = null; render(); } });
$('zmore').addEventListener('click', again); $('zjail').addEventListener('click', () => { drunk = 0; G.go('jail', { arrested: true }); }); $('zback').addEventListener('click', () => G.go('map')); $('zleave').addEventListener('click', () => G.go('map'));
const soundLabel = () => { $('zsound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('zsound').setAttribute('aria-pressed', G.sound); };
$('zsound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
G.scenes.bar = {
  frame, resize: layout,
  enter() { active = true; $('zui').hidden = false; soundLabel(); D = empty(tab); served = { j: null, f: null }; phase = 'make'; pour = null; glad = null; parts = []; $('zend').hidden = true; $('zbust').hidden = true; layout(); render(); if (document.fonts && document.fonts.load) { document.fonts.load('italic 600 20px Fraunces').then(() => { if (active) layout(); }).catch(() => { /* the fallback serif is fine */ }); document.fonts.load('700 14px Nunito'); } },
  leave() { active = false; $('zend').hidden = true; $('zbust').hidden = true; $('zui').hidden = true; },
  debug: { add, serve, get drunk() { return drunk; }, get D() { return D; }, get L() { return L; }, get phase() { return phase; }, get served() { return served; } }
};
})();
