"""
render_stl.py — Blender headless script for photoréalistic STL rendering.

Usage (called by Node.js):
    blender --background --python render_stl.py -- \
        --input /path/to/model.stl \
        --output /path/to/render.png \
        --material plastic_white

This script:
  1. Imports the STL file into an empty Blender scene.
  2. Centers and auto-scales the model.
  3. Applies a PBR material based on the --material argument.
  4. Sets up a 3-point lighting rig + HDRI environment.
  5. Configures the Cycles renderer for a clean product shot.
  6. Renders to the specified output path.

Requirements:
  - Blender >= 3.6 (installed system-wide or as bpy module)
  - GPU rendering is used if available, otherwise CPU fallback.
"""

import bpy
import sys
import argparse
import math
import os
import mathutils

# ---------------------------------------------------------------------------
# Argument parsing (everything after "--" in blender CLI)
# ---------------------------------------------------------------------------

def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    parser = argparse.ArgumentParser(description="Render an STL with Blender")
    parser.add_argument("--input", required=True, help="Path to input .stl file")
    parser.add_argument("--output", required=True, help="Path to output .png file")
    parser.add_argument("--material", default="plastic_white", help="Material preset name")
    parser.add_argument("--color", default=None, help="Override waveform base color (hex, e.g. #40E0D0)")
    parser.add_argument("--color2", default=None, help="Override cylinder color (hex, e.g. #FFFFFF)")
    parser.add_argument("--input2", default=None, help="Path to second .stl file (cylinder/base)")
    parser.add_argument("--resolution", type=int, default=1024, help="Render resolution (square)")
    parser.add_argument("--samples", type=int, default=64, help="Cycles render samples")
    return parser.parse_args(argv)

# ---------------------------------------------------------------------------
# Material presets
# ---------------------------------------------------------------------------

