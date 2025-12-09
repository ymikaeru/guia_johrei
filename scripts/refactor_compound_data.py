import json
import re

file_path = 'data/pontos_focais.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

new_data = []
split_count = 0

# Regex to detect numbered items: "Start of string or newline" + "digit" + ")" + "space" + "Title"
# Examples: "1) Rinite", "10) Ozena"
# We want to capture the Title.
# Pattern: (^|\n)(\d+)\)\s+(.+?)(?=\n|$)
# Actually title might be the whole line.

for item in data:
    content = item.get('content', '')
    
    # Check if this item is a compound list
    # We look for at least "1) " and "2) " to be safe, or just "1) " if it implies a single sub-item (unlikely).
    # "Nariz" has 1) Rinite, 2) Ozena...
    
    matches = list(re.finditer(r'(?:^|\n\n)(\d+)\)\s+([^\n]+)', content))
    
    if len(matches) >= 2:
        print(f"Splitting '{item['title']}' (ID: {item['id']}) into {len(matches)} parts.")
        
        base_id = item['id']
        original_title = item['title']
        
        for i, match in enumerate(matches):
            num = match.group(1)
            sub_title = match.group(2).strip()
            
            # Start index of this match's CONTENT (after the title line)
            # The match object spans "\n1) Title".
            # Content starts after this match.
            start_content = match.end()
            
            # End index is the start of the NEXT match, or end of string.
            if i + 1 < len(matches):
                end_content = matches[i+1].start()
            else:
                end_content = len(content)
                
            sub_content = content[start_content:end_content].strip()
            
            # Create new item
            new_item = item.copy()
            new_item['id'] = f"{base_id}_{num}" # e.g. pf_nariz_1
            new_item['title'] = sub_title
            new_item['content'] = sub_content
            
            # Tags: Add the original title as a tag (e.g. "Nariz") to ensure searchability
            if 'tags' not in new_item: new_item['tags'] = []
            if original_title not in new_item['tags']:
                new_item['tags'].append(original_title)
                
            # Focus Points: INHERIT for now. 
            # (e.g. if Nariz had "Nariz", Rinite gets "Nariz". exact what we want).
            
            new_data.append(new_item)
            
        split_count += 1
            
    else:
        # Keep original
        new_data.append(item)

if split_count > 0:
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, indent=2, ensure_ascii=False)
    print(f"Refactor complete. Split {split_count} items. New total: {len(new_data)}")
else:
    print("No items to split found.")
