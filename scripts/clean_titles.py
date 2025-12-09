import json
import re

files = ['data/fundamentos.json', 'data/pontos_focais.json']

for file_path in files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        modified_count = 0
        
        for item in data:
            if 'title' in item:
                # Regex to find "1. ", "10. ", etc. at start
                new_title = re.sub(r'^\d+\.\s*', '', item['title'])
                
                if new_title != item['title']:
                    print(f"Modifying: '{item['title']}' -> '{new_title}'")
                    item['title'] = new_title
                    modified_count += 1
        
        if modified_count > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"Updated {modified_count} titles in {file_path}")
        else:
            print(f"No titles needed cleaning in {file_path}")
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
