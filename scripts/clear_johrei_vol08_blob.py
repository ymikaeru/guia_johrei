
import json
import os

FILE_PATH = "/Users/michael/Documents/Ensinamentos/guia_johrei/data/johrei_vol08.json"

def clean_johrei_vol08():
    if not os.path.exists(FILE_PATH):
        print(f"File not found: {FILE_PATH}")
        return

    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Loaded {len(data)} items.")

    # Specific fix for item_001 which has the blob
    if len(data) > 0:
        item = data[0]
        if item.get('id') == 'item_001':
            print("Found item_001.")
            content_ja = item.get('content_ja', '')
            if len(content_ja) > 1000: # Heuristic for "blob"
                print(f"Found massive content_ja ({len(content_ja)} chars). Clearing it.")
                item['content_ja'] = ""
                # Also check title_ja if it seems misplaced (it was "一　、　胃　　　疾　　　患")
                # Item 1 is "Curso de Johrei (VIII)", so this title might be wrong for Item 1
                # but let's just clear the content blob for now as that's the main visual bug.
                # Actually, let's clear title_ja too if it looks like a chapter title on the main book item.
                # But maybe user wants to keep the title? 
                # The prompt said "blob corruption". The content is the blob.
                # I'll clear content_ja.
            else:
                print("Content length normal, skipping clear.")
    
    # Check if other items have this issue (unlikely based on my view)
    
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Saved fixed file.")

if __name__ == "__main__":
    clean_johrei_vol08()
