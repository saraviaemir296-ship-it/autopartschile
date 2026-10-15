"""Grúas Saravia — logo 3D real en Blender (Cycles).
Uso: python scene.py <polys.json> <out_dir> <res%> <samples> [frame|all]"""
import bpy, json, math, sys
from mathutils import Vector

polys_path, out_dir, res, samples, which = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
P = json.load(open(polys_path))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
FPS, N = 24, 192
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 1, N

# ---------- materiales
def mat_paint(name, rgb, metallic, rough, coat=1.0, coat_rough=0.03):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = coat_rough
    return m
RED = mat_paint('rojo_cereza', (0.32, 0.0, 0.0015), 0.15, 0.35, coat=0.35, coat_rough=0.08)          # pintura de auto roja con laca
WHITE = mat_paint('blanco_perla', (0.62, 0.62, 0.64), 0.0, 0.28)          # blanco lacado
SIDE = mat_paint('aluminio', (0.6, 0.6, 0.62), 1.0, 0.18, coat=0.0)       # cantos metálicos pulidos
FLOOR = mat_paint('piso_negro', (0.001, 0.001, 0.001), 0.0, 0.55, coat=0.12, coat_rough=0.12)
WALL = mat_paint('pared', (0.0025, 0.002, 0.002), 0.0, 0.8, coat=0.0)

# ---------- logo extruido desde los contornos del logo original
GREY = mat_paint('grafito', (0.05, 0.05, 0.055), 0.6, 0.25, coat=0.6)
def W(p): return ((p[0] - 887) / 1774 * 4.0, -(p[1] - 443.5) / 1774 * 4.0)
def logo_obj(name, curves, mat, depth, bevel):
    """Curvas Bézier del logo vectorizado (potrace) → curva 3D extruida con bisel."""
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '2D'; cu.fill_mode = 'BOTH'
    cu.extrude = depth; cu.bevel_depth = bevel; cu.bevel_resolution = 3; cu.resolution_u = 10
    cu.offset = -bevel   # el bisel no engorda las letras: compensa hacia adentro
    for c in curves:
        pts = []   # [co, hl, hr]
        cur = W(c['start'])
        pts.append([cur, cur, cur])
        for sg in c['segs']:
            if sg[0] == 'C':
                c1, c2, e = W(sg[1]), W(sg[2]), W(sg[3])
                pts[-1][2] = c1
                pts.append([e, c2, e])
            else:
                k, e = W(sg[1]), W(sg[2])
                pts.append([k, k, k]); pts.append([e, e, e])
        # el último punto coincide con el inicio: se fusionan
        first, last = pts[0], pts.pop()
        first[1] = last[1]
        sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
        for bp, (co, hl, hr) in zip(sp.bezier_points, pts):
            bp.handle_left_type = bp.handle_right_type = 'FREE'
            bp.co = (*co, 0); bp.handle_left = (*hl, 0); bp.handle_right = (*hr, 0)
        sp.use_cyclic_u = True
    ob = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(ob)
    cu.materials.append(mat); cu.materials.append(SIDE)
    ob.rotation_euler = (math.radians(90), 0, 0)
    ob.location = (0, 0, 1.15)
    return ob
L = P['layers']
grey = logo_obj('logo_gris', L['grey'], GREY, 0.06, 0.004)
red = logo_obj('logo_rojo', L['red'], RED, 0.07, 0.005)
white = logo_obj('logo_blanco', L['white'], WHITE, 0.07, 0.005)
# los cantos (bevel) usan el aluminio: material index 1 en las caras laterales
for ob in (grey, red, white):
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    me = ob.data
    for p in me.polygons:
        n = p.normal
        p.material_index = 0 if abs(n.z) > 0.6 else 1
    ob.select_set(False)
# ---------- piso reflectante
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
bpy.context.object.data.materials.append(FLOOR)

# ---------- mundo casi negro
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.002, 0.002, 0.003, 1)

# ---------- luces de estudio
def area(name, loc, rot, size, energy, color=(1, 1, 1), shape='RECTANGLE', sy=None):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.color = color; l.shape = shape; l.size = size
    if sy: l.size_y = sy
    o = bpy.data.objects.new(name, l); bpy.context.collection.objects.link(o)
    o.location = loc; o.rotation_euler = [math.radians(a) for a in rot]
    return o
kl = area('key', (0, -3.5, 5.5), (35, 0, 0), 3.0, 700, sy=1.2)                     # luz principal suave desde arriba
ri = area('rim_izq', (-3.8, 2.4, 3.6), (0, 0, 0), 1.6, 260, (1, 0.05, 0.06))       # contraluz rojo
rd = area('rim_der', (3.8, 2.4, 3.6), (0, 0, 0), 1.6, 260, (1, 0.05, 0.06))
area('top_rojo', (0, 2, 6), (0, 0, 0), 4.0, 200, (1, 0.12, 0.1))
# softbox grande frontal (detrás de cámara): da el reflejo blanco en la laca
sb = area('softbox', (0, -9, 7.5), (50, 0, 0), 9.0, 1200, sy=3.0)
# softboxes frontales en ángulo: iluminan la cara del logo sin reflejarse directo en cámara
fl = area('front_izq', (-7, -7, 3.4), (0, 0, 0), 5.0, 1000, sy=3.0)
fr = area('front_der', (7, -7, 3.4), (0, 0, 0), 5.0, 1000, sy=3.0)
# el estudio parte en penumbra y las luces frontales se encienden en el revelado
# todas apuntan al centro del logo
aim = bpy.data.objects.new('aim', None); bpy.context.collection.objects.link(aim); aim.location = (0, 0, 1.15)
for L in (ri, rd, fl, fr):
    c = L.constraints.new('TRACK_TO'); c.target = aim; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
