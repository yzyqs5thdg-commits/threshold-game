/* The photo booth. Their real strips hang on a line along the wall, the portrait painted at the Met stands on an easel,
   and inside the booth Jana picks four poses for the two of them and a strip prints out for her to keep. */
(() => {
'use strict';
const G = window.G; if (!G) return;
const { cv, cx, lerp, clamp, sm, TAU, R, dab, glow, tone } = G;
const $ = id => document.getElementById(id);
const UI = '"Nunito", "Avenir Next", system-ui, sans-serif', DISPLAY = '"Fraunces", "Iowan Old Style", Georgia, serif';
const INK = '#2c2a3d';
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const ell = (g, x, y, rx, ry, a0 = 0, a1 = TAU) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a1); };

/* the real strips, in the order they hang, and last the portrait painted at the Met; a = width over height */
const ITEMS = [
  { id: 'wburg', a: .355, rot: -.02 }, { id: 'jargee1', a: .334, rot: .015 }, { id: 'amnh', a: .39, rot: -.01 }, { id: 'shades', a: .411, rot: .02 }, { id: 'guin', a: .364, rot: -.012 },
  { id: 'colour', a: .347, rot: -.015 }, { id: 'jargee2', a: .343, rot: .01 }, { id: 'nyc', a: .361, rot: -.02 }, { id: 'hot', a: .328, rot: .014 }, { id: 'iny', a: .323, rot: .018 },
  { id: 'met', a: 1.566, rot: 0 }
];
const MET = ITEMS.length - 1;
const img = {}; for (const s of ITEMS) { const im = new Image(); im.onload = () => { im.ok = true; }; im.src = `media/pb_${s.id}.jpg`; img[s.id] = im; }

/* ------------------------------------------------------------------ poses
   x is measured towards the other person, in head radii from the head's centre. eyes are [outer, inner].
   hands: [kind, x, y, turn, thumb on the far side, where the arm comes from] */
const POSES = [
  { id: 'cheek', name: 'Cheek to cheek', j: { dx: .3, tilt: .17 }, f: { dx: .3, tilt: .17 } },
  { id: 'kiss', name: 'Blow a kiss', fx: 'hearts', j: { dx: .1, tilt: .06, eyes: ['happy', 'happy'], mouth: 'kiss', hands: [['open', -.3, 1.46, .5, 0, -.9]] }, f: { dx: .1, tilt: .1, eyes: ['open', 'happy'], mouth: 'kiss', hands: [['open', -.3, 1.46, .5, 0, -.9]] } },
  { id: 'heart', name: 'Heart hands', fx: 'heart', j: { dx: .2, tilt: .14, eyes: ['happy', 'happy'], mouth: 'grin' }, f: { dx: .2, tilt: .14 } },
  { id: 'laugh', name: 'Can\u2019t stop laughing', j: { dx: .3, tilt: .22, expr: 'joy' }, f: { dx: .22, tilt: .1, dy: .1, expr: 'joy' } },
  { id: 'chin', name: 'Chin in hands', j: { gaze: .9, mouth: 'pout', hands: [['open', -.6, 1.0, -.3, 1, -.25, .86], ['open', .6, 1.0, .3, 0, .25, .86]] }, f: { gaze: .9, mouth: 'pout', hands: [['open', -.6, 1.0, -.3, 1, -.25, .86], ['open', .6, 1.0, .3, 0, .25, .86]] } },
  { id: 'wink', name: 'Wink, tongue out', j: { dx: .2, tilt: .14, eyes: ['open', 'happy'], mouth: 'tongue' }, f: { dx: .14, tilt: .08, mouth: 'pout', hands: [['open', -.8, .7, -.1, 1, -1.2]] } },
  { id: 'peace', name: 'Peace', j: { dx: .18, tilt: .12, eyes: ['happy', 'happy'], mouth: 'grin', hands: [['peace', -1.2, .95, -.16, 1, -1.5]] }, f: { dx: .18, tilt: .12, mouth: 'grin', hands: [['peace', -1.2, .95, -.16, 1, -1.5]] } },
  { id: 'side', name: 'Side-eye', j: { dx: .14, tilt: -.05, gaze: 1, mouth: 'smirk' }, f: { dx: .14, tilt: -.05, gaze: 1, mouth: 'pout' } },
  { id: 'oops', name: 'Oops', j: { dx: .12, tilt: .08, gaze: .6, mouth: 'o', hands: [['open', -.24, 1.04, .45, 0, -.9]] }, f: { dx: .12, tilt: .08, gaze: .6, mouth: 'o', hands: [['open', -.24, 1.04, .45, 0, -.9]] } }
];
const POSE = Object.fromEntries(POSES.map(p => [p.id, p]));
/* what her friend wears in the booth: each one is from a real strip, or from the Met portrait */
const FOUT = [
  { id: 'tank', name: 'Black tank', bare: true, c: { top: '#1f1f25', dark: '#0d0d11' } },
  { id: 'cami', name: 'Cream knit cami', bare: true, c: { top: '#efe6d2', dark: '#cbbfa4' } },
  { id: 'red', name: 'Red top', c: { top: '#b8262c', dark: '#8a171d' } },
  { id: 'knit', name: 'Black sweater', knit: true, c: { top: '#26262d', dark: '#0f0f13' } },
  { id: 'olive', name: 'Olive jacket', jacket: true, c: { top: '#5d6c3e', dark: '#3d4a27' } },
  { id: 'pink', name: 'Pink dress', bare: true, c: { top: '#d8527a', dark: '#ac385c' } },
  { id: 'camel', name: 'Camel coat', kind: 'coat', c: { top: '#cdb48e', dark: '#a98f69', trim: '#a98f69' } }
];
const FILMS = [{ id: 'colour', name: 'Colour', sw: '#e8709c' }, { id: 'bw', name: 'Black and white', sw: '#8a8a90' }, { id: 'blue', name: 'Blue', sw: '#5f9ad8' }, { id: 'flash', name: 'Warm flash', sw: '#f2c27a' }];
const EDGES = [{ id: 'white', name: 'White', sw: '#fbfaf5' }, { id: 'black', name: 'Black film', sw: '#131217' }, { id: 'night', name: 'Starry', sw: '#232a5c' }];
const BGS = [{ id: 'grey', name: 'Pale grey', sw: '#dfe0e4' }, { id: 'blue', name: 'Sky blue', sw: '#bcd8ee' }, { id: 'butter', name: 'Butter yellow', sw: '#f6e7a8' }, { id: 'pink', name: 'Pink', sw: '#f4c6d2' }];
const SHADES = [{ id: 'off', name: 'No sunglasses' }, { id: 'on', name: 'Sunglasses on' }];
const OPTS = { film: FILMS, edge: EDGES, bg: BGS, fout: FOUT, fsh: SHADES };
const st = { film: 'colour', edge: 'white', bg: 'grey', fout: 'tank', fsh: 'off' };
let last = null;

/* ------------------------------------------------------------------ the real strips, acted out
   One entry per strip: who sits on the left, what they wore, the film, and each photograph's pose in order.
   Hands are { k, x, y, rot, far, from, s } with optional ax, ay (where the arm starts) and behind. */
