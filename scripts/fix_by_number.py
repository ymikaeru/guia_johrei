#!/usr/bin/env python3
"""
Fixed approach: Match by number/order for volumes with numbered sections
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
        
        # Skip very short titles
        if len(title) < 3:
            continue
        
        sections.append({
            'title_ja': title,
            'content_ja': content
        })
    
    return sections

def extract_number(title):
    """Extract leading number from title"""
    # Try Arabic numerals first
    match = re.match(r'^(\d+)', title.replace('\\\\', '').replace('.', '').strip())
    if match:
        return int(match.group(1))
    
    # Try Japanese numerals
    japanese_nums = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
        '１': 1, '２': 2, '３': 3, '４': 4, '５': 5,
        '６': 6, '７': 7, '８': 8, '９': 9,
    }
    
    for char in title[:3]:
        if char in japanese_nums:
            return japanese_nums[char]
    
    return None

def populate_volume(vol_name, debug=False):
    """Populate using number-based matching"""
    vol_file = f'data/{vol_name}.json'
    ref_file = f'data_reference/{vol_name}_ref.json'
    
    print(f"\n{'='*60}")
    print(f"Processing {vol_name}")
    print(f"{'='*60}")
    
    # Load files
    with open(vol_file, 'r', encoding='utf-8') as f:
        vol_data = json.load(f)
    
    with open(ref_file, 'r', encoding='utf-8') as f:
        ref_data = json.load(f)
    
    # Parse JA
    ja_content = ref_data.get('content', {}).get('japones', '')
    ja_sections = parse_bold_sections(ja_content)
    
    print(f"  JSON items: {len(vol_data)}")
    print(f"  JA sections: {len(ja_sections)}")
    
    # Create number -> JA section mapping
    ja_by_number = {}
    for ja_sec in ja_sections:
        num = extract_number(ja_sec['title_ja'])
        if num:
            ja_by_number[num] = ja_sec
    
    print(f"  JA sections with numbers: {len(ja_by_number)}")
    
    # Match by number
    updated = 0
    for item in vol_data:
        pt_title = item.get('title') or item.get('title_pt') or ''
        pt_num = extract_number(pt_title)
        
        if pt_num and pt_num in ja_by_number:
            ja_sec = ja_by_number[pt_num]
            item['title_ja'] = ja_sec['title_ja']
            item['content_ja'] = ja_sec['content_ja']
            updated += 1
            
            if debug and updated <= 5:
                print(f"  ✓ [{pt_num}] {pt_title[:50]}... -> {ja_sec['title_ja'][:50]}...")
    
    # Save
    with open(vol_file, 'w', encoding='utf-8') as f:
        json.dump(vol_data, f, indent=2, ensure_ascii=False)
    
    # Stats
    ja_count = sum(1 for item in vol_data if item.get('content_ja'))
    coverage = (ja_count / len(vol_data) * 100) if len(vol_data) > 0 else 0
    
    print(f"\n  Results:")
    print(f"    Matched by number: {updated}")
    print(f"    Total with JA: {ja_count}/{len(vol_data)} ({coverage:.1f}%)")
    
    return {
        'volume': vol_name,
        'updated': updated,
        'total': len(vol_data),
        'ja_count': ja_count,
        'coverage': coverage
    }

def main():
    print("🔧 NUMBER-BASED MATCHING FOR VOLUMES 03, 08, 09")
    print("=" * 60)
    
    volumes = ['johrei_vol03', 'johrei_vol08', 'johrei_vol09']
    
    results = []
    for vol in volumes:
        result = populate_volume(vol, debug=True)
        results.append(result)
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 FINAL SUMMARY")
    print(f"{'='*60}")
    
    total_updated = 0
    for r in results:
        status = '✅' if r['coverage'] > 80 else '⚠️' if r['coverage'] > 30 else '❌'
        before = r['ja_count'] - r['updated']
        print(f"{status} {r['volume']:20s}: {before:3d} -> {r['ja_count']:3d}/{r['total']:3d} ({r['coverage']:5.1f}%) [+{r['updated']}]")
        total_updated += r['updated']
    
    print(f"\n✨ Total items populated: {total_updated}")

if __name__ == "__main__":
    main()
