import json
import re
import os

PT_PATH = '/Users/michael/Documents/Ensinamentos/guia_johrei/data/fundamentos.json'
JA_PATH = '/Users/michael/Documents/Ensinamentos/guia_johrei/data/fundamentos_ja.json'
RAW_PATH = '/Users/michael/Documents/Ensinamentos/guia_johrei/data/teachings_ja_raw.json'

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def count_paras(text):
    if not text: return 0
    return len([p for p in re.split(r'\n\s*\n', text.strip()) if p.strip()])

def align_text(ja_text, target_count):
    # Simple heuristic alignment if needed
    # For now, just normalization
    if not ja_text: return ""
    paras = [p.strip() for p in re.split(r'\n\s*\n', ja_text) if p.strip()]
    
    # If we have fewer paras than target, try splitting by '。' in the longest paragraph
    # This is a basic retry loop
    while len(paras) < target_count:
        # Find longest paragraph
        longest_idx = -1
        max_len = 0
        for i, p in enumerate(paras):
            if len(p) > max_len and '。' in p[:-1]: # Must have a period not at the very end
                longest_idx = i
                max_len = len(p)
        
        if longest_idx == -1:
            break # Cannot split further
            
        # Split longest
        p = paras[longest_idx]
        # Find first period? Or middle period?
        # Let's try to split roughly in half at a period
        mid = len(p) // 2
        best_split = -1
        min_dist = len(p)
        
        for m in re.finditer(r'。', p):
            dist = abs(m.start() - mid)
            if dist < min_dist:
                min_dist = dist
                best_split = m.start() + 1 # Include period in first part
        
        if best_split != -1 and best_split < len(p):
            p1 = p[:best_split].strip()
            p2 = p[best_split:].strip()
            paras[longest_idx] = p1
            paras.insert(longest_idx + 1, p2)
        else:
            break
            
    return '\n\n'.join(paras)

def main():
    pt_data = load_json(PT_PATH)
    ja_data = load_json(JA_PATH)
    raw_data = load_json(RAW_PATH)
    
    # 1. Extract content for 48 and 49
    content_48 = ""
    content_49 = ""
    
    # Find 48 ("Principle") in Raw
    # Searching for substring logic
    for item in raw_data:
        if "content" in item and "＝　第　三　＝" in item["content"]:
            # Extract section
            blob = item["content"]
            start_str = "＝　第　三　＝"
            idx_start = blob.find(start_str)
            # Find end? Assuming it goes to end of this blob or next section
            # Check if there is Section 4
            idx_end = len(blob)
            # You might want to refine this if Section 4 exists
            
            # Refinement based on Step 28 JA 48 content which was "Human is Vessel"
            # No, looking for "Principle".
            # The found text in Step 36 started with "前項に述べた..." inside "Section 3"
            
            # Let's take from start_str
            content_48 = blob[idx_start:].strip()
            # Remove the header "＝　第　三　＝" if desired, or keep it as title?
            # PT doesn't have "Section 3".
            content_48 = content_48.replace("＝　第　三　＝", "").strip()
            break
            
    # Find 49 ("Inefficacy") in Raw
    for item in raw_data:
        if "content" in item and "効かなくなったペニシリン" in item["content"]:
             content_49 = item["content"]
             break
             
    print(f"Found Content 48: {len(content_48)} chars")
    print(f"Found Content 49: {len(content_49)} chars")
    
    # 2. Build new JA lists
    # Create a map of ID -> Item for JA
    ja_map = {item['id']: item for item in ja_data}
    
    new_ja_list = []
    
    # Process PT items to ensure order and alignment
    for pt_item in pt_data:
        pid = pt_item['id']
        
        if pid not in ja_map and "fundamentos" in pid:
             # Should exist
             pass
             
        # Specific handling for Vol.01 46-49
        if pid == "fundamentos_46":
            # Take JA 47
            if "fundamentos_47" in ja_map:
                new_item = ja_map["fundamentos_47"].copy()
                new_item['id'] = "fundamentos_46"
                new_item['title'] = pt_item['title'] # Keep PT title? No, use JA title if it matches concept.
                # JA 47 title was "Health Truth" which matched PT 46 "Truth about Health".
                # So keep JA title (or ensure it's correct)
                new_item['source'] = pt_item.get('source', '')
                new_item['lang'] = 'ja'
                new_ja_list.append(new_item)
            else:
                print("Missing JA 47 for shifting")
                
        elif pid == "fundamentos_47":
            # Take JA 48
            if "fundamentos_48" in ja_map:
                new_item = ja_map["fundamentos_48"].copy()
                new_item['id'] = "fundamentos_47"
                # JA 48 title was "Human is Vessel" -> Match PT 47 "Human as Vessel"
                new_item['source'] = pt_item.get('source', '')
                new_item['lang'] = 'ja'
                new_ja_list.append(new_item)
                
        elif pid == "fundamentos_48":
            # New Content 48
            new_item = {
                "id": "fundamentos_48",
                "title": "浄霊の原理", # Principle of Johrei
                "content": content_48,
                "source": "Johrei Hō Kōza Vol.01",
                "tags": pt_item.get('tags', []),
                "lang": "ja"
            }
            # Align
            target = count_paras(pt_item.get('content'))
            new_item['content'] = align_text(new_item['content'], target)
            new_ja_list.append(new_item)
            
        elif pid == "fundamentos_49":
            # New Content 49
            new_item = {
                "id": "fundamentos_49",
                "title": "薬石無効", # Inefficacy of Medicine
                 "content": content_49,
                "source": "Johrei Hō Kōza Vol.01",
                "tags": pt_item.get('tags', []),
                "lang": "ja"
            }
             # Align
            target = count_paras(pt_item.get('content'))
            new_item['content'] = align_text(new_item['content'], target)
            new_ja_list.append(new_item)
            
        else:
            # Keep original JA item if exists, else match PT structure
            if pid in ja_map:
                new_ja_list.append(ja_map[pid])
            else:
                # If missing in JA but in PT, maybe create placeholder? 
                # For now just ignore or print warning
                pass

    # Update the file
    # Merge new list into strictly replacing the old JA data? 
    # Or just replace the specific items?
    # The file contains MANY items. I should only update the modified ones to be safe?
    # But order matters. 
    # Let's update `ja_data` in place.
    
    # Better: Update the specific items in the original list to preserve others
    output_data = []
    
    # Create dict of new items
    updates = {item['id']: item for item in new_ja_list if item['id'] in ["fundamentos_46", "fundamentos_47", "fundamentos_48", "fundamentos_49"]}
    
    for item in ja_data:
        iid = item.get('id')
        if iid in updates:
            output_data.append(updates[iid])
        else:
            output_data.append(item)
            
    save_json(JA_PATH, output_data)
    print("Updates applied.")

if __name__ == "__main__":
    main()
