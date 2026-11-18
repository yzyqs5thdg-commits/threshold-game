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

function eye(g, x, y, rx, ry, k, mode, out) {
  g.lineCap = 'round';
  if (mode === 'happy') { g.strokeStyle = LASH; g.lineWidth = Math.max(1.1, rx * .52); g.beginPath(); g.arc(x, y + ry * .5, rx * 1.2, Math.PI * 1.13, Math.PI * 1.87); g.stroke(); return; }
  if (mode === 'blink') { g.strokeStyle = LASH; g.lineWidth = Math.max(1, rx * .45); g.beginPath(); g.arc(x, y - ry * .55, rx * 1.2, Math.PI * .17, Math.PI * .83); g.stroke(); return; }
  g.fillStyle = '#fffdf8'; ell(g, x, y, rx * 1.14, ry * 1.04); g.fill();
  g.fillStyle = k.eye; ell(g, x, y + ry * .06, rx * .92, ry * .93); g.fill();
  g.fillStyle = '#1c1114'; ell(g, x, y + ry * .12, rx * .5, ry * .55); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x - rx * .32, y - ry * .36, rx * .38, 0, TAU); g.fill(); g.globalAlpha = .8; g.beginPath(); g.arc(x + rx * .36, y + ry * .44, rx * .18, 0, TAU); g.fill(); g.globalAlpha = 1;
  g.strokeStyle = LASH; g.lineWidth = Math.max(1, rx * .42); g.beginPath(); g.ellipse(x, y, rx * 1.18, ry * 1.08, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  g.lineWidth = Math.max(.8, rx * .3); g.beginPath(); g.moveTo(x + out * rx * 1.12, y - ry * .22); g.lineTo(x + out * rx * 1.55, y - ry * .55); g.stroke();
}
function mouth(g, x, y, w, k, expr) {
  g.lineCap = 'round';
  if (expr === 'joy') { g.fillStyle = '#9c2f46'; g.beginPath(); g.moveTo(x - w, y - w * .25); g.quadraticCurveTo(x, y + w * 2, x + w, y - w * .25); g.closePath(); g.fill(); g.fillStyle = '#f2909a'; ell(g, x, y + w * .62, w * .5, w * .3); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - w * .62, y - w * .25, w * 1.24, w * .3); return; }
  g.strokeStyle = k.lip; g.lineWidth = Math.max(1, w * .36); g.beginPath(); g.arc(x, y - w * .7, w * 1.15, Math.PI * .2, Math.PI * .8); g.stroke();
}
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
  if (o.up) { g.fillStyle = hc; ell(g, -r * .82, -r * .7, r * .46, r * .44); g.fill(); }
  else G.hair(g, -r * .4, -r * .3, { len: o.len || r * 3.3, w: r * .68, flow: o.flow || 0, hang: o.hang == null ? .04 : o.hang, curl: o.curl == null ? .32 : o.curl, wave: k.wave, col: hc, dark: k.hairD, hi: k.hi, lo: 'rgba(0,0,0,.25)', t: t + (who === 'f' ? 1.3 : 0) });
  g.fillStyle = hc; ell(g, -r * .14, -r * .1, r * 1.07, r * 1.1); g.fill();
  neck(g, k, r * .16, r);
  g.fillStyle = k.skin; ell(g, r * .1, r * .08, r * .9, r * .93); g.fill();
  /* blush, eyes, brows, nose, mouth */
  const bl = expr === 'yum' ? .62 : .42; g.fillStyle = `rgba(${k.blush},${bl})`; ell(g, r * .15, r * .5, r * (expr === 'yum' ? .26 : .21), r * .12); g.fill(); ell(g, r * .73, r * .46, r * .13, r * .1); g.fill();
  eye(g, r * .2, r * .13, r * .155, r * .23, k, mode, -1); eye(g, r * .7, r * .11, r * .11, r * .21, k, mode, 1);
  g.strokeStyle = k.brow; g.lineWidth = Math.max(.9, r * .06); g.beginPath(); g.moveTo(r * .03, -r * .22); g.quadraticCurveTo(r * .2, -r * .33, r * .38, -r * .25); g.moveTo(r * .6, -r * .27); g.quadraticCurveTo(r * .72, -r * .33, r * .83, -r * .25); g.stroke();
  g.strokeStyle = k.shade; g.lineWidth = Math.max(.8, r * .05); g.beginPath(); g.moveTo(r * .52, r * .3); g.quadraticCurveTo(r * .6, r * .38, r * .52, r * .4); g.stroke();
  mouth(g, r * .47, r * .6, r * .13, k, expr === 'joy' ? 'joy' : 'smile');
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
  if (o.helmet) helmet(g, r, -r * .05);
  g.restore();
}

