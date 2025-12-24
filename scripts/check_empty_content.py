import json
import glob
import os

def check_files():
    files = glob.glob('/Users/michael/Documents/Ensinamentos/guia_johrei/data/*_bilingual.json')
    files.sort()

    suspicious_items = []

    for file_path in files:
        filename = os.path.basename(file_path)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                for item in data:
                    item_id = item.get('id', 'unknown')
                    title = item.get('title_pt', item.get('title', 'No Title'))
                    content_pt = item.get('content_pt', '')
                    
                    # Criteria for suspicious content
                    is_empty = not content_pt or len(content_pt.strip()) == 0
                    is_short = len(content_pt) < 150
                    is_header_only = content_pt.strip().startswith('##') and len(content_pt) < 200
                    
                    if is_empty or is_short or is_header_only:
                        suspicious_items.append({
                            'file': filename,
                            'id': item_id,
                            'title': title,
                            'content_snippet': content_pt[:50] + '...' if content_pt else 'EMPTY',
                            'reason': 'Empty' if is_empty else ('Header Only' if is_header_only else 'Short')
                        })
        except Exception as e:
            print(f"Error reading {filename}: {e}")

    # Print Report
    print(f"Found {len(suspicious_items)} items with potentially missing content:")
    for issue in suspicious_items:
        print(f"[{issue['file']}] ID: {issue['id']} | Title: {issue['title']} | Reason: {issue['reason']}")
        print(f"   Content: {issue['content_snippet']}\n")

if __name__ == "__main__":
    check_files()
