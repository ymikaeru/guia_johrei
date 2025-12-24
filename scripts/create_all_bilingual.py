#!/usr/bin/env python3
"""
General Bilingual JSON Generator
Processes all book pairs from MD_Portugues and MD_Original directories.
"""

import os
import json
import re
from pathlib import Path

# Import parsing functions from merge_johrei_volumes
import sys
sys.path.insert(0, os.path.dirname(__file__))
from merge_johrei_volumes import parse_pt_file, parse_jp_file, align_items

# Book pair mappings
BOOK_PAIRS = [
    # Johrei Ho Kohza volumes
    ("Johrei Ho Kohza (1).md", "浄霊法講座1.md", "johrei_vol01_bilingual.json"),
    ("Johrei Ho Kohza (2).md", "浄霊法講座2.md", "johrei_vol02_bilingual.json"),
    ("Johrei Ho Kohza (3).md", "浄霊法講座3.md", "johrei_vol03_bilingual.json"),
    ("Johrei Ho Kohza (4).md", "浄霊法講座4.md", "johrei_vol04_bilingual.json"),
    ("Johrei Ho Kohza (5).md", "浄霊法講座5.md", "johrei_vol05_bilingual.json"),
    ("Johrei Ho Kohza (6).md", "浄霊法講座6.md", "johrei_vol06_bilingual.json"),
    ("Johrei Ho Kohza (7).md", "浄霊法講座7.md", "johrei_vol07_bilingual.json"),
    ("Johrei Ho Kohza (8).md", "浄霊法講座8.md", "johrei_vol08_bilingual.json"),
    ("Johrei Ho Kohza (9).md", "浄霊法講座9.md", "johrei_vol09_bilingual.json"),
    ("Johrei Ho Kohza (10).md", "浄霊法講座10.md", "johrei_vol10_bilingual.json"),
    # Pontos Focais
    ("Pontos Focais 01_Prompt v5.md", "各論.md", "pontos_focais_vol01_bilingual.json"),
    ("Pontos Focais 02_Prompt v5.md", "各論２.md", "pontos_focais_vol02_bilingual.json"),
]

def extract_book_name(filepath):
    """Extract book name from H1 or H2 header."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # Match H1 or H2
                if line.startswith('# ') or line.startswith('## '):
                    # Remove markdown headers and clean
                    name = re.sub(r'^#+\s*', '', line)
                    name = name.strip()
                    return name
    except Exception as e:
        print(f"  Warning: Could not extract book name from {filepath}: {e}")
    
    # Fallback: use filename
    return Path(filepath).stem

def process_book_pair(pt_file, jp_file, output_file, base_dir):
    """Process a single book pair and generate bilingual JSON."""
    pt_path = base_dir / "Markdown" / "MD_Portugues" / pt_file
    jp_path = base_dir / "Markdown" / "MD_Original" / jp_file
    output_path = base_dir / "data" / output_file
    
    print(f"\nProcessing: {pt_file} + {jp_file}")
    
    # Extract book names
    book_name_pt = extract_book_name(pt_path)
    book_name_jp = extract_book_name(jp_path)
    
    print(f"  PT Name: {book_name_pt}")
    print(f"  JP Name: {book_name_jp}")
    
    # Parse files
    pt_items = parse_pt_file(str(pt_path))
    jp_items = parse_jp_file(str(jp_path))
    
    print(f"  Found {len(pt_items)} PT items and {len(jp_items)} JP items")
    
    # Align items (returns two separate lists)
    aligned_pt, aligned_jp = align_items(pt_items, jp_items)
    
    print(f"  Aligned to {len(aligned_pt)} items")
    
    # Extract volume number from filename
    vol_match = re.search(r'(\d+)', pt_file)
    volume = vol_match.group(1) if vol_match else "1"
    
    # Create bilingual JSON structure
    result = []
    for i in range(len(aligned_pt)):
        pt = aligned_pt[i]
        jp = aligned_jp[i]
        
        # Generate ID from output filename
        book_id = output_file.replace('_bilingual.json', '').replace('_', '')
        item_id = f"{book_id}_{i+1:02d}"
        
        entry = {
            "id": item_id,
            "book_name_pt": book_name_pt,
            "book_name_jp": book_name_jp,
            "volume": volume,
            "order": i + 1,
            "label_pt": pt.get('label', ''),
            "title_pt": pt.get('title', ''),
            "content_pt": pt.get('content', ''),
            "label_jp": jp.get('label', ''),
            "title_jp": jp.get('title', ''),
            "content_jp": jp.get('content', ''),
            "section_pt": pt.get('section', ''),
            "section_jp": jp.get('section', '')
        }
        result.append(entry)
    
    # Write JSON
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"  ✓ Created {output_file} with {len(result)} items")
    return len(result)

def main():
    base_dir = Path(__file__).parent.parent
    
    print("=" * 60)
    print("General Bilingual JSON Generator")
    print("=" * 60)
    
    total_books = 0
    total_items = 0
    
    for pt_file, jp_file, output_file in BOOK_PAIRS:
        try:
            count = process_book_pair(pt_file, jp_file, output_file, base_dir)
            total_books += 1
            total_items += count
        except Exception as e:
            print(f"  ✗ Error processing {pt_file}: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 60)
    print(f"Summary: Processed {total_books} books, generated {total_items} total items")
    print("=" * 60)

if __name__ == "__main__":
    main()
