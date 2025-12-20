
import json
import os

JSON_FILE = '/Users/michael/Documents/Ensinamentos/guia_johrei/data_rebuilt/pontos_focais_vol02_bilingual.json'
REPORT_FILE = '/Users/michael/Documents/Ensinamentos/guia_johrei/verification_report_vol02.md'

def main():
    if not os.path.exists(JSON_FILE):
        print(f"File not found: {JSON_FILE}")
        return

    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write("# Verification Report Vol 02\n\n")
        f.write("| ID | PT Title | JP Title | Status |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")

        for item in data:
            pt_title = item.get('title', '')
            jp_title = item.get('title_ja', '')
            
            # Simple heuristic: check if JP title is not empty
            status = "OK" if jp_title else "MISSING JP"
            
            # Check for potential mismatch (hard to do auto without translation, but we can check lengths)
            f.write(f"| {item['id']} | {pt_title} | {jp_title} | {status} |\n")

    print(f"Verification report written to {REPORT_FILE}")

if __name__ == "__main__":
    main()
