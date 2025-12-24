import json
import re

def fix_remaining():
    # Load Kakuron 1
    with open("Docx_Original/各論.md", 'r', encoding='utf-8') as f:
        k1_content = f.read()
    
    k1_lines = k1_content.split('\n')
    
    updates = {}
    
    # 1. Fix pf123 (Cancer) using K1 General Cancer section
    # Snippet: "癌に関係した病気の多い事も" (Line 354 approx)
    # Extract until next section or reasonable end.
    pf123_content = extract_block(k1_lines, r"癌に関係した病気の多い事も", r"^\#|^\d+\)|\(天国の福音")
    if pf123_content:
        updates['pf123'] = pf123_content
    else:
        print("Could not find General Cancer section in Kakuron 1")

    # 2. Find pf120 (Milk)
    # Search for '乳' lines
    # Snippet PT: "A falta de leite indica algum problema: ou há toxina..."
    # JA keywords: 乳不足, 毒素
    
    # Scan lines for "乳"
    found_milk = None
    for i, line in enumerate(k1_lines):
        if "乳" in line and "毒" in line: # Milk and Toxin
            # Potential match!
            print(f"Candidate for pf120 (K1 Line {i}): {line.strip()[:60]}...")
            # Check context
            # "There are cases where milk doesn't come out... this is due to toxins..."
            # Try to capture this block
            # Start from this paragraph?
            # Or is there a header?
            # Let's extract this paragraph.
            found_milk = line.strip() # + maybe neighbours?
            # Let's extract surrounding lines
            start = max(0, i - 2)
            end = min(len(k1_lines), i + 15)
            block = "\n".join(k1_lines[start:end])
            updates['pf120'] = block # Provisional
            break
            
    if not found_milk:
        # Check K2?
        pass

    # Update JSON
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
    fix_remaining()
