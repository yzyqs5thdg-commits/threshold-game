/* The two of them, drawn in one place so they are the same people in every room:
   large heads, big eyes with a highlight, blush, a soft fringe and long full hair. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { TAU, R, dab } = G;
const WHO = {
  /* Jana: fair skin, long wavy brown hair with lighter streaks */
  j: { skin: '#f8d8c0', shade: '#e3ae90', hair: '#6d422a', hairD: '#4c2c1c', hi: 'rgba(210,156,100,.9)', brow: '#4c2c1c', eye: '#5c3722', lip: '#d8697a', blush: '242,128,128', wave: 1 },
  /* her friend: warm brown skin, long straight black hair */
  f: { skin: '#dcab82', shade: '#bf8760', hair: '#201c26', hairD: '#100e14', hi: 'rgba(124,116,150,.8)', brow: '#201c26', eye: '#33211c', lip: '#b9505e', blush: '226,104,100', wave: .22 }
};
const OUT = {
  coat: { j: { top: '#27305a', dark: '#1a2144', leg: '#2b3350', shoe: '#f4f0e6', trim: '#f4ead6' }, f: { top: '#cdb48e', dark: '#a98f69', leg: '#26262e', shoe: '#3a2c20', trim: '#a98f69' } },
  run: { j: { top: '#6a3058', dark: '#4f2244', leg: '#55264a', shoe: '#2a2a32', trim: '#f4ead6' }, f: { top: '#2c2c36', dark: '#1a1a22', leg: '#22222a', shoe: '#2a2a32', trim: '#f4ead6' } },
  skirt: { j: { top: '#f6eede', dark: '#e2d5bc', leg: '#f8d8c0', shoe: '#f4f0e6', trim: '#f6eede' }, f: { top: '#fdfbf4', dark: '#e6e0d0', leg: '#dcab82', shoe: '#f4f0e6', trim: '#fdfbf4' } }
};
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };
const LASH = '#2a1a1c';
/* Jana's wardrobe. Every outfit is one she really wears; 'auto' lets each place dress her. */
const JOUT = [
  { id: 'auto', name: 'Whatever suits the place', sw: '#fbf3df' },
  { id: 'navy', name: 'Navy coat, cream collar', kind: 'coat', collar: true, c: OUT.coat.j },
  { id: 'sweater', name: 'Green knit sweater', kind: 'top', knit: true, c: { top: '#2b5f4f', dark: '#1b4034', leg: '#3d4f73', shoe: '#f4f0e6' } },
  { id: 'red', name: 'Red off-shoulder top', kind: 'top', off: true, c: { top: '#c0262e', dark: '#96181f', leg: '#2a2a32', shoe: '#3a2c20' } },
  { id: 'lace', name: 'White lace blouse', kind: 'top', lace: true, c: { top: '#fbf8f0', dark: '#e2dccc', leg: '#5a5a66', shoe: '#3a2c20' } },
  { id: 'tank', name: 'Black tank and jeans', kind: 'top', bare: true, c: { top: '#1f1f25', dark: '#121216', leg: '#3a3a44', shoe: '#3a2c20' } },
  { id: 'floral', name: 'Floral skirt, cream top', kind: 'skirt', c: OUT.skirt.j },
  { id: 'blue', name: 'Blue party dress', kind: 'dress', bare: true, c: { top: '#2446c8', dark: '#1a34a0', leg: '#f8d8c0', shoe: '#22222a' } },
  { id: 'vest', name: 'Green vest', kind: 'top', bare: true, buttons: true, c: { top: '#b9c838', dark: '#96a428', leg: '#2a2a32', shoe: '#3a2c20' } },
  { id: 'leather', name: 'Burgundy leather jacket', kind: 'top', jacket: true, c: { top: '#5a2638', dark: '#40182a', leg: '#6a6a74', shoe: '#3a2c20' } },
  { id: 'leopard', name: 'Leopard coat', kind: 'coat', spots: true, c: { top: '#c99a5a', dark: '#a87c40', leg: '#2a2a32', shoe: '#3a2c20', trim: '#c99a5a' } },
  { id: 'snow', name: 'Black coat, white scarf', kind: 'coat', scarf: true, c: { top: '#22222a', dark: '#15151b', leg: '#e9e2d0', shoe: '#22222a', trim: '#22222a' } },
  { id: 'plum', name: 'Plum running set', kind: 'top', c: OUT.run.j }
];
const WARD = {
  outfit: JOUT,
  hair: [{ id: 'wavy', name: 'Down and wavy' }, { id: 'straight', name: 'Down and straight' }, { id: 'pony', name: 'Ponytail' }, { id: 'bun', name: 'Bun' }, { id: 'braid', name: 'Braid' }],
  shades: [{ id: 'off', name: 'No sunglasses' }, { id: 'on', name: 'Sunglasses pushed up' }],
  mascara: [{ id: 'black', name: 'Black', sw: '#2a1a1c' }, { id: 'blue', name: 'Blue', sw: '#2a5be8' }],
  lips: [{ id: 'pink', name: 'Soft pink', sw: '#d8697a' }, { id: 'red', name: 'Red', sw: '#c81e2c' }, { id: 'berry', name: 'Berry', sw: '#8e2a4a' }],
  blush: [{ id: 'soft', name: 'Soft' }, { id: 'rosy', name: 'Rosy' }],
  liner: [{ id: 'none', name: 'No liner' }, { id: 'wing', name: 'Winged liner' }]
};
const LOOKJ = { outfit: 'auto', hair: 'wavy', shades: 'off', mascara: 'black', lips: 'pink', blush: 'soft', liner: 'none' };
try { const sv = JSON.parse(localStorage.getItem('jana-look') || 'null'); if (sv) for (const key in LOOKJ) if (WARD[key].some(q => q.id === sv[key])) LOOKJ[key] = sv[key]; } catch (e) { /* she starts with the default look */ }
function setLook(key, id) { if (!WARD[key] || !WARD[key].some(q => q.id === id)) return; LOOKJ[key] = id; try { localStorage.setItem('jana-look', JSON.stringify(LOOKJ)); } catch (e) { /* it still applies for this visit */ } }
const chosen = () => (LOOKJ.outfit === 'auto' ? null : JOUT.find(q => q.id === LOOKJ.outfit));
const makeup = who => (who === 'j' ? { lash: LOOKJ.mascara === 'blue' ? '#2a5be8' : LASH, blue: LOOKJ.mascara === 'blue', wing: LOOKJ.liner === 'wing', lip: WARD.lips.find(q => q.id === LOOKJ.lips).sw, bold: LOOKJ.lips !== 'pink', blush: LOOKJ.blush === 'rosy' ? 1.7 : 1 } : { lash: LASH, lip: WHO.f.lip, blush: 1 });

