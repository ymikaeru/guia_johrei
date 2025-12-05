import json
import os

FILES = [
    'data/pontos_focais.json',
    'data/curas.json',
    'data/fundamentos.json'
]

SUSPICIOUS_ENDINGS = [
    " e", " ou", ",", " de", " da", " do", " em", " na", " no", " para", " com", " sem", " a", " o"
]

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def main():
    for file_path in FILES:
        if not os.path.exists(file_path):
            continue
            
        print(f"\nScanning {file_path}...")
        data = load_json(file_path)
        found = 0
        
        for item in data:
            focus_points = item.get('focusPoints', [])
            for fp in focus_points:
                # Check if it ends with any suspicious ending
                # We strip first to ignore trailing spaces, though JSON shouldn't have them ideally
                clean_fp = fp.strip()
                
                is_suspicious = False
                for ending in SUSPICIOUS_ENDINGS:
                    if clean_fp.endswith(ending):
                        is_suspicious = True
                        break
                
                if is_suspicious:
                    print(f"  [{item.get('title', 'Untitled')}] Truncated?: '{fp}'")
                    found += 1
        
        if found == 0:
            print("  No suspicious items found.")

if __name__ == "__main__":
    main()
