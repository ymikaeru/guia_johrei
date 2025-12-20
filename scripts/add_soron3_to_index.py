import json

def add_soron3_index():
    source_file = 'data/fundamentos.json'
    target_file = 'data/explicacoes_guia3.json'
    
    try:
        source_data = json.load(open(source_file, encoding='utf-8'))
        target_data = json.load(open(target_file, encoding='utf-8'))
    except Exception as e:
        print(f"Error loading files: {e}")
        return

    # Find soron_3 in fundamentals
    soron3 = next((i for i in source_data if i['id'] == 'soron_3'), None)
    if not soron3:
        print("soron_3 not found in fundamentos.json")
        return

    # Check if already in target
    if any(i['id'] == 'soron_3' for i in target_data):
        print("soron_3 already in index")
        return

    # Create Item
    # Order: max order + 1
    max_order = max((i.get('order', 0) for i in target_data), default=0)
    
    new_item = {
        "id": "soron_3",
        "title": soron3['title'],
        "content": soron3['content'],
        "source": "Explicação 02 (Reallocated)",
        "tags": ["Técnica", "Força", "Johrei"],
        "order": max_order + 1,
        "searchKeywords": ["Força", "Relaxar"],
        "focusPoints": [] 
    }
    
    target_data.append(new_item)
    
    with open(target_file, 'w', encoding='utf-8') as f:
        json.dump(target_data, f, ensure_ascii=False, indent=2)
    print("Added soron_3 to explicacoes_guia3.json")

if __name__ == "__main__":
    add_soron3_index()
