"""A map of us, as a printable board game: every part as solid geometry, in millimetres, Z up.

Each part is a list of coloured solids ("shells"). The print file is their union; the colours are for the
Blender scene and as a painting guide. Everything is meant for an ordinary filament printer:
flat bottoms, walls of 1.2 mm or more, overhangs kept to about 45 degrees, 0.2-0.3 mm of play in moving fits."""
import math
import numpy as np
from manifold3d import Manifold as M, CrossSection as CS, OpType

SEG = 48
COL = {
    'cream': '#f3e6cc', 'brick': '#9a5a48', 'red': '#c8463a', 'darkred': '#8a2d22', 'roof': '#3a2c2c', 'teal': '#2f8a8c',
    'green': '#4f9a50', 'dkgreen': '#2c5248', 'stone': '#e6dcc8', 'grey': '#8f949c', 'glass': '#7fb8c8', 'gold': '#e9b44c',
    'wood': '#8a5c38', 'white': '#fbfaf4', 'pink': '#f4a8c0', 'orange': '#e2a53a', 'navy': '#1c2748', 'black': '#26252b',
    'sand': '#f3e4b8', 'sea': '#4f9fc0', 'grass': '#8fc86a', 'road': '#e9dcb8', 'yellow': '#f6d21c', 'lime': '#b6d430',
    'bronze': '#56735f', 'bamboo': '#d9b98a', 'plum': '#5a2a6a', 'silver': '#d9dce2', 'blue': '#2f62c0', 'rust': '#c66c32',
    'skinJ': '#f8d8c0', 'hairJ': '#6d422a', 'coatJ': '#27305a', 'skinF': '#dcab82', 'hairF': '#201c26', 'coatF': '#cdb48e',
}
PLAY = 0.3          # clearance for parts that slide or turn
PEG = 12.0          # every place plugs into the board with the same square peg
PEG_H = 2.6


# ---------------------------------------------------------------- small solids
def box(w, d, h, x=0, y=0, z=0):
    return M.cube([w, d, h], True).translate([x, y, z + h / 2])

def cyl(r, h, x=0, y=0, z=0, r2=None, seg=SEG):
    return M.cylinder(h, r, r if r2 is None else r2, seg).translate([x, y, z])

def ball(r, x=0, y=0, z=0, sx=1, sy=1, sz=1, seg=32):
    return M.sphere(r, seg).scale([sx, sy, sz]).translate([x, y, z])

def ccw(pts):
    """Polygons must run anticlockwise, or they count as holes."""
    p = np.array(pts, dtype=float); x, y = p[:, 0], p[:, 1]
    return p if float(np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y)) > 0 else p[::-1].copy()

def prism(pts, h, z=0):
    return CS([ccw(pts)]).extrude(h).translate([0, 0, z])

def rbox(w, d, h, r, x=0, y=0, z=0):
    return CS.square([w - 2 * r, d - 2 * r], True).offset(r, circular_segments=24).extrude(h).translate([x, y, z])

def U(*ms):
    ms = [m for m in ms if m is not None]
    return M.batch_boolean(ms, OpType.Add) if len(ms) > 1 else ms[0]

def hull(*ms):
    return M.batch_hull(list(ms))

def gable(w, d, h, x=0, y=0, z=0):
    """A triangular roof: ridge along Y."""
    return prism([(-w / 2, 0), (w / 2, 0), (0, h)], d).rotate([90, 0, 0]).translate([x, y + d / 2, z])

def awning(w, x, ywall, z, d=3.6, h=6.2):
    """An awning on a front wall at y = ywall: 45 degrees underneath so it prints without support, sloping on top."""
    return prism([(0, d), (d + .3, 0), (d + .3, h)], w).rotate([90, 0, 90]).translate([x - w / 2, ywall - d, z])

def gumdrop(r, h, x=0, y=0, z=0):
    """A printable tree: a short drum with a dome on top."""
    return U(cyl(r, h, x, y, z, seg=24), ball(r, x, y, z + h - .1, sz=.9, seg=24).trim_by_plane([0, 0, 1], z + h - .1))

def star(n, r1, r2, h, x=0, y=0, z=0, rot=0):
    pts = [(math.cos(rot + i * math.pi / n) * (r1 if i % 2 == 0 else r2), math.sin(rot + i * math.pi / n) * (r1 if i % 2 == 0 else r2)) for i in range(2 * n)]
    return prism(pts, h, z).translate([x, y, 0])

def tube_path(pts, r):
    """A round bead through a list of 3D points."""
    return U(*[hull(ball(r, *a, seg=12), ball(r, *b, seg=12)) for a, b in zip(pts[:-1], pts[1:])])

def path2d(pts, r):
    """A flat ribbon of half-width r through 2D points."""
    c = CS.circle(r, 16)
    return CS.batch_boolean([CS.batch_hull([c.translate(a), c.translate(b)]) for a, b in zip(pts[:-1], pts[1:])], OpType.Add)

def face_front(m, y, z):
    """Stand a flat XY shape up against a front wall (the front of every place faces -Y)."""
    return m.rotate([90, 0, 0]).translate([0, y, z])

def peg(col='cream'):
    return (col, box(PEG, PEG, PEG_H + .01, 0, 0, -PEG_H))

def heart(s, h):
    pts = []
    for i in range(40):
        t = i / 40 * 2 * math.pi
        pts.append((s * 16 * math.sin(t) ** 3 / 16, s * (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) / 16))
    return prism(pts, h)


class Part:
    def __init__(self, name, shells, qty=1, note='', group='place', lay=(0, 0, 0)):
        self.name, self.shells, self.qty, self.note, self.group, self.lay = name, shells, qty, note, group, lay   # lay: how to turn it for printing

    def solid(self):
        return U(*[m for _, m in self.shells])


# ---------------------------------------------------------------- the board
BW, BH, MARG = 440.0, 220.0, 8.0
TILE = 110.0
SEA_T, SAND_T, GRASS_T = 3.0, 1.2, 1.4
TOP = SEA_T + SAND_T + GRASS_T
MW, MH = BW - 2 * MARG, BH - 2 * MARG

def at(fx, fy):
    """Map fractions (as on the screen map, y downwards) to board millimetres."""
    return (MARG + MW * fx, BH - (MARG + MH * fy))

