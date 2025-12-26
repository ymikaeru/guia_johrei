
import os
import json
import re

# Configuration
SOURCE_DIR = "Markdown/MD_Original"
OUTPUT_DIR = "data"
FILES_TO_PROCESS = [
    { "filename": "総論１.md", "id_prefix": "souron_vol01", "output": "souron_vol01.json", "source_name": "総論１" },
    { "filename": "総論２.md", "id_prefix": "souron_vol02", "output": "souron_vol02.json", "source_name": "総論２" },
    { "filename": "総論３.md", "id_prefix": "souron_vol03", "output": "souron_vol03.json", "source_name": "総論３" }
]

def clean_title(title_line):
    # Remove hashtags, asterisks, and whitespace
    clean = re.sub(r'^[#\s]+', '', title_line)
    clean = clean.replace('**', '').strip()
    return clean

def parse_markdown(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    items = []
    current_title = ""
    current_content = []
    
    # Heuristic: Find first header
    # If there is content before the first header, it might be ignored or attached to a "Intro" item.
    # Looking at the file, it starts with # **まえがき**, so we are good.

    for line in lines:
        stripped = line.strip()
        
        # Check for header
        if stripped.startswith('#'):
            # Save previous item if it exists
            if current_title:
                items.append({
                    "title": current_title,
                    "content": "\n".join(current_content).strip()
                })
            
            # Start new item
            current_title = clean_title(stripped)
            current_content = []
        else:
            # Append content line (keeping original newlines for structure, 
            # though we might want to trim slightly?)
            # The split() in render uses \n, so we keep them.
            if current_title: # Only collect if we have a title started
                current_content.append(line.replace('\n', '')) # Remove physical newline, let parsing handle logic? 
                # Wait, standard markdown text usually has hard wraps. 
                # If we just remove \n, we concat words. 
                # Let's keep the paragraph structure.
                # Usually in these files, blank lines separate paragraphs.
                pass

    # Actually, let's restructure the loop to better handle content accumulation
    pass

def process_file(config):
    input_path = os.path.join(SOURCE_DIR, config["filename"])
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        # Try full width numbers if needed, but 'ls' showed them correctly.
        return

    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by lines starting with #
    # Regex lookahead to split but keep delimiter is tricky with split.
    # Easy way: iterate lines.
    
    entries = []
    lines = content.splitlines()
    
    current_title = ""
    current_body_lines = []
    
    for line in lines:
        if line.strip().startswith('#'):
            # Save previous
            if current_title:
                entries.append({
                    "title": current_title,
                    "body": "\n".join(current_body_lines).strip()
                })
            
            # New section
            current_title = clean_title(line)
            current_body_lines = []
        else:
            if current_title:
                current_body_lines.append(line)
    
    # Add last entry
    if current_title:
        entries.append({
            "title": current_title,
            "body": "\n".join(current_body_lines).strip()
        })

    # Convert to JSON structure
    json_items = []
    for i, entry in enumerate(entries):
        item_id = f"{config['id_prefix']}_{str(i+1).zfill(2)}"
        
        # Determine strict source or inferred from parsing?
        # User wants simple conversion.
        
        json_item = {
            "id": item_id,
            "title_jp": entry['title'],
            "content_jp": entry['body'],
            "title_pt": "",    # Empty for translation
            "content_pt": "",  # Empty for translation
            "source": config['source_name'],
            "tags": [],
            "categories": ["geral"] # Default category?
        }
        json_items.append(json_item)

    output_path = os.path.join(OUTPUT_DIR, config["output"])
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(json_items, f, ensure_ascii=False, indent=2)
    
    print(f"Created {output_path} with {len(json_items)} items.")

def main():
    for config in FILES_TO_PROCESS:
        process_file(config)

if __name__ == "__main__":
    main()
