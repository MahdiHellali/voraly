import json
from pathlib import Path
from graphify.build import build_from_json

extract = json.loads(Path("graphify-out/.graphify_extract.json").read_text(encoding="utf-8"))
analysis = json.loads(Path("graphify-out/.graphify_analysis.json").read_text(encoding="utf-8"))
G = build_from_json(extract)
communities = {int(k): v for k, v in analysis["communities"].items()}

for cid in sorted(communities.keys()):
    members = communities[cid]
    degs = sorted([(n, G.degree(n)) for n in members if n in G], key=lambda x: -x[1])[:4]
    labels = [G.nodes[n].get("label", n) for n, _ in degs]
    print(f"C{cid:02d} ({len(members):2d} nodes): {', '.join(labels)}")
