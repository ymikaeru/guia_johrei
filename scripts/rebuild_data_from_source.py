import json
import re
import os
import glob
from pathlib import Path

# --- Configuration ---
DATA_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"
MD_PT_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/Markdown/MD_Portugues"
MD_JP_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/Markdown/MD_Original"

# Map: Output JSON Filename -> (PT Markdown, JP Markdown, Type)
# Type: "johrei" or "pontos"
FILE_MAPPING = {
    "johrei_vol01_bilingual.json": ("Johrei Ho Kohza (1).md", "浄霊法講座1.md", "johrei"),
    "johrei_vol02_bilingual.json": ("Johrei Ho Kohza (2).md", "浄霊法講座2.md", "johrei"),
    "johrei_vol03_bilingual.json": ("Johrei Ho Kohza (3).md", "浄霊法講座3.md", "johrei"),
    "johrei_vol04_bilingual.json": ("Johrei Ho Kohza (4).md", "浄霊法講座4.md", "johrei"),
    "johrei_vol05_bilingual.json": ("Johrei Ho Kohza (5).md", "浄霊法講座5.md", "johrei"),
    "johrei_vol06_bilingual.json": ("Johrei Ho Kohza (6).md", "浄霊法講座6.md", "johrei"),
    "johrei_vol07_bilingual.json": ("Johrei Ho Kohza (7).md", "浄霊法講座7.md", "johrei"),
    "johrei_vol08_bilingual.json": ("Johrei Ho Kohza (8).md", "浄霊法講座8.md", "johrei"),
    "johrei_vol09_bilingual.json": ("Johrei Ho Kohza (9).md", "浄霊法講座9.md", "johrei"),
    "johrei_vol10_bilingual.json": ("Johrei Ho Kohza (10).md", "浄霊法講座10.md", "johrei"),
    "pontos_focais_vol01_bilingual.json": ("Pontos Focais 01_Prompt v5.md", "各論.md", "pontos"),
    "pontos_focais_vol02_bilingual.json": ("Pontos Focais 02_Prompt v5.md", "各論２.md", "pontos"),
}

# --- Parsing Logic ---

def parse_markdown_johrei(text, lang="pt"):
    """
    Parses Johrei Ho Kohza style markdown with flexible regexes.
    """
    lines = text.split('\n')
    items = []
    current_item = None
    
    # Simplify patterns to avoid group confusion
    # Label: Digits, Romans, Letters with dot, Circle numbers, Full width digits, Kanji numbers
    # We use non-capturing groups inside to ensure the outer group is stable.
    
    label_pattern_inner = r'(?:\d+|[IVX]+|[A-Z]\.|[①-⑩]|[０-９]+|[一二三四五六七八九十]+)'
    
    # Header Regex
    # Group 1: Hashes (#+)
    # Group 2: Label (captured)
    # Group 3: Title (captured)
    # separator: allow \. (escaped dot), . (dot), ) (paren), or 、 (ideographic comma)
    header_re = re.compile(r'^(#+)\s*(?:\*\*)?\s*(' + label_pattern_inner + r')(?:\\?\.|[\.\)、])?\s*(?:\*\*)?\s*(.*)')
    
    # Bold Regex
    # Group 1: Label (captured)
    # Group 2: Title (captured)
    bold_re = re.compile(r'^\*\*\s*(' + label_pattern_inner + r')(?:\\?\.|[\.\)、])?\s*(.*)(?:\*\*)?')

    for line in lines:
        line = line.strip()
        if not line: continue
        
        is_header = False
        match_data = None #(label, title)

        if lang == "pt":
            m_h = header_re.match(line)
            m_b = bold_re.match(line)
            
            if m_h:
                level = len(m_h.group(1))
                lbl = m_h.group(2)
                ttl = m_h.group(3).strip(' *')
                
                # Cleanup title artifacts (leading \. or .)
                if ttl.startswith(r'\.'): 
                    ttl = ttl[2:].strip()
                elif ttl.startswith('.'):
                    ttl = ttl[1:].strip()
                    
                # Remove Markdown artifacts from title (** and *)
                ttl = ttl.replace('**', '').replace('*', '').replace('\\', '').strip()

                # Heuristics
                if "Capítulo" in ttl or "Section" in ttl:
                    is_header = False 
                elif level == 2 and not lbl.isdigit(): 
                     is_header = False
                else:
                     is_header = True
                     match_data = (lbl, ttl)
            elif m_b:
                # Group 2 might contain trailing **, strip it
                tt = m_b.group(2).strip(' *')
                # Remove internal artifacts
                tt = tt.replace('**', '').replace('*', '').replace('\\', '').strip()
                
                match_data = (m_b.group(1), tt)
                is_header = True
                
        else: # JP
            m_h = header_re.match(line) # Same regex works for JP mostly if kanji included
            m_b = bold_re.match(line)
            
            if m_h:
                level = len(m_h.group(1))
                lbl = m_h.group(2)
                ttl = m_h.group(3).strip(' *')
                
                # JP Title cleanup if needed (usually cleaner, but good to be safe)
                ttl = ttl.replace('**', '').replace('*', '').replace('\\', '').strip()

                if "章" in lbl or "章" in ttl: 
                    is_header = False
                elif "目的" in ttl and level <= 3:
                    is_header = False
                else:
                    is_header = True
                    match_data = (lbl, ttl)
            
            elif m_b:
                 tt = m_b.group(2).strip(' *')
                 tt = tt.replace('**', '').replace('*', '').replace('\\', '').strip()
                 match_data = (m_b.group(1), tt)
                 is_header = True
        
        if is_header and match_data:
            if current_item:
                items.append(current_item)
            current_item = {
                "label": match_data[0],
                "title": match_data[1],
                "content": []
            }
        else:
            if current_item:
                current_item["content"].append(line)
            
    if current_item:
        items.append(current_item)
        
    for item in items:
        item["content"] = "\n".join(item["content"]).strip()
        
    return items

