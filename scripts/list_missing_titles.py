import json
import re

def list_missing():
    # Detect missing JA
    ja_data = json.load(open('data/fundamentos_ja.json', encoding='utf-8'))
    pt_data = json.load(open('data/fundamentos.json', encoding='utf-8'))
    
    # Map ID -> PT Title
    pt_titles = {i['id']: i['title'] for i in pt_data}
    
    jp_pattern = re.compile(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]')
    
    missing = []
    for item in ja_data:
        content = item.get('content', '')
        if not content or not jp_pattern.search(content):
            missing.append({
                "id": item['id'],
                "title": pt_titles.get(item['id'], "Unknown Title"),
                "snippet": content[:30].replace("\n", " ")
            })
            
    # Also Check "Low Ratio"
    for item in ja_data:
        content = item.get('content', '')
        if content and jp_pattern.search(content):
            ratio = len(jp_pattern.findall(content)) / len(content)
            if ratio < 0.05:
                 missing.append({
                    "id": item['id'],
                    "title": pt_titles.get(item['id'], "Unknown Title"),
                    "snippet": f"[Ratio {ratio:.2f}] " + content[:30].replace("\n", " ")
                })

    # Sort by ID
    missing.sort(key=lambda x: x['id'])
    
    # Remove duplicates
    seen = set()
    unique_missing = []
    for m in missing:
        if m['id'] not in seen:
            unique_missing.append(m)
            seen.add(m['id'])

    print(f"Found {len(unique_missing)} items needing fix.")
    for m in unique_missing:
        print(f"{m['id']}: {m['title']} ({m['snippet']})")

if __name__ == "__main__":
    list_missing()
