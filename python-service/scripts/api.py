"""
api.py - Flask HTTP API wrapping Librosa audio analysis.

Endpoints:
    POST /analyze  { "audio_path": "...", "output_path": "..." }
    GET  /health
"""

import os
import subprocess
import json

from flask import Flask, request, jsonify

app = Flask(__name__)

ANALYZE_SCRIPT = os.path.join(os.path.dirname(__file__), "analyze_audio.py")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "analyzer"})


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