def parse_markdown_pontos(text, lang="pt"):
    """
    Parses Pontos Focais style.
    """
    lines = text.split('\n')
    items = []
    current_item = None

    pt_h4_re = re.compile(r'^####\s+(.*)')
    jp_h4_re = re.compile(r'^####\s*【(.*)】')

    for line in lines:
        line = line.strip()
        is_header = False
        title = ""

        if lang == "pt":
            m = pt_h4_re.match(line)
            if m:
                title = m.group(1).strip()
                is_header = True
        else:
            m = jp_h4_re.match(line)
            # Also catch unbracketed headers in JP or different brackets
            m2 = re.match(r'^####\s*(.*)', line)
            
            if m:
                title = m.group(1).strip()
                is_header = True
            elif m2:
                title = m2.group(1).replace("【", "").replace("】", "").strip()
                is_header = True

        if is_header:
            if current_item:
                items.append(current_item)
            current_item = {
                "label": "",
                "title": title,
                "content": []
            }
        else:
            if current_item:
                current_item["content"].append(line)

    if current_item:
        items.append(current_item)

    for item in items:
        item["content"] = "\n".join(item["content"]).strip()

    return items

# --- Main Rebuild Logic ---

def rebuild_files():
    existing_data_cache = {}
    print("Loading existing JSONs for metadata preservation...")
    for json_file in glob.glob(os.path.join(DATA_DIR, "*_bilingual.json")):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                filename = os.path.basename(json_file)
                existing_data_cache[filename] = data
        except Exception as e:
            print(f"Error loading {json_file}: {e}")

    for json_filename, (pt_md_name, jp_md_name, file_type) in FILE_MAPPING.items():
        print(f"Processing {json_filename}...")
        
        pt_path = os.path.join(MD_PT_DIR, pt_md_name)
        jp_path = os.path.join(MD_JP_DIR, jp_md_name)

        if not os.path.exists(pt_path) or not os.path.exists(jp_path):
            print(f"Missing source files for {json_filename}. Skipping.")
            continue

        with open(pt_path, 'r', encoding='utf-8') as f:
            pt_text = f.read()
            pt_text = pt_text.replace('\u3000', ' ')

        with open(jp_path, 'r', encoding='utf-8') as f:
            jp_text = f.read()
            jp_text = jp_text.replace('\u3000', ' ')

        if file_type == "johrei":
            pt_items = parse_markdown_johrei(pt_text, "pt")
            jp_items = parse_markdown_johrei(jp_text, "jp")
        else:
            pt_items = parse_markdown_pontos(pt_text, "pt")
            jp_items = parse_markdown_pontos(jp_text, "jp")

        print(f"  Extracted: PT={len(pt_items)}, JP={len(jp_items)}")

        # Alignment Logic
        count = max(len(pt_items), len(jp_items))
        if len(pt_items) != len(jp_items):
            print(f"  WARNING: Mismatch in item count for {json_filename}!")
        
        new_json_data = []
        old_data = existing_data_cache.get(json_filename, [])

        if "johrei" in json_filename:
            vol_num = json_filename.split("_")[1].replace("vol", "")
            id_prefix = f"johreivol{vol_num}"
            book_name_pt_base = f"Palestras sobre o Método de Johrei ({int(vol_num)})"
            book_name_jp_base = f"浄霊法講座（{int(vol_num)}）"
        else:
            vol_num = json_filename.split("_")[2].replace("vol", "")
            id_prefix = f"pontosfocaisvol{vol_num}"
            book_name_pt_base = f"Pontos Focais Vol {vol_num}"
            book_name_jp_base = f"各論"
        
        limit = min(len(pt_items), len(jp_items))
        
        for i in range(limit):
            pt_item = pt_items[i]
            jp_item = jp_items[i]
            
            item_id = f"{id_prefix}_{i+1:02d}"
            
            # Metadata preservation
            existing_meta = {}
            for old_item in old_data:
                if old_item.get("id") == item_id:
                    existing_meta = old_item
                    break
            
            new_item = {
                "id": item_id,
                "book_name_pt": existing_meta.get("book_name_pt", book_name_pt_base),
                "book_name_jp": existing_meta.get("book_name_jp", book_name_jp_base),
                "volume": str(int(vol_num)),
                "order": i + 1,
                "label_pt": pt_item["label"],
                "title_pt": pt_item["title"],
                "content_pt": pt_item["content"],
                "label_jp": jp_item["label"],
                "title_jp": jp_item["title"],
                "content_jp": jp_item["content"],
                "section_pt": existing_meta.get("section_pt", ""),
                "section_jp": existing_meta.get("section_jp", ""),
                "tags": existing_meta.get("tags", []),
                "categories": existing_meta.get("categories", []),
                "related_items": existing_meta.get("related_items", []),
                "pontos_focais": existing_meta.get("pontos_focais", []),
                "regiões_anatômicas": existing_meta.get("regiões_anatômicas", [])
            }
            new_json_data.append(new_item)

        out_path = os.path.join(DATA_DIR, json_filename)
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(new_json_data, f, indent=2, ensure_ascii=False)
        print(f"  Saved {len(new_json_data)} items to {json_filename}")


if __name__ == "__main__":
    rebuild_files()
