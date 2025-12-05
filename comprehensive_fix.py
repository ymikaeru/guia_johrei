import json

PONTOS_FOCAIS_PATH = 'data/pontos_focais.json'
FUNDAMENTOS_PATH = 'data/fundamentos.json'

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def main():
    print("Loading files...")
    pontos = load_json(PONTOS_FOCAIS_PATH)
    fundamentos = load_json(FUNDAMENTOS_PATH)
    
    # 1. Merge Duplicates (Dor de Dente)
    unique_pontos = {}
    duplicates_merged = 0
    
    for item in pontos:
        title = item.get('title', '').strip()
        if title in unique_pontos:
            print(f"Merging duplicate: {title}")
            existing = unique_pontos[title]
            
            # Merge content if different
            if item['content'] not in existing['content']:
                existing['content'] += "\n\n" + item['content']
            
            # Merge tags
            existing['tags'] = list(set(existing.get('tags', []) + item.get('tags', [])))
            
            # Merge focus points (keep unique, prioritize cleaner ones)
            # For Dor de Dente specifically, we want the clean ones we fixed earlier
            # If one has "atravessa o tórax" (bad) and other has "Cabeça" (good), keep good.
            # But we fixed "Dor de Dente" in previous step. Let's assume both are "fixed" or one is better.
            # We'll just union them for now and let the cleaner handle long strings.
            existing['focusPoints'] = list(set(existing.get('focusPoints', []) + item.get('focusPoints', [])))
            
            duplicates_merged += 1
        else:
            unique_pontos[title] = item
            
    pontos_list = list(unique_pontos.values())
    
    # 2. Clean Long/Bad Focus Points
    cleaned_pontos = []
    
    for item in pontos_list:
        title = item.get('title', '')
        fps = item.get('focusPoints', [])
        new_fps = []
        
        for fp in fps:
            # Clean specific long instructions
            if "O derrame pode originar-se" in fp:
                new_fps.extend(["Pescoço", "Bulbo"])
            elif "Nuca e região occipital. O centro da visão" in fp:
                new_fps.extend(["Nuca", "Região occipital"])
            elif "Glândula parótida e linfáticos" in fp: # Remove citation if present
                new_fps.append("Glândula parótida e linfáticos")
            elif "A Toxina dos Ombros vem dos Rins" in fp:
                new_fps.append("Rins")
            elif "O processo é o seguinte" in fp: # Febre Tifoide
                new_fps.append("Intestino")
            elif "rins. Nevralgia dentária" in fp:
                new_fps.extend(["Rins", "Alto da cabeça"])
            elif "focar na região frontal" in fp:
                new_fps.extend(["Região frontal", "Mandíbula"])
            elif "atravessa o tórax" in fp: # If it survived
                pass # Drop it
            else:
                # Clean citations like （浄霊法講座２　ｐ39）
                if "（" in fp:
                    fp = fp.split("（")[0].strip()
                new_fps.append(fp)
        
        # Deduplicate list
        item['focusPoints'] = list(set(new_fps))
        cleaned_pontos.append(item)

    # 3. Move "List" items to Fundamentos
    # Check for items where focus points look like "1. X", "2. Y"
    final_pontos = []
    moved_lists = 0
    
    for item in cleaned_pontos:
        fps = item.get('focusPoints', [])
        # If majority of points start with a number
        numbered_count = sum(1 for fp in fps if fp[0].isdigit() and "." in fp[:3])
        
        if numbered_count > 0 and numbered_count >= len(fps) / 2:
            print(f"Moving List Item to Fundamentos: {item['title']}")
            fundamentos.append(item)
            moved_lists += 1
        else:
            final_pontos.append(item)

    print(f"\nSummary:")
    print(f"Duplicates Merged: {duplicates_merged}")
    print(f"Moved List Items: {moved_lists}")
    print(f"Final Pontos Focais count: {len(final_pontos)}")

    save_json(PONTOS_FOCAIS_PATH, final_pontos)
    save_json(FUNDAMENTOS_PATH, fundamentos)
    print("Files updated successfully.")

if __name__ == "__main__":
    main()
