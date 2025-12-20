import json
import re

def check_vol01():
    try:
        pt_data = json.load(open('data/fundamentos.json', encoding='utf-8'))
        ja_data = json.load(open('data/fundamentos_ja.json', encoding='utf-8'))
    except:
        return

    # Find IDs for Vol 01
    vol01_ids = []
    for item in pt_data:
        if "Vol.01" in item.get('source', ''):
            vol01_ids.append(item['id'])
    
    print(f"Found {len(vol01_ids)} items for Vol.01")
    
    # Check in JA
    ja_map = {i['id']: i for i in ja_data}
    jp_pattern = re.compile(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]')

    wrong_count = 0
    for uid in vol01_ids:
        ja_item = ja_map.get(uid)
        if not ja_item:
            print(f"MISSING JA: {uid}")
            continue
        
        content = ja_item.get('content', '')
        # Check if PT content
        if not jp_pattern.search(content):
            print(f"WRONG CONTENT ({uid}): {content[:30].replace('\n', ' ')}...")
            wrong_count += 1
        elif len(jp_pattern.findall(content)) / len(content) < 0.05:
             print(f"LOW RATIO ({uid}): {content[:30].replace('\n', ' ')}...")
             wrong_count += 1

    print(f"Total Wrong/Suspect: {wrong_count}")

if __name__ == "__main__":
    check_vol01()