const hd = (k, x, y, rot, far, from, s, more) => Object.assign({ k, x, y, rot, far, from, s }, more);
const BK = { c: { top: '#222228', dark: '#0d0d11' } }, BKV = { bare: true, buttons: true, c: { top: '#1f1f25', dark: '#0d0d11' } }, WH = { lace: true, c: { top: '#fbf8f0', dark: '#e2dccc' } }, WT = { bare: true, c: { top: '#f4f1ea', dark: '#cfc8b8' } }, BL = { bare: true, c: { top: '#3f5fa8', dark: '#2c4684' } };
const FO = id => FOUT.find(q => q.id === id);
const REEL = {
  wburg: { left: 'f', film: 'bw', bg: '#cfd2d6', jo: BK, fo: FO('knit'), look: { hair: 'pony' }, frames: [
    { f: { dx: .34, tilt: .2, eyes: ['blink', 'blink'] }, j: { dx: .3, tilt: .16, eyes: ['happy', 'happy'] } },
    { f: { dx: .2, dy: .25, tilt: .1, mouth: 'o', hands: [hd('open', -.15, 1.0, .5, 0, -.9)] }, j: { dx: .12, dy: .1, tilt: .06, gaze: .4, eyes: ['open', 'open'], mouth: 'joy', hands: [hd('open', -.45, 1.55, 1.0, 0, -1.2)] } },
    { f: { dx: .3, tilt: .18, gaze: .5, gy: -1, mouth: 'smirk' }, j: { dx: .3, tilt: .2, eyes: ['blink', 'blink'], mouth: 'pout' } },
    { f: { dx: .36, dy: .55, tilt: .3, expr: 'joy' }, j: { dx: .3, dy: .4, tilt: .12, expr: 'joy' } }] },
  amnh: { left: 'j', film: 'colour', bg: '#d5ddd3', jo: BK, fo: FO('olive'), look: { hair: 'wavy', shades: 'on', lips: 'red' }, frames: [
    { j: { dx: .26, tilt: .14 }, f: { dx: .2, tilt: .1, gy: .6 } },
    { j: { dx: .3, tilt: .2, mouth: 'grin' }, f: { dx: .52, dy: .35, tilt: .36, eyes: ['happy', 'happy'], hands: [hd('peace', -.95, .8, -.2, 1, -1.5)] } },
    { j: { dx: .25, dy: .55, tilt: .1, mouth: 'grin' }, f: { dx: .25, dy: .6, tilt: .12 } }] },
  shades: { left: 'j', film: 'bw', bg: '#e4e4e4', jo: WH, fo: FO('tank'), fsh: 'on', look: { hair: 'wavy' }, frames: [
    { j: { dx: .3, tilt: .14 }, f: { dx: .3, tilt: .2 } },
    { j: { dx: .62, dy: .4, tilt: .4, eyes: ['happy', 'happy'], mouth: 'grin' }, f: { dx: .12, tilt: .12, mouth: 'grin', hands: [hd('open', -.78, .78, -.45, 1, -1.3)] } },
    { j: { dx: .15, dy: .2, tilt: .05, mouth: 'kiss', hands: [hd('open', -.25, 1.3, .45, 0, -.9)] }, f: { dx: .25, dy: .4, tilt: .36, mouth: 'pout' } },
    { j: { dx: .3, dy: .55, tilt: .25, expr: 'joy', hands: [hd('gun', .75, 1.55, 1.25, 0, .3)] }, f: { dx: .1, dy: .2, tilt: .1, mouth: 'pout', hands: [hd('gun', .35, 1.6, 1.35, 0, -.6)] } }] },
  jargee1: { left: 'j', film: 'flash', bg: '#d9dbe2', jo: BKV, fo: FO('tank'), look: { hair: 'wavy' }, frames: [
    { j: { dx: .1, tilt: -.1, eyes: ['blink', 'blink'], armUp: true }, f: { dx: .25, tilt: .16, eyes: ['blink', 'blink'] } },
    { j: { dx: .3, tilt: .16, eyes: ['happy', 'open'], mouth: 'pout' }, f: { dx: .55, dy: .2, tilt: .34, eyes: ['blink', 'blink'], mouth: 'kiss' } },
    { j: { dx: .3, dy: .35, tilt: .1, mouth: 'pout', hands: [hd('open', .4, 1.22, 1.3, 0, -.6)] }, f: { dx: .25, dy: .3, tilt: .1, gaze: .9, mouth: 'pout', hands: [hd('open', -.6, 1.05, -.8, 1, -.2, .9), hd('open', .6, 1.05, .8, 0, .2, .9)] } },
    { j: { dx: .2, dy: .1, tilt: .12, gaze: 1, mouth: 'smirk' }, f: { dx: .5, dy: .35, tilt: .3, gaze: .9, mouth: 'pout' }, front: 'f' }] },
  jargee2: { left: 'j', film: 'flash', bg: '#d9dbe2', jo: BKV, fo: FO('tank'), look: { hair: 'wavy' }, frames: [
    { j: { dx: .25, tilt: .14, eyes: ['happy', 'happy'], mouth: 'grin', hands: [hd('open', 0, 1.0, .3, 0, -.8)] }, f: { dx: .2, tilt: .1, mouth: 'o', hands: [hd('open', -.15, 1.0, .4, 0, -.9)] } },
    { fx: 'heart', j: { dx: .2, tilt: .12, eyes: ['open', 'happy'] }, f: { dx: .15, tilt: .2, eyes: ['blink', 'blink'] } },
    { j: { dx: .42, dy: .2, tilt: .2, expr: 'joy', hands: [hd('open', 2.75, 1.85, 1.9, 0, 0, 1, { ax: 1.0, ay: 1.9, behind: true })] }, f: { dx: .55, dy: .45, tilt: .36, eyes: ['happy', 'happy'], mouth: 'grin' } },
    { j: { dx: .15, tilt: .08, gaze: .6, gy: -1, mouth: 'pout', hands: [hd('point', .12, 1.7, .05, 1, -.5)] }, f: { dx: .3, dy: .25, tilt: .2, eyes: ['blink', 'blink'], hands: [hd('fist', .05, 1.3, 1.3, 0, -.9)] } }] },
  colour: { left: 'f', film: 'colour', bg: '#bcd8ee', jo: BK, fo: FO('red'), look: { hair: 'wavy' }, frames: [
    { f: { dx: .58, dy: .2, tilt: .36, eyes: ['happy', 'happy'] }, j: { dx: .2, dy: .25, tilt: .1, eyes: ['happy', 'happy'], mouth: 'grin', hands: [hd('open', .4, 1.42, -.5, 0, .6)] } },
    { film: 'bw', bg: '#e9e6e2', f: { dx: .25, dy: .3, tilt: .1, hands: [hd('fist', 0, 1.32, .2, 0, -.4)] }, j: { dx: .2, dy: .15, tilt: .12, mouth: 'kiss', hands: [hd('open', .12, 1.4, -.9, 1, .6)] } },
    { bg: '#f3e6a0', f: { dx: .62, dy: .1, tilt: .3, gaze: 1, eyes: ['blink', 'blink'] }, j: { dx: .25, dy: .3, tilt: .15, expr: 'joy' } },
    { f: { dx: .2, dy: .2, tilt: .1, gaze: .7, mouth: 'o', hands: [hd('open', .1, .95, -.3, 1, .3, 1.1)] }, j: { dx: .2, dy: .3, tilt: .1, mouth: 'grin', hands: [hd('open', -.1, .12, 1.3, 0, -1.3, 1.15)] } }] },
  nyc: { left: 'j', film: 'colour', bg: '#e6e4e0', jo: BKV, fo: FO('cami'), look: { hair: 'wavy', lips: 'red' }, frames: [
    { j: { dx: .55, dy: .1, tilt: -.1 }, f: { dx: -1.7, dy: .3, tilt: .1 } },
    { j: { dx: .3, dy: .3, tilt: .2, expr: 'joy' }, f: { dx: .5, dy: .15, tilt: .25, mouth: 'grin', hands: [hd('point', 1.9, 2.0, 2.2, 0, 0, 1.7, { ax: .9, ay: 1.7 })] }, front: 'f' },
    { j: { dx: .36, dy: .6, tilt: .2, eyes: ['happy', 'happy'], mouth: 'grin' }, f: { dx: .4, dy: .45, tilt: .25, eyes: ['happy', 'happy'], mouth: 'grin' } }] },
  iny: { left: 'f', film: 'blue', bg: '#dfe0e4', jo: WT, fo: FO('tank'), fup: true, look: { hair: 'pony', liner: 'wing' }, frames: [
    { f: { dx: .3, tilt: .2, eyes: ['blink', 'blink'], mouth: 'smirk' }, j: { dx: .3, tilt: .1, eyes: ['happy', 'happy'], hands: [hd('open', -.55, 1.25, -1.1, 1, -1.2, .9)] } },
    { f: { dx: .3, tilt: .16 }, j: { dx: .3, tilt: .14, eyes: ['happy', 'open'], mouth: 'tongue' } },
    { f: { dx: .2, dy: .2, tilt: .1, mouth: 'pout', hands: [hd('open', -.78, .72, -.1, 1, -1.2)] }, j: { dx: .25, tilt: .1, mouth: 'kiss', hands: [hd('point', -1.0, 1.35, 2.6, 1, -1.7)] } }] },
  guin: { left: 'f', film: 'violet', bg: '#d5d8ee', jo: BL, fo: FO('pink'), look: { hair: 'wavy' }, frames: [
    { f: { dx: .2, dy: .2, tilt: .1 }, j: { dx: .3, tilt: .22, eyes: ['blink', 'blink'], mouth: 'pout', hands: [hd('peace', -.95, -.3, -.45, 1, -1.8)] } },
    { f: { dx: .62, dy: .55, tilt: .4, eyes: ['happy', 'happy'] }, j: { dx: .2, dy: .15, tilt: .15, eyes: ['blink', 'blink'], mouth: 'smirk', hands: [hd('open', .6, 1.15, -.3, 0, .4, .9)] } },
    { f: { dx: .36, dy: .6, tilt: .2, gaze: 1, mouth: 'pout', hands: [hd('peace', .6, 1.45, .2, 0, .3, .85)] }, j: { dx: .25, dy: .3, tilt: .2, eyes: ['happy', 'open'], mouth: 'joy' } }] },
  hot: { left: 'f', film: 'colour', bg: '#cdd3df', jo: BKV, fo: FO('knit'), look: { hair: 'wavy' }, frames: [
    { f: { dx: .15, dy: .1, gaze: .2, gy: -1, mouth: 'kiss', prop: { k: 'cup', x: .1, y: 1.85, straw: 1 }, hands: [hd('fist', .1, 2.35, 0, 0, -.3)] }, j: { dx: .3, tilt: .2, eyes: ['blink', 'blink'], mouth: 'smirk', prop: { k: 'cup', x: -.55, y: 2.0 }, hands: [hd('fist', -.55, 2.5, 0, 1, -.9)] } },
    { f: { dx: .3, dy: .25, tilt: .15, gaze: 1, mouth: 'smirk' }, j: { dx: .3, dy: .2, tilt: .2, expr: 'joy', hands: [hd('open', .1, 1.4, -1.0, 1, .7)] } },
    { f: { dx: .52, dy: .35, tilt: .35, eyes: ['happy', 'happy'], prop: { k: 'card', x: -.95, y: .7, rot: .2 }, hands: [hd('fist', -1.0, .12, 3.0, 0, -1.9, .9)] }, j: { dx: .3, dy: .4, tilt: .15, eyes: ['happy', 'happy'], prop: { k: 'card', x: -.15, y: 1.5, rot: -.25 }, hands: [hd('fist', .3, 1.25, -1.1, 1, .5, .9)] } }] }
};
const START = { j: { dx: -3.4 }, f: { dx: -3.4 } };
const NUM = ['dx', 'dy', 'tilt', 'gaze', 'gy'];
const HND = d => (Array.isArray(d) ? { k: d[0], x: d[1], y: d[2], rot: d[3], far: d[4], from: d[5], s: d[6] } : d);
/* halfway between two poses: heads glide, hands drop away and the new ones come up, faces change in the middle */
function mixPose(A, B, u) { const e = sm(clamp(u, 0, 1)), late = u >= .45, out = { fx: late ? B.fx : A.fx, front: late ? B.front : A.front };
  for (const who of ['j', 'f']) { const a = A[who] || {}, b = B[who] || {}, o = Object.assign({}, late ? b : a); for (const n of NUM) o[n] = lerp(a[n] || 0, b[n] || 0, e); o.ha = late ? sm((u - .45) / .55) : 1 - sm(u / .45); out[who] = o; } return out; }
const reelSet = (reel, n) => { const f = reel.frames[clamp(n, 0, reel.frames.length - 1)]; return { film: f.film || reel.film, bg: f.bg || reel.bg, jo: reel.jo, fo: reel.fo, fsh: reel.fsh, fup: reel.fup, left: reel.left }; };
const reelLook = reel => Object.assign({ hair: 'wavy', shades: 'off', liner: 'none' }, reel.look);
try { const sv = JSON.parse(localStorage.getItem('jana-booth') || 'null'); if (sv) { for (const key in st) if (sv.set && OPTS[key].some(q => q.id === sv.set[key])) st[key] = sv.set[key]; if (sv.last && Array.isArray(sv.last.poses) && sv.last.poses.length === 4 && sv.last.poses.every(p => POSE[p])) last = sv.last; } } catch (e) { /* a fresh booth */ }
const keep = () => { try { localStorage.setItem('jana-booth', JSON.stringify({ set: st, last })); } catch (e) { /* it lasts for this visit */ } };

let S = 1, VW = 0, VH = 0, L = null, SPR = null, active = false, mode = 'wall', hover = null, focus = -1, view = -1;
let tab = 'pose', sel = 'cheek', shots = [], thumbs = [], cd = null, flash = 0, pr = null, pl = null, walk = null;

