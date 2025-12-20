import json
import os

pt_dir = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"
jp_dir = "/Users/michael/Documents/Ensinamentos/guia_johrei/Docx_Original/MD_Original/json_output"

pairs = [
    ("pontos_focais.json", "各論.json"),
    ("fundamentos.json", "浄霊法講座.json"),
    ("explicacoes_contexto.json", "総論１.json")
]

def load_json(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

for pt_name, jp_name in pairs:
    pt_data = load_json(os.path.join(pt_dir, pt_name))
    jp_data = load_json(os.path.join(jp_dir, jp_name))
    
    print(f"\nComparing {pt_name} ({len(pt_data)}) <-> {jp_name} ({len(jp_data)})")
    
    limit = min(len(pt_data), len(jp_data), 10)
    for i in range(limit):
        print(f"  [{i}] PT: {pt_data[i].get('title')} <-> JP: {jp_data[i].get('title')}")
