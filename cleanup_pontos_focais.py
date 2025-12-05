import json
import os

# Define paths
PONTOS_FOCAIS_PATH = 'data/pontos_focais.json'
CURAS_PATH = 'data/curas.json'
FUNDAMENTOS_PATH = 'data/fundamentos.json'

# Items to move to FUNDAMENTOS (General Principles / Lists)
TO_FUNDAMENTOS = [
    "Causas do Câncer",
    "Causas das Doenças Gástricas",
    "Sobre a Urina Tóxica",
    "1. Remédios Ocidentais e Chineses",
    "2. Laxantes",
    "3. Analgésicos",
    "4. Colírios",
    "5. Remédios Nasais",
    "6. Gargarejos",
    "7. Cremes Dentais",
    "8. Pomadas e Unguentos",
    "9. Jintan",
    "10. Salvarsan",
    "11. Vacinas e Desinfetantes",
    "1. Doenças Causadas por Pecados e Impurezas",
    "2. Métodos para Dissipar Pecados e Impurezas",
    "3. Doenças Causadas por Espíritos"
]

# Items to move to CURAS (Cases / Headers)
TO_CURAS = [
    "Outros Casos Clínicos",
    "Paralisia balançando a cabeça e passou a fazer igual"
]

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
        
        # Check if should move to Curas
        if title in TO_CURAS:
            # Add Q&A tag if missing (only for actual cases, maybe not for headers)
            if title != "Outros Casos Clínicos":
                 if "Q&A" not in item.get('tags', []):
                    if 'tags' not in item: item['tags'] = []
                    item['tags'].append("Q&A")
                    item['tags'].sort()
            
            curas.append(item)
            moved_to_curas += 1
            print(f"Moving to Curas: {title}")
            continue

        # Check if should move to Fundamentos
        if title in TO_FUNDAMENTOS:
            fundamentos.append(item)
            moved_to_fundamentos += 1
            print(f"Moving to Fundamentos: {title}")
            continue

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
