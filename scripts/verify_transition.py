import json
import os

pt_dir = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"
jp_dir = "/Users/michael/Documents/Ensinamentos/guia_johrei/Docx_Original/MD_Original/json_output"

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

pt_data = load_json(os.path.join(pt_dir, "pontos_focais.json"))
jp_kakuron = load_json(os.path.join(jp_dir, "各論.json"))
jp_kakuron2 = load_json(os.path.join(jp_dir, "各論２.json"))

print("PT Items 54-57:")
for i in range(54, 58):
    if i < len(pt_data):
        print(f"[{i}] {pt_data[i].get('title')} ({pt_data[i].get('source')})")

print("\nJP Kakuron Items 54-60:")
for i in range(54, 60):
    if i < len(jp_kakuron):
        print(f"[{i}] {jp_kakuron[i].get('title')}")

print("\nJP Kakuron 2 Items 0-5:")
for i in range(0, 5):
    if i < len(jp_kakuron2):
        print(f"[{i}] {jp_kakuron2[i].get('title')}")
