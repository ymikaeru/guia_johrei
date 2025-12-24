import re
import json
import os

def parse_pt_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    sections = {}
    pattern = r'(?m)^###\s+(\d+)\.?\\?\.\s+(.*)$'
    
    matches = list(re.finditer(pattern, content))
    
    for i, m in enumerate(matches):
        idx = int(m.group(1))
        title = m.group(2).strip()
        
        start = m.end()
        end = matches[i+1].start() if i + 1 < len(matches) else len(content)
        
        body = content[start:end].strip()
        sections[idx] = {
            'title': title,
            'content': body
        }
    return sections

def parse_jp_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    kanji_map = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
    }
    
    sections = {}
    pattern = r'(?m)^#\s*\*\*\s*([一二三四五六七八九十]+)[、\.]\s*(.*?)\*\*$'
    
    matches = list(re.finditer(pattern, content))
    
    for i, m in enumerate(matches):
        kanji_num = m.group(1)
        title = m.group(2).strip()
        
        start = m.end()
        end = matches[i+1].start() if i + 1 < len(matches) else len(content)
        
        body = content[start:end].strip()
        
        idx = kanji_map.get(kanji_num)
        if idx:
            sections[idx] = {
                'title': title,
                'content': body
            }
    return sections

def main():
    pt_path = 'Markdown/MD_Portugues/Johrei Ho Kohza (1).md'
    jp_path = 'Markdown/MD_Original/浄霊法講座（一）.md'
    out_path = 'data/johrei_vol01_bilingual.json'
    
    if not os.path.exists(pt_path):
        print(f"PT file not found: {pt_path}")
        return
    if not os.path.exists(jp_path):
        print(f"JP file not found: {jp_path}")
        return

    pt_sections = parse_pt_file(pt_path)
    jp_sections = parse_jp_file(jp_path)
    
    merged = []
    
    # Iterate through PT sections (assuming it defines the order)
    # Or strict 1..6
    
    all_indices = sorted(list(set(pt_sections.keys()) | set(jp_sections.keys())))
    
    for idx in all_indices:
        item = {
            'id': f"johrei_vol01_{idx:02d}",
            'order': idx,
            'title_pt': pt_sections.get(idx, {}).get('title', ''),
            'title_jp': jp_sections.get(idx, {}).get('title', ''),
            'content_pt': pt_sections.get(idx, {}).get('content', ''),
            'content_jp': jp_sections.get(idx, {}).get('content', '')
        }
        merged.append(item)
        
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully created {out_path} with {len(merged)} items.")

if __name__ == "__main__":
    main()
