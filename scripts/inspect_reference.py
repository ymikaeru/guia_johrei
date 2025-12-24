import json
import re

def inspect_reference(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    content_ja = data['content']['japones']
    
    # Extract item_002 section
    # Based on title "病気とは何ぞや"
    
    # Find start
    match = re.search(r'#\s*\*\*一、病気とは何ぞや\*\*', content_ja)
    if not match:
        print("Could not find start")
        return

    start_idx = match.end()
    
    # Find next header (starts with #)
    next_header = re.search(r'\n#\s', content_ja[start_idx:])
    if next_header:
        end_idx = start_idx + next_header.start()
        section = content_ja[start_idx:end_idx]
    else:
        section = content_ja[start_idx:]
        
    paragraphs = [p for p in section.split('\n\n') if p.strip()]
    print(f"Found {len(paragraphs)} paragraphs in data_reference for item_002")
    for i, p in enumerate(paragraphs):
        print(f"--- Para {i+1} ---")
        print(p[:50] + "...")

inspect_reference('/Users/michael/Documents/Ensinamentos/guia_johrei/data_reference/johrei_vol01_ref.json')
