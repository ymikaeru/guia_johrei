import json

PONTOS_FOCAIS_PATH = 'data/pontos_focais.json'

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def main():
    items = load_json(PONTOS_FOCAIS_PATH)
    
    no_focus_points = []
    potential_qa = []
    
    for item in items:
        title = item.get('title', '')
        content = item.get('content', '')
        focus_points = item.get('focusPoints', [])
        
        # Check for missing/empty focus points
        if not focus_points:
            no_focus_points.append(title)
            
        # Check for potential Q&A (loose check)
        if "Pergunta" in content or "?" in content or "Resposta" in content:
            potential_qa.append(title)

    print(f"Total items in Pontos Focais: {len(items)}")
    
    print(f"\n--- Items without Focus Points ({len(no_focus_points)}) ---")
    for t in no_focus_points:
        print(f"- {t}")
        
    print(f"\n--- Potential Q&A Items ({len(potential_qa)}) ---")
    for t in potential_qa:
        print(f"- {t}")

if __name__ == "__main__":
    main()
