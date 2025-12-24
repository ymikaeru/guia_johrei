import json
import re

PT_PATH = '/Users/michael/Documents/Ensinamentos/guia_johrei/data/fundamentos.json'
JA_PATH = '/Users/michael/Documents/Ensinamentos/guia_johrei/data/fundamentos_ja.json'

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def main():
    # 1. Cleaner for PT
    pt_data = load_json(PT_PATH)
    pt_updated = False
    
    # Locate fundamento_1? Wait, Preface title is 'Prefácio', index 0 usually.
    # User screenshot confirms "Prefácio" title. ID is implicitly `fundamentos_1`.
    
    for item in pt_data:
        if item.get('title') == "Prefácio":
            c = item.get('content', '')
            # Remove "Prefácio" + newlines at start
            if c.strip().startswith('Prefácio'):
                # Regex to be safe against spaces
                new_c = re.sub(r'^Prefácio\s*\n+', '', c.strip())
                if new_c != c:
                    item['content'] = new_c
                    pt_updated = True
                    print(f"Cleaned PT Prefácio. New start: {new_c[:20]}...")
            break # Assume only one
            
    if pt_updated:
        save_json(PT_PATH, pt_data)
        print("Saved PT.")

    # 2. Cleaner for JA
    ja_data = load_json(JA_PATH)
    ja_updated = False
    
    for item in ja_data:
        if item.get('id') == 'soron_1':
            c = item.get('content', '')
            # Remove "まえがき" + newlines at start
            if c.strip().startswith('まえがき'):
                new_c = re.sub(r'^まえがき\s*\n+', '', c.strip())
                if new_c != c:
                    item['content'] = new_c
                    ja_updated = True
                    print(f"Cleaned JA Maegaki. New start: {new_c[:20]}...")
            break
            
    if ja_updated:
        save_json(JA_PATH, ja_data)
        print("Saved JA.")

if __name__ == "__main__":
    main()
