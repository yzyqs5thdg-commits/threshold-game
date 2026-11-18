/* The front door. The intercom buzzes, the little screen shows who is downstairs, and a swipe lets her in.
   Four visits, each one a real still from the door camera. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, TAU, R, dab, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif';
const INK = '#2c2a3d', PAPER = '#fbf3df';
const VISITS = [
  { id: 1, date: 'September 24, 8:28 PM', top: '#c8262c', coat: '#1c1a1e', says: "It's me!", title: 'Swipe to open', text: 'Leather jacket, already mid-sentence before the door opened.' },
  { id: 2, date: 'October 3, 1:27 PM', top: '#5c3a2c', up: true, says: 'Finally.', title: 'Visitor pass', text: 'The look of someone who has been waiting four whole seconds.' },
  { id: 3, date: 'October 17, 3:11 PM', top: '#2a2c2e', coat: '#f1ece0', up: true, bag: true, says: 'I brought things.', title: 'Visitor pass', text: 'A braid, a big collar and a paper bag. The best kind of visitor.' },
  { id: 4, date: 'Front door', top: '#b9c86a', says: 'Hi.', title: 'Front door', text: 'No smile for the camera. Saving it for upstairs.' }
];
let S = 1, VW = 0, VH = 0, L = null, active = false;
const D = { i: 0, state: 'idle', t: 0, knob: 0, drag: false, open: 0, walk: 0, seen: 0, endShown: false };
const says = [], moth = { x: 80, y: 200 };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };

function layout() {
  S = Math.min(G.W / 430, G.H / 720); if (G.W / S >= 760) S *= 1.2; VW = G.W / S; VH = G.H / S; const wide = VW >= 760, fl = VH - (wide ? 110 : 150);
  L = { wide, fl, ix: wide ? VW / 2 - 190 : 128, iy: fl - (wide ? 430 : 470), dx: wide ? VW / 2 + 200 : VW - 96, dw: wide ? 170 : 132, dh: wide ? 360 : 330 };
  L.sx = L.ix - 92; L.sy = L.iy + 18; L.tx = L.ix - 86; L.ty = L.iy + 232; L.tw = 172;
  $('fui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function setStep() {
  const s = D.state;
  $('fstep').textContent = s === 'idle' ? 'Quiet for now.' : s === 'ring' ? "Someone's at the front door. Tap the screen to see who." : s === 'live' ? "It's Jana. Swipe to open." : s === 'open' ? 'Buzzed in.' : 'Every visit logged.';
  $('fcount').textContent = `Visits ${D.seen} of ${VISITS.length}`;
}
function go(state) { D.state = state; D.t = 0; setStep(); }
function answer() { if (D.state !== 'ring') return; go('live'); D.knob = 0; tone(660, .1, 'sine', .06); }
function unlock() { if (D.state !== 'live') return; go('open'); D.knob = 1; D.open = 0; D.walk = 0; tone(180, .5, 'sawtooth', .03); tone(220, .5, 'square', .02); tone(880, .12, 'sine', .05, .5); }
function showCard() {
  const v = VISITS[D.i]; D.seen = Math.max(D.seen, D.i + 1); $('fimg').src = `media/fd_${v.id}.jpg`; $('fimg').alt = 'Jana at the front door camera';
  $('fno').textContent = `Front door  ·  ${v.date}`; $('ftitle').textContent = v.title; $('ftext').textContent = v.text;
  $('fclose').textContent = D.i < VISITS.length - 1 ? 'Close the door' : 'Close'; $('fview').hidden = false; $('fclose').focus(); setStep();
}
function closeCard() {
  $('fview').hidden = true; $('fimg').removeAttribute('src');
  if (D.i < VISITS.length - 1) { D.i++; D.open = 0; D.walk = 0; D.knob = 0; go('idle'); }
  else { go('done'); if (!D.endShown) { D.endShown = true; $('fend').hidden = false; $('fstay').focus(); [523, 659, 784, 1047].forEach((f, i) => tone(f, .9, 'sine', .05, i * .22)); } }
}

/* what the door camera sees: the lobby through a fisheye, and her face very close */
function camera(g, x, y, w, h, v, t) {
  g.save(); rr(g, x, y, w, h, 8); g.clip();
  const gr = g.createRadialGradient(x + w / 2, y + h * .4, 10, x + w / 2, y + h / 2, w * .7); gr.addColorStop(0, '#fdfcf6'); gr.addColorStop(1, '#b9bcc0'); g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(150,150,150,.5)'; g.lineWidth = 1.2; for (const k of [-.5, 0, .5]) { g.beginPath(); g.ellipse(x + w / 2 + k * w * .5, y + h * .6, w * .13, h * .34, 0, 0, TAU); g.stroke(); }
  g.fillStyle = '#17161a'; g.beginPath(); g.ellipse(x - 6, y + h * .6, 26, h * .5, .1, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x + w + 6, y + h * .6, 26, h * .5, -.1, 0, TAU); g.fill();
  g.strokeStyle = '#6f8fd8'; g.lineWidth = 1.5; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x + w - 6, y + h * (.36 + i * .14), 7, 0, TAU); g.stroke(); }
  g.fillStyle = '#2a2a30'; ell(g, x + w * .62, y - 4, w * .26, 16); g.fill(); g.fillStyle = '#fdfcf6'; ell(g, x + w * .62, y - 6, w * .2, 11); g.fill();
  g.fillStyle = '#17161a'; g.fillRect(x, y + h - 8, w, 8);
  /* her, close to the lens */
  const cx0 = x + w / 2 + Math.sin(t * .9) * 3 * (G.RM ? 0 : 1), cy0 = y + h * .56 + Math.sin(t * 1.4) * 1.5 * (G.RM ? 0 : 1);
  if (v.bag) { g.fillStyle = '#c9a67a'; g.beginPath(); g.moveTo(x + w - 44, y + h); g.lineTo(x + w - 40, y + h - 30); g.lineTo(x + w - 6, y + h - 34); g.lineTo(x + w, y + h); g.fill(); }
  g.fillStyle = v.coat || v.top; g.beginPath(); g.moveTo(cx0 - 62, y + h + 4); g.quadraticCurveTo(cx0 - 56, cy0 + 26, cx0 - 20, cy0 + 26); g.lineTo(cx0 + 20, cy0 + 26); g.quadraticCurveTo(cx0 + 56, cy0 + 26, cx0 + 62, y + h + 4); g.fill();
  g.fillStyle = v.top; g.beginPath(); g.moveTo(cx0 - 20, y + h + 4); g.lineTo(cx0 - 14, cy0 + 26); g.lineTo(cx0 + 14, cy0 + 26); g.lineTo(cx0 + 20, y + h + 4); g.fill();
  g.fillStyle = G.people.j.skin; g.fillRect(cx0 - 8, cy0 + 16, 16, 14);
  g.save(); g.translate(cx0, cy0 - 8); g.scale(1.12, 1); G.headFront(g, 'j', { r: 30, len: v.up ? 0 : 62, up: v.up, blink: !G.RM && (t % 3.2) < .14 }); g.restore();
  g.fillStyle = 'rgba(255,255,255,.22)'; ell(g, cx0 - 2, cy0 - 30, 16, 9); g.fill();
  const vg = g.createRadialGradient(x + w / 2, y + h / 2, h * .4, x + w / 2, y + h / 2, w * .72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = vg; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(0,0,0,.08)'; for (let yy = y; yy < y + h; yy += 3) g.fillRect(x, yy, w, 1);
  g.font = `700 9.5px ${UI}`; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = Math.sin(t * 5) > 0 ? '#ff5a4a' : 'rgba(255,90,74,.3)'; g.beginPath(); g.arc(x + 12, y + 12, 3.4, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillText('FRONT DOOR', x + 20, y + 12.5); g.fillText(v.date.toUpperCase(), x + 8, y + h - 16);
  g.restore();
}
function update(dt) {
  const t = G.time; D.t += dt;
  if (D.state === 'idle' && D.t > 1.3 && $('fview').hidden && $('fend').hidden) { go('ring'); }
  if (D.state === 'ring' && !G.RM && (D.t % 1.6) < dt) { tone(784, .16, 'square', .035); tone(988, .22, 'square', .035, .16); }
  if (D.state === 'live' && !D.drag) D.knob = Math.max(0, D.knob - dt * 3);
  if (D.state === 'open') { D.open = Math.min(1, D.open + dt / .7); if (D.t > .5) D.walk = Math.min(1, D.walk + dt / 1.7); if (D.walk >= 1 && !D.said) { D.said = true; says.push({ text: VISITS[D.i].says, life: 2.2 }); tone(660, .1, 'sine', .05); } if (D.t > 4 && $('fview').hidden) { D.said = false; showCard(); } }
  for (let i = says.length - 1; i >= 0; i--) { says[i].life -= dt; if (says[i].life <= 0) says.splice(i, 1); }
  moth.x = lerp(moth.x, L.ix + 130 + Math.sin(t * .8) * 12, 1 - Math.exp(-dt * 2)); moth.y = lerp(moth.y, L.iy + 60 + Math.sin(t * 2.1) * 10, 1 - Math.exp(-dt * 2));
}
function frame(dt) {
  if (!L) return; update(dt);
  const t = G.time, g = cx, fl = L.fl, v = VISITS[D.i]; g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  /* hallway: striped wallpaper, wainscot, floorboards */
  let gr = g.createLinearGradient(0, 0, 0, fl); gr.addColorStop(0, '#e9d8b8'); gr.addColorStop(1, '#f3e6cc'); g.fillStyle = gr; g.fillRect(0, 0, VW, fl);
  g.fillStyle = 'rgba(190,150,110,.16)'; for (let x = (VW / 2 % 44) - 44; x < VW; x += 44) g.fillRect(x, 0, 22, fl);
  const r = R(9); for (let i = 0; i < VW * .3; i++) dab(g, r() * VW, r() * fl, 14 + r() * 40, 5 + r() * 10, 0, r() < .5 ? '#f8eed8' : '#dcc49c', .12); g.globalAlpha = 1;
  g.fillStyle = '#7fa094'; g.fillRect(0, fl - 120, VW, 120); g.fillStyle = '#f6eede'; g.fillRect(0, fl - 126, VW, 8); g.fillRect(0, fl - 10, VW, 10);
  g.strokeStyle = 'rgba(40,70,60,.3)'; g.lineWidth = 1.3; for (let x = (VW / 2 % 110) - 110; x < VW; x += 110) { rr(g, x + 12, fl - 106, 86, 82, 3); g.stroke(); }
  gr = g.createLinearGradient(0, fl, 0, VH); gr.addColorStop(0, '#b9834e'); gr.addColorStop(1, '#8f5f36'); g.fillStyle = gr; g.fillRect(0, fl, VW, VH - fl); g.strokeStyle = 'rgba(70,40,16,.35)'; g.lineWidth = 1.2; for (let k = 1; k < 4; k++) { const y = fl + (VH - fl) * Math.pow(k / 4, 1.5); g.beginPath(); g.moveTo(0, y); g.lineTo(VW, y); g.stroke(); }
  /* the door, and what is behind it when it opens */
  const dx = L.dx, dw = L.dw, dh = L.dh, o = sm(D.open);
  g.fillStyle = '#5a3a26'; rr(g, dx - dw / 2 - 10, fl - dh - 10, dw + 20, dh + 10, 6); g.fill();
  gr = g.createLinearGradient(0, fl - dh, 0, fl); gr.addColorStop(0, '#f6d9a0'); gr.addColorStop(1, '#d8a868'); g.fillStyle = gr; g.fillRect(dx - dw / 2, fl - dh, dw, dh);
  if (D.state === 'open' && D.walk > 0 && D.walk < 1) { const wx = lerp(dx, L.wide ? VW / 2 + 10 : VW / 2 + 30, sm(D.walk)); G.figure(g, wx, fl + 22 * sm(D.walk), 'j', { dir: -1, phase: D.walk * 16, walk: 1, outfit: 'coat', sc: lerp(1.05, 1.4, sm(D.walk)), expr: 'joy' }); }
  const pw = dw * (1 - .8 * o); g.fillStyle = '#8a4a34'; g.fillRect(dx + dw / 2 - pw, fl - dh, pw, dh);
  g.strokeStyle = 'rgba(40,16,10,.4)'; g.lineWidth = 1.6; for (const [a, b, c, d2] of [[.14, .06, .72, .36], [.14, .5, .72, .42]]) { g.strokeRect(dx + dw / 2 - pw + pw * a, fl - dh + dh * b, pw * c, dh * d2); }
  g.fillStyle = '#f2cf62'; g.beginPath(); g.arc(dx + dw / 2 - pw + pw * .14, fl - dh * .48, 5, 0, TAU); g.fill();
  g.fillStyle = '#6e4628'; rr(g, dx - dw / 2 - 8, fl + 10, dw + 16, 16, 4); g.fill(); g.fillStyle = '#f3e6cc'; g.font = `800 10px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('WELCOME', dx, fl + 18.5);
  if (D.state === 'open' && D.walk >= 1) G.figure(g, L.wide ? VW / 2 + 10 : VW / 2 + 30, fl + 22, 'j', { dir: -1, outfit: 'coat', sc: 1.4, expr: 'joy' });
  /* hooks and a picture, so the wall is lived in */
  if (L.wide) { g.fillStyle = '#6e4628'; rr(g, VW / 2 - 470, fl - 330, 150, 10, 4); g.fill(); for (let i = 0; i < 3; i++) { g.fillStyle = '#c9a45c'; g.beginPath(); g.arc(VW / 2 - 445 + i * 50, fl - 318, 5, 0, TAU); g.fill(); } g.fillStyle = '#cdb48e'; rr(g, VW / 2 - 462, fl - 316, 34, 120, 12); g.fill(); g.fillStyle = '#27305a'; rr(g, VW / 2 - 412, fl - 316, 34, 130, 12); g.fill(); }
  /* the intercom */
  const ix = L.ix, iy = L.iy, ring = D.state === 'ring';
  g.fillStyle = 'rgba(60,40,20,.25)'; rr(g, ix - 104, iy + 6, 216, 290, 16); g.fill(); g.fillStyle = '#ece7dc'; rr(g, ix - 108, iy, 216, 290, 16); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; rr(g, ix - 104, iy + 3, 208, 5, 3); g.fill();
  g.fillStyle = '#17161a'; rr(g, L.sx - 4, L.sy - 4, 192, 148, 10); g.fill();
  if (D.state === 'live' || D.state === 'open') camera(g, L.sx, L.sy, 184, 140, v, t);
  else { g.fillStyle = ring && Math.sin(t * 9) > 0 ? '#2f4a7a' : '#1f2230'; rr(g, L.sx, L.sy, 184, 140, 8); g.fill(); if (ring) { g.save(); g.translate(ix, L.sy + 62); g.rotate(Math.sin(t * 22) * .25); g.fillStyle = '#f2cf62'; g.beginPath(); g.moveTo(-16, 8); g.quadraticCurveTo(-14, -18, 0, -20); g.quadraticCurveTo(14, -18, 16, 8); g.closePath(); g.fill(); g.beginPath(); g.arc(0, 12, 5, 0, TAU); g.fill(); g.restore(); g.fillStyle = '#fff'; g.font = `700 11px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FRONT DOOR', ix, L.sy + 106); g.fillText('Tap to answer', ix, L.sy + 122); } }
  g.fillStyle = '#b9b2a4'; for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(ix - 60 + i * 9, iy + 180 + j * 9, 2, 0, TAU); g.fill(); } g.fillStyle = D.state === 'open' ? '#5fc86a' : ring ? '#f2b45c' : '#b9b2a4'; g.beginPath(); g.arc(ix + 70, iy + 189, 7, 0, TAU); g.fill();
  /* the swipe track */
  const live = D.state === 'live', kx = L.tx + 17 + D.knob * (L.tw - 34);
  g.fillStyle = live ? '#2c2a3d' : '#cfc8ba'; rr(g, L.tx, L.ty, L.tw, 34, 17); g.fill(); g.fillStyle = live ? 'rgba(251,243,223,.8)' : 'rgba(255,255,255,.6)'; g.font = `700 11.5px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(D.state === 'open' ? 'Open' : 'Swipe to open', L.tx + L.tw / 2 + 10, L.ty + 17.5);
  g.fillStyle = live ? '#f2b45c' : '#ece7dc'; g.beginPath(); g.arc(kx, L.ty + 17, 14, 0, TAU); g.fill(); g.strokeStyle = live ? '#2c2a3d' : '#b9b2a4'; g.lineWidth = 2.4; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(kx - 3, L.ty + 12); g.lineTo(kx + 3, L.ty + 17); g.lineTo(kx - 3, L.ty + 22); g.stroke();
  const pu = .5 + .5 * Math.sin(t * 5); g.strokeStyle = `rgba(255,250,220,${.5 + .4 * pu})`; g.lineWidth = 3.5; if (ring) { rr(g, L.sx - 8 - pu * 3, L.sy - 8 - pu * 3, 200 + pu * 6, 156 + pu * 6, 12); g.stroke(); } else if (live && !D.drag && D.knob < .05) { rr(g, L.tx - 5 - pu * 2, L.ty - 5 - pu * 2, L.tw + 10 + pu * 4, 44 + pu * 4, 22); g.stroke(); }
  for (const q of says) { const x = (L.wide ? VW / 2 + 10 : VW / 2 + 30) - 10, y = fl - 190; g.font = `700 15px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(q.text).width + 26; g.globalAlpha = Math.min(1, q.life * 2); g.fillStyle = PAPER; rr(g, x - w / 2, y - 15, w, 30, 15); g.fill(); g.beginPath(); g.moveTo(x - 6, y + 14); g.lineTo(x + 2, y + 26); g.lineTo(x + 8, y + 14); g.fill(); g.fillStyle = INK; g.fillText(q.text, x, y + .5); g.globalAlpha = 1; }
  g.globalCompositeOperation = 'lighter'; if (o > 0) glow(g, dx, fl - dh / 2, 260, '255,214,150', .3 * o); glow(g, moth.x, moth.y, 46, '255,214,130', .34 + .08 * Math.sin(t * 6)); g.globalCompositeOperation = 'source-over';
  { const f = G.RM ? .6 : Math.abs(Math.sin(t * 17)); g.fillStyle = 'rgba(255,246,214,.94)'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(moth.x + d * (2 + 4.5 * f), moth.y - 2, 1.6 + 5 * f, 5.4, d * .5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(moth.x + d * (1.5 + 3 * f), moth.y + 4, 1.2 + 3 * f, 3.4, d * -.4, 0, TAU); g.fill(); } g.fillStyle = '#ffd874'; ell(g, moth.x, moth.y, 2.2, 4.6); g.fill(); }
  G.paper(g, .34);
}

