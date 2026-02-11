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
    parser.add_argument("--resolution", type=int, default=1024, help="Render resolution (square)")
    parser.add_argument("--samples", type=int, default=128, help="Cycles render samples")
    return parser.parse_args(argv)

# ---------------------------------------------------------------------------
# Material presets
# ---------------------------------------------------------------------------

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


def center_and_scale(obj, target_size=2.0):
    """Center origin, place at origin, scale to fit within target_size."""
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.origin_set(type="ORIGIN_CENTER_OF_VOLUME", center="MEDIAN")
    obj.location = (0, 0, 0)

    # Scale to fit
    dims = obj.dimensions
    max_dim = max(dims.x, dims.y, dims.z)
    if max_dim > 0:
        scale_factor = target_size / max_dim
        obj.scale = (scale_factor, scale_factor, scale_factor)
        bpy.ops.object.transform_apply(scale=True)


def apply_material(obj, preset_name):
    """Create and assign a Principled BSDF material."""
    preset = MATERIAL_PRESETS.get(preset_name, MATERIAL_PRESETS["plastic_white"])

    mat = bpy.data.materials.new(name=f"CoreSound_{preset_name}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")

    bsdf.inputs["Base Color"].default_value = preset["base_color"]
    bsdf.inputs["Metallic"].default_value = preset["metallic"]
    bsdf.inputs["Roughness"].default_value = preset["roughness"]
    bsdf.inputs["Specular IOR Level"].default_value = preset["specular"]

    # Auto smooth for nicer normals
    obj.data.use_auto_smooth = True
    obj.data.auto_smooth_angle = math.radians(30)

    obj.data.materials.clear()
    obj.data.materials.append(mat)


def setup_lighting():
    """Create a 3-point lighting rig."""
    # Key light
    bpy.ops.object.light_add(type="AREA", location=(3, -3, 4))
    key = bpy.context.object
    key.name = "KeyLight"
    key.data.energy = 200
    key.data.size = 2
    key.data.color = (1.0, 0.95, 0.9)

    # Fill light
    bpy.ops.object.light_add(type="AREA", location=(-3, -1, 2))
    fill = bpy.context.object
    fill.name = "FillLight"
    fill.data.energy = 80
    fill.data.size = 3
    fill.data.color = (0.85, 0.9, 1.0)

    # Rim / back light
    bpy.ops.object.light_add(type="AREA", location=(0, 4, 3))
    rim = bpy.context.object
    rim.name = "RimLight"
    rim.data.energy = 120
    rim.data.size = 1.5
    rim.data.color = (0.7, 0.8, 1.0)

    # Point all lights at origin
    for light in [key, fill, rim]:
        constraint = light.constraints.new(type="TRACK_TO")
        constraint.target = bpy.data.objects.new("_target", None)
        bpy.context.collection.objects.link(constraint.target)
        constraint.track_axis = "TRACK_NEGATIVE_Z"
        constraint.up_axis = "UP_Y"


def setup_camera(resolution):
    """Position the camera for a 3/4 product shot."""
    bpy.ops.object.camera_add(location=(3.5, -3.5, 2.5))
    cam = bpy.context.object
    cam.name = "RenderCam"

    # Point at origin
    constraint = cam.constraints.new(type="TRACK_TO")
    empty = bpy.data.objects.new("CamTarget", None)
    bpy.context.collection.objects.link(empty)
    constraint.target = empty
    constraint.track_axis = "TRACK_NEGATIVE_Z"
    constraint.up_axis = "UP_Y"

    bpy.context.scene.camera = cam

    # Render settings
    scene = bpy.context.scene
    scene.render.resolution_x = resolution
    scene.render.resolution_y = resolution
    scene.render.film_transparent = True  # transparent background


def setup_world():
    """Set world background to a soft gradient (no HDRI dependency)."""
    world = bpy.data.worlds.get("World")
    if world is None:
        world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.02, 0.02, 0.03, 1.0)
    bg.inputs["Strength"].default_value = 0.5


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
    scene.cycles.use_denoising = True
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

    obj = import_stl(args.input)
    center_and_scale(obj)
    apply_material(obj, args.material)

    # Add a ground plane for shadow catching
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -1.01))
    ground = bpy.context.object
    ground.name = "Ground"
    ground_mat = bpy.data.materials.new(name="GroundMat")
    ground_mat.use_nodes = True
    ground_bsdf = ground_mat.node_tree.nodes.get("Principled BSDF")
    ground_bsdf.inputs["Base Color"].default_value = (0.05, 0.05, 0.07, 1.0)
    ground_bsdf.inputs["Roughness"].default_value = 0.9
    ground.data.materials.append(ground_mat)

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
