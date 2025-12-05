import json
import os

# Define paths
PONTOS_FOCAIS_PATH = 'data/pontos_focais.json'
CURAS_PATH = 'data/curas.json'
FUNDAMENTOS_PATH = 'data/fundamentos.json'

# Items to move to CURAS (Q&A / Cases)
# Titles or IDs to identify them
TO_CURAS = [
    "(Pergunta) O aumento da cabeça de crianças por acúmulo de água é espiritual? ...",
    "Erupções na Cabeça e Queda de Cabelo",
    "O lado esquerdo avermelhado e que sente dor ao tocar coisas",
    "Febre e Purificação", # Moves both instances
    "Este ano (1953) a encefalite japonesa é epidêmica",
    "Derrame e Johrei", # Moves both instances
    "Homem de 44 anos",
    "Mulher de 50 anos",
    "Tumor e Johrei",
    "Hipertensão e Johrei"
]

# Items to move to FUNDAMENTOS (General Principles)
TO_FUNDAMENTOS = [
    "Ao tocar a testa",
    "Se o lado direito está paralisado",
    "Johrei no Centro do Crânio",
    "Solidificação de Medicamentos na Região Occipital"
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
        if title in TO_CURAS or any(t in title for t in TO_CURAS if len(t) > 20): # Handle long titles matching
            # Add Q&A tag if missing
            if "Q&A" not in item.get('tags', []):
                if 'tags' not in item: item['tags'] = []
                item['tags'].append("Q&A")
                item['tags'].sort()
            
            curas.append(item)
            moved_to_curas += 1
            print(f"Moving to Curas: {title}")
            
        # Check if should move to Fundamentos
        elif title in TO_FUNDAMENTOS:
            # Add Fundamentos tag if missing (optional, but good for consistency)
            # if "Fundamentos" not in item.get('tags', []):
            #     if 'tags' not in item: item['tags'] = []
            #     item['tags'].append("Fundamentos")
            
            fundamentos.append(item)
            moved_to_fundamentos += 1
            print(f"Moving to Fundamentos: {title}")
            
        else:
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
