import sys
import json
from pathlib import Path

if __name__ == '__main__':
    from graphify.extract import collect_files, extract

    detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8-sig'))
    code_files = []
    for f in detect.get('files', {}).get('code', []):
        p = Path(f)
        if p.is_dir():
            code_files.extend(collect_files(p))
        else:
            code_files.append(p)

    print(f'Extracting AST from {len(code_files)} code files...')
    result = extract(code_files, cache_root=Path('.'))
    Path('graphify-out/.graphify_ast.json').write_text(
        json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8'
    )
    print(f'AST done: {len(result["nodes"])} nodes, {len(result["edges"])} edges')
