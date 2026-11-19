/* The General Assembly of two. The hall, two delegations, and an agenda of resolutions about the one week they
   interned together. Jana votes; the chair (the moth) bangs the gavel; each adopted resolution opens its photo or clip. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, TAU, R, dab, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif';
const INK = '#2c2a3d', PAPER = '#fbf3df';
const AGENDA = [
  { text: 'That the badge be worn at all times, including at dinner.', items: [{ id: 'badge', media: 'photo', title: 'The badge', text: 'Shown off across the table, with the look that goes with it.' }] },
  { text: 'That the commute counts as part of the working day.', items: [{ id: 'commute', media: 'clip', title: 'The commute', text: 'Lanyards on, iced coffees in hand, waiting for the train.' }, { id: 'band', media: 'clip', title: 'The morning band', text: 'Two guitars in the subway car, playing us to work.' }] },
  { text: 'That iced coffee is essential equipment for diplomacy.', items: [{ id: 'plaza', media: 'photo', title: 'Outside the building', text: 'Flags behind you, sun in your eyes, coffee secured.' }] },
  { text: 'That we were really in this room.', items: [{ id: 'hall', media: 'photo', title: 'The hall', text: 'Empty, gold, and much bigger than it looks on the news.' }] },
  { text: 'That the rainbow bagel is a legitimate lunch.', items: [{ id: 'bagel', media: 'photo', title: 'Lunch on the terrace', text: 'A bagel in every colour, by the river, in a pinstripe top.' }] },
  { text: 'That the view deserves a recess.', items: [{ id: 'window', media: 'photo', title: 'From the window', text: 'The flags in a row, and the silver spire between the buildings.' }, { id: 'roses', media: 'photo', title: 'The rose garden', text: 'Roses in front, the skyline across the water.' }] },
  { text: 'That the working day ends when we say so.', items: [{ id: 'night', media: 'photo', title: 'After hours', text: 'Blurry, laughing, lanyard still on.' }] },
  { text: 'That one week together was not enough.', items: [] }
];
const LINES = { favour: 'Adopted.', against: 'Objection noted. Adopted anyway.', abstain: 'Adopted. One delegate pretended not to care.' };
let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false, view = null;
const U = { i: 0, state: 'read', t: 0, vote: null, raise: 0, gavel: 0, done: 0, banged: false, endShown: false };
const says = [], moth = { x: 0, y: 0 };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };

function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S; const wide = VW >= 760, cxm = VW / 2, gw = wide ? 190 : 124;
  const gt = wide ? 150 : 250, gb = VH - (wide ? 300 : 330);
  L = { wide, cxm, gw, gt, gb, sw: wide ? 150 : 96, sh: wide ? 96 : 76, sy: gb - (wide ? 150 : 130), desk: VH - 196, jx: cxm - (wide ? 120 : 84), fx: cxm + (wide ? 120 : 84) };
  const key = `${Math.round(VW)}x${Math.round(VH)}`; if (!SPR || SPR.key !== key) SPR = { key, hall: G.spr(VW, VH, drawHall, clamp(S * G.DPR, 1, 2.5)) };
  $('uui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function drawHall(g, w, h) {
  const r = R(1945), cxm = L.cxm, gw = L.gw, gt = L.gt, gb = L.gb;
  g.fillStyle = '#2b231c'; g.fillRect(0, 0, w, h);
  /* slatted wood walls curving in toward the gold */
  for (const d of [-1, 1]) {
    const x0 = d < 0 ? 0 : cxm + gw / 2, x1 = d < 0 ? cxm - gw / 2 : w, gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(d < 0 ? 0 : 1, '#5a4228'); gr.addColorStop(d < 0 ? 1 : 0, '#9a7444'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(x0, gt - 60); g.lineTo(x1, gt - 60); g.lineTo(x1, gb); g.lineTo(x0, gb); g.fill();
    g.strokeStyle = 'rgba(40,26,12,.4)'; g.lineWidth = 1.4; for (let x = x0; x < x1; x += 7) { g.beginPath(); g.moveTo(x, gt - 60); g.lineTo(x, gb); g.stroke(); }
  }
  /* ceiling and the ring of lights */
  let gr = g.createLinearGradient(0, 0, 0, gt); gr.addColorStop(0, '#1c1712'); gr.addColorStop(1, '#3a2f24'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, gt - 40); g.quadraticCurveTo(cxm, gt - 100, 0, gt - 40); g.fill();
  g.fillStyle = '#0c1226'; ell(g, cxm, gt - 110 < 60 ? 60 : gt - 110, Math.min(w * .42, 420), L.wide ? 44 : 60); g.fill();
  /* the gold wall and its emblem */
  gr = g.createLinearGradient(cxm - gw / 2, 0, cxm + gw / 2, 0); gr.addColorStop(0, '#b98a2c'); gr.addColorStop(.5, '#e9c25a'); gr.addColorStop(1, '#b98a2c'); g.fillStyle = gr; g.beginPath(); g.moveTo(cxm - gw * .42, gt - 60); g.lineTo(cxm + gw * .42, gt - 60); g.lineTo(cxm + gw / 2, gb); g.lineTo(cxm - gw / 2, gb); g.fill();
  for (let i = 0; i < 160; i++) dab(g, cxm - gw / 2 + r() * gw, gt - 60 + r() * (gb - gt + 60), 2 + r() * 5, 5 + r() * 10, 0, r() < .5 ? '#f6d87a' : '#a87a22', .2); g.globalAlpha = 1;
  const ey = lerp(gt, gb, .42), er = gw * .22; g.fillStyle = '#8a6a44'; g.beginPath(); g.arc(cxm, ey, er * 1.25, 0, TAU); g.fill(); g.fillStyle = '#d8d2c0'; g.beginPath(); g.arc(cxm, ey, er * 1.1, 0, TAU); g.fill();
  g.strokeStyle = '#7a6a4c'; g.lineWidth = 1.2; for (const k of [.3, .55, .8]) { g.beginPath(); g.arc(cxm, ey, er * k, 0, TAU); g.stroke(); } for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.moveTo(cxm, ey); g.lineTo(cxm + Math.cos(a) * er * .8, ey + Math.sin(a) * er * .8); g.stroke(); }
  for (const d of [-1, 1]) for (let i = 0; i < 7; i++) { const a = Math.PI / 2 + d * (.35 + i * .32); dab(g, cxm + Math.cos(a) * er * .96, ey + Math.sin(a) * er * .96, er * .14, er * .06, a + Math.PI / 2, '#7a6a4c', 1); } g.globalAlpha = 1;
  /* the rostrum */
  g.fillStyle = '#1f3a34'; rr(g, cxm - gw * .34, gb - 40, gw * .68, 44, 3); g.fill(); g.fillStyle = '#2f5a50'; rr(g, cxm - gw * .22, gb - 16, gw * .44, 26, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(cxm - gw * .34, gb - 40, gw * .68, 3);
  /* carpet and the rows of desks */
  gr = g.createLinearGradient(0, gb, 0, h); gr.addColorStop(0, '#3f6a60'); gr.addColorStop(1, '#2a4a44'); g.fillStyle = gr; g.fillRect(0, gb, w, h - gb);
  const rows = 5; for (let k = 0; k < rows; k++) { const u = k / rows, y = gb + 22 + u * u * (L.desk - gb - 70) + k * 16, dh = 9 + k * 4, half = w * (.2 + .09 * k), gap = 22 + k * 10;
    for (const d of [-1, 1]) { const x0 = d < 0 ? cxm - half : cxm + gap, ww = half - gap; g.fillStyle = '#1c2a44'; for (let x = x0 + 6; x < x0 + ww - 6; x += 16 + k * 5) { rr(g, x, y - dh * 1.5, 9 + k * 3, dh * 1.6, 3); g.fill(); } g.fillStyle = '#c9a66a'; rr(g, x0, y, ww, dh, 2); g.fill(); g.fillStyle = '#7f9a4c'; g.fillRect(x0, y, ww, dh * .34); } }
}

