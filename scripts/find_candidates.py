import json
import re
import os
import glob

# Files to ignore (target destination or backups)
IGNORE_FILES = {'data/pontos_focais.json', 'data/pontos_focais.json.backup', 'data/index.json', 'data/curas.json.backup', 'data/fundamentos.json.backup'}

# Known Focus Points (Hardcoded for simplicity + robustness based on previous step)
# These are the terms we look for in the content.
KNOWN_POINTS = [
    'Estômago', 'Rins', 'Útero', 'Cabeça', 'Bulbo', 'Olhos', 'Nariz', 'Frontal', 'Occipital', 
    'Garganta', 'Fígado', 'Pele', 'Pernas', 'Membros', 'Intestino', 'Ovários', 'Face', 
    'Glândulas Linfáticas', 'Glândula Parótida', 'Baixo Ventre', 'Ombros', 'Pescoço', 
    'Região Renal', 'Bochechas', 'Maxilar', 'Ouvidos', 'Diafragma', 'Virilha', 'Pés', 'Mãos',
    'Amígdalas', 'Pleura', 'Peritônio'
]

def load_existing_titles():
    try:
        with open('data/pontos_focais.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {item.get('title', '').strip().lower() for item in data}
    except:
        return set()

def scan_files():
    existing_titles = load_existing_titles()
    data_files = glob.glob('data/*.json')
    
    candidates = []

    for file_path in data_files:
        if file_path in IGNORE_FILES:
            continue
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            # Handle if file is a dictionary (like index.json might be list or dict) or list
            if isinstance(data, dict):
                # some files might have a root key, but usually these are lists of items
                # if it's a dict, try to find the list values
                items = []
                for k, v in data.items():
                    if isinstance(v, list):
                        items.extend(v)
            elif isinstance(data, list):
                items = data
            else:
                continue

            for item in items:
                if not isinstance(item, dict):
                    continue
                    
                title = item.get('title', '').strip()
                content = item.get('content', '')
                
                if not title or not content:
                    continue
                
                # Rule 1: Not already in Pontos Focais
                if title.lower() in existing_titles:
                    continue
                    
                # Rule 2: Title looks like a disease/condition?
                # Heuristic: Avoid questions, "Introduction", "Chapter"
                if '?' in title or title.startswith('Capítulo') or title.lower().startswith('introdução'):
                    continue
                    
                # Rule 3: Content mentions a Focus Point
                found_points = set()
                content_lower = content.lower()
                
                for point in KNOWN_POINTS:
                    # Simple heuristic match
                    if re.search(r'\b' + re.escape(point.lower()) + r'\b', content_lower):
                        found_points.add(point)
                
                if found_points:
                    candidates.append({
                        'source_file': os.path.basename(file_path),
                        'id': item.get('id'),
                        'title': title,
                        'found_points': sorted(list(found_points))
                    })
                    
        except Exception as e:
            print(f"Error reading {file_path}: {e}")

    # Deduplicate candidates by title (taking first found)
    unique_candidates = {}
    for c in candidates:
        if c['title'] not in unique_candidates:
            unique_candidates[c['title']] = c
            
    sorted_candidates = sorted(unique_candidates.values(), key=lambda x: x['title'])

    print(f"Found {len(sorted_candidates)} potential candidates.\n")
    for c in sorted_candidates:
        points_str = ", ".join(c['found_points'])
        print(f"[{c['source_file']}] {c['title']}")
        print(f"  > Suggests points: {points_str}")
        print("-" * 30)

if __name__ == "__main__":
    scan_files()
