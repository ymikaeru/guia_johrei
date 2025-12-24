#!/usr/bin/env python3
"""
Fix Vol.07 Japanese content by parsing the reference file properly
"""
import json
import re

def parse_ja_sections_vol07(ja_content):
    """Parse Japanese content for Vol.07 which uses **N、Title** format"""
    sections = []
    
    # Pattern for numbered sections: **数字、タイトル**
    pattern = r'\*\*(\d+|[一二三四五六七八九十]+)[、．](.+?)\*\*'
    
    matches = list(re.finditer(pattern, ja_content))
    
    for i, match in enumerate(matches):
        number = match.group(1)
        title = match.group(2)
        start = match.end()
        
        # Content goes until next match or end
        if i < len(matches) - 1:
            end = matches[i + 1].start()
        else:
            end = len(ja_content)
        
        content = ja_content[start:end].strip()
        
        sections.append({
            'number': number,
            'title_ja': f'{number}、{title}',
            'content_ja': content
        })
    
    return sections

def match_pt_to_ja(pt_items, ja_sections):
    """Match PT items to JA sections by number"""
    matched = []
    
    for pt_item in pt_items:
        title_pt = pt_item.get('title_pt', '')
        
        # Extract number from PT title (e.g., "11\. Title..." -> "11")
        pt_number_match = re.match(r'^(\d+)', title_pt.replace('\\\\', ''))
        
        if not pt_number_match:
            matched.append(None)
            continue
        
        pt_number = pt_number_match.group(1)
        
        # Find matching JA section
        ja_match = None
        for ja_sec in ja_sections:
            if ja_sec['number'] == pt_number:
                ja_match = ja_sec
                break
        
        matched.append(ja_match)
    
    return matched

def main():
    # Load reference
    with open('data_reference/johrei_vol07_ref.json', 'r', encoding='utf-8') as f:
        ref = json.load(f)
    
    # Load production file
    with open('data/johrei_vol07.json', 'r', encoding='utf-8') as f:
        vol07 = json.load(f)
    
    # Parse JA content
    ja_content = ref.get('content', {}).get('japones', '')
    ja_sections = parse_ja_sections_vol07(ja_content)
    
    print(f"Found {len(ja_sections)} Japanese sections")
    print()
    
    # Match PT items to JA sections
    updated = 0
    matched_sections = match_pt_to_ja(vol07, ja_sections)
    
    for i, (item, ja_match) in enumerate(zip(vol07, matched_sections)):
        if ja_match:
            item['title_ja'] = ja_match['title_ja']
            item['content_ja'] = ja_match['content_ja']
            updated += 1
            print(f"✓ {item['id']}: {item.get('title_pt', '')} -> {ja_match['title_ja']}")
    
    # Save
    with open('data/johrei_vol07.json', 'w', encoding='utf-8') as f:
        json.dump(vol07, f, indent=2, ensure_ascii=False)
    
    print()
    print(f"Updated {updated}/{len(vol07)} items")
    ja_count = sum(1 for item in vol07 if item.get('content_ja'))
    print(f"Total with JA content: {ja_count}/{len(vol07)} ({ja_count/len(vol07)*100:.1f}%)")

if __name__ == "__main__":
    main()
