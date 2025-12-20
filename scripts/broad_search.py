import json
import glob

def search_json(directory, search_terms):
    print(f"Searching in {directory} for: {search_terms}")
    files = glob.glob(f"{directory}/*.json")
    for f_path in files:
        try:
            with open(f_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for item in data:
                    content = item.get('content', '') or ''
                    title = item.get('title', '') or ''
                    
                    for term in search_terms:
                        if term in content or term in title:
                            print(f"[MATCH] File: {f_path} | ID: {item['id']} | Term: '{term}'")
                            # print(f"Title: {title}")
        except Exception as e:
            print(f"Error reading {f_path}: {e}")

# Terms from the Docx files
terms_ja = [
    "不眠症とは少しも睡くならないもの", # Kakuron 2
    "急所を見つけてやる", # Soron 2
    "浄霊の力を抜くこと", # Soron 3 (Header/Theme)
    "一番肝腎な事は、急所", # Soron 2 snippet
    "恐怖時代が来るという事", # Found in verify output for fundamentos_4, let's see if it matches Soron 3 content?
]

terms_pt = [
    "insônia", 
    "pontos vitais", 
    "relaxar a força",
    "medicina espiritual",
    "encontrar os pontos vitais",
    "atrofia renal" # pf98 check
]

print("--- JA Search ---")
search_json('data', terms_ja)

print("\n--- PT Search ---")
search_json('data', terms_pt)
