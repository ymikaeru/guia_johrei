import json
import re

def list_pf_missing():
    ja_data = json.load(open('data/fundamentos_ja.json', encoding='utf-8'))
    pt_data = json.load(open('data/fundamentos.json', encoding='utf-8'))
    
    pt_titles = {i['id']: i['title'] for i in pt_data}
    
    jp_pattern = re.compile(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]')
    
    missing = []
    # Check for IDs starting with 'pf'
    for item in ja_data:
        if not item['id'].startswith('pf'):
            continue
            
        content = item.get('content', '')
        # Missing JA chars
        if not content or not jp_pattern.search(content) or (len(jp_pattern.findall(content)) / len(content) < 0.05):
             missing.append({
                "id": item['id'],
                "title": pt_titles.get(item['id'], "Unknown"),
            })

    missing.sort(key=lambda x: int(x['id'].replace('pf', '')) if x['id'].replace('pf', '').isdigit() else 999)
    
    print(f"Found {len(missing)} 'pf' items.")
    for m in missing:
        print(f"{m['id']} | {m['title']}")

if __name__ == "__main__":
    list_pf_missing()
