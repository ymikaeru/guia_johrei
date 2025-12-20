import json
import re

def import_soron2():
    # File Paths
    pt_file = "Docx_Original/Explicação Ensinamentos 03.md"
    ja_file = "Docx_Original/総論２.md"
    
    # Read Content
    try:
        with open(pt_file, 'r', encoding='utf-8') as f:
            pt_raw = f.read()
        with open(ja_file, 'r', encoding='utf-8') as f:
            ja_raw = f.read()
    except Exception as e:
        print(f"Error reading files: {e}")
        return

    # Process PT Content
    # Remove markdown headers for 'content' field, keep for Title if needed.
    # We want body text for alignment.
    # Explicacao 03 starts with headers.
    # Let's simple-clean: remove lines starting with #
    pt_lines = [l for l in pt_raw.splitlines() if not l.strip().startswith('#')]
    pt_content = '\n'.join(pt_lines).strip()
    # Normalize multiple newlines
    pt_content = re.sub(r'\n{3,}', '\n\n', pt_content)

    # Process JA Content
    # Soron 2 starts with Title usually.
    # Remove lines starting with # or squares if any (checked cat, seems cleanish but might have headers)
    ja_lines = [l for l in ja_raw.splitlines() if not l.strip().startswith('#')]
    ja_content = '\n'.join(ja_lines).strip()
    ja_content = re.sub(r'\n{3,}', '\n\n', ja_content)
    
    # Update JSONs
    update_json('data/fundamentos.json', 'soron_2', 'Pontos Vitais (Kyusho)', pt_content)
    update_json('data/fundamentos_ja.json', 'soron_2', '急所 (Kyusho)', ja_content)

def update_json(path, item_id, title, content):
    try:
        data = json.load(open(path, encoding='utf-8'))
    except:
        data = []
    
    found = False
    for i in data:
        if i['id'] == item_id:
            i['content'] = content
            i['title'] = title
            found = True
            break
    
    if not found:
        data.append({
            "id": item_id,
            "title": title,
            "content": content,
            "source": "Imported via Script",
            "tags": []
        })
        print(f"[{path}] Created {item_id}")
    else:
        print(f"[{path}] Updated {item_id}")

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    import_soron2()
