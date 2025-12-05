import json
import os

# Define paths
PONTOS_FOCAIS_PATH = 'data/pontos_focais.json'
CURAS_PATH = 'data/curas.json'
FUNDAMENTOS_PATH = 'data/fundamentos.json'

# Items to move to CURAS (Q&A / Cases)
TO_CURAS = [
    "Minha mãe (59 anos) sente uma dor no centro da cabeça como se algo a puxasse para cima",
    "Mulher de 55 anos. Teve derrame, recuperou-se, mas teve recaída após 7 meses", # Title might be truncated or different, check content
    "E no caso de cãibras nas pernas?",
    "Desde outubro de 1950, comecei a perder cabelo atrás da orelha esquerda",
    "Minha irmã (19 anos) tratava otite média",
    "A hidrocefalia, popularmente chamada de \"Fukusuke\"",
    "Menino de 10 anos",
    "Homem de 55 anos. Rigidez progressiva no lado direito há 8 anos",
    "Menina de 3 anos. Teve meningite aos 10 meses",
    "Mulher de 52 anos. Viu uma menina com paralisia balançando a cabeça e passou a fazer igual",
    "Minha filha de quinze anos, cuja família ingressou na fé em abril de 1950",
    "Moça de 17 anos. Teve meningite aos seis meses",
    "Homem de 63 anos com paralisia",
    "Doenças Sistêmicas (Corpo Todo)", # The big list of cases
    "Criança surda",
    "Alopecia",
    "Meningite",
    "Paralisia",
    "Uma das empregadas tossia muito"
]

# Items to move to FUNDAMENTOS (General Principles)
TO_FUNDAMENTOS = [
    "O centro da cabeça é um local propenso ao acúmulo de toxinas",
    "O tempo, migraram e se solidificaram ali",
    "Para tratar os gânglios linfáticos",
    "O pescoço rígido como um bastão ou com nódulos duros como pe",
    "Ao tratar doenças, sempre toco a testa do paciente; pela temperatura, consigo...",
    "Basicamente, se purificarmos estes pontos (Occipital, Gânglios Linfáticos, Fr..."
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
        content = item.get('content', '')
        
        # Check if should move to Curas
        # Match by exact title or if title is contained in the list (for long titles)
        # Also check content start for some cases where title is generic
        is_curas = False
        if title in TO_CURAS:
            is_curas = True
        else:
            for t in TO_CURAS:
                if len(t) > 10 and (t in title or t in content[:100]):
                    is_curas = True
                    break
        
        if is_curas:
            # Add Q&A tag if missing
            if "Q&A" not in item.get('tags', []):
                if 'tags' not in item: item['tags'] = []
                item['tags'].append("Q&A")
                item['tags'].sort()
            
            curas.append(item)
            moved_to_curas += 1
            print(f"Moving to Curas: {title}")
            continue

        # Check if should move to Fundamentos
        is_fundamentos = False
        if title in TO_FUNDAMENTOS:
            is_fundamentos = True
        else:
            for t in TO_FUNDAMENTOS:
                if len(t) > 10 and (t in title or t in content[:100]):
                    is_fundamentos = True
                    break
        
        if is_fundamentos:
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
