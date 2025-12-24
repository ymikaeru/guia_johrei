import re

def search_keywords():
    files = ["Docx_Original/各論.md", "Docx_Original/各論２.md"]
    keywords = {
        "Hemorroidas (Ji)": "痔",
        "Doenças Venéreas (Karyubyo)": "花柳病",
        "Ovarianas (Ranso)": "卵巣",
        "Leucorreia (Koshike)": "帯下",
        "Inchaço (Fushu)": "浮腫",
        "Leite (Chichi)": "乳不足", # or just 乳
        "Eczema (Shisshin)": "湿疹",
        "Cancer (Gan)": "癌",
        "Carbunculo (Yo)": "癰",
        "Queimaduras (Yakedo)": "火傷",
    }
    
    for fpath in files:
        print(f"--- FILE: {fpath} ---")
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                for key, val in keywords.items():
                    print(f"Searching for {key} ({val})...")
                    count = 0
                    for i, line in enumerate(lines):
                        if val in line:
                            # Print snippets
                            snippet = line.strip()[:60]
                            print(f"  Line {i}: {snippet}...")
                            count += 1
                            if count >= 3: # Limit hits
                                break
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    search_keywords()
