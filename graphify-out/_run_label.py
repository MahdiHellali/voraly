import json
from pathlib import Path
from graphify.build import build_from_json
from graphify.cluster import score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate

extraction = json.loads(Path("graphify-out/.graphify_extract.json").read_text(encoding="utf-8"))
detection  = json.loads(Path("graphify-out/.graphify_detect.json").read_text(encoding="utf-8-sig"))
analysis   = json.loads(Path("graphify-out/.graphify_analysis.json").read_text(encoding="utf-8"))

G = build_from_json(extraction)
communities = {int(k): v for k, v in analysis["communities"].items()}
cohesion    = {int(k): v for k, v in analysis["cohesion"].items()}
tokens      = {"input": 0, "output": 0}

labels = {
    0:  "Auth & OAuth Routes",
    1:  "UI Components & Utils",
    2:  "Supabase Client & Settings",
    3:  "Dashboard Data & Types",
    4:  "Layout & Auth Middleware",
    5:  "Roadmap & Platform Routes",
    6:  "Landing & KPI Bento",
    7:  "Platform APIs & Pricing",
    8:  "Agenda Calendar Card",
    9:  "Liquid Glass UI Pages",
    10: "i18n & Localization",
    11: "Public Static Pages",
    12: "3D Hero Scene",
    13: "Public Navigation",
    14: "CGU Legal Page",
    15: "Privacy Policy Page",
    16: "Rate Limiting Middleware",
    17: "Notion Event Status Action",
    18: "Subscription Badge",
    19: "Contact Layout",
    20: "FAQ Layout",
    21: "Optimize Page",
    22: "Matomo Analytics Proxy",
    23: "Robots.txt Route",
    24: "Sitemap Route",
    25: "Mouse Tracker",
    26: "WebGL Shader Component",
    27: "Integration Callback Route",
}

questions = suggest_questions(G, communities, labels)
report = generate(
    G, communities, cohesion, labels,
    analysis["gods"], analysis["surprises"],
    detection, tokens, ".",
    suggested_questions=questions,
)
Path("graphify-out/GRAPH_REPORT.md").write_text(report, encoding="utf-8")
Path("graphify-out/.graphify_labels.json").write_text(
    json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False),
    encoding="utf-8",
)
print("Report regenerated with community labels.")
print(f"Communities: {len(labels)}")
print("Top suggested questions:")
for q in questions[:3]:
    print(" -", q.get("question", "")[:120])