/* ------------------------------------------------------------------ the two delegates and their desk */
function delegate(g, x, who, t) {
  const j = who === 'j', y = L.desk + 76, d = j ? 1 : -1, k = G.people[who], raise = j ? (U.vote === 'favour' ? U.raise : 0) : U.raise;
  g.fillStyle = '#1c2a44'; rr(g, x - 46, y - 40, 92, 150, 16); g.fill();
  if (raise > 0) { const hx = x - d * 44, hy = y - 30 - 96 * sm(raise) + Math.sin(t * 9) * 2 * raise; g.lineCap = 'round'; g.strokeStyle = j ? '#fdfbf4' : k.skin; g.lineWidth = 15; g.beginPath(); g.moveTo(x - d * 30, y - 14); g.lineTo(hx, hy + 18); g.stroke(); g.fillStyle = k.skin; g.beginPath(); g.arc(hx, hy + 6, 9, 0, TAU); g.fill(); }
  g.fillStyle = j ? '#fdfbf4' : '#1c1c22'; g.beginPath(); g.moveTo(x - 44, y + 60); g.quadraticCurveTo(x - 42, y - 22, x - 14, y - 26); g.lineTo(x + 14, y - 26); g.quadraticCurveTo(x + 42, y - 22, x + 44, y + 60); g.closePath(); g.fill();
  if (!j) { g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(x + i * 10, y - 22); g.lineTo(x + i * 11, y + 60); g.stroke(); } }
  g.fillStyle = k.skin; g.fillRect(x - 7, y - 40, 14, 18);
  g.strokeStyle = '#2f62c0'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 12, y - 26); g.lineTo(x + d * 4, y + 12); g.lineTo(x + 12, y - 26); g.stroke(); g.fillStyle = '#5f9fd8'; rr(g, x + d * 4 - 8, y + 10, 16, 22, 2); g.fill(); g.fillStyle = '#fdfbf4'; g.fillRect(x + d * 4 - 5, y + 13, 10, 8);
  const expr = U.state === 'tally' ? (j && U.vote === 'against' ? 'smile' : 'joy') : 'smile';
  g.save(); g.translate(x, y - 68); g.scale(d, 1); G.head(g, who, { r: 30, len: 76, expr, blink: !G.RM && ((t + (j ? 0 : 1.7)) % 3.6) < .12, t }); g.restore();
}
function plate(g, x, name) { g.fillStyle = '#17161a'; rr(g, x - 46, L.desk - 26, 92, 24, 3); g.fill(); g.fillStyle = '#fbf6ea'; g.font = `800 13px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; let w = 0; for (const ch of name) w += g.measureText(ch).width + 2; let lx = x - w / 2 + 1; g.textAlign = 'left'; for (const ch of name) { g.fillText(ch, lx, L.desk - 13.5); lx += g.measureText(ch).width + 2; } }
function screen(g, x, title, big, col) {
  const w = L.sw, h = L.sh, y = L.sy; g.fillStyle = '#0b0c10'; rr(g, x - w / 2, y, w, h, 4); g.fill(); g.strokeStyle = '#3a3c44'; g.lineWidth = 2; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#8fb4ff'; g.font = `800 ${L.wide ? 11 : 9}px ${UI}`; g.fillText(title, x, y + h * .24); g.fillStyle = col; let fs = L.wide ? 30 : 22; g.font = `800 ${fs}px ${UI}`; while (g.measureText(big).width > w - 14 && fs > 10) { fs--; g.font = `800 ${fs}px ${UI}`; } g.fillText(big, x, y + h * .62);
}

/* ------------------------------------------------------------------ the session */
function setStep() {
  const a = AGENDA[U.i]; $('ustep').textContent = U.state === 'over' ? 'The session is adjourned.' : `Resolution ${U.i + 1} of ${AGENDA.length}. ${a.text}`;
  $('ucount').textContent = `Adopted ${U.done} of ${AGENDA.length}`; $('ubar').hidden = U.state !== 'read';
}
function vote(v) { if (U.state !== 'read' || !active) return; U.vote = v; U.state = 'tally'; U.t = 0; U.raise = 0; U.banged = false; setStep(); tone(v === 'against' ? 330 : 523, .14, 'sine', .06); }
const vid = $('uvid'), pic = $('uimg');
function show() {
  const a = view.a, it = a.items[view.i], photo = it.media === 'photo'; $('uno').textContent = `Annex to resolution ${U.i + 1}` + (a.items.length > 1 ? `  ·  ${view.i + 1} of ${a.items.length}` : ''); $('utitle').textContent = it.title; $('utext').textContent = it.text;
  vid.pause(); vid.hidden = photo; pic.hidden = !photo; $('unav').hidden = a.items.length < 2; $('up').disabled = view.i === 0; $('un').disabled = view.i === a.items.length - 1;
  if (photo) { vid.removeAttribute('src'); vid.load(); pic.alt = it.title; pic.src = `media/un_${it.id}.jpg`; } else { pic.removeAttribute('src'); vid.muted = !G.sound; vid.loop = true; vid.poster = `media/un_${it.id}.jpg`; vid.src = `media/un_${it.id}.mp4`; const p = vid.play(); if (p && p.catch) p.catch(() => { /* she can press play herself */ }); }
}
function closeView() { vid.pause(); vid.removeAttribute('src'); vid.load(); pic.removeAttribute('src'); $('uview').hidden = true; view = null; advance(); }
function advance() { if (U.i < AGENDA.length - 1) { U.i++; U.state = 'read'; U.vote = null; U.raise = 0; U.t = 0; setStep(); } }
function update(dt) {
  const t = G.time; U.t += dt; U.gavel = Math.max(0, U.gavel - dt * 4);
  if (U.state === 'tally') {
    U.raise = Math.min(1, U.raise + dt * 3);
    if (U.t > 1.1 && !U.banged) { U.banged = true; U.gavel = 1; U.done = U.i + 1; says.push({ text: U.i === AGENDA.length - 1 ? 'Adopted unanimously.' : LINES[U.vote], life: 2.4 }); tone(140, .12, 'square', .08); tone(110, .16, 'square', .06, .14); setStep(); }
    if (U.t > 3 && $('uview').hidden && $('uend').hidden) { const a = AGENDA[U.i]; if (a.items.length) { view = { a, i: 0 }; $('uview').hidden = false; show(); $('uclose').focus(); } else if (!U.endShown) { U.endShown = true; U.state = 'over'; setStep(); $('uend').hidden = false; $('ustay').focus(); [523, 659, 784, 1047].forEach((f, i) => tone(f, .9, 'sine', .05, i * .22)); } }
  }
  for (let i = says.length - 1; i >= 0; i--) { says[i].life -= dt; if (says[i].life <= 0) says.splice(i, 1); }
  moth.x = L.cxm + Math.sin(t * .8) * 6; moth.y = L.gb - 62 + Math.sin(t * 2.1) * 5;
}
function frame(dt) {
  if (!L || !SPR) return; update(dt);
  const t = G.time, g = cx, cxm = L.cxm, a = AGENDA[U.i]; g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(SPR.hall, 0, 0, VW, VH);
  /* the ring of lights, the glow on the gold */
  const ry = L.gt - 110 < 60 ? 60 : L.gt - 110, rx = Math.min(VW * .42, 420), rry = L.wide ? 44 : 60; g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 34; i++) { const an = i / 34 * TAU, x = cxm + Math.cos(an) * rx * .86, y = ry + Math.sin(an) * rry * .76, tw = G.RM ? .8 : .7 + .3 * Math.sin(t * 2 + i * 1.7); glow(g, x, y, 9, '230,240,255', .7 * tw); g.fillStyle = `rgba(255,255,255,${tw})`; g.fillRect(x - 1.2, y - 1.2, 2.4, 2.4); }
  glow(g, cxm, lerp(L.gt, L.gb, .5), L.gw * 1.5, '255,214,120', .16 + .03 * Math.sin(t * 1.3)); g.globalCompositeOperation = 'source-over';
  /* the two screens: the item, and the vote */
  const off = L.gw / 2 + L.sw / 2 + (L.wide ? 26 : 8), tally = U.state === 'tally' || U.state === 'over';
  screen(g, cxm - off, 'RESOLUTION', `${U.i + 1} / ${AGENDA.length}`, '#fbf6ea');
  const res = !tally ? ['THE VOTE', '· · ·', '#8fb4ff'] : U.vote === 'favour' ? ['IN FAVOUR', '2 – 0', '#7fe08a'] : U.vote === 'against' ? ['TIE, CHAIR DECIDES', '1 – 1', '#ffb53c'] : ['ONE ABSTENTION', '1 – 0', '#7fe08a']; screen(g, cxm + off, res[0], res[1], res[2]);
  /* the chair: the moth, with a gavel */
  g.save(); g.translate(cxm + 22, L.gb - 34); g.rotate(-.9 + U.gavel * 1.1); g.fillStyle = '#6e4628'; rr(g, -2, -22, 4, 24, 2); g.fill(); g.fillStyle = '#8a5e3c'; rr(g, -9, -30, 18, 10, 3); g.fill(); g.restore();
  g.globalCompositeOperation = 'lighter'; glow(g, moth.x, moth.y, 40, '255,214,130', .4 + .08 * Math.sin(t * 6)); g.globalCompositeOperation = 'source-over';
  { const f = G.RM ? .6 : Math.abs(Math.sin(t * 17)); g.fillStyle = 'rgba(255,246,214,.94)'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(moth.x + d * (2 + 4.5 * f), moth.y - 2, 1.6 + 5 * f, 5.4, d * .5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(moth.x + d * (1.5 + 3 * f), moth.y + 4, 1.2 + 3 * f, 3.4, d * -.4, 0, TAU); g.fill(); } g.fillStyle = '#ffd874'; ell(g, moth.x, moth.y, 2.2, 4.6); g.fill(); }
  /* their desk, nameplates, microphones, and the two of them */
  const dy = L.desk, dw = Math.min(VW - 16, L.wide ? 620 : 420); g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, cxm - dw / 2 + 3, dy + 4, dw, 30, 5); g.fill(); g.fillStyle = '#c9a66a'; rr(g, cxm - dw / 2, dy, dw, 30, 5); g.fill(); g.fillStyle = '#8fae58'; g.fillRect(cxm - dw / 2, dy, dw, 9); g.fillStyle = 'rgba(255,240,200,.35)'; g.fillRect(cxm - dw / 2, dy, dw, 2);
  const px = L.wide ? 232 : 150; plate(g, cxm - px, 'JANA'); plate(g, cxm + px, 'MEHER');
  g.strokeStyle = '#17161a'; g.lineWidth = 2.4; g.lineCap = 'round'; for (const x of [cxm - 22, cxm + 22]) { g.beginPath(); g.moveTo(x, dy + 2); g.quadraticCurveTo(x, dy - 24, x + (x < cxm ? -10 : 10), dy - 34); g.stroke(); g.fillStyle = '#17161a'; ell(g, x + (x < cxm ? -11 : 11), dy - 36, 4, 5.4); g.fill(); }
  delegate(g, L.jx, 'j', t); delegate(g, L.fx, 'f', t);
  for (const q of says) { const y = L.gb - 96; g.font = `700 15px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(q.text).width + 26; g.globalAlpha = Math.min(1, q.life * 2); g.fillStyle = PAPER; rr(g, cxm - w / 2, y - 15, w, 30, 15); g.fill(); g.fillStyle = INK; g.fillText(q.text, cxm, y + .5); g.globalAlpha = 1; }
  G.paper(g, .42);
}