PLACES = {   # nudged from the screen map so that no socket straddles a seam between tiles
    'frontdoor': (.15, .21), 'kitchen': (.29, .16), 'chai': (.43, .15), 'booth': (.575, .21), 'tarot': (.47, .345),
    'road': (.08, .441), 'rooftop': (.22, .441), 'garden': (.37, .441), 'un': (.585, .441),
    'medal': (.13, .79), 'city': (.29, .8), 'table': (.43, .79), 'dumplings': (.59, .79), 'bar': (.5425, .642),
    'bahamas': (.865, .27), 'mexico': (.86, .74),
}
EDGES = ('frontdoor-kitchen kitchen-chai road-rooftop rooftop-garden garden-un medal-city city-table table-dumplings frontdoor-rooftop '
         'kitchen-garden rooftop-city garden-table un-dumplings road-medal frontdoor-road chai-booth booth-un chai-tarot tarot-garden tarot-un '
         'bar-table bar-un garden-bar').split()
LANDS = [((.335, .5), .32, .485, 7), ((.865, .25), .11, .2, 21), ((.86, .73), .115, .2, 33)]
DOCK = (.663, .461)
KEYS = [(110, 55, 0), (110, 165, 0), (220, 55, 0), (220, 165, 0), (330, 55, 0), (330, 165, 0), (30, 110, 90), (140, 110, 90), (280, 110, 90), (390, 110, 90)]
BOWTIE = [(-8, -4.5), (0, -2.2), (8, -4.5), (8, 4.5), (0, 2.2), (-8, 4.5)]

def blob(c, rx, ry, seed):
    rnd = np.random.RandomState(seed); n = 72; wob = 1 + (rnd.rand(n) - .5) * .1
    wob = (wob + np.roll(wob, 1) + np.roll(wob, -1)) / 3
    pts = []
    for i in range(n):
        a = i / n * 2 * math.pi; co, si = math.cos(a), math.sin(a); k = 1 / (abs(co) ** 3 + abs(si) ** 3) ** (1 / 3)
        pts.append((c[0] + co * k * rx * wob[i], c[1] + si * k * ry * wob[i]))
    return CS([ccw(pts)]).offset(-3, circular_segments=16).offset(3, circular_segments=16)

def curve(p, q, bend, n=18):
    mx, my = (p[0] + q[0]) / 2 + (q[1] - p[1]) * bend, (p[1] + q[1]) / 2 - (q[0] - p[0]) * bend
    return [((1 - t) ** 2 * p[0] + 2 * t * (1 - t) * mx + t * t * q[0], (1 - t) ** 2 * p[1] + 2 * t * (1 - t) * my + t * t * q[1]) for t in np.linspace(0, 1, n)]

def inside(polys, x, y):
    hit = False
    for poly in polys:
        px, py = poly[:, 0], poly[:, 1]; j = len(poly) - 1
        for i in range(len(poly)):
            if ((py[i] > y) != (py[j] > y)) and (x < (px[j] - px[i]) * (y - py[i]) / (py[j] - py[i]) + px[i]):
                hit = not hit
            j = i
    return hit

def board():
    """Returns the whole board as coloured shells, plus the pieces needed to cut it into tiles."""
    frame = CS.square([BW - 6, BH - 6], True).translate([BW / 2, BH / 2])
    lands = [blob(at(*c), MW * rx, MH * ry, seed) for c, rx, ry, seed in LANDS]
    land = CS.batch_boolean(lands, OpType.Add) ^ frame
    sand = land.offset(2.6, circular_segments=16) ^ frame
    pos = {k: at(*v) for k, v in PLACES.items()}
    roads = CS.batch_boolean([path2d(curve(pos[a], pos[b], .08), 3.2) for a, b in (e.split('-') for e in EDGES)] + [CS.circle(11, 40).translate(p) for p in pos.values()], OpType.Add) ^ land.offset(-1.5)
    sockets = CS.batch_boolean([CS.square([PEG + .4, PEG + .4], True).translate(p) for p in pos.values()], OpType.Add)
    # the sea: a plate with a groove from the dock to each island for the boat's peg
    dock = at(*DOCK); ends = []
    for (c, rx, ry, _), name in zip(LANDS[1:], ('bahamas', 'mexico')):
        cx_, cy_ = at(*c); ends.append((cx_ - MW * rx - 16, pos[name][1] + (-9 if name == 'bahamas' else 9)))
    start = (dock[0] + 18, dock[1])
    tracks = [curve(start, ends[0], .04), curve(start, ends[1], -.03)]
    groove = CS.batch_boolean([path2d(t, 2.2) for t in tracks], OpType.Add)
    pockets = CS.batch_boolean([CS([ccw(BOWTIE)]).offset(.15).rotate(a).translate([x, y]) for x, y, a in KEYS], OpType.Add)
    assert (groove ^ pockets).area() < 1e-6 and (sockets ^ pockets).area() < 1e-6, 'a key pocket sits under a groove or a socket'
    sea = CS.square([BW - 16, BH - 16], True).offset(8, circular_segments=32).translate([BW / 2, BH / 2]).extrude(SEA_T)
    sea = sea - groove.extrude(1.8 + .1).translate([0, 0, SEA_T - 1.8]) - pockets.extrude(1.8).translate([0, 0, -.01])
    # little waves, a compass rose and a dock
    rnd = np.random.RandomState(4); lp = sand.offset(5).to_polygons(); gp = groove.offset(7).to_polygons(); waves = []
    while len(waves) < 46:
        x, y = 10 + rnd.rand() * (BW - 20), 10 + rnd.rand() * (BH - 20)
        if inside(lp, x, y) or inside(gp, x, y) or any(abs(x - s) < 6 for s in (110, 220, 330)) or abs(y - 110) < 4: continue
        waves.append(path2d([(x - 4.5, y), (x - 2.2, y + 1.4), (x, y), (x + 2.2, y + 1.4), (x + 4.5, y)], .55).extrude(.5).translate([0, 0, SEA_T - .01]))
    rose = (BW - 17, 17)
    compass = U(cyl(7.5, .6, rose[0], rose[1], SEA_T - .01), star(4, 6.8, 2, 1.3, rose[0], rose[1], SEA_T - .01, math.pi / 2), cyl(1.6, 1.8, rose[0], rose[1], SEA_T - .01))
    pier = box(20, 7, TOP - SEA_T - .8, dock[0] + 5, dock[1], SEA_T - .01)
    sand_m = sand.extrude(SAND_T + .01).translate([0, 0, SEA_T - .01])
    grass = land.extrude(GRASS_T + .01).translate([0, 0, SEA_T + SAND_T - .01])
    cut = U(sockets.extrude(3.1).translate([0, 0, TOP - 3]), roads.extrude(1).translate([0, 0, TOP - .8]))
    grass, sand_m, sea = grass - cut, sand_m - cut, sea - sockets.extrude(3.1).translate([0, 0, TOP - 3])
    road_fill = (roads - sockets).extrude(.25).translate([0, 0, TOP - .82])       # a thin skin in the path colour
    # trees wherever there is room
    polys = land.offset(-6).to_polygons(); rp = roads.offset(3).to_polygons(); trees = {'green': [], 'dkgreen': [], 'pink': [], 'orange': []}
    rnd = np.random.RandomState(11); n = 0
    while n < 74:
        x, y = rnd.rand() * BW, rnd.rand() * BH
        if not inside(polys, x, y) or inside(rp, x, y) or any(math.hypot(x - p[0], y - p[1]) < 21 for p in pos.values()): continue
        if any(abs(x - s) < 4.5 for s in (110, 220, 330)) or abs(y - 110) < 4.5: continue
        r = 2.3 + rnd.rand() * 1.3; k = rnd.rand()
        trees['pink' if k < .12 else 'orange' if k < .22 else 'green' if k < .62 else 'dkgreen'].append(gumdrop(r, 1.6 + rnd.rand() * 1.6, x, y, TOP - .01)); n += 1
    shells = [('sea', U(sea, *waves)), ('sand', sand_m), ('grass', grass), ('road', road_fill), ('wood', pier), ('cream', compass)]
    shells += [(c, U(*t)) for c, t in trees.items() if t]
    return shells, pos, tracks

