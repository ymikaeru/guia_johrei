import json
import os

DATA_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"
JP_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/Docx_Original/MD_Original/json_output"

PT_FILES = {
    "pontos_focais": os.path.join(DATA_DIR, "pontos_focais.json"),
    "contexto": os.path.join(DATA_DIR, "explicacoes_contexto.json")
}

JP_FILES = {
    "kakuron": os.path.join(JP_DIR, "各論.json"),
    "kakuron2": os.path.join(JP_DIR, "各論２.json"),
    "soron1": os.path.join(JP_DIR, "総論１.json")
}

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    pt_focy = load_json(PT_FILES["pontos_focais"])
    jp_kak = load_json(JP_FILES["kakuron"])
    jp_kak2 = load_json(JP_FILES["kakuron2"])
    
    pt_cont = load_json(PT_FILES["contexto"])
    jp_sor = load_json(JP_FILES["soron1"])
    
    print("=== Contexto Alignment ===")
    limit = min(len(pt_cont), len(jp_sor))
    for i in range(max(len(pt_cont), len(jp_sor))):
        p_t = pt_cont[i]['title'] if i < len(pt_cont) else "---"
        j_t = jp_sor[i]['title'] if i < len(jp_sor) else "---"
        print(f"{i:02d} | PT: {p_t:<50} | JP: {j_t}")

    print("\n=== Pontos Focais (Overview) ===")
    print("Skipping detailed list, printing Anchors check.")
    # Print localized checks around assumed anchors
    check_indices = [0, 1, 6, 16, 26, 30, 37, 39, 54, 55, 56]
    for i in check_indices:
        p_item = pt_focy[i] if i < len(pt_focy) else None
        p_t = p_item['title'] if p_item else "---"
        p_src = p_item['source'] if p_item else "---"
        
        # Estimate JP index
        # Just print what was matched in the file (since I overwrote it)
        j_t_matched = p_item.get('title_ja', 'N/A') if p_item else "---"
        
        print(f"{i:02d} | {p_t:<40} ({p_src}) -> Matched: {j_t_matched}")

    print("\n=== JP Kakuron Titles (First 70) ===")
    for i, item in enumerate(jp_kak[:70]):
        print(f"{i:02d} : {item['title']}")

if __name__ == "__main__":
    main()
