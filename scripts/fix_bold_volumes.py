#!/usr/bin/env python3
"""
Populate volumes 03, 08, 09 using bold section format
Similar to Vol.07 fix
"""
import json
import re

def parse_bold_sections(ja_content):
    """
    Parse Japanese sections that use **Title** format
    Returns list of {'title_ja': ..., 'content_ja': ...}
    """
    sections = []
    
    # Pattern for bold sections: **Title**
    pattern = r'\*\*([^*]+)\*\*'
    
    matches = list(re.finditer(pattern, ja_content))
    
    for i, match in enumerate(matches):
        title = match.group(1).strip()
        start = match.end()
        
        # Content goes until next match or end
        if i < len(matches) - 1:
            end = matches[i + 1].start()
        else:
            end = len(ja_content)
        
        content = ja_content[start:end].strip()
        
        # Skip very short titles (likely formatting artifacts)
        if len(title) < 3:
            continue
        
        sections.append({
            'title_ja': title,
            'content_ja': content
        })
    
    return sections

def normalize_for_match(text):
    """Normalize text for fuzzy matching"""
    if not text:
        return ""
    
    t = text.lower()
    # Remove backslashes
    t = t.replace('\\\\', '').replace('\\', '')
    # Remove all punctuation and numbers
    t = re.sub(r'[0-9０-９\d]', '', t)
    t = re.sub(r'[^\w]', '', t)
    
    return t

def match_sections(vol_data, ja_sections, debug=False):
    """
    Match JSON items to JA sections using fuzzy matching
    """
    updated = 0
    
    # Create mapping of normalized JA titles
    ja_normalized = [(normalize_for_match(sec['title_ja']), sec) for sec in ja_sections]
    used_indices = set()
    
    for item in vol_data:
        pt_title = item.get('title') or item.get('title_pt') or ''
        pt_norm = normalize_for_match(pt_title)
        
        if not pt_norm:
            continue
        
        # Find best match
        best_match = None
        best_score = 0
        best_idx = -1
        
        for idx, (ja_norm, ja_sec) in enumerate(ja_normalized):
            if idx in used_indices:
                continue
            
            # Calculate similarity (simple character overlap)
            if len(pt_norm) < 5 or len(ja_norm) < 3:
                continue
            
            # Check for substring match
            if pt_norm in ja_norm or ja_norm in pt_norm:
                score = min(len(pt_norm), len(ja_norm)) / max(len(pt_norm), len(ja_norm))
                if score > best_score:
                    best_score = score
                    best_match = ja_sec
                    best_idx = idx
        
        # Apply match if good enough
        if best_match and best_score > 0.3:
            item['title_ja'] = best_match['title_ja']
            item['content_ja'] = best_match['content_ja']
            used_indices.add(best_idx)
            updated += 1
            
            if debug and updated <= 5:
                print(f"  ✓ [{best_score:.2f}] {pt_title[:40]}... -> {best_match['title_ja'][:40]}...")
    
    return updated

def populate_volume(vol_name, debug=False):
    """Populate a single volume"""
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
    
    # Parse JA content
    ja_content = ref_data.get('content', {}).get('japones', '')
    ja_sections = parse_bold_sections(ja_content)
    
    print(f"  JSON items: {len(vol_data)}")
    print(f"  JA bold sections found: {len(ja_sections)}")
    
    # Match
    updated = match_sections(vol_data, ja_sections, debug=debug)
    
    # Save
    with open(vol_file, 'w', encoding='utf-8') as f:
        json.dump(vol_data, f, indent=2, ensure_ascii=False)
    
    # Stats
    ja_count = sum(1 for item in vol_data if item.get('content_ja'))
    coverage = (ja_count / len(vol_data) * 100) if len(vol_data) > 0 else 0
    
    print(f"\n  Results:")
    print(f"    Updated: {updated} items")
    print(f"    Total with JA: {ja_count}/{len(vol_data)} ({coverage:.1f}%)")
    
    return {
        'volume': vol_name,
        'updated': updated,
        'total': len(vol_data),
        'ja_count': ja_count,
        'coverage': coverage
    }

def main():
    print("🔧 POPULATING VOLUMES WITH BOLD FORMAT (03, 08, 09)")
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
    
    for r in results:
        status = '✅' if r['coverage'] > 80 else '⚠️' if r['coverage'] > 30 else '❌'
        before = r['ja_count'] - r['updated']
        print(f"{status} {r['volume']:20s}: {before:3d} -> {r['ja_count']:3d}/{r['total']:3d} ({r['coverage']:5.1f}%) [+{r['updated']}]")

if __name__ == "__main__":
    main()
