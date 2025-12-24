import json
import re

def extract_and_update():
    fpath = "Docx_Original/各論２.md"
    try:
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error: {e}")
        return

    # Mappings regex
    # Format: ID -> (Start Regex, End Regex (optional, or next section))
    extracted_data = {}

    mappings = {
        "pf112": (r"1\)\s*痔瘻", r"^\d+\)"), # Hemorroidas -> Fistula/Hemorrhoids
        "pf113": (r"花柳病は、医学上", r"^\d+\)"), # VD -> Syphilis start. 
        # Wait, VD might be a section start "# **...**".
        # Found: "花柳病は、医学上硬性下疳即ち梅毒及び..." (Line 785)
        # Let's use snippet based.
        
        "pf115": (r"1\)\s*卵巣膿腫と卵巣水腫", r"^\d+\)"), # Ovarianas
        "pf116": (r"1\)\s*白帯下", r"^\d+\)"), # Leucorreia
        "pf119": (r"其他よくあるものに妊娠腎がある", r"^\d+\)|^\#"), # Inchaço (Pregnancy Kidney)
        "pf120": (r"乳", r"$"), # Placeholder, still searching
        "pf123": (r"6\)\s*肺癌", r"^\d+\)"), # Cancer (Lung Cancer found, maybe generalized?)
        "pf125": (r"1\)\s*腫物及び火傷、切傷", r"^\d+\)"), # Boils (Header mostly)
        "pf126": (r"1\)\s*腫物及び火傷、切傷", r"^\d+\)") # Burns (Same header?)
    }
    
    # Manual extraction logic is brittle with regex if structure is loose.
    # I'll use a finder function.
    
    lines = content.split('\n')
    
    # Updates
    updates = {}
    
    # 1. Hemorroidas (pf112)
    # Find "1) 痔瘻" line and read until next "2)"
    updates['pf112'] = extract_block(lines, r"1\)\s*痔瘻", r"^\d+\)|^\#")
    
    # 2. VD (pf113)
    # Find line starting with "花柳病は"
    updates['pf113'] = extract_block(lines, r"^花柳病は", r"^\#|\(天国の福音")

    # 3. Ovarianas (pf115)
    updates['pf115'] = extract_block(lines, r"1\)\s*卵巣膿腫と卵巣水腫", r"^\d+\)")

    # 4. Leucorreia (pf116)
    updates['pf116'] = extract_block(lines, r"1\)\s*白帯下", r"^\d+\)")

    # 5. Inchaço (pf119) -> Pregnancy Kidney
    updates['pf119'] = extract_block(lines, r"其他よくあるものに妊娠腎がある", r"^\d+\)|^\#")
    
    # 8. Cancer (pf123)
    updates['pf123'] = extract_block(lines, r"6\)\s*肺癌", r"^\d+\)") # Using Lung Cancer as proxy?

    # 9. Boils (pf125) & Burns (pf126) -> Same section?
    # Section X: Tumors and Burns/Cuts
    # Content: (Evangelho "Tumors and Burns, Cuts")
    # I'll extract the same for both or look deeper.
    updates['pf125'] = extract_block(lines, r"\# \*\*Ⅹ．腫物及び火傷・切傷\*\*", r"^\#")
    updates['pf126'] = extract_block(lines, r"\# \*\*Ⅹ．腫物及び火傷・切傷\*\*", r"^\#")
    
    # Missing: pf120 (Milk), pf122 (Eczema)
    # Eczema might be "Scabies" (Kaisen) -> Line 1032
    updates['pf122'] = extract_block(lines, r"近来、新しく流行し始めた病気に疥癬", r"^\d+\)|^\#")

    # Load JSON
    ja_path = 'data/fundamentos_ja.json'
    ja_data = json.load(open(ja_path, encoding='utf-8'))
    
    for item in ja_data:
        uid = item['id']
        if uid in updates and updates[uid]:
            print(f"Updating {uid}...")
            item['content'] = updates[uid]
            
    with open(ja_path, 'w', encoding='utf-8') as f:
        json.dump(ja_data, f, ensure_ascii=False, indent=2)

def extract_block(lines, start_regex, end_regex):
    capturing = False
    buffer = []
    
    start_pattern = re.compile(start_regex)
    end_pattern = re.compile(end_regex)
    
    for line in lines:
        if not capturing:
            if start_pattern.search(line):
                capturing = True
                buffer.append(line.strip())
        else:
            if end_pattern.search(line):
                break
            buffer.append(line.strip())
            
    return "\n\n".join(buffer).strip()

if __name__ == "__main__":
    extract_and_update()