def tiles(shells):
    out = []
    for i in range(4):
        for j in range(2):
            cutter = box(TILE, TILE, 40, TILE * (i + .5), TILE * (j + .5), -5)
            out.append(Part(f'board_tile_{chr(65 + i)}{j + 1}', [(c, m ^ cutter) for c, m in shells if not (m ^ cutter).is_empty()], group='board', note=f'column {chr(65 + i)} (left to right), row {j + 1} (front to back)'))
    return out

def key():
    return Part('board_key', [('wood', prism(BOWTIE, 1.6))], qty=12, group='board', note='bow-tie that locks two tiles together from underneath; 10 needed, 2 spare')


# ---------------------------------------------------------------- the two of them
def figure(who):
    skin, hair, coat = 'skin' + who, 'hair' + who, 'coat' + who
    base = U(cyl(8, 1.2), cyl(8, .8, 0, 0, 1.2, r2=7.2))
    body = U(cyl(6.6, 13, 0, 0, 2, r2=4.4), ball(4.4, 0, 0, 15, sz=.7))
    arms = U(*[hull(ball(1.7, s * 4.6, -.6, 14.2, seg=16), ball(1.6, s * 5.9, -1.6, 8.2, seg=16)) for s in (-1, 1)])
    neck = cyl(3.3, 2.5, 0, 0, 15.5)
    # a round head that still prints without supports: only the very bottom is a short cone up from the neck
    hz, hr, kz, cut = 27.5, 9.2, .96, 21.4
    surf = lambda x, dz: -math.sqrt(max(0, hr * hr - x * x - (dz / kz) ** 2))
    rc = math.sqrt(hr * hr - ((hz - cut) / kz) ** 2)
    head = U(hull(cyl(3.4, .2, 0, 0, 17.6), cyl(rc, .2, 0, 0, cut)), ball(hr, 0, 0, hz, sz=kz).trim_by_plane([0, 0, 1], cut - .1))
    eyes = U(*[ball(1.55, s * 3.5, surf(3.5, -.9) + .95, hz - .9, sy=.8, sz=1.28, seg=20) for s in (-1, 1)])
    shine = U(*[ball(.5, s * 3.5 - .5, surf(3.5, -.2) + .2, hz - .2, seg=10) for s in (-1, 1)])
    smile = tube_path([(x, surf(x, dz) + .15, hz + dz) for x, dz in ((-2.2, -4.1), (-1.1, -4.9), (0, -5.15), (1.1, -4.9), (2.2, -4.1))], .5)
    blush = U(*[ball(1.5, s * 6, surf(6, -3.3), hz - 3.3, sz=.72, seg=16) for s in (-1, 1)]) ^ ball(hr + .25, 0, 0, hz, sz=kz)
    head = head - smile
    # hair: a cap over the top and back, a fringe parted in the middle, and long hair down the back that leans on the coat
    cap = ball(hr + 1.3, 0, .6, hz + .5, sz=.97) - ball(hr + .1, 0, 0, hz, sz=kz)
    cap = cap - box(40, 40, 40, 0, -23.4, hz + 4.2 - 40) - box(40, 40, 30, 0, 0, hz - 33.2)
    fringe = U(*[hull(ball(2.6, s * 1.5, -hr + 1.9, hz + 7, seg=16), ball(2.5, s * 6.4, -hr + 3.4, hz + 3.4, seg=16), ball(2.2, s * 8.4, -hr + 6, hz - 2.4, seg=16)) for s in (-1, 1)])
    wv = 1 if who == 'J' else 0
    back = U(*[hull(ball(3.4, s * 4.6, 6.6, hz + 1, seg=16), ball(3.2 + wv * .3, s * (5.2 + wv * .9), 6.4, hz - 9, seg=16), ball(2.9, s * (4.4 - wv * .6), 5.6, hz - 17 + wv, seg=16), ball(2.2 + wv * .5, s * (3.6 + wv), 5, 6.5 + wv * 1.5, seg=16)) for s in (-1, 1)],
             hull(ball(3.6, 0, 7, hz, seg=16), ball(3.2, 0, 6.2, hz - 12, seg=16), ball(2.6, 0, 5.2, 7, seg=16)))
    sides = U(*[hull(ball(2.4, s * 8.5, 1.6, hz + 1, seg=16), ball(2.3, s * (7.9 + wv * .5), 3.4, hz - 6.5, seg=16), ball(2.2, s * 5.6, 5.4, hz - 13, seg=16)) for s in (-1, 1)])
    hair_m = U(cap, fringe, back, sides) - box(60, 60, 4, 0, 0, -2)
    shells = [(coat, U(base, body, arms)), (skin, U(neck, head)), (hair, hair_m), ('pink', blush), ('black', eyes), ('white', shine)]
    if who == 'J': shells.append(('cream', cyl(4.7, 1.4, 0, 0, 14.6, r2=3.6)))
    return Part('figure_jana' if who == 'J' else 'figure_friend', shells, group='mover', note='stands on its own base; print upright')

