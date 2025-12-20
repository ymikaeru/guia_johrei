
import json
import os

JSON_FILE = '/Users/michael/Documents/Ensinamentos/guia_johrei/data_rebuilt/pontos_focais_vol01_bilingual.json'
REPORT_FILE = '/Users/michael/Documents/Ensinamentos/guia_johrei/verification_report_vol01.md'

def main():
    if not os.path.exists(JSON_FILE):
        print(f"Error: {JSON_FILE} not found.")
        return

    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write("# Bilingual JSON Verification Report\n\n")
        f.write(f"Total Items: {len(data)}\n\n")
        f.write("| ID | PT Title | JP Title | Status |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")

        for item in data:
            item_id = item.get('id', 'N/A')
            pt_title = item.get('title', '')
            jp_title = item.get('title_ja', '')
            
            status = "OK"
            if not pt_title or not jp_title:
                status = "MISSING TITLE"
            
            # Escape pipes for markdown table
            pt_title_safe = pt_title.replace('|', '\|')
            jp_title_safe = jp_title.replace('|', '\|')

            f.write(f"| {item_id} | {pt_title_safe} | {jp_title_safe} | {status} |\n")

    print(f"Verification report written to {REPORT_FILE}")

if __name__ == "__main__":
    main()
