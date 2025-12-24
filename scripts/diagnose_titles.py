import json
import re
import os

def normalize_text(text):
    if not text: return ""
    return re.sub(r'\s+', ' ', text).strip()

def clean_header(header):
    header = re.sub(r'^###\s*', '', header)
    header = header.replace('[', '').replace(']', '')
    return header.strip()

def analyze_vol01():
    base_dir = '/Users/michael/Documents/Ensinamentos/guia_johrei'
    md_path = os.path.join(base_dir, 'Markdown/MD_Portugues/Pontos Focais 01_Prompt v5.md')
    json_path = os.path.join(base_dir, 'data/pontos_focais_vol01_bilingual.json')
    
    # 1. Parse MD
    md_items = []
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    current_h3 = None
    for line in lines:
        line = line.strip()
        if line.startswith('### '):
            current_h3 = clean_header(line)
            # Add the H3 itself as a potential item match?
            md_items.append({'type': 'H3', 'title': current_h3, 'master': current_h3})
        elif line.startswith('#### '):
            h4 = re.sub(r'^####\s*', '', line).strip()
            md_items.append({'type': 'H4', 'title': h4, 'master': current_h3})

    # 2. Parse JSON
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    json_titles = [d.get('title_pt', '') for d in data]

    print(f"MD Items found: {len(md_items)}")
    print(f"JSON Items found: {len(json_titles)}")
    
    print("\n--- Comparison (First 20) ---")
    limit = min(20, len(md_items), len(json_titles))
    for i in range(limit):
        print(f"Idx {i}:")
        print(f"  MD  : [{md_items[i]['type']}] {md_items[i]['title']}")
        print(f"  JSON: {json_titles[i]}")

if __name__ == "__main__":
    analyze_vol01()
