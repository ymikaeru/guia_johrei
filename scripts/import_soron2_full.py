import json
import re

def import_soron2_full():
    pt_file = "Docx_Original/Explicação Ensinamentos 02.md"
    
    try:
        with open(pt_file, 'r', encoding='utf-8') as f:
            pt_raw = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # Clean headers like '# Explicação Ensinamentos 02'
    # But keep subsection headers if they map to content structure.
    # The debug output showed the Japanese file has sections.
    # Let's strip main title but keep structure.
    
    pt_lines = [l for l in pt_raw.splitlines()]
    # Remove first few lines if they are just file titles
    if pt_lines and pt_lines[0].startswith('# Explicação Ensinamentos 02'):
        pt_lines.pop(0)

    pt_content = '\n'.join(pt_lines).strip()
    pt_content = re.sub(r'\n{3,}', '\n\n', pt_content)

    update_json('data/fundamentos.json', 'soron_2', 'Teoria Geral II', pt_content)

def update_json(path, item_id, title, content):
    try:
        data = json.load(open(path, encoding='utf-8'))
    except:
        data = []
    
    found = False
    for i in data:
        if i['id'] == item_id:
            i['content'] = content
            # i['title'] = title # Keep existing title if set, or update? User said "Pontos Focais do Johrei"? No, that was mismatched.
            # "Teoria Geral II" is safe.
            found = True
            break
    
    if not found:
        data.append({
            "id": item_id,
            "title": title,
            "content": content,
            "source": "Explicação 02",
            "tags": []
        })
        print(f"Created {item_id}")
    else:
        print(f"Updated {item_id}")

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    import_soron2_full()
