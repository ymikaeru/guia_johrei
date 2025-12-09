import json
import re

file_path = 'data/pontos_focais.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

fixed_count = 0

# Extended heuristic list based on screenshots and medical description patterns
# Words that typically START a description sentence, not a disease name.
split_markers = [
    # Verbs/Copulas
    "É ", "São ", "Foi ", "Estão ", "Está ", "Tem ", "Têm ", 
    "Ocorre ", "Acontece ", "Surge ", "Manifesta-se ", "Caracteriza-se ", 
    "Trata-se ", "Refere-se ", "Significa ", 
    
    # Articles/Pronouns (Start of sentence)
    "O ", "A ", "Os ", "As ", "Um ", "Uma ", "Uns ", "Umas ",
    "Ele ", "Ela ", "Eles ", "Elas ", "Isso ", "Aquilo ",
    "Muitas ", "Muitos ", "Alguns ", "Algumas ", "Qualquer ",
    
    # Prepositions/Conjunctions acting as starters
    "Devido ", "Causada ", "Causado ", "Decorrente ", "Resultante ",
    "Similar ", "Semelhante ", "Igual ", "Oposto ", "Contrário ",
    "Geralmente ", "Frequentemente ", "Freqüentemente ", "Normalmente ",
    "Quando ", "Se ", "Caso ", "Embora ", "Enquanto ", "Como ",
    "Por ", "Para ", "Com ", "Sem ", "Sob ", "Sobre ", "Ante ",
    
    # Specific Nouns often used as subjects
    "Toxinas ", "Pus ", "Sangue ", "Febre ", "Dor ", "Dores ", 
    "Inchaço ", "Vermelhidão ", "Ataques ", "Sintomas ", "Causa ", 
    "Origem ", "Motivo ", "Tratamento ", "Cura ", "Doença ", "Enfermidade ",
    "Não ", "Sim ", "Mas "
]

# Sort markers by length descending to match longest phrases first if any
split_markers.sort(key=len, reverse=True)

for item in data:
    # Only target items that look like they were splitted (have underscores) OR have very long titles
    # "pf86_1", "pf_child_2", etc.
    # But also generic long titles.
    
    title = item.get('title', '')
    content = item.get('content', '')
    
    # If title is reasonably long, try to split
    if len(title) > 25: 
        # Search for the *earliest* marker
        # But ignore markers at the very beginning (index 0) - wait, "A" can be start of title "A Gripe"? 
        # Usually disease names don't start with "É" or "Devido" or "Quando".
        # But "O" or "A" might be "O Sarampo".
        # So we skip index 0. We look for marker >= index 3 (min title length).
        
        candidates = []
        for marker in split_markers:
            # We look for " Marker" (space + marker) to ensure word boundary start
            # or just regex `\bMarker`?
            # Using simple string find is faster and usually safer if we include the leading space in candidates check.
            
            # Note: split_markers have trailing space "É ".
            # We search for it.
            
            matches = [m.start() for m in re.finditer(re.escape(marker), title)]
            for idx in matches:
                # Heuristic: Split usually doesn't happen at char 0 (Title starts with marker).
                # But if title is "O Sarampo É...", split is at "É".
                if idx > 2: 
                    candidates.append((idx, marker))
        
        if candidates:
            # Sort by index
            candidates.sort(key=lambda x: x[0])
            best_idx, best_marker = candidates[0]
            
            # Split
            real_title = title[:best_idx].strip()
            rest_of_title = title[best_idx:].strip()
            
            # Verify split makes sense
            # If real_title is empty or too short, maybe ignore?
            if len(real_title) > 2:
                print(f"Refining '{title[:40]}...'")
                print(f"  -> Title: '{real_title}'")
                print(f"  -> Body:  '{rest_of_title[:40]}...'")
                
                item['title'] = real_title
                
                # Prepend to content
                if content:
                    item['content'] = rest_of_title + "\n\n" + content
                else:
                    item['content'] = rest_of_title
                    
                fixed_count += 1

if fixed_count > 0:
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Refined {fixed_count} titles.")
else:
    print("No titles needed refining.")
