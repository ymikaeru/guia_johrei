import json
import os
import glob

# Paths
DATA_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"
EXPORT_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data/translation_source"

def export_jp_content():
    if not os.path.exists(EXPORT_DIR):
        os.makedirs(EXPORT_DIR)
        
    files = glob.glob(os.path.join(DATA_DIR, "*_bilingual.json"))
    
    summary = []
    
    for file_path in files:
        filename = os.path.basename(file_path)
        vol_name = filename.replace("_bilingual.json", "")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            export_data = []
            for item in data:
                # Only export if there is Japanese content
                if item.get("content_jp") and item.get("title_jp"):
                    export_item = {
                        "id": item.get("id"),
                        "vol": item.get("volume"),
                        "label_jp": item.get("label_jp", ""),
                        "title_jp": item.get("title_jp"),
                        "content_jp": item.get("content_jp")
                    }
                    export_data.append(export_item)
            
            if export_data:
                out_path = os.path.join(EXPORT_DIR, f"{vol_name}_jp_source.json")
                with open(out_path, 'w', encoding='utf-8') as f:
                    json.dump(export_data, f, indent=2, ensure_ascii=False)
                
                print(f"Exported {len(export_data)} items to {out_path}")
                summary.append(f"- {vol_name}: {len(export_data)} items")
            else:
                print(f"Skipping {vol_name}: No valid JP content found.")
                
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print("\nExport Summary:")
    print("\n".join(summary))

if __name__ == "__main__":
    export_jp_content()
