#!/usr/bin/env python3
"""
Phase 3: Rebuild JSON files from reference files
Creates perfectly aligned PT-JP content with preserved metadata
"""
import json
import glob
import re
from pathlib import Path

def normalize_title(text):
    """Normalize title for matching"""
    if not text:
        return ""
    t = text.lower()
    t = t.replace('\\\\', '')
    t = re.sub(r'^[\d０-９]+[、。．.\\s）\)]+', '', t)
    t = re.sub(r'[^a-z0-9ぁ-んァ-ヶー一-龯]', '', t)
    return t

def parse_markdown_content(content, lang='pt'):
    """
    Parse markdown content into sections
    Handles: ## Title, ### Title, **Title**, and numbered **N、Title**
    Returns list of {title, content} dicts
    """
    if not content:
        return []
    
    sections = []
    
    # Use regex to find all section boundaries
    # Pattern matches: ## Title, ### Title, **Title**
    pattern = r'(^#{2,3}\s+.+$|^\*\*[^*]+\*\*\s*$)'
    
    matches = list(re.finditer(pattern, content, re.MULTILINE))
    
    if not matches:
        # No sections found, treat entire content as one section
        return [{'title': 'Content', 'content': content.strip()}]
    
    for i, match in enumerate(matches):
        # Extract title
        title_line = match.group(0).strip()
        
        # Clean title
        if title_line.startswith('#'):
            title = re.sub(r'^#{2,3}\s+', '', title_line).strip()
        elif title_line.startswith('**'):
            title = title_line.strip('*').strip()
        else:
            title = title_line
        
        # Extract content (from after this title to before next title)
        content_start = match.end()
        if i < len(matches) - 1:
            content_end = matches[i + 1].start()
        else:
            content_end = len(content)
        
        section_content = content[content_start:content_end].strip()
        
        # Only add if there's actual content or if it's the first section
        if section_content or i == 0:
            sections.append({
                'title': title,
                'content': section_content
            })
    
    return sections

def match_metadata(title, source, metadata_index):
    """Find metadata for a given title and source"""
    title_norm = normalize_title(title)
    
    # Try exact match with source
    key = f"{source}::{title_norm}"
    if key in metadata_index:
        return metadata_index[key]
    
    # Try without source
    if title_norm in metadata_index:
        return metadata_index[title_norm]
    
    # Try fuzzy match
    for key, meta in metadata_index.items():
        if title_norm in key or normalize_title(meta['original_title']) == title_norm:
            return meta
    
    return None

def rebuild_file(ref_file, metadata_index, output_dir='data_rebuilt'):
    """Rebuild a single JSON file from reference"""
    ref_path = Path(ref_file)
    filename = ref_path.name.replace('_ref.json', '.json')
    
    print(f"\n{'='*60}")
    print(f"Rebuilding: {filename}")
    print('='*60)
    
    # Load reference
    with open(ref_file, 'r', encoding='utf-8') as f:
        ref = json.load(f)
    
    # Parse PT and JA content
    pt_content = ref.get('content', {}).get('portugues', '')
    ja_content = ref.get('content', {}).get('japones', '')
    
    pt_sections = parse_markdown_content(pt_content, 'pt')
    ja_sections = parse_markdown_content(ja_content, 'ja')
    
    print(f"  PT sections: {len(pt_sections)}")
    print(f"  JA sections: {len(ja_sections)}")
    
    # Get source from metadata
    source = ref.get('metadata', {}).get('description', '')
    
    # Build items
    items = []
    for i, pt_sec in enumerate(pt_sections):
        # Create base item
        item = {
            'id': f'item_{str(i+1).zfill(3)}',
            'title': pt_sec['title'],
            'content': pt_sec['content'],
            'source': source,
            'tags': [],
            'focusPoints': [],
            'order': i + 1,
            'type': 'teaching'
        }
        
        # Add JA content if available (align by index)
        if i < len(ja_sections):
            item['title_ja'] = ja_sections[i]['title']
            item['content_ja'] = ja_sections[i]['content']
        else:
            item['title_ja'] = ''
            item['content_ja'] = ''
        
        # Try to match metadata
        meta = match_metadata(pt_sec['title'], source, metadata_index)
        if meta:
            item['tags'] = meta['tags']
            item['focusPoints'] = meta['focusPoints']
            item['type'] = meta['type']
            # Keep order from new structure, not old
        
        items.append(item)
    
    # Save
    Path(output_dir).mkdir(exist_ok=True)
    output_file = Path(output_dir) / filename
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(items, f, indent=2, ensure_ascii=False)
    
    # Stats
    with_ja = sum(1 for item in items if item.get('content_ja'))
    with_tags = sum(1 for item in items if item.get('tags') and len(item['tags']) > 0)
    with_focus = sum(1 for item in items if item.get('focusPoints') and len(item['focusPoints']) > 0)
    
    print(f"\n  Results:")
    print(f"    Items created: {len(items)}")
    print(f"    With JA content: {with_ja} ({with_ja/len(items)*100:.1f}%)")
    print(f"    With tags: {with_tags} ({with_tags/len(items)*100:.1f}%)")
    print(f"    With focusPoints: {with_focus} ({with_focus/len(items)*100:.1f}%)")
    
    return {
        'file': filename,
        'items': len(items),
        'ja_coverage': with_ja / len(items) * 100 if items else 0,
        'tags_coverage': with_tags / len(items) * 100 if items else 0,
        'focus_coverage': with_focus / len(items) * 100 if items else 0
    }

def main():
    print("🔧 REBUILDING ALL JSON FILES FROM REFERENCE")
    print("=" * 60)
    
    # Load metadata index
    with open('metadata_index.json', 'r', encoding='utf-8') as f:
        metadata_index = json.load(f)
    
    print(f"\n✅ Loaded metadata index: {len(metadata_index)} entries")
    
    # Get all reference files
    ref_files = glob.glob('data_reference/*_ref.json')
    
    print(f"✅ Found {len(ref_files)} reference files")
    
    # Rebuild all
    results = []
    for ref_file in sorted(ref_files):
        try:
            result = rebuild_file(ref_file, metadata_index)
            results.append(result)
        except Exception as e:
            print(f"\n❌ Error processing {ref_file}: {e}")
            import traceback
            traceback.print_exc()
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 REBUILD SUMMARY")
    print('='*60)
    
    for r in results:
        status = '✅' if r['ja_coverage'] > 80 else '⚠️' if r['ja_coverage'] > 30 else '❌'
        print(f"{status} {r['file']:30s}: {r['items']:3d} items | JA: {r['ja_coverage']:5.1f}% | Tags: {r['tags_coverage']:5.1f}%")
    
    total_items = sum(r['items'] for r in results)
    print(f"\n✨ Total: {len(results)} files, {total_items} items")

if __name__ == "__main__":
    main()
