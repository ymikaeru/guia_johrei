#!/usr/bin/env python3
"""
Universal script to analyze and populate ALL johrei volumes
using data_reference files
"""
import json
import glob
import re
import os

def parse_markdown_sections(md_text, debug=False):
    """
    Parse markdown sections with multiple header formats:
    - # Header
    - ## Header  
    - ### Header
    - **Header** (bold without #)
    - **N、Header** (numbered bold)
    """
    items = []
    lines = md_text.split('\n')
    
    current_title = ""
    current_content = []
    
    for line in lines:
        line_stripped = line.strip()
        
        # Match different header patterns
        # 1. Standard markdown headers (# ## ###)
        markdown_header = re.match(r'^(#{1,3})\s+(.+)', line_stripped)
        
        # 2. Bold headers **Title**
        bold_header = re.match(r'^\*\*([^*]+)\*\*\s*$', line_stripped)
        
        if markdown_header or bold_header:
            # Save previous section
            if current_title:
                items.append({
                    'title': current_title,
                    'content': '\n'.join(current_content).strip()
                })
            
            # Start new section
            if markdown_header:
                current_title = markdown_header.group(2).strip()
            else:
                current_title = bold_header.group(1).strip()
            
            current_content = []
            
            if debug and len(items) < 5:
                print(f"  Found header: {current_title}")
        else:
            current_content.append(line)
    
    # Save last section
    if current_title:
        items.append({
            'title': current_title,
            'content': '\n'.join(current_content).strip()
        })
    
    return items

def normalize_title(text):
    """Normalize title for matching"""
    if not text:
        return ""
    
    t = text.lower()
    # Remove escaped backslashes
    t = t.replace('\\\\', '')
    # Remove leading numbers and punctuation
    t = re.sub(r'^[\d０-９]+[、。．.\\s]+', '', t)
    # Remove all special characters
    t = re.sub(r'[^a-z0-9ぁ-んァ-ヶー一-龯]', '', t)
    
    return t

def find_best_match(pt_title, ja_titles):
    """Find best matching Japanese title for Portuguese title"""
    pt_norm = normalize_title(pt_title)
    
    if not pt_norm:
        return None
    
    # Try exact normalized match first
    for i, ja_title in enumerate(ja_titles):
        ja_norm = normalize_title(ja_title)
        if pt_norm == ja_norm:
            return i
    
    # Try partial match (for longer titles)
    if len(pt_norm) > 10:
        for i, ja_title in enumerate(ja_titles):
            ja_norm = normalize_title(ja_title)
            if pt_norm in ja_norm or ja_norm in pt_norm:
                similarity = len(set(pt_norm) & set(ja_norm)) / max(len(pt_norm), len(ja_norm))
                if similarity > 0.6:
                    return i
    
    return None

def populate_volume(vol_name, debug=False):
    """Populate a single volume"""
    vol_file = f'data/{vol_name}.json'
    ref_file = f'data_reference/{vol_name}_ref.json'
    
    if not os.path.exists(vol_file) or not os.path. exists(ref_file):
        return None
    
    print(f"\n{'='*60}")
    print(f"Processing {vol_name}")
    print(f"{'='*60}")
    
    # Load files
    with open(vol_file, 'r', encoding='utf-8') as f:
        vol_data = json.load(f)
    
    with open(ref_file, 'r', encoding='utf-8') as f:
        ref_data = json.load(f)
    
    # Parse reference content
    pt_content = ref_data.get('content', {}).get('portugues', '')
    ja_content = ref_data.get('content', {}).get('japones', '')
    
    pt_sections = parse_markdown_sections(pt_content)
    ja_sections = parse_markdown_sections(ja_content, debug=debug)
    
    print(f"  PT sections: {len(pt_sections)}")
    print(f"  JA sections: {len(ja_sections)}")
    print(f"  JSON items: {len(vol_data)}")
    
    # Try to match by order first (if counts match)
    updated = 0
    matched_by_order = 0
    matched_by_title = 0
    
    if len(pt_sections) == len(ja_sections) == len(vol_data):
        # Perfect alignment - use order
        print("  Strategy: Order-based (1:1:1 alignment)")
        for i, (item, pt_sec, ja_sec) in enumerate(zip(vol_data, pt_sections, ja_sections)):
            item['title_ja'] = ja_sec['title']
            item['content_ja'] = ja_sec['content']
            updated += 1
            matched_by_order += 1
    else:
        # Use title matching
        print("  Strategy: Title-based matching")
        
        ja_titles = [sec['title'] for sec in ja_sections]
        used_ja_indices = set()
        
        for item in vol_data:
            pt_title = item.get('title') or item.get('title_pt') or ''
            
            # Find matching JA section
            ja_idx = find_best_match(pt_title, ja_titles)
            
            if ja_idx is not None and ja_idx not in used_ja_indices:
                item['title_ja'] = ja_sections[ja_idx]['title']
                item['content_ja'] = ja_sections[ja_idx]['content']
                used_ja_indices.add(ja_idx)
                updated += 1
                matched_by_title += 1
                
                if debug and updated <= 3:
                    print(f"    ✓ Matched: {pt_title[:50]}... -> {ja_sections[ja_idx]['title'][:50]}...")
    
    # Save
    with open(vol_file, 'w', encoding='utf-8') as f:
        json.dump(vol_data, f, indent=2, ensure_ascii=False)
    
    # Stats
    ja_count = sum(1 for item in vol_data if item.get('content_ja'))
    coverage = (ja_count / len(vol_data) * 100) if len(vol_data) > 0 else 0
    
    print(f"\n  Results:")
    print(f"    Updated: {updated} items")
    print(f"    Matched by order: {matched_by_order}")
    print(f"    Matched by title: {matched_by_title}")
    print(f"    Total with JA: {ja_count}/{len(vol_data)} ({coverage:.1f}%)")
    
    return {
        'volume': vol_name,
        'updated': updated,
        'total': len(vol_data),
        'ja_count': ja_count,
        'coverage': coverage
    }

def main():
    print("🔧 UNIVERSAL JOHREI VOLUMES POPULATION SCRIPT")
    print("=" * 60)
    
    # Find all volumes with low coverage
    volumes_to_process = [
        'johrei_vol03',
        'johrei_vol08',
        'johrei_vol09',
    ]
    
    results = []
    for vol_name in volumes_to_process:
        result = populate_volume(vol_name, debug=False)
        if result:
            results.append(result)
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 SUMMARY")
    print(f"{'='*60}")
    
    for r in results:
        status = '✅' if r['coverage'] > 80 else '⚠️' if r['coverage'] > 30 else '❌'
        print(f"{status} {r['volume']:20s}: {r['ja_count']:3d}/{r['total']:3d} ({r['coverage']:5.1f}%) [+{r['updated']} updated]")

if __name__ == "__main__":
    main()
