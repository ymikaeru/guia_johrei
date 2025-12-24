import re
import json
import os

def regenerate_pf_vol01():
    source_path = "Markdown/MD_Original/各論.md"
    output_path = "data/translation_source/pontos_focais_vol01_jp.json"
    
    with open(source_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    items = []
    current_item = None
    
    # Regex for dates to ignore
    date_pattern = re.compile(r'^\d{4}\.\d{2}\.\d{2}')
    
    # Counters
    count = 1
    
    # Buffer for content
    content_buffer = []
    current_title = ""
    current_category = "" # From ## or ### if needed, though structure seems flat in JSON
    
    def save_current_item(valid_title, valid_content):
        nonlocal count
        if not valid_title and not valid_content:
            return
            
        # Clean content
        cleaned_content = "\n".join(valid_content).strip()
        if not cleaned_content:
            return
            
        item_id = f"pontosfocaisvol01_{count:02d}"
        
        items.append({
            "title_jp": valid_title,
            "content_jp": cleaned_content,
            "id": item_id,
            "title_pt": "",
            "content_pt": ""
        })
        count += 1

    last_h3 = ""

    for line in lines:
        line_stripped = line.strip()
        
        # Skip dates
        if date_pattern.match(line_stripped):
            continue
            
        # Detect Headers
        if line_stripped.startswith('#### 【'):
            # New Item
            # Save previous
            if current_title:
                save_current_item(current_title, content_buffer)
            
            # Start new
            current_title = line_stripped.replace('#### 【', '').replace('】', '')
            content_buffer = []
            
        elif line_stripped.startswith('### 〔'):
            # H3 Header - might be a category or a standalone item title if followed by text
            # Save previous if pending
            if current_title:
                save_current_item(current_title, content_buffer)
                current_title = ""
            
            raw_h3 = line_stripped.replace('### 〔', '').replace('〕', '')
            last_h3 = raw_h3
            content_buffer = []
            
            # We don't immediately set current_title because we wait to see if it has content
            # If next lines are text, we treat this H3 as title.
            # If next line is H4, this H3 is just a category grouping (ignored for item title)
            
        elif line_stripped.startswith('## '):
            # Chapter header, ignore but close previous
            if current_title:
                save_current_item(current_title, content_buffer)
                current_title = ""
            content_buffer = []

        else:
            # Normal line
            if not line_stripped:
                continue
                
            # If we have content but no current_title, use last_h3 if available
            if not current_title and last_h3:
                current_title = last_h3
                # We consumed the H3 as a title
                # last_h3 = "" # Don't clear it, maybe? No, let's keep it.
            
            content_buffer.append(line.rstrip())
            
    # Save last
    if current_title:
        save_current_item(current_title, content_buffer)
        
    # Write JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
        
    print(f"Generated {len(items)} items to {output_path}")

if __name__ == "__main__":
    regenerate_pf_vol01()
