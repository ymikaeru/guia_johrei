import json
import os
import re

def clean_content(content):
    if not content:
        return content
    
    # Regex to match the source pattern at the start of the string
    # Matches starting with * or _, followed by characters until the matching delimiter, followed by newlines.
    # Pattern explanation:
    # ^          : Start of string
    # ([*_])     : Capture group 1: either * or _
    # .*?        : Non-greedy match of any content
    # \1         : Match the same delimiter captured in group 1
    # \s*        : Optional whitespace
    # \n+        : At least one newline (citations are followed by newlines)
    match = re.match(r'^([*_]).*?\1\s*\n+', content, re.DOTALL)
    
    if match:
        # Check if the matched content looks like a source (contains "Fonte", "pág", "Edição", or Japanese text/Romaji common citations)
        # This prevents removing legitimate emphasis if it ever appears at the very start (unlikely but safe)
        matched_text = match.group(0).lower()
        keywords = ['fonte', 'pág', 'ed', 'vol', 'nº', 'chijō', 'gosuiji', 'Mioshie', 'mioshie', 'oshi-e', 'ensinamento']
        if any(k in matched_text for k in keywords) or 'page' in matched_text or '(' in matched_text:
             # print(f"Removing: {match.group(0)!r}")
             return content[match.end():]
    
    return content

def process_file(filepath):
    print(f"Processing {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        modified = False
        for item in data:
            if 'content_pt' in item:
                original = item['content_pt']
                cleaned = clean_content(original)
                if original != cleaned:
                    item['content_pt'] = cleaned
                    modified = True
        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"Updated {filepath}")
        else:
            print(f"No changes in {filepath}")
            
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

def main():
    data_dir = "data"
    files = [f for f in os.listdir(data_dir) if f.startswith("johrei_vol") and f.endswith("_bilingual.json")]
    files.sort()
    
    for filename in files:
        filepath = os.path.join(data_dir, filename)
        process_file(filepath)

if __name__ == "__main__":
    main()
