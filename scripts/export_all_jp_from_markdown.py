import re
import os
import json
import glob

# Paths
MD_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/Markdown/MD_Original"
EXPORT_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data/translation_source"

# Regex for Japanese Headers (Robust)
# Matches:
# - # Header
# - **Header**
# - 1. or 1、
# - (1) or ①
JP_HEADER_RE = re.compile(r'^(#+\s*)(.*)|^\s*(\d+[\.\、])\s*(.*)|^\s*([①-⑩])\s*(.*)|^\s*\*\*(.*)\*\*\s*$')

def parse_jp_markdown(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    items = []
    current_item = None
    
    # Generic buffer for content
    content_buffer = []

    def flush_item():
        if current_item and content_buffer:
            # Clean content
            raw_content = "".join(content_buffer).strip()
            if raw_content:
                 current_item["content_jp"] = raw_content
                 items.append(current_item)

    for line in lines:
        line_clean = line.strip()
        
        # Check for header
        # We want to capture distinct sections. 
        # Heuristic: If it looks like a numbered list or header, it's a new item.
        # But we need to be careful not to split too aggressively inside a paragraph.
        
        is_header = False
        header_text = ""
        
        # Headers with #
        if line_clean.startswith("#"):
            is_header = True
            header_text = line_clean.lstrip("#").strip()
        
        # Headers with numbers (1. Title)
        elif re.match(r'^\d+[\.\、]', line_clean):
             is_header = True
             header_text = line_clean
        
         # Headers with circled numbers (① Title)
        elif re.match(r'^[①-⑩]', line_clean):
             is_header = True
             header_text = line_clean

        # Bold lines as headers? Only if short.
        elif line_clean.startswith("**") and line_clean.endswith("**") and len(line_clean) < 50:
             is_header = True
             header_text = line_clean.strip("*")

        if is_header:
            flush_item()
            content_buffer = []
            current_item = {
                "title_jp": header_text,
                "content_jp": ""
            }
        else:
            if current_item:
                content_buffer.append(line)
    
    flush_item()
    return items

def export_all_jp():
    if not os.path.exists(EXPORT_DIR):
        os.makedirs(EXPORT_DIR)
        
    md_files = glob.glob(os.path.join(MD_DIR, "*.md"))
    
    summary = []
    
    for file_path in md_files:
        filename = os.path.basename(file_path)
        # Generate ID base from filename
        base_id = filename.replace(".md", "").replace(" ", "_").lower()
        
        print(f"Parsing {filename}...")
        
        try:
            items = parse_jp_markdown(file_path)
            
            # Enrich with IDs
            final_items = []
            for idx, item in enumerate(items):
                item["id"] = f"{base_id}_{idx+1:02d}"
                # Add placeholder for PT
                item["title_pt"] = ""
                item["content_pt"] = ""
                final_items.append(item)
            
            if final_items:
                out_name = f"raw_jp_{base_id}.json"
                out_path = os.path.join(EXPORT_DIR, out_name)
                with open(out_path, 'w', encoding='utf-8') as f:
                    json.dump(final_items, f, indent=2, ensure_ascii=False)
                
                print(f"  -> Exported {len(final_items)} items to {out_name}")
                summary.append(f"- {filename}: {len(final_items)} items")
            else:
                print(f"  -> No items found in {filename}")
                
        except Exception as e:
            print(f"Error parsing {filename}: {e}")

    print("\nFull Export Summary:")
    print("\n".join(summary))

if __name__ == "__main__":
    export_all_jp()
