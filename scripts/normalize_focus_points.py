import json
from collections import Counter

DATA_FILE = 'data/pontos_focais.json'

def normalize_points():
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {DATA_FILE} not found.")
        return

    # 1. Build frequency map of all raw points to find "Canonical" casing
    point_counts = Counter()
    for item in data:
        for p in item.get('focusPoints', []):
            if p:
                point_counts[p] += 1
    
    # Map lowercase -> most frequent original case
    # e.g. {'rins': 'Rins', 'estômago': 'Estômago'}
    canonical_map = {}
    
    
    # Hardcoded map for known correct capitalizations to recover from 100% lowercase data
    FIXED_CASING = {
        'estomago': 'Estômago',
        'rins': 'Rins',
        'utero': 'Útero',
        'cabeca': 'Cabeça',
        'bulbo': 'Bulbo',
        'olhos': 'Olhos',
        'nariz': 'Nariz',
        'frontal': 'Frontal',
        'occipital': 'Occipital',
        'garganta': 'Garganta',
        'figado': 'Fígado',
        'pele': 'Pele',
        'pernas': 'Pernas',
        'membros': 'Membros',
        'intestino': 'Intestino',
        'ovarios': 'Ovários',
        'face': 'Face',
        'glandulas linfaticas': 'Glândulas Linfáticas',
        'glandula parotida': 'Glândula Parótida',
        'baixo ventre': 'Baixo Ventre'
    }

    # Get all unique case-insensitive keys
    all_keys = set(k.lower() for k in point_counts.keys())

    for k in all_keys:
        # Check hardcoded map first (handle unaccented lookup)
        # Normalize key for lookup (remove accents manually or just simple lookup?)
        # k is already lowercase from the file.
        
        # Simple lookup in fixed casing
        if k in FIXED_CASING:
            canonical_map[k] = FIXED_CASING[k]
            continue
            
        # Also try looking up unaccented version of k in FIXED_CASING keys if k has accents?
        # Actually, k comes from the file. If file has "estomago", k="estomago". FIXED_CASING["estomago"] = "Estômago".
        
        # Find all variations present in the data for this key
        # Find all variations present in the data for this key
        variations = [orig for orig in point_counts.keys() if orig.lower() == k]
        # Pick the best variation based on quality heuristics:
        # 1. Has Accents/Non-ASCII (prefer 'Estômago' over 'estomago')
        # 2. Is Title Case (prefer 'Rins' over 'rins')
        # 3. Frequency (tie-breaker)
        def score(s):
            has_accent = any(ord(c) > 127 for c in s)
            is_title = s[0].isupper()
            count = point_counts[s]
            return (has_accent, is_title, count)

        best_variation = sorted(variations, key=score, reverse=True)[0]
        canonical_map[k] = best_variation
        
    print(f"Built canonical map with {len(canonical_map)} entries.")

    updates_count = 0
    
    for item in data:
        original_points = item.get('focusPoints', [])
        if not original_points:
            continue
            
        new_set = set()
        normalized_list = []
        
        for p in original_points:
            if not p: continue
            lower_p = p.lower()
            canonical = canonical_map.get(lower_p, p) # Fallback to existing if somehow missing
            
            if canonical not in new_set:
                new_set.add(canonical)
                normalized_list.append(canonical)
        
        # Sort for consistency
        normalized_list.sort()
        
        if normalized_list != sorted(original_points):
            item['focusPoints'] = normalized_list
            updates_count += 1
            # print(f"Normalized item {item.get('id')}: {original_points} -> {normalized_list}")

    if updates_count > 0:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\nSuccessfully normalized {updates_count} items in {DATA_FILE}.")
    else:
        print("\nNo normalization needed.")

if __name__ == "__main__":
    normalize_points()
