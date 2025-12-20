import json
import re

def normalize_text(text):
    """Normalize text by stripping partial whitespace/newlines/asterisks."""
    if not text:
        return ""
    return text.strip().replace('**', '').replace(' ', '').replace('　', '').lstrip('#')

def load_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"File not found: {filepath}")
        return []

def save_json(data, filepath):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def parse_markdown_sections(filepath):
    """
    Parses the markdown file and returns a dictionary mapping headers to their content.
    Assumes headers like '一、Header**' or '# **Header**'.
    """
    sections = {}
    current_header = None
    current_content = []

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"Markdown file not found: {filepath}")
        return {}

    # Regex to catch headers. 
    # Matches:
    # 1. Lines starting with # **...** (e.g., # **一、...**)
    # 2. Lines starting with numbers/kanji numerals followed by text and maybe ** (e.g., 一、...**)
    header_pattern = re.compile(r'^(#\s*\*\*)?([一二三四五六七八九十]+、.*?|（[一二三四五六七八九十]+）.*?|第[一二三四五六七八九十]+章.*?)((\*\*)?)$')

    for line in lines:
        line_stripped = line.strip()
        
        # Check if line is a header
        # We need a robust check. Many headers in the file seem to end with **
        # Example: "一、神霊医学教育の目的**"
        
        is_header = False
        if line_stripped.endswith("**") and len(line_stripped) < 50:
            # Likely a header if it's short and bolded
            is_header = True
        elif header_pattern.match(line_stripped):
            is_header = True

        if is_header:
            if current_header:
                sections[current_header] = "\n".join(current_content).strip()
            
            # Normalize header for key
            current_header = normalize_text(line_stripped)
            current_content = []
        else:
            if current_header:
                current_content.append(line) # Keep original line structure including newlines

    # Save last section
    if current_header:
        sections[current_header] = "\n".join(current_content).strip()

    return sections

def populate_johrei_items():
    json_path = 'data/fundamentos_ptJp.json'
    md_path = 'Docx_Original/MD_Original/浄霊法講座.md'
    
    data = load_json(json_path)
    sections = parse_markdown_sections(md_path)
    
    print(f"Parsed {len(sections)} sections from {md_path}")
    # metadata info
    # for k in list(sections.keys())[:20]:
    #     print(f"Key: {k}")

    updated_count = 0
    missing_keys = []
    
    for item in data:
        # Check valid candidates: missing content_ja but present title_ja
        if not item.get('content_ja') and item.get('title_ja'):
            title_ja_raw = item.get('title_ja')
            normalized_title = normalize_text(title_ja_raw)
            
            if normalized_title in sections:
                item['content_ja'] = sections[normalized_title]
                print(f"Populated: {item.get('title', 'Unknown')} -> {normalized_title}")
                updated_count += 1
            else:
                # Try partial match or manual mapping if strictly needed
                # For now just log
                missing_keys.append((item.get('title', ''), normalized_title))

    if updated_count > 0:
        save_json(data, json_path)
        print(f"Successfully populated {updated_count} items in {json_path}")
    else:
        print("No items updated.")
        
    if missing_keys:
        print("\nCould not find content for the following keys:")
        for title, key in missing_keys:
            print(f"- {title} (Key: {key})")

if __name__ == "__main__":
    populate_johrei_items()