/* ------------------------------------------------------------------ the two of them, from the chest up */
function heartPath(g, x, y, s) { g.beginPath(); g.moveTo(x, y + s * .9); g.bezierCurveTo(x - s * 1.5, y - s * .1, x - s * .8, y - s * 1.2, x, y - s * .4); g.bezierCurveTo(x + s * .8, y - s * 1.2, x + s * 1.5, y - s * .1, x, y + s * .9); g.closePath(); }
function bust(g, who, x, y, r, o) {
  const k = G.people[who], c = o.c;
  g.save(); g.translate(x, y); g.lineJoin = 'round'; g.lineCap = 'round';
  const torso = () => { g.beginPath(); g.moveTo(-r * .3, r * 1.22); g.quadraticCurveTo(-r * .46, r * 1.56, -r * 1.02, r * 1.66); g.quadraticCurveTo(-r * 1.5, r * 1.76, -r * 1.58, r * 2.4); g.lineTo(-r * 1.68, r * 7); g.lineTo(r * 1.68, r * 7); g.lineTo(r * 1.58, r * 2.4); g.quadraticCurveTo(r * 1.5, r * 1.76, r * 1.02, r * 1.66); g.quadraticCurveTo(r * .46, r * 1.56, r * .3, r * 1.22); g.closePath(); };
  g.fillStyle = k.skin; torso(); g.fill();
  g.strokeStyle = k.shade; g.globalAlpha = .55; g.lineWidth = Math.max(.8, r * .05); for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * r * .2, r * 1.9); g.quadraticCurveTo(d * r * .5, r * 1.8, d * r * .86, r * 1.88); g.stroke(); } g.globalAlpha = 1;
  g.save(); torso(); g.clip();
  const seam = () => { g.strokeStyle = c.dark; g.lineWidth = Math.max(.8, r * .05); for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * r * 1.1, r * 2.4); g.quadraticCurveTo(d * r * 1.06, r * 3.2, d * r * 1.14, r * 7); g.stroke(); } };
  if (o.off) {
    g.fillStyle = c.top; g.beginPath(); g.moveTo(-r * 2, r * 2.1); g.quadraticCurveTo(0, r * 2.52, r * 2, r * 2.1); g.lineTo(r * 2, r * 7); g.lineTo(-r * 2, r * 7); g.fill();
    g.strokeStyle = c.dark; g.lineWidth = r * .12; g.beginPath(); g.moveTo(-r * 2, r * 2.22); g.quadraticCurveTo(0, r * 2.64, r * 2, r * 2.22); g.stroke();
  } else if (o.bare) {
    g.fillStyle = c.top; g.beginPath(); g.moveTo(-r * .74, r * 1.56); g.lineTo(-r * .5, r * 1.5);
    if (o.buttons) { g.lineTo(0, r * 2.62); g.lineTo(r * .5, r * 1.5); } else { g.quadraticCurveTo(-r * .46, r * 2.3, 0, r * 2.36); g.quadraticCurveTo(r * .46, r * 2.3, r * .5, r * 1.5); }
    g.lineTo(r * .74, r * 1.56); g.quadraticCurveTo(r * .84, r * 2.2, r * 1.14, r * 2.46); g.lineTo(r * 1.18, r * 7); g.lineTo(-r * 1.18, r * 7); g.lineTo(-r * 1.14, r * 2.46); g.quadraticCurveTo(-r * .84, r * 2.2, -r * .74, r * 1.56); g.closePath(); g.fill();
    g.strokeStyle = c.dark; g.lineWidth = Math.max(.8, r * .05); g.stroke();
    if (o.buttons) { g.fillStyle = c.dark; for (const yy of [2.8, 3.2]) { g.beginPath(); g.arc(0, r * yy, r * .06, 0, TAU); g.fill(); } }
  } else {
    g.fillStyle = c.top; g.fillRect(-r * 2, r * 1.1, r * 4, r * 6);
    if (o.spots) { const rnd = R(77); for (let i = 0; i < 70; i++) { const sx = (rnd() - .5) * r * 4, sy = r * (1.3 + rnd() * 2.2), sr = r * (.06 + rnd() * .05); g.fillStyle = '#6a431e'; ell(g, sx, sy, sr * 1.4, sr); g.fill(); g.fillStyle = '#2a1a10'; ell(g, sx + sr * .3, sy, sr * .7, sr * .5); g.fill(); } }
    if (o.knit) { g.strokeStyle = c.dark; g.globalAlpha = .4; g.lineWidth = Math.max(.6, r * .04); for (let xx = -1.9; xx < 2; xx += .22) { g.beginPath(); g.moveTo(r * xx, r * 1.7); g.lineTo(r * xx, r * 4); g.stroke(); } g.globalAlpha = 1; }
    if (o.lace) { g.fillStyle = 'rgba(190,180,160,.5)'; for (let yy = 1.8; yy < 3.2; yy += .2) for (let xx = -1.8 + (Math.round(yy * 5) % 2) * .1; xx < 1.9; xx += .2) { g.beginPath(); g.arc(r * xx, r * yy, r * .028, 0, TAU); g.fill(); } }
    seam();
    if (o.kind === 'coat' || o.jacket) {
      if (o.jacket) { g.fillStyle = '#1f1f25'; g.beginPath(); g.moveTo(-r * .36, r * 1.2); g.lineTo(-r * .62, r * 7); g.lineTo(r * .62, r * 7); g.lineTo(r * .36, r * 1.2); g.fill(); g.fillStyle = k.skin; ell(g, 0, r * 1.3, r * .42, r * .34); g.fill(); }
      else { g.fillStyle = o.scarf ? '#f6f2e8' : k.skin; g.beginPath(); g.moveTo(-r * .36, r * 1.2); g.lineTo(0, r * 2.56); g.lineTo(r * .36, r * 1.2); g.fill(); g.strokeStyle = c.dark; g.lineWidth = Math.max(.8, r * .05); g.beginPath(); g.moveTo(0, r * 2.56); g.lineTo(0, r * 7); g.stroke(); }
      g.fillStyle = o.collar ? c.trim : c.dark; g.strokeStyle = 'rgba(20,16,30,.3)'; g.lineWidth = Math.max(.7, r * .035);
      for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * r * .32, r * 1.22); g.lineTo(d * r * .9, r * 1.64); g.lineTo(d * r * .6, r * 2.2); g.lineTo(d * r * (o.jacket ? .5 : .03), r * (o.jacket ? 3.2 : 2.6)); g.closePath(); g.fill(); g.stroke(); }
    } else {
      g.fillStyle = k.skin; ell(g, 0, r * 1.28, r * .52, r * .36); g.fill();
      g.strokeStyle = c.dark; g.lineWidth = r * (o.knit ? .13 : .06); g.beginPath(); g.ellipse(0, r * 1.28, r * .56, r * .4, 0, .12, Math.PI - .12); g.stroke();
      if (o.lace) { g.fillStyle = '#fff'; g.strokeStyle = 'rgba(150,140,120,.7)'; g.lineWidth = Math.max(.5, r * .025); for (let i = 0; i <= 8; i++) { const a = .2 + i / 8 * (Math.PI - .4); g.beginPath(); g.arc(Math.cos(a) * r * .6, r * 1.28 + Math.sin(a) * r * .44, r * .075, 0, TAU); g.fill(); g.stroke(); } }
    }
  }
  g.restore();
  g.strokeStyle = 'rgba(30,20,30,.24)'; g.lineWidth = Math.max(1, r * .04); torso(); g.stroke();
  g.fillStyle = 'rgba(60,30,30,.12)'; ell(g, 0, r * 1.36, r * .34, r * .14); g.fill();
  g.restore();
}
function scarf(g, x, y, r) { g.save(); g.translate(x, y); g.fillStyle = '#f6f2e8'; ell(g, 0, r * 1.66, r * .66, r * .28); g.fill(); g.strokeStyle = 'rgba(160,150,130,.7)'; g.lineWidth = Math.max(.7, r * .04); g.stroke(); g.beginPath(); g.moveTo(-r * .4, r * 1.6); g.quadraticCurveTo(0, r * 1.8, r * .4, r * 1.6); g.stroke(); g.fillStyle = '#f6f2e8'; g.beginPath(); g.roundRect(r * .12, r * 1.74, r * .4, r * 1.6, r * .08); g.fill(); g.stroke(); g.restore(); }

/* a hand, wrist at the origin and fingers pointing up; u is the width of the palm */
function hand(g, k, kind, u, flip) {
  g.save(); if (flip) g.scale(-1, 1); g.lineJoin = 'round'; g.lineCap = 'round';
  const fing = (x, top, a) => { g.save(); g.translate(x * u, -.86 * u); g.rotate(a); g.roundRect(-.115 * u, top * u + .86 * u, .23 * u, -top * u - .7 * u, .115 * u); g.restore(); };
  const curl = xs => { for (const x of xs) g.roundRect((x - .115) * u, -1.24 * u, .23 * u, .42 * u, .11 * u); };
  const shape = () => { g.beginPath(); g.roundRect(-.5 * u, -1.02 * u, u, 1.05 * u, .32 * u);
    if (kind === 'peace') { fing(-.3, -1.82, -.24); fing(-.02, -1.86, .2); g.roundRect(.13 * u, -1.2 * u, .21 * u, .36 * u, .1 * u); g.roundRect(.33 * u, -1.12 * u, .18 * u, .32 * u, .09 * u); }
    else if (kind === 'fist') curl([-.36, -.12, .12, .36]);
    else if (kind === 'point' || kind === 'gun') { fing(-.36, -1.86, 0); curl([-.12, .12, .36]); if (kind === 'gun') { g.moveTo(.62 * u + Math.cos(.8) * .17 * u, -.74 * u + Math.sin(.8) * .17 * u); g.ellipse(.62 * u, -.74 * u, .17 * u, .46 * u, .8, 0, TAU); } }
    else { fing(-.36, -1.6, 0); fing(-.12, -1.8, 0); fing(.12, -1.76, 0); fing(.36, -1.5, 0); g.moveTo(.6 * u + Math.cos(.45) * .16 * u, -.62 * u + Math.sin(.45) * .16 * u); g.ellipse(.6 * u, -.62 * u, .16 * u, .4 * u, .45, 0, TAU); } };
  shape(); g.strokeStyle = k.shade; g.lineWidth = Math.max(1.2, u * .16); g.stroke(); g.fillStyle = k.skin; g.fill();
  g.strokeStyle = k.shade; g.globalAlpha = .75; g.lineWidth = Math.max(.6, u * .05);
  if (kind === 'peace') { g.beginPath(); g.moveTo(-.14 * u, -1.0 * u); g.lineTo(-.17 * u, -1.24 * u); g.stroke(); }
  if (kind === 'peace' || kind === 'fist' || kind === 'point') { g.globalAlpha = 1; g.fillStyle = k.skin; g.beginPath(); g.ellipse(.1 * u, -.6 * u, .36 * u, .16 * u, -.2, 0, TAU); g.fill(); g.lineWidth = Math.max(.7, u * .07); g.stroke(); }
  else if (kind === 'gun') { g.beginPath(); for (const x of [0, .24]) { g.moveTo(x * u, -.98 * u); g.lineTo(x * u, -1.18 * u); } g.stroke(); }
  else { g.beginPath(); for (const x of [-.24, 0, .24]) { g.moveTo(x * u, -.98 * u); g.lineTo(x * u, -1.44 * u); } g.stroke(); }
  g.globalAlpha = 1; g.restore();
}
function arm(g, k, o, x0, y0, x1, y1, u) {
  const sleeve = !(o.bare || o.off), mx = lerp(x0, x1, .5), my = lerp(y0, y1, .5) + u * .3;
  const path = () => { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, x1, y1); };
  g.lineCap = 'round'; path(); g.strokeStyle = sleeve ? 'rgba(20,16,30,.4)' : k.shade; g.lineWidth = u * (sleeve ? .9 : .74); g.stroke();
  path(); g.strokeStyle = sleeve ? o.c.top : k.skin; g.lineWidth = u * (sleeve ? .78 : .62); g.stroke();
}

