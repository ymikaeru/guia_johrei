import json
import re
import glob
from pathlib import Path

# --- Configuration ---
BASE_PATH = Path("/Users/michael/Documents/Ensinamentos/guia_johrei")
DATA_PATH = BASE_PATH / "data"

# Regex Explanation:
# ^          : Start of string
# (\d+|[A-Z]): Group 1: Number (one or more digits) OR Single Uppercase Letter
# ([\\\.]+\s*): Group 2: One or more dots/backslashes followed by optional whitespace
#
# Examples matched: "1. ", "1\\. ", "A. ", "E. "
REGEX_PATTERN = r'^(\d+|[A-Z])([\\\.]+\s*)'

def clean_titles():
    json_files = sorted(glob.glob(str(DATA_PATH / "johrei_vol*_bilingual.json")))
    
    total_cleaned = 0
    
    for file_path in json_files:
        path = Path(file_path)
        filename = path.name
        
        with open(path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                print(f"Error reading {filename}. Skipping.")
                continue
        
        modified = False
        count_in_file = 0
        
        for entry in data:
            original_title = entry.get('title_pt', '')
            if not original_title: continue
            
            # Apply Regex Substitution
            cleaned_title = re.sub(REGEX_PATTERN, '', original_title)
            
            # Special case cleanup for any remaining weird start characters if regex missed edge cases
            # e.g. "7.Sobre" -> matched by regex, but let's be sure to strip leading space
            cleaned_title = cleaned_title.strip()
            
            if cleaned_title != original_title:
                print(f"[{filename}] Cleaned: '{original_title}' -> '{cleaned_title}'")
                entry['title_pt'] = cleaned_title
                modified = True
                count_in_file += 1
                total_cleaned += 1
        
        if modified:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Saved {filename} ({count_in_file} titles cleaned).\n")
        else:
            print(f"No changes in {filename}.\n")

    print(f"--- TOTAL TITLES CLEANED: {total_cleaned} ---")

if __name__ == "__main__":
    clean_titles()
