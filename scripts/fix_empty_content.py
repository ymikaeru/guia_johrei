import json
import re

file_path = 'data/pontos_focais.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

fixed_count = 0

# Heuristics for where content starts.
# Looking for " Title StartOfSentence..."
# Common starts: "É...", "A...", "O...", "Muitas...", "Toxinas..."
sentence_starters = ["É ", "A ", "O ", "As ", "Os ", "Muitas ", "Toxinas ", "Geralmente ", "Quando ", "Por ", "No ", "Na ", "Se "]

for item in data:
    if item.get('content') == "" and len(item.get('title', '')) > 20:
        title = item['title']
        
        split_index = -1
        
        # Try to find the first occurrence of a Sentence Starter
        # We search for " Starter" (space + Starter) to avoid matching inside words.
        # But looking at "Amenorreia Muitas", it's " Muitas".
        
        candidates = []
        for starter in sentence_starters:
            idx = title.find(" " + starter)
            if idx != -1:
                candidates.append(idx)
        
        if candidates:
            # Take the earliest one
            split_index = min(candidates)
            
            # Additional check: special cases
            # "Metrite (Inflamação...)" -> Split after closing parenthesis?
            # "Metrite (Inflamação do Parênquima Uterino) Toxinas..."
            # My current "Toxinas " starter would catch it.
            
            real_title = title[:split_index].strip()
            real_content = title[split_index+1:].strip() # Skip the space
            
            print(f"Fixing '{real_title}'")
            item['title'] = real_title
            item['content'] = real_content
            fixed_count += 1
            
        else:
            print(f"COULD NOT FIX AUTOMATICALLY: {title[:50]}...")
            # Fallback for "Metrite (Inflamação...)" if "Toxinas" wasn't in list? 
            # (It is).

if fixed_count > 0:
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Fixed {fixed_count} items with empty content.")
else:
    print("No items needed fixing.")
