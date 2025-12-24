import json

def check_coverage():
    try:
        pt_data = json.load(open('data/fundamentos.json', encoding='utf-8'))
        ja_data = json.load(open('data/fundamentos_ja.json', encoding='utf-8'))
    except Exception as e:
        print(f"Error loading files: {e}")
        return

    # Check Fundamentos
    pt_ids = {i['id'] for i in pt_data}
    ja_ids = {i['id'] for i in ja_data}
    
    missing_in_ja = pt_ids - ja_ids
    
    # Check for empty content in JA where ID exists
    empty_content = []
    for item in ja_data:
        if not item.get('content', '').strip():
            empty_content.append(item['id'])

    print(f"Total PT Items: {len(pt_ids)}")
    print(f"Total JA Items: {len(ja_ids)}")
    print(f"Missing in JA: {len(missing_in_ja)}")
    if missing_in_ja:
        print("IDs Missing in JA:", missing_in_ja)
    
    print(f"Empty Content in JA: {len(empty_content)}")
    if empty_content:
        print("IDs with Empty Content:", empty_content)

    # Check Pontos Focais?
    # User said "todos os cards", assuming foundations for now as that's where we worked.
    # But let's check basic stats.

if __name__ == "__main__":
    check_coverage()
