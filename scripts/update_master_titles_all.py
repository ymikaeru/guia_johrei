import json
import re
import os
from difflib import SequenceMatcher

def normalize_ref_aggressive(ref_str):
    if not ref_str: return ""
    s = ref_str.lower()
    s = s.replace('go-suiji-roku', 'gosuishiroku')
    s = s.replace('gosui-ji roku', 'gosuishiroku')
    s = s.replace('gosui-ji', 'gosuishiroku')
    s = s.replace('gosuishiroku', 'gosuishiroku')
    s = s.replace('go-oshie-shū', 'mioshie-shu')
    s = s.replace('go-oshie', 'mioshie')
    s = s.replace('goshū', 'mioshie-shu')
    s = s.replace('mioshie-shu', 'mioshie-shu') 
    s = s.replace('goshu', 'mioshie-shu') 
    s = s.replace('mikoto no oshie-shū', 'mioshie-shu')
    s = s.replace('mikoto no oshie', 'mioshie')
    s = s.replace('mikotonooshieshu', 'mioshie-shu')
    s = s.replace('mikotonooshie', 'mioshie')
    s = s.replace('chijō tengoku', 'chijo tengoku')
    s = s.replace('chijo tengoku', 'chijo tengoku')
    s = s.replace('chijō', 'chijo')
    s = s.replace('vol.', 'n').replace('vol', 'n')
    s = s.replace('n.º', 'n').replace('nº', 'n').replace('no.', 'n')
    s = s.replace('edição', 'n').replace('edicao', 'n')
    s = s.replace('pág.', 'p').replace('p.', 'p').replace('pag.', 'p').replace('pag', 'p')
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

def normalize_title(title):
    if not title: return ""
    return re.sub(r'\W+', '', title.lower())

def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()

def get_master_pattern(vol_num):
    if vol_num == 1:
        return re.compile(r'^#+\s*(\d+\..?\.?)\s*(.*)')
    else:
        return re.compile(r'^#+\s*([IVXLCDM]+\\?\.?)\s*(.*)')

def parse_markdown_heuristic(vol_num):
    md_path = f'Markdown/MD_Portugues/Johrei Ho Kohza ({vol_num}).md'
    if not os.path.exists(md_path):
        print(f"  MD not found: {md_path}")
        return []

    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    items = []
    
    master_pattern = get_master_pattern(vol_num)
    current_master = None
    
    for line in lines:
        line = line.strip()
        if not line.startswith('#'):
            continue
            
        match_master = master_pattern.match(line)
        is_master_line = False
        
        if match_master:
            raw_text = match_master.group(2).strip()
            # Clean md formatting
            text = raw_text.replace('**', '').replace('\\', '').strip()
            
            # Use text WITHOUT numeral as Master Title
            clean_master_title = text
            
            current_master = clean_master_title
            is_master_line = True
            title_text = text
        else:
            content = re.sub(r'^#+\s*', '', line)
            title_text = content

        ref = None
        m1 = re.findall(r'\((.+?)\)\\?$', title_text)
        if m1: ref = m1[-1]
        
        if not ref:
             m2 = re.findall(r'\*(.+?)\*\\?$', title_text)
             if m2: ref = m2[-1]
             
        if ref:
            title_text = title_text.replace(f'({ref})', '')
            title_text = title_text.replace(f'*{ref}*', '')
        
        title_text = re.sub(r'^\**\d+\.?\s*', '', title_text)
        title_text = title_text.replace('**', '').replace('\\', '').strip()
        ref = ref.strip() if ref else None
        
        if not title_text and not ref: continue

        items.append({
            'master': current_master,
            'title': title_text,
            'ref': ref,
            'is_master_header': is_master_line
        })

    return items

def process_volume(vol_num):
    print(f"\n--- Processing Volume {vol_num} ---")
    json_path = f'data/johrei_vol{vol_num:02d}_bilingual.json'
    
    if not os.path.exists(json_path):
        print(f"  JSON not found: {json_path}")
        return

    md_items = parse_markdown_heuristic(vol_num)
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"  Error loading JSON: {e}")
        return

    matches = 0
    updates = 0
    
    current_master_title = None
    
    # Regex to catch numerals in existing JSON titles to remove them if needed
    # Vol 1 uses "1. Title", Vol 2+ uses "I. Title"
    if vol_num == 1:
        json_master_regex = re.compile(r'^(\*+)?\s*\d+\.\s+(.*)')
    else:
        json_master_regex = re.compile(r'^(\*+)?\s*[IVXLCDM]+\.\s+(.*)')

    for i, item in enumerate(data):
        json_ref = item.get('info_pt', '') or item.get('source', '')
        json_title = item.get('title_pt', '')
        
        best_match = None
        best_score = 0
        
        if md_items:
            norm_json_ref = normalize_ref_aggressive(json_ref)
            norm_json_title = normalize_title(json_title)
            
            for idx, md_item in enumerate(md_items):
                score = 0
                norm_md_ref = normalize_ref_aggressive(md_item['ref'])
                norm_md_title = normalize_title(md_item['title'])
                
                if norm_json_ref and norm_md_ref:
                    if norm_json_ref in norm_md_ref or norm_md_ref in norm_json_ref:
                        score = 100
                
                if score < 100 and norm_json_title and norm_md_title:
                     sim = similarity(norm_json_title, norm_md_title)
                     if sim > 0.85:
                         score = max(score, 90)
                
                if score > 50:
                     dist = abs(i - idx)
                     if dist < 5: score += 5
                
                if score > best_score:
                    best_score = score
                    best_match = md_item
        
        source_master = None
        
        # 1. From MD match
        if best_match and best_score >= 80:
             matches += 1
             if best_match['master']:
                 source_master = best_match['master']
        
        # 2. From JSON Title Scanning (Override or init if MD match is silent)
        # Check if ITEM TITLE is a Master Header
        m_title = json_master_regex.match(json_title)
        if m_title:
            # Group 2 has the text without numeral
            clean = m_title.group(2).replace('**', '').replace('###', '').strip()
            source_master = clean
        
        if source_master:
            current_master_title = source_master
            # Cleanup numeral from master title if it crept in via MD parsing (just in case)
            # Remove leading "I. " or "1. "
            current_master_title = re.sub(r'^[IVXLCDM\d]+\.\s*', '', current_master_title)
            
        if current_master_title:
            current_val = item.get('Master_Title')
            if current_val != current_master_title:
                item['Master_Title'] = current_master_title
                updates += 1
            
            if 'master_title' in item: del item['master_title']
            if 'titulo_mestre' in item: del item['titulo_mestre']

    if updates > 0:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✅ Saved {updates} updates in {json_path}")
    else:
        print(f"  No changes needed in {json_path}")

def main():
    for v in range(1, 11):
        process_volume(v)

if __name__ == "__main__":
    main()