def boat():
    hexa = lambda L, W, k: [(-L, 0), (-L * k, -W), (L * k, -W), (L, 0), (L * k, W), (-L * k, W)]
    hullm = hull(prism(hexa(24, 10.5, .62), .4), prism(hexa(26, 11.6, .62), .4, 4.2))
    deck = prism(hexa(23, 9.6, .65), 2, 3.2)
    seats = U(cyl(8.35, 3, -8.8, 0, 2.4), cyl(8.35, 3, 8.8, 0, 2.4))
    stripe = prism(hexa(26.15, 11.75, .62), 1.1, 3.1) - prism(hexa(25.2, 10.9, .62), 3, 2)
    return Part('boat', [('white', U((hullm - deck) - seats, cyl(1.8, 1.7, 0, 0, -1.69))), ('blue', stripe)], group='mover', note='its peg rides in the groove from the dock to each island; both figures stand in it')

def pin():
    return Part('pin', [('gold', U(cyl(3.6, 1.2), cyl(1.9, 9.5, 0, 0, 1.2), cyl(1.9, .8, 0, 0, 10.7, r2=1.5)))], qty=2, group='mover', note='axle for the rooftop sun-and-moon wheel; 1 needed, 1 spare')


# ---------------------------------------------------------------- the places (front faces -Y, ground at z = 0)
def window(w, h, x, y, z, d=.7):
    return box(w, d * 2, h, x, y, z)

def stripes_awning(n, w, x0, ywall, z, d=3.6, h=6.2):
    full = awning(n * w, x0 + n * w / 2, ywall, z, d, h)
    alt = U(*[awning(w, x0 + (i + .5) * w, ywall, z, d + .06, h + .06) for i in range(0, n, 2)])
    return full, alt

def p_frontdoor():
    W, Dp, H, fy = 26, 18, 34, -9
    sy = fy + 1.6 + 1.1                                                  # the door drops down a slot just behind the front wall
    body = box(W, Dp, H)
    wins = U(*[window(5, 6.5, x, fy, z) for x in (-7.5, 7.5) for z in (15, 24.5)], window(5, 6.5, 0, fy, 24.5))
    slot = box(10.8, 2.2, H, 0, sy, 2.2)
    opening = box(8.4, 4, 13, 0, fy, 2.2)
    love = face_front(heart(3, 1.2), sy + 1.1 + .6, 8.5)
    body = body - wins - slot - opening - love
    cornice = box(W + 2.4, Dp + 2.4, 2, 0, 0, H) - box(11.2, 2.6, 3, 0, sy, H - .5)
    stoop = U(box(13, 5, 2.2, 0, fy - 2.5, 0), box(13, 2.6, 1.1, 0, fy - 6.3, 0))
    door = U(box(10.2, 1.2, H + 1.5), box(13.6, 1.2, 3, 0, 0, H + 1.5), box(8, .5, 12, 0, -.75, 1) - box(5.6, 1, 9.6, 0, -.9, 2.2)) - ball(.9, 2.9, -.9, 7, seg=12)
    return [Part('place_frontdoor', [('brick', body), ('cream', U(cornice, stoop)), peg('brick')], note='the front door'),
            Part('place_frontdoor_door', [('red', door)], group='mover', lay=(-90, 0, 0), note='slides down the slot behind the doorway; lift it by the bar on top to find the heart inside. Print it lying on its back')]

def p_kitchen():
    body = box(28, 22, 15) - U(window(5, 5, -8, -11, 6), window(5, 5, 8, -11, 6), box(6, 1.4, 10, 0, -11, 0))
    roof = gable(31, 25, 11, 0, 0, 15)
    chim = box(5, 5, 10, 8, 4, 16)
    sign = face_front(cyl(4.2, .9), -12.5 + .3, 20.2)
    pot = U(cyl(4.2, 4.2, -9.5, -15.5, 0), cyl(4.6, .8, -9.5, -15.5, 4.2), box(11.6, 1.4, 1.2, -9.5, -15.5, 3.2))
    noodles = ball(3.8, -9.5, -15.5, 4.6, sz=.45, seg=20).trim_by_plane([0, 0, 1], 4.6)
    stand = box(15, 9, 1.2, -8, -15, 0)
    return [Part('place_kitchen', [('cream', body), ('red', roof), ('brick', chim), ('yellow', U(sign, noodles)), ('grey', pot), ('stone', stand), peg()], note='Maggi kitchen, with the pot on the step')]

def moka(x, y, z, s=1):
    lo = cyl(5.2 * s, 6.5 * s, x, y, z, r2=3.5 * s, seg=8); hi = cyl(3.5 * s, 6.5 * s, x, y, z + 6.5 * s, r2=5.2 * s, seg=8)
    lid = cyl(5.2 * s, 1 * s, x, y, z + 13 * s, r2=3.2 * s, seg=8); knob = U(cyl(1 * s, 1 * s, x, y, z + 14 * s, seg=12), ball(1.3 * s, x, y, z + 15.4 * s, seg=12))
    handle = prism([(3.3 * s, 6.4 * s), (7.4 * s, 10.5 * s), (7.4 * s, 13 * s), (4.6 * s, 13.2 * s), (3.3 * s, 9.5 * s)], 1.8).rotate([90, 0, 0]).translate([x, y + .9, z])
    spout = prism([(-3.2 * s, 9.6 * s), (-6 * s, 12.6 * s), (-6 * s, 13 * s), (-3.2 * s, 13 * s)], 2.6).rotate([90, 0, 0]).translate([x, y + 1.3, z])
    return U(lo, hi, lid, spout), U(handle, knob)

def p_chai():
    body = box(28, 20, 15) - U(window(11, 7, -5.5, -10, 4), box(6, 1.4, 10, 8, -10, 0))
    roof = box(30, 22, 1.8, 0, 0, 15)
    awn, alt = stripes_awning(6, 4.6, -13.8, -10, 10.4)
    pot, grip = moka(0, 1, 16.8, 1.05)
    return [Part('place_chai', [('cream', U(body, awn)), ('teal', alt), ('wood', roof), ('silver', pot), ('black', grip), peg()], note='Chai coffee, with the moka pot on the roof')]

