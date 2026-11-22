"""Builds the whole kit: STL files for printing, a Blender file with the game set up and the parts laid out, and preview pictures.
Run with a Python that has Blender's `bpy`, `manifold3d` and `numpy`:   python build.py [--no-render]"""
import math, os, struct, sys
import numpy as np
import bpy
from mathutils import Matrix, Euler, Vector
import parts as P

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_STL, OUT_PIC = os.path.join(HERE, 'stl'), os.path.join(HERE, 'previews')
os.makedirs(OUT_STL, exist_ok=True); os.makedirs(OUT_PIC, exist_ok=True)

def mesh_of(m):
    me = m.to_mesh(); return np.asarray(me.vert_properties)[:, :3].astype(np.float64), np.asarray(me.tri_verts).astype(np.int64)

def write_stl(path, v, f):
    tri = v[f]; n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]); ln = np.linalg.norm(n, axis=1); n = n / np.where(ln == 0, 1, ln)[:, None]
    rec = np.zeros(len(f), dtype=[('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')]); rec['n'] = n; rec['v'] = tri
    with open(path, 'wb') as fh: fh.write(b'A map of us'.ljust(80, b' ')); fh.write(struct.pack('<I', len(f))); fh.write(rec.tobytes())

def laid(part):
    """The part as it goes on the printer: turned as needed, sitting on z = 0, centred."""
    m = part.solid().rotate(list(part.lay)); b = m.bounding_box()
    return m.translate([-(b[0] + b[3]) / 2, -(b[1] + b[4]) / 2, -b[2]])

# ------------------------------------------------------------------ geometry
shells, pos, tracks = P.board()
tiles = P.tiles(shells)
kit = tiles + [P.key(), P.figure('J'), P.figure('F'), P.boat(), P.pin()]
places = {}
for name, fn in P.PLACE_BUILDERS.items():
    made = fn(); places[name] = made[0]; kit += made
    if name == 'tarot': kit += [P.tarot_card(k) for k in ('sun', 'star', 'mag')]
by_name = {p.name: p for p in kit}
manifest = []
for p in kit:
    m = laid(p); assert str(m.status()).endswith('NoError') and len(m.decompose()) == 1, f'{p.name} is not one clean solid'
    v, f = mesh_of(m); write_stl(os.path.join(OUT_STL, p.name + '.stl'), v, f); b = m.bounding_box()
    manifest.append((p, b[3] - b[0], b[4] - b[1], b[5] - b[2], m.volume() / 1000))
print(f'{len(kit)} parts written to stl/')

# ------------------------------------------------------------------ Blender scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene; scene.name = 'The game, set up'
scene.unit_settings.system = 'METRIC'; scene.unit_settings.scale_length = .001; scene.unit_settings.length_unit = 'MILLIMETERS'
mats = {}
def mat(c):
    if c not in mats:
        m = bpy.data.materials.new(c); h = P.COL[c].lstrip('#'); rgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
        lin = [((x + .055) / 1.055) ** 2.4 if x > .04045 else x / 12.92 for x in rgb]; m.diffuse_color = (*lin, 1)
        m.use_nodes = True; bsdf = m.node_tree.nodes.get('Principled BSDF'); bsdf.inputs['Base Color'].default_value = (*lin, 1); bsdf.inputs['Roughness'].default_value = .55
        mats[c] = m
    return mats[c]

def add_object(name, shell_list, coll, matrix=None):
    vs, fs, mi, cols, off = [], [], [], [], 0
    for c, m in shell_list:
        if m.is_empty(): continue
        v, f = mesh_of(m)
        if c not in cols: cols.append(c)
        vs.append(v); fs.append(f + off); mi.append(np.full(len(f), cols.index(c))); off += len(v)
    me = bpy.data.meshes.new(name); me.from_pydata(np.vstack(vs).tolist(), [], np.vstack(fs).tolist())
    for c in cols: me.materials.append(mat(c))
    me.polygons.foreach_set('material_index', np.concatenate(mi).astype(np.int32)); me.update()
    ob = bpy.data.objects.new(name, me); coll.objects.link(ob)
    if matrix is not None: ob.matrix_world = matrix
    return ob

