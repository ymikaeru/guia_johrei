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

item_id = 'fundamentos_45'

# Find items
pt_item = next((i for i in pt_data if i['id'] == item_id), None)
ja_item = next((i for i in ja_data if i['id'] == item_id), None)

if not pt_item or not ja_item:
    print("Item not found")
    sys.exit(1)

pt_content = pt_item['content']
ja_content = ja_item['content']

# Apply JS regex logic: jaContent.replace(/^\s*[（(].+?[）)]\s*/s, '').trim()
# Note: Python regex for DOTALL is re.S
ja_content = re.sub(r'^\s*[（(].+?[）)]\s*', '', ja_content, flags=re.S).strip()

print("--- PT Content Analysis ---")
pt_lines = pt_content.split('\n')
print(f"Total Lines (split \\n): {len(pt_lines)}")
for i, line in enumerate(pt_lines):
    print(f"[{i}] {line[:20]}...")

print("\n--- JA Content Analysis ---")
ja_lines = ja_content.split('\n')
print(f"Total Lines (split \\n): {len(ja_lines)}")
for i, line in enumerate(ja_lines):
    print(f"[{i}] {line[:20]}...")

print("\n--- Block Analysis (split by \\n\\n) ---")
# Split by >= 2 newlines
pt_blocks = [b for b in re.split(r'\n\n+', pt_content) if b.strip()]
ja_blocks = [b for b in re.split(r'\n\n+', ja_content) if b.strip()]

print(f"PT Blocks: {len(pt_blocks)}")
print(f"JA Blocks: {len(ja_blocks)}")

max_blocks = max(len(pt_blocks), len(ja_blocks))
for i in range(max_blocks):
    pt_len = len(pt_blocks[i]) if i < len(pt_blocks) else 0
    ja_len = len(ja_blocks[i]) if i < len(ja_blocks) else 0
    print(f"Block {i}: PT={pt_len} chars, JA={ja_len} chars")


# Append logic to dump last blocks
print('
--- DETAILED BLOCK DUMP ---')
print('JA Block 8:')
print(ja_blocks[8])
print('
PT Block 8:')
print(pt_blocks[8])
print('
PT Block 9:')
print(pt_blocks[9])
print('
PT Block 10:')
print(pt_blocks[10])

