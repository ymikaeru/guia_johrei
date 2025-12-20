
import json
import os
import glob
from pathlib import Path
import shutil

DATA_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"
COMPLETE_JSON = os.path.join(DATA_DIR, "guia_johrei_complete.json")

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def propagate():
    print("Loading global complete data...")
    if os.path.exists(COMPLETE_JSON):
        complete_data = load_json(COMPLETE_JSON)
    else:
        print("WARNING: guia_johrei_complete.json not found. Creating new.")
        complete_data = []
    
    # Identify prefixes to remove from COMPLETE
    prefixes_to_replace = []
    for i in range(1, 11):
        prefixes_to_replace.append(f"johreivol{i:02d}_")
    prefixes_to_replace.append("pontosfocaisvol01_")
    prefixes_to_replace.append("pontosfocaisvol02_")
    
    print(f"Removing items with prefixes: {prefixes_to_replace}")
    
    def should_keep(item):
        iid = item.get("id", "")
        for p in prefixes_to_replace:
            if iid.startswith(p):
                return False
        return True

    complete_data_cleaned = [x for x in complete_data if should_keep(x)]
    print(f"Complete items before: {len(complete_data)}, after clean: {len(complete_data_cleaned)}")
    
    # Load all bilingual files
    bilingual_files = glob.glob(os.path.join(DATA_DIR, "*_bilingual.json"))
    
    total_new = 0
    
    for b_file in bilingual_files:
        filename = os.path.basename(b_file)
        
        # Only process relevant files
        if "johrei_vol" in filename or "pontos_focais_vol" in filename:
            print(f"Processing {filename}...")
            b_data = load_json(b_file)
            
            site_items = []
            
            for item in b_data:
                # Create a copy for site/complete usage
                new_item = item.copy()
                
                # Skip items with empty content (ghost headers)
                if not new_item.get("content_pt", "").strip():
                    # print(f"Skipping empty item {new_item['id']}")
                    continue

                # Map content_pt -> content for compatibility (REMOVED for Strict Migration)
                # if "content_pt" in new_item:
                #     new_item["content"] = new_item["content_pt"]
                
                # Map title_pt -> title for compatibility (REMOVED for Strict Migration)
                # if "title_pt" in new_item:
                #     new_item["title"] = new_item["title_pt"]
                
                # Map label_pt -> label for compatibility (REMOVED for Strict Migration)
                # if "label_pt" in new_item:
                #     new_item["label"] = new_item["label_pt"]
                
                # Ensure content_jp is present (it should be in bilingual)
                
                site_items.append(new_item)
                complete_data_cleaned.append(new_item)
                total_new += 1
            
            # Generate local _site.json for this volume
            site_filename = filename.replace("_bilingual.json", "_site.json")
            site_path = os.path.join(DATA_DIR, site_filename)
            save_json(site_path, site_items)
            print(f"  Generated {site_filename} with {len(site_items)} items.")
                
    print(f"Added {total_new} new items to complete list.")
    print(f"Final Complete count: {len(complete_data_cleaned)}")
    
    complete_data_cleaned.sort(key=lambda x: x.get("id", ""))
    
    print("Saving complete.json...")
    save_json(COMPLETE_JSON, complete_data_cleaned)
    print("Propagation complete.")

if __name__ == "__main__":
    propagate()
