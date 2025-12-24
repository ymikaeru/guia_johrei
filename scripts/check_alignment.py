import json
import re

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def count_paragraphs(text):
    if not text:
        return 0
    # Split by double newlines or more, assuming paragraphs are separated by blank lines
    # Also considering single newlines if they seem to be the primary separator, but usually it's \n\n.
    # Let's standardize on \n\n for "paragraphs".
    # Strip whitespace
    text = text.strip()
    if not text:
        return 0
    paragraphs = re.split(r'\n\s*\n', text)
    return len([p for p in paragraphs if p.strip()])

def main():
    pt_path = '/Users/michael/Documents/Ensinamentos/guia_johrei/data/fundamentos.json'
    ja_path = '/Users/michael/Documents/Ensinamentos/guia_johrei/data/fundamentos_ja.json'

    pt_data = load_json(pt_path)
    ja_data = load_json(ja_path)

    ja_map = {item['id']: item for item in ja_data}

    print(f"{'ID':<20} | {'PT Paras':<10} | {'JA Paras':<10} | {'Status':<20}")
    print("-" * 65)

    mismatches = 0
    total_checked = 0

    for pt_item in pt_data:
        # Filter for Johrei Hō Kōza Vol.01
        # Check source carefully
        source = pt_item.get('source', '')
        if "Johrei Hō Kōza Vol.01" not in source:
            continue
        
        item_id = pt_item['id']
        ja_item = ja_map.get(item_id)

        if not ja_item:
            print(f"{item_id:<20} | {'?':<10} | {'MISSING':<10} | Not in JA file")
            continue

        ja_content = ja_item.get('content', '')
        # Check if JA content is actually Portuguese (heuristic: contains many ascii words or specific PT chars)
        # But specifically looking for Japanese chars
        has_japanese = bool(re.search(r'[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]', ja_content))
        
        if not has_japanese:
             print(f"{item_id:<20} | {count_paragraphs(pt_item.get('content')):<10} | {count_paragraphs(ja_content):<10} | JA is PT/Empty")
             continue

        pt_count = count_paragraphs(pt_item.get('content'))
        ja_count = count_paragraphs(ja_content)

        if pt_count != ja_count:
            status = "MISMATCH"
            mismatches += 1
        else:
            status = "OK"

        print(f"{item_id:<20} | {pt_count:<10} | {ja_count:<10} | {status}")
        total_checked += 1

    print("-" * 65)
    print(f"Total checked: {total_checked}")
    print(f"Mismatches: {mismatches}")

if __name__ == "__main__":
    main()
