import json
from pathlib import Path
from graphify.build import build_from_json
from graphify.export import to_html, to_json

extract  = json.loads(Path("graphify-out/.graphify_extract.json").read_text(encoding="utf-8"))
analysis = json.loads(Path("graphify-out/.graphify_analysis.json").read_text(encoding="utf-8"))
labels   = json.loads(Path("graphify-out/.graphify_labels.json").read_text(encoding="utf-8"))
labels   = {int(k): v for k, v in labels.items()}

G           = build_from_json(extract)
communities = {int(k): v for k, v in analysis["communities"].items()}

to_json(G, communities, "graphify-out/graph.json", community_labels=labels)
print(f"graph.json updated: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

try:
    to_html(G, communities, "graphify-out/graph.html", community_labels=labels)
    size = Path("graphify-out/graph.html").stat().st_size // 1024
    print(f"graph.html generated ({size} KB)")
except Exception as e:
    print(f"HTML export skipped: {e}")
