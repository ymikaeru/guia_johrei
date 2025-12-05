import json

PONTOS_FOCAIS_PATH = 'data/pontos_focais.json'

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def fix_item(item):
    title = item.get('title', '')
    fp = item.get('focusPoints', [])
    content = item.get('content', '')
    
    # 1. Fix Sinusite
    if title.startswith("Sinusite, Rinite"):
        print(f"Fixing {title}...")
        item['focusPoints'] = [
            "Região occipital",
            "Bulbo raquidiano",
            "Lobo frontal",
            "Testa",
            "Lados do nariz"
        ]
        # Remove "5. Boca" from content end
        if content.endswith("5. Boca"):
            item['content'] = content.replace("5. Boca", "").strip()
            
    # 2. Fix Dor de Dente
    elif title == "Dor de Dente":
        print(f"Fixing {title}...")
        item['focusPoints'] = [
            "Glândulas linfáticas cervicais",
            "Cabeça"
        ]
        
    # 3. Fix Piorreia Alveolar
    elif title == "Piorreia Alveolar":
        print(f"Fixing {title}...")
        item['focusPoints'] = [
            "Ombros",
            "Glândulas linfáticas do pescoço",
            "Maxilar",
            "Bochechas"
        ]

    # 4. Fix Cãibra Estomacal
    elif title == "Cãibra Estomacal":
        print(f"Fixing {title}...")
        item['focusPoints'] = [
            "Coluna vertebral (T9 a T12)",
            "Estômago"
        ]

    # 5. Fix Generic Truncated "X e"
    else:
        new_fp = []
        changed = False
        for point in fp:
            if point.endswith(" e"):
                print(f"Fixing truncated point in {title}: '{point}'")
                new_point = point[:-2].strip() # Remove " e"
                new_fp.append(new_point)
                changed = True
            elif point == "Coluna vertebral (T9 a": # Specific catch if not caught above
                new_fp.append("Coluna vertebral (T9 a T12)")
                changed = True
            else:
                new_fp.append(point)
        
        if changed:
            item['focusPoints'] = new_fp

    return item

def main():
    items = load_json(PONTOS_FOCAIS_PATH)
    fixed_items = []
    
    for item in items:
        fixed_items.append(fix_item(item))
        
    save_json(PONTOS_FOCAIS_PATH, fixed_items)
    print("Fixes applied successfully.")

if __name__ == "__main__":
    main()
