#!/usr/bin/env python3
"""
Fix Vol.09 which uses parenthetical numbering: (1), (2), etc.
"""
import json
import re

def parse_bold_sections(ja_content):
    """Parse bold sections **Title**"""
    sections = []
    pattern = r'\*\*([^*]+)\*\*'
    matches = list(re.finditer(pattern, ja_content))
    
    for i, match in enumerate(matches):
        title = match.group(1).strip()
        start = match.end()
        
        if i < len(matches) - 1:
            end = matches[i + 1].start()
        else:
            end = len(ja_content)
        
        content = ja_content[start:end].strip()
        
        if len(title) < 2:
            continue
        
        sections.append({
            'title_ja': title,
            'content_ja': content
        })
    
    return sections

def extract_paren_number(title):
    """Extract number from parentheses: (1), (２), （１）"""
    # Try (1), (2), etc.
    match = re.search(r'[\(（](\d+)[\)）]', title)
    if match:
        return int(match.group(1))
    
    # Try (１), (２), etc.
    japanese_nums = {
        '１': 1, '２': 2, '３': 3, '４': 4, '５': 5,
        '６': 6, '７': 7, '８': 8, '９': 9,
    }
    
    match = re.search(r'[\(（]([１-９])[\)）]', title)
    if match:
        return japanese_nums.get(match.group(1))
    
    return None

def populate_vol09():
    """Populate Vol.09 using parenthetical number matching"""
    vol_file = 'data/johrei_vol09.json'
    ref_file = 'data_reference/johrei_vol09_ref.json'
    
    print("Processing johrei_vol09 (parenthetical numbering)")
    print("=" * 60)
    
    # Load
    with open(vol_file, 'r', encoding='utf-8') as f:
        vol_data = json.load(f)
    
    with open(ref_file, 'r', encoding='utf-8') as f:
        ref_data = json.load(f)
    
    # Parse JA
    ja_content = ref_data.get('content', {}).get('japones', '')
    ja_sections = parse_bold_sections(ja_content)
    
    print(f"JSON items: {len(vol_data)}")
    print(f"JA sections: {len(ja_sections)}")
    
    # Create mapping by parenthetical number
    ja_by_paren = {}
    for ja_sec in ja_sections:
        num = extract_paren_number(ja_sec['title_ja'])
        if num:
            # Store in a list to handle duplicates
            if num not in ja_by_paren:
                ja_by_paren[num] = []
            ja_by_paren[num].append(ja_sec)
    
    print(f"JA sections with (N): {sum(len(v) for v in ja_by_paren.values())} across {len(ja_by_paren)} numbers")
    
    # Match
    updated = 0
    for item in vol_data:
        pt_title = item.get('title') or item.get('title_pt') or ''
        pt_num = extract_paren_number(pt_title)
        
        if pt_num and pt_num in ja_by_paren:
            # Use first available match for this number
            ja_candidates = ja_by_paren[pt_num]
            if ja_candidates:
                ja_sec = ja_candidates.pop(0)  # Take first and remove
                item['title_ja'] = ja_sec['title_ja']
                item['content_ja'] = ja_sec['content_ja']
                updated += 1
                
                if updated <= 5:
                    print(f"  ✓ ({pt_num}) {pt_title[:50]}... -> {ja_sec['title_ja'][:50]}...")
    
    # Save
    with open(vol_file, 'w', encoding='utf-8') as f:
        json.dump(vol_data, f, indent=2, ensure_ascii=False)
    
    # Stats
    ja_count = sum(1 for item in vol_data if item.get('content_ja'))
    coverage = (ja_count / len(vol_data) * 100) if len(vol_data) > 0 else 0
    
    print(f"\nResults:")
    print(f"  Matched: {updated}")
    print(f"  Total with JA: {ja_count}/{len(vol_data)} ({coverage:.1f}%)")
    
    return updated, ja_count, len(vol_data), coverage

if __name__ == "__main__":
    updated, ja_count, total, coverage = populate_vol09()
    status = '✅' if coverage > 80 else '⚠️' if coverage > 30 else '❌'
    print(f"\n{status} johrei_vol09: {ja_count}/{total} ({coverage:.1f}%) [+{updated}]")
