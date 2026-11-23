/* The wardrobe. Jana picks what she wears, how her hair is done and her make-up; the choice follows her to every place.
   Every outfit on the rail is one she really wears. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, clamp, TAU, R, dab, glow, tone } = G;
const $ = id => document.getElementById(id);
const TABS = { outfit: [['outfit', 'Outfits']], hair: [['hair', 'Hair'], ['shades', 'Extras']], make: [['mascara', 'Mascara'], ['lips', 'Lips'], ['blush', 'Blush'], ['liner', 'Liner']] };
let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false, tab = 'outfit', spin = 0;
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };

function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S; const wide = G.W > G.H, pr = $('wpanel').getBoundingClientRect(), cr = cv.getBoundingClientRect();
  const fw = wide ? (pr.left - cr.left) / S : VW, fh = wide ? VH : (pr.top - cr.top) / S;
  L = { wide, fw, fh, floor: fh - (wide ? 110 : 44), fx: fw * (wide ? .56 : .34), sc: clamp((fh - (wide ? 250 : 150)) / 122, 1.5, 3.6), mx: fw * (wide ? .2 : .74), my: wide ? fh * .4 : fh * .5, mr: wide ? clamp(fw * .11, 50, 76) : clamp(fw * .17, 44, 64) };
  SPR = { room: G.spr(VW, VH, drawRoom, clamp(S * G.DPR, 1, 2.5)) };
  $('wui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function drawRoom(g, w, h) {
  const r = R(909), fl = L.floor, wd = L.wide;
  let gr = g.createLinearGradient(0, 0, 0, fl); gr.addColorStop(0, '#e9c9c0'); gr.addColorStop(1, '#f4ded2'); g.fillStyle = gr; g.fillRect(0, 0, w, fl);
  g.fillStyle = 'rgba(255,255,255,.2)'; for (let x = (L.fx % 46) - 46; x < w; x += 46) g.fillRect(x, 0, 23, fl);
  for (let i = 0; i < w * .4; i++) dab(g, r() * w, r() * fl, 14 + r() * 40, 5 + r() * 12, 0, r() < .5 ? '#fbeee6' : '#dcb4aa', .12); g.globalAlpha = 1;
  g.fillStyle = '#fbf6ea'; g.fillRect(0, fl - 14, w, 14); gr = g.createLinearGradient(0, fl, 0, h); gr.addColorStop(0, '#c99a66'); gr.addColorStop(1, '#a87c4c'); g.fillStyle = gr; g.fillRect(0, fl, w, h - fl);
  g.strokeStyle = 'rgba(90,55,25,.3)'; g.lineWidth = 1.2; for (let k = 1; k < 5; k++) { const y0 = fl + (h - fl) * Math.pow((k - 1) / 5, 1.5), y = fl + (h - fl) * Math.pow(k / 5, 1.5); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = (k % 2) * 60 + r() * 30; x < w; x += 120) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y); g.stroke(); } }
  /* a window onto the evening, with curtains */
  if (wd) { const wx = L.mx - 96, wy = 70, ww = 192, wh = Math.max(64, L.my - L.mr - 48 - wy); g.fillStyle = '#fbf6ea'; g.fillRect(wx - 7, wy - 7, ww + 14, wh + 14); gr = g.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, '#5f6aa8'); gr.addColorStop(.7, '#f2a880'); gr.addColorStop(1, '#f6cf9a'); g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
    for (let x = wx; x < wx + ww; ) { const bw = 12 + r() * 16, bh = wh * (.25 + r() * .45); g.fillStyle = '#2c3358'; g.fillRect(x, wy + wh - bh, bw, bh); g.fillStyle = '#ffe9a6'; for (let yy = wy + wh - bh + 4; yy < wy + wh - 4; yy += 7) for (let xx = x + 3; xx < x + bw - 3; xx += 5) if (r() < .5) g.fillRect(xx, yy, 2.2, 3); x += bw + 1; }
    g.fillStyle = 'rgba(255,246,214,.95)'; g.beginPath(); g.arc(wx + ww * .76, wy + wh * .24, 7, 0, TAU); g.fill(); g.fillStyle = '#fbf6ea'; g.fillRect(wx + ww / 2 - 2, wy, 4, wh); g.fillRect(wx, wy + wh * .5 - 2, ww, 4); g.fillRect(wx - 12, wy + wh + 7, ww + 24, 6);
    for (const d of [-1, 1]) { g.fillStyle = '#e8a0a8'; g.beginPath(); g.moveTo(wx + ww / 2 + d * (ww / 2 + 10), wy - 12); g.lineTo(wx + ww / 2 + d * (ww / 2 - 26), wy - 12); g.quadraticCurveTo(wx + ww / 2 + d * (ww / 2 - 6), wy + wh * .5, wx + ww / 2 + d * (ww / 2 - 20), wy + wh + 10); g.lineTo(wx + ww / 2 + d * (ww / 2 + 10), wy + wh + 10); g.fill(); g.strokeStyle = 'rgba(160,70,90,.35)'; g.lineWidth = 1.2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(wx + ww / 2 + d * (ww / 2 + 6 - i * 8), wy - 12); g.lineTo(wx + ww / 2 + d * (ww / 2 + 6 - i * 7), wy + wh + 10); g.stroke(); } }
    g.fillStyle = '#d9a03c'; g.fillRect(wx - 20, wy - 17, ww + 40, 5); }
  /* a rug to stand on */
  g.fillStyle = '#b85a6a'; ell(g, L.fx, fl + 26, 150, 22); g.fill(); g.strokeStyle = '#f6d8c8'; g.lineWidth = 3; ell(g, L.fx, fl + 26, 132, 17); g.stroke(); g.lineWidth = 1.4; ell(g, L.fx, fl + 26, 108, 12); g.stroke();
  g.fillStyle = '#f6d8c8'; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.save(); g.translate(L.fx + Math.cos(a) * 120, fl + 26 + Math.sin(a) * 14.5); g.rotate(Math.PI / 4); g.fillRect(-2.2, -2.2, 4.4, 4.4); g.restore(); }
  /* the rail of her clothes, with a shelf of hats and boxes over it and her shoes underneath */
  const x0 = L.fx - 190, x1 = L.fx + 200, ry = fl - (wd ? 330 : 250);
  if (ry - 46 > 60) { const sy = ry - 34; g.fillStyle = '#a87c4c'; g.fillRect(x0 - 8, sy, x1 - x0 + 16, 6); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x0 - 8, sy + 6, x1 - x0 + 16, 3);
    let bx = x0 + 8; for (const [bw, bh, c, c2] of [[46, 26, '#f4a8c0', '#fbf6ea'], [38, 20, '#2f8a8c', '#fbf6ea'], [50, 30, '#f6e7a8', '#c8463a']]) { g.fillStyle = c; rr(g, bx, sy - bh, bw, bh, 3); g.fill(); g.fillStyle = c2; g.fillRect(bx, sy - bh + 5, bw, 3); g.fillRect(bx + bw / 2 - 1.5, sy - bh, 3, bh); g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(bx, sy - 4, bw, 4); bx += bw + 8; }
    const hx = bx + 34; g.fillStyle = '#efe2c6'; ell(g, hx, sy - 3, 32, 6); g.fill(); g.beginPath(); g.ellipse(hx, sy - 5, 15, 15, 0, Math.PI, 0); g.fill(); g.fillStyle = '#c8463a'; g.fillRect(hx - 15, sy - 9, 30, 4);
    const kx = hx + 50; ['#2b5f4f', '#f6eede', '#6a3058', '#27305a'].forEach((c, i) => { g.fillStyle = c; rr(g, kx + (i % 2) * 2, sy - 9 - i * 9, 44, 9, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(kx + 4 + (i % 2) * 2, sy - 7 - i * 9, 36, 1.6); });
    const gx = Math.min(x1 - 30, kx + 80); g.fillStyle = '#8a5c38'; rr(g, gx - 17, sy - 24, 34, 24, 5); g.fill(); g.strokeStyle = '#6e4628'; g.lineWidth = 3; g.beginPath(); g.arc(gx, sy - 24, 11, Math.PI, 0); g.stroke(); g.fillStyle = '#e9b44c'; g.fillRect(gx - 3, sy - 16, 6, 5); }
  g.strokeStyle = '#8f949c'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, ry); g.lineTo(x1, ry); g.stroke(); g.lineWidth = 4; g.beginPath(); g.moveTo(x0 + 6, ry); g.lineTo(x0 + 6, fl); g.moveTo(x1 - 6, ry); g.lineTo(x1 - 6, fl); g.stroke();
  let x = x0 + 26;
  G.wardrobe.outfit.filter(o => o.c).forEach((o, i) => { const c = o.c.top, len = 90 + (i % 3) * 34, wd2 = 26, top = ry + 18;
    g.strokeStyle = '#6e6f78'; g.lineWidth = 1.6; g.beginPath(); g.arc(x, ry + 4, 4, Math.PI * .9, Math.PI * 2.2); g.moveTo(x, ry + 8); g.lineTo(x, ry + 10); g.moveTo(x - wd2 / 2, top); g.lineTo(x, ry + 10); g.lineTo(x + wd2 / 2, top); g.stroke();
    g.fillStyle = c; g.beginPath(); g.moveTo(x - wd2 / 2, top); g.lineTo(x + wd2 / 2, top); g.lineTo(x + wd2 / 2 + 3, ry + len); g.lineTo(x - wd2 / 2 - 3, ry + len); g.closePath(); g.fill();
    g.save(); g.clip();
    if (o.spots) { for (let k = 0; k < 26; k++) { g.fillStyle = '#5a3a1c'; ell(g, x - 15 + r() * 30, top + r() * len, 2.4, 1.7); g.fill(); } }
    if (o.knit) { g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1; for (let xx = x - 14; xx < x + 16; xx += 4) { g.beginPath(); g.moveTo(xx, top); g.lineTo(xx, ry + len); g.stroke(); } }
    if (o.lace) { g.fillStyle = 'rgba(190,180,160,.7)'; for (let yy = top + 5; yy < ry + len; yy += 6) for (let xx = x - 13 + (Math.round(yy / 6) % 2) * 3; xx < x + 15; xx += 6) { g.beginPath(); g.arc(xx, yy, .9, 0, TAU); g.fill(); } }
    if (o.kind === 'skirt') { g.fillStyle = '#e8709c'; for (let k = 0; k < 14; k++) { g.beginPath(); g.arc(x - 14 + r() * 28, top + len * .45 + r() * len * .4, 2, 0, TAU); g.fill(); } g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x - 20, top + len * .36, 40, 2); }
    if (o.kind === 'coat' || o.jacket) { g.fillStyle = o.collar ? '#f4ead6' : o.c.dark; g.beginPath(); g.moveTo(x - wd2 / 2, top); g.lineTo(x, top + 26); g.lineTo(x + wd2 / 2, top); g.lineTo(x + 3, top); g.lineTo(x, top + 14); g.lineTo(x - 3, top); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, top + 26); g.lineTo(x, ry + len); g.stroke(); g.fillStyle = '#e9b44c'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + 4, top + 36 + k * 14, 1.5, 0, TAU); g.fill(); } }
    if (o.scarf) { g.fillStyle = '#f6f2e8'; g.fillRect(x - 5, top - 2, 10, 44); }
    if (o.buttons) { g.fillStyle = 'rgba(0,0,0,.4)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x, top + 14 + k * 12, 1.4, 0, TAU); g.fill(); } }
    if (o.off || o.bare) { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x - 16, top, 32, 3); }
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x - wd2 / 2 + 3, top + 4, 4, len - 26); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + wd2 / 2 - 5, top + 2, 6, len); g.restore(); x += 31; });
  const shoe = (sx, kind) => { g.fillStyle = 'rgba(60,35,15,.25)'; ell(g, sx + 12, fl - 1, 26, 3.4); g.fill();
    for (const dx of [0, 15]) { if (kind === 'sneaker') { g.fillStyle = '#fbfaf4'; rr(g, sx + dx - 2, fl - 10, 22, 9, 4); g.fill(); g.fillStyle = '#d9dce2'; g.fillRect(sx + dx - 2, fl - 3, 22, 2.4); g.fillStyle = '#c8463a'; g.fillRect(sx + dx + 5, fl - 9, 7, 1.6); }
      else if (kind === 'boot') { g.fillStyle = '#6e4628'; rr(g, sx + dx, fl - 30, 10, 29, 3); g.fill(); rr(g, sx + dx, fl - 9, 19, 8, 3); g.fill(); g.fillStyle = '#3a2c20'; g.fillRect(sx + dx, fl - 2.4, 19, 2.4); }
      else if (kind === 'heel') { g.fillStyle = '#c0262e'; g.beginPath(); g.moveTo(sx + dx, fl - 13); g.quadraticCurveTo(sx + dx + 5, fl - 6, sx + dx + 19, fl - 3.4); g.lineTo(sx + dx + 19, fl - 1); g.lineTo(sx + dx + 5, fl - 1); g.lineTo(sx + dx + 3, fl - 8); g.fill(); g.fillRect(sx + dx, fl - 13, 2.4, 12); }
      else { g.fillStyle = '#22222a'; rr(g, sx + dx, fl - 7, 20, 6, 3); g.fill(); g.fillStyle = '#e9b44c'; g.fillRect(sx + dx + 11, fl - 6, 4, 2); } } };
  shoe(x0 + 16, 'sneaker'); shoe(x0 + 58, 'boot'); shoe(x1 - 96, 'heel'); shoe(x1 - 52, 'flat');
  /* the dressing table under the mirror: lipsticks, the blue mascara, brushes and a bottle of scent */
  { const tx = L.mx, ty = L.my + L.mr * 1.86 + 5, tw = L.mr * 2.9; g.fillStyle = 'rgba(60,35,15,.2)'; g.fillRect(tx - tw / 2 + 6, ty + 6, tw, fl - ty);
    if (fl - ty > 70) { g.fillStyle = '#fbf6ea'; rr(g, tx - tw / 2, ty, tw, fl - ty, 6); g.fill(); const dn = Math.max(2, Math.floor((fl - ty - 16) / 48)); for (let i = 0; i < dn; i++) { const dy = ty + 14 + i * (fl - ty - 22) / dn, dh = (fl - ty - 22) / dn - 8; g.strokeStyle = 'rgba(160,120,90,.5)'; g.lineWidth = 1.4; rr(g, tx - tw / 2 + 9, dy, tw - 18, dh, 4); g.stroke(); g.fillStyle = '#d9a03c'; for (const d of [-1, 1]) { g.beginPath(); g.arc(tx + d * tw * .2, dy + dh / 2, 3, 0, TAU); g.fill(); } } }
    else { g.strokeStyle = '#d9c8b4'; g.lineWidth = 5; g.beginPath(); g.moveTo(tx - tw / 2 + 8, ty); g.lineTo(tx - tw / 2 + 4, fl); g.moveTo(tx + tw / 2 - 8, ty); g.lineTo(tx + tw / 2 - 4, fl); g.stroke(); }
    g.fillStyle = '#f4e6d2'; rr(g, tx - tw / 2 - 5, ty - 5, tw + 10, 9, 4); g.fill(); const k = L.mr / 64;
    G.wardrobe.lips.forEach((q, i) => { const lx = tx - tw * .42 + i * 9 * k; g.fillStyle = '#d9a03c'; g.fillRect(lx, ty - 5 - 9 * k, 5 * k, 9 * k); g.fillStyle = q.sw; g.beginPath(); g.moveTo(lx + .6 * k, ty - 5 - 9 * k); g.lineTo(lx + .6 * k, ty - 5 - 13 * k); g.lineTo(lx + 4.4 * k, ty - 5 - 15 * k); g.lineTo(lx + 4.4 * k, ty - 5 - 9 * k); g.fill(); });
    const mx2 = tx - tw * .42 + 34 * k; g.fillStyle = '#2a5be8'; rr(g, mx2, ty - 5 - 20 * k, 5.4 * k, 20 * k, 2 * k); g.fill(); g.fillStyle = '#d9a03c'; g.fillRect(mx2, ty - 5 - 9 * k, 5.4 * k, 2 * k);
    const cxp = tx + tw * .34; g.fillStyle = '#e8a0a8'; rr(g, cxp - 7 * k, ty - 5 - 14 * k, 14 * k, 14 * k, 2 * k); g.fill(); for (const [dx, c] of [[-4, '#6e4628'], [-1, '#201c26'], [3, '#b89a62']]) { g.strokeStyle = '#d9b98a'; g.lineWidth = 1.6 * k; g.beginPath(); g.moveTo(cxp + dx * k, ty - 5 - 13 * k); g.lineTo(cxp + dx * 1.7 * k, ty - 5 - 30 * k); g.stroke(); g.fillStyle = c; g.beginPath(); g.ellipse(cxp + dx * 1.8 * k, ty - 5 - 33 * k, 2 * k, 4 * k, dx * .06, 0, TAU); g.fill(); }
    const px2 = tx + tw * .14; g.fillStyle = 'rgba(244,168,192,.85)'; rr(g, px2 - 6 * k, ty - 5 - 13 * k, 12 * k, 13 * k, 2.4 * k); g.fill(); g.fillStyle = '#d9a03c'; g.fillRect(px2 - 2.4 * k, ty - 5 - 18 * k, 4.8 * k, 5 * k); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(px2 - 4 * k, ty - 5 - 11 * k, 2 * k, 8 * k); }
  /* a tall plant in the corner */
  if (wd) { const plx = L.fw - 44, ply = fl + 4; g.fillStyle = 'rgba(60,35,15,.22)'; ell(g, plx + 4, ply + 3, 26, 6); g.fill(); for (const [a, len] of [[-1.85, 150], [-1.3, 170], [-2.3, 130], [-1.0, 120], [-1.6, 196], [-2.0, 176]]) { g.strokeStyle = '#3f7a4a'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(plx, ply - 36); g.quadraticCurveTo(plx + Math.cos(a) * len * .3, ply - 36 + Math.sin(a) * len * .8, plx + Math.cos(a) * len * .6, ply - 36 + Math.sin(a) * len); g.stroke(); g.save(); g.translate(plx + Math.cos(a) * len * .6, ply - 36 + Math.sin(a) * len); g.rotate(a + Math.PI / 2); g.fillStyle = len > 160 ? '#5aa05f' : '#4f8f55'; g.beginPath(); g.ellipse(0, 0, 15, 22, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(30,70,40,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -20); g.lineTo(0, 20); for (const yy of [-9, 0, 9]) { g.moveTo(0, yy); g.lineTo(-10, yy - 5); g.moveTo(0, yy); g.lineTo(10, yy - 5); } g.stroke(); g.restore(); }
    g.fillStyle = '#fbf6ea'; g.beginPath(); g.moveTo(plx - 22, ply - 40); g.lineTo(plx + 22, ply - 40); g.lineTo(plx + 16, ply); g.lineTo(plx - 16, ply); g.fill(); g.fillStyle = '#e8a0a8'; g.fillRect(plx - 21, ply - 28, 42, 6); }
}
function frame(dt) {
  if (!L || !SPR) return; const t = G.time, g = cx; spin = Math.max(0, spin - dt * 2.4);
  g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(SPR.room, 0, 0, VW, VH);
  /* the hand mirror: her face close up, so the make-up shows */
  const { mx, my, mr } = L; g.fillStyle = '#a8742a'; g.fillRect(mx - 6, my + mr, 12, mr * .8); ell(g, mx, my + mr * 1.86, 16, 6); g.fill();
  g.fillStyle = '#d9a03c'; g.beginPath(); g.arc(mx, my, mr + 9, 0, TAU); g.fill(); g.fillStyle = '#f2cf62'; g.beginPath(); g.arc(mx, my, mr + 5, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.clip(); const mg = g.createLinearGradient(0, my - mr, 0, my + mr); mg.addColorStop(0, '#dcecf2'); mg.addColorStop(1, '#f6eee6'); g.fillStyle = mg; g.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
  const hr = mr * .62; g.fillStyle = G.people.j.skin; g.fillRect(mx - hr * .9, my + hr * 1.5, hr * 1.8, mr); G.headFront(g, 'j', { x: mx, y: my - hr * .08, r: hr, len: hr * 2.6, blink: !G.RM && (t % 3.4) < .13 });
  g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(mx - mr * .7, my - mr); g.lineTo(mx - mr * .3, my - mr); g.lineTo(mx - mr, my + mr * .2); g.lineTo(mx - mr, my - mr * .3); g.fill(); g.restore();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - Math.PI / 2, bx = mx + Math.cos(a) * (mr + 7), by = my + Math.sin(a) * (mr + 7), tw = G.RM ? 1 : .8 + .2 * Math.sin(t * 2.4 + i * 1.9); g.globalCompositeOperation = 'lighter'; glow(g, bx, by, 13, '255,230,170', .4 * tw); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(bx, by, 3.2, 0, TAU); g.fill(); }
  /* Jana herself, turning a little whenever something changes */
  const dir = spin > .5 ? -1 : 1; G.figure(g, L.fx, L.floor + 26, 'j', { dir, sc: L.sc, phase: spin * 6, walk: spin > 0 ? .6 : 0, outfit: 'coat' });
  g.globalCompositeOperation = 'lighter'; glow(g, L.fx, L.floor - 60 * L.sc, 90 * L.sc, '255,236,200', .14 + .04 * Math.sin(t * 1.4)); g.globalCompositeOperation = 'source-over';
  if (!G.RM) { const r = R(3); for (let i = 0; i < 9; i++) { const a = r() * TAU + t * .3, d = (50 + r() * 34) * L.sc, tw = .5 + .5 * Math.sin(t * 3 + i * 2); g.fillStyle = `rgba(255,246,214,${tw * .8})`; g.beginPath(); g.arc(L.fx + Math.cos(a) * d, L.floor - 56 * L.sc + Math.sin(a) * d * .9, 1.4 + tw * 1.4, 0, TAU); g.fill(); } }
  G.paper(g, .3);
}
function render() {
  const body = $('wbody'); body.textContent = '';
  for (const [key, title] of TABS[tab]) {
    const h = document.createElement('h3'); h.textContent = title; body.append(h); const row = document.createElement('div'); row.className = 'chips';
    for (const o of G.wardrobe[key]) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.setAttribute('aria-pressed', G.look[key] === o.id); const sw = o.sw || (o.c && o.c.top); if (sw) { const d = document.createElement('span'); d.className = 'sw'; d.style.background = sw; b.append(d); } b.append(o.name); b.addEventListener('click', () => { G.setLook(key, o.id); spin = 1; tone(784, .1, 'sine', .05); tone(1047, .16, 'sine', .04, .07); render(); }); row.append(b); }
    body.append(row);
  }
  for (const b of document.querySelectorAll('#wtabs button')) b.setAttribute('aria-pressed', b.dataset.tab === tab);
}
for (const b of document.querySelectorAll('#wtabs button')) b.addEventListener('click', () => { tab = b.dataset.tab; render(); });
$('wdone').addEventListener('click', () => G.go('map'));
G.scenes.wardrobe = {
  frame, resize: layout,
  enter() { active = true; $('wui').hidden = false; layout(); render(); if (document.fonts && document.fonts.load) document.fonts.load('700 14px Nunito'); },
  leave() { active = false; $('wui').hidden = true; },
  debug: { get L() { return L; } }
};
})();
