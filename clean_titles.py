import json
import re

# Define path
PONTOS_FOCAIS_PATH = 'data/pontos_focais.json'

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def clean_title(title):
    # Remove patterns like "1. ", "1) ", "1.1. "
    # Regex explanation:
    # ^\d+          : Starts with one or more digits
    # [\.\)]        : Followed by a dot or closing parenthesis
    # \s+           : Followed by one or more spaces
    new_title = re.sub(r'^\d+[\.\)]\s+', '', title)
    return new_title

def main():
    print("Loading file...")
    pontos = load_json(PONTOS_FOCAIS_PATH)
    
    updated_count = 0
    
    for item in pontos:
        original_title = item.get('title', '')
        new_title = clean_title(original_title)
        
        if new_title != original_title:
            item['title'] = new_title
            updated_count += 1
            print(f"Updated: '{original_title}' -> '{new_title}'")
            
    if updated_count > 0:
        save_json(PONTOS_FOCAIS_PATH, pontos)
        print(f"\nSuccessfully updated {updated_count} titles.")
    else:
        print("\nNo titles needed updating.")

if __name__ == "__main__":
    main()
