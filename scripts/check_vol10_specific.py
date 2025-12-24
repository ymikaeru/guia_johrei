import json
import re

def count_paragraphs(text):
    if not text:
        return 0
    return len([p for p in re.split(r'\n\s*\n', text) if p.strip()])

def check_vol10_alignment():
    file_path = 'data/johrei_vol10.json'
    with open(file_path, 'r', encoding='utf-8') as f:
        items = json.load(f)
        
    print(f"Checking {len(items)} items in {file_path}")
    
    mismatch_count = 0
    
    for item in items:
        pt_count = count_paragraphs(item.get('content_pt', ''))
        ja_count = count_paragraphs(item.get('content_ja', ''))
        
        if pt_count != ja_count:
            mismatch_count += 1
            print(f"[MISMATCH] {item['id']}: PT={pt_count} vs JA={ja_count}")
            # print(f"PT Title: {item.get('title_pt')}")
            # print(f"JA Content Preview: {item.get('content_ja')[:50]}...")
            
    if mismatch_count == 0:
        print("PERFECT: All items have matching paragraph counts.")
    else:
        print(f"Total Mismatches: {mismatch_count}")

check_vol10_alignment()