def hex_to_linear(hex_color):
    """Convertit un hex CSS (#RRGGBB) en RGBA lineaire pour Blender."""
    h = hex_color.lstrip('#')
    srgb = [int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (linear[0], linear[1], linear[2], 1.0)


MATERIAL_PRESETS = {
    "plastic_white": {
        "base_color": (0.9, 0.9, 0.9, 1.0),
        "metallic": 0.0,
        "roughness": 0.35,
        "specular": 0.5,
    },
    "plastic_black": {
        "base_color": (0.02, 0.02, 0.02, 1.0),
        "metallic": 0.0,
        "roughness": 0.3,
        "specular": 0.6,
    },
    "metal_silver": {
        "base_color": (0.8, 0.8, 0.82, 1.0),
        "metallic": 1.0,
        "roughness": 0.2,
        "specular": 0.9,
    },
    "metal_gold": {
        "base_color": (0.83, 0.69, 0.22, 1.0),
        "metallic": 1.0,
        "roughness": 0.25,
        "specular": 0.9,
    },
    "wood": {
        "base_color": (0.55, 0.35, 0.17, 1.0),
        "metallic": 0.0,
        "roughness": 0.7,
        "specular": 0.3,
    },
}

# ---------------------------------------------------------------------------
# Scene setup helpers
# ---------------------------------------------------------------------------

def clear_scene():
    """Remove all default objects."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    # Remove orphan data
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)


def import_stl(filepath):
    """Import an STL file and return the imported object."""
    bpy.ops.wm.stl_import(filepath=filepath)
    obj = bpy.context.selected_objects[0]
    return obj


def fix_orientation(obj):
    """Corrige l'axe : Three.js exporte Y-up, Blender attend Z-up."""
    import math
    bpy.context.view_layer.objects.active = obj
    obj.rotation_euler[0] = math.radians(90)
    bpy.ops.object.transform_apply(rotation=True)


def center_and_scale_group(objects, target_size=2.0):
    """Centre et scale un groupe d'objets ensemble (bounding box combinée)."""
    min_co = [float('inf')] * 3
    max_co = [float('-inf')] * 3
    for obj in objects:
        mw = obj.matrix_world
        for corner in obj.bound_box:
            wc = mw @ mathutils.Vector(corner)
            for i in range(3):
                min_co[i] = min(min_co[i], wc[i])
                max_co[i] = max(max_co[i], wc[i])

    center = mathutils.Vector([(min_co[i] + max_co[i]) / 2 for i in range(3)])
    max_dim = max(max_co[i] - min_co[i] for i in range(3))
    scale_factor = target_size / max_dim if max_dim > 0 else 1.0

    for obj in objects:
        bpy.context.view_layer.objects.active = obj
        obj.location -= center
        bpy.ops.object.transform_apply(location=True)
        obj.scale = (scale_factor, scale_factor, scale_factor)
        bpy.ops.object.transform_apply(scale=True)


def center_and_scale(obj, target_size=2.0):
    """Center origin, place at origin, scale to fit within target_size."""
    center_and_scale_group([obj], target_size)


def smooth_sculpt(obj):
    """Applique le smooth shading + subdivision niveau 1 pour lisser le maillage STL."""
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    mod = obj.modifiers.new(name="Subdivision", type='SUBSURF')
    mod.levels = 1
    mod.render_levels = 2


def apply_material(obj, preset_name, color_override=None):
    """Create and assign a Principled BSDF material."""
    preset = MATERIAL_PRESETS.get(preset_name, MATERIAL_PRESETS["plastic_white"])

    mat = bpy.data.materials.new(name=f"Echoras_{preset_name}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")

    base_color = hex_to_linear(color_override) if color_override else preset["base_color"]
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Metallic"].default_value = preset["metallic"]
    bsdf.inputs["Roughness"].default_value = preset["roughness"]
    # Blender 4.0+ renomme "Specular" en "Specular IOR Level"
    specular_key = "Specular IOR Level" if "Specular IOR Level" in bsdf.inputs else "Specular"
    bsdf.inputs[specular_key].default_value = preset["specular"]

    # Auto smooth : API supprimée en Blender 4.1+
    if hasattr(obj.data, "use_auto_smooth"):
        obj.data.use_auto_smooth = True
        obj.data.auto_smooth_angle = math.radians(30)

    obj.data.materials.clear()
    obj.data.materials.append(mat)


def setup_lighting():
    """Create a 3-point lighting rig."""
    # Key light
    bpy.ops.object.light_add(type="AREA", location=(4, -4, 5))
    key = bpy.context.object
    key.name = "KeyLight"
    key.data.energy = 300
    key.data.size = 3
    key.data.color = (1.0, 0.97, 0.94)

    # Fill light
    bpy.ops.object.light_add(type="AREA", location=(-4, -1, 3))
    fill = bpy.context.object
    fill.name = "FillLight"
    fill.data.energy = 120
    fill.data.size = 4
    fill.data.color = (0.88, 0.92, 1.0)

    # Rim / back light
    bpy.ops.object.light_add(type="AREA", location=(0, 5, 4))
    rim = bpy.context.object
    rim.name = "RimLight"
    rim.data.energy = 180
    rim.data.size = 2
    rim.data.color = (0.75, 0.85, 1.0)

    # Point all lights at origin
    for light in [key, fill, rim]:
        constraint = light.constraints.new(type="TRACK_TO")
        constraint.target = bpy.data.objects.new("_target", None)
        bpy.context.collection.objects.link(constraint.target)
        constraint.track_axis = "TRACK_NEGATIVE_Z"
        constraint.up_axis = "UP_Y"


def setup_camera(resolution):
    """Position the camera for a 3/4 product shot."""
    bpy.ops.object.camera_add(location=(4, -4, 2.8))
    cam = bpy.context.object
    cam.name = "RenderCam"
    cam.data.lens = 85  # focale longue : moins de distorsion perspective

    # Point slightly above origin for better composition
    target_empty = bpy.data.objects.new("CamTarget", None)
    target_empty.location = (0, 0, 0.2)
    bpy.context.collection.objects.link(target_empty)
    constraint = cam.constraints.new(type="TRACK_TO")
    constraint.target = target_empty
    constraint.track_axis = "TRACK_NEGATIVE_Z"
    constraint.up_axis = "UP_Y"

    bpy.context.scene.camera = cam

    scene = bpy.context.scene
    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    scene.render.film_transparent = False  # fond opaque pour rendu produit propre


def setup_world():
    """Fond studio dégradé, pas de coin dur."""
    world = bpy.data.worlds.get("World")
    if world is None:
        world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nodes = nt.nodes
    links = nt.links

    # Vider les nodes existants
    nodes.clear()

    # Fond : dégradé vertical via TextureCoordinate + Gradient
    out_node = nodes.new('ShaderNodeOutputWorld')
    out_node.location = (400, 0)

    bg_node = nodes.new('ShaderNodeBackground')
    bg_node.location = (200, 0)
    bg_node.inputs['Strength'].default_value = 0.0  # lumière monde désactivée (éclairage par lampes)
    bg_node.inputs['Color'].default_value = (0.08, 0.08, 0.10, 1.0)

    links.new(bg_node.outputs['Background'], out_node.inputs['Surface'])


def configure_renderer(samples):
    """Set up Cycles for a quick, clean render."""
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"

    # Try GPU, fall back to CPU
    prefs = bpy.context.preferences.addons.get("cycles")
    if prefs:
        cprefs = prefs.preferences
        cprefs.compute_device_type = "CUDA"
        cprefs.get_devices()
        for device in cprefs.devices:
            device.use = True
        scene.cycles.device = "GPU"

    scene.cycles.samples = samples
    scene.cycles.use_denoising = False  # désactivé : OIDN absent sur ce serveur
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = parse_args()

    if not os.path.isfile(args.input):
        print(f"ERROR: Input file not found: {args.input}")
        sys.exit(1)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)

    clear_scene()

    obj1 = import_stl(args.input)
    fix_orientation(obj1)

    objects = [obj1]

    if args.input2 and os.path.isfile(args.input2):
        obj2 = import_stl(args.input2)
        fix_orientation(obj2)
        objects.append(obj2)

    center_and_scale_group(objects)

    for obj in objects:
        smooth_sculpt(obj)

    apply_material(obj1, args.material, color_override=args.color)
    if len(objects) > 1:
        apply_material(objects[1], args.material, color_override=args.color2)

    # Sol studio avec un cyclorama (plan incurvé simulé par deux plans raccordés)
    backdrop_mat = bpy.data.materials.new(name="BackdropMat")
    backdrop_mat.use_nodes = True
    bd_bsdf = backdrop_mat.node_tree.nodes.get("Principled BSDF")
    bd_bsdf.inputs["Base Color"].default_value = (0.07, 0.07, 0.09, 1.0)
    bd_bsdf.inputs["Roughness"].default_value = 1.0
    bd_bsdf.inputs["Metallic"].default_value = 0.0

    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -1.05))
    floor = bpy.context.object
    floor.name = "Floor"
    floor.data.materials.append(backdrop_mat)

    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 20, 9))
    wall = bpy.context.object
    wall.name = "BackWall"
    wall.rotation_euler[0] = math.radians(90)
    wall.data.materials.append(backdrop_mat)

    setup_lighting()
    setup_camera(args.resolution)
    setup_world()
    configure_renderer(args.samples)

    # Render
    bpy.context.scene.render.filepath = os.path.abspath(args.output)
    bpy.ops.render.render(write_still=True)

    print(f"Render complete: {args.output}")


if __name__ == "__main__":
    main()
