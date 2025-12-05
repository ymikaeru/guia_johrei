import json
import os

files_to_update = ['data/curas.json', 'data/fundamentos.json']
TAG_NAME = "Q&A"
OLD_TAG_NAME = "P&R"

for file_path in files_to_update:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue

    with open(file_path, 'r') as f:
        data = json.load(f)

    updated_count = 0
    for item in data:
        content = item.get('content', '')
        tags = item.get('tags', [])
        
        # 1. Remove old tag if exists
        if OLD_TAG_NAME in tags:
            tags.remove(OLD_TAG_NAME)
            # Ensure we add the new one if we removed the old one, 
            # OR if it matches the content criteria
            if TAG_NAME not in tags:
                tags.append(TAG_NAME)
            updated_count += 1
            
        # 2. Check content criteria
        if 'Pergunta:' in content or '(Pergunta)' in content or 'Pergunta' in content:
            if TAG_NAME not in tags:
                tags.append(TAG_NAME)
                updated_count += 1
        
        item['tags'] = sorted(list(set(tags))) # Ensure unique and sorted

    if updated_count > 0:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated {updated_count} items in {file_path}")
    else:
        print(f"No items needed update in {file_path}")

    if updated_count > 0:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated {updated_count} items in {file_path}")
    else:
        print(f"No items needed update in {file_path}")
