import json
import re

def normalize_text(text):
    """Normalize text by stripping partial whitespace/newlines/asterisks."""
    if not text:
        return ""
    return text.strip().replace('**', '').replace(' ', '').replace('　', '')

def load_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"File not found: {filepath}")
        return []

def save_json(data, filepath):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def num_to_kanji(num_str):
    mapping = {
        '0': '〇', '1': '一', '2': '二', '3': '三', '4': '四',
        '5': '五', '6': '六', '7': '七', '8': '八', '9': '九'
    }
    return ''.join(mapping.get(c, c) for c in num_str)

def extract_citation_numbers(text):
    # Matches (Coletânea de Ensinamentos Nº 31, pág. 64) or similar
    match = re.search(r'[Cc]oletânea.*?Nº\s*(\d+).*?pág\.\s*(\d+)', text)
    if match:
        return match.group(1), match.group(2)
    return None, None

def parse_markdown_sections(filepath):
    sections = {}
    current_headers = [] # Stack of headers [H1, H2, ...]
    current_content = []
    
    # Store by raw header line (normalized) -> Content
    # Also store by Citation if found in content?
    # Better: Store Header -> Content.
    # Logic: H1 starts new section. H2 fits inside H1?
    # For now, simplistic flat parsing by "most recent header" works for unique headers.
    
    # Pattern for headers
    # Included \d+、 for Arabic numbering like 19、...
    header_pattern = re.compile(r'^(#+\s*\*\*)?([一二三四五六七八九十\d]+、.*?|（[一二三四五六七八九十\d]+）.*?|第[一二三四五六七八九十\d]+[章節].*?)(\*\*)?$')
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"Markdown file not found: {filepath}")
        return {}

    current_header = "PREFACE" 
    
    for line in lines:
        line_stripped = line.strip()
        is_header = False
        
        # Check specific header patterns
        # Robust check for lines ending in ** (common in this file)
        # Also check regex
        if line_stripped.endswith("**") and len(line_stripped) < 100:
             is_header = True
        elif header_pattern.match(line_stripped):
            is_header = True
            
        if is_header:
            if current_header:
                # Save previous
                key = normalize_text(current_header)
                if key not in sections: # Keep first occurrence or overwrite? 
                    # Overwrite usually better if duplicate titles exist? No, usually distinct.
                    sections[key] = "\n".join(current_content).strip()
                else:
                    # Append index to make unique?
                    # For now, let's just warn or ignore. 
                    # But for "Seção 1", uniqueness is an issue. 
                    pass 
                
            current_header = line_stripped
            current_content = []
        else:
            current_content.append(line)
            
    if current_header and current_content:
        sections[normalize_text(current_header)] = "\n".join(current_content).strip()
        
    return sections

