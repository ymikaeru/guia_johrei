import json

# Define paths
PONTOS_FOCAIS_PATH = 'data/pontos_focais.json'
CURAS_PATH = 'data/curas.json'
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
    curas = load_json(CURAS_PATH)
    fundamentos = load_json(FUNDAMENTOS_PATH)

    new_pontos = []
    moved_to_curas = 0
    moved_to_fundamentos = 0

    for item in pontos:
        title = item.get('title', '')
        content = item.get('content', '')
        focus_points = item.get('focusPoints', [])
        
        # 1. Check for Q&A (Priority)
        if "Pergunta:" in content or "(Pergunta)" in title:
            # Add Q&A tag
            tags = item.get('tags', [])
            if "Q&A" not in tags:
                tags.append("Q&A")
                tags.sort()
            item['tags'] = tags
            
            curas.append(item)
            moved_to_curas += 1
            print(f"Moving to Curas (Q&A): {title}")
            continue

        # 2. Check for missing Focus Points
        # If focusPoints is missing or empty list
        if not focus_points:
            fundamentos.append(item)
            moved_to_fundamentos += 1
            print(f"Moving to Fundamentos (No Focus Points): {title}")
            continue

        # Keep in Pontos Focais
        new_pontos.append(item)

    print(f"\nSummary:")
    print(f"Moved to Curas: {moved_to_curas}")
    print(f"Moved to Fundamentos: {moved_to_fundamentos}")
    print(f"Remaining in Pontos Focais: {len(new_pontos)}")

    # Save files
    save_json(PONTOS_FOCAIS_PATH, new_pontos)
    save_json(CURAS_PATH, curas)
    save_json(FUNDAMENTOS_PATH, fundamentos)
    print("Files updated successfully.")

if __name__ == "__main__":
    main()
