import json
import os
import glob
import re

def count_paragraphs(text):
    if not text:
        return 0
    # Split by double newline which is our standard paragraph separator
    # but also handle cases where there might be spaces
    paras = re.split(r'\n\s*\n', text.strip())
    # Filter out empty strings
    return len([p for p in paras if p.strip()])

def scan_files():
    data_dir = '/Users/michael/Documents/Ensinamentos/guia_johrei/data'
    # Target all json files except backups and index files
    files = glob.glob(os.path.join(data_dir, '*.json'))
    
    # Exclude list
    exclude = ['index.json', 'index_ja.json', 'explicacoes_index.json', 'teachings_ja_raw.json']
    files = [f for f in files if os.path.basename(f) not in exclude and 'backup' not in f and '.bak' not in f]

    print(f"Scanning {len(files)} files...")
    
    issues = []
    
    # Specific blob signature we found earlier
    blob_signature = "2021.01.25"

    for file_path in files:
        filename = os.path.basename(file_path)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            if isinstance(data, dict):
                # Some files might be dicts wrapping arrays, but usually they are arrays
                # If dict, assume it might be mapped by ID or have a key
                # For this project, usually lists. Let's check type.
                if 'items' in data:
                    data = data['items']
                else:
                    # Proceed only if list
                    pass

            if not isinstance(data, list):
                # print(f"Skipping {filename}: not a list of items")
                continue

            for item in data:
                item_id = item.get('id', 'unknown')
                title = item.get('title', 'No Title')
                pt = item.get('content', '')
                ja = item.get('content_ja', '')
                
                # Check for blob corruption signature
                if ja and blob_signature in ja:
                     issues.append({
                        'file': filename,
                        'id': item_id,
                        'title': title,
                        'type': 'CORRUPTION_BLOB',
                        'details': 'Contains known large blob signature'
                    })

                # Skip if no Japanese content
                if not ja:
                    continue
                    
                pt_len = len(pt)
                ja_len = len(ja)
                
                pt_paras = count_paragraphs(pt)
                ja_paras = count_paragraphs(ja)
                
                # Heuristic 1: Paragraph Count Mismatch
                # Japanese often has header lines that look like paragraphs, so existing code handles mismatch.
                # However, if mismatch is HUGE (e.g. > 5 diff), it's worth flagging.
                para_diff = abs(pt_paras - ja_paras)
                if para_diff > 5 and pt_paras > 0:
                    issues.append({
                        'file': filename,
                        'id': item_id,
                        'title': title,
                        'type': 'PARA_MISMATCH',
                        'details': f"PT: {pt_paras} vs JA: {ja_paras} paras"
                    })
                
                # Heuristic 2: Length Ratio
                # Japanese is usually denser. valid JA is often 0.3 to 0.8 of PT length.
                # If JA > PT length, it's very suspicious (unless PT is huge and JA is huge?)
                # If JA < 0.1 * PT, it might be truncated.
                
                if pt_len > 0:
                    ratio = ja_len / pt_len
                    if ratio > 1.2: # JA significantly longer than PT
                         issues.append({
                            'file': filename,
                            'id': item_id,
                            'title': title,
                            'type': 'SUSPICIOUS_LENGTH_HIGH',
                            'details': f"Ratio {ratio:.2f} (PT: {pt_len}, JA: {ja_len})"
                        })
                    elif ratio < 0.1: # JA tiny compared to PT
                         issues.append({
                            'file': filename,
                            'id': item_id,
                            'title': title,
                            'type': 'SUSPICIOUS_LENGTH_LOW',
                            'details': f"Ratio {ratio:.2f} (PT: {pt_len}, JA: {ja_len})"
                        })

        except Exception as e:
            print(f"Error scanning {filename}: {e}")

    # Report
    print("\n--- Scan Results ---")
    if not issues:
        print("No significant issues found.")
    else:
        # Group by file
        current_file = ""
        for issue in issues:
            if issue['file'] != current_file:
                print(f"\nFile: {issue['file']}")
                current_file = issue['file']
            print(f"  [{issue['type']}] {issue['id']} '{issue['title']}': {issue['details']}")

if __name__ == "__main__":
    scan_files()
