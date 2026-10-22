#!/usr/bin/env python3
"""Side-by-side dark-mode comparison: reference vs our implementation."""
import os
from PIL import Image, ImageDraw

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
base = os.environ.get("TOOL_RESULTS", os.path.join(REPO_ROOT, "tool-results"))
pairs = [
    (f"{base}/darkmode-forensics/ref-dark-hero-1440.png",
     f"{base}/darkmode-impl/ours-dark-hero-1440.png",
     f"{base}/darkmode-impl/compare-dark-hero-1440.png",
     "REFERENCE theretriever.app (dark)  vs  OURS (dark)"),
]
for ref_path, ours_path, out_path, label in pairs:
    ref = Image.open(ref_path).convert("RGB")
    ours = Image.open(ours_path).convert("RGB")
    h = 640
    ref_r = ref.resize((int(ref.width * h / ref.height), h))
    ours_r = ours.resize((int(ours.width * h / ours.height), h))
    pad, label_h = 16, 34
    w = ref_r.width + ours_r.width + pad * 3
    canvas = Image.new("RGB", (w, h + label_h + pad * 2), (60, 60, 60))
    d = ImageDraw.Draw(canvas)
    d.text((pad, pad // 2), label, fill=(255, 255, 255))
    canvas.paste(ref_r, (pad, label_h + pad))
    canvas.paste(ours_r, (ref_r.width + pad * 2, label_h + pad))
    canvas.save(out_path)
    print("saved", out_path, canvas.size)

# Zoomed pixel-color verification strip: sample canvas + wave area colors
import collections

def sample(path, box, n=12):
    im = Image.open(path).convert("RGB").crop(box)
    im = im.resize((n, n), Image.NEAREST)
    return collections.Counter(im.getdata()).most_common(3)

ref = f"{base}/darkmode-forensics/ref-dark-hero-1440.png"
ours = f"{base}/darkmode-impl/ours-dark-hero-1440.png"
for name, box in [("canvas-corner", (12, 560, 60, 620)), ("wave-zone", (900, 120, 1300, 420))]:
    print(f"{name} REF :", sample(ref, box))
    print(f"{name} OURS:", sample(ours, box))