/* the same face, seen from the front. o: r, expr, blink, len, up, helmet, mask, hairCol */
function headFront(g, who, o = {}) {
  const k = WHO[who], r = o.r || 14, expr = o.expr || 'smile', hc = o.hairCol || k.hair, len = o.len || r * 2.4, wv = k.wave;
  const mode = expr === 'smile' ? (o.blink ? 'blink' : 'open') : 'happy';
  g.save(); if (o.x != null) g.translate(o.x, o.y); g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillStyle = hc; g.beginPath(); g.moveTo(-r * 1.03, -r * .2); g.bezierCurveTo(-r * 1.12, -r * 1.32, r * 1.12, -r * 1.32, r * 1.03, -r * .2);
  if (o.up) { g.bezierCurveTo(r * 1.06, r * .4, r * .9, r * .62, r * .6, r * .7); g.lineTo(-r * .6, r * .7); g.bezierCurveTo(-r * .9, r * .62, -r * 1.06, r * .4, -r * 1.03, -r * .2); g.fill(); ell(g, 0, -r * 1.18, r * .52, r * .44); g.fill(); }
  else { g.bezierCurveTo(r * (1.16 + .1 * wv), r * .6, r * (.94 - .1 * wv), len * .6, r * 1.06, len);
    if (len > r * 1.15) { g.quadraticCurveTo(r * .8, len + r * .14, r * .56, len - r * .06); g.bezierCurveTo(r * .62, len * .7, r * .3, r * 1.5, r * .27, r * .8); g.lineTo(-r * .27, r * .8); g.bezierCurveTo(-r * .3, r * 1.5, -r * .62, len * .7, -r * .56, len - r * .06); g.quadraticCurveTo(-r * .8, len + r * .14, -r * 1.06, len); }
    else g.quadraticCurveTo(0, len + r * .22, -r * 1.06, len);
    g.bezierCurveTo(-r * (.94 - .1 * wv), len * .6, -r * (1.16 + .1 * wv), r * .6, -r * 1.03, -r * .2); g.fill();
    g.strokeStyle = k.hi; g.lineWidth = Math.max(1, r * .1); for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * r * .96, r * .2); g.bezierCurveTo(d * r * (1.04 + .1 * wv), r * .8, d * r * (.82 - .08 * wv), len * .6, d * r * .9, len * .92); g.stroke(); } }
  neck(g, k, 0, r);
  g.fillStyle = k.skin; ell(g, 0, r * .06, r * .9, r * .94); g.fill();
  if (!o.mask) {
    g.fillStyle = `rgba(${k.blush},.42)`; for (const d of [-1, 1]) { ell(g, d * r * .5, r * .47, r * .2, r * .12); g.fill(); }
    for (const d of [-1, 1]) eye(g, d * r * .38, r * .12, r * .15, r * .22, k, mode, d);
    g.strokeStyle = k.brow; g.lineWidth = Math.max(.9, r * .06); for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * r * .2, -r * .24); g.quadraticCurveTo(d * r * .38, -r * .34, d * r * .56, -r * .24); g.stroke(); }
  } else { g.fillStyle = `rgba(${k.blush},.42)`; for (const d of [-1, 1]) { ell(g, d * r * .56, r * .52, r * .16, r * .1); g.fill(); } }
  g.strokeStyle = k.shade; g.lineWidth = Math.max(.8, r * .05); g.beginPath(); g.moveTo(-r * .05, r * .36); g.quadraticCurveTo(0, r * .42, r * .05, r * .36); g.stroke();
  mouth(g, 0, r * .6, r * .14, k, expr === 'joy' ? 'joy' : 'smile');
  /* curtain fringe from a centre part */
  g.fillStyle = hc; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(0, -r * 1.02); g.bezierCurveTo(d * r * .7, -r * 1.12, d * r * 1.14, -r * .5, d * r * 1.04, r * .3); g.quadraticCurveTo(d * r * .98, r * .62, d * r * .8, r * .8); g.quadraticCurveTo(d * r * .7, r * .1, d * r * .22, -r * .5); g.quadraticCurveTo(d * r * .06, -r * .62, 0, -r * .66); g.closePath(); g.fill(); }
  g.strokeStyle = k.hi; g.lineWidth = Math.max(.9, r * .08); for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * r * .12, -r * .94); g.quadraticCurveTo(d * r * .8, -r * .7, d * r * .92, r * .3); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = r * .14; g.beginPath(); g.ellipse(0, -r * .28, r * .8, r * .66, 0, Math.PI * 1.2, Math.PI * 1.8); g.stroke();
  if (o.helmet) helmet(g, r, 0);
  if (o.mask) { g.fillStyle = '#23262c'; g.beginPath(); g.roundRect(-r * .86, -r * .22, r * 1.72, r * .66, r * .24); g.fill(); g.fillStyle = 'rgba(170,220,240,.6)'; for (const d of [-1, 1]) { g.beginPath(); g.roundRect(d * r * .42 - r * .32, -r * .12, r * .64, r * .46, r * .14); g.fill(); } g.fillStyle = 'rgba(255,255,255,.5)'; ell(g, -r * .56, -r * .02, r * .1, r * .06); g.fill(); g.strokeStyle = '#d8e83a'; g.lineWidth = r * .2; g.beginPath(); g.moveTo(r * .92, r * .5); g.lineTo(r * 1.1, -r * 1.3); g.stroke(); }
  g.restore();
}