def coll(name, parent=None):
    c = bpy.data.collections.new(name); (parent or scene.collection).children.link(c); return c

def xform(x, y, z, rx=0, ry=0, rz=0):
    return Matrix.Translation((x, y, z)) @ Euler((math.radians(rx), math.radians(ry), math.radians(rz)), 'XYZ').to_matrix().to_4x4()

c_board, c_places, c_movers = coll('Board'), coll('Places'), coll('Moving pieces')
for t in tiles: add_object(t.name, t.shells, c_board)
for name, part in places.items():
    add_object(part.name, part.shells, c_places, xform(pos[name][0], pos[name][1], P.TOP))
for mover, (place, (dx, dy, dz, rx, ry, rz)) in P.MOUNT.items():
    add_object(mover, by_name[mover].shells, c_movers, xform(pos[place][0] + dx, pos[place][1] + dy, P.TOP + dz, rx, ry, rz))
gp = pos['garden']
add_object('figure_jana', by_name['figure_jana'].shells, c_movers, xform(gp[0] - 12, gp[1] - 38, P.TOP, 0, 0, 14))
add_object('figure_friend', by_name['figure_friend'].shells, c_movers, xform(gp[0] + 9, gp[1] - 40, P.TOP, 0, 0, -12))
tr = tracks[0]; k = len(tr) // 2; ang = math.degrees(math.atan2(tr[k + 1][1] - tr[k - 1][1], tr[k + 1][0] - tr[k - 1][0]))
add_object('boat', by_name['boat'].shells, c_movers, xform(tr[k][0], tr[k][1], P.SEA_T, 0, 0, ang))

# a second scene with every part as it goes on the printer
parts_scene = bpy.data.scenes.new('Parts, ready to print')
parts_scene.unit_settings.system = 'METRIC'; parts_scene.unit_settings.scale_length = .001; parts_scene.unit_settings.length_unit = 'MILLIMETERS'
c_print = bpy.data.collections.new('Print these'); parts_scene.collection.children.link(c_print)
x = y = rowh = 0
for p in sorted(kit, key=lambda q: (q.group != 'board', q.group != 'place', q.name)):
    m = laid(p); b = m.bounding_box(); w, d = b[3] - b[0], b[4] - b[1]
    if x + w > 620: x, y, rowh = 0, y - rowh - 10, 0
    main = max(p.shells, key=lambda s: s[1].volume())[0]
    add_object('print_' + p.name, [(main, m)], c_print, xform(x + w / 2, y - d / 2, 0)); x += w + 10; rowh = max(rowh, d)

# ------------------------------------------------------------------ light, camera, pictures
world = bpy.data.worlds.new('sky'); world.use_nodes = True; world.node_tree.nodes['Background'].inputs[0].default_value = (.86, .9, 1, 1); world.node_tree.nodes['Background'].inputs[1].default_value = .55
scene.world = world; parts_scene.world = world
def sun(sc):
    L = bpy.data.lights.new('sun', 'SUN'); L.energy = 2.6; L.angle = math.radians(12); ob = bpy.data.objects.new('sun', L); ob.rotation_euler = (math.radians(48), 0, math.radians(-32)); sc.collection.objects.link(ob)
sun(scene); sun(parts_scene)
table = bpy.data.meshes.new('table'); table.from_pydata([(-900, -900, -.2), (1400, -900, -.2), (1400, 900, -.2), (-900, 900, -.2)], [], [(0, 1, 2, 3)]); P.COL['table'] = '#cbbda6'; table.materials.append(mat('table'))
scene.collection.objects.link(bpy.data.objects.new('table', table))

