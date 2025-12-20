import json
import re

def inspect_reference_pt(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    content_pt = data['content']['portugues']
    
    # Extract item_002 section
    # Based on title "O Que é a Doença"
    
    # Find start: "##  O Que é a Doença" (Note double space in previous cat? Or just check "## O Que")
    # In file view it was: "##  O Que é a Doença"
    
    match = re.search(r'##\s+O Que é a Doença', content_pt)
    if not match:
        print("Could not find start")
        return

    start_idx = match.end()
    
    # Find next header (starts with ##)
    next_header = re.search(r'\n##\s', content_pt[start_idx:])
    if next_header:
        end_idx = start_idx + next_header.start()
        section = content_pt[start_idx:end_idx]
    else:
        section = content_pt[start_idx:]
        
    paragraphs = [p for p in section.split('\n\n') if p.strip()]
    print(f"Found {len(paragraphs)} paragraphs in data_reference PT for item_002")
    # for i, p in enumerate(paragraphs):
    #     print(f"--- Para {i+1} ---")
    #     print(p[:50] + "...")

inspect_reference_pt('/Users/michael/Documents/Ensinamentos/guia_johrei/data_reference/johrei_vol01_ref.json')