function eye(g, x, y, rx, ry, k, mode, out, m, gz = 0, gy = 0) {
  g.lineCap = 'round'; const lw = m.blue ? 1.15 : 1;
  const lashes = (cy, ry2, a0) => { g.strokeStyle = m.lash; g.lineWidth = Math.max(.7, rx * .17); for (let i = 0; i < 3; i++) { const a = a0 + out * (.42 + i * .36), px = x + Math.sin(a) * rx * 1.22, py = cy - Math.cos(a) * ry2; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.sin(a + out * .25) * rx * .5, py - Math.cos(a + out * .25) * ry * .34); g.stroke(); } };
  if (m.wing && mode !== 'blink') { g.strokeStyle = LASH; g.lineWidth = Math.max(1, rx * .36); g.beginPath(); g.moveTo(x + out * rx * 1.05, y - ry * (mode === 'happy' ? -.1 : .02)); g.lineTo(x + out * rx * 2.05, y - ry * .62); g.stroke(); }
  if (mode === 'happy') { g.strokeStyle = m.lash; g.lineWidth = Math.max(1.1, rx * .52) * lw; g.beginPath(); g.arc(x, y + ry * .5, rx * 1.2, Math.PI * 1.13, Math.PI * 1.87); g.stroke(); if (m.blue) lashes(y + ry * .5, rx * 1.2, 0); return; }
  if (mode === 'blink') { g.strokeStyle = m.lash; g.lineWidth = Math.max(1, rx * .45) * lw; g.beginPath(); g.arc(x, y - ry * .55, rx * 1.2, Math.PI * .17, Math.PI * .83); g.stroke(); return; }
  g.fillStyle = '#fffdf8'; ell(g, x, y, rx * 1.14, ry * 1.04); g.fill();
  const ox = gz * rx * .46, oy = gy * ry * .3; g.fillStyle = k.eye; ell(g, x + ox, y + ry * .06 + oy, rx * (.92 - Math.abs(gz) * .12), ry * (.93 - Math.abs(gy) * .14)); g.fill();
  g.fillStyle = '#1c1114'; ell(g, x + ox * 1.3, y + ry * .12 + oy * 1.4, rx * .5, ry * .55); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x - rx * .32 + ox, y - ry * .36 + oy, rx * .38, 0, TAU); g.fill(); g.globalAlpha = .8; g.beginPath(); g.arc(x + rx * .36 + ox, y + ry * .44 + oy, rx * .18, 0, TAU); g.fill(); g.globalAlpha = 1;
  g.strokeStyle = m.lash; g.lineWidth = Math.max(1, rx * .42) * lw; g.beginPath(); g.ellipse(x, y, rx * 1.18, ry * 1.08, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  g.lineWidth = Math.max(.8, rx * .3) * lw; g.beginPath(); g.moveTo(x + out * rx * 1.12, y - ry * .22); g.lineTo(x + out * rx * 1.55, y - ry * .55); g.stroke();
  if (m.blue) lashes(y, ry * 1.08, 0);
}
function mouth(g, x, y, w, k, expr, m) {
  g.lineCap = 'round';
  if (expr === 'joy') { g.fillStyle = '#9c2f46'; g.beginPath(); g.moveTo(x - w, y - w * .25); g.quadraticCurveTo(x, y + w * 2, x + w, y - w * .25); g.closePath(); g.fill(); g.fillStyle = '#f2909a'; ell(g, x, y + w * .62, w * .5, w * .3); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - w * .62, y - w * .25, w * 1.24, w * .3); return; }
  if (expr === 'kiss' || expr === 'pout') { const rx = w * (expr === 'kiss' ? .5 : .78), ry = w * (expr === 'kiss' ? .6 : .46); g.fillStyle = m.lip; ell(g, x, y + w * .1, rx, ry); g.fill(); g.strokeStyle = 'rgba(90,20,36,.55)'; g.lineWidth = Math.max(.7, w * .14); g.beginPath(); g.moveTo(x - rx * .62, y + w * .1); g.quadraticCurveTo(x, y + w * .26, x + rx * .62, y + w * .1); g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; ell(g, x - rx * .3, y - ry * .3, rx * .26, ry * .2); g.fill(); return; }
  if (expr === 'o') { g.fillStyle = '#9c2f46'; ell(g, x, y + w * .2, w * .46, w * .6); g.fill(); g.strokeStyle = m.lip; g.lineWidth = Math.max(.8, w * .2); g.stroke(); return; }
  if (expr === 'grin') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - w * 1.15, y - w * .3); g.quadraticCurveTo(x, y + w * 1.5, x + w * 1.15, y - w * .3); g.quadraticCurveTo(x, y + w * .1, x - w * 1.15, y - w * .3); g.closePath(); g.fill(); g.strokeStyle = m.lip; g.lineWidth = Math.max(1, w * .3) * (m.bold ? 1.3 : 1); g.lineJoin = 'round'; g.stroke(); return; }
  if (expr === 'tongue') { g.fillStyle = '#f2849a'; g.beginPath(); g.roundRect(x - w * .46, y + w * .1, w * .92, w * 1.15, [0, 0, w * .46, w * .46]); g.fill(); g.strokeStyle = 'rgba(160,50,80,.6)'; g.lineWidth = Math.max(.7, w * .12); g.beginPath(); g.moveTo(x, y + w * .3); g.lineTo(x, y + w * .86); g.stroke(); }
  const sk = expr === 'smirk' ? w * .3 : 0;
  g.strokeStyle = m.lip; g.lineWidth = Math.max(1, w * .36) * (m.bold ? 1.5 : 1); g.beginPath(); g.arc(x + sk, y - w * .7, w * 1.15, Math.PI * (sk ? .14 : .2), Math.PI * (sk ? .7 : .8)); g.stroke();
}
/* hair worn other ways */
function braid(g, x, y, r, len, k, hc) { const n = Math.max(4, Math.round(len / (r * .4))); for (let i = 0; i < n; i++) { const u = i / n, w = r * (.34 - .12 * u); g.fillStyle = i % 2 ? k.hairD : hc; g.beginPath(); g.ellipse(x + (i % 2 ? 1 : -1) * w * .28, y + i * r * .38, w, r * .27, i % 2 ? .55 : -.55, 0, TAU); g.fill(); } const ey = y + n * r * .38; g.fillStyle = '#e8709c'; g.beginPath(); g.arc(x, ey - r * .1, r * .13, 0, TAU); g.fill(); g.fillStyle = hc; g.beginPath(); g.moveTo(x - r * .14, ey); g.lineTo(x + r * .14, ey); g.lineTo(x, ey + r * .42); g.fill(); }
/* sunglasses worn over the eyes, seen from the front */
function worn(g, r) { g.fillStyle = '#141318'; for (const d of [-1, 1]) { g.beginPath(); g.roundRect(d * r * .4 - r * .33, -r * .1, r * .66, r * .46, [r * .12, r * .12, r * .2, r * .2]); g.fill(); } g.fillRect(-r * .1, -r * .02, r * .2, r * .08); g.strokeStyle = '#141318'; g.lineWidth = r * .07; g.beginPath(); g.moveTo(-r * .73, r * .02); g.lineTo(-r * .92, -r * .04); g.moveTo(r * .73, r * .02); g.lineTo(r * .92, -r * .04); g.stroke(); g.fillStyle = 'rgba(255,255,255,.3)'; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * r * .4 - r * .24, -r * .04); g.lineTo(d * r * .4 - r * .06, -r * .04); g.lineTo(d * r * .4 - r * .2, r * .14); g.lineTo(d * r * .4 - r * .27, r * .14); g.fill(); } }
function shades(g, x, y, r, tilt) { g.save(); g.translate(x, y); g.rotate(tilt); g.fillStyle = '#17161a'; g.beginPath(); g.roundRect(-r * .5, -r * .14, r * .46, r * .28, r * .1); g.roundRect(r * .04, -r * .14, r * .46, r * .28, r * .1); g.fill(); g.fillRect(-r * .06, -r * .05, r * .12, r * .06); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-r * .44, -r * .1, r * .16, r * .05); g.fillRect(r * .1, -r * .1, r * .16, r * .05); g.restore(); }
function helmet(g, r, cx0) {
  g.fillStyle = '#f0622c'; g.beginPath(); g.ellipse(cx0, -r * .3, r * 1.14, r * .92, 0, Math.PI, 0); g.fill(); g.fillStyle = '#d2501e'; g.beginPath(); g.roundRect(cx0 - r * 1.16, -r * .36, r * 2.32, r * .2, r * .1); g.fill();
  g.fillStyle = 'rgba(255,255,255,.3)'; ell(g, cx0 - r * .4, -r * .8, r * .3, r * .14); g.fill();
}

