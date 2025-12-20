import re
import json
import os

def add_vol_08():
    file_path = '/Users/michael/Documents/Ensinamentos/guia_johrei/Docx_Original/- 浄霊法講座 08 (Curso de Johrei).md'
    fundamentos_path = '/Users/michael/Documents/Ensinamentos/guia_johrei/data/fundamentos.json'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    extracted_items = []
    
    # Regex for sections: ### 1. Title or ### 1\. Title
    # Capture number and title
    section_pattern = re.compile(r'^###\s*(\d+)[\.\\]+\s*(.+)$')
    
    current_item = None
    buffer_content = []
    
    def save_item():
        if current_item:
            content = '\n'.join(buffer_content).strip()
            if content:
                current_item['content'] = content
                extracted_items.append(current_item)
    
    for line in lines:
        line_stripped = line.strip()
        
        match = section_pattern.match(line_stripped)
        if match:
            save_item()
            buffer_content = []
            
            num = int(match.group(1))
            title = match.group(2).strip()
            
            # Create ID and structure
            current_item = {
                "id": f"johrei_vol08_{num:02d}",
                "title": title,
                "content": "", # Filled later
                "source": "Johrei Hō Kōza Vol.08",
                "tags": [], # Empty for now
                "order": 8000 + num, # Arbitrary base + num to ensure sorting
                "type": "Teaching"
            }
        elif current_item:
            # Skip initial headers if they are before first section? 
            # The regex catches ### so lines before that are ignored unless current_item is set.
            # We want to enable markdown formatting in content so keep raw lines
            buffer_content.append(line.rstrip())
            
    save_item()
    
    print(f"Extracted {len(extracted_items)} items from Vol 08.")
    
    # Now append to fundamentos.json
    with open(fundamentos_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    # Check if already exists to avoid dupes
    existing_ids = {item['id'] for item in data}
    
    added_count = 0
    for item in extracted_items:
        if item['id'] not in existing_ids:
            data.append(item)
            added_count += 1
            
    if added_count > 0:
        with open(fundamentos_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Added {added_count} new items to {fundamentos_path}")
    else:
        print("No new items added (duplicates found).")

if __name__ == "__main__":
    add_vol_08()
