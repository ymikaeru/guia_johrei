import json
import os
import glob

# Paths
SOURCE_JP_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data/translation_source"
TRANSLATED_PT_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data/Translated" # Updated path
FINAL_OUTPUT_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"

def merge_translations():
    # Ensure translated dir exists
    if not os.path.exists(TRANSLATED_PT_DIR):
        print(f"Directory not found: {TRANSLATED_PT_DIR}")
        return

    # Find translation files
    pt_files = glob.glob(os.path.join(TRANSLATED_PT_DIR, "*_pt.json"))
    
    if not pt_files:
        print(f"No translation files found in {TRANSLATED_PT_DIR}")
        return

    merged_count = 0

    for pt_file in pt_files:
        filename = os.path.basename(pt_file)
        # Expect filename: johrei_volXX_pt.json
        
        vol_base = filename.replace("_pt.json", "")
        jp_filename = f"{vol_base}_jp.json"
        jp_path = os.path.join(SOURCE_JP_DIR, jp_filename)
        
        if not os.path.exists(jp_path):
            print(f"Warning: Source JP file not found for {filename} ({jp_path})")
            continue
            
        print(f"Merging {filename} + {jp_filename}...")
        
        try:
            with open(pt_file, 'r', encoding='utf-8') as f:
                data_pt = json.load(f)
            with open(jp_path, 'r', encoding='utf-8') as f:
                data_jp = json.load(f)
                
            # Create a lookup for JP data
            jp_map = {item['id']: item for item in data_jp}
            
            merged_data = []
            
            for i, item_pt in enumerate(data_pt):
                item_id = item_pt['id']
                item_jp = jp_map.get(item_id)
                
                # FALLBACK: Index-based matching if ID fails
                if not item_jp:
                    if i < len(data_jp):
                        # Assume integrity of order
                        item_jp = data_jp[i]
                        # print(f"  -> ID mismatch ({item_id}), matched by index to {item_jp['id']}")
                    else:
                        print(f"  -> Error: Could not match item {item_id} (Index {i} out of bounds for JP data)")
                        continue
                
                if item_jp:
                    # Merge!
                    merged_item = item_jp.copy() # Inherit JP + Vol info (includes correct ID)
                    
                    # Overwrite/Add PT info
                    merged_item['title_pt'] = item_pt['title_pt']
                    merged_item['content_pt'] = item_pt['content_pt']
                    
                    # ensure bilingual structure for site
                    # merged_item['title'] = item_pt['title_pt'] # Legacy removed
                    # merged_item['content'] = item_pt['content_pt'] # Legacy removed
                    
                    merged_data.append(merged_item)
            
            if merged_data:
                # Output filename: johrei_volXX_bilingual.json
                out_name = f"{vol_base}_bilingual.json".replace("johrei_vol", "johrei_vol") # ensure naming
                out_path = os.path.join(FINAL_OUTPUT_DIR, out_name)
                
                with open(out_path, 'w', encoding='utf-8') as f:
                    json.dump(merged_data, f, indent=2, ensure_ascii=False)
                
                print(f"  -> Successfully created {out_name} with {len(merged_data)} bilingual items.")
                merged_count += 1
                
        except Exception as e:
            print(f"Error merging {filename}: {e}")

    print(f"\nMerge complete. Processed {merged_count} volumes.")
    print("Run 'python3 scripts/propagate_rebuild.py' next to update the website.")

if __name__ == "__main__":
    merge_translations()