/* every head brings its own neck, drawn over the hair that hangs behind it and under the chin */
function neck(g, k, x, r) {
  g.fillStyle = k.skin; g.beginPath(); g.roundRect(x - r * .27, r * .66, r * .54, r * .82, [0, 0, r * .2, r * .2]); g.fill();
  g.fillStyle = k.shade; g.globalAlpha = .55; g.fillRect(x - r * .27, r * .9, r * .54, r * .2); g.globalAlpha = 1;
}

/* three-quarter head, looking right. o: r, expr (smile | joy | yum), blink, flow, len, up, helmet, t, hairCol */
function head(g, who, o = {}) {
  const k = WHO[who], r = o.r || 17, t = o.t == null ? G.time : o.t, expr = o.expr || 'smile', hc = o.hairCol || k.hair;
  const mode = expr === 'smile' ? (o.blink ? 'blink' : 'open') : 'happy';
  g.save(); if (o.x != null) g.translate(o.x, o.y); if (o.tilt) g.rotate(o.tilt); g.lineCap = 'round'; g.lineJoin = 'round';
  const m = makeup(who), mine = who === 'j' && !o.helmet && !o.mask, st = o.up ? 'up' : mine ? LOOKJ.hair : 'down', hp = { col: hc, dark: k.hairD, hi: k.hi, lo: 'rgba(0,0,0,.25)', t: t + (who === 'f' ? 1.3 : 0) };
  if (st === 'up') { g.fillStyle = hc; ell(g, -r * .82, -r * .7, r * .46, r * .44); g.fill(); }
  else if (st === 'bun') { g.fillStyle = hc; ell(g, -r * .56, -r * 1.02, r * .54, r * .5); g.fill(); g.strokeStyle = k.hi; g.lineWidth = Math.max(.8, r * .07); g.beginPath(); g.arc(-r * .56, -r * 1.02, r * .32, 3.6, 5.6); g.stroke(); }
  else if (st === 'pony') G.hair(g, -r * .9, -r * .52, Object.assign({ len: (o.len || r * 3.3) * .82, w: r * .42, flow: Math.max(.1, (o.flow || 0) * 1.5), hang: .12, curl: 1.15, wave: .35 }, hp));
  else if (st === 'braid') braid(g, -r * .62, r * .46, r, (o.len || r * 3.3) * .8, k, hc);
  else G.hair(g, -r * .4, -r * .3, Object.assign({ len: o.len || r * 3.3, w: r * .68, flow: o.flow || 0, hang: o.hang == null ? .04 : o.hang, curl: st === 'straight' ? .16 : o.curl == null ? .32 : o.curl, wave: st === 'straight' ? .08 : k.wave }, hp));
  g.fillStyle = hc; ell(g, -r * .14, -r * .1, r * 1.07, r * 1.1); g.fill();
  neck(g, k, r * .16, r);
  g.fillStyle = k.skin; ell(g, r * .1, r * .08, r * .9, r * .93); g.fill();
  /* blush, eyes, brows, nose, mouth */
  const bl = Math.min(.86, (expr === 'yum' ? .62 : .42) * m.blush); g.fillStyle = `rgba(${k.blush},${bl})`; ell(g, r * .15, r * .5, r * (expr === 'yum' ? .26 : .21), r * .12); g.fill(); ell(g, r * .73, r * .46, r * .13, r * .1); g.fill();
  eye(g, r * .2, r * .13, r * .155, r * .23, k, mode, -1, m); eye(g, r * .7, r * .11, r * .11, r * .21, k, mode, 1, m);
  g.strokeStyle = k.brow; g.lineWidth = Math.max(.9, r * .06); g.beginPath(); g.moveTo(r * .03, -r * .22); g.quadraticCurveTo(r * .2, -r * .33, r * .38, -r * .25); g.moveTo(r * .6, -r * .27); g.quadraticCurveTo(r * .72, -r * .33, r * .83, -r * .25); g.stroke();
  g.strokeStyle = k.shade; g.lineWidth = Math.max(.8, r * .05); g.beginPath(); g.moveTo(r * .52, r * .3); g.quadraticCurveTo(r * .6, r * .38, r * .52, r * .4); g.stroke();
  mouth(g, r * .47, r * .6, r * .13, k, expr === 'joy' ? 'joy' : 'smile', m);
  /* the fringe: a centre part, a short lock on the far side, a long one framing the near cheek */
  g.fillStyle = hc; g.beginPath(); g.moveTo(r * .34, -r);
  g.bezierCurveTo(r * .78, -r * .98, r * 1.05, -r * .5, r * .99, -r * .02); g.quadraticCurveTo(r * .86, -r * .42, r * .5, -r * .6);
  g.quadraticCurveTo(r * .2, -r * .5, -r * .02, -r * .12); g.quadraticCurveTo(-r * .2, r * .3, -r * .3, r * .84);
  g.quadraticCurveTo(-r * .62, r * .64, -r * .9, r * .68); g.bezierCurveTo(-r * 1.2, r * .2, -r * 1.22, -r * .6, -r * .7, -r);
  g.bezierCurveTo(-r * .4, -r * 1.2, r * .1, -r * 1.14, r * .34, -r); g.closePath(); g.fill();
  g.strokeStyle = k.hi; g.lineWidth = Math.max(1, r * .09); g.beginPath(); g.moveTo(r * .18, -r * .94); g.quadraticCurveTo(-r * .36, -r * .5, -r * .5, r * .5); g.stroke();
  g.lineWidth = Math.max(.8, r * .06); g.beginPath(); g.moveTo(r * .5, -r * .92); g.quadraticCurveTo(r * .86, -r * .6, r * .92, -r * .2); g.moveTo(-r * .3, -r * .96); g.quadraticCurveTo(-r * .86, -r * .5, -r * .86, r * .3); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = r * .14; g.beginPath(); g.ellipse(-r * .26, -r * .3, r * .72, r * .62, 0, Math.PI * 1.14, Math.PI * 1.58); g.stroke();
  if (o.ear !== false && !o.helmet) { if (who === 'j') { g.fillStyle = '#f2cf62'; g.beginPath(); g.arc(-r * .44, r * .92, r * .1, 0, TAU); g.fill(); } else { g.strokeStyle = '#f2cf62'; g.lineWidth = Math.max(1, r * .07); g.beginPath(); g.arc(-r * .44, r * .98, r * .15, 0, TAU); g.stroke(); } }
  if (st === 'pony') { g.fillStyle = '#e8709c'; g.beginPath(); g.arc(-r * .98, -r * .5, r * .15, 0, TAU); g.fill(); }
  if (mine && LOOKJ.shades === 'on') shades(g, r * .36, -r * .9, r, -.14);
  if (o.helmet) helmet(g, r, -r * .05);
  g.restore();
}