wr = area('halo_rojo', (0, 1.6, 0.25), (-60, 0, 0), 3.5, 30, (1, 0.03, 0.04))
for L, hi in ((kl, 700), (sb, 1200), (ri, 260), (rd, 260), (wr, 30)):
    L.data.energy = hi * 0.12; L.data.keyframe_insert('energy', frame=1)
    L.data.energy = hi * 0.12; L.data.keyframe_insert('energy', frame=70)
    L.data.energy = hi; L.data.keyframe_insert('energy', frame=132)
for L in (fl, fr):
    L.data.energy = 60; L.data.keyframe_insert('energy', frame=1)
    L.data.energy = 60; L.data.keyframe_insert('energy', frame=70)
    L.data.energy = 1000; L.data.keyframe_insert('energy', frame=132)
# tarjeta reflectora en degradé arriba-frente (franja suave en los bordes superiores)
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -4, 4.2), rotation=(math.radians(-60), 0, 0))
card = bpy.context.object; card.scale = (10, 2.5, 1)
em = bpy.data.materials.new('card'); em.use_nodes = True
nt = em.node_tree; nt.nodes.remove(nt.nodes['Principled BSDF'])
e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Strength'].default_value = 2.5
nt.links.new(e.outputs[0], nt.nodes['Material Output'].inputs[0]); card.data.materials.append(em)
card.visible_camera = False

# tira de luz que barre el logo (reflejos reales que viajan por la superficie)
strip = area('barrido', (-6, -2.2, 1.3), (90, 0, 0), 0.08, 1600, (1, 0.97, 0.92), sy=3.5)
strip.keyframe_insert('location', frame=1)
strip.location.x = 6; strip.keyframe_insert('location', frame=70)
strip.location.x = -6; strip.keyframe_insert('location', frame=128)
strip.location.x = 6; strip.keyframe_insert('location', frame=166)
strip.location.x = 6.01; strip.keyframe_insert('location', frame=176)
strip.location.x = -6; strip.keyframe_insert('location', frame=177)
strip.location.x = 6; strip.keyframe_insert('location', frame=192)

# ---------- cámara: macro deslizante → se aleja → plano final con push-in
cam_d = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cam_d); bpy.context.collection.objects.link(cam)
sc.camera = cam
cam_d.sensor_fit = 'VERTICAL'
cam_d.dof.use_dof = True
target = bpy.data.objects.new('target', None); bpy.context.collection.objects.link(target)
tc = cam.constraints.new('TRACK_TO'); tc.target = target; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
cam_d.dof.focus_object = target
def key(f, cpos, tpos, lens, fstop):
    cam.location = cpos; target.location = tpos; cam_d.lens = lens; cam_d.dof.aperture_fstop = fstop
    cam.keyframe_insert('location', frame=f); target.keyframe_insert('location', frame=f)
    cam_d.keyframe_insert('lens', frame=f); cam_d.dof.keyframe_insert('aperture_fstop', frame=f)
# la "A" roja de SARAVIA está cerca de x≈0.15, z≈1.15+(-0.27)
A = (0.12, 0, 0.88)
key(1,   (1.1, -0.95, 1.0), (0.39, -0.07, 0.77), 85, 5.6)     # macro muy cerca, rasante
key(60,  (-0.15, -0.85, 0.62), (0.3, -0.07, 0.8), 85, 5.6)       # se desliza por la superficie
key(128, (0.8, -10.5, 1.9), (0, 0, 1.15), 37, 4.0)          # se aleja: aparece el logo
key(150, (0, -11.5, 1.3), (0, 0, 1.15), 37, 8.0)           # plano frontal centrado
key(192, (0, -10.4, 1.24), (0, 0, 1.15), 37, 8.0)           # push-in final
for fc in list(cam.animation_data.action.fcurves) if cam.animation_data and hasattr(cam.animation_data.action, 'fcurves') else []:
    for k in fc.keyframe_points: k.interpolation = 'BEZIER'

# ---------- render
r = sc.render
r.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples
sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
sc.cycles.max_bounces = 4; sc.cycles.glossy_bounces = 3; sc.cycles.diffuse_bounces = 2; sc.cycles.transmission_bounces = 0; sc.cycles.volume_bounces = 0
sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.03
sc.render.use_persistent_data = True
r.resolution_x, r.resolution_y, r.resolution_percentage = 1080, 1920, res
sc.view_settings.view_transform = 'Khronos PBR Neutral'; sc.view_settings.look = 'None'; sc.view_settings.exposure = -0.4
r.film_transparent = False
r.use_motion_blur = True; r.motion_blur_shutter = 0.5
r.image_settings.file_format = 'PNG'
r.filepath = out_dir + '/f_'
if which == 'all' or which.startswith('range'):
    if which.startswith('range'):
        a, b = which[6:].split('-'); sc.frame_start, sc.frame_end = int(a), int(b)
    bpy.ops.render.render(animation=True)
else:
    for fr in which.split(','):
        sc.frame_set(int(fr)); r.filepath = f'{out_dir}/t_{fr}.png'
        bpy.ops.render.render(write_still=True)
