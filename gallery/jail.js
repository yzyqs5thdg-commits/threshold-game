/* The jail. One round too many at the bar and the two of them are booked: mugshots first, then a cell guarded by
   a sleeping pigeon in a cap. Drink some water, pass the sobriety test, and bail is paid in scallion dumplings. */
(() => {
'use strict';
const G = window.G; if (!G || !G.duo) return;
const { cv, cx, lerp, clamp, sm, TAU, R, dab, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif', DISPLAY = '"Fraunces", "Iowan Old Style", Georgia, serif';
const INK = '#2c2a3d', PAPER = '#fbf3df';
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };
const FACES = [
  { id: 'innocent', name: 'Innocent', P: { j: { dx: .05, gy: -1, mouth: 'pout' }, f: { dx: .05, gy: -1, mouth: 'pout' } } },
  { id: 'side', name: 'Side-eye', P: { j: { dx: .05, gaze: 1, mouth: 'smirk' }, f: { dx: .05, gaze: 1, mouth: 'pout' } } },
  { id: 'tongue', name: 'Tongue out', P: { j: { dx: .05, tilt: .1, eyes: ['open', 'happy'], mouth: 'tongue' }, f: { dx: .05, tilt: .1, eyes: ['open', 'happy'], mouth: 'tongue' } } },
  { id: 'laugh', name: 'Can’t keep a straight face', P: { j: { dx: .1, tilt: .14, expr: 'joy' }, f: { dx: .1, tilt: .1, expr: 'joy' } } }
];
const CELL = { j: { dx: .08, tilt: .06, gy: .5, mouth: 'pout' }, f: { dx: .08, tilt: .06, gy: .5, mouth: 'pout' } };
const OOPS = { j: { dx: .08, tilt: -.1, mouth: 'o' }, f: { dx: .08, tilt: -.1, mouth: 'o' } };
const FREE = { j: { dx: .2, tilt: .12, expr: 'joy' }, f: { dx: .2, tilt: .12, expr: 'joy' } };
const CHARGES = ['Drunk and extremely loud', 'Singing on the subway', 'Ordering one more. Four times.', 'Telling the bartender she is our best friend', 'Attempted adoption of a pigeon', 'Dancing at Table for two', 'Calling a wine flight research', 'Impersonating a UN delegate', 'Crying about how much we love each other'];
/* the sobriety test is a memory game made of things Jana has really said: each pair is the start of a line and how it ended */
const QUOTES = [
  ['TSA: Are you drunk?????', 'Just little tipsy'],
  ['Meher: Do you have a coin?', 'No, but I have an Adderall pill'],
  ['Meher: That\u2019s so rude', 'Thank you so much'],
  ['Meher: Come sit next to me', 'I\u2019m okay'],
  ['If you were a character,', 'you\u2019d be a witch'],
  ['I know I\u2019m kind of quiet', 'but in my head I\u2019m singing Lana Del Rey'],
  ['There were 2 seconds of silence, so', 'Opa Gangnam Style'],
  ['I won\u2019t speak', 'Periodddd'],
  ['Why are you so short?', 'There was a war so I stopped growing'],
  ['How God speaks of me:', '11/10, would smash'],
  ['4 drinks is my maximum', 'Cheers to that'],
  ['Go pray to whatever god you pray to', 'and then pray to mine'],
  ['Do you want your ashes scattered in the C line', 'so that way you\u2019ll go on forever'],
  ['My therapists were like', 'we\u2019re going to friendssss. Clock itttt'],
  ['I\u2019m not a refugee no more, my country got freed', 'Yeahhhhhh babyyyy'],
  ['Screams in a bar:', 'I\u2019M JUST HORNYYYYYYYY'],
  ['Mars was', 'underground ????'],
  ['Urgabhiyysjaburhggh, I wanna be a part of it', 'NEW YORK, NEW YORK'],
  ['Bakri. Halal bakri,', 'YMCAAAAAA'],
  ['Your answers', 'have been prayed'],
  ['If I was the president of Syria and you were the president of India,', 'we\u2019d be allies <3'],
  ['No matter what you say, I know deep down', 'I \u201ctouch\u201d your soul'],
  ['You\u2019ve stopped writing about me,', 'I\u2019m sad'],
  ['Meher: When you come to India you\u2019re gonna sm fun', 'Lo lu luh x3'],
  ['I\u2019m so happy. I know we\u2019re not doing anything', 'but I\u2019m so happy we\u2019re here'],
  ['Meher: I\u2019m going kill myself', 'Can I watch'],
  ['Showed me a traumatic meme about killing kids', 'because you have means to make more'],
  ['Have you ever poured 7 up on people dying from tear gas.', 'No??? Fuck u!!'],
  ['We will jump off a building together', 'making a Heart'],
  ['All the explosions impacted my ear drumsss.', 'Clockkk ittttt. Pooja what is this behaviour'],
  ['I had a pregnancy scare', 'before I had sex'],
  ['Cried for 2 hours about her hair', 'and spoke to my grandma about it'],
  ['I think we\u2019re getting harassed a lot', 'in the Bahamas'],
  ['JUST FUCKING SLAPPED ME', 'AT HEIGHTS'],
  ['\u201cA package deal\u201d', 'Rich Lauria, Columbia Professor, 2026'],
  ['Aliya: You both love', 'annoying each other'],
  ['I\u2019ve been to so many therapist, in different countries Saraha,', 'there\u2019s no help khalas'],
  ['I kinda wanna make out with someone', 'to get ready for the Bahamas'],
  ['Slurp (ew).', 'Hey now hey now'],
  ['Took a picture of herself', 'and said same'],
  ['Jana zoned out when I was talking.', 'Then laughed at me'],
  ['I\u2019ve already', 'trauma dumped her'],
  ['Hit my hand', '\ud83d\ude21\ud83d\ude21\ud83d\ude21']
];
const NEED = 6;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false, T = null, says = [], parts = [], flash = 0;
const fresh = arrested => { const pool = CHARGES.slice(), ch = []; while (ch.length < 3) ch.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); return { ph: 'mug', t: 0, face: 'innocent', door: 0, water: 3, found: 0, wob: 0, joy: 0, cards: null, pick: [], lock: 0, peek: 0, msg: '', shown: false, arrested, charges: arrested ? ch : ['Nothing yet. Suspiciously sober.'], mug: null, awake: 0, lights: arrested ? 3 : 0 }; };
const faceOf = () => FACES.find(f => f.id === T.face) || FACES[0];

function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S; const wide = VW >= 760, top = wide ? 70 : 104, ph = wide ? Math.min(VH * .56, 400) : Math.min((VW - 24) * .75, VH * .36), pw = ph * 4 / 3, px = wide ? Math.max(16, Math.min((VW - pw) / 2, VW - pw - 24 - 310 / S)) : (VW - pw) / 2, floor = top + ph, wall = wide && px > 190;
  L = { wide, top, px, py: top, pw, ph, floor, my: floor + (wide ? 44 : 50), mw: Math.min(pw - 20, 400), wall, sheet: wall ? { x: Math.max(18, px - 250), y: top + 16, w: Math.min(226, px - 36), h: 210 } : { x: Math.max(14, px - 6), y: floor + (wide ? 34 : 126), w: wide ? 250 : VW * .6, h: 158 }, bird: wide ? [px + pw + Math.min(150, (VW - px - pw) / 2), floor + 158, 1.25] : [VW - 40, floor + 8, .72] };
  { const gr = $('jlgrid'), left = wide ? (px + pw + 24) * S : 12, gt = wide ? (top - 6) * S : (floor + 18) * S, rowH = wide ? clamp(((ph + 10) * S - 18) / 4, 60, 108) : clamp((G.H - gt - 84 - 18) / 4, 54, 98); gr.style.left = left + 'px'; gr.style.top = gt + 'px'; gr.style.width = (wide ? G.W - left - 16 : G.W - 24) + 'px'; gr.style.gridAutoRows = rowH + 'px'; }
  SPR = { room: G.spr(VW, VH, drawRoom, clamp(S * G.DPR, 1, 2.5)) }; if (T && T.mug) T.mug = mugSprite();
  $('jlui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
function heights(g, x, y, w, h) { g.strokeStyle = 'rgba(30,34,40,.34)'; g.fillStyle = 'rgba(30,34,40,.5)'; g.lineWidth = 1.4; g.font = `800 ${Math.max(9, h * .04)}px ${UI}`; g.textAlign = 'left'; g.textBaseline = 'bottom'; ['6\'0"', '5\'8"', '5\'4"', '5\'0"', '4\'8"'].forEach((s, i) => { const yy = y + h * (.1 + i * .17); g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); g.fillText(s, x + 6, yy - 2); for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + w - 12, yy + k * h * .0425); g.lineTo(x + w, yy + k * h * .0425); g.stroke(); } }); }
function drawRoom(g, w, h) {
  const r = R(7707), fl = L.floor, wd = L.wide;
  g.fillStyle = '#8f9a94'; g.fillRect(0, 0, w, fl);
  for (let y = 0, row = 0; y < fl; y += 22, row++) for (let x = -44 + (row % 2) * 22; x < w; x += 44) { g.fillStyle = ['#97a29c', '#8a958f', '#a0aaa4', '#858f8a'][Math.floor(r() * 4)]; g.fillRect(x + 1, y + 1, 42, 20); }
  for (let i = 0; i < w * fl / 4200; i++) dab(g, r() * w, r() * fl, 20 + r() * 50, 8 + r() * 16, r() * 3, r() < .5 ? '#b4beb8' : '#6a746f', .1); g.globalAlpha = 1;
  /* the booking wall behind them */
  g.fillStyle = '#cfd3d2'; g.fillRect(L.px - 8, L.py - 6, L.pw + 16, L.ph + 6); heights(g, L.px - 8, L.py - 6, L.pw + 16, L.ph + 6);
  g.fillStyle = '#5c6660'; g.fillRect(L.px - 14, L.py - 12, L.pw + 28, 7); g.fillRect(L.px - 14, L.py - 12, 7, L.ph + 12); g.fillRect(L.px + L.pw + 7, L.py - 12, 7, L.ph + 12);
  /* tally marks scratched into the brick, and a small barred window with the moon in it */
  g.strokeStyle = 'rgba(40,46,44,.55)'; g.lineWidth = 1.6; g.lineCap = 'round'; const tx = wd ? L.px + L.pw + 34 : 18, ty = wd ? L.top + 150 : L.top - 34; for (let k = 0; k < (wd ? 14 : 9); k++) { const x = tx + k * 7 + Math.floor(k / 5) * 9, y = ty + (r() - .5) * 2; if (k % 5 === 4) { g.beginPath(); g.moveTo(x - 31, y + 14); g.lineTo(x - 3, y - 2); g.stroke(); } else { g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 2, y + 14); g.stroke(); } }
  if (wd) { const wx = L.px + L.pw + 44, wy = L.top + 14, ww = 124, wh = 96; g.fillStyle = '#4c5651'; rr(g, wx - 7, wy - 7, ww + 14, wh + 14, 6); g.fill(); const gr = g.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, '#1c2748'); gr.addColorStop(1, '#3a4a84'); g.fillStyle = gr; g.fillRect(wx, wy, ww, wh); g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(wx + ww * .68, wy + wh * .36, 15, 0, TAU); g.fill(); g.fillStyle = '#2b3868'; g.beginPath(); g.arc(wx + ww * .74, wy + wh * .31, 13, 0, TAU); g.fill(); for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(255,246,214,.8)'; g.fillRect(wx + r() * ww, wy + r() * wh, 1.6, 1.6); } g.fillStyle = '#2a302d'; for (let i = 1; i < 5; i++) g.fillRect(wx + ww * i / 5 - 2.5, wy, 5, wh); }
  /* the floor, with a drain, and a ledge to sit on */
  let gr = g.createLinearGradient(0, fl, 0, h); gr.addColorStop(0, '#6a726e'); gr.addColorStop(1, '#565d5a'); g.fillStyle = gr; g.fillRect(0, fl, w, h - fl); for (let i = 0; i < w * (h - fl) / 3000; i++) dab(g, r() * w, fl + r() * (h - fl), 16 + r() * 40, 4 + r() * 8, 0, r() < .5 ? '#7c8480' : '#484e4c', .16); g.globalAlpha = 1;
  g.strokeStyle = 'rgba(30,34,32,.3)'; g.lineWidth = 1.2; for (let x = 40; x < w; x += 120) { g.beginPath(); g.moveTo(x, fl + 16); g.lineTo(x + (x - w / 2) * .16, h); g.stroke(); }
  g.fillStyle = '#7a5c44'; g.fillRect(L.px - 30, fl - 4, L.pw + 60, 14); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(L.px - 30, fl - 4, L.pw + 60, 3); g.fillStyle = '#4e3a2c'; g.fillRect(L.px - 18, fl + 10, 10, 16); g.fillRect(L.px + L.pw + 8, fl + 10, 10, 16);
  /* a tin cup on the ledge and a mouse hole in the skirting */
  g.fillStyle = '#b4bac4'; rr(g, L.px - 22, fl - 20, 13, 16, 2); g.fill(); g.strokeStyle = '#8f949c'; g.lineWidth = 2; g.beginPath(); g.arc(L.px - 24, fl - 12, 5, Math.PI * .5, Math.PI * 1.5); g.stroke();
  const hx = wd ? 70 : VW - 40, hy = fl; g.fillStyle = '#1e2220'; g.beginPath(); g.arc(hx, hy, 12, Math.PI, 0); g.fill(); g.fillStyle = '#b8ac9c'; ell(g, hx - 2, hy - 3, 6, 4); g.fill(); g.beginPath(); g.arc(hx - 6, hy - 7, 3, 0, TAU); g.arc(hx + 1, hy - 8, 3, 0, TAU); g.fill(); g.fillStyle = '#1e2220'; g.beginPath(); g.arc(hx - 5, hy - 3, 1, 0, TAU); g.fill(); g.fillStyle = '#f2c21c'; g.beginPath(); g.moveTo(hx + 12, hy + 12); g.lineTo(hx + 24, hy + 12); g.lineTo(hx + 22, hy + 4); g.fill();
  /* the guard's stool */
  const [bx, by, bs] = L.bird; g.fillStyle = 'rgba(20,24,22,.3)'; ell(g, bx + 4, by + 3, 30 * bs, 6 * bs); g.fill(); g.strokeStyle = '#4e3a2c'; g.lineWidth = 4 * bs; g.beginPath(); g.moveTo(bx - 12 * bs, by - 30 * bs); g.lineTo(bx - 17 * bs, by); g.moveTo(bx + 12 * bs, by - 30 * bs); g.lineTo(bx + 17 * bs, by); g.stroke(); g.fillStyle = '#7a5c44'; ell(g, bx, by - 32 * bs, 22 * bs, 6 * bs); g.fill();
}
function placards(g, w, h, a = 1) {
  const r = h * .19; g.globalAlpha = a;
  for (const [x, who, no] of [[w * .29, 'j', '1502'], [w * .71, 'f', '1503']]) { const k = G.people[who], bw = r * 2.2, bh = r * .98, y = h * .4 + r * 1.98;
    g.fillStyle = '#17181c'; rr(g, x - bw / 2, y, bw, bh, r * .08); g.fill(); g.strokeStyle = '#3a3c44'; g.lineWidth = Math.max(1, r * .04); g.stroke();
    g.fillStyle = '#f4f1e6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${r * .2}px ${UI}`; g.fillText('DEPT. OF TIPSY', x, y + bh * .25); g.font = `800 ${r * .46}px ${UI}`; g.fillText('No. ' + no, x, y + bh * .66);
    for (const d of [-1, 1]) { g.fillStyle = k.skin; g.strokeStyle = k.shade; g.lineWidth = Math.max(1, r * .05); rr(g, x + d * bw / 2 - r * .2, y + bh * .3, r * .4, bh * .5, r * .16); g.fill(); g.stroke(); } }
  g.globalAlpha = 1;
}
function mugSprite() { const w = 220, h = 165, P = faceOf().P; return G.spr(w, h, g => { g.fillStyle = '#cfd3d2'; g.fillRect(0, 0, w, h); heights(g, 0, 0, w, h); G.duo.draw(g, w, h, P, 3); placards(g, w, h); }, clamp(S * G.DPR, 1, 2.5)); }
function wrapText(g, text, x, y, maxW, lh) { let line = '', n = 0; for (const word of text.split(' ')) { if (line && g.measureText(line + ' ' + word).width > maxW) { g.fillText(line, x, y + n * lh); n++; line = word; } else line = line ? line + ' ' + word : word; } g.fillText(line, x, y + n * lh); return n + 1; }
function pigeon(g, t) {
  const [bx, by, s] = L.bird, awake = T.awake > 0, bob = awake ? Math.abs(Math.sin(t * 9)) * 3 : Math.sin(t * 1.6) * 1.2 * (G.RM ? 0 : 1);
  g.save(); g.translate(bx, by - 34 * s - bob); g.scale(-s, s); g.lineCap = 'round';
  g.fillStyle = '#d8402c'; g.fillRect(-5, -4, 2, 6); g.fillRect(3, -4, 2, 6);
  g.fillStyle = '#7d8590'; ell(g, 0, -17, 20, 15); g.fill(); g.fillStyle = '#9aa2ac'; ell(g, -4, -16, 12, 9); g.fill(); g.fillStyle = '#5f6672'; g.beginPath(); g.moveTo(-18, -18); g.lineTo(-30, -11); g.lineTo(-17, -9); g.fill();
  g.fillStyle = '#8fb8a0'; ell(g, 12, -27, 7, 5); g.fill(); g.fillStyle = '#5f6672'; g.beginPath(); g.arc(15, -36, 9, 0, TAU); g.fill(); g.fillStyle = '#e9a52c'; g.beginPath(); g.moveTo(23, -37); g.lineTo(31, -34); g.lineTo(23, -32); g.fill();
  if (awake) { g.fillStyle = '#fff'; g.beginPath(); g.arc(18, -38, 3, 0, TAU); g.fill(); g.fillStyle = '#17181c'; g.beginPath(); g.arc(18.6, -38, 1.5, 0, TAU); g.fill(); } else { g.strokeStyle = '#17181c'; g.lineWidth = 1.4; g.beginPath(); g.arc(18, -38, 2.6, .2, Math.PI - .2); g.stroke(); }
  g.fillStyle = '#1c2748'; g.beginPath(); g.ellipse(14, -44, 10.5, 4.5, -.12, Math.PI, 0); g.fill(); g.fillRect(4, -45.5, 21, 3); g.fillStyle = '#10182e'; g.beginPath(); g.moveTo(22, -43); g.lineTo(31, -41); g.lineTo(22, -40); g.fill(); g.fillStyle = '#e9b44c'; g.beginPath(); g.arc(15, -47, 2, 0, TAU); g.fill();
  /* the keys on its belt */
  const jig = awake ? Math.sin(t * 22) * .3 : 0; g.save(); g.translate(-8, -8); g.rotate(jig); g.strokeStyle = '#e9b44c'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, 4, 4, 0, TAU); g.stroke(); for (const a of [-.4, .3]) { g.save(); g.translate(0, 8); g.rotate(a); g.fillStyle = '#e9b44c'; g.fillRect(-1, 0, 2, 11); g.fillRect(-1, 7, 5, 2); g.fillRect(-1, 10, 4, 2); g.restore(); } g.restore();
  g.restore();
  if (!awake && !G.RM) for (let i = 0; i < 3; i++) { const u = (t * .4 + i / 3) % 1; g.globalAlpha = Math.sin(u * Math.PI) * .9; g.fillStyle = '#f4f1e6'; g.font = `800 ${(9 + u * 9) * s}px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('z', bx - 26 * s - u * 16 * s + Math.sin(u * 6) * 4, by - 84 * s - u * 34 * s); } g.globalAlpha = 1;
}
function bubble(g, text, x, y, a) { g.font = `700 ${L.wide ? 16 : 14}px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(text).width + 26, bx = clamp(x, w / 2 + 8, VW - w / 2 - 8); g.globalAlpha = a; g.fillStyle = PAPER; rr(g, bx - w / 2, y - 16, w, 32, 16); g.fill(); g.fillStyle = INK; g.fillText(text, bx, y + 1); g.globalAlpha = 1; }
const say = (text, who) => says.push({ text, x: L.px + L.pw * (who === 'f' ? .71 : who === 'j' ? .29 : .5), y: L.py + L.ph * .1, life: 2 });

