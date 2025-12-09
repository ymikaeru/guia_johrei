import json
import re

DATA_FILE = 'data/pontos_focais.json'

def apply_focus_points_updates():
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {DATA_FILE} not found.")
        return

    # 1. Gather known focus points (Case-sensitive map for normalization)
    # Map lowercase version to the "Canonical" Title Case version found in data
    known_points_map = {}
    
    for item in data:
        if 'focusPoints' in item and item['focusPoints']:
            for fp in item['focusPoints']:
                if fp:
                    known_points_map[fp.lower()] = fp
    
    # Sort keys by length (descending) to match longest phrases first
    sorted_keys = sorted(known_points_map.keys(), key=len, reverse=True)

    print(f"Loaded {len(known_points_map)} canonical focus points.")
    
    updates_count = 0
    
    for item in data:
        # Check if focusPoints is missing or empty
        current_points = item.get('focusPoints', [])
        
        if not current_points:
            text_to_search = (item.get('title', '') + " " + item.get('content', '')).lower()
            found_points = set()
            
            for key in sorted_keys:
                # Simple case-insensitive match with word boundaries
                escaped_key = re.escape(key)
                if re.search(r'\b' + escaped_key + r'\b', text_to_search):
                     found_points.add(known_points_map[key])
            
            if found_points:
                # Update the item
                item['focusPoints'] = sorted(list(found_points))
                updates_count += 1
                print(f"Updated item {item.get('id')}: Added {item['focusPoints']}")

    if updates_count > 0:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\nSuccessfully updated {updates_count} items in {DATA_FILE}.")
    else:
        print("\nNo updates required.")

if __name__ == "__main__":
    apply_focus_points_updates()
