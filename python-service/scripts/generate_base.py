"""
generate_base.py - Generates a 3D-printable base with engraved text via OpenSCAD.

Requires OpenSCAD: apt install openscad

Usage:
    python3 generate_base.py \
        --radius 3.0 \
        --height 1.2 \
        --artist "Nada Surf" \
        --title "Always Love" \
        --output /path/to/base.stl
"""

import argparse
import os
import subprocess
import sys


def parse_args():
    parser = argparse.ArgumentParser(description="Generate engraved base STL via OpenSCAD")
    parser.add_argument("--radius", type=float, required=True, help="Base radius (scene units)")
    parser.add_argument("--height", type=float, required=True, help="Base height (scene units)")
    parser.add_argument("--artist", default="", help="Artist name to engrave")
    parser.add_argument("--title",  default="", help="Song title to engrave")
    parser.add_argument("--output", required=True, help="Output STL path")
    return parser.parse_args()


def compute_text_size(radius, artist, title):
    usable_width = radius * 2 * 0.8
    # Average char width ~0.6x text height for Liberation Sans
    max_chars = max(len(artist.strip()), len(title.strip()), 1)
    size = usable_width / (max_chars * 0.6)
    size = min(size, radius * 0.4)
    size = max(size, 0.3)
    return round(size, 3)


def escape_scad(text):
    return text.replace("\\", "\\\\").replace('"', '\\"')


def build_scad(radius, height, artist, title, text_size):
    has_artist = bool(artist.strip())
    has_title  = bool(title.strip())
    engraving_depth = round(min(0.4, height * 0.35), 3)

    lines = [
        f"$fn = 64;",
        f"",
        f"difference() {{",
        f"    cylinder(r={radius}, h={height}, center=false);",
    ]

    if has_artist and has_title:
        y_up   = round( text_size * 0.6, 3)
        y_down = round(-text_size * 0.6, 3)
        lines += [
            f'    translate([0, {y_up}, {height} - {engraving_depth}])',
            f'    linear_extrude(height={engraving_depth} + 0.1)',
            f'    text("{escape_scad(artist)}", size={text_size}, halign="center", valign="center", font="Liberation Sans");',
            f'    translate([0, {y_down}, {height} - {engraving_depth}])',
            f'    linear_extrude(height={engraving_depth} + 0.1)',
            f'    text("{escape_scad(title)}", size={text_size}, halign="center", valign="center", font="Liberation Sans");',
        ]
    elif has_artist:
        lines += [
            f'    translate([0, 0, {height} - {engraving_depth}])',
            f'    linear_extrude(height={engraving_depth} + 0.1)',
            f'    text("{escape_scad(artist)}", size={text_size}, halign="center", valign="center", font="Liberation Sans");',
        ]
    elif has_title:
        lines += [
            f'    translate([0, 0, {height} - {engraving_depth}])',
            f'    linear_extrude(height={engraving_depth} + 0.1)',
            f'    text("{escape_scad(title)}", size={text_size}, halign="center", valign="center", font="Liberation Sans");',
        ]

    lines.append("}")
    return "\n".join(lines)


def main():
    args = parse_args()

    has_artist = bool(args.artist.strip())
    has_title  = bool(args.title.strip())

    if not has_artist and not has_title:
        print("No text provided, nothing to engrave.", file=sys.stderr)
        sys.exit(1)

    text_size    = compute_text_size(args.radius, args.artist, args.title)
    scad_content = build_scad(args.radius, args.height, args.artist, args.title, text_size)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)

    scad_path = args.output.replace(".stl", ".scad")

    try:
        with open(scad_path, "w", encoding="utf-8") as f:
            f.write(scad_content)

        result = subprocess.run(
            ["openscad", "-o", args.output, scad_path],
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode != 0:
            print(f"OpenSCAD error:\n{result.stderr}", file=sys.stderr)
            sys.exit(1)

        print(f"Base STL generated: {args.output}")

    finally:
        if os.path.exists(scad_path):
            os.remove(scad_path)


if __name__ == "__main__":
    main()
