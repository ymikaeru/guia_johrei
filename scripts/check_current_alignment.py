import json
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')

def check_alignment(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Checking {file_path}")
    for item in data:
        if item.get('type') != 'teaching':
            continue
            
        id = item.get('id')
        title_pt = item.get('title_pt')
        content_pt = item.get('content_pt', '')
        content_ja = item.get('content_ja', '')
        
        paragraphs_pt = [p for p in content_pt.split('\n\n') if p.strip()]
        paragraphs_ja = [p for p in content_ja.split('\n\n') if p.strip()]
        
        count_pt = len(paragraphs_pt)
        count_ja = len(paragraphs_ja)
        
        status = "MATCH" if count_pt == count_ja else "MISMATCH"
        print(f"[{status}] {id} - {title_pt}: PT={count_pt}, JA={count_ja}")
        if status == "MISMATCH":
            # diff = count_pt - count_ja
            # print(f"  Difference: {diff}")
            pass

check_alignment('/Users/michael/Documents/Ensinamentos/guia_johrei/data/johrei_vol01.json')
