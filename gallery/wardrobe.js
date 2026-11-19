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
  const r = R(909), fl = L.floor;
  let gr = g.createLinearGradient(0, 0, 0, fl); gr.addColorStop(0, '#e9c9c0'); gr.addColorStop(1, '#f4ded2'); g.fillStyle = gr; g.fillRect(0, 0, w, fl);
  g.fillStyle = 'rgba(255,255,255,.2)'; for (let x = (L.fx % 46) - 46; x < w; x += 46) g.fillRect(x, 0, 23, fl);
  for (let i = 0; i < w * .4; i++) dab(g, r() * w, r() * fl, 14 + r() * 40, 5 + r() * 12, 0, r() < .5 ? '#fbeee6' : '#dcb4aa', .12); g.globalAlpha = 1;
  g.fillStyle = '#fbf6ea'; g.fillRect(0, fl - 14, w, 14); gr = g.createLinearGradient(0, fl, 0, h); gr.addColorStop(0, '#c99a66'); gr.addColorStop(1, '#a87c4c'); g.fillStyle = gr; g.fillRect(0, fl, w, h - fl);
  g.strokeStyle = 'rgba(90,55,25,.3)'; g.lineWidth = 1.2; for (let k = 1; k < 5; k++) { const y = fl + (h - fl) * Math.pow(k / 5, 1.5); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  /* a rug to stand on, and a rail of her clothes behind */
  g.fillStyle = '#b85a6a'; ell(g, L.fx, fl + 26, 150, 22); g.fill(); g.strokeStyle = '#f6d8c8'; g.lineWidth = 3; ell(g, L.fx, fl + 26, 132, 17); g.stroke();
  const x0 = L.fx - 190, x1 = L.fx + 200, ry = fl - (L.wide ? 330 : 250); g.strokeStyle = '#8f949c'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, ry); g.lineTo(x1, ry); g.stroke(); g.lineWidth = 4; g.beginPath(); g.moveTo(x0 + 6, ry); g.lineTo(x0 + 6, fl); g.moveTo(x1 - 6, ry); g.lineTo(x1 - 6, fl); g.stroke();
  const cols = G.wardrobe.outfit.filter(o => o.c).map(o => o.c.top); let x = x0 + 26;
  cols.forEach((c, i) => { const len = 90 + (i % 3) * 34, wd = 26; g.strokeStyle = '#6e6f78'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, ry); g.lineTo(x, ry + 10); g.moveTo(x - wd / 2, ry + 18); g.lineTo(x, ry + 10); g.lineTo(x + wd / 2, ry + 18); g.stroke(); g.fillStyle = c; g.beginPath(); g.moveTo(x - wd / 2, ry + 18); g.lineTo(x + wd / 2, ry + 18); g.lineTo(x + wd / 2 + 3, ry + len); g.lineTo(x - wd / 2 - 3, ry + len); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x - wd / 2 + 3, ry + 22, 4, len - 26); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + wd / 2 - 5, ry + 20, 5, len - 20); x += 31; });
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
