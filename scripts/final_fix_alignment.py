import json
import re

JA_PATH = '/Users/michael/Documents/Ensinamentos/guia_johrei/data/fundamentos_ja.json'

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def clean_header(text):
    # Remove leading （...）\n if present
    text = text.strip()
    if text.startswith('（') and '）' in text:
        end_idx = text.find('）')
        # Check if newline follows shortly
        if end_idx != -1:
            # Check if it looks like a header (short)
            header = text[:end_idx+1]
            if len(header) < 50:
                return text[end_idx+1:].strip()
    return text

def align_44_to_9(text):
    # JA 44 has 6 paragraphs. Needs 9.
    # Current structure analysis:
    # 1. (Header removed) ...
    # Splitting heuristic: Split long paragraphs at logical points.
    
    paras = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    
    # Heuristic split to reach 9.
    # We need 3 more splits.
    # Let's simple split the longest 3 paragraphs in half at a period.
    
    for _ in range(9 - len(paras)):
        # Find longest
        best_idx = 0
        max_len = 0
        for i, p in enumerate(paras):
            if len(p) > max_len and '。' in p[:-1]:
                max_len = len(p)
                best_idx = i
                
        # Split
        p = paras[best_idx]
        mid = len(p) // 2
        
        # Find closest period to mid
        best_split = -1
        min_dist = len(p)
        for m in re.finditer(r'。', p):
            if abs(m.start() - mid) < min_dist:
                min_dist = abs(m.start() - mid)
                best_split = m.start() + 1
        
        if best_split != -1:
            p1 = p[:best_split].strip()
            p2 = p[best_split:].strip()
            paras[best_idx] = p1
            paras.insert(best_idx+1, p2)
        else:
            break # Can't split more
            
    return '\n\n'.join(paras)

def align_49_to_7(text):
    # JA 49 has 9 paragraphs. Needs 7.
    # Merging heuristic: Merge shortest paragraphs with neighbors.
    
    paras = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    
    # We need 2 merges.
    for _ in range(len(paras) - 7):
        # Find shortest
        min_len = 100000
        best_idx = -1
        
        for i, p in enumerate(paras):
            if len(p) < min_len:
                min_len = len(p)
                best_idx = i
        
        # Merge with previous or next?
        # Prefer merging with previous unless it's the first
        if best_idx > 0:
            paras[best_idx-1] = paras[best_idx-1] + "\n" + paras[best_idx]
            paras.pop(best_idx)
        elif best_idx < len(paras) - 1:
            paras[best_idx] = paras[best_idx] + "\n" + paras[best_idx+1]
            paras.pop(best_idx+1)
        else:
            break
            
    return '\n\n'.join(paras)

def main():
    data = load_json(JA_PATH)
    updated = False
    
    for item in data:
        iid = item.get('id')
        
        if iid == "fundamentos_46":
            if item.get('title') != "健康の真理":
                item['title'] = "健康の真理"
                item['content'] = clean_header(item['content'])
                updated = True
                print("Fixed 46 Title and Header")

        elif iid == "fundamentos_47":
             # Just clean header
             old_c = item['content']
             new_c = clean_header(old_c)
             if old_c != new_c:
                 item['content'] = new_c
                 updated = True
                 print("Cleaned 47 Header")

        elif iid == "fundamentos_48":
             # Already cleaned in previous step? Or from Raw?
             # Raw usually doesn't have parenthetical headers like "（神示の健康法）"
             # But check anyway
             pass
             
        elif iid == "fundamentos_44":
            original = item['content']
            clean = clean_header(original)
            aligned = align_44_to_9(clean)
            if aligned != original:
                item['content'] = aligned
                updated = True
                print(f"Aligned 44: {len(re.split(r'\n\s*\n', original))} -> {len(re.split(r'\n\s*\n', aligned))}")

        elif iid == "fundamentos_49":
            original = item['content']
            clean = clean_header(original) # usually none for restored text
            aligned = align_49_to_7(clean)
            if aligned != original:
                item['content'] = aligned
                updated = True
                print(f"Aligned 49: {len(re.split(r'\n\s*\n', original))} -> {len(re.split(r'\n\s*\n', aligned))}")

    if updated:
        save_json(JA_PATH, data)
        print("Done saving fixes.")
    else:
        print("No changes needed.")

if __name__ == "__main__":
    main()
