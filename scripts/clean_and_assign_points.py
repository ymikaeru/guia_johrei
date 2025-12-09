import json
import re

DATA_FILE = 'data/pontos_focais.json'

def clean_and_assign():
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {DATA_FILE} not found.")
        return

    changes_count = 0
    
    # Transformation rules: (Regex Pattern, List of Focus Points to Add)
    rules = [
        (r'\n+\s*6\.\s+Face\s*$', ['Face']),
        (r'\n+\s*Pontos Vitais do Johrei: Mesmos da Miopia\.?\s*$', ['Bulbo', 'Cabeça']),
        (r'\n+\s*Pontos Vitais do Johrei: Linfáticos e parótida\.?\s*$', ['Glândulas Linfáticas', 'Glândula Parótida']),
        (r'\n+\s*4\.\s+Nariz\s*$', ['Nariz']),
        (r'\n+\s*2\.\s+Ovários\s*$', ['Ovários']),
        (r'\n+\s*4\.\s+Estômago \(Na Gravidez\)\s*$', ['Estômago']),
        (r'\n+\s*5\.\s+Rins \(Na Gravidez\)\s*$', ['Rins']),
    ]

    for item in data:
        content = item.get('content', '')
        if not content:
            continue
            
        original_content = content
        points_to_add = []
        
        for pattern, points in rules:
            # Check if pattern exists at the end of content
            if re.search(pattern, content, re.DOTALL | re.IGNORECASE):
                # Remove the matching text
                content = re.sub(pattern, '', content, flags=re.DOTALL | re.IGNORECASE).strip()
                points_to_add.extend(points)
        
        if content != original_content:
            item['content'] = content
            
            # Add new points, avoiding duplicates
            current_points = set(item.get('focusPoints', []))
            # Normalize current points for checking? We'll just add the canonical ones defined in rules.
            # Assuming the source points in rules are properly capitalized Canonical names.
            
            for p in points_to_add:
                if p not in current_points:
                    current_points.add(p)
            
            item['focusPoints'] = sorted(list(current_points))
            
            changes_count += 1
            print(f"Cleaned item {item.get('id')}: Removed loose title, added {points_to_add}")

    if changes_count > 0:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\nSuccessfully cleaned {changes_count} items in {DATA_FILE}.")
    else:
        print("\nNo items matched cleanup rules.")

if __name__ == "__main__":
    clean_and_assign()