const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
const busy = () => !active || !$('fview').hidden || !$('fend').hidden;
cv.addEventListener('pointerdown', e => {
  if (busy()) return; const [x, y] = pt(e);
  if (D.state === 'ring' && x > L.sx - 14 && x < L.sx + 198 && y > L.sy - 14 && y < L.sy + 154) { answer(); return; }
  if (D.state === 'live' && x > L.tx - 10 && x < L.tx + L.tw + 10 && y > L.ty - 14 && y < L.ty + 48) { D.drag = true; D.knob = clamp((x - L.tx - 17) / (L.tw - 34), 0, 1); try { cv.setPointerCapture(e.pointerId); } catch (_) { /* fine without capture */ } e.preventDefault(); }
});
cv.addEventListener('pointermove', e => { if (!active || !D.drag) return; D.knob = clamp((pt(e)[0] - L.tx - 17) / (L.tw - 34), 0, 1); if (D.knob > .92) { D.drag = false; unlock(); } });
const letGo = () => { D.drag = false; }; cv.addEventListener('pointerup', letGo); cv.addEventListener('pointercancel', letGo);
addEventListener('keydown', e => { if (busy() || e.metaKey || e.ctrlKey || (e.key !== ' ' && e.key !== 'Enter') || (e.target && e.target.tagName === 'BUTTON')) return; e.preventDefault(); if (D.state === 'ring') answer(); else if (D.state === 'live') unlock(); });
const soundLabel = () => { $('fsound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('fsound').setAttribute('aria-pressed', G.sound); };
$('fsound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
$('fleave').addEventListener('click', () => G.go('road', { atDoor: true }));
$('fclose').addEventListener('click', closeCard);
$('fstay').addEventListener('click', () => { $('fend').hidden = true; });
$('fagain').addEventListener('click', () => { $('fend').hidden = true; D.i = 0; D.open = 0; D.walk = 0; D.knob = 0; go('idle'); });
$('fback').addEventListener('click', () => { $('fend').hidden = true; G.go('road', { atDoor: true }); });

G.scenes.frontdoor = {
  frame, resize: layout,
  enter() { active = true; $('fui').hidden = false; layout(); if (D.state !== 'done') go(D.state === 'open' ? 'idle' : D.state); setStep(); soundLabel(); moth.x = L.ix + 130; moth.y = L.iy + 60; if (document.fonts && document.fonts.load) document.fonts.load('700 11px Nunito'); },
  leave() { active = false; D.drag = false; $('fview').hidden = true; $('fend').hidden = true; $('fui').hidden = true; },
  debug: { D, get L() { return L; }, get S() { return S; }, answer, unlock }
};
})();
