import json
import re

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def clean_text(text):
    return re.sub(r'\s+', ' ', text).strip()

def analyze():
    data_path = 'data/johrei_vol10.json'
    ref_path = 'data_reference/johrei_vol10_ref.json'
    
    data = load_json(data_path)
    ref = load_json(ref_path)
    
    ref_pt = ref['content']['portugues']
    ref_ja = ref['content']['japones']
    
    print(f"Ref PT Length: {len(ref_pt)}")
    print(f"Ref JA Length: {len(ref_ja)}")
    
    # Analyze where each item's distinct PT text sits in Ref PT
    last_end = 0
    
    for item in data:
        if item.get('type') != 'teaching':
            continue
            
        pt_content = item.get('content_pt', '').strip()
        if not pt_content:
            print(f"Item {item['id']} has no PT content")
            continue
            
        # Try to find exactly (or fuzzy)
        # Use a chunk of the start and end to locate
        start_chunk = pt_content[:50]
        end_chunk = pt_content[-50:]
        
        start_idx = ref_pt.find(start_chunk)
        if start_idx == -1:
            print(f"Item {item['id']} START not found in Ref")
            # Try cleaning
            cleaned_pt = clean_text(pt_content)
            cleaned_ref = clean_text(ref_pt)
            start_idx_cl = cleaned_ref.find(cleaned_pt[:50])
            if start_idx_cl != -1:
                 print(f"  (Found in cleaned text at {start_idx_cl})")
            else:
                 print(f"  (Totally not found)")
            continue
            
        # Find end
        # We search from start_idx
        end_idx = ref_pt.find(end_chunk, start_idx) + len(end_chunk)
        
        total_len = len(ref_pt)
        print(f"Item {item['id']} | Range: {start_idx}-{end_idx} | Len: {len(pt_content)} | Gap from last: {start_idx - last_end}")
        
        last_end = end_idx

if __name__ == '__main__':
    analyze()