def p_booth():
    recess = box(9, 3.2, 21, -4, -9, 2.2)
    slot = box(10.7, 30, 2.3, 3.6, 0, 8)                                  # the strip slides right through, front to back
    body = box(20, 18, 30) - recess - slot
    curtain = U(*[cyl(1.5, 21, -7 + i * 3, -7.4, 2.2, seg=16) for i in range(3)])
    head = box(23, 20.5, 6, 0, 0, 30)
    bulbs = U(*[ball(1, -8.5 + i * 3.4, -10.2, 31.4, seg=12) for i in range(6)])
    lens = face_front(cyl(2.3, .9), -9 + .2, 24.5).translate([5.2, 0, 0])
    stripe = (box(20.5, 18.5, 1.6, 0, 0, 3.6) - box(20, 18, 3, 0, 0, 3)) - recess
    strip = U(box(10, 34, 1.2), box(13.4, 4, 1.2, 0, 19), *[box(8, 6.2, .5, 0, -12.6 + i * 7.4, 1.2) - box(6.6, 4.8, 1, 0, -12.6 + i * 7.4, 1.3) for i in range(4)])
    return [Part('place_booth', [('cream', body), ('red', U(head, curtain)), ('gold', bulbs), ('black', lens), ('teal', stripe), peg()], note='the photo booth; the slot runs front to back at knee height'),
            Part('place_booth_strip', [('white', strip)], qty=2, group='mover', note='the photo strip: push it through the booth from behind. A real strip printed 10 mm wide can be glued on')]

def p_tarot():
    steps = U(*[box(32 - i * 2.2, 13 - i * 2.4, 2.1, 0, -7.5 + i * 1.2, i * 2.1) for i in range(4)])
    hall = box(27, 12, 20, 0, 5.5, 0) - box(15.5, 1.6, 9.2, 0, -.5, 8.4)
    cols = U(*[cyl(1.05, 9.2, -6.25 + i * 2.5, -1.2, 8.4, seg=14) for i in range(6)], box(15.5, 2.2, 1.2, 0, -1, 17.6))
    attic = U(box(29, 13.5, 1.6, 0, 5.5, 20), box(19, 11, 3.6, 0, 5.5, 21.6))
    dome = U(cyl(7.4, 1.6, 0, 5.5, 25.2), ball(7.4, 0, 5.5, 26.7, sz=.62).trim_by_plane([0, 0, 1], 26.7))
    bench = box(32, 4.6, 4.2, 0, -16.3, 0) - U(*[box(9.1, 2, 3.2, x, -16.3, 1.2) for x in (-10.4, 0, 10.4)])
    alma = U(box(4.6, 4.6, 3.5, 0, -11.2, 2.0), cyl(1.9, 3.7, 0, -11.2, 5.4, r2=1.3, seg=16), ball(1.25, 0, -11.2, 9.9, seg=12))
    return [Part('place_tarot', [('stone', U(steps, hall, cols, attic, bench)), ('bronze', U(dome, alma)), peg('stone')], note='the Columbia steps; the three cards stand in the slots on the front bench')]

def tarot_card(k):
    plate = rbox(8.5, 13.2, 1.15, 1)
    rim = rbox(8.5, 13.2, .45, 1, 0, 0, 1.15) - rbox(7.1, 11.8, 1, .6, 0, 0, 1.1)
    if k == 'sun':
        art = U(cyl(1.9, .5, 0, 1.2, 1.15, seg=24), *[box(.7, 1.5, .5, 0, 0, 1.15).translate([0, 3.2, 0]).rotate([0, 0, i * 45]).translate([0, 1.2, 0]) for i in range(8)])
    elif k == 'star':
        art = U(star(8, 3.3, 1.35, .5, 0, 1.4, 1.15, math.pi / 2), *[star(4, .8, .3, .5, x, y, 1.15) for x, y in ((-2.6, -3.6), (2.6, -3.6), (0, -4.6))])
    else:
        ring = lambda x: cyl(1.7, .5, x, 2.6, 1.15, seg=24) - cyl(1.0, 1, x, 2.6, 1, seg=24)
        art = U(ring(-1.35), ring(1.35), box(.9, 5, .5, 0, -1.6, 1.15), star(4, 1.3, .5, .5, 0, -4.4, 1.15, math.pi / 2))
    return Part(f'place_tarot_card_{k}', [('navy', plate), ('gold', U(rim, art))], group='mover', note={'sun': 'The Sun', 'star': 'The Star', 'mag': 'The Magician: the sign over her head, and her wand'}[k] + '. Print flat, picture up')

def p_road():
    base = rbox(30, 22, 1.4, 3)
    river = rbox(30, 7, .5, 2, 0, 6.5, 1.39)
    path = prism([(-15, -8), (15, -3.5), (15, 1), (-15, -3.5)], .5, 1.39)
    lamp = U(cyl(1.25, 15.1, 9, -7, 1.3, seg=16), cyl(2.2, 1.3, 9, -7, 1.3, seg=16), cyl(1.3, 1.6, 9, -7, 16.4, r2=2.4, seg=16))
    glow = ball(2.4, 9, -7, 18.5, seg=16).trim_by_plane([0, 0, 1], 17.9)
    return [Part('place_road', [('green', base), ('sea', river), ('stone', path), ('black', lamp), ('gold', glow),
                               ('orange', U(gumdrop(4.2, 5, -8, -8.5, 1.3), gumdrop(3, 3.5, 1, 1.6, 1.3))), ('rust', gumdrop(3.6, 4.4, -1.5, -8.5, 1.3)), peg('green')], note='the river road, with the lamp')]