/* a drink with a straw, and a little card on a lanyard */
function cup(g, x, y, s, straw) {
  g.save(); g.translate(x, y); g.lineJoin = 'round'; const side = () => { g.beginPath(); g.moveTo(-s * .58, -s * .95); g.lineTo(s * .58, -s * .95); g.lineTo(s * .44, s * .95); g.lineTo(-s * .44, s * .95); g.closePath(); };
  g.fillStyle = 'rgba(236,246,240,.82)'; side(); g.fill(); g.save(); side(); g.clip(); g.fillStyle = '#9cc763'; g.fillRect(-s, -s * .55, s * 2, s * 2); g.fillStyle = '#4f8a3c'; for (const [lx, ly, a] of [[-.2, -.1, .5], [.22, .3, -.6], [-.1, .6, 1.2], [.2, -.3, .2]]) { g.beginPath(); g.ellipse(s * lx, s * ly, s * .22, s * .1, a, 0, TAU); g.fill(); } g.fillStyle = 'rgba(255,255,255,.55)'; for (const [lx, ly] of [[-.28, .2], [.1, 0], [.26, .62], [-.14, -.36]]) g.fillRect(s * lx, s * ly, s * .2, s * .2); g.restore();
  g.strokeStyle = 'rgba(120,140,150,.8)'; g.lineWidth = Math.max(.8, s * .06); side(); g.stroke();
  if (straw) { g.strokeStyle = '#c8262c'; g.lineWidth = Math.max(1.4, s * .15); g.lineCap = 'round'; g.beginPath(); g.moveTo(s * .1, s * .2); g.lineTo(straw[0], straw[1]); g.stroke(); }
  g.restore();
}
function card(g, x, y, s, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.strokeStyle = '#3f8fd0'; g.lineWidth = Math.max(1.2, s * .1); g.lineCap = 'round'; g.beginPath(); g.moveTo(-s * .12, -s * .7); g.quadraticCurveTo(-s * .5, -s * 1.3, -s * .2, -s * 1.9); g.moveTo(s * .12, -s * .7); g.quadraticCurveTo(s * .5, -s * 1.3, s * .1, -s * 1.9); g.stroke();
  g.fillStyle = '#f4f8fb'; g.beginPath(); g.roundRect(-s * .5, -s * .7, s, s * 1.4, s * .08); g.fill(); g.strokeStyle = 'rgba(60,80,110,.6)'; g.lineWidth = Math.max(.7, s * .04); g.stroke();
  g.fillStyle = '#4f9ad8'; g.beginPath(); g.roundRect(-s * .5, -s * .7, s, s * .4, [s * .08, s * .08, 0, 0]); g.fill(); g.fillStyle = '#b9c6d2'; g.beginPath(); g.arc(-s * .16, s * .02, s * .15, 0, TAU); g.fill(); g.beginPath(); g.ellipse(-s * .16, s * .34, s * .2, s * .14, 0, Math.PI, 0); g.fill(); g.fillRect(s * .1, -s * .08, s * .28, s * .06); g.fillRect(s * .1, s * .08, s * .22, s * .06); g.fillRect(-s * .36, s * .48, s * .72, s * .06);
  g.restore();
}
const jOut = () => { const o = G.wardrobe.outfit.find(q => q.id === G.look.outfit); return o && o.c ? o : G.wardrobe.outfit.find(q => q.id === 'tank'); };
const fOut = s => FOUT.find(q => q.id === s.fout) || FOUT[0];

