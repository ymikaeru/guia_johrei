import json
import re

# Define paths
PONTOS_FOCAIS_PATH = 'data/pontos_focais.json'
CURAS_PATH = 'data/curas.json'

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def is_qa_item(item):
    title = item.get('title', '')
    content = item.get('content', '')
    
    # Check for explicit Q&A structure in content
    if "Pergunta:" in content and "Resposta:" in content:
        return True
    
    # Check for "Pergunta" in title (though we cleaned titles, some might still have indicators)
    if "(Pergunta)" in title:
        return True
        
    # Specific known Q&A collections based on user request/observation
    known_qa_titles = [
        "Doenças do Aparelho Urinário",
        "Doenças Sistêmicas",
        "Doenças Infantis", # Check content first
        "Doenças Femininas",
        "Câncer",
        "Doenças Mentais",
        "Doenças dos Olhos",
        "Doenças do Nariz",
        "Doenças do Ouvido",
        "Doenças da Boca e Dentes",
        "Doenças do Coração",
        "Doenças do Pulmão",
        "Doenças do Estômago",
        "Doenças do Fígado",
        "Doenças do Intestino",
        "Doenças do Ânus",
        "Doenças Venéreas",
        "Doenças da Mulher",
        "Doenças da Gravidez",
        "Doenças Cirúrgicas",
        "Doenças Cutâneas",
        "Remédios"
    ]
    
    if title in known_qa_titles:
        # Verify it actually looks like Q&A
        if "Pergunta:" in content or "1." in content[:20]: # Numbered list of cases
            return True

    return False

def main():
    print("Loading files...")
    pontos = load_json(PONTOS_FOCAIS_PATH)
    curas = load_json(CURAS_PATH)
    
    new_pontos = []
    moved_count = 0
    
    print(f"Initial Pontos Focais count: {len(pontos)}")
    print(f"Initial Curas count: {len(curas)}")

    for item in pontos:
        if is_qa_item(item):
            # Add Q&A tag
            tags = item.get('tags', [])
            if "Q&A" not in tags:
                tags.append("Q&A")
                tags.sort()
            item['tags'] = tags
            
            curas.append(item)
            moved_count += 1
            print(f"Moving: {item.get('title', 'Untitled')}")
        else:
            new_pontos.append(item)

    print(f"\nMoved {moved_count} items to Curas.")
    print(f"Remaining in Pontos Focais: {len(new_pontos)}")

    if moved_count > 0:
        save_json(PONTOS_FOCAIS_PATH, new_pontos)
        save_json(CURAS_PATH, curas)
        print("Files updated successfully.")
    else:
        print("No items matched criteria.")

if __name__ == "__main__":
    main()