/* ------------------------------------------------------------------ what happens */
function deal() { const rest = shuffle(QUOTES.slice(1)).slice(0, NEED - 1), set = [QUOTES[0], ...rest], cards = []; set.forEach((q, k) => { cards.push({ k, side: 0, text: q[0], full: q, up: false, done: false }); cards.push({ k, side: 1, text: q[1], full: q, up: false, done: false }); }); T.cards = shuffle(cards); T.pick = []; T.found = 0; T.msg = '';
  const gr = $('jlgrid'); gr.textContent = ''; T.cards.forEach((c, i) => { const b = document.createElement('button'); b.type = 'button'; b.addEventListener('click', () => flip(i)); gr.append(b); }); paint(); }
function paint() { const bs = $('jlgrid').children; T.cards.forEach((c, i) => { const b = bs[i], open = c.up || c.done || T.peek > 0; b.className = 'jlcard ' + (open ? (c.side ? 'a' : 'q') : 'down') + (c.done ? ' done' : '') + (open && c.text.length > 40 ? ' long' : ''); b.textContent = open ? c.text : '?'; b.setAttribute('aria-label', open ? c.text : `Card ${i + 1}, face down`); b.disabled = c.done; }); }
function setStep() {
  const p = T.ph; $('jlstep').textContent = p === 'mug' ? (T.arrested ? 'Booked. Mugshots first: pick a face.' : 'Just visiting? Mugshots anyway. Pick a face.') : p === 'flash' ? 'Hold it\u2026' : p === 'cell' ? (T.msg || `Sobriety test: match what you said to how you finished it. ${T.found} of ${NEED}.`) : 'Free to go.';
  $('jlfaces').hidden = p !== 'mug'; $('jlwater').hidden = p !== 'cell'; $('jldo').hidden = p !== 'mug'; $('jlwater').textContent = `Drink water for a peek (${T.water} left)`; $('jlwater').disabled = !T.water || T.peek > 0;
  for (const b of document.querySelectorAll('#jlfaces button')) b.setAttribute('aria-pressed', b.dataset.face === T.face);
}
function act() { if (T.ph !== 'mug') return; T.ph = 'flash'; T.t = 0; flash = 1.25; tone(1568, .05, 'square', .05); tone(220, .12, 'triangle', .07, .03); T.mug = mugSprite(); setStep(); }
function flip(i) {
  if (T.ph !== 'cell' || T.lock > 0 || T.peek > 0) return; const c = T.cards[i]; if (!c || c.up || c.done) return; c.up = true; T.pick.push(c); tone(620 + T.pick.length * 120, .07, 'sine', .05);
  if (T.pick.length === 2) { const [a, b] = T.pick, q = a.side ? b : a, e = a.side ? a : b;
    if (a.k === b.k && a.side !== b.side) { a.done = b.done = true; T.pick = []; T.found++; T.joy = 1.6; T.msg = `\u201c${a.full[0]} ${a.full[1]}\u201d Correct. ${T.found} of ${NEED}.`; tone(659, .14, 'sine', .07); tone(988, .2, 'sine', .06, .1); if (T.found >= NEED) T.lock = .9; }
    else { T.lock = a.side === b.side ? .9 : 1.7; T.wob = 1; T.msg = a.side === b.side ? 'One start and one ending, please.' : `\u201c${q.text} ${e.text}\u201d You did not say that.`; tone(150, .2, 'sawtooth', .05); } }
  paint(); setStep();
}
function water() { if (T.ph !== 'cell' || !T.water || T.peek > 0 || T.lock > 0) return; T.water--; T.peek = 1.8; T.msg = 'Hydrating. Look quickly.'; tone(700, .08, 'sine', .05); tone(560, .08, 'sine', .05, .1); tone(440, .12, 'sine', .05, .2); paint(); setStep(); }
function release() { T.ph = 'free'; T.t = 0; T.awake = 3; [523, 659, 784, 1047].forEach((f, i) => tone(f, .4, 'sine', .06, i * .12)); for (let i = 0; i < 5; i++) tone(1800 + (i % 2) * 300, .05, 'square', .02, .5 + i * .07); if (!G.RM) for (let i = 0; i < 40; i++) { const a = Math.random() * TAU, v = 60 + Math.random() * 160; parts.push({ x: L.px + L.pw / 2, y: L.py + L.ph * .5, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 1 + Math.random(), c: ['#e0604a', '#f2c21c', '#2f8a8c', '#f4a8c0', '#fbf3df'][i % 5] }); } setStep(); }
function update(dt) {
  T.t += dt; flash = Math.max(0, flash - dt * 3.2); T.wob = Math.max(0, T.wob - dt * 1.2); T.joy = Math.max(0, T.joy - dt); T.awake = Math.max(0, T.awake - (T.ph === 'free' ? 0 : dt)); T.lights = Math.max(0, T.lights - dt);
  T.door = clamp(T.door + (T.ph === 'cell' ? 1 : -1) * dt * (G.RM ? 20 : 1.5), 0, 1);
  if (T.ph === 'flash' && T.t > 1.1) { T.ph = 'cell'; T.t = 0; for (let i = 0; i < 3; i++) tone(110 - i * 12, .22, 'square', .07, .5 + i * .05); deal(); setStep(); }
  { const show = T.ph === 'cell' && T.door > .9; if (show !== T.shown) { T.shown = show; $('jlgrid').hidden = !show; } }
  if (T.peek > 0) { T.peek -= dt; if (T.peek <= 0) { T.peek = 0; T.msg = ''; paint(); setStep(); } }
  if (T.lock > 0) { T.lock -= dt; if (T.lock <= 0) { T.lock = 0; if (T.found >= NEED) release(); else { for (const c of T.pick) c.up = false; T.pick = []; T.msg = ''; paint(); setStep(); } } }
  if (T.ph === 'free' && T.t > 2.6 && $('jlend').hidden) { $('jlend').hidden = false; $('jlmap').focus(); }
  for (const q of says) q.life -= dt; says = says.filter(q => q.life > 0);
  for (const q of parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 220 * dt; } parts = parts.filter(q => q.life > 0);
}
function frame(dt) {
  if (!L || !SPR || !T) return; update(dt); const t = G.time, g = cx, still = G.RM ? 0 : 1;
  g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(SPR.room, 0, 0, VW, VH);
  /* the two of them */
  const mug = T.ph === 'mug' || T.ph === 'flash', P = mug ? faceOf().P : T.ph === 'free' || T.joy > 0 ? FREE : T.wob > .3 ? OOPS : CELL, sway = Math.sin(t * 1.4) * .012 * still * (T.arrested ? 1 + T.water * .5 : .3) + Math.sin(t * 18) * .03 * T.wob;
  g.save(); g.beginPath(); g.rect(L.px - 8, L.py - 6, L.pw + 16, L.ph + 2); g.clip(); g.translate(L.px + L.pw / 2, L.py + L.ph); g.rotate(sway); g.translate(-L.pw / 2, -L.ph); G.duo.draw(g, L.pw, L.ph, P, t); if (mug) placards(g, L.pw, L.ph); g.restore();
  /* the bars slide across */
  if (T.door > 0) { const k = sm(T.door), off = (1 - k) * (L.pw + 60); g.save(); g.beginPath(); g.rect(L.px - 14, L.py - 12, L.pw + 28, L.ph + 22); g.clip(); g.translate(off, 0);
    const n = 9; for (let i = 0; i <= n; i++) { const x = L.px - 4 + (L.pw + 8) * i / n, gr = g.createLinearGradient(x - 5, 0, x + 5, 0); gr.addColorStop(0, '#3a403d'); gr.addColorStop(.4, '#8a938e'); gr.addColorStop(1, '#2e3331'); g.fillStyle = gr; g.fillRect(x - 5, L.py - 8, 10, L.ph + 14); }
    g.fillStyle = '#353b38'; g.fillRect(L.px - 10, L.py + L.ph * .1, L.pw + 20, 9); g.fillRect(L.px - 10, L.py + L.ph * .8, L.pw + 20, 9); g.fillStyle = '#4c5450'; rr(g, L.px + L.pw - 34, L.py + L.ph * .42, 30, 44, 4); g.fill(); g.fillStyle = '#17181c'; g.beginPath(); g.arc(L.px + L.pw - 19, L.py + L.ph * .42 + 18, 4.4, 0, TAU); g.fill(); g.fillRect(L.px + L.pw - 21, L.py + L.ph * .42 + 20, 4, 11); g.restore(); }
  /* the charge sheet, with the mugshot clipped to it */
  if (L.wall || T.ph !== 'cell') { const s = L.sheet; g.save(); g.translate(s.x + s.w / 2, s.y); g.rotate(-.015); g.translate(-s.w / 2, 0); g.fillStyle = 'rgba(20,24,22,.3)'; g.fillRect(4, 6, s.w, s.h); g.fillStyle = '#8a5c38'; rr(g, -5, -5, s.w + 10, s.h + 10, 6); g.fill(); g.fillStyle = PAPER; g.fillRect(0, 0, s.w, s.h); g.fillStyle = '#8f949c'; rr(g, s.w / 2 - 22, -11, 44, 14, 4); g.fill();
    const mw = T.mug ? Math.min(74, s.w * .32) : 0; g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'top'; g.font = `800 ${L.wide ? 13 : 12}px ${UI}`; g.fillText('CHARGES', 12, 12); g.fillStyle = '#b8262c'; g.fillRect(12, 29, 58, 2);
    g.fillStyle = INK; g.font = `600 ${L.wide ? 12.5 : 11.5}px ${UI}`; let y = 38; const lh = L.wide ? 16 : 14.5; for (const c of T.charges) { g.fillText('•', 12, y); y += wrapText(g, c, 23, y, s.w - 35 - (y < 38 + mw * .8 ? mw + 6 : 0), lh) * lh + 3; }
    g.font = `italic 600 ${L.wide ? 13.5 : 12.5}px ${DISPLAY}`; g.fillStyle = '#2f6a4a'; wrapText(g, 'Bail: ten scallion dumplings', 12, Math.max(y + 4, s.h - (L.wide ? 40 : 26)), s.w - 22, lh);
    if (T.mug) { g.save(); g.translate(s.w - mw - 10, 12); g.rotate(.04); g.fillStyle = '#fff'; g.fillRect(-3, -3, mw + 6, mw * .75 + 6); g.drawImage(T.mug, 0, 0, mw, mw * .75); g.restore(); } g.restore(); }
  pigeon(g, t);
  for (const q of says) bubble(g, q.text, q.x, q.y - (2 - q.life) * 8, Math.min(1, q.life * 2));
  for (const q of parts) { g.fillStyle = q.c; g.globalAlpha = clamp(q.life, 0, 1); g.save(); g.translate(q.x, q.y); g.rotate(q.life * 9); g.fillRect(-3, -2, 6, 4); g.restore(); } g.globalAlpha = 1;
  /* the lights of the car that brought them in */
  if (T.lights > 0 && !G.RM) { const k = Math.min(1, T.lights) * .22, red = Math.sin(t * 9) > 0; g.fillStyle = red ? `rgba(230,50,60,${k})` : `rgba(60,90,240,${k})`; g.fillRect(0, 0, VW, VH); }
  if (flash > 0) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(255,252,240,${Math.min(1, flash) * (G.RM ? .5 : .96)})`; g.fillRect(0, 0, cv.width, cv.height); }
  G.paper(g, .36);
}
{ const box = $('jlfaces'); for (const f of FACES) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.face = f.id; b.textContent = f.name; b.addEventListener('click', () => { if (T && T.ph === 'mug') { T.face = f.id; tone(784, .08, 'sine', .05); setStep(); } }); box.append(b); } }
$('jldo').addEventListener('click', act); $('jlwater').addEventListener('click', water);
addEventListener('keydown', e => { if (!active || !T || e.metaKey || e.ctrlKey || (e.target && e.target.tagName === 'BUTTON')) return; if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); act(); } });
$('jlmap').addEventListener('click', () => G.go('map')); $('jlbarbtn').addEventListener('click', () => G.go('bar')); $('jlleave').addEventListener('click', () => G.go('map'));
const soundLabel = () => { $('jlsound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('jlsound').setAttribute('aria-pressed', G.sound); };
$('jlsound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });
G.scenes.jail = {
  frame, resize: layout,
  enter(o) { active = true; $('jlui').hidden = false; $('jlend').hidden = true; soundLabel(); says = []; parts = []; flash = 0; $('jlgrid').hidden = true; T = fresh(!!(o && o.arrested)); layout(); setStep(); if (T.arrested) for (let i = 0; i < 6; i++) tone(i % 2 ? 660 : 880, .22, 'sine', .04, i * .24); if (document.fonts && document.fonts.load) document.fonts.load('800 14px Nunito').then(() => { if (active) layout(); }).catch(() => { /* the fallback is fine */ }); },
  leave() { active = false; $('jlend').hidden = true; $('jlgrid').hidden = true; $('jlui').hidden = true; },
  debug: { act, water, flip, get T() { return T; }, get L() { return L; }, pass() { const a = T.cards.findIndex(c => !c.done && !c.up), b = T.cards.findIndex(c => !c.done && c.k === T.cards[a].k && c.side !== T.cards[a].side); flip(a); flip(b); } }
};
})();