/* one photograph: w by h, set s, a pose (or the id of one), and a time (a still uses a fixed one) */
function shot(g, w, h, s, P, t, live) {
  if (typeof P === 'string') P = POSE[P] || POSES[0];
  const r = h * .19, u = r * .5, bg = s.bg && s.bg[0] === '#' ? s.bg : (BGS.find(q => q.id === s.bg) || BGS[0]).sw, left = s.left || 'j';
  g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,.3)'); gr.addColorStop(.6, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(40,40,70,.14)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(60,60,90,.035)'; g.lineWidth = w * .012; for (let i = 1; i < 7; i++) { g.beginPath(); g.moveTo(w * i / 7, 0); g.lineTo(w * i / 7 + w * .01, h); g.stroke(); }
  const mk = (who, sg, bx) => { const p = P[who] || {}, bob = live && !G.RM ? Math.sin(t * 1.5 + (who === 'f' ? 1.4 : 0)) * r * .018 : 0, hx = bx + sg * (p.dx || 0) * r, hy = h * .4 + (p.dy || 0) * r + bob;
    return { who, sg, p, hx, hy, bx: bx + sg * (p.dx || 0) * r * .55, by: h * .4 + (p.dy || 0) * r * .6, o: who === 'j' ? (s.jo || jOut()) : (s.fo || fOut(s)), k: G.people[who], drop: (1 - (p.ha == null ? 1 : p.ha)) * r * 3.6 }; };
  const pR = mk(left === 'j' ? 'f' : 'j', -1, w * .71), pL = mk(left, 1, w * .29), ppl = P.front === pR.who ? [pL, pR] : [pR, pL];
  const hands = q => (q.p.hands || []).map(HND);
  const wrist = (q, H) => { const hu = u * (H.s || 1), px = q.hx + q.sg * H.x * r, py = q.hy + H.y * r + q.drop, a = q.sg * H.rot; return { hu, a, wx: px - Math.sin(a) * hu * .5, wy: py + Math.cos(a) * hu * .5 }; };
  const armOf = (q, H) => { const W = wrist(q, H); if (H.ax != null) arm(g, q.k, q.o, W.wx, W.wy, q.hx + q.sg * H.ax * r, q.hy + H.ay * r + q.drop * .3, W.hu); else arm(g, q.k, q.o, W.wx, W.wy, q.hx + q.sg * (H.from || 0) * r, h + u, W.hu); };
  ppl.forEach((q, i) => {
    const p = q.p, blink = live && !G.RM && ((t + (q.who === 'f' ? 1.9 : 0)) % 3.7) < .12;
    let eyes = p.eyes ? (q.sg > 0 ? p.eyes.slice() : [p.eyes[1], p.eyes[0]]) : null; if (eyes && blink) eyes = eyes.map(e => (e === 'open' ? 'blink' : e));
    bust(g, q.who, q.bx, q.by, r, q.o);
    if (i === 0) for (const o2 of ppl) for (const H of hands(o2)) if (H.behind) armOf(o2, H);
    if (p.armUp) { const d = -q.sg, bare = q.o.bare || q.o.off, path = () => { g.beginPath(); g.moveTo(q.bx + d * r * 1.2, q.by + r * 2.1); g.lineTo(q.hx + d * r * 2.2, q.hy - r * .5); g.lineTo(q.hx + d * r * .6, q.hy - r * .62); }; g.lineCap = 'round'; g.lineJoin = 'round'; path(); g.strokeStyle = q.k.shade; g.lineWidth = r * .56; g.stroke(); path(); g.strokeStyle = bare ? q.k.skin : q.o.c.top; g.lineWidth = r * .46; g.stroke(); }
    G.headFront(g, q.who, { x: q.hx, y: q.hy, r, len: r * 2.7, rich: true, ponyLeft: q.sg > 0, up: q.who === 'f' && !!s.fup, tilt: q.sg * (p.tilt || 0), expr: p.expr || 'smile', blink, eyes, gaze: q.sg * (p.gaze || 0), gy: p.gy || 0, mouth: p.mouth, worn: q.who === 'f' && s.fsh === 'on' });
    if (q.o.scarf) scarf(g, q.bx, q.by, r);
  });
  for (const q of ppl) { const pp = q.p.prop; if (!pp) continue; const x = q.hx + q.sg * pp.x * r, y = q.hy + pp.y * r + q.drop; if (pp.k === 'cup') cup(g, x, y, r * .5, pp.straw ? [q.hx - x, q.hy + r * .66 - y] : null); else card(g, x, y, r * .7, q.sg * (pp.rot || 0)); }
  for (const q of ppl) for (const H of hands(q)) { const W = wrist(q, H); if (!H.behind) armOf(q, H); g.save(); g.translate(W.wx, W.wy); g.rotate(W.a); hand(g, q.k, H.k, W.hu, q.sg > 0 ? !H.far : !!H.far); g.restore(); }
  if (P.fx === 'heart') {
    /* heart hands: each of them curls one hand, and the gap between the two is the heart */
    const hx = w / 2, hy = h * .4 + r * 2.02 + Math.max(pL.drop, pR.drop), hs = r * .8, beat = live && !G.RM ? 1 + .035 * Math.sin(t * 5) : 1, so = hs * 1.22 * beat, si = hs * .6 * beat;
    for (const q of ppl) arm(g, q.k, q.o, hx - q.sg * so * .95, hy + so * .28, hx - q.sg * r * 2.3, h + u, u * 1.15);
    for (const q of ppl) { const d = -q.sg; g.save(); g.beginPath(); g.rect(d < 0 ? hx - so * 2 : hx, hy - so * 2, so * 2, so * 4); g.clip(); g.lineJoin = 'round';
      heartPath(g, hx, hy, so); g.strokeStyle = q.k.shade; g.lineWidth = Math.max(1.4, hs * .14); g.stroke(); g.fillStyle = q.k.skin; g.fill();
      g.strokeStyle = q.k.shade; g.globalAlpha = .8; g.lineWidth = Math.max(.7, hs * .05); g.lineCap = 'round'; for (const [ax, ay] of [[.3, -.72], [.62, -.7], [.83, -.44], [.82, -.06]]) { g.beginPath(); g.moveTo(hx + d * so * ax * .96, hy + so * ay * .96); g.lineTo(hx + d * so * ax * .66, hy + so * (ay * .66 + .03)); g.stroke(); } g.globalAlpha = 1; g.restore(); }
    g.save(); heartPath(g, hx, hy + hs * .05, si); g.clip(); for (const q of ppl) bust(g, q.who, q.bx, q.by, r, q.o); g.restore();
    heartPath(g, hx, hy + hs * .05, si); g.strokeStyle = 'rgba(120,70,60,.55)'; g.lineWidth = Math.max(1, hs * .07); g.stroke();
  }
  if (P.fx === 'hearts') for (let i = 0; i < 4; i++) { const k = live && !G.RM ? (t * .35 + i / 4) % 1 : [.25, .55, .8, .42][i], x = w * (.5 + [-.05, .04, -.02, .07][i]) + Math.sin(k * 7 + i) * r * .16, y = h * (.6 - k * .52); g.globalAlpha = Math.min(1, (1 - k) * 2.4, k * 6); g.fillStyle = i % 2 ? '#e8527a' : '#f2849a'; heartPath(g, x, y, r * (.1 + .08 * k)); g.fill(); } g.globalAlpha = 1;
  /* the film */
  if (s.film === 'bw' || s.film === 'blue') { g.globalCompositeOperation = 'saturation'; g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; }
  if (s.film === 'blue') { g.globalCompositeOperation = 'multiply'; g.fillStyle = '#a4cdf2'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'screen'; g.fillStyle = '#0c1d4c'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; }
  if (s.film === 'bw') { g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; }
  if (s.film === 'violet') { g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ddd2f6'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'screen'; g.fillStyle = '#141032'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; }
  if (s.film === 'flash') { g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ffeeda'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; gr = g.createRadialGradient(w / 2, h * .4, 0, w / 2, h * .4, w * .5); gr.addColorStop(0, 'rgba(255,250,236,.26)'); gr.addColorStop(1, 'rgba(255,250,236,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  gr = g.createRadialGradient(w / 2, h * .45, w * .34, w / 2, h / 2, w * .78); gr.addColorStop(0, 'rgba(20,16,30,0)'); gr.addColorStop(1, `rgba(20,16,30,${s.film === 'flash' ? .42 : .24})`); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.restore();
}

/* ------------------------------------------------------------------ the strip */
const dims = fw => { const m = fw * .07, fh = fw * .75, gap = fw * .05, foot = fw * .3; return { m, fh, gap, foot, W: fw + 2 * m, H: m + 4 * fh + 3 * gap + foot }; };
const today = () => { const d = new Date(), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()} ${z(d.getMonth() + 1)} ${z(d.getDate())}`; };
function withLook(look, fn) { const was = Object.assign({}, G.look); if (look) for (const key in was) if (G.wardrobe[key].some(q => q.id === look[key])) G.look[key] = look[key]; try { fn(); } finally { Object.assign(G.look, was); } }
function drawStrip(g, rec, fw) {
  const d = dims(fw), dark = rec.edge !== 'white';
  if (rec.edge === 'night') { const gr = g.createLinearGradient(0, 0, 0, d.H); gr.addColorStop(0, '#141a3e'); gr.addColorStop(1, '#2c2358'); g.fillStyle = gr; g.fillRect(0, 0, d.W, d.H); const rnd = R(404); for (let i = 0; i < 150; i++) { g.fillStyle = `rgba(255,246,214,${.3 + rnd() * .7})`; g.beginPath(); g.arc(rnd() * d.W, rnd() * d.H, fw * (.002 + rnd() * .004), 0, TAU); g.fill(); } }
  else { g.fillStyle = dark ? '#131217' : '#fbfaf5'; g.fillRect(0, 0, d.W, d.H); }
  withLook(rec.look, () => { for (let i = 0; i < 4; i++) { g.save(); g.translate(d.m, d.m + i * (d.fh + d.gap)); if (rec.poses[i]) shot(g, fw, d.fh, rec, rec.poses[i], 3 + i * 1.3, false); else { g.fillStyle = dark ? '#2a2830' : '#e9e6dc'; g.fillRect(0, 0, fw, d.fh); } g.strokeStyle = dark ? 'rgba(255,255,255,.16)' : 'rgba(30,26,40,.2)'; g.lineWidth = Math.max(.5, fw * .004); g.strokeRect(0, 0, fw, d.fh); g.restore(); } });
  if (rec.edge === 'black') { g.fillStyle = '#fbfaf5'; for (let i = 0; i < 4; i++) { const y = d.m + i * (d.fh + d.gap) + d.fh * .5; g.beginPath(); g.moveTo(d.m * .28, y + d.m * .22); g.lineTo(d.m * .72, y + d.m * .22); g.lineTo(d.m * .5, y - d.m * .22); g.fill(); } }
  const fy = d.H - d.foot + d.gap * .4, mid = d.W / 2; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#d8402c'; g.beginPath(); g.arc(mid, fy + d.foot * .2, fw * .026, 0, TAU); g.fill(); g.beginPath(); g.moveTo(mid - fw * .022, fy + d.foot * .23); g.lineTo(mid, fy + d.foot * .36); g.lineTo(mid + fw * .022, fy + d.foot * .23); g.fill(); g.fillStyle = dark ? '#131217' : '#fbfaf5'; g.beginPath(); g.arc(mid, fy + d.foot * .2, fw * .01, 0, TAU); g.fill();
  g.fillStyle = dark ? '#fbf3df' : INK; g.font = `italic 600 ${fw * .1}px ${DISPLAY}`; g.fillText('A map of us', mid, fy + d.foot * .52);
  g.fillStyle = dark ? '#f2cf62' : 'rgba(44,42,61,.6)'; g.font = `700 ${fw * .05}px ${UI}`; g.fillText(rec.date || today(), mid, fy + d.foot * .76);
}
const record = () => ({ poses: shots.slice(0, 4), film: st.film, edge: st.edge, bg: st.bg, fout: st.fout, fsh: st.fsh, look: Object.assign({}, G.look), date: today() });
function stripCanvas(rec, fw) { const d = dims(fw), c = document.createElement('canvas'); c.width = Math.round(d.W); c.height = Math.round(d.H); drawStrip(c.getContext('2d'), rec, fw); return c; }
function mineSprite() { SPR.mine = last ? G.spr(dims(100).W, dims(100).H, g => drawStrip(g, last, 100), clamp(L.disp.w / dims(100).W * S * G.DPR, .5, 3)) : null; }

/* ------------------------------------------------------------------ layout */
function layout() {
  S = Math.min(G.W / 430, G.H / 720); VW = G.W / S; VH = G.H / S; const wide = VW >= 760, floor = VH - (wide ? 96 : 122);
  const bw = wide ? 250 : 168, bh = wide ? Math.min(440, floor - 150) : 312, bx = VW - bw - (wide ? 70 : 12), by = floor - bh;
  const x0 = wide ? 50 : 10, x1 = wide ? bx - 44 : VW - 10, ly = wide ? 92 : 112, n = MET, gap = (x1 - x0) / n, th = clamp(gap * (wide ? 2.5 : 2.62), 90, wide ? 252 : 126);
  const dw = bw * .56, pw = bw - dw - 34, dspw = pw - (wide ? 16 : 6), dsph = dspw / (dims(100).W / dims(100).H);
  const ex = wide ? x0 + (x1 - x0) * .3 : 98, ew = wide ? 236 : 152, eh = ew / 1.566, ey = floor - (wide ? 268 : 226);
  L = { wide, floor, n, x0, x1, ly, gap, th, booth: { x: bx, y: by, w: bw, h: bh, dw, pw }, disp: { x: bx + 12 + dw + 10 + (pw - dspw) / 2, y: by + 56 + (wide ? 58 : 48), w: dspw, h: dsph }, easel: { x: ex - ew / 2, y: ey, w: ew, h: eh }, people: wide ? [bx - 150, bx - 92, 1.5] : [176, 214, 1.08] };
  /* inside the booth: the screen sits in whatever the panel leaves free */
  const land = G.W > G.H, prc = $('ppanel').getBoundingClientRect(), crc = cv.getBoundingClientRect(), shown = mode === 'in' && !$('ppanel').hidden && prc.width > 0;
  const fw = land && shown ? (prc.left - crc.left) / S : VW, fh = !land && shown ? (prc.top - crc.top) / S : VH, top = land ? 62 : 74, tH = land ? 70 : 46, avail = fh - top - 14 - tH - 22;
  const sw = Math.min(fw - (land ? 90 : 36), avail * 4 / 3), sh = sw * .75, sx = (fw - sw) / 2, sy = top + Math.max(0, (avail - sh) * (shown ? .5 : .4)), tw = tH * 4 / 3, tg = Math.min(14, (sw - tw * 4) / 3);
  L.in = { fw, fh, x: sx, y: sy, w: sw, h: sh, tH, tw, tg, tx: sx + (sw - (tw * 4 + tg * 3)) / 2, ty: sy + sh + 24 };
  const q = clamp(S * G.DPR, 1, 2.5);
  SPR = { room: G.spr(VW, VH, drawRoom, q), inside: G.spr(VW, VH, drawInside, Math.min(q, 1.5)) };
  mineSprite(); thumbs = mode === 'play' && pl ? thumbs.map((q, i) => reelThumb(pl.reel, i)) : shots.map(mkThumb); if (pr && pr.rec) pr.spr = outSprite(pr.rec);
  $('pui').style.fontSize = clamp(16 * S, 13, 18) + 'px';
}
const lineY = x => L.ly + Math.sin((x - L.x0) / (L.x1 - L.x0) * Math.PI) * (L.wide ? 16 : 9);
const stripRect = i => { const s = ITEMS[i], x = L.x0 + L.gap * (i + .5), w = L.th * s.a; return { x: x - w / 2, y: lineY(x) + 7, w, h: L.th, cx: x }; };
const mkThumb = id => G.spr(L.in.tw, L.in.tH, (g, w, h) => shot(g, w, h, st, id, 3, false), clamp(S * G.DPR, 1, 3));
const reelThumb = (reel, n) => { let c; withLook(reelLook(reel), () => { c = G.spr(L.in.tw, L.in.tH, (g, w, h) => shot(g, w, h, reelSet(reel, n), reel.frames[n], 3, false), clamp(S * G.DPR, 1, 3)); }); return c; };
const outSprite = rec => { const fw = 200, d = dims(fw); return G.spr(d.W, d.H, g => drawStrip(g, rec, fw), clamp(S * G.DPR * 1.2, 1, 3)); };

/* ------------------------------------------------------------------ the room with the booth in it */
function drawRoom(g, w, h) {
  const r = R(2606), fl = L.floor, B = L.booth;
  let gr = g.createLinearGradient(0, 0, 0, fl); gr.addColorStop(0, '#2c5560'); gr.addColorStop(1, '#3d6f76'); g.fillStyle = gr; g.fillRect(0, 0, w, fl);
  for (let i = 0; i < w * fl / 2400; i++) dab(g, r() * w, r() * fl, 20 + r() * 60, 8 + r() * 18, r() * 3, r() < .5 ? '#4f858a' : '#234852', .1); g.globalAlpha = 1;
  g.fillStyle = 'rgba(255,255,255,.035)'; for (let y = 18; y < fl - 70; y += 34) for (let x = (Math.round(y / 34) % 2) * 17 + 6; x < w; x += 34) { g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 4, y); g.lineTo(x, y + 5); g.lineTo(x - 4, y); g.fill(); }
  g.globalCompositeOperation = 'lighter'; glow(g, (L.x0 + L.x1) / 2, L.ly + L.th * .5, Math.max(260, (L.x1 - L.x0) * .62), '255,226,170', .16); g.globalCompositeOperation = 'source-over';
  /* wainscot and a chequered floor */
  const wy = fl - (L.wide ? 74 : 60); gr = g.createLinearGradient(0, wy, 0, fl); gr.addColorStop(0, '#5a3a30'); gr.addColorStop(1, '#46291f'); g.fillStyle = gr; g.fillRect(0, wy, w, fl - wy); g.fillStyle = '#7a5444'; g.fillRect(0, wy - 5, w, 6); g.strokeStyle = 'rgba(30,14,10,.3)'; g.lineWidth = 1.4; for (let x = 20; x < w; x += 64) g.strokeRect(x, wy + 10, 50, fl - wy - 20);
  const rows = 3, tile = L.wide ? 70 : 54, yk = k => fl + (h - fl) * Math.pow(k / rows, 1.25), sc = y => 1 + (y - fl) / (h - fl) * .55, n = Math.ceil(w / tile) + 4;
  for (let k = 0; k < rows; k++) { const y0 = yk(k), y1 = yk(k + 1); for (let i = -n; i < n; i++) { g.fillStyle = (i + k) % 2 ? '#efe2c6' : '#2a2630'; g.beginPath(); g.moveTo(w / 2 + i * tile * sc(y0), y0); g.lineTo(w / 2 + (i + 1) * tile * sc(y0), y0); g.lineTo(w / 2 + (i + 1) * tile * sc(y1), y1 + .6); g.lineTo(w / 2 + i * tile * sc(y1), y1 + .6); g.fill(); } }
  gr = g.createLinearGradient(0, fl, 0, fl + 26); gr.addColorStop(0, 'rgba(20,14,24,.4)'); gr.addColorStop(1, 'rgba(20,14,24,0)'); g.fillStyle = gr; g.fillRect(0, fl, w, 26);
  /* the line the strips hang from */
  g.strokeStyle = '#e9dcc0'; g.lineWidth = 1.6; g.beginPath(); for (let x = L.x0 - 8; x <= L.x1 + 8; x += 6) g.lineTo(x, lineY(clamp(x, L.x0, L.x1)) + 1); g.stroke();
  for (const x of [L.x0 - 8, L.x1 + 8]) { g.fillStyle = '#d9a03c'; g.beginPath(); g.arc(x, L.ly + 1, 3.4, 0, TAU); g.fill(); }
  /* the easel */
  const E = L.easel, ecx = E.x + E.w / 2; g.strokeStyle = '#8a5c38'; g.lineWidth = L.wide ? 7 : 5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(ecx, E.y - 22); g.lineTo(ecx - E.w * .42, fl + 6); g.moveTo(ecx, E.y - 22); g.lineTo(ecx + E.w * .42, fl + 6); g.moveTo(ecx, E.y - 22); g.lineTo(ecx + 4, fl - 10); g.stroke();
  g.fillStyle = '#74492a'; g.fillRect(E.x - 8, E.y + E.h + 4, E.w + 16, L.wide ? 9 : 7); g.fillStyle = 'rgba(20,14,24,.25)'; g.fillRect(E.x + 5, E.y + 7, E.w, E.h);
  /* the booth */
  const { x, y, w: bw, h: bh, dw, pw } = B, dx = x + 12, dy = y + 56, dh = bh - 56 - 24, px = dx + dw + 10;
  g.fillStyle = 'rgba(20,14,24,.3)'; ell(g, x + bw / 2 + 8, fl + 6, bw * .62, 15); g.fill();
  g.fillStyle = '#26222c'; rr(g, x - 5, y + bh - 14, bw + 10, 16, 4); g.fill();
  gr = g.createLinearGradient(x, 0, x + bw, 0); gr.addColorStop(0, '#f6ead0'); gr.addColorStop(.8, '#efdfc0'); gr.addColorStop(1, '#d6c4a2'); g.fillStyle = gr; rr(g, x, y + 30, bw, bh - 42, 9); g.fill();
  g.fillStyle = '#e0604a'; g.fillRect(x, y + bh * .78, bw, 11); g.fillStyle = '#2f8a8c'; g.fillRect(x, y + bh * .78 + 15, bw, 6);
  g.fillStyle = '#b8262c'; rr(g, x - 9, y, bw + 18, 46, 11); g.fill(); g.fillStyle = '#2a1c24'; rr(g, x - 1, y + 7, bw + 2, 28, 7); g.fill();
  g.fillStyle = '#ffe9a8'; g.font = `italic 600 ${L.wide ? 23 : 18}px ${DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(255,200,110,.9)'; g.shadowBlur = 10; g.fillText('PHOTOS', x + bw / 2, y + 22); g.shadowBlur = 0;
  /* the doorway, a stool, and the curtain */
  g.fillStyle = '#241820'; rr(g, dx, dy, dw, dh, 5); g.fill(); g.save(); rr(g, dx, dy, dw, dh, 5); g.clip();
  g.globalCompositeOperation = 'lighter'; glow(g, dx + dw * .5, dy + dh * .5, dw * .9, '255,214,170', .22); g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#8f949c'; g.fillRect(dx + dw * .5 - 3, dy + dh * .78, 6, dh * .22); g.fillStyle = '#c8463a'; ell(g, dx + dw * .5, dy + dh * .78, dw * .26, 7); g.fill();
  const ch = dh * .62, pl = 7; for (let i = 0; i < pl; i++) { const cx0 = dx + dw * i / pl, cw = dw / pl + 1, hem = ch + Math.sin(i * 1.9) * 7 + (i > 4 ? -ch * .22 * (i - 4) : 0); gr = g.createLinearGradient(cx0, 0, cx0 + cw, 0); gr.addColorStop(0, '#7a1c2c'); gr.addColorStop(.45, '#b83246'); gr.addColorStop(1, '#84202f'); g.fillStyle = gr; g.beginPath(); g.moveTo(cx0, dy); g.lineTo(cx0 + cw, dy); g.lineTo(cx0 + cw, dy + hem - 3); g.quadraticCurveTo(cx0 + cw / 2, dy + hem + 7, cx0, dy + hem); g.fill(); }
  g.restore(); g.fillStyle = '#8f949c'; g.fillRect(dx - 3, dy - 3, dw + 6, 4);
  /* the panel: a lens, a window for the newest strip, and the slot the strips drop into */
  g.fillStyle = '#26222c'; g.beginPath(); g.arc(px + pw / 2, dy + 16, L.wide ? 12 : 9, 0, TAU); g.fill(); g.fillStyle = '#5f7f9c'; g.beginPath(); g.arc(px + pw / 2, dy + 16, L.wide ? 7 : 5, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(px + pw / 2 - 2, dy + 14, 2, 0, TAU); g.fill();
  g.fillStyle = INK; g.font = `800 ${L.wide ? 9.5 : 7.5}px ${UI}`; g.fillText('4 POSES', px + pw / 2, dy + (L.wide ? 40 : 34));
  const D = L.disp; g.fillStyle = '#26222c'; rr(g, D.x - 4, D.y - 4, D.w + 8, D.h + 8, 3); g.fill();
  g.fillStyle = '#17141c'; rr(g, px + 2, y + bh - 70, pw - 4, 13, 5); g.fill(); g.fillStyle = 'rgba(44,42,61,.6)'; g.font = `800 ${L.wide ? 7.5 : 6}px ${UI}`; g.fillText('PHOTOS', px + pw / 2, y + bh - 49);
}
function drawInside(g, w, h) {
  const pl = Math.ceil(w / 46); for (let i = 0; i < pl; i++) { const gr = g.createLinearGradient(i * 46, 0, i * 46 + 46, 0); gr.addColorStop(0, '#5a1220'); gr.addColorStop(.5, '#9a2a3c'); gr.addColorStop(1, '#621624'); g.fillStyle = gr; g.fillRect(i * 46, 0, 47, h); }
  let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(20,6,14,.62)'); gr.addColorStop(.22, 'rgba(20,6,14,.08)'); gr.addColorStop(.7, 'rgba(20,6,14,.1)'); gr.addColorStop(1, 'rgba(20,6,14,.6)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}

/* ------------------------------------------------------------------ drawing a frame */
function frame(dt) {
  if (!L || !SPR) return; const t = G.time, g = cx; update(dt);
  g.setTransform(S * G.DPR, 0, 0, S * G.DPR, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  if (mode === 'wall') drawWall(g, t); else drawIn(g, t);
  if (flash > 0) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(255,252,240,${Math.min(1, flash) * (G.RM ? .5 : .96)})`; g.fillRect(0, 0, cv.width, cv.height); }
  G.paper(g, .32);
}
const TARGETS = () => [...ITEMS.map((s, i) => i), ...(last ? ['mine'] : []), 'booth'];
const door = () => L.booth.x + 12 + L.booth.dw / 2;
const isHot = k => hover === k || (focus >= 0 && TARGETS()[focus] === k);
function drawWall(g, t) {
  g.drawImage(SPR.room, 0, 0, VW, VH); const B = L.booth, still = G.RM ? 0 : 1;
  /* bulbs along the sign */
  for (let i = 0; i < Math.floor(B.w / 17); i++) { const bx = B.x + 6 + i * 17, on = .55 + .45 * Math.sin(t * 3.2 + i * 1.3) * still; g.globalCompositeOperation = 'lighter'; glow(g, bx, B.y + 41, 9, '255,214,130', .5 * on); g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(255,236,170,${.6 + .4 * on})`; g.beginPath(); g.arc(bx, B.y + 41, 2.6, 0, TAU); g.fill(); }
  if (isHot('booth')) { g.globalCompositeOperation = 'lighter'; glow(g, B.x + B.w * .34, B.y + B.h * .55, B.w * .8, '255,226,170', .3); g.globalCompositeOperation = 'source-over'; }
  /* the newest strip she made, in the window on the booth */
  const D = L.disp; if (SPR.mine) { if (isHot('mine')) { g.globalCompositeOperation = 'lighter'; glow(g, D.x + D.w / 2, D.y + D.h / 2, D.h * .7, '255,240,190', .5); g.globalCompositeOperation = 'source-over'; } g.drawImage(SPR.mine, D.x, D.y, D.w, D.h); }
  else { g.fillStyle = '#fbfaf5'; g.fillRect(D.x, D.y, D.w, D.h); const d = dims(D.w / 1.14); for (let i = 0; i < 4; i++) { g.fillStyle = '#d9d6cc'; g.fillRect(D.x + d.m, D.y + d.m + i * (d.fh + d.gap), D.w - 2 * d.m, d.fh); } }
  /* the painting on the easel */
  const E = L.easel, hotE = isHot(MET), lift = hotE ? 3 : 0; if (hotE) { g.globalCompositeOperation = 'lighter'; glow(g, E.x + E.w / 2, E.y + E.h / 2, E.w * .8, '255,240,190', .4); g.globalCompositeOperation = 'source-over'; }
  g.fillStyle = '#fbf6ea'; g.fillRect(E.x - 4, E.y - 4 - lift, E.w + 8, E.h + 8); if (img.met.ok) g.drawImage(img.met, E.x, E.y - lift, E.w, E.h); g.strokeStyle = 'rgba(60,40,30,.35)'; g.lineWidth = 1; g.strokeRect(E.x - 4, E.y - 4 - lift, E.w + 8, E.h + 8);
  /* the strips, pegged to the line */
  for (let i = 0; i < L.n; i++) { const s = ITEMS[i], q = stripRect(i), hot = isHot(i), sway = (Math.sin(t * .9 + i * 1.7) * .02 + (hot ? Math.sin(t * 7) * .03 : 0)) * still + s.rot;
    g.save(); g.translate(q.cx, q.y - 7); g.rotate(sway); if (hot) { g.globalCompositeOperation = 'lighter'; glow(g, 0, q.h / 2, q.h * .7, '255,240,190', .45); g.globalCompositeOperation = 'source-over'; g.scale(1.05, 1.05); }
    g.fillStyle = 'rgba(14,20,30,.3)'; g.fillRect(-q.w / 2 + 3, 10, q.w, q.h); g.fillStyle = '#f4f1e8'; g.fillRect(-q.w / 2, 7, q.w, q.h); if (img[s.id].ok) g.drawImage(img[s.id], -q.w / 2, 7, q.w, q.h);
    g.fillStyle = '#e2b074'; rr(g, -3.5, -5, 7, 17, 2); g.fill(); g.strokeStyle = 'rgba(90,55,25,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-3.5, 3); g.lineTo(3.5, 3); g.stroke(); g.restore(); }
  /* the two of them, on their way in */
  const [fx, jx, sc] = L.people, k = walk ? sm(clamp(walk.u, 0, 1)) : 0, ph = walk ? walk.u * 9 : 0, dxx = door(); g.globalAlpha = walk ? clamp((1 - walk.u) * 3.2, 0, 1) : 1;
  G.figure(g, lerp(fx, dxx - 8, k), L.floor + (L.wide ? 40 : 30) - k * 14, 'f', { dir: 1, sc: sc * (1 - .1 * k), walk: walk ? 1 : 0, phase: ph + 1.4, outfit: 'coat' }); G.figure(g, lerp(jx, dxx + 10, k), L.floor + (L.wide ? 44 : 34) - k * 16, 'j', { dir: 1, sc: sc * (1 - .1 * k), walk: walk ? 1 : 0, phase: ph, outfit: 'coat' }); g.globalAlpha = 1;
}
function drawIn(g, t) {
  g.drawImage(SPR.inside, 0, 0, VW, VH); const I = L.in;
  if (mode === 'print' || mode === 'done') {
    /* the strip drops out of the slot */
    const real = pr.real ? img[pr.real.id] : null, sp = real || pr.spr, sh = Math.min(VH - 150, 560), sw = sh * (pr.real ? pr.real.a : sp.uw / sp.uh), x = VW / 2 - sw / 2, top = 74, k = mode === 'done' ? 1 : sm(clamp(pr.u, 0, 1)), jig = mode === 'print' && !G.RM ? Math.sin(t * 40) * .8 : 0;
    g.save(); g.beginPath(); g.rect(0, top, VW, VH); g.clip(); g.fillStyle = 'rgba(14,6,10,.35)'; g.fillRect(x + 6, top - sh + k * (sh + 16) + 6, sw, sh); if (real && !real.ok) { g.fillStyle = '#f4f1e8'; g.fillRect(x + jig, top - sh + k * (sh + 16), sw, sh); } else g.drawImage(sp, x + jig, top - sh + k * (sh + 16), sw, sh);
    if (k < 1) { g.fillStyle = `rgba(251,250,245,${(1 - k) * .9})`; g.fillRect(x + jig, top - sh + k * (sh + 16), sw, sh); } g.restore();
    g.fillStyle = '#17141c'; rr(g, x - 22, top - 16, sw + 44, 18, 8); g.fill(); g.fillStyle = '#3a3440'; rr(g, x - 14, top - 4, sw + 28, 4, 2); g.fill(); return;
  }
  /* the screen */
  g.fillStyle = 'rgba(14,6,10,.4)'; rr(g, I.x - 10, I.y - 8, I.w + 28, I.h + 30, 16); g.fill(); g.fillStyle = '#1c1a22'; rr(g, I.x - 13, I.y - 13, I.w + 26, I.h + 26, 15); g.fill(); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1.2; g.stroke();
  g.save(); g.translate(I.x, I.y); if (mode === 'play') withLook(reelLook(pl.reel), () => shot(g, I.w, I.h, reelSet(pl.reel, pl.n), pl.pose, t, true)); else shot(g, I.w, I.h, st, sel, t, true); g.restore();
  /* the lens and its light */
  const lx = I.x + I.w / 2, lyy = I.y - 30; g.fillStyle = '#17141c'; g.beginPath(); g.arc(lx, lyy, 11, 0, TAU); g.fill(); g.fillStyle = '#3d5a78'; g.beginPath(); g.arc(lx, lyy, 6.5, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(lx - 2, lyy - 2, 2, 0, TAU); g.fill();
  const hold = mode === 'play' && pl.ph === 'hold', lit = (cd && (cd.t % .7) < .4) || (hold && (pl.u % .42) < .24); g.fillStyle = lit ? '#ff5a4a' : '#5a1a1a'; g.beginPath(); g.arc(lx + 24, lyy, 4, 0, TAU); g.fill(); if (lit) { g.globalCompositeOperation = 'lighter'; glow(g, lx + 24, lyy, 16, '255,90,70', .6); g.globalCompositeOperation = 'source-over'; }
  if (cd || hold) { const n = 3 - Math.min(2, Math.floor(cd ? cd.t / .7 : pl.u / .42)), k = cd ? (cd.t % .7) / .7 : (pl.u % .42) / .42, sz = I.h * .5 * (G.RM ? 1 : 1.18 - .18 * sm(Math.min(1, k * 3))); g.globalAlpha = 1 - Math.max(0, k - .7) / .3; g.font = `600 ${sz}px ${DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(20,16,30,.45)'; g.fillText(n, I.x + I.w / 2 + 3, I.y + I.h / 2 + 4); g.fillStyle = '#fffaf0'; g.fillText(n, I.x + I.w / 2, I.y + I.h / 2); g.globalAlpha = 1; }
  /* the four frames of this strip, filling up */
  const tn = mode === 'play' ? pl.reel.frames.length : 4, nx = mode === 'play' ? thumbs.length : shots.length, tx0 = I.x + (I.w - (tn * I.tw + (tn - 1) * I.tg)) / 2;
  for (let i = 0; i < tn; i++) { const x = tx0 + i * (I.tw + I.tg), y = I.ty; g.fillStyle = '#fbfaf5'; rr(g, x - 3, y - 3, I.tw + 6, I.tH + 6, 3); g.fill();
    if (thumbs[i]) g.drawImage(thumbs[i], x, y, I.tw, I.tH); else { g.fillStyle = i === nx ? '#3a2630' : '#2a1c24'; g.fillRect(x, y, I.tw, I.tH); g.fillStyle = i === nx ? '#ffe9a8' : 'rgba(255,255,255,.35)'; g.font = `800 ${I.tH * .42}px ${UI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(i + 1, x + I.tw / 2, y + I.tH / 2 + 1); } }
}

/* ------------------------------------------------------------------ taking the pictures */
const setStep = () => { $('psound').hidden = $('pleave').hidden = mode !== 'wall'; $('pstep').textContent = mode === 'wall' ? 'Tap a strip to watch it happen again, or step into the booth.' : mode === 'play' ? (pl.ph === 'hold' ? 'Hold still…' : `Photo ${pl.n + 1} of ${pl.reel.frames.length}`) : cd ? 'Hold still…' : mode === 'print' ? 'Printing…' : mode === 'done' ? (pr && pr.real ? 'And here it is.' : 'Your strip is ready.') : shots.length ? `Photo ${shots.length + 1} of 4. Pick the next pose.` : 'Pick a pose, then take the photo. Four make a strip.'; };
const whirr = () => { for (let i = 0; i < 6; i++) tone(180 + i * 14, .2, 'sawtooth', .018, .35 + i * .22); };
function play(i) {
  const it = ITEMS[i]; if (!REEL[it.id]) { openView(i); return; }
  pl = { i, it, reel: REEL[it.id], n: 0, ph: 'move', u: 0, beep: -1, from: START, pose: START }; shots = []; thumbs = []; cd = null; pr = null; walk = null; mode = 'play';
  $('pview').hidden = true; $('pout').hidden = true; $('pbar').hidden = true; $('ppanel').hidden = true; $('pwall').hidden = false; $('pskip').hidden = false; layout(); setStep();
}
function endPlay(now) { pr = { real: pl.it, u: now ? 2 : 0 }; $('pskip').hidden = true; if (now) { mode = 'done'; openView(pl.i); } else { mode = 'print'; whirr(); } setStep(); }
function update(dt) {
  flash = Math.max(0, flash - dt * 3.2);
  if (walk) { walk.u += dt / (G.RM ? .05 : .95); if (walk.u >= 1) { const k = walk.k; walk = null; if (k === 'booth') stepIn(); else play(k); } }
  if (mode === 'play') { const fr = pl.reel.frames; pl.u += dt;
    if (pl.ph === 'move') { const u = Math.min(1, pl.u / (G.RM ? .05 : pl.n ? 1.0 : 1.35)); pl.pose = mixPose(pl.from, fr[pl.n], u); if (u >= 1) { pl.pose = fr[pl.n]; pl.ph = 'hold'; pl.u = 0; pl.beep = -1; setStep(); } }
    else if (pl.ph === 'hold') { const b = Math.floor(pl.u / .42); if (b !== pl.beep && b < 3) { pl.beep = b; tone(660, .09, 'square', .035); } if (pl.u >= 1.26) { flash = 1.25; tone(1568, .05, 'square', .05); tone(220, .12, 'triangle', .07, .03); thumbs.push(reelThumb(pl.reel, pl.n)); pl.ph = 'flash'; pl.u = 0; setStep(); } }
    else if (pl.u >= .8) { pl.n++; if (pl.n >= fr.length) { pl.n = fr.length - 1; endPlay(false); } else { pl.from = fr[pl.n - 1]; pl.ph = 'move'; pl.u = 0; setStep(); } } }
  if (cd) { const was = Math.floor(cd.t / .7); cd.t += dt; const now = Math.floor(cd.t / .7); if (now !== was && now < 3) tone(660, .09, 'square', .035);
    if (cd.t >= 2.1) { cd = null; flash = 1.25; tone(1568, .05, 'square', .05); tone(220, .12, 'triangle', .07, .03); shots.push(sel); thumbs.push(mkThumb(sel));
      if (shots.length >= 4) { last = record(); keep(); mineSprite(); pr = { rec: last, u: 0, spr: outSprite(last) }; mode = 'print'; $('ppanel').hidden = true; $('pwall').hidden = true; whirr(); }
      else { const left = POSES.filter(p => !shots.includes(p.id)), at = POSES.findIndex(p => p.id === sel); sel = (left.find(p => POSES.indexOf(p) > at) || left[0] || POSES[0]).id; }
      render(); setStep(); } }
  if (mode === 'print') { pr.u += dt / (G.RM ? .3 : 1.9); if (pr.u >= 1.25) { mode = 'done'; if (pr.real) openView(pl.i); else { showOut(); tone(784, .14, 'sine', .06); tone(1175, .3, 'sine', .05, .1); } setStep(); } }
}
function snap() { if (mode !== 'in' || cd || shots.length >= 4) return; cd = { t: 0 }; tone(660, .09, 'square', .035); render(); setStep(); }
function showOut() {
  const c = stripCanvas(pr.rec, 600), im = $('poutimg'), slot = $('poutslot'); slot.querySelectorAll('canvas').forEach(n => n.remove()); im.hidden = false;
  im.onerror = () => { im.hidden = true; slot.append(c); }; try { im.src = c.toDataURL('image/jpeg', .93); } catch (e) { im.onerror(); }
  $('pout').hidden = false; $('pmore').focus();
}
function restart() { shots = []; thumbs = []; cd = null; pr = null; pl = null; walk = null; sel = POSES[0].id; mode = 'in'; $('pout').hidden = true; $('ppanel').hidden = false; $('pwall').hidden = false; $('pskip').hidden = true; $('pbar').hidden = true; layout(); render(); setStep(); }
function toWall() { cd = null; pr = null; pl = null; walk = null; shots = []; thumbs = []; mode = 'wall'; $('pview').hidden = true; $('pout').hidden = true; $('ppanel').hidden = true; $('pwall').hidden = true; $('pskip').hidden = true; $('pbar').hidden = false; hover = null; focus = -1; layout(); setStep(); }

/* the panel: poses, what they wear, and the film */
const TABS = { pose: [['pose', 'Strike a pose']], look: [['jout', 'You'], ['fout', 'Me'], ['fsh', 'My sunglasses']], film: [['film', 'Film'], ['edge', 'Strip'], ['bg', 'Backdrop']] };
function render() {
  const body = $('pbody'); body.textContent = '';
  for (const [key, title] of TABS[tab]) {
    const h = document.createElement('h3'); h.textContent = title; body.append(h); const row = document.createElement('div'); row.className = 'chips';
    const list = key === 'pose' ? POSES : key === 'jout' ? G.wardrobe.outfit.filter(o => o.c) : OPTS[key], cur = key === 'pose' ? sel : key === 'jout' ? jOut().id : st[key];
    for (const o of list) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.setAttribute('aria-pressed', cur === o.id); const sw = o.sw || (o.c && o.c.top); if (sw) { const d = document.createElement('span'); d.className = 'sw'; d.style.background = sw; b.append(d); } b.append(o.name);
      b.addEventListener('click', () => { if (cd) return; if (key === 'pose') sel = o.id; else if (key === 'jout') G.setLook('outfit', o.id); else { st[key] = o.id; keep(); } if (key !== 'pose') thumbs = shots.map(mkThumb); tone(784, .08, 'sine', .05); render(); }); row.append(b); }
    body.append(row);
  }
  if (tab === 'look') { const p = document.createElement('p'); p.className = 'soft'; p.textContent = 'Hair and make-up are in the wardrobe, on the map.'; body.append(p); }
  for (const b of document.querySelectorAll('#ptabs button')) b.setAttribute('aria-pressed', b.dataset.tab === tab);
  const sn = $('psnap'); sn.textContent = cd ? 'Smile…' : `Take photo ${Math.min(4, shots.length + 1)} of 4`; sn.disabled = !!cd || shots.length >= 4; $('pagain').hidden = !shots.length || !!cd;
}

/* looking closer at a real strip */
function openView(i) { view = i; const im = $('pimg'), it = ITEMS[i]; im.src = `media/pb_${it.id}.jpg`; im.alt = it.id === 'met' ? 'The watercolour portrait of the two of us, painted at the Met' : 'Our real photo booth strip'; $('pwatch').hidden = !REEL[it.id]; $('pview').hidden = false; $('pclose').focus(); tone(784, .16, 'sine', .06); tone(1175, .3, 'sine', .04, .08); }
function closeView() { $('pview').hidden = true; $('pimg').removeAttribute('src'); view = -1; if (mode !== 'wall' && active) toWall(); }
function openMine() { pr = { rec: last, u: 1, spr: outSprite(last) }; showOut(); }

/* ------------------------------------------------------------------ input and wiring */
const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
const within = (q, x, y, pad = 4) => x > q.x - pad && x < q.x + q.w + pad && y > q.y - pad && y < q.y + q.h + pad;
function pick(x, y) { for (let i = 0; i < L.n; i++) if (within(stripRect(i), x, y, 2)) return i; if (within(L.easel, x, y, 8)) return MET; if (last && within(L.disp, x, y, 6)) return 'mine'; if (within(L.booth, x, y, 0)) return 'booth'; return null; }
function act(k) { if (k == null || walk) return; if (k === 'mine') openMine(); else if (k === MET) openView(k); else { walk = { k, u: 0 }; hover = null; focus = -1; tone(523, .1, 'sine', .06); tone(784, .18, 'sine', .05, .1); } }
function stepIn() { restart(); }
const busy = () => !active || !$('pview').hidden || !$('pout').hidden;
cv.addEventListener('pointerdown', e => { if (busy() || !L) return; const [x, y] = pt(e); if (mode === 'wall') act(pick(x, y)); });
cv.addEventListener('pointermove', e => { if (busy() || !L || mode !== 'wall' || e.pointerType !== 'mouse') return; const [x, y] = pt(e), k = pick(x, y); if (k !== hover) { hover = k; focus = -1; } });
addEventListener('keydown', e => {
  if (!active || e.metaKey || e.ctrlKey) return;
  if (!$('pview').hidden) { if (e.key === 'Escape') closeView(); return; }
  if (!$('pout').hidden || mode !== 'wall' || (e.target && e.target.tagName === 'BUTTON')) return; const T = TARGETS();
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { focus = (focus + 1) % T.length; hover = null; e.preventDefault(); } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { focus = (focus + T.length - 1) % T.length; hover = null; e.preventDefault(); }
  else if ((e.key === 'Enter' || e.key === ' ') && focus >= 0) { e.preventDefault(); act(T[focus]); }
});
for (const b of document.querySelectorAll('#ptabs button')) b.addEventListener('click', () => { tab = b.dataset.tab; render(); });
$('psnap').addEventListener('click', snap); $('pagain').addEventListener('click', restart);
$('pgo').addEventListener('click', () => act('booth')); $('pwall').addEventListener('click', toWall);
$('pmore').addEventListener('click', restart); $('pback').addEventListener('click', toWall);
$('pclose').addEventListener('click', closeView); $('pview').addEventListener('click', e => { if (e.target === $('pview')) closeView(); });
$('pwatch').addEventListener('click', () => { const i = view; $('pview').hidden = true; $('pimg').removeAttribute('src'); view = -1; play(i); }); $('pskip').addEventListener('click', () => { if (mode === 'play') endPlay(true); });
$('pleave').addEventListener('click', () => G.go('map'));
const soundLabel = () => { $('psound').textContent = G.sound ? 'Sound on' : 'Sound off'; $('psound').setAttribute('aria-pressed', G.sound); };
$('psound').addEventListener('click', () => { G.sound = !G.sound; soundLabel(); });

G.scenes.booth = {
  frame, resize: layout,
  enter() { active = true; $('pui').hidden = false; soundLabel(); toWall(); if (document.fonts && document.fonts.load) { document.fonts.load(`italic 600 20px Fraunces`).then(() => { if (active) layout(); }).catch(() => { /* the fallback serif is fine */ }); document.fonts.load('700 14px Nunito'); } },
  leave() { active = false; cd = null; walk = null; closeView(); $('pout').hidden = true; $('pui').hidden = true; },
  debug: { play, get pl() { return pl; }, MET, POSES, ITEMS, REEL, reelSet, reelLook, withLook, mixPose, START, st, shot, snap, stepIn, get L() { return L; }, get mode() { return mode; }, get shots() { return shots; }, get last() { return last; }, stripRect, set sel(v) { sel = v; render(); } }
};
})();
