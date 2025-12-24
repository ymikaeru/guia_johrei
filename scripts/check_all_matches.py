import json
import random
import os

DATA_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"

FILES = [
    "fundamentos.json",
    "curas.json",
    "explicacoes_guia1.json",
    "explicacoes_guia2.json",
    "explicacoes_guia3.json",
]

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    for fname in FILES:
        path = os.path.join(DATA_DIR, fname)
        data = load_json(path)
        print(f"\n=== {fname} ===")
        
        populated = [d for d in data if 'title_ja' in d]
        print(f"Total Populated: {len(populated)} / {len(data)}")
        
        if populated:
            sample = random.sample(populated, min(5, len(populated)))
            for i, item in enumerate(sample):
                print(f"-- Item {i+1} --")
                print(f"PT: {item.get('title')}")
                print(f"JP: {item.get('title_ja')}")
                print(f"Source: {item.get('source')}")
                # print(f"JP Content Snippet: {item.get('content_ja', '')[:50]}...")
        else:
            print("No items populated.")

if __name__ == "__main__":
    main()
