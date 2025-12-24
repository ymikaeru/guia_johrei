
import json
import re
import os
import difflib

def parse_markdown(file_path):
    """
    Parses the markdown file to extract sections.
    Returns a dictionary: { "Title_JP": "Content_JP" }
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    sections = {}
    current_title = None
    current_content = []

    # Regex to capture content headers
    # Matches:
    # #### 【Title】
    # ### １．Title
    # #### 1) Title
    # #### Title
    header_pattern = re.compile(r'^(#+\s*)(.+)$')

    for line in lines:
        line = line.strip()
        match = header_pattern.match(line)
        
        if match:
            # Save previous section
            if current_title:
                sections[current_title] = "\n".join(current_content).strip()
            
            # Start new section
            # string header markers and whitespace
            raw_title = match.group(2).strip()
            # unique key strategies:
            # 1. Full raw title: "【頭痛】" or "1)　脳天..."
            # 2. Cleaned title: "頭痛" or "1)脳天..."
            current_title = normalize_key(raw_title)
            # Store also the raw title? No, normalize everything.
            
            current_content = []
        elif current_title:
            if re.match(r'^\d{4}\.\d{2}\.\d{2}', line) or re.match(r'^（.+）$', line):
                 # Skip date lines and citation lines (e.g. （浄霊法講座...）)
                 # Wait, sometimes citations are part of content? 
                 # User said "Correcting Japanese Focus Points", usually implies main text.
                 # Let's keep citation lines in content for now as they might be in JSON.
                 pass
            
            if line == "":
                continue
            current_content.append(line)

    # Save last section
    if current_title:
        sections[current_title] = "\n".join(current_content).strip()

    return sections

def normalize_key(text):
    """
    Normalize header/title for key matching.
    """
    if not text:
        return ""
    # Remove ####, spaces
    t = text.replace('【', '').replace('】', '')
    t = re.sub(r'\s+', '', t)
    return t

def normalize_text(text):
    """
    Normalize text for comparison: remove whitespace, newlines.
    """
    if not text:
        return ""
    return re.sub(r'\s+', '', text)

def compare_content(json_path, markdown_data):
    """
    Compares JSON content_jp with Markdown content.
    """
    print(f"--- Checking {os.path.basename(json_path)} ---")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    mismatches = []
    missing_in_md = []

    for item in data:
        item_id = item.get('id', 'UNKNOWN')
        label_jp = item.get('label_jp', '')
        title_jp = item.get('title_jp', '')
        content_jp = item.get('content_jp', '')

        # Determine Search Key
        # Priority: 
        # 1. title_jp (if it looks like a header or short title)
        # 2. label_jp
        
        keys_to_try = []
        
        # Clean potential keys
        # Remove hashes from title_jp if present
        raw_title_line = title_jp.split('\n')[0]
        raw_title_line = re.sub(r'^#+\s*', '', raw_title_line)
        
        clean_title = normalize_key(raw_title_line) 
        clean_label = normalize_key(label_jp)
        
        if clean_title:
            keys_to_try.append(clean_title)
            # Try removing initial numbering standard like "1)"
            keys_to_try.append(re.sub(r'^\d+[).]', '', clean_title))
            
        if clean_label:
            keys_to_try.append(clean_label)
            keys_to_try.append(re.sub(r'^\d+[).]', '', clean_label))
            
        # Try finding combined key if label is numbering (VSCode)
        if clean_label and clean_title:
             keys_to_try.append(clean_label + clean_title)

        md_content = None
        used_key = None
        
        for k in keys_to_try:
            if k in markdown_data:
                md_content = markdown_data[k]
                used_key = k
                break
        
        if not md_content:
            missing_in_md.append(f"[{item_id}] Keys '{keys_to_try}' not found in Markdown")
            continue

        # Construct JSON full content
        # If title_jp contains text that is NOT the header, append it.
        # Simple heuristic: compare Normalized JSON vs Normalized MD
        
        # Option A: JSON content is just content_jp
        # Option B: JSON content is title_jp + content_jp
        
        norm_json_A = normalize_text(content_jp)
        norm_json_B = normalize_text(title_jp + content_jp)
        
        norm_md = normalize_text(md_content)

        # Check if either matches
        if norm_json_A == norm_md:
            pass # Match!
        elif norm_json_B == norm_md:
             pass # Match (with title included)!
        elif norm_md in norm_json_B:
             # Markdown content is a subset of JSON? (JSON has extra junk?)
             # Or JSON has extra instructions?
             mismatches.append(f"[{item_id}] Mismatch (MD subset of JSON) for '{used_key}'")
        elif norm_json_B in norm_md:
             # JSON is subset of MD (JSON missing content?)
             mismatches.append(f"[{item_id}] Mismatch (JSON subset of MD) for '{used_key}'") 
        else:
             # formatted_diff = difflib.ndiff([norm_json_B], [norm_md])
             mismatches.append(f"[{item_id}] Complete Mismatch for '{used_key}'")

    print(f"Total Items: {len(data)}")
    print(f"Mismatches: {len(mismatches)}")
    print(f"Missing in MD: {len(missing_in_md)}")


    print(f"Total Items: {len(data)}")
    print(f"Mismatches: {len(mismatches)}")
    print(f"Missing in MD: {len(missing_in_md)}")

    if mismatches:
        print("Mismatch Details (First 5):")
        for m in mismatches[:5]:
            print(m)
    
    if missing_in_md:
        print("Missing Details (First 5):")
        for m in missing_in_md[:5]:
            print(m)
            
    return mismatches

def main():
    base_dir = "/Users/michael/Documents/Ensinamentos/guia_johrei"
    md_dir = os.path.join(base_dir, "Markdown/MD_Original")
    data_dir = os.path.join(base_dir, "data")
    
    # 1. Parse Volume 1
    md_vol1 = parse_markdown(os.path.join(md_dir, "各論.md"))
    json_vol1 = os.path.join(data_dir, "pontos_focais_vol01_bilingual.json")
    
    # 2. Parse Volume 2
    md_vol2 = parse_markdown(os.path.join(md_dir, "各論２.md"))
    json_vol2 = os.path.join(data_dir, "pontos_focais_vol02_bilingual.json")
    
    # 3. Compare
    print("Comparing Volume 1...")
    compare_content(json_vol1, md_vol1)
    
    print("\nComparing Volume 2...")
    compare_content(json_vol2, md_vol2)

if __name__ == "__main__":
    main()
