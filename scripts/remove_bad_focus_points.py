import json
import os

DATA_DIR = "data"
FILES_TO_CLEAN = [
    "pontos_focais_vol02_bilingual.json"
]

def clean_file(filename):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    print(f"Cleaning {filename}...")
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    cleaned_count = 0
    
    for item in data:
        # Check and remove keys
        keys_to_remove = ['focusPoints', 'focusPoints_jp', 'focus_context', 'focus_context_jp']
        modified = False
        for k in keys_to_remove:
            if k in item:
                del item[k]
                modified = True
        
        if modified:
            cleaned_count += 1
                
    print(f"Cleaned {cleaned_count} items in {filename}")
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    for f in FILES_TO_CLEAN:
        clean_file(f)
