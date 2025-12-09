import json
import re

DATA_FILE = 'data/pontos_focais.json'

def detect_loose_titles():
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {DATA_FILE} not found.")
        return

    loose_titles_found = []

    # Regex patterns for "loose titles"
    # 1. Lines starting with number + dot at the end of content (e.g., "\n\n5. Rins")
    # 2. Short lines at the end that look like category headers
    
    # Pattern 1: Number + Dot + Text at end of string
    pattern_numbered_end = re.compile(r'\n+\s*\d+\.\s+.*$', re.DOTALL)
    
    # Pattern 2: Short line at end (less than 50 chars), possibly capitalized, separated by newlines
    # This is heuristic and might need tuning
    pattern_short_line_end = re.compile(r'\n\n([^\n]{1,50})$', re.DOTALL)

    for item in data:
        content = item.get('content', '')
        if not content:
            continue
            
        matches = []
        
        # Check Pattern 1
        match1 = pattern_numbered_end.search(content)
        if match1:
            matches.append(f"Numbered End: '{match1.group(0).strip()}'")
            
        # Check Pattern 2 (if not already matched by 1)
        if not match1:
            match2 = pattern_short_line_end.search(content)
            if match2:
                # Filter out likely legitimate endings (like citations in parens)
                candidate = match2.group(1).strip()
                if not candidate.startswith('(') and not candidate.endswith(')'):
                     matches.append(f"Short Line End: '{candidate}'")

        if matches:
            loose_titles_found.append({
                'id': item.get('id'),
                'title': item.get('title'),
                'matches': matches
            })

    print(f"Found {len(loose_titles_found)} potential loose titles.\n")
    for item in loose_titles_found:
        print(f"ID: {item['id']} | Title: {item['title']}")
        for m in item['matches']:
            print(f"  - {m}")
        print("-" * 20)

if __name__ == "__main__":
    detect_loose_titles()