def p_rooftop():
    hole = cyl(2.0, 7, seg=24).rotate([-90, 0, 0]).translate([0, 2.5, 26.5])
    body = box(22, 18, 28) - U(*[window(4, 5, x, -9, z) for x in (-6, 0, 6) for z in (6, 14, 21)]) - hole
    parapet = (box(23.6, 19.6, 3, 0, 0, 28) - box(20.4, 16.4, 4, 0, 0, 29.2)) - hole
    table = cyl(2.6, 3.2, 0, -2.5, 28.9, seg=20); stools = U(cyl(1.5, 2, -5.4, -2.5, 28.9, seg=16), cyl(1.5, 2, 5.4, -2.5, 28.9, seg=16))
    glasses = U(cyl(.9, 1.6, -1.1, -2.5, 32, seg=12), cyl(.9, 1.6, 1.1, -2.5, 32, seg=12))
    lights = U(*[ball(.85, -10 + i * 4, -8.6, 31.4, seg=10) for i in range(6)])
    disc = cyl(15, 2, seg=64) - cyl(2.25, 5, 0, 0, -1, seg=24)
    sun = U(cyl(4.2, .7, 0, 9.2, 2, seg=24), *[box(1.2, 2.4, .7, 0, 0, 2).translate([0, 5.6, 0]).rotate([0, 0, i * 45]).translate([0, 9.2, 0]) for i in range(8)]) ^ cyl(14.6, 4, seg=64)
    moon = cyl(4.4, .7, 0, -9.2, 2, seg=24) - cyl(3.8, 2, 2.2, -8.2, 1.5, seg=24)
    stars = U(*[star(4, 1.3, .5, .7, x, y, 2) for x, y in ((6, -6), (-6.5, -7), (-2, -12.4))])
    return [Part('place_rooftop', [('brick', body), ('cream', parapet), ('wood', U(table, stools)), ('rust', glasses), ('gold', lights), peg('brick')], note='the rooftop; the hole high on the back wall takes the pin'),
            Part('place_rooftop_wheel', [('navy', disc), ('gold', U(sun, stars)), ('cream', moon)], group='mover', note='sun on one side, moon on the other: pinned to the back wall, turning it brings the sun or the moon up over the roof. Print flat, picture up')]

def p_garden():
    base = U(cyl(19, 1.6, seg=64), cyl(6, 3.6, 0, 0, 1.6, seg=40))
    pond = cyl(4.4, .5, 0, 0, 5.19, seg=32)
    bridge = (cyl(3.4, 1.6, seg=24).rotate([90, 0, 0]).translate([0, .8, 5.2]) - cyl(2.3, 3, seg=24).rotate([90, 0, 0]).translate([0, 1.5, 5.2])).trim_by_plane([0, 0, 1], 5.2)
    pointer = prism([(-2.2, -19.6), (2.2, -19.6), (0, -16.6)], 1.2, 1.59)
    ring = cyl(15.6, 1.6, seg=64) - cyl(6 + PLAY, 4, 0, 0, -1, seg=40)
    seasons = {'pink': [(-10.6, 0, 3.4, 4), (-9, 4.6, 2.6, 3), (-9, -4.6, 2.6, 3)], 'green': [(0, -10.6, 3.6, 4.4), (4.6, -9, 2.6, 3), (-4.6, -9, 2.8, 3.4)],
               'orange': [(10.6, 0, 3.4, 4), (9, 4.6, 2.6, 3)], 'white': [(0, 10.6, 3.2, 3), (4.8, 9, 2.4, 2.4), (-4.8, 9, 2.6, 2.6)]}
    trees = [(c, U(*[gumdrop(r, h, x, y, 1.55) for x, y, r, h in v])) for c, v in seasons.items()]
    trees.append(('rust', gumdrop(2.6, 3.4, 9, -4.6, 1.55)))
    return [Part('place_garden', [('green', base), ('sea', pond), ('white', bridge), ('gold', pointer), peg('green')], note='Central Park: the hub the season ring turns around'),
            Part('place_garden_ring', [('grass', ring)] + trees, group='mover', note='the four seasons: drop it over the hub and turn it; the season at the gold marker is the one you are in')]

def p_un():
    base = rbox(32, 22, 1.4, 2)
    tower = box(13, 8, 44.1, 5, 4, 1.3) - U(*[box(14, 1, .6, 5, 0, z) for z in range(6, 44, 4)])
    edge = U(box(1.6, 8.6, 44.7, -1.5, 4, 1.3), box(1.6, 8.6, 44.7, 11.5, 4, 1.3))
    hall = U(box(15, 12, 6.1, -8, 3, 1.3), ball(7, -8, 3, 7.3, sz=.7).trim_by_plane([0, 0, 1], 7.3))
    poles = U(*[cyl(.95, 10.1, -13 + i * 5.2, -8.2, 1.3, seg=12) for i in range(6)])
    flags = [(c, prism([(0, 0), (3.3, 3.3), (0, 3.3)], 1).rotate([90, 0, 0]).translate([-13 + i * 5.2 + .6, -7.7, 8.1])) for i, c in enumerate(('red', 'blue', 'green', 'yellow', 'plum', 'teal'))]
    return [Part('place_un', [('stone', U(base, hall)), ('glass', tower), ('white', edge), ('grey', poles)] + flags + [peg('stone')], note='the UN: the tower, the assembly hall and a row of flags')]

def p_medal():
    base = rbox(36, 13, 1.4, 2)
    line = U(*[box(2, 2, .4, -9 + i * 2 + (j % 2) * 2, -3 + j * 2, 1.39) for i in range(0, 10, 2) for j in range(4)])
    posts = U(cyl(2.3, 24.1, -14, 0, 1.3), cyl(2.3, 24.1, 14, 0, 1.3))
    beam = rbox(34, 5.4, 6.4, 1.6, 0, 0, 23)
    banner = box(22, .8, 3.6, 0, -2.9, 24.4)
    hook = hull(ball(1, 0, -2.6, 23.4, seg=12), ball(1, 0, -5.4, 24.6, seg=12))
    cones = U(*[U(box(4.4, 4.4, .9, x, -3.4, 1.3), cyl(1.9, 4.9, x, -3.4, 2.1, r2=.6, seg=16)) for x in (-9.5, 9.5)])
    medal = U(cyl(5.6, 1.6, seg=40), box(4.6, 5, 1.6, 0, 6.4)) - cyl(1.5, 4, 0, 7.2, -1, seg=20)
    medal_art = star(5, 3.6, 1.5, .5, 0, 0, 1.6, math.pi / 2)
    return [Part('place_medal', [('grey', base), ('white', line), ('lime', U(posts, beam, hook)), ('rust', banner), ('orange', cones), peg('grey')], note='the 5K finish arch; the medal hangs on the hook'),
            Part('place_medal_medal', [('gold', medal), ('rust', medal_art)], group='mover', note='the medal: hangs on the hook under the arch. Print flat, star up')]