def populate_fundamentos():
    json_path = 'data/fundamentos_ptJp.json'
    md_path = 'Docx_Original/浄霊法講座.md'
    data = load_json(json_path)
    if not data: return
    
    sections = parse_markdown_sections(md_path)
    
    # Debug: Print some keys
    # print("Sample Keys:", list(sections.keys())[:10])
    
    # Manual Mapping (Normalized keys)
    manual_map = {
        "SobreJohreiemAnimais": "五、動物について", 
        "Deagoraemdiante": "指を離さぬこと", # Needs fallback to content citation search
        "NovosMedicamentos": "四、新薬", 
        "SobreaCintaAbdominal(Iwata-obi)": "19、腹帯の良否に就いて", 
        "SeNãoEncontraroPontoVital,\"ColoqueoKi\"(Atenção/Energia)Momentaneamente": "19、急所が見付からない場合一時気を抜く事",
        "Apendicite": "盲腸炎", # Tentative
        "Hipogalactia(PoucoLeite)": "乳腺" # Tentative
    }

    raw_text_full = ""
    with open(md_path, 'r', encoding='utf-8') as f:
        raw_text_full = f.read()

    count = 0
    for item in data[:]: # Iterate all
        title = item.get('title', '')
        # Only populate if content_ja is empty
        if not item.get('content_ja'): 
            title_ja = item.get('title_ja', '')
            norm_title = normalize_text(title)
            norm_title_ja = normalize_text(title_ja)
            
            found_content = None
            found_key = None
            
            # 1. Try title_ja match (Prioritize this if valid)
            if norm_title_ja and norm_title_ja in sections:
                found_content = sections[norm_title_ja]
                found_key = norm_title_ja
            
            # 2. Try Manual Map
            elif norm_title in manual_map and manual_map[norm_title] in sections:
                target_key = manual_map[norm_title]
                found_content = sections[target_key]
                found_key = target_key
            
            # 3. Try Citation Match
            if not found_content and item.get('content'):
                vol, page = extract_citation_numbers(item['content'])
                if vol and page:
                    kanji_vol = num_to_kanji(vol)
                    kanji_page = num_to_kanji(page)
                    patterns = [
                        f"御教え集{kanji_vol}号　{kanji_page}頁",
                        f"御教え集{kanji_vol}号{kanji_page}頁",
                        f"御垂示録{kanji_vol}号　{kanji_page}頁",
                        f"御垂示録{kanji_vol}号{kanji_page}頁"
                    ]
                    
                    for pat in patterns:
                         # Check content of all sections
                         for k, v in sections.items():
                             if pat in v:
                                 found_content = v
                                 found_key = k
                                 break
                         if found_content: break

            if found_content:
                item['content_ja'] = found_content
                item['title_ja'] = found_key
                count += 1
                print(f"Populated: {title} (Key: {found_key})")
            else:
                # print(f"FAILED: {title} (Norm: {norm_title})")
                pass

    if count > 0:
        save_json(data, json_path)
        print(f"Updated {count} items in {json_path}")


def populate_contexto():
    json_path = 'data/explicacoes_contexto.json'
    data = load_json(json_path)
    if not data: return
    
    # Map sources to files
    file_map = {
        "Explicação 01": "Docx_Original/総論１.md",
        "Explicação 02": "Docx_Original/総論２.md", 
        "Explicação 03": "Docx_Original/総論３.md"
    }
    
    # Cache parsed files
    parsed_files = {}

    count = 0
    for item in data:
        source = item.get('source')
        if not source: continue
        
        target_file = None
        for key in file_map:
            if key in source:
                target_file = file_map[key]
                break
        
        if not target_file: continue
        
        if target_file not in parsed_files:
            parsed_files[target_file] = parse_markdown_sections(target_file)
        
        sections = parsed_files[target_file]
        title = item.get('title', '')
        norm_title = normalize_text(title)
        
        found_content = None
        found_key = None
        
        # Mapping Logic
        # 1. Prefácio -> PREFACE (Special key in parse_markdown_sections)
        # 2. Capítulo X -> 第X章...
        # 3. Seção Y -> 第Y節...
        
        if "Prefácio" in title:
            if "PREFACE" in sections:
                found_content = sections["PREFACE"]
                found_key = "はしがき" # Generic
        elif "Capítulo" in title:
            # Extract number
            match = re.search(r'Capítulo\s*(\d+)', title)
            if match:
                num = match.group(1)
                kanji_num = num_to_kanji(num)
                search_key = f"第{kanji_num}章"
                
                # Search sections keys for this prefix
                for k in sections:
                    if k.startswith(search_key):
                        found_content = sections[k]
                        found_key = k
                        break
        elif "Seção" in title:
            match = re.search(r'Seção\s*(\d+)', title)
            if match:
                num = match.group(1)
                kanji_num = num_to_kanji(num)
                search_key = f"第{kanji_num}節"
                # Searching for Seção requires knowing the Chapter context if multiple Sec 1s exists.
                # Simplification: Assume unique or sequential. 
                # Better: Filter by 'source' or ensure uniqueness.
                # For now, just match first occurrence (not ideal but start)
                for k in sections:
                     if k.startswith(search_key):
                        found_content = sections[k]
                        found_key = k
                        break

        if found_content:
            item['title_ja'] = found_key
            item['content_ja'] = found_content
            count += 1
            print(f"Populated Context: {title} -> {found_key}")
        else:
            print(f"FAILED Context: {title} ({target_file})")

    if count > 0:
        save_json(data, json_path)
        print(f"Updated {count} items in {json_path}")

if __name__ == "__main__":
    print("--- Fundamentals ---")
    populate_fundamentos()
    print("\n--- Context ---")
    populate_contexto()
