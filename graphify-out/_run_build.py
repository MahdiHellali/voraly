import sys
import json
from pathlib import Path

if __name__ == '__main__':
    # Semantic vide (corpus 100% code, pas de docs/papers)
    sem = {'nodes': [], 'edges': [], 'hyperedges': [], 'input_tokens': 0, 'output_tokens': 0}
    Path('graphify-out/.graphify_semantic.json').write_text(
        json.dumps(sem, ensure_ascii=False), encoding='utf-8'
    )

    # Part C — merge AST + semantic
    ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text(encoding='utf-8'))
    seen = {n['id'] for n in ast['nodes']}
    merged_nodes = list(ast['nodes'])
    merged_edges = ast['edges']
    merged = {
        'nodes': merged_nodes,
        'edges': merged_edges,
        'hyperedges': [],
        'input_tokens': 0,
        'output_tokens': 0,
    }
    Path('graphify-out/.graphify_extract.json').write_text(
        json.dumps(merged, indent=2, ensure_ascii=False), encoding='utf-8'
    )
    print(f'Merged: {len(merged_nodes)} nodes, {len(merged_edges)} edges')

    # Step 4 — build graph, cluster, analyze, generate outputs
    from graphify.build import build_from_json
    from graphify.cluster import cluster, score_all
    from graphify.analyze import god_nodes, surprising_connections, suggest_questions
    from graphify.report import generate
    from graphify.export import to_json

    detection = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8-sig'))
    G = build_from_json(merged)
    print(f'Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges')

    communities = cluster(G)
    cohesion = score_all(G, communities)
    tokens = {'input': 0, 'output': 0}
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    labels = {cid: 'Community ' + str(cid) for cid in communities}
    questions = suggest_questions(G, communities, labels)

    report = generate(G, communities, cohesion, labels, gods, surprises, detection, tokens, '.', suggested_questions=questions)
    Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')
    to_json(G, communities, 'graphify-out/graph.json')

    analysis = {
        'communities': {str(k): v for k, v in communities.items()},
        'cohesion': {str(k): v for k, v in cohesion.items()},
        'gods': gods,
        'surprises': surprises,
        'questions': questions,
        'num_communities': len(communities),
        'community_sizes': {str(k): len(v) for k, v in communities.items()},
    }
    Path('graphify-out/.graphify_analysis.json').write_text(
        json.dumps(analysis, indent=2, ensure_ascii=False), encoding='utf-8'
    )
    print(f'Communities: {len(communities)}')
    print(f'God nodes (top 5): {gods[:5]}')
    print('Questions:', questions[:3])
