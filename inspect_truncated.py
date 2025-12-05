import json

PONTOS_FOCAIS_PATH = 'data/pontos_focais.json'

TRUNCATED_STRINGS = [
    "ombros e",
    "Coluna vertebral (T9 a",
    "Rins e",
    "Estômago e",
    "Fígado e",
    "Região inguinal e",
    "Ovários e",
    "Brônquios e",
    "Medula oblonga e"
]

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def main():
    items = load_json(PONTOS_FOCAIS_PATH)
    
    for item in items:
        focus_points = item.get('focusPoints', [])
        title = item.get('title', '')
        content = item.get('content', '')
        
        for fp in focus_points:
            for trunc in TRUNCATED_STRINGS:
                if trunc in fp:
                    print(f"\n--- ITEM: {title} ---")
                    print(f"Truncated FP: '{fp}'")
                    print(f"Content snippet (first 500 chars):")
                    print(content[:500])
                    print("-" * 20)

if __name__ == "__main__":
    main()
