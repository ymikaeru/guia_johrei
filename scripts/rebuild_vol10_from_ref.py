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
                if current_item:
                    current_item['content'].append('') 
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
                # JA headers
                # We need to distinguish L1 (#) vs L2 (##) to match PT
                if line.startswith('# '):
                     is_header = True
                     level = 1
                     title = re.sub(r'[*#]', '', line).strip()
                elif line.startswith('## '):
                     is_header = True
                     level = 2
                     title = re.sub(r'[*#]', '', line).strip()
                elif line.startswith('**（') or line.startswith('**('):
                    # Teaching header (L3)
                    is_header = True
                    level = 3
                    title = re.sub(r'[*]', '', line).strip()

            if is_header:
                if current_item:
                    while current_item['content'] and not current_item['content'][-1]:
                        current_item['content'].pop()
                    items.append(current_item)
                
                current_item = {
                    'level': level,
                    'title': title,
                    'content': []
                }
            else:
                if current_item:
                    current_item['content'].append(line)
        
        if current_item:
             while current_item['content'] and not current_item['content'][-1]:
                current_item['content'].pop()
             items.append(current_item)
             
        return items

    pt_items = parse_md(pt_content, 'pt')
    ja_items = parse_md(ja_content, 'ja')

    return pt_items, ja_items

def rebuild_json():
    pt_items, ja_items = parse_reference_file('data_reference/johrei_vol10_ref.json')
    
    print(f"Parsed PT items: {len(pt_items)}")
    print(f"Parsed JA items: {len(ja_items)}")
    
    output_items = []
    
    # 1-to-1 alignment
    limit = min(len(pt_items), len(ja_items))
    
    for i in range(limit):
        pt_item = pt_items[i]
        ja_item = ja_items[i]
        
        item_obj = {
            "id": f"item_{i+1:03d}",
            "type": "teaching", 
            "title_pt": pt_item['title'],
            "content_pt": '\n'.join(pt_item['content']).strip(),
            "title_ja": ja_item['title'],
            "content_ja": '\n'.join(ja_item['content']).strip()
        }
        
        if pt_item['level'] != ja_item['level']:
             print(f"WARNING: Level mismatch at index {i}: PT={pt_item['level']} JA={ja_item['level']}")
             
        output_items.append(item_obj)
        
    with open('data/johrei_vol10_rebuilt.json', 'w', encoding='utf-8') as f:
        json.dump(output_items, f, ensure_ascii=False, indent=2)
        
    print(f"Rebuilt JSON saved. Total items: {len(output_items)}")

rebuild_json()
