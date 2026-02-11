"""
api.py — Flask HTTP API wrapping Blender rendering and Librosa analysis.

Endpoints:
    POST /render   { "stl_path": "...", "output_path": "...", "material": "..." }
    POST /analyze  { "audio_path": "...", "output_path": "..." }
    GET  /health
"""

import os
import subprocess
import json

from flask import Flask, request, jsonify

app = Flask(__name__)

BLENDER_PATH = os.environ.get("BLENDER_PATH", "/usr/bin/blender")
RENDER_SCRIPT = os.path.join(os.path.dirname(__file__), "render_stl.py")
ANALYZE_SCRIPT = os.path.join(os.path.dirname(__file__), "analyze_audio.py")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "renderer"})


@app.route("/render", methods=["POST"])
def render():
    data = request.get_json(force=True)
    stl_path = data.get("stl_path")
    output_path = data.get("output_path")
    material = data.get("material", "plastic_white")
    resolution = data.get("resolution", 1024)
    samples = data.get("samples", 128)

    if not stl_path or not output_path:
        return jsonify({"error": "stl_path and output_path are required"}), 400

    if not os.path.isfile(stl_path):
        return jsonify({"error": f"STL not found: {stl_path}"}), 404

    # Run Blender via xvfb-run for headless OpenGL support
    cmd = [
        "xvfb-run", "-a",
        "--server-args=-screen 0 1920x1080x24",
        BLENDER_PATH,
        "--background",
        "--python", RENDER_SCRIPT,
        "--",
        "--input", stl_path,
        "--output", output_path,
        "--material", material,
        "--resolution", str(resolution),
        "--samples", str(samples),
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=240,
        )

        if result.returncode != 0:
            return jsonify({
                "error": "Blender render failed",
                "stderr": result.stderr[-2000:],  # Truncate to avoid huge responses
            }), 500

        return jsonify({
            "success": True,
            "output": output_path,
            "log": result.stdout[-1000:],
        })

    except subprocess.TimeoutExpired:
        return jsonify({"error": "Render timed out (240s)"}), 504


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(force=True)
    audio_path = data.get("audio_path")
    output_path = data.get("output_path")

    if not audio_path or not output_path:
        return jsonify({"error": "audio_path and output_path are required"}), 400

    if not os.path.isfile(audio_path):
        return jsonify({"error": f"Audio file not found: {audio_path}"}), 404

    cmd = [
        "python3", ANALYZE_SCRIPT,
        "--input", audio_path,
        "--output", output_path,
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode != 0:
            return jsonify({
                "error": "Analysis failed",
                "stderr": result.stderr[-2000:],
            }), 500

        # Read and return the analysis JSON
        with open(output_path, "r") as f:
            analysis = json.load(f)

        return jsonify({"success": True, "analysis": analysis})

    except subprocess.TimeoutExpired:
        return jsonify({"error": "Analysis timed out (120s)"}), 504
