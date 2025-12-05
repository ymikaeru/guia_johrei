#!/usr/bin/env python3
"""
Tag Enhancement Script - Phase 1: Immediate Actions
Implements high-impact improvements to the tag system:
1. Merge duplicate/similar tags
2. Add specific condition tags based on content analysis
3. Separate content-type tags to a 'type' field
"""

import json
import re
from pathlib import Path
from collections import Counter
import sys

# Tag consolidation mapping
TAG_CONSOLIDATION = {
    'Digestivo': 'Sistema Digestivo',
    'Renal e Urinário': 'Rins e Sistema Urinário',
    'Olhos e Ouvidos': 'Visão e Audição',  # More specific merger
}

# Content type tags to move to 'type' field
CONTENT_TYPE_TAGS = ['Q&A', 'Caso Clínico']

# Medical condition keywords to auto-tag
CONDITION_KEYWORDS = {
    'Diabetes': ['diabetes', 'diabético', 'diabética', 'glicose alta'],
    'Asma': ['asma', 'asmático', 'asmática', 'broncoespasmo'],
    'Hipertensão': ['hipertensão', 'pressão alta', 'hipertensivo', 'hipertensiva'],
    'Derrame (AVC)': ['derrame', 'avc', 'apoplexia', 'acidente vascular'],
    'Neuralgia': ['neuralgia', 'neurálgico', 'neurálgica', 'dor no nervo'],
    'Artrite': ['artrite', 'artrítico', 'artrítica', 'inflamação articular'],
    'Anemia': ['anemia', 'anêmico', 'anêmica', 'falta de sangue'],
}

def normalize_text(text):
    """Normalize text for matching"""
    return text.lower().strip()

def should_add_condition_tag(content, keywords):
    """Check if content mentions condition keywords"""
    content_normalized = normalize_text(content)
    return any(keyword in content_normalized for keyword in keywords)

def consolidate_tags(tags):
    """Replace tags with their consolidated versions"""
    consolidated = []
    for tag in tags:
        # Replace with consolidated version if exists
        new_tag = TAG_CONSOLIDATION.get(tag, tag)
        consolidated.append(new_tag)
    
    # Remove duplicates while preserving order
    seen = set()
    result = []
    for tag in consolidated:
        if tag not in seen:
            seen.add(tag)
            result.append(tag)
    
    return result

def extract_content_type(tags):
    """Extract content type tags and return (type, remaining_tags)"""
    content_type = None
    remaining_tags = []
    
    for tag in tags:
        if tag in CONTENT_TYPE_TAGS:
            if content_type is None:  # Take first content type found
                content_type = tag
        else:
            remaining_tags.append(tag)
    
    return content_type, remaining_tags

def add_condition_tags(item):
    """Add missing condition tags based on content analysis"""
    content = item.get('title', '') + ' ' + item.get('content', '')
    existing_tags = set(item.get('tags', []))
    new_tags = []
    
    for condition, keywords in CONDITION_KEYWORDS.items():
        if condition not in existing_tags and should_add_condition_tag(content, keywords):
            new_tags.append(condition)
    
    return new_tags

def process_item(item):
    """Process a single item: consolidate tags, extract type, add condition tags"""
    tags = item.get('tags', [])
    
    # 1. Consolidate duplicate tags
    tags = consolidate_tags(tags)
    
    # 2. Extract content type
    content_type, tags = extract_content_type(tags)
    
    # 3. Add condition tags
    new_condition_tags = add_condition_tags(item)
    tags.extend(new_condition_tags)
    
    # Update item
    item['tags'] = tags
    if content_type:
        item['type'] = content_type
    
    return item, len(new_condition_tags) > 0, content_type is not None

def process_file(filepath):
    """Process a single JSON file"""
    print(f"\nProcessing: {filepath.name}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        items = json.load(f)
    
    stats = {
        'total': len(items),
        'tags_consolidated': 0,
        'types_extracted': 0,
        'conditions_added': 0,
    }
    
    processed_items = []
    for item in items:
        processed_item, had_new_conditions, had_type_extracted = process_item(item)
        processed_items.append(processed_item)
        
        if had_new_conditions:
            stats['conditions_added'] += 1
        if had_type_extracted:
            stats['types_extracted'] += 1
    
    # Count tag consolidations by comparing before/after
    original_tags = Counter()
    final_tags = Counter()
    
    for item in items:
        for tag in item.get('tags', []):
            original_tags[tag] += 1
    
    for item in processed_items:
        for tag in item.get('tags', []):
            final_tags[tag] += 1
    
    # Consolidations = tags that disappeared
    for old_tag in TAG_CONSOLIDATION.keys():
        if old_tag in original_tags and old_tag not in final_tags:
            stats['tags_consolidated'] += original_tags[old_tag]
    
    print(f"  Total items: {stats['total']}")
    print(f"  Tags consolidated: {stats['tags_consolidated']} instances")
    print(f"  Content types extracted: {stats['types_extracted']}")
    print(f"  Condition tags added: {stats['conditions_added']}")
    
    return processed_items, stats

def main():
    data_dir = Path('data')
    
    # Files to process
    files = ['fundamentos.json', 'curas.json', 'pontos_focais.json']
    
    print("=" * 60)
    print("Tag Enhancement Script - Phase 1")
    print("=" * 60)
    
    # Dry run first
    print("\n--- DRY RUN (no changes will be saved) ---")
    
    all_stats = {'total': 0, 'tags_consolidated': 0, 'types_extracted': 0, 'conditions_added': 0}
    results = {}
    
    for filename in files:
        filepath = data_dir / filename
        if not filepath.exists():
            print(f"Warning: {filename} not found, skipping...")
            continue
        
        processed_items, stats = process_file(filepath)
        results[filename] = processed_items
        
        for key in all_stats:
            all_stats[key] += stats[key]
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total items processed: {all_stats['total']}")
    print(f"Total tag consolidations: {all_stats['tags_consolidated']}")
    print(f"Total types extracted: {all_stats['types_extracted']}")
    print(f"Total condition tags added: {all_stats['conditions_added']}")
    
    # Ask for confirmation
    print("\n" + "=" * 60)
    response = input("Apply these changes? (yes/no): ").strip().lower()
    
    if response == 'yes':
        print("\nApplying changes...")
        for filename, processed_items in results.items():
            filepath = data_dir / filename
            
            # Backup original
            backup_path = filepath.with_suffix('.json.backup')
            with open(filepath, 'r', encoding='utf-8') as f:
                original_content = f.read()
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(original_content)
            print(f"  Backed up {filename} to {backup_path.name}")
            
            # Write new version
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(processed_items, f, ensure_ascii=False, indent=2)
            print(f"  Updated {filename}")
        
        print("\n✅ Changes applied successfully!")
        print("Backups created with .backup extension")
    else:
        print("\n❌ Changes cancelled. No files were modified.")

if __name__ == '__main__':
    main()