/* a whole person seen from the side. o: dir, phase, walk 0..1, run, air, cheer, outfit (coat | run | skirt), sc, expr, medal, bib */
function figure(g, x, y, who, o = {}) {
  const k = WHO[who], c = o.colors || OUT[o.outfit || 'coat'][who], t = o.t == null ? G.time : o.t, dir = o.dir || 1, sc = o.sc || 1.3, run = !!o.run, cheer = !!o.cheer, air = !!o.air, fit = o.outfit || 'coat';
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
    g.strokeStyle = col; g.lineWidth = 6.8; g.beginPath(); g.moveTo(0, -68); g.lineTo(ex, ey); if (fit !== 'skirt') g.lineTo(hx, hy); g.stroke();
    if (fit === 'skirt') { g.strokeStyle = k.skin; g.lineWidth = 5; g.beginPath(); g.moveTo(ex, ey); g.lineTo(hx, hy); g.stroke(); }
    else if (fit === 'coat' && who === 'j') { g.strokeStyle = c.trim; g.lineWidth = 7.4; g.beginPath(); g.moveTo(ex + (hx - ex) * .66, ey + (hy - ey) * .66); g.lineTo(hx, hy); g.stroke(); }
    g.fillStyle = k.skin; g.beginPath(); g.arc(hx + Math.sin(f) * 2, hy + Math.cos(f) * 2, 3.4, 0, TAU); g.fill();
  };
  const legCol = fit === 'skirt' ? k.skin : c.leg, hem = Math.sin(ph) * 2.6 * walk;
  leg(ph + Math.PI, fit === 'skirt' ? k.shade : c.dark, false); arm(ph + Math.PI, c.dark, -1); leg(ph, legCol, true);
  g.fillStyle = k.skin; g.fillRect(-2, -85, 8, 14);
  if (fit === 'coat') {
    g.fillStyle = c.top; g.beginPath(); g.moveTo(-8, -75); g.quadraticCurveTo(-10, -52, -15 - hem, -26); g.quadraticCurveTo(0, -21, 14 - hem, -26); g.quadraticCurveTo(9, -52, 8, -75); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(8, -75); g.quadraticCurveTo(9, -52, 14 - hem, -26); g.lineTo(8 - hem, -25); g.quadraticCurveTo(5, -52, 4, -75); g.fill();
    g.fillStyle = 'rgba(0,0,20,.22)'; g.beginPath(); g.moveTo(-8, -75); g.quadraticCurveTo(-10, -52, -15 - hem, -26); g.lineTo(-9 - hem, -25); g.quadraticCurveTo(-5, -52, -4, -75); g.fill();
    if (who === 'j') { g.fillStyle = c.trim; g.beginPath(); g.moveTo(1, -77); g.lineTo(9, -73); g.lineTo(7, -60); g.lineTo(2, -66); g.closePath(); g.fill(); ell(g, 0.5, -75, 9.5, 5); g.fill(); g.fillStyle = '#f2cf62'; for (const by of [-54, -44]) { g.beginPath(); g.arc(5.5, by, 1.2, 0, TAU); g.fill(); }
      g.strokeStyle = '#9aa0aa'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-6, -73); g.lineTo(8, -46); g.stroke(); g.fillStyle = '#d5d9e0'; g.beginPath(); g.roundRect(1, -49, 13, 10, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(3, -47.5, 8, 1.6); }
    else { g.fillStyle = c.dark; ell(g, 0.5, -75, 9, 4.4); g.fill(); g.fillRect(-11, -52, 21, 3.4); }
  } else if (fit === 'run') {
    g.fillStyle = c.top; g.beginPath(); g.roundRect(-8.5, -76, 17, 40, 7.5); g.fill(); g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.roundRect(3, -74, 4, 34, 2); g.fill();
    if (o.bib !== false) { g.fillStyle = '#fdfbf4'; g.beginPath(); g.roundRect(-4, -63, 13, 10, 1.5); g.fill(); g.fillStyle = '#17161a'; g.fillRect(-2, -61, 9, 2.6); g.fillStyle = '#4a3a8c'; g.fillRect(-4, -56, 13, 3); }
  } else {
    g.fillStyle = '#fbf0c8'; g.beginPath(); g.moveTo(-8, -54); g.quadraticCurveTo(-13, -30, -19 - hem, -9); for (let i = 1; i <= 6; i++) g.lineTo(-19 - hem + i * 6, -9 + (i % 2 ? 3 : 0) - i * .5); g.quadraticCurveTo(11, -32, 8, -54); g.closePath(); g.fill();
    g.save(); g.clip(); const r = R(26); for (let i = 0; i < 16; i++) { const fx = -20 + r() * 38, fy = -50 + r() * 40; dab(g, fx, fy, 2.6, 2.2, r() * 3, r() < .6 ? '#ee8fa0' : '#f6b8a4', .95); dab(g, fx + 3, fy + 2, 2, 1, r() * 3, '#7aa85a', .9); } g.globalAlpha = 1; g.restore();
    g.fillStyle = c.top; g.beginPath(); g.roundRect(-8, -76, 16, 24, 6); g.fill(); g.fillStyle = c.dark; g.beginPath(); g.moveTo(4, -56); g.lineTo(12, -52); g.lineTo(9, -46); g.lineTo(3, -52); g.fill();
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
})();
