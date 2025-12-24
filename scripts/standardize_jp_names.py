import json
import os
import re

SOURCE_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data/translation_source"

def standardize_filenames_and_ids():
    files = os.listdir(SOURCE_DIR)
    
    renamed_count = 0
    
    for filename in files:
        # Match pattern: raw_jp_浄霊法講座([0-9]+).json
        match = re.match(r'raw_jp_浄霊法講座([0-9]+)\.json', filename)
        
        if match:
            vol_num = int(match.group(1))
            new_filename = f"johrei_vol{vol_num:02d}_jp.json"
            standardized_id_prefix = f"johreivol{vol_num:02d}"
        elif filename == "raw_jp_各論.json":
            new_filename = "pontos_focais_vol01_jp.json"
            standardized_id_prefix = "pontosfocaisvol01"
        elif filename == "raw_jp_各論２.json":
             new_filename = "pontos_focais_vol02_jp.json"
             standardized_id_prefix = "pontosfocaisvol02"
        else:
            continue
            
        src = os.path.join(SOURCE_DIR, filename)
        dst = os.path.join(SOURCE_DIR, new_filename)
            
        # Read content
        try:
            with open(src, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Update IDs
            for idx, item in enumerate(data):
                # Enforce formatted ID: johreivolXX_01, _02, etc.
                # Assuming the order in the array is the correct order (1-based index)
                item['id'] = f"{standardized_id_prefix}_{idx+1:02d}"
            
            # Write to new file
            with open(dst, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                
            print(f"Processed: {new_filename} (renamed & IDs updated)")
            renamed_count += 1
        except Exception as e:
            print(f"Error processing {filename}: {e}")
            
    print(f"\nSuccessfully processed {renamed_count} files for Volumes 1-10.")

if __name__ == "__main__":
    standardize_filenames_and_ids()
