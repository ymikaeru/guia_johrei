import json
import re
import os
from difflib import SequenceMatcher

def normalize_ref_aggressive(ref_str):
    if not ref_str: return ""
    s = ref_str.lower()
    
    # Key Term Unification
    s = s.replace('go-suiji-roku', 'gosuishiroku')
    s = s.replace('gosui-ji roku', 'gosuishiroku')
    s = s.replace('gosui-ji', 'gosuishiroku')
    s = s.replace('gosuishiroku', 'gosuishiroku')

    s = s.replace('go-oshie-shū', 'mioshie-shu')
    s = s.replace('go-oshie', 'mioshie')
    s = s.replace('goshū', 'mioshie-shu')
    s = s.replace('mioshie-shu', 'mioshie-shu') 
    s = s.replace('goshu', 'mioshie-shu') 
    
    # Mikoto variations
    s = s.replace('mikoto no oshie-shū', 'mioshie-shu')
    s = s.replace('mikoto no oshie', 'mioshie')
    s = s.replace('mikotonooshieshu', 'mioshie-shu')
    s = s.replace('mikotonooshie', 'mioshie')
    
    s = s.replace('chijō tengoku', 'chijo tengoku')
    s = s.replace('chijo tengoku', 'chijo tengoku')
    s = s.replace('chijō', 'chijo')
    
    # Number Prefix Unification
    s = s.replace('vol.', 'n').replace('vol', 'n')
    s = s.replace('n.º', 'n').replace('nº', 'n').replace('no.', 'n')
    s = s.replace('edição', 'n').replace('edicao', 'n')
    
    s = s.replace('pág.', 'p').replace('p.', 'p').replace('pag.', 'p').replace('pag', 'p')
    
    # Remove all non-alphanumeric chars (keep numbers and English letters)
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

def normalize_title(title):
    if not title: return ""
    return re.sub(r'\W+', '', title.lower())

def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()

def parse_markdown_heuristic(vol_num):
    md_path = f'Markdown/MD_Portugues/Johrei Ho Kohza ({vol_num}).md'
    if not os.path.exists(md_path):
        print(f"  MD not found: {md_path}")
        return []

    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    items = []
    
    # Heuristic: Check if #### lines exist
    has_h4 = any(line.strip().startswith('#### ') for line in lines)
    
    master_level = '###' if has_h4 else '##'
    item_level   = '####' if has_h4 else '###'
    
    print(f"  Parsing with Scheme: Master={master_level}, Item={item_level}")
    
    current_master = None
    
    for line in lines:
        line = line.strip()
        
        # Master Title Check
        if line.startswith(master_level + ' ') and not line.startswith(item_level + ' '):
            match = re.search(f'^{master_level}\\s*(.+)', line)
            if match:
                current_master = match.group(1).strip()
            continue
            
        # Item Title Check
        if line.startswith(item_level + ' '):
            # Extract ref. Try Parens first, then Italics *...*
            # Patterns to try at end of line
            # 1. (Ref) or (Ref)\
            # 2. *Ref* or *Ref*\ or *Ref.*
            
            ref = None
            
            # Pattern 1: Parens
            m1 = re.findall(r'\((.+?)\)\\?$', line)
            if m1: ref = m1[-1]
            
            # Pattern 2: Italics *...* (If no parens match or strict preference?)
            # Vol 10 uses *Ref.*
            if not ref:
                m2 = re.findall(r'\*(.+?)\*\\?$', line)
                if m2: ref = m2[-1]
            
            # Extract title part
            text = line[len(item_level):].strip()
            if ref:
                # Remove ref from title. Handle different variations.
                # It might be "(Ref)" or "*Ref*"
                text = text.replace(f'({ref})', '')
                text = text.replace(f'*{ref}*', '')
            
            # Clean leading numbers
            text = re.sub(r'^\**\d+\.\s*', '', text) 
            text = text.replace('**', '').strip()
            
            if ref and ref.strip() == '': ref = None

            items.append({
                'master': current_master,
                'title': text,
                'ref': ref
            })

    return items

def process_volume(vol_num):
    print(f"\n--- Processing Volume {vol_num} ---")
    json_path = f'data/johrei_vol{vol_num:02d}_bilingual.json'
    
    if not os.path.exists(json_path):
        print(f"  JSON not found: {json_path}")
        return

    md_items = parse_markdown_heuristic(vol_num)
    if not md_items:
        print("  No items parsed from Markdown.")
        return
        
    print(f"  Parsed {len(md_items)} items.")

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"  Error loading JSON: {e}")
        return

    matches = 0
    updates = 0
    
    for item in data:
        json_ref = item.get('info_pt', '')
        json_title = item.get('title_pt', '')
        
        norm_json_ref = normalize_ref_aggressive(json_ref)
        norm_json_title = normalize_title(json_title)
        
        best_match = None
        best_score = 0
        
        for md_item in md_items:
            score = 0
            
            norm_md_ref = normalize_ref_aggressive(md_item['ref'])
            norm_md_title = normalize_title(md_item['title'])
            
            # 1. Aggressive Ref Match
            if norm_json_ref and norm_md_ref:
                if norm_json_ref in norm_md_ref or norm_md_ref in norm_json_ref:
                    score = 100
            
            # 2. Title Similarity
            if score < 100 and norm_json_title and norm_md_title:
                 sim = similarity(norm_json_title, norm_md_title)
                 if sim > 0.85:
                     score = 90
            
            if score > best_score:
                best_score = score
                best_match = md_item
        
        if best_match and best_score >= 90:
            current = item.get('titulo_mestre')
            new_val = best_match['master']
            if current != new_val:
                item['titulo_mestre'] = new_val
                updates += 1
            matches += 1

    if updates > 0:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✅ Saved {updates} updates ({matches}/{len(data)} matches)")
    else:
        print(f"  No changes needed ({matches}/{len(data)} matches)")

# Run for 4 to 10
for v in range(4, 11):
    process_volume(v)