/* long hair worn down, for a close look: two curtains with waved edges, loose ends and strands. The path arrives at the right temple. */
function longHair(g, r, len, wv, k, hc) {
  const y0 = -r * .2, N = 30, c01 = v => Math.max(0, Math.min(1, v)), mixx = (a, b, f) => a + (b - a) * f;
  const out = (d, y) => { const u = c01((y - y0) / (len - y0)); return d * r * (1.03 + .2 * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (.45 + .55 * wv) + wv * .13 * Math.sin(y / r * 3.3 + (d > 0 ? .6 : 2.3)) * Math.min(1, u * 2.2)); };
  const inn = (d, y) => { const u = c01((y - r * .8) / (len - r * .8)); return d * r * (.28 + .44 * Math.pow(u, .8) + wv * .1 * Math.sin(y / r * 3.3 + (d > 0 ? 1.5 : 3.1)) * u); };
  const ends = (d, a, b) => { g.quadraticCurveTo(mixx(a, b, .22), len + r * .2, mixx(a, b, .5), len - r * .03); g.quadraticCurveTo(mixx(a, b, .78), len + r * .15, b, len - r * .1); };
  for (let i = 1; i <= N; i++) { const y = y0 + (len - y0) * i / N; g.lineTo(out(1, y), y); }
  ends(1, out(1, len), inn(1, len)); for (let i = N - 1; i >= 0; i--) { const y = r * .8 + (len - r * .9) * i / N; g.lineTo(inn(1, y), y); }
  for (let i = 0; i <= N; i++) { const y = r * .8 + (len - r * .9) * i / N; g.lineTo(inn(-1, y), y); }
  ends(-1, inn(-1, len), out(-1, len)); for (let i = N - 1; i >= 0; i--) { const y = y0 + (len - y0) * i / N; g.lineTo(out(-1, y), y); }
  g.closePath(); g.fill();
  for (const d of [-1, 1]) for (const [f, col, lw, a, ys] of [[.16, k.hairD, .09, .55, 1.0], [.4, k.hi, .045, .8, .3], [.6, k.hairD, .04, .45, .5], [.8, k.hi, .035, .6, .8]]) {
    g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = Math.max(.8, r * lw); g.beginPath(); for (let i = 0; i <= N; i++) { const y = r * ys + (len * .97 - r * ys) * i / N, x = mixx(y < r * .8 ? d * r * .5 : inn(d, y), out(d, y), f); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
  g.globalAlpha = 1;
}
/* the same face, seen from the front. o: r, expr, blink, len, up, helmet, mask, hairCol, and for the photo booth:
   rich (fuller long hair), ponyLeft, tilt, eyes [left, right] (open | happy | blink), gaze -1..1, gy (up -1, down 1), mouth (kiss | pout | o | grin | tongue | smirk), worn (sunglasses on) */
function headFront(g, who, o = {}) {
  const k = WHO[who], r = o.r || 14, expr = o.expr || 'smile', hc = o.hairCol || k.hair, len = o.len || r * 2.4, m = makeup(who), mine = who === 'j' && !o.helmet && !o.mask, st = o.up ? 'bun' : mine ? LOOKJ.hair : 'down', tied = st === 'bun' || st === 'pony' || st === 'braid', wv = st === 'straight' ? .08 : k.wave;
  const mode = expr === 'smile' ? (o.blink ? 'blink' : 'open') : 'happy';
  g.save(); if (o.x != null) g.translate(o.x, o.y); if (o.tilt) { g.translate(0, r * 1.3); g.rotate(o.tilt); g.translate(0, -r * 1.3); } g.lineCap = 'round'; g.lineJoin = 'round';
  if (st === 'pony') { g.save(); if (o.ponyLeft) g.scale(-1, 1); const tail = () => { g.beginPath(); g.moveTo(r * .5, -r * .98); g.bezierCurveTo(r * .9, -r * 1.36, r * 1.5, -r * 1.2, r * 1.72, -r * .5); g.bezierCurveTo(r * 1.96, r * .3, r * 1.9, r * 1.2, r * 1.5, r * 1.95); g.quadraticCurveTo(r * 1.5, r * 1.5, r * 1.3, r * 1.3); g.bezierCurveTo(r * 1.36, r * .6, r * 1.2, r * .1, r * .9, -r * .3); g.closePath(); };
    g.fillStyle = hc; tail(); g.fill(); g.strokeStyle = k.hairD; g.globalAlpha = .5; g.lineWidth = Math.max(.8, r * .05); g.beginPath(); g.moveTo(r * 1.0, -r * .86); g.bezierCurveTo(r * 1.5, -r * .3, r * 1.56, r * .6, r * 1.42, r * 1.5); g.stroke(); g.globalAlpha = 1;
    g.strokeStyle = k.hi; g.lineWidth = Math.max(.9, r * .07); g.beginPath(); g.moveTo(r * 1.1, -r * 1.06); g.bezierCurveTo(r * 1.66, -r * .6, r * 1.8, r * .5, r * 1.6, r * 1.5); g.stroke(); g.fillStyle = '#e8709c'; g.beginPath(); g.ellipse(r * .82, -r * 1.02, r * .13, r * .2, -.5, 0, TAU); g.fill(); g.restore(); }
  if (st === 'braid') braid(g, -r * .78, r * .62, r, Math.max(len, r * 2.2) * .8, k, hc);
  g.fillStyle = hc; g.beginPath(); g.moveTo(-r * 1.03, -r * .2); g.bezierCurveTo(-r * 1.12, -r * 1.32, r * 1.12, -r * 1.32, r * 1.03, -r * .2);
  if (tied) { g.bezierCurveTo(r * 1.06, r * .4, r * .9, r * .62, r * .6, r * .7); g.lineTo(-r * .6, r * .7); g.bezierCurveTo(-r * .9, r * .62, -r * 1.06, r * .4, -r * 1.03, -r * .2); g.fill(); if (st === 'bun') { ell(g, 0, -r * 1.18, r * .52, r * .44); g.fill(); } }
  else if (o.rich) longHair(g, r, len, wv, k, hc);
  else { g.bezierCurveTo(r * (1.16 + .1 * wv), r * .6, r * (.94 - .1 * wv), len * .6, r * 1.06, len);
    if (len > r * 1.15) { g.quadraticCurveTo(r * .8, len + r * .14, r * .56, len - r * .06); g.bezierCurveTo(r * .62, len * .7, r * .3, r * 1.5, r * .27, r * .8); g.lineTo(-r * .27, r * .8); g.bezierCurveTo(-r * .3, r * 1.5, -r * .62, len * .7, -r * .56, len - r * .06); g.quadraticCurveTo(-r * .8, len + r * .14, -r * 1.06, len); }
    else g.quadraticCurveTo(0, len + r * .22, -r * 1.06, len);
    g.bezierCurveTo(-r * (.94 - .1 * wv), len * .6, -r * (1.16 + .1 * wv), r * .6, -r * 1.03, -r * .2); g.fill();
    g.strokeStyle = k.hi; g.lineWidth = Math.max(1, r * .1); for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * r * .96, r * .2); g.bezierCurveTo(d * r * (1.04 + .1 * wv), r * .8, d * r * (.82 - .08 * wv), len * .6, d * r * .9, len * .92); g.stroke(); } }
  neck(g, k, 0, r);
  g.fillStyle = k.skin; ell(g, 0, r * .06, r * .9, r * .94); g.fill();
  if (!o.mask) {
    g.fillStyle = `rgba(${k.blush},${Math.min(.86, .42 * m.blush)})`; for (const d of [-1, 1]) { ell(g, d * r * .5, r * .47, r * .2, r * .12); g.fill(); }
    if (!o.worn) for (const d of [-1, 1]) eye(g, d * r * .38, r * .12, r * .15, r * .22, k, o.eyes ? o.eyes[d < 0 ? 0 : 1] : mode, d, m, o.gaze || 0, o.gy || 0);
    g.strokeStyle = k.brow; g.lineWidth = Math.max(.9, r * .06); for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * r * .2, -r * .24); g.quadraticCurveTo(d * r * .38, -r * .34, d * r * .56, -r * .24); g.stroke(); }
  } else { g.fillStyle = `rgba(${k.blush},.42)`; for (const d of [-1, 1]) { ell(g, d * r * .56, r * .52, r * .16, r * .1); g.fill(); } }
  g.strokeStyle = k.shade; g.lineWidth = Math.max(.8, r * .05); g.beginPath(); g.moveTo(-r * .05, r * .36); g.quadraticCurveTo(0, r * .42, r * .05, r * .36); g.stroke();
  mouth(g, 0, r * .6, r * .14, k, o.mouth || (expr === 'joy' ? 'joy' : 'smile'), m);
  /* curtain fringe from a centre part */
  g.fillStyle = hc; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(0, -r * 1.02); g.bezierCurveTo(d * r * .7, -r * 1.12, d * r * 1.14, -r * .5, d * r * 1.04, r * .3); g.quadraticCurveTo(d * r * .98, r * .62, d * r * .8, r * .8); g.quadraticCurveTo(d * r * .7, r * .1, d * r * .22, -r * .5); g.quadraticCurveTo(d * r * .06, -r * .62, 0, -r * .66); g.closePath(); g.fill(); }
  g.strokeStyle = k.hi; g.lineWidth = Math.max(.9, r * .08); for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * r * .12, -r * .94); g.quadraticCurveTo(d * r * .8, -r * .7, d * r * .92, r * .3); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = r * .14; g.beginPath(); g.ellipse(0, -r * .28, r * .8, r * .66, 0, Math.PI * 1.2, Math.PI * 1.8); g.stroke();
  if (o.worn) worn(g, r);
  if (mine && LOOKJ.shades === 'on') shades(g, 0, -r * .9, r, 0);
  if (o.helmet) helmet(g, r, 0);
  if (o.mask) { g.fillStyle = '#23262c'; g.beginPath(); g.roundRect(-r * .86, -r * .22, r * 1.72, r * .66, r * .24); g.fill(); g.fillStyle = 'rgba(170,220,240,.6)'; for (const d of [-1, 1]) { g.beginPath(); g.roundRect(d * r * .42 - r * .32, -r * .12, r * .64, r * .46, r * .14); g.fill(); } g.fillStyle = 'rgba(255,255,255,.5)'; ell(g, -r * .56, -r * .02, r * .1, r * .06); g.fill(); g.strokeStyle = '#d8e83a'; g.lineWidth = r * .2; g.beginPath(); g.moveTo(r * .92, r * .5); g.lineTo(r * 1.1, -r * 1.3); g.stroke(); }
  g.restore();
}

