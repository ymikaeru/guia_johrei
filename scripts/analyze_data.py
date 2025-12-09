import json
import re
import os

files = [
    'data/curas.json',
    'data/fundamentos.json',
    'data/pontos_focais.json',
    'data/explicacoes_guia1.json',
    'data/explicacoes_guia2.json',
    'data/explicacoes_guia3.json'
]

report = {
    "duplicate_ids": [],
    "numbered_titles": [],
    "compound_content": [],
    "empty_content": [],
    "missing_tags": [],
    "stats": {}
}

all_ids = {}

for file_path in files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        report["stats"][file_path] = len(data)
        
        for item in data:
            # Check ID
            if 'id' in item:
                if item['id'] in all_ids:
                    report["duplicate_ids"].append(f"{item['id']} in {file_path} (seen in {all_ids[item['id']]})")
                else:
                    all_ids[item['id']] = file_path
            
            # Check Title
            if 'title' in item:
                if re.match(r'^[\d\.]+\s', item['title']):
                    report["numbered_titles"].append(f"{item['title']} ({file_path})")
            
            # Check Content (Compound)
            if 'content' in item:
                if not item['content'].strip():
                    report["empty_content"].append(f"{item.get('title','No Title')} ({file_path})")
                
                # Detect 1)... 2)... pattern
                matches = re.findall(r'\n\d+\)', item['content'])
                if len(matches) > 2:
                    report["compound_content"].append(f"{item.get('title','No Title')} has {len(matches)} sub-items ({file_path})")

            # Check Tags
            if 'tags' not in item or not item['tags']:
                report["missing_tags"].append(f"{item.get('title','No Title')} ({file_path})")

    except Exception as e:
        print(f"Error reading {file_path}: {e}")

# Output Report
print("=== DATA ANALYSIS REPORT ===")
print(json.dumps(report, indent=2, ensure_ascii=False))
