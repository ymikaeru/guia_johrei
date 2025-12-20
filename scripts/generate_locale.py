
import json
import re

def kanji_to_int(kanji):
    # Simple mapping for 1-99 if needed
    # The extraction script used 1-10 dict.
    # Let's expand slightly just in case.
    nums = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
            '１':1, '２':2, '３':3, '４':4, '５':5, '６':6, '７':7, '８':8, '９':9, '０':0,
            '1':1, '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, '0':0}
    
    if kanji in nums:
        return nums[kanji]
    
    # Handle composite digits (ASCII or Full Width Strings like '11' or '１１')
    if kanji.isdigit():
        return int(kanji)
    
    # Simple tens logic (十一 to 十九)
    if len(kanji) == 2 and kanji.startswith('十'):
         # 十一 = 11
         suffix = kanji[1]
         return 10 + nums.get(suffix, 0)
    
    # 二十 etc
    if kanji == '二十': return 20
    if kanji.startswith('二十'):
         suffix = kanji[2]
         return 20 + nums.get(suffix, 0)

    # Fallback
    return 0

def generate_locale():
    with open('data/teachings_ja_raw.json', 'r', encoding='utf-8') as f:
        jp_data = json.load(f)

    with open('data/fundamentos.json', 'r', encoding='utf-8') as f:
        pt_data = json.load(f)

    # Index JP data by (Source, SectionInt)
    jp_map = {}
    for item in jp_data:
        # Source normalization: "Johrei Hō Kōza Vol.01"
        source = item['source']
        try:
            sec_num = kanji_to_int(item['section_kanji'])
        except:
            sec_num = -1
        
        key = (source, sec_num)
        jp_map[key] = item

    ja_output = []
    
    matched_count = 0
    
    # Group items by Source
    pt_by_source = {}
    for item in pt_data:
        src = item.get('source', 'Unknown')
        if src not in pt_by_source:
            pt_by_source[src] = []
        pt_by_source[src].append(item)

    jp_by_source = {}
    for item in jp_data:
        src = item['source']
        if src not in jp_by_source:
            jp_by_source[src] = []
        jp_by_source[src].append(item)

    # Sort and Match
    ja_output = []
    # We need to preserve the original list structure/order of pt_data for the output file?
    # Actually, usually locale files are keyed by ID. Here it is a list of objects.
    # We should reconstruct the list in ORIGINAL order or just a list of translated items.
    # But usually we want to modify the items in place.
    # Better: Create a map of ID -> JP Content after matching.
    
    id_to_jp = {}

    for src, pt_items in pt_by_source.items():
        if src not in jp_by_source:
             print(f"Skipping Source {src} (No JP data)")
             continue
        
        jp_items = jp_by_source[src]
        
        # Sort PT by order
        pt_sorted = sorted(pt_items, key=lambda x: x.get('order', 9999))
        
        # Sort JP by section (need to calculate int)
        # Helper to get sec num
        def get_sec_num(it):
            try:
                return kanji_to_int(it['section_kanji'])
            except:
                return 9999
        
        jp_sorted = sorted(jp_items, key=get_sec_num)
        
        # Match
        count = min(len(pt_sorted), len(jp_sorted))
        # print(f"Source {src}: Matching {count} items (PT: {len(pt_sorted)}, JP: {len(jp_sorted)})")
        
        for i in range(count):
            p = pt_sorted[i]
            j = jp_sorted[i]
            # Map ID to Content
            id_to_jp[p['id']] = j

    # Build Output
    matched_count = 0
    for pt_item in pt_data:
        new_item = pt_item.copy()
        if pt_item['id'] in id_to_jp:
            jp_match = id_to_jp[pt_item['id']]
            new_item['title'] = jp_match['original_title']
            new_item['content'] = jp_match['content']
            new_item['lang'] = 'ja'
            matched_count += 1
        ja_output.append(new_item)


    print(f"Generated data/fundamentos_ja.json with {matched_count} Japanese items.")

    with open('data/fundamentos_ja.json', 'w', encoding='utf-8') as f:
        json.dump(ja_output, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    generate_locale()
