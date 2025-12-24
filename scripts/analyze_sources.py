import json
import os
from collections import defaultdict

pt_dir = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"
pt_files = ["pontos_focais.json", "fundamentos.json", "explicacoes_contexto.json", "explicacoes_fundamentos.json"]

for pt_name in pt_files:
    path = os.path.join(pt_dir, pt_name)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            sources = defaultdict(int)
            for item in data:
                src = item.get('source', 'Unknown')
                sources[src] += 1
            print(f"\n{pt_name}:")
            for src, count in sources.items():
                print(f"  - {src}: {count} items")
    except Exception as e:
        print(f"Error reading {pt_name}: {e}")