def p_city():
    base = rbox(38, 15, 2, 2)
    rail = U(box(32, 2.4, 1.9, 0, -1.5, 1.9), box(2.4, 5, 3.5, -17, -1.5, 1.9), box(2.4, 5, 3.5, 17, -1.5, 1.9))
    pole = cyl(1.2, 19.1, 14, 5, 1.9, seg=14)
    sign = [(c, cyl(2.4, 1.8, seg=20).rotate([90, 0, 0]).translate([14, 5.9, z])) for z, c in ((20.4, 'red'), (15.4, 'yellow'), (10.4, 'blue'))]
    car = rbox(21, 9.4, 9.6, 2.2) - box(22, 2.4 + 2 * PLAY, 2.2, 0, 0, -.01)
    car = car - U(*[window(3.4, 3, -7.2 + i * 4.8, s * 4.7, 4.9, .5) for i in range(4) for s in (-1, 1)])
    band = rbox(21.4, 9.8, 1.2, 2.4, 0, 0, 2.4) - rbox(20.6, 9, 3, 2, 0, 0, 2)
    return [Part('place_city', [('black', U(base, pole)), ('grey', rail)] + sign + [peg('black')], note='the subway: the car rides on the rail between the two stops'),
            Part('place_city_car', [('silver', car), ('red', band)], group='mover', note='the subway car: sits over the rail and slides along it')]

def p_table():
    house = box(26, 13, 14, 0, 7, 0) - U(window(9, 6, -5.5, .5, 3.2), box(6, 1.4, 9, 7, .5, 0))
    roof = box(28, 15, 1.6, 0, 7, 14)
    awn, alt = stripes_awning(6, 4.4, -13.2, .5, 9.4)
    table = cyl(6.6, 6.6, 0, -9.5, 0, seg=40)
    plate = cyl(4.3, .6, 0, -9.5, 6.59, seg=32); food = ball(2.5, 0, -9.5, 7.1, sz=.6, seg=20).trim_by_plane([0, 0, 1], 7.1)
    stools = U(cyl(2.7, 4, -10.5, -9.5, 0, seg=24), cyl(2.7, 4, 10.5, -9.5, 0, seg=24))
    floor = rbox(30, 30, 1, 3, 0, -1.5, 0)
    cloche = ball(5.6, 0, 0, 0, seg=40).trim_by_plane([0, 0, 1], 0) - ball(4.5, 0, 0, 0, seg=40)
    cloche = U(cloche, cyl(6.1, .9, seg=40) - cyl(4.5, 3, 0, 0, -1, seg=40), cyl(1.1, 1.6, 0, 0, 5.4, seg=16), ball(1.5, 0, 0, 7.6, seg=16))
    return [Part('place_table', [('cream', U(house, awn)), ('red', alt), ('roof', roof), ('white', U(table, plate)), ('yellow', food), ('wood', stools), ('stone', floor), peg()], note='Table for two: the dish waits on the table'),
            Part('place_table_cloche', [('silver', cloche)], group='mover', note='the cloche: sits over the dish; lift it by the knob')]

def p_dumplings():
    house = box(28, 13, 12, 0, 7.5, 0) - U(window(9, 5.5, -6, .9, 4), box(6.5, 1.4, 9.5, 7, .9, 0))
    roof = hull(box(28, 13, .2, 0, 7.5, 9.4), box(33, 18, .4, 0, 7.5, 12), box(17, 5, .4, 0, 7.5, 18))
    ridge = box(18, 2, 1.4, 0, 7.5, 18)
    sign = box(13, .9, 3.2, 0, .75, 12.4)
    lant = U(*[ball(1.9, x, -1.6, 6.4, sz=1.15, seg=16) for x in (-13, 13)])
    posts = U(*[cyl(.9, 5, x, -1.6, 0, seg=12) for x in (-13, 13)])
    floor = rbox(32, 31, 1, 3, 0, -1.5, 0)
    basket = cyl(8.4, 6.5, 0, -9.5, 0, seg=48) - cyl(7, 4.2, 0, -9.5, 2.5, seg=48)
    bands = U(*[cyl(8.75, 1, 0, -9.5, z, seg=48) - cyl(7, 3, 0, -9.5, z - 1, seg=48) for z in (.6, 4.9)])
    dump = U(*[ball(1.5, sx * (1.6 + (i % 2) * 2.6), -9.5 + (i - 2) * 2.5, 2.5, sy=.8, seg=14) for sx in (-1, 1) for i in range(5)])
    divider = box(.8, 13.6, 1.2, 0, -9.5, 2.5)
    lid = U(hull(cyl(6.6, .2, seg=48), cyl(8.6, .2, 0, 0, 1.9, seg=48)), cyl(8.6, 1, 0, 0, 2.1, seg=48), cyl(8.6, 1.4, 0, 0, 3.1, r2=5, seg=48), cyl(1.6, 1.6, 0, 0, 4.4, seg=16), ball(2, 0, 0, 6.8, seg=16))
    return [Part('place_dumplings', [('red', house), ('roof', U(roof, ridge, posts)), ('cream', sign), ('darkred', lant), ('bamboo', basket), ('wood', U(bands, divider)), ('white', dump), ('stone', floor), peg('red')], note='Spicy Village: ten dumplings in the steamer, five a side'),
            Part('place_dumplings_lid', [('bamboo', lid)], group='mover', note='the steamer lid: lift it to find the dumplings')]

def p_bar():
    house = box(26, 18, 16) - U(window(10, 6, -5.5, -9, 4), box(6, 1.4, 10.5, 7.5, -9, 0))
    roof = box(28, 20, 1.6, 0, 0, 16)
    awn = awning(26, 0, -9, 11, 3.4, 5.6)
    axle = U(cyl(4.4, 1.2, 0, 0, 17.6, seg=32), cyl(2, 11.5, 0, 0, 18.8, seg=24))
    tri = [(math.cos(a) * 8.4, math.sin(a) * 8.4) for a in (math.radians(-90), math.radians(30), math.radians(150))]
    drum = CS([ccw(tri)]).offset(1.4, circular_segments=16).extrude(10) - cyl(2 + PLAY, 14, 0, 0, -1, seg=24)
    def on_face(m, k):   # stand a flat picture up on side k of the drum
        return m.rotate([90, 0, 0]).translate([0, -5.55, 5]).rotate([0, 0, k * 120 + 180])
    tumbler = prism([(-2.1, -2.4), (2.1, -2.4), (2.6, 2.4), (-2.6, 2.4)], .6)
    spritz = U(cyl(2.7, .6, 0, 1.4, seg=24), box(.8, 3, .6, 0, -1.5), box(3.4, .8, .6, 0, -3.3))
    wine = U(prism([(-2, 3.4), (2, 3.4), (1.3, .4), (-1.3, .4)], .6), cyl(1.4, .6, 0, .7, seg=20), box(.8, 3, .6, 0, -1.6), box(3.2, .8, .6, 0, -3.3))
    icons = U(on_face(tumbler, 0), on_face(spritz, 1), on_face(wine, 2))
    return [Part('place_bar', [('dkgreen', house), ('roof', roof), ('red', awn), ('gold', axle), peg('dkgreen')], note='the bar; the sign turns on the post on the roof'),
            Part('place_bar_sign', [('cream', drum), ('rust', icons)], group='mover', note='three-sided sign: mezcal glass, spritz, wine. Drops over the post and spins')]

