import json
import re

def parse_reference_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    pt_content = data['content']['portugues']
    ja_content = data['content']['japones']

    def parse_md(text, lang):
        lines = text.split('\n')
        items = []
        current_item = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue

            is_header = False
            title = ""
            level = 0
            
            if lang == 'pt':
                if line.startswith('# '):
                    is_header = True
                    level = 1
                    title = line.strip('# ').strip()
                elif line.startswith('## '):
                    is_header = True
                    level = 2
                    title = line.strip('# ').strip()
                elif line.startswith('### '):
                    is_header = True
                    level = 3
                    title = line.strip('# ').strip()
            
            elif lang == 'ja':
                if line.startswith('# ') or line.startswith('## '):
                     # Section header
                     clean = re.sub(r'[*#]', '', line).strip()
                     is_header = True
                     level = 2
                     title = clean
                
                elif line.startswith('**（') or line.startswith('**('):
                    # Teaching header
                    is_header = True
                    level = 3
                    title = re.sub(r'[*]', '', line).strip()

            if is_header:
                if current_item:
                    items.append(current_item)
                current_item = {'level': level, 'title': title}
            else:
                pass # ignore content for debug
        
        if current_item:
             items.append(current_item)
        return items

    pt_items = parse_md(pt_content, 'pt')
    ja_items = parse_md(ja_content, 'ja')
    
    print("--- PT ITEMS (First 10) ---")
    for i, item in enumerate(pt_items[:10]):
        print(f"[{i}] L{item['level']}: {item['title']}")
        
    print("\n--- JA ITEMS (First 10) ---")
    for i, item in enumerate(ja_items[:10]):
        print(f"[{i}] L{item['level']}: {item['title']}")
        
    print(f"\nTotal PT: {len(pt_items)}")
    print(f"Total JA: {len(ja_items)}")

parse_reference_file('data_reference/johrei_vol10_ref.json')
