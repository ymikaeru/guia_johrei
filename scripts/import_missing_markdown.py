import json
import re
import difflib
import uuid
from pathlib import Path

# --- Configuration ---
BASE_PATH = Path("/Users/michael/Documents/Ensinamentos/guia_johrei")
MD_PATH = BASE_PATH / "Markdown/MD_Portugues"
DATA_PATH = BASE_PATH / "data"

# Validation Thresholds
TITLE_SIMILARITY_THRESHOLD = 0.65 

def normalize(text):
    """Normalize text for comparison (remove punctuation, lowercase)."""
    if not text: return ""
    return re.sub(r'[\W_]+', '', text.lower())

def similarity(a, b):
    """Calculate fuzzy similarity between two strings."""
    if not a or not b: return 0.0
    return difflib.SequenceMatcher(None, normalize(a), normalize(b)).ratio()

def parse_markdown(file_path):
    """
    Parses the Markdown file.
    Returns a list of dicts: { 'title': str, 'content': str, 'raw_title': str }
    """
    if not file_path.exists():
        print(f"File not found: {file_path}")
        return []

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    items = []
    current_item = {}
    buf = []

    for line in lines:
        stripped = line.strip()
        # Detect Title Line (### ...)
        if stripped.startswith("###"):
            # Save previous item if exists
            if current_item and 'title' in current_item:
                current_item['content'] = "\n".join(buf).strip()
                items.append(current_item)
            
            # Start new item
            raw_title = stripped.lstrip("#").strip()
            # Remove leading numbers/bullets (e.g. "1. ", "10- ")
            clean_title = re.sub(r'^\d+[\.\-]\s*', '', raw_title)
            # Remove Markdown boldness from title if present (e.g. **Title**)
            clean_title = clean_title.replace('**', '').replace('*', '')

            # Skip Section Headers (usually Roman numerals or "Seção")
            # Heuristic: If it contains "Seção" or starts with "I. ", "IV. " etc WITHOUT much text
            if "Seção" in clean_title or re.match(r'^[IVX]+\.\s*$', clean_title):
                 current_item = {} # Reset
                 buf = []
                 continue

            current_item = {
                'title': clean_title,
                'raw_title': raw_title
            }
            buf = []
        else:
            if current_item: # Only capture if we are inside an item
                buf.append(line)

    # Add last item
    if current_item and 'title' in current_item:
        current_item['content'] = "\n".join(buf).strip()
        items.append(current_item)

    return items

def format_content(raw_content):
    """
    Clean up MD content for JSON.
    - Preserves newlines.
    - Handles **(Pergunta)** bolding.
    """
    # Just clean up excess whitespace
    return raw_content.strip()

def get_next_id(existing_ids, vol_num):
    """Generates a unique ID for the volume."""
    # Find max existing imported suffix
    max_suffix = 0
    pattern = re.compile(f"johreivol{vol_num:02d}_imported_(\d+)")
    
    for aid in existing_ids:
        match = pattern.match(aid)
        if match:
            val = int(match.group(1))
            if val > max_suffix:
                max_suffix = val
    
    # Also check standard IDs to avoid collision if they use similar numbering (unlikely)
    next_up = max_suffix + 1
    return f"johreivol{vol_num:02d}_imported_{next_up:02d}"

def is_duplicate(md_item, json_data):
    """
    Checks if md_item exists in json_data.
    Returns True if found.
    """
    md_title = md_item['title']
    md_content_sample = normalize(md_item['content'])[:100]

    best_score = 0
    
    for entry in json_data:
        json_title = entry.get('title_pt', '')
        score = similarity(md_title, json_title)
        if score > best_score:
            best_score = score
            
        # 1. Strong Title Match
        if score > TITLE_SIMILARITY_THRESHOLD:
            return True
        
        # 2. Strong Content Overlap (Title might be different)
        # Check if MD content exists in JSON content
        json_content_norm = normalize(entry.get('content_pt', ''))
        if md_content_sample and md_content_sample in json_content_norm:
             return True
             
        # 3. Reverse Title check (JSON title inside MD title)
        if len(json_title) > 5 and normalize(json_title) in normalize(md_title):
             return True

    return False

def process_volume(vol_num):
    vol_str = f"{vol_num:02d}"
    json_filename = f"johrei_vol{vol_str}_bilingual.json"
    md_filename = f"Johrei Ho Kohza ({vol_num}).md"
    
    json_path = DATA_PATH / json_filename
    md_path = MD_PATH / md_filename

    if not md_path.exists():
        print(f"Skipping Vol {vol_num}: MD file not found.")
        return

    # Load JSON
    if json_path.exists():
        with open(json_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except:
                data = []
    else:
        data = []

    existing_ids = {item.get('id') for item in data}
    
    # Parse MD
    md_items = parse_markdown(md_path)
    print(f"Vol {vol_num}: Found {len(md_items)} items in MD.")

    added_count = 0
    
    for item in md_items:
        if not is_duplicate(item, data):
            # Add New Item
            new_id = get_next_id(existing_ids, vol_num)
            existing_ids.add(new_id) # Reserve it
            
            new_entry = {
                "id": new_id,
                "title_pt": item['title'],
                "content_pt": format_content(item['content']),
                "title_jp": "Translation pending",
                "content_jp": "Translation pending",
                "tags": [],
                "categories": ["johrei"], # Default category
                "related_items": [],
                "info_pt": f"Imported from {md_filename}",
                "source": f"Imported from {md_filename}",
                "Master_Title": "Johrei Ho Kohza"
            }
            
            data.append(new_entry)
            added_count += 1
            print(f"  [+] Imported: {item['title']} (ID: {new_id})")
        # else:
            # print(f"  [.] Skipped (Duplicate): {item['title']}")

    if added_count > 0:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Vol {vol_num}: SUCESSFULLY ADDED {added_count} items.\n")
    else:
        print(f"Vol {vol_num}: No new items added.\n")

if __name__ == "__main__":
    print("--- STARTING IMPORT ---")
    for i in range(1, 11):
        process_volume(i)
    print("--- IMPORT COMPLETE ---")