def palm(x, y, z, h=15, lean=3, cr=6.2):
    trunk = hull(cyl(1.7, .2, x, y, z, seg=14), cyl(1.3, .2, x + lean, y, z + h, seg=14))
    top = U(hull(cyl(1.3, .2, x + lean, y, z + h, seg=20), cyl(cr, .2, x + lean, y, z + h + cr - 1.2, seg=20)), ball(cr, x + lean, y, z + h + cr - 1.1, sz=.45, seg=24).trim_by_plane([0, 0, 1], z + h + cr - 1.1))
    cuts = U(*[box(1.5, 9, 12).translate([0, cr, 0]).rotate([0, 0, i * 60 + 30]).translate([x + lean, y, z + h + 1.2]) for i in range(6)])
    return trunk, top - cuts

def p_bahamas():
    base = rbox(32, 26, 1.2, 4)
    house = box(15, 12, 10.1, -6, 5, 1.1) - U(window(4, 4, -9.5, -1, 5.5), box(4.4, 1.4, 7.5, -3.6, -1, 1.2))
    roof = box(17, 14, 1.4, -6, 5, 11.2)
    trunk, fronds = palm(9, 6, 1.1, 15, 3)
    umb = U(cyl(.95, 6.5, 6, -7, 1.1, seg=12), hull(cyl(1, .2, 6, -7, 7.4, seg=24), cyl(6, .2, 6, -7, 12.2, seg=24)), cyl(6, 2.7, 6, -7, 12.3, r2=.6, seg=24))
    towel = box(8, 3.4, .6, -6.5, -8, 1.19); water = rbox(12, 5, .5, 2, 9.5, -9.6, 1.19)
    return [Part('place_bahamas', [('sand', base), ('white', house), ('teal', U(roof, towel)), ('wood', trunk), ('green', fronds), ('yellow', umb), ('sea', water), peg('sand')], note='the Bahamas: the beach house, the palm and the umbrella')]

def p_mexico():
    steps = U(*[box(30 - i * 2, 20 - i * 2.2, 1.6, 0, i * 1.1, i * 1.6) for i in range(3)])
    hall = box(22, 10, 13, 0, 4.4, 4.8) - box(6, 1.6, 9, 0, -.6, 4.8)
    cols = U(*[cyl(1.3, 12, x, -3, 4.8, seg=16) for x in (-9, -4.6, 4.6, 9)])
    entab = box(25, 14.4, 1.6, 0, 2.6, 16.8)
    ped = gable(25, 14.4, 5.4, 0, 2.6, 18.4)
    sunstone = face_front(U(cyl(1.9, .8, seg=20), *[box(.6, 1.2, .8).translate([0, 2.3, 0]).rotate([0, 0, i * 45]) for i in range(8)]), -4.6 + .2, 20.3)
    door = box(5.6, .6, 8.6, 0, .2, 4.8)
    trunk, fronds = palm(-13.5, -8, 0, 9, -3, 5)
    cactus = U(cyl(1.5, 6, 12.4, -7, 0, seg=14), ball(1.5, 12.4, -7, 6, seg=14), hull(ball(1, 12.4, -7, 3, seg=10), ball(1, 14.6, -7, 4.6, seg=10)), cyl(1, 2, 14.6, -7, 4.6, seg=10))
    return [Part('place_mexico', [('stone', U(steps, hall, cols, entab, ped)), ('gold', sunstone), ('red', door), ('wood', trunk), ('green', U(fronds, cactus)), peg('stone')], note='Mexico: the museum, with the sun stone over the door')]


PLACE_BUILDERS = {'frontdoor': p_frontdoor, 'kitchen': p_kitchen, 'chai': p_chai, 'booth': p_booth, 'tarot': p_tarot, 'road': p_road, 'rooftop': p_rooftop, 'garden': p_garden,
                  'un': p_un, 'medal': p_medal, 'city': p_city, 'table': p_table, 'dumplings': p_dumplings, 'bar': p_bar, 'bahamas': p_bahamas, 'mexico': p_mexico}

# where each loose piece sits on its place when the game is set up: (dx, dy, dz, then rotation about X, Y, Z in degrees)
MOUNT = {
    'place_frontdoor_door': ('frontdoor', (0, -6.3, 8, 0, 0, 0)), 'place_booth_strip': ('booth', (3.6, -7, 8.3, 0, 0, 0)),
    'place_tarot_card_sun': ('tarot', (-10.4, -15.5, 7.8, 90, 0, 0)), 'place_tarot_card_star': ('tarot', (0, -15.5, 7.8, 90, 0, 0)), 'place_tarot_card_mag': ('tarot', (10.4, -15.5, 7.8, 90, 0, 0)),
    'place_rooftop_wheel': ('rooftop', (0, 12, 26.5, 90, 0, 0)), 'pin': ('rooftop', (0, 13.4, 26.5, 90, 0, 0)), 'place_garden_ring': ('garden', (0, 0, 1.65, 0, 0, 0)),
    'place_medal_medal': ('medal', (0, -3.4, 17, 90, 0, 0)), 'place_city_car': ('city', (-5, -1.5, 2.03, 0, 0, 0)), 'place_table_cloche': ('table', (0, -9.5, 6.62, 0, 0, 0)),
    'place_dumplings_lid': ('dumplings', (0, -9.5, 6.12, 0, 0, 0)), 'place_bar_sign': ('bar', (0, 0, 18.85, 0, 0, 25)),
}
