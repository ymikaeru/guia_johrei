import json
import re
import os
from collections import Counter

files = [
    'data/pontos_focais.json',
    'data/fundamentos.json',
    'data/curas.json'
]

# Keywords mapping to suggested Tags
# Keyword (regex) -> Tag
keyword_map = {
    r'\brins?\b|renal': 'Rins e Sistema Urinário',
    r'\best[ôo]mag': 'Sistema Digestivo',
    r'\bpulm[ãa]o|\bpulmões\b|respir': 'Sistema Respiratório',
    r'\bcoraç[ãa]o\b|cardíac': 'Coração e Circulação',
    r'\bcabeça\b|\bcerebr': 'Sistema Nervoso e Cabeça',
    r'\bútero\b|\bmenstru': 'Saúde da Mulher',
    r'\bcriança\b|\binfantil\b': 'Saúde da Criança',
    r'\bfebre\b': 'Febre',
    r'\bgripe\b|\bresfriad': 'Gripe e Resfriado',
    r'\bpurificação\b': 'Purificação'
}

all_tags = Counter()
suggestions = []

for file_path in files:
    if not os.path.exists(file_path): continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for item in data:
        current_tags = set(item.get('tags', []))
        
        # Count existing
        for t in current_tags:
            all_tags[t] += 1
            
        # Analysis
        content = (item.get('title', '') + " " + item.get('content', '')).lower()
        
        item_suggestions = []
        for pattern, suggested_tag in keyword_map.items():
            if re.search(pattern, content, re.IGNORECASE):
                if suggested_tag not in current_tags:
                    # Check if we already have a reasonably similar tag? 
                    # E.g. "Rins" vs "Rins e Sistema Urinário".
                    # For now just suggest.
                    item_suggestions.append(suggested_tag)
        
        if item_suggestions:
            suggestions.append({
                "id": item.get('id', 'unknown'),
                "title": item.get('title', 'No Title'),
                "current": list(current_tags),
                "suggested": item_suggestions,
                "file": file_path
            })

print("\n=== TOP EXISTING TAGS ===")
for tag, count in all_tags.most_common(20):
    print(f"{tag}: {count}")

print("\n=== RARE TAGS (Potential Typos) ===")
for tag, count in all_tags.items():
    if count == 1:
        print(f"{tag}")

print(f"\n=== SUGGESTIONS ({len(suggestions)} items could be enriched) ===")
# Show first 10
for s in suggestions[:10]:
    print(f"[{s['id']}] {s['title']}")
    print(f"  Current: {s['current']}")
    print(f"  Add:     {s['suggested']}")
    print("---")
