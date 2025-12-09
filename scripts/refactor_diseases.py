import json
import os
import re

file_path = 'data/pontos_focais.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

config = {
    "pf121": {
        "titles": [
            "Indigestão (Dispepsia)",
            "Desenvolvimento Deficiente",
            "Úlcera Gástrica Infantil",
            "Coqueluche",
            "Meningite",
            "Choro Noturno (Manha)",
            "Escarlatina",
            "Disenteria Infantil (Ekiri)",
            "Paralisia Infantil (Poliomielite)",
            "Sarampo",
            "Asma Infantil",
            "Pneumonia Infantil",
            "Hérnia (Deslocamento do Intestino)",
            "Difteria"
        ],
        "baseId": "pf_child",
        "categoryName": "Doenças Infantis"
    },
    "pf124": {
        "titles": [
            "Sarna e Doenças de Pele",
            "Beribéri",
            "Nevralgia",
            "Reumatismo",
            "Enurese Noturna (Xixi na Cama)",
            "Ronco"
        ],
        "baseId": "pf_other",
        "categoryName": "Câncer e Outras Doenças"
    }
}

new_data = []

for item in data:
    if item['id'] in config:
        cfg = config[item['id']]
        content = item['content']
        base_id = cfg['baseId']
        
        for index, title in enumerate(cfg['titles']):
            num = index + 1
            search_str = f"{num}) {title}"
            
            start_index = content.find(search_str)
            if start_index == -1:
                print(f"Warning: Could not find '{search_str}' in {item['id']}")
                continue
                
            content_start = start_index + len(search_str)
            
            # Find end of this item (start of next item)
            # Look for "\n\n(num+1))" 
            next_num = num + 1
            # Python re needs escaping for parenthesis
            # Pattern: \n\n followed by digit+) 
            # Or just search for literal substring "\n\n{next_num})"
            
            next_marker = f"\n\n{next_num})"
            end_index = content.find(next_marker, content_start)
            
            if end_index == -1:
                # If not found, check if it is the last item
                # But wait, what if the format is slightly different?
                # Sometimes there might not be \n\n?
                # Step 2011 show \n\n between all items.
                # Last item "14) Difteria" ends at End Of String.
                if index == len(cfg['titles']) - 1:
                     end_index = len(content)
                else:
                    # Fallback or error?
                    # Maybe it's just "\n{next_num})" ?
                    next_marker_alt = f"\n{next_num})"
                    end_index = content.find(next_marker_alt, content_start)
                    if end_index == -1:
                        # Assume end of string if we can't find next
                        end_index = len(content)

            item_body = content[content_start:end_index].strip()
            
            # Construct new item
            new_item = item.copy()
            new_item['id'] = f"{base_id}_{num}"
            new_item['title'] = title
            new_item['content'] = item_body
            new_item['category'] = cfg['categoryName']
            
            # Tags: Inherit + Category
            if 'tags' not in new_item:
                new_item['tags'] = []
            if cfg['categoryName'] not in new_item['tags']:
                new_item['tags'].append(cfg['categoryName'])
                
            # Order
            new_item['order'] = item.get('order', 0) + (index * 0.01)
            
            new_data.append(new_item)
            
    else:
        new_data.append(item)

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(new_data, f, indent=2, ensure_ascii=False)

print(f"Refactor complete. Total items: {len(new_data)}")
