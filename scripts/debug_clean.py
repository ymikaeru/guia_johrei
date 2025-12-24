import json
import re
import sys

# Load JSON
try:
    with open('data/fundamentos.json', 'r', encoding='utf-8') as f:
        pt_data = json.load(f)
    with open('data/fundamentos_ja.json', 'r', encoding='utf-8') as f:
        ja_data = json.load(f)
except FileNotFoundError:
    print("Files not found")
    sys.exit(1)

def analyze_item(item_id):
    print(f"\n======== ANALYZING: {item_id} ========")
    pt_item = next((i for i in pt_data if i['id'] == item_id), None)
    ja_item = next((i for i in ja_data if i['id'] == item_id), None)

    if not pt_item or not ja_item:
        print(f"Item {item_id} NOT FOUND in one or both files.")
        return

    pt_content = pt_item['content']
    ja_content = ja_item['content']

    # Clean JA content (subtitle regex)
    ja_content = re.sub(r'^\s*[（(].+?[）)]\s*', '', ja_content, flags=re.S).strip()

    # Split logic
    pt_blocks = [b for b in re.split(r'\n\n+', pt_content) if b.strip()]
    ja_blocks = [b for b in re.split(r'\n\n+', ja_content) if b.strip()]

    print(f"PT Paragraphs: {len(pt_blocks)}")
    print(f"JA Paragraphs: {len(ja_blocks)}")

    if len(pt_blocks) != len(ja_blocks):
        print("MISMATCH DETECTED!")
        
    print('\n--- BLOCKS MAPPING ---')
    max_b = max(len(pt_blocks), len(ja_blocks))
    for i in range(max_b):
        pt_snippet = pt_blocks[i][:30].replace('\n', ' ') if i < len(pt_blocks) else "MISSING"
        ja_snippet = ja_blocks[i][:30].replace('\n', ' ') if i < len(ja_blocks) else "MISSING"
        print(f"[{i}] PT: {pt_snippet:<40} | JA: {ja_snippet}")

if __name__ == "__main__":
    analyze_item('soron_2')
