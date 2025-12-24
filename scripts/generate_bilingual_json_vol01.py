
import json
import re
import os

PT_FILE = '/Users/michael/Documents/Ensinamentos/guia_johrei/Markdown/MD_Portugues/Pontos Focais 01_Prompt v5.md'
JP_FILE = '/Users/michael/Documents/Ensinamentos/guia_johrei/Markdown/MD_Original/各論.md'
OUTPUT_FILE = '/Users/michael/Documents/Ensinamentos/guia_johrei/data_rebuilt/pontos_focais_vol01_bilingual.json'

def parse_markdown(file_path):
    """
    Parses markdown file and extracts items based on H3 (###) and H4 (####) headers.
    Returns a list of dicts: {'title': str, 'content': str}
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    items = []
    current_title = None
    current_content = []

    # Regex to match H3 or H4 headers, capturing the text.
    # Matches "### Title", "#### Title", "### [Title]", "#### 【Title】"
    # We want to strip the markdown characters for the final title.
    header_pattern = re.compile(r'^(?:#{3,4})\s*(.*)')

    for line in lines:
        line_stripped = line.strip()
        header_match = header_pattern.match(line_stripped)

        if header_match:
            # If there's an existing item being built, save it
            if current_title is not None:
                items.append({
                    'title': clean_title(current_title),
                    'content': ''.join(current_content).strip()
                })
            
            # Start new item
            current_title = header_match.group(1)
            current_content = []
        else:
            # If we are inside an item, append content
            if current_title is not None:
                current_content.append(line)

    # Append the last item
    if current_title is not None:
        items.append({
            'title': clean_title(current_title),
            'content': ''.join(current_content).strip()
        })

    return items

def clean_title(title):
    """Removes markdown decorators like **, [], 【】, 〔〕 from title."""
    title = title.strip()
    # Remove bold
    title = re.sub(r'\*\*(.*?)\*\*', r'\1', title)
    # Remove literal backslashes
    title = title.replace('\\', '')
    # Remove brackets
    title = re.sub(r'[\[\]〔〕【】]', '', title)
    return title.strip()

def main():
    print(f"Parsing PT file: {PT_FILE}")
    pt_items = parse_markdown(PT_FILE)
    print(f"Found {len(pt_items)} items in PT file.")

    print(f"Parsing JP file: {JP_FILE}")
    jp_items = parse_markdown(JP_FILE)
    print(f"Found {len(jp_items)} items in JP file.")

    if len(pt_items) != len(jp_items):
        print("WARNING: Item counts do not match!")
        print("Creating JSON based on the shorter list length to avoid errors, but please verify alignment.")
    
    # Merge
    merged_items = []
    count = min(len(pt_items), len(jp_items))

    for i in range(count):
        pt = pt_items[i]
        jp = jp_items[i]

        item = {
            "id": f"item_{i+1:03d}",
            "title": pt['title'],
            "content": pt['content'],
            "title_ja": jp['title'],
            "content_ja": jp['content'],
            "order": i + 1,
            "tab": "Pontos Focais",
            "type": "teaching",
            "source": "Bilingual Merge Script",
            "tags": [],
            "focusPoints": []
        }
        merged_items.append(item)

    # Write JSON
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(merged_items, f, indent=2, ensure_ascii=False)

    print(f"Successfully wrote {len(merged_items)} items to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
