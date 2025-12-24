import json
import re

def update_milk_and_hemorrhage():
    # 1. Update pf120 (Milk) from Kakuron 2
    k2_path = "Docx_Original/各論２.md"
    try:
        with open(k2_path, 'r', encoding='utf-8') as f:
            k2_lines = f.readlines()
    except:
        return

    # Extract Milk
    # Start: "1)　汁乳不良" (Line 912 approx)
    # End: Next "2)" or section?
    milk_block = extract_block(k2_lines, r"1\)\s*汁乳不良", r"^\d+\)|^\#")
    
    # 2. Update johrei_vol08_08 (Intestinal Hemorrhage) from Vol 8
    vol8_path = "Docx_Original/浄霊法講座（八）（胃・腸疾患）.md"
    try:
        with open(vol8_path, 'r', encoding='utf-8') as f:
            vol8_lines = f.readlines()
    except:
        print("Vol 8 file not found")
        vol8_lines = []

    # Search for "Hemorragia intestinal" -> "腸出血"
    # Or just items.
    # I already did exact mapping for Vol 8 before!
    # Let's search for the line "腸出血" in vol 8 and extract paragraph.
    hemorrhage_block = extract_block(vol8_lines, r"腸出血", r"^\d+\)|^\#|^\（")

    # Update JSON
    ja_path = 'data/fundamentos_ja.json'
    try:
        ja_data = json.load(open(ja_path, encoding='utf-8'))
    except:
        return

    updated_milk = False
    updated_hemo = False

    for item in ja_data:
        if item['id'] == 'pf120' and milk_block:
            item['content'] = milk_block
            updated_milk = True
        elif item['id'] == 'johrei_vol08_08' and hemorrhage_block:
            # Maybe append or replace?
            # If current content is PT, replace.
            # Check if current content has NO JA chars?
            # Assuming yes as it was flagged.
            item['content'] = hemorrhage_block
            updated_hemo = True

    with open(ja_path, 'w', encoding='utf-8') as f:
        json.dump(ja_data, f, ensure_ascii=False, indent=2)

    if updated_milk: print("Updated pf120 (Milk)")
    if updated_hemo: print("Updated johrei_vol08_08 (Hemorrhage)")

def extract_block(lines, start_regex, end_regex):
    capturing = False
    buffer = []
    
    start_pattern = re.compile(start_regex)
    end_pattern = re.compile(end_regex)
    
    for line in lines:
        stripped = line.strip()
        if not capturing:
            if start_pattern.search(line):
                capturing = True
                buffer.append(stripped)
        else:
            if end_pattern.search(line) and stripped: # stop on matched header
                break
            buffer.append(stripped)
            
    return "\n\n".join(buffer).strip()

if __name__ == "__main__":
    update_milk_and_hemorrhage()
