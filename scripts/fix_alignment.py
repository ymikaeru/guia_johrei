import json
import sys

FILE_PATH = 'data/fundamentos_ja.json'

try:
    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
except Exception as e:
    print(f"Error loading JSON: {e}")
    sys.exit(1)

target_id = 'fundamentos_45'
found = False

for item in data:
    if item.get('id') == target_id:
        content = item['content']
        
        # Split 1
        target1 = 'これが余病である。偖、論旨を進めて'
        repl1 = 'これが余病である。\n\n偖、論旨を進めて'
        
        # Split 2
        target2 = '別の項に譲るとして、茲では曇り'
        repl2 = '別の項に譲るとして、\n\n茲では曇り'
        
        new_content = content
        if target1 in new_content:
            new_content = new_content.replace(target1, repl1)
            print("Applied Split 1")
        else:
            print("Split 1 target not found")
            
        if target2 in new_content:
            new_content = new_content.replace(target2, repl2)
            print("Applied Split 2")
        else:
            print("Split 2 target not found")
            
        if new_content != content:
            item['content'] = new_content
            found = True
        break

if found:
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Successfully updated fundamentos_ja.json")
else:
    print("No changes made.")
