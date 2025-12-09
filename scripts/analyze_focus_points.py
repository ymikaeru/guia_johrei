import json
import re

DATA_FILE = 'data/pontos_focais.json'

def analyze_focus_points():
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {DATA_FILE} not found.")
        return

    # 1. Gather known focus points
    known_points = set()
    for item in data:
        if 'focusPoints' in item and item['focusPoints']:
            for fp in item['focusPoints']:
                known_points.add(fp)
    
    # Sort for consistency and maybe prioritizing longer matches if needed? 
    # (Not strictly identifying sub-matches yet, but good to have a clean list)
    sorted_points = sorted(list(known_points), key=len, reverse=True) 

    print(f"Found {len(known_points)} unique known focus points.")
    # print(f"Known points: {sorted_points}")

    # 2. Analyze items with missing focus points
    updates_proposed = []
    
    for item in data:
        # Check if focusPoints is missing or empty
        current_points = item.get('focusPoints', [])
        
        if not current_points:
            text_to_search = (item.get('title', '') + " " + item.get('content', '')).lower()
            found_points = []
            
            for point in sorted_points:
                # Simple case-insensitive match
                # Use word boundaries to avoid partial matches (e.g. "rim" in "crime")
                # Escaping point for regex safety
                escaped_point = re.escape(point.lower())
                if re.search(r'\b' + escaped_point + r'\b', text_to_search):
                     found_points.append(point)
            
            if found_points:
                updates_proposed.append({
                    'id': item.get('id', 'unknown'),
                    'title': item.get('title', 'No Title'),
                    'found': found_points
                })

    # 3. Output results
    print(f"\nFound {len(updates_proposed)} items that can be updated.")
    for update in updates_proposed:
        print(f"- ID: {update['id']} | Title: {update['title']}")
        print(f"  Proposed Focus Points: {update['found']}")

if __name__ == "__main__":
    analyze_focus_points()