/* a whole person seen from the side. o: dir, phase, walk 0..1, run, air, cheer, outfit (coat | run | skirt), sc, expr, medal, bib */
function figure(g, x, y, who, o = {}) {
  const k = WHO[who], sp = who === 'j' && !o.colors ? chosen() : null, fit = sp ? (sp.kind === 'coat' ? 'coat' : sp.kind === 'top' ? 'run' : 'skirt') : (o.outfit || 'coat'), c = sp ? sp.c : (o.colors || OUT[fit][who]);
  const t = o.t == null ? G.time : o.t, dir = o.dir || 1, sc = o.sc || 1.3, run = !!o.run, cheer = !!o.cheer, air = !!o.air, bareArm = sp ? !!sp.bare : false, skinFore = fit === 'skirt' || bareArm;
  const walk = cheer ? 0 : run ? 1 : (o.walk || 0), ph = o.phase || 0, moving = run || walk > .05;
  const bob = cheer ? Math.abs(Math.sin(t * 6)) * 3 : moving ? Math.abs(Math.sin(ph)) * 2.2 * walk : Math.sin(t * 1.7) * .6;
  g.save(); g.translate(x, y); g.scale(sc, sc);
  g.fillStyle = 'rgba(40,30,70,.26)'; ell(g, 0, 2, 19, 4.4); g.fill();
  g.scale(dir, 1); g.translate(0, -bob); g.rotate(run && !cheer ? .1 : .03 * walk); g.lineCap = 'round'; g.lineJoin = 'round';
  const leg = (p, col, front) => {
    let th, bend;
    if (cheer) { th = front ? .08 : -.08; bend = 0; } else if (air) { th = front ? .9 : -.5; bend = 1.1; } else if (run) { th = .9 * Math.sin(p); bend = .3 + Math.max(0, Math.cos(p + .4)); } else { th = .5 * Math.sin(p) * walk; bend = .75 * Math.max(0, Math.cos(p)) * walk; }
    const kx = Math.sin(th) * 19, ky = -38 + Math.cos(th) * 19, fx = kx + Math.sin(th - bend) * 19, fy = ky + Math.cos(th - bend) * 19;
    g.strokeStyle = col; g.lineWidth = fit === 'skirt' ? 5.6 : 7.6; g.beginPath(); g.moveTo(0, -38); g.lineTo(kx, ky); g.lineTo(fx, fy); g.stroke();
    g.save(); g.translate(fx, fy); g.rotate(-(th - bend) * .7); g.fillStyle = c.shoe; g.beginPath(); g.ellipse(3.4, .6, 8, 4.6, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-4, 3.2, 15, 1.6); g.restore();
  };
  const arm = (p, col, side) => {
    let a, f;
    if (cheer) { a = side * 2.3 + Math.sin(t * 9 + side) * .12; f = a; } else if (run) { a = -.9 * Math.sin(p); f = a + 1.4; } else { a = .5 * Math.sin(p) * walk + .05; f = a + .3 * walk + .1; }
    const l1 = cheer ? 18 : 12, l2 = cheer ? 16 : 11, ex = Math.sin(a) * l1, ey = -68 + Math.cos(a) * l1, hx = ex + Math.sin(f) * l2, hy = ey + Math.cos(f) * l2;
    if (side > 0 && !cheer) { g.strokeStyle = 'rgba(20,16,40,.22)'; g.lineWidth = (bareArm ? 5.4 : 6.8) + 1.8; g.beginPath(); g.moveTo(0, -68); g.lineTo(ex, ey); g.lineTo(hx, hy); g.stroke(); }
    g.strokeStyle = bareArm ? (side < 0 ? k.shade : k.skin) : col; g.lineWidth = bareArm ? 5.4 : 6.8; g.beginPath(); g.moveTo(0, -68); g.lineTo(ex, ey); if (!skinFore) g.lineTo(hx, hy); g.stroke();
    if (skinFore) { g.strokeStyle = k.skin; g.lineWidth = 5; g.beginPath(); g.moveTo(ex, ey); g.lineTo(hx, hy); g.stroke(); }
    else if (fit === 'coat' && who === 'j' && (!sp || sp.collar)) { g.strokeStyle = c.trim; g.lineWidth = 7.4; g.beginPath(); g.moveTo(ex + (hx - ex) * .66, ey + (hy - ey) * .66); g.lineTo(hx, hy); g.stroke(); }
    g.fillStyle = k.skin; g.beginPath(); g.arc(hx + Math.sin(f) * 2, hy + Math.cos(f) * 2, 3.4, 0, TAU); g.fill();
  };
  const legCol = fit === 'skirt' ? k.skin : c.leg, hem = Math.sin(ph) * 2.6 * walk;
  leg(ph + Math.PI, fit === 'skirt' ? k.shade : c.dark, false); arm(ph + Math.PI, c.dark, -1); leg(ph, legCol, true);
  g.fillStyle = k.skin; g.fillRect(-2, -85, 8, 14);
  if (fit === 'coat') {
    g.fillStyle = c.top; g.beginPath(); g.moveTo(-8, -75); g.quadraticCurveTo(-10, -52, -15 - hem, -26); g.quadraticCurveTo(0, -21, 14 - hem, -26); g.quadraticCurveTo(9, -52, 8, -75); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(8, -75); g.quadraticCurveTo(9, -52, 14 - hem, -26); g.lineTo(8 - hem, -25); g.quadraticCurveTo(5, -52, 4, -75); g.fill();
    g.fillStyle = 'rgba(0,0,20,.22)'; g.beginPath(); g.moveTo(-8, -75); g.quadraticCurveTo(-10, -52, -15 - hem, -26); g.lineTo(-9 - hem, -25); g.quadraticCurveTo(-5, -52, -4, -75); g.fill();
    if (who === 'j' && (!sp || sp.collar)) { g.fillStyle = c.trim; g.beginPath(); g.moveTo(1, -77); g.lineTo(9, -73); g.lineTo(7, -60); g.lineTo(2, -66); g.closePath(); g.fill(); ell(g, 0.5, -75, 9.5, 5); g.fill(); g.fillStyle = '#f2cf62'; for (const by of [-54, -44]) { g.beginPath(); g.arc(5.5, by, 1.2, 0, TAU); g.fill(); }
      g.strokeStyle = '#9aa0aa'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-6, -73); g.lineTo(8, -46); g.stroke(); g.fillStyle = '#d5d9e0'; g.beginPath(); g.roundRect(1, -49, 13, 10, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(3, -47.5, 8, 1.6); }
    else if (who === 'f') { g.fillStyle = c.dark; ell(g, 0.5, -75, 9, 4.4); g.fill(); g.fillRect(-11, -52, 21, 3.4); }
    else { g.fillStyle = c.dark; ell(g, 0.5, -75, 9, 4.4); g.fill();
      if (sp.spots) { const r = R(77); for (let i = 0; i < 26; i++) { const yy = -70 + r() * 42, half = 7 + (yy + 70) * .14, xx = (r() - .5) * 2 * half; g.fillStyle = '#4a2c16'; g.beginPath(); g.ellipse(xx, yy, 1.9, 1.3, r() * 3, 0, TAU); g.fill(); g.fillStyle = '#8a5a2c'; g.beginPath(); g.arc(xx + .4, yy + .2, .7, 0, TAU); g.fill(); } }
      if (sp.scarf) { g.fillStyle = '#fbf8f0'; ell(g, 0.5, -75, 10.5, 5.6); g.fill(); g.beginPath(); g.roundRect(2, -76, 6.5, 24, 3); g.fill(); g.fillStyle = 'rgba(160,160,180,.3)'; g.fillRect(2, -58, 6.5, 1.2); g.fillRect(2, -64, 6.5, 1.2); } }
  } else if (fit === 'run') {
    g.fillStyle = c.top; g.beginPath(); g.roundRect(-8.5, -76, 17, 40, 7.5); g.fill(); g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.roundRect(3, -74, 4, 34, 2); g.fill();
    if (!sp && o.bib !== false) { g.fillStyle = '#fdfbf4'; g.beginPath(); g.roundRect(-4, -63, 13, 10, 1.5); g.fill(); g.fillStyle = '#17161a'; g.fillRect(-2, -61, 9, 2.6); g.fillStyle = '#4a3a8c'; g.fillRect(-4, -56, 13, 3); }
    if (sp) {
      if (sp.knit) { g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1.2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 3.2, -74); g.lineTo(i * 3.4, -38); g.stroke(); } g.fillStyle = c.dark; g.beginPath(); g.roundRect(-8.5, -41, 17, 5, 2.5); g.fill(); }
      if (sp.off) { g.fillStyle = k.skin; g.beginPath(); g.roundRect(-8.5, -78, 17, 8, [7, 7, 0, 0]); g.fill(); g.fillStyle = c.dark; g.fillRect(-8.5, -71, 17, 2); }
      if (sp.bare) { g.fillStyle = k.skin; g.beginPath(); g.ellipse(1, -76, 5, 4.4, 0, 0, Math.PI); g.fill(); }
      if (sp.lace) { g.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(-6.4 + i * 3.4, -72 + Math.abs(i - 2) * 1.2, 2.3, 0, TAU); g.fill(); g.beginPath(); g.arc(-6.4 + i * 3.4, -37, 2, 0, TAU); g.fill(); } g.strokeStyle = 'rgba(170,160,140,.5)'; g.lineWidth = .8; g.beginPath(); g.moveTo(1, -70); g.lineTo(1, -38); g.stroke(); }
      if (sp.buttons) { g.fillStyle = '#3a3c20'; for (const by of [-62, -54, -46]) { g.beginPath(); g.arc(2.4, by, 1.1, 0, TAU); g.fill(); } }
      if (sp.jacket) { g.fillStyle = '#17161a'; g.beginPath(); g.roundRect(-.5, -75, 6, 38, 2); g.fill(); g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-1, -75); g.lineTo(-3, -58); g.lineTo(-1, -38); g.stroke(); g.fillStyle = c.dark; g.fillRect(-8.5, -41, 8, 4); }
    }
  } else {
    const dress = sp && sp.kind === 'dress'; g.fillStyle = dress ? c.top : '#fbf0c8'; g.beginPath(); g.moveTo(-8, -54); g.quadraticCurveTo(-13, -30, -19 - hem, -9); for (let i = 1; i <= 6; i++) g.lineTo(-19 - hem + i * 6, -9 + (i % 2 ? 3 : 0) - i * .5); g.quadraticCurveTo(11, -32, 8, -54); g.closePath(); g.fill();
    g.save(); g.clip(); if (dress) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(2, -56, 6, 50); g.fillStyle = 'rgba(0,0,30,.2)'; g.fillRect(-22, -56, 10, 50); } const r = R(26); for (let i = 0; i < (dress ? 0 : 16); i++) { const fx = -20 + r() * 38, fy = -50 + r() * 40; dab(g, fx, fy, 2.6, 2.2, r() * 3, r() < .6 ? '#ee8fa0' : '#f6b8a4', .95); dab(g, fx + 3, fy + 2, 2, 1, r() * 3, '#7aa85a', .9); } g.globalAlpha = 1; g.restore();
    g.fillStyle = c.top; g.beginPath(); g.roundRect(-8, -76, 16, 24, 6); g.fill(); if (dress) { g.fillStyle = k.skin; g.beginPath(); g.roundRect(-8, -78, 16, 7, [6, 6, 0, 0]); g.fill(); } else { g.fillStyle = c.dark; g.beginPath(); g.moveTo(4, -56); g.lineTo(12, -52); g.lineTo(9, -46); g.lineTo(3, -52); g.fill(); }
    g.strokeStyle = '#f2cf62'; g.lineWidth = .9; g.beginPath(); g.arc(2, -76, 5, .2 * Math.PI, .8 * Math.PI); g.stroke();
  }
  if (o.medal) { g.strokeStyle = '#e8641c'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-4, -76); g.lineTo(3, -62); g.lineTo(8, -76); g.stroke(); g.fillStyle = '#f2cf62'; g.beginPath(); g.moveTo(3, -67); g.lineTo(9, -61); g.lineTo(3, -55); g.lineTo(-3, -61); g.fill(); g.fillStyle = '#e8641c'; g.fillRect(-1, -62, 8, 2.4); }
  const expr = o.expr || (cheer ? 'joy' : 'smile'), blink = !G.RM && ((t + (who === 'f' ? 1.7 : 0)) % 3.6) < .12;
  if (cheer) arm(ph, c.top, 1);
  head(g, who, { x: 2, y: -96, r: 17, expr, blink, t, flow: cheer ? .04 : run ? (air ? .22 : .28) : .03 + .13 * walk, len: run ? 50 : 0, tilt: cheer ? -.06 : 0 });
  if (!cheer) arm(ph, c.top, 1);
  g.restore();
}
G.people = WHO; G.head = head; G.headFront = headFront; G.figure = figure;
G.wardrobe = WARD; G.look = LOOKJ; G.setLook = setLook; G.janaTop = () => { const sp = chosen(); return sp ? sp.c : null; };
})();
