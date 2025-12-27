import json
import re
import difflib
from pathlib import Path

def normalize(text):
    # Remove accents/diacritics could be good but let's stick to simple first
    return re.sub(r'[\W_]+', '', text.lower())

def similarity(a, b):
    if not a or not b: return 0.0
    return difflib.SequenceMatcher(None, normalize(a), normalize(b)).ratio()

base_path = Path("/Users/michael/Documents/Ensinamentos/guia_johrei")
md_path = base_path / "Markdown/MD_Portugues"
data_path = base_path / "data"

missing_count = 0

print("--- ANALYSIS START ---")

for vol in range(1, 11):
    vol_str = f"{vol:02d}"
    json_file = data_path / f"johrei_vol{vol_str}_bilingual.json"
    md_file = md_path / f"Johrei Ho Kohza ({vol}).md"

    if not md_file.exists():
        print(f"Warning: MD file not found: {md_file}")
        continue
    
    existing_titles = []
    if json_file.exists():
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                existing_titles = [item.get('title_pt', '') for item in data]
        except Exception as e:
            print(f"Error reading JSON {json_file}: {e}")
    
    with open(md_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"\nChecking Volume {vol}...")
    

    
    # Parse MD file into items (Title, Content)
    md_items = []
    current_item = {}
    buf = []
    
    for line in lines:
        if line.strip().startswith("###"):
            if current_item and 'title' in current_item:
                current_item['content'] = "\n".join(buf).strip()
                md_items.append(current_item)
            
            raw_title = line.strip().lstrip("#").strip()
            # Clean numbering
            clean_title = re.sub(r'^\d+[\.\-]\s*', '', raw_title)
            current_item = {'title': clean_title, 'raw_title': raw_title}
            buf = []
        else:
            buf.append(line)
            
    # Add last item
    if current_item and 'title' in current_item:
        current_item['content'] = "\n".join(buf).strip()
        md_items.append(current_item)
        
    print(f"\nChecking Volume {vol}... ({len(md_items)} items in MD)")
    
    # Check each MD item
    for m in md_items:
        # 1. Try Title Match
        md_title_norm = normalize(m['title'])
        best_title_score = 0
        best_title_match = None
        
        for j in data:
            j_title = j.get('title_pt', '')
            score = similarity(m['title'], j_title)
            if score > best_title_score:
                best_title_score = score
                best_title_match = j
        
        # 2. Try Bio/Content Match (if title confidence is low)
        content_found = False
        md_content_sample = normalize(m['content'])[:100] # Check first 100 chars of normalized content
        
        if best_title_score < 0.8: # If title isn't a strong match, check content
             for j in data:
                 j_content_norm = normalize(j.get('content_pt', ''))
                 # Check if significant part of MD content exists in JSON content
                 # We'll use a sliding window or just simple substring check on normalized text
                 # Since translations might differ slighty, exact substring might fail.
                 # Let's check if the *start* of the question matches.
                 
                 # Better: distinct phrase check.
                 if md_content_sample in j_content_norm:
                     content_found = True
                     break
                 
                 # Reverse check: Is JSON title in MD title?
                 if normalize(j.get('title_pt', '')) in md_title_norm and len(j.get('title_pt', '')) > 5:
                     best_title_score = 0.9 # override
                     break
        else:
            content_found = True # High title match implies existence

        if not content_found and best_title_score < 0.65:
            print(f"MISSING! [{best_title_score:.2f}] '{m['title']}'")
            # print(f"   Sample Content: {m['content'][:50]}...")
            missing_count += 1


print(f"\n--- ANALYSIS COMPLETE. Found {missing_count} potential missing items. ---")
