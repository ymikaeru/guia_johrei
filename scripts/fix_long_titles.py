import json
import re

file_path = 'data/pontos_focais.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

fixed_count = 0
sentence_starters = [
    "É ", "A ", "O ", "As ", "Os ", "Um ", "Uma ", 
    "Muitas ", "Muitos ", "Toxinas ", "Geralmente ", 
    "Quando ", "Por ", "No ", "Na ", "Se ", 
    "Dentre ", "Com ", "Para ", "Em ", "Devido ",
    "Esta ", "Este ", "Isso ", "São ", "Existem ",
    "Ocorre ", "Trata-se ", "Inicialmente ", "Logo ", "Outra "
]

for item in data:
    title = item.get('title', '')
    content = item.get('content', '')
    
    # Check for long titles that might contain body text
    if len(title) > 50:
        print(f"Checking long title ({len(title)} chars): {title[:60]}...")
        
        split_index = -1
        best_starter = None
        
        # Heuristic: Find first occurrence of a Sentence Starter
        # We assume the Title *ends* before the Starter.
        # But we must be careful not to split "A Doença" (Title) vs "A doença é..." (Body).
        # Usually Titles don't start with "É", "Muitas", "Geralmente", "Dentre".
        # But "A ", "O " are risky. "A Guerra" is a title.
        # So for "A "/"O ", maybe we check if it's far along in the string?
        # Or if the title is REALLY long, it's likely body.
        
        candidates = []
        for starter in sentence_starters:
            # Search for " Starter" (space + Starter)
            # Or if the title itself starts with it? No, title prefix.
            
            # We look for the starter appearing *after* some characters (assuming Title has minimal length 5?)
            # But "Dor" is short.
            
            # Let's search in the whole string.
            matches = [m.start() for m in re.finditer(re.escape(starter), title)]
            for match_idx in matches:
                # Filter: Don't split if it's at index 0 (The title IS the starter? Unlikely).
                if match_idx > 3: 
                    candidates.append((match_idx, starter))
        
        if candidates:
            # Pick the earliest candidate
            candidates.sort(key=lambda x: x[0])
            split_index, best_starter = candidates[0]
            
            # Split
            real_title = title[:split_index].strip()
            extracted_body = title[split_index:].strip() # Keep the starter
            
            # Heuristic check: Is extracted body substantial?
            if len(extracted_body) > 10:
                print(f"  -> Splitting at '{best_starter.strip()}':")
                print(f"     Title: '{real_title}'")
                print(f"     Body Part: '{extracted_body[:40]}...'")
                
                item['title'] = real_title
                if content:
                    item['content'] = extracted_body + "\n\n" + content
                else:
                    item['content'] = extracted_body
                    
                fixed_count += 1
            else:
                print("  -> Extracted body too short, ignoring.")
        else:
            print("  -> No natural split point found.")

if fixed_count > 0:
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Fixed {fixed_count} items with long titles.")
else:
    print("No long titles needed fixing.")
