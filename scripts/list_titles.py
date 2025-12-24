import json
import re

def list_titles():
    with open('data/fundamentos_ptJp.json', 'r') as f:
        data = json.load(f)
    
    print("--- Estudos Específicos 01 ---")
    for item in data:
        if item.get('source') == "Estudos Específicos 01":
            print(f"{item['id']}: {item['title']} (JA: {item.get('title_ja', 'None')})")

    print("\n--- Estudos Específicos 02 ---")
    for item in data:
        if item.get('source') == "Estudos Específicos 02":
            print(f"{item['id']}: {item['title']} (JA: {item.get('title_ja', 'None')})")

if __name__ == "__main__":
    list_titles()