addEventListener('keydown', e => {
  if (!active || e.metaKey || e.ctrlKey) return;
  if (!$('uview').hidden) { if (e.key === 'Escape') closeView(); else if (e.key === 'ArrowRight' && view.i < view.a.items.length - 1) { view.i++; show(); } else if (e.key === 'ArrowLeft' && view.i > 0) { view.i--; show(); } return; }
  if (U.state === 'read' && $('uend').hidden) { const v = { 1: 'favour', 2: 'against', 3: 'abstain', y: 'favour', n: 'against' }[e.key]; if (v) vote(v); }
});
const soundLabel = () => { $('usound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('usound').setAttribute('aria-pressed', G.sound); };
$('usound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
$('uleave').addEventListener('click', () => G.go('map'));
$('uyes').addEventListener('click', () => vote('favour')); $('uno2').addEventListener('click', () => vote('against')); $('uabs').addEventListener('click', () => vote('abstain'));
$('up').addEventListener('click', () => { if (view && view.i > 0) { view.i--; show(); } }); $('un').addEventListener('click', () => { if (view && view.i < view.a.items.length - 1) { view.i++; show(); } });
$('uclose').addEventListener('click', closeView);
$('ustay').addEventListener('click', () => { $('uend').hidden = true; });
$('uagain').addEventListener('click', () => { $('uend').hidden = true; Object.assign(U, { i: 0, state: 'read', t: 0, vote: null, raise: 0, done: 0, endShown: false }); setStep(); });
$('uback').addEventListener('click', () => { $('uend').hidden = true; G.go('map'); });
vid.addEventListener('error', () => { if (!$('uview').hidden && vid.getAttribute('src')) $('utext').textContent += ' (This clip is not loaded here.)'; });

G.scenes.un = {
  frame, resize: layout,
  enter() { active = true; $('uui').hidden = false; layout(); if (U.state === 'tally') { U.state = 'read'; U.vote = null; } setStep(); soundLabel(); if (document.fonts && document.fonts.load) document.fonts.load('800 13px Nunito'); },
  leave() { active = false; if (!$('uview').hidden) { vid.pause(); $('uview').hidden = true; view = null; } $('uend').hidden = true; $('uui').hidden = true; },
  debug: { U, AGENDA, vote }
};
})();
