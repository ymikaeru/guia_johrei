import json
import re
import os

def process_volume(file_path):
    print(f"Processing {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return

    current_master_title = None
    
    # Regex to catch "1. Title" or "### I. Title" or "I. Title"
    # Group 1: Optional ###
    # Group 2: Numeral (Arabic or Roman) + dot
    # Group 3: Rest of title
    pattern = re.compile(r'^\s*(#{1,6}\s*)?((?:[0-9]+|[IVXLCDM]+)\.)\s*(.*)')

    updated_count = 0
    
    for item in data:
        title = item.get('title_pt', '')
        # Clean title for checking (remove bolding if any, though usually not in title_pt keys for Vol 1/2 as seen)
        # Vol 1 example: "1. O que é a Doença"
        # Vol 2 example: "### I. A Racionalidade do Johrei"
        
        match = pattern.match(title)
        if match:
            # Found a new master section
            clean_numeral = match.group(2)
            clean_text = match.group(3)
            # We reconstruct the master title without markdown ### but keeping the numeral
            new_master_title = f"{clean_numeral} {clean_text}".strip()
            
            # Additional cleanup if needed (e.g. remove ** ** markdown if present)
            new_master_title = new_master_title.replace('**', '')
            
            current_master_title = new_master_title
        
        if current_master_title:
            item['master_title'] = current_master_title
            updated_count += 1
        else:
            # If no master title found yet (e.g. intro items), leaving it empty or null?
            # Based on previous logic, we might imply "Introdução" or leave it.
            # We will set it to None or skip. 
            # Consistency: if other volumes have it, likely string.
            item['master_title'] = None # Explicitly showing no master title

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {updated_count} items in {file_path}")

def main():
    base_dir = '/Users/michael/Documents/Ensinamentos/guia_johrei/data'
    files = [
        'johrei_vol01_bilingual.json',
        'johrei_vol02_bilingual.json'
    ]
    
    for filename in files:
        file_path = os.path.join(base_dir, filename)
        process_volume(file_path)

if __name__ == "__main__":
    main()
