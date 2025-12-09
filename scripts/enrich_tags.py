import json
import re
import os

# Files to process
files = [
    'data/pontos_focais.json',
    'data/fundamentos.json',
    'data/curas.json'
]

# regex -> tag
keyword_rules = {
    r'\brins?\b|renal': 'Rins e Sistema Urinário',
    r'\best[ôo]mag': 'Sistema Digestivo',
    r'\bfígado\b|hepátic': 'Sistema Digestivo',
    r'\bintestino': 'Sistema Digestivo',
    r'\bpulm[ãa]o|\bpulmões\b|respir': 'Sistema Respiratório',
    r'\bcoraç[ãa]o\b|cardíac': 'Coração e Circulação',
    r'\bcabeça\b|\bcerebr': 'Sistema Nervoso e Cabeça',
    r'\bútero\b|\bovári': 'Sistema Reprodutor',
    r'\bmenstru': 'Doenças Femininas', # Or Saúde da Mulher
    r'\bcriança\b|\binfantil\b|bebê': 'Doenças Infantis', 
    r'\bfebre\b': 'Febre',
    r'\bgripe\b|\bresfriad': 'Gripe e Resfriado',
    r'\bpurificação\b': 'Purificação',
    r'\bdor\b': 'Dores e Rigidez',
    r'\bcausa espiritual\b|\bespírit': 'Mundo Espiritual'
}

count = 0

for file_path in files:
    if not os.path.exists(file_path): continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    file_modified = False
    for item in data:
        content = (item.get('title', '') + " " + item.get('content', '')).lower()
        current_tags = set(item.get('tags', []))
        original_len = len(current_tags)
        
        for pattern, tag in keyword_rules.items():
            if re.search(pattern, content, re.IGNORECASE):
                # Only add if not present
                current_tags.add(tag)
        
        if len(current_tags) > original_len:
            item['tags'] = list(current_tags)
            file_modified = True
            count += 1
            
    if file_modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"Updated tags in {file_path}")

print(f"Total items enriched: {count}")
