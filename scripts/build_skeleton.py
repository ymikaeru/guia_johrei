import json
import os

pt_dir = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"
jp_dir = "/Users/michael/Documents/Ensinamentos/guia_johrei/Docx_Original/MD_Original/json_output"

jp_files = ["各論.json", "各論２.json", "浄霊法講座.json"]
pt_files = ["pontos_focais.json", "fundamentos.json"]

search_terms_jp = {
    "Headache": "頭痛",
    "Dizziness": "眩暈",
    "Teeth": "歯",
    "Ear": "耳",
    "Nose": "鼻",
    "Throat": "喉",
    "Brain": "脳",
    "Eye": "眼",
    "Lung": "肺",
    "Liver": "肝",
    "Bowels": "腸",
    "Insomnia": "不眠症",
    "Kidney": "腎",
    "Stomach": "胃",
    "Heart": "心",
    "TB": "結核",
    "Appendicitis": "盲腸",
    "Cancer": "癌",
    "Intro": "まえがき",
    "Intro2": "Intro"
}

search_terms_pt = {
    "Headache": "Dores de Cabeça",
    "Dizziness": "Tonturas",
    "Myopia": "Miopia",
    "Teeth": "Dentes",
    "Ear": "Zumbido",
    "Nose": "Nariz",
    "Throat": "Garganta",
    "Brain": "Cerebral",
    "Eye": "Olho",
    "Lung": "Pulmão",
    "Liver": "Fígado",
    "Bowels": "Intestino",
    "Paresia": "Paralisia",
    "Insomnia": "Insônia",
    "Kidney": "Rins",
    "Stomach": "Estômago",
    "Heart": "Coração",
    "TB": "Tuberculose",
    "Appendicitis": "Apendicite",
    "Cancer": "Câncer",
    "Intro": "Prefácio"
}

def load_json(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

print("--- JP Locations ---")
for fname in jp_files:
    data = load_json(os.path.join(jp_dir, fname))
    print(f"\nFile: {fname}")
    for i, item in enumerate(data):
        title = item.get('title', '')
        for key, term in search_terms_jp.items():
            if term in title:
                print(f"  [{i}] {key}: {title}")

print("\n--- PT Locations ---")
for fname in pt_files:
    data = load_json(os.path.join(pt_dir, fname))
    print(f"\nFile: {fname}")
    for i, item in enumerate(data):
        title = item.get('title', '')
        for key, term in search_terms_pt.items():
            if term in title:
                print(f"  [{i}] {key}: {title}")
