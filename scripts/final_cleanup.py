#!/usr/bin/env python3
"""
Final cleanup: populate remaining items that have JA equivalents
Focus on unnumbered sections and section headers
"""
import json
import re

def populate_section_headers_vol07():
    """Populate section header items for Vol.07"""
    with open('data/johrei_vol07.json', 'r') as f:
        vol07 = json.load(f)
    
    with open('data_reference/johrei_vol07_ref.json', 'r') as f:
        ref = json.load(f)
    
    ja_content = ref.get('content', {}).get('japones', '')
    
    # Manual mapping for section headers
    mappings = {
        'item_001': {  # Curso de Johrei (VII)
            'title_ja': '浄霊法講座（七）（婦　人　病）',
            'content_ja': ''  # Title only, no content
        },
        'item_003': {  # Primeira Parte (already has JA from previous run)
            'title_ja': '**一、第一部**',
            'content_ja': vol07[2].get('content_ja', '')  # Use existing from item_003
        }
    }
    
    # Extract titles that don't have numbers
    bold_sections = re.findall(r'\*\*([^*]+)\*\*', ja_content)
    
    # Find "Segunda Parte" equivalent
    for sec in bold_sections:
        if '二、第二部' in sec or '第二部' in sec:
            # Find item_022 (Segunda Parte)
            for item in vol07:
                if item['id'] == 'item_022':
                    item['title_ja'] = sec
                    item['content_ja'] = ''
                    print(f"✓ Populated item_022 (Segunda Parte) -> {sec}")
    
    # Apply mappings
    for item in vol07:
        if item['id'] in mappings:
            item.update(mappings[item['id']])
            print(f"✓ Populated {item['id']}: {item.get('title_pt', '')}")
    
    # Save
    with open('data/johrei_vol07.json', 'w') as f:
        json.dump(vol07, f, indent=2, ensure_ascii=False)
    
    ja_count = sum(1 for item in vol07 if item.get('content_ja') or item.get('title_ja'))
    return ja_count, len(vol07)

def populate_section_headers_vol08():
    """Populate section header items for Vol.08"""
    with open('data/johrei_vol08.json', 'r') as f:
        vol08 = json.load(f)
    
    with open('data_reference/johrei_vol08_ref.json', 'r') as f:
        ref = json.load(f)
    
    ja_content = ref.get('content', {}).get('japones', '')
    
    # Extract section headers (the ones without numbers)
    bold_sections = re.findall(r'\*\*([^*]+)\*\*', ja_content)
    
    # Manual mapping
    mappings = {
        'item_002': '一　、　胃　　　疾　　　患',  # I. Doenças Gástricas
        'item_018': None  # Need to find II. Enfermidades Abdominais
    }
    
    # Search for section headers
    for sec in bold_sections[:10]:
        print(f"  Checking: {sec}")
        if '二' in sec and ('腹' in sec or '膜' in sec):
            mappings['item_018'] = sec
    
    # Apply mappings
    for item in vol08:
        if item['id'] in mappings and mappings[item['id']]:
            item['title_ja'] = mappings[item['id']]
            item['content_ja'] = ''  # Section headers have no content
            print(f"✓ Populated {item['id']}: {item.get('title_pt', '')} -> {item['title_ja']}")
    
    # Save
    with open('data/johrei_vol08.json', 'w') as f:
        json.dump(vol08, f, indent=2, ensure_ascii=False)
    
    ja_count = sum(1 for item in vol08 if item.get('content_ja') or item.get('title_ja'))
    return ja_count, len(vol08)

def main():
    print("🔧 FINAL CLEANUP - POPULATING SECTION HEADERS")
    print("=" * 60)
    
    print("\\nVol.07:")
    ja07, total07 = populate_section_headers_vol07()
    print(f"  Result: {ja07}/{total07} ({ja07/total07*100:.1f}%)")
    
    print("\\nVol.08:")
    ja08, total08 = populate_section_headers_vol08()
    print(f"  Result: {ja08}/{total08} ({ja08/total08*100:.1f}%)")
    
    print("\\n" + "=" * 60)
    print("📝 NOTE: Vol.09 missing items are bibliographic citations")
    print("   These are just source references and don't need JA content.")
    print("=" * 60)

if __name__ == "__main__":
    main()
