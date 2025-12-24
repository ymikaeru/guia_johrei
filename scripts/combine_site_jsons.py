#!/usr/bin/env python3
"""
Combine All Site JSONs into Single File
Creates a master JSON file for the website
"""

import json
from pathlib import Path

def combine_all_site_jsons():
    """Combine all *_site.json files into one master file."""
    base_dir = Path(__file__).parent.parent / "data"
    site_files = sorted(base_dir.glob("*_site.json"))
    
    print("=" * 60)
    print("Combining Site JSONs")
    print("=" * 60)
    
    all_items = []
    
    for site_file in site_files:
        print(f"\nLoading: {site_file.name}")
        with open(site_file, 'r', encoding='utf-8') as f:
            items = json.load(f)
            all_items.extend(items)
            print(f"  ✓ Added {len(items)} items")
    
    # Save combined file
    output_file = base_dir / "guia_johrei_complete.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 60)
    print(f"Summary:")
    print(f"  Source files: {len(site_files)}")
    print(f"  Total items: {len(all_items)}")
    print(f"  Output: {output_file.name}")
    print("=" * 60)
    
    return all_items

if __name__ == "__main__":
    combine_all_site_jsons()
