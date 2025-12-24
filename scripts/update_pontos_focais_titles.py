import json
import re
import os
import difflib

def normalize_text(text):
    if not text:
        return ""
    # Remove special chars but keep words
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()

def get_tokens(text):
    return set(normalize_text(text).split())

def calculate_similarity(text1, text2):
    # Token overlap score
    tokens1 = get_tokens(text1)
    tokens2 = get_tokens(text2)
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    token_score = len(intersection) / len(union)
    
    # Sequence matcher score (for order and spelling)
    seq_score = difflib.SequenceMatcher(None, normalize_text(text1), normalize_text(text2)).ratio()
    
    # Weighted average. Token score is more robust for order swaps ("A (B)" vs "B (A)")
    return (token_score * 0.7) + (seq_score * 0.3)

def clean_header(header):
    header = re.sub(r'^###\s*', '', header)
    header = header.replace('[', '').replace(']', '').replace('\\', '')
    # Remove leading numbering like "1. ", "10.", "2. "
    header = re.sub(r'^\d+\.?\s*', '', header)
    return header.strip()

def parse_markdown_flat(md_path):
    print(f"Parsing Parsed: {md_path}")
    items = []
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    current_h3 = None
    
    for line in lines:
        line = line.strip()
        if line.startswith('### '):
            current_h3 = clean_header(line)
            # The H3 itself acts as an item context for itself
            items.append({
                'title': current_h3,
                'master_title': current_h3,
                'type': 'H3'
            })
        elif line.startswith('#### '):
            course_title = re.sub(r'^####\s*', '', line).strip()
            if current_h3:
                items.append({
                    'title': course_title,
                    'master_title': current_h3,
                    'type': 'H4'
                })
    return items

def update_json(json_path, md_items):
    print(f"Updating JSON: {json_path}")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    updated_count = 0
    matched_indices = set()

    for entry in data:
        json_title = entry.get('title_pt', '')
        if not json_title: 
            continue

        best_score = 0
        best_match = None
        best_idx = -1

        # Look for best match in MD items
        # Optimization: prioritize items around the expected index if possible?
        # For now, searching all is fine (~100 items).
        
        for idx, item in enumerate(md_items):
            score = calculate_similarity(json_title, item['title'])
            if score > best_score:
                best_score = score
                best_match = item
                best_idx = idx

        # Threshold
        if best_score > 0.4: # Lower threshold because token overlap is strict
            entry['Master_title'] = best_match['master_title']
            updated_count += 1
            matched_indices.add(best_idx)
            # print(f"  Matched: '{json_title}' -> '{best_match['title']}' (Master: {best_match['master_title']}) Score: {best_score:.2f}")
        else:
            print(f"  WARNING: No match for '{json_title}' (Best score: {best_score:.2f} with '{md_items[0]['title'] if md_items else 'None'}')")

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"  Updated {updated_count} items in {json_path}")

def main():
    base_dir = '/Users/michael/Documents/Ensinamentos/guia_johrei'
    
    # Pair 1: Vol 01
    md_01 = os.path.join(base_dir, 'Markdown/MD_Portugues/Pontos Focais 01_Prompt v5.md')
    json_01 = os.path.join(base_dir, 'data/pontos_focais_vol01_bilingual.json')
    
    if os.path.exists(md_01) and os.path.exists(json_01):
        items_01 = parse_markdown_flat(md_01)
        update_json(json_01, items_01)

    # Pair 2: Vol 02
    md_02 = os.path.join(base_dir, 'Markdown/MD_Portugues/Pontos Focais 02_Prompt v5.md')
    json_02 = os.path.join(base_dir, 'data/pontos_focais_vol02_bilingual.json')
    
    if os.path.exists(md_02) and os.path.exists(json_02):
        items_02 = parse_markdown_flat(md_02)
        update_json(json_02, items_02)

if __name__ == "__main__":
    main()
