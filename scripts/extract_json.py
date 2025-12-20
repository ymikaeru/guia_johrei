import os
import glob
import json
import re

# Logic:
# 1. Scan MD_Original for .md files
# 2. For each file, parse line by line identifying headers
# 3. Create JSON structure:
#    {
#      "id": "filename_index",
#      "title": "Header Text",
#      "content": "Paragraph content...",
#      "source": "filename_stem",
#      "category": "contexto", # Default
#      "order": sequence
#    }
# 4. Save to MD_Original/json_output/{filename}.json

SOURCE_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/Docx_Original/MD_Original"
OUTPUT_DIR = os.path.join(SOURCE_DIR, "json_output")

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def get_files():
    return sorted(glob.glob(os.path.join(SOURCE_DIR, "*.md")))

def clean_title(text):
    # Remove markdown chars like #, *, [], etc from title
    text = re.sub(r'^[#\s]+', '', text)
    text = text.replace('*', '').replace('〔', '').replace('〕', '').replace('【', '').replace('】', '')
    return text.strip()

def clean_id(text):
    # Sanitize for ID (alphanumeric + underscore)
    # Using specific romanization or just keeping it simple?
    # User example id: "explicacao_01_0".
    # Since filenames are Japanese, using them in ID might be tricky for URLs but fine for internal ID.
    # Let's keep it safe: just use filename sanitized? OR simply use the filename_stem as prefix.
    # Because we don't have a robust romaji converter handy, we will use the filename stem (even if wide chars)
    # unless it causes issues. JSON supports unicode.
    return text

def parse_md(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    filename = os.path.splitext(os.path.basename(file_path))[0]
    items = []
    
    # regexes
    # Matches: # Title, # **Title**
    # Matches: 【Title】
    # Matches: 第一章 (Chapter headers)
    
    re_main_header = re.compile(r'^#\s+.*')
    re_bracket_header = re.compile(r'^【.+】$')
    re_chapter_header = re.compile(r'^第[一二三四五六七八九十]+章$')
    re_bold_header = re.compile(r'^\*\*〔.+〕\*\*$') # Capture **〔Title〕**
    
    current_title = "Intro"
    current_content = []
    order_counter = 0
    
    # We will accumulate content. When we hit a new header, we save the previous block.
    
    for line in lines:
        stripped = line.strip()
        
        # Check for headers
        is_header = False
        new_title = ""
        
        if re_main_header.match(stripped):
            is_header = True
            new_title = clean_title(stripped)
        elif re_bold_header.match(stripped):
            is_header = True
            new_title = clean_title(stripped)
        elif re_bracket_header.match(stripped):
            is_header = True
            new_title = clean_title(stripped)
        elif re_chapter_header.match(stripped):
            is_header = True
            new_title = stripped
            
        if is_header:
            # Save previous
            # If current content is empty and title is Intro, skip (start of file)
            # Unless we want to capture empty sections?
            content_str = "".join(current_content).strip()
            
            if content_str or (current_title != "Intro" and items): 
                # Avoid saving empty Intro if it's just the start of file
                item = {
                    "id": f"{filename}_{order_counter}",
                    "title": current_title,
                    "content": content_str,
                    "source": filename,
                    "category": "contexto",
                    "order": order_counter
                }
                items.append(item)
                order_counter += 1
            
            current_title = new_title
            current_content = []
        else:
            current_content.append(line)
            
    # Last item
    content_str = "".join(current_content).strip()
    if content_str:
        item = {
            "id": f"{filename}_{order_counter}",
            "title": current_title,
            "content": content_str,
            "source": filename,
            "category": "contexto",
            "order": order_counter
        }
        items.append(item)
        
    return items

def main():
    files = get_files()
    print(f"Found {len(files)} files.")
    for f in files:
        fname = os.path.basename(f)
        try:
            items = parse_md(f)
            json_name = os.path.splitext(fname)[0] + ".json"
            out_path = os.path.join(OUTPUT_DIR, json_name)
            
            with open(out_path, 'w', encoding='utf-8') as jf:
                json.dump(items, jf, ensure_ascii=False, indent=4)
            print(f"Generated {out_path} ({len(items)} items)")
        except Exception as e:
            print(f"Error processing {fname}: {e}")

if __name__ == "__main__":
    main()