def camera(sc, name, eye, target, lens=50):
    cam = bpy.data.cameras.new(name); cam.lens = lens; cam.clip_start = 1; cam.clip_end = 5000; ob = bpy.data.objects.new(name, cam); sc.collection.objects.link(ob)
    ob.location = eye; ob.rotation_euler = (Vector(target) - Vector(eye)).to_track_quat('-Z', 'Y').to_euler(); return ob

VIEWS = [('board', (220, -330, 400), (220, 92, 0), 40), ('west', (60, -110, 130), (80, 110, 10), 45), ('middle', (200, -110, 130), (205, 110, 10), 45), ('east', (300, -110, 130), (300, 110, 10), 45), ('islands', (390, -120, 130), (368, 110, 8), 45),
         ('top', (220, 110, 640), (220, 110.01, 0), 50), ('back', (190, 420, 230), (200, 120, 5), 45), ('figures', (gp[0] - 22, gp[1] - 128, 60), (gp[0] - 2, gp[1] - 39, 21), 60),
         ('booth', (pos['booth'][0] + 40, pos['booth'][1] - 85, 60), (pos['booth'][0] - 14, pos['booth'][1] - 6, 16), 60), ('frontdoor', (pos['frontdoor'][0] - 10, pos['frontdoor'][1] - 100, 62), (pos['frontdoor'][0] + 22, pos['frontdoor'][1] - 4, 16), 60)]
cams = {n: camera(scene, 'view_' + n, e, t, l) for n, e, t, l in VIEWS}
scene.camera = cams['board']
if '--no-render' not in sys.argv:
    only = [a.split('=')[1].split(',') for a in sys.argv if a.startswith('--views=')]
    for sc in (scene, parts_scene):
        sc.render.engine = 'CYCLES'; sc.cycles.samples = 40; sc.cycles.use_denoising = True; sc.render.resolution_x, sc.render.resolution_y = 1600, 1000; sc.view_settings.view_transform = 'Standard'; sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 90
    for n, cam in cams.items():
        if only and n not in only[0]: continue
        scene.camera = cam; scene.render.filepath = os.path.join(OUT_PIC, n + '.jpg'); bpy.ops.render.render(write_still=True, scene=scene.name); print('rendered', n)
    scene.camera = cams['board']
    if not only or 'parts' in only[0]:
        pc = camera(parts_scene, 'view_parts', (310, -190, 900), (310, -189.99, 0), 50); pc.data.type = 'ORTHO'; pc.data.ortho_scale = 700; parts_scene.camera = pc
        bed = bpy.data.meshes.new('bed'); bed.from_pydata([(-200, -900, -.2), (900, -900, -.2), (900, 300, -.2), (-200, 300, -.2)], [], [(0, 1, 2, 3)]); bed.materials.append(mat('table')); parts_scene.collection.objects.link(bpy.data.objects.new('bed', bed))
        parts_scene.render.filepath = os.path.join(OUT_PIC, 'parts.jpg'); bpy.ops.render.render(write_still=True, scene=parts_scene.name); print('rendered parts')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'a-map-of-us.blend'))

# ------------------------------------------------------------------ the list of parts
with open(os.path.join(HERE, 'PARTS.md'), 'w') as fh:
    fh.write('# A map of us: parts to print\n\nSizes are as the part lies on the printer, in millimetres. Every file is in `stl/`.\n\n| File | Print | Size (mm) | Plastic (cm3) | What it is |\n|---|---|---|---|---|\n')
    for p, w, d, h, vol in manifest: fh.write(f'| {p.name}.stl | {p.qty} | {w:.0f} x {d:.0f} x {h:.0f} | {vol:.1f} | {p.note} |\n')
    fh.write(f'\nTotal plastic: about {sum(v * p.qty for p, _, _, _, v in manifest):.0f} cm3 before infill savings.\n')
print('saved a-map-of-us.blend and PARTS.md')
