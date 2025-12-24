import json
import re

def recover_all_pf():
    # Load files
    files_content = []
    for path in ["Docx_Original/各論.md", "Docx_Original/各論２.md"]:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                files_content.append(f.read().split('\n'))
        except:
            files_content.append([])
    
    all_lines = files_content[0] + files_content[1] # Combine both files lines

    mappings = {
        "pf37": r"胃の病気", # Gastricas
        "pf44": r"腎臓病", # Rins
        "pf47": r"尿毒", # Urina toxica
        "pf51": r"癌の原因", # Cancer causes (or just 癌 section header)
        "pf69": r"麻疹", # Sarampo
        "pf75": r"癲癇", # Epilepsia
        "pf77": r"気管支炎", # Bronquite
        # pf78: Ponto Vital (Febre/Dor) -> "急所" (already extracted maybe? Or use snippet search)
        # Using snippet heuristic for vague titles
        "pf94": r"喉頭結核", # TB Garganta
        "pf96": r"顔面神経麻痺", # Paralisia facial
        "pf108": r"盲腸炎", # Apendicite
        "pf127": r"西洋薬|漢方薬", # Western Meds
        "pf128": r"下剤", # Laxatives
        "pf130": r"点眼薬|目薬", # Eye drops
        "pf131": r"鼻薬", # Nasal
        "pf132": r"含嗽", # Gargle
        "pf134": r"軟膏", # Ointment
        "pf135": r"仁丹", # Jintan
        "pf136": r"サルバルサン", # Salvarsan
        "pf137": r"ワクチン", # Vaccine
    }

    updates = {}
    
    for uid, pattern in mappings.items():
        # Find start
        found = False
        start_regex = re.compile(pattern)
        
        for i, line in enumerate(all_lines):
            if start_regex.search(line):
                # Found match!
                # Heuristic: Extract until next Header (# or 1))
                # Or extracting paragraph block.
                # Let's try to extract ~20 lines or until header.
                
                buffer = []
                # Buffer backwards for header? No, assume match is title or in title.
                
                # Capture forward
                for j in range(i, min(len(all_lines), i + 100)):
                    l = all_lines[j]
                    stripped = l.strip()
                    # Stop if new section starts (e.g. # **... or 1) ... if valid start was header)
                    if j > i and (stripped.startswith('#') or (stripped.startswith('1)') and len(buffer) > 5)):
                        break
                    buffer.append(l)
                
                updates[uid] = "\n".join(buffer).strip()
                found = True
                break # Take first match
        
        if not found:
            print(f"Skipped {uid} (No match for {pattern})")

    # Apply updates
    ja_path = 'data/fundamentos_ja.json'
    ja_data = json.load(open(ja_path, encoding='utf-8'))
    
    count = 0
    for item in ja_data:
        uid = item['id']
        if uid in updates and updates[uid]:
            # Refine update: don't overwrite good content? 
            # We assume detected as missing.
            item['content'] = updates[uid]
            count += 1
            
    with open(ja_path, 'w', encoding='utf-8') as f:
        json.dump(ja_data, f, ensure_ascii=False, indent=2)
        
    print(f"Updated {count} items.")

if __name__ == "__main__":
    recover_all_pf()
