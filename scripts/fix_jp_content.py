
import json
import re
import os
import shutil

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
    header_pattern = re.compile(r'^(#+\s*)(.+)$')

    for line in lines:
        line = line.strip()
        match = header_pattern.match(line)
        
        if match:
            # Save previous section
            if current_title:
                sections[current_title] = "\n".join(current_content).strip()
            
            # Start new section
            raw_title = match.group(2).strip()
            current_title = normalize_key(raw_title)
            current_content = []
        elif current_title:
            if re.match(r'^\d{4}\.\d{2}\.\d{2}', line) or re.match(r'^（.+）$', line):
                 # Keep citations in content for the fix script as they appear in JSON often
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
    if not text:
        return ""
    return re.sub(r'\s+', '', text)

def update_json_file(json_path, md_data):
    """
    Updates the JSON file with content from Markdown data.
    """
    print(f"Updating {os.path.basename(json_path)}...")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    updates_count = 0
    
    for item in data:
        # Only process Pontos Focais or items that look like them (Volume 2 mainly)
        # Check volume or ID if possible, but generic match is safer
        
        item_id = item.get('id', 'UNKNOWN')
        label_jp = item.get('label_jp', '')
        title_jp = item.get('title_jp', '')
        content_jp = item.get('content_jp', '')

        # Determine Search Key matches
        keys_to_try = []
        
        # 1. Clean Title (remove markdown hashes if present)
        raw_title_line = title_jp.split('\n')[0]
        raw_title_line = re.sub(r'^#+\s*', '', raw_title_line)
        clean_title = normalize_key(raw_title_line)
        
        # 2. Clean Label
        clean_label = normalize_key(label_jp)
        
        if clean_title:
            keys_to_try.append(clean_title)
            keys_to_try.append(re.sub(r'^\d+[).]', '', clean_title))
            
        if clean_label:
            keys_to_try.append(clean_label)
            keys_to_try.append(re.sub(r'^\d+[).]', '', clean_label))
            
        # 3. Combined
        if clean_label and clean_title:
             keys_to_try.append(clean_label + clean_title)

        md_content = None
        used_key = None
        
        for k in keys_to_try:
            if k in md_data:
                md_content = md_data[k]
                used_key = k
                break
        
        if md_content:
            # Check if update is needed
            # For update, we want to replace content_jp with the md_content
            # BUT we need to be careful. JSON 'title_jp' usually contains the header.
            # If we replace 'content_jp', we should ensure 'title_jp' is consistent??
            # Actually, per user request, we just correct 'content_jp'.
            # However, in Vol 2, 'title_jp' often has the header AND 'content_jp' has the text.
            # IN MD data, we captured the text under the header. 
            
            # Let's compare normalized versions to see if they are different
            norm_json_full = normalize_text(title_jp + content_jp)
            norm_md = normalize_text(md_content)
            
            # If JSON content is just a subset or completely different, we update.
            # Note: We should NOT overwrite title_jp, only content_jp.
            # But wait, md_content is just the text body (lines after header).
            # So comparing md_content to content_jp is the right move.
            
            norm_current_content = normalize_text(content_jp)
            
            # Special case: citations. MD might have them, JSON might have them.
            
            if norm_current_content != norm_md:
                # Update!
                # Only update if the difference is significant? 
                # User wants "Correct content". 
                # Let's trust MD as source of truth.
                
                # Check similarity to avoid replacing with empty or wrong stuff
                if len(md_content) > 0:
                    item['content_jp'] = md_content
                    updates_count += 1
                    # print(f"  Updated {item_id} (Key: {used_key})")
        
    print(f"  Updated {updates_count} items.")
    
    # Write back
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_bilingual_map(bilingual_paths):
    """
    Loads bilingual JSONs and builds a map of ID -> ContentJP.
    These files are assumed to be already updated with correct Markdown content.
    """
    content_map = {}
    for path in bilingual_paths:
        if not os.path.exists(path):
            continue
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for item in data:
            if 'id' in item and 'content_jp' in item:
                content_map[item['id']] = item['content_jp']
    return content_map

def update_site_file(json_path, content_map):
    """
    Updates site/complete JSON files by replacing the Japanese portion of the 'content' field.
    """
    print(f"Updating {os.path.basename(json_path)}...")
    if not os.path.exists(json_path):
        print(f"  File not found: {json_path}")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    updates_count = 0
    
    # Regex to find the Japanese section marker
    # Matches: **Original (Japonês):** (and potential following newlines)
    marker_pattern = re.compile(r'(\n+---\n+\*\*Original \(Japonês\):\*\*\n+)(.*)', re.DOTALL)
    
    for item in data:
        item_id = item.get('id')
        if not item_id or item_id not in content_map:
            continue
            
        new_jp_content = content_map[item_id]
        if not new_jp_content:
            continue
            
        current_content = item.get('content', '')
        
        # Check if item has the Japanese marker
        match = marker_pattern.search(current_content)
        
        if match:
             # Recompose content: PT part + Marker + New JP Part
             # match.group(0) is the whole match (marker + content)
             # match.start() is the index where it starts
             
             pt_part = current_content[:match.start()]
             marker_part = match.group(1) # Keeps thenewlines and separator
             
             # Check if update is needed (compare normalized)
             old_jp_content = match.group(2)
             
             if normalize_text(old_jp_content) != normalize_text(new_jp_content):
                 new_full_content = pt_part + marker_part + new_jp_content
                 item['content'] = new_full_content
                 updates_count += 1
        else:
             # Access case: Item might be in bilingual file but SITE file doesn't have JP section yet?
             # Or structure is different.
             # If it's a "Pontos Focais" item, it usually should have it.
             # Let's verify type.
             if item.get('source') == 'Pontos Focais Vol.01' or item.get('source') == 'Pontos Focais Vol.02':
                  # Append it if missing?
                  # For now, let's stick to updating existing ones to avoid format breakage.
                  pass

    print(f"  Updated {updates_count} items.")
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    base_dir = "/Users/michael/Documents/Ensinamentos/guia_johrei"
    md_dir = os.path.join(base_dir, "Markdown/MD_Original")
    data_dir = os.path.join(base_dir, "data")
    
    # 1. Parse Markdown Files & Update Bilingual Files (Verify & Fix)
    print("Parsing Markdown and Updating Bilingual Files...")
    md_vol1 = parse_markdown(os.path.join(md_dir, "各論.md"))
    md_vol2 = parse_markdown(os.path.join(md_dir, "各論２.md"))
    
    p_vol1_bi = os.path.join(data_dir, "pontos_focais_vol01_bilingual.json")
    p_vol2_bi = os.path.join(data_dir, "pontos_focais_vol02_bilingual.json")
    
    update_json_file(p_vol1_bi, md_vol1)
    update_json_file(p_vol2_bi, md_vol2)
    
    # 2. Load the Authoritative Maps from Updated Bilingual Files
    print("\nLoading Updated Content Map...")
    content_map = load_bilingual_map([p_vol1_bi, p_vol2_bi])
    print(f"Loaded {len(content_map)} items in map.")
    
    # 3. Update Site and Complete Files
    print("\nPropagating updates to Site and Complete files...")
    update_site_file(os.path.join(data_dir, "pontos_focais_vol01_site.json"), content_map)
    update_site_file(os.path.join(data_dir, "pontos_focais_vol02_site.json"), content_map)
    
    # Update complete file
    # Ensure encoding is handled
    update_site_file(os.path.join(data_dir, "guia_johrei_complete.json"), content_map)

if __name__ == "__main__":
    main()
