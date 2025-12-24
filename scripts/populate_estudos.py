import json
import re
import os

JSON_PATH = 'data/fundamentos_ptJp.json'
KAKURON_1_PATH = 'Docx_Original/MD_Original/各論.md'
KAKURON_2_PATH = 'Docx_Original/MD_Original/各論２.md'

# Manual mapping for tltles that might not strictly match or need translation key
# Portuguese Title -> Japanese Header (partial or full)
TITLE_MAPPING_01 = {
    "Causas das Doenças Gástricas": "胃病の原因",
    "Sobre a Urina Tóxica": "尿毒について",
    "Causas do Câncer": "がんの原因",
    "Enfermidades dos Rins": "腎臓疾患",
    "Sarampo": "はしか",
    "Epilepsia": "癲癇",
    "Bronquite Crônica": "慢性気管支炎",
    "Apendicite": "盲腸炎", # Check this
}

TITLE_MAPPING_02 = {
    "Remédios Ocidentais e Chineses": "洋薬と漢薬",
    "Laxantes": "下　剤", # Note the space
    "Analgésicos": "鎮痛剤",
    "Colírios": "点眼薬",
    "Remédios Nasais": "鼻　薬",
    "Gargarejos": "含嗽薬",
    "Cremes Dentais": "歯　磨", # and 歯磨
    "Pomadas e Unguentos": "塗布薬",
    "Jintan": "仁丹",
    "Salvarsan": "サルバルサン", 
    "Vacinas e Desinfetantes": "予防注射、消毒薬", 
    "Doenças Causadas por Pecados e Impurezas": "罪穢による病気",
    "Doenças Causadas por Espíritos": "霊による病気の種類", # Best match
    "Tuberculose da Garganta": "喉頭結核",
    "Paralisia do Nervo Facial": "顔面神経麻痺",
    "Nevralgia Facial": "顔面神経痛",
    "Atrofia Renal": "腎臓萎縮", 
    "Hemorroidas (Nódulos)": "痔核", 
    "Doenças Venéreas": "性病", 
    "Cisto de Ovário e Hidropisia Ovariana": "卵巣腫脹", 
    "Leucorreia (Corrimento Branco)": "子宮内膜炎", 
    "Rim na Gravidez": "妊娠腎",
    "Hipogalactia (Pouco Leite)": "汁乳不良", 
    "Outras Doenças Infantis": "その他の小児病",
    "Câncer": "癌病",
    "Furúnculos": "腫物",
    "Queimaduras e Cortes": "火傷、切傷",
}

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def extract_sections_kakuron_1(path):
    """Parses 各論.md using 【Header】 pattern."""
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    sections = {}
    # Find all pattern 【...】
    matches = list(re.finditer(r'【(.*?)】', text))
    for i, match in enumerate(matches):
        title = match.group(1).strip()
        start = match.end()
        end = matches[i+1].start() if i + 1 < len(matches) else len(text)
        content = text[start:end].strip()
        sections[title] = content
        # Handle variations like 【脳膜炎－髄膜炎】 -> map both
        if '－' in title:
            parts = title.split('－')
            for part in parts:
                sections[part.strip()] = content
    return sections

def extract_sections_kakuron_2(path):
    """Parses 各論２.md with mixed patterns."""
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    sections = {}
    
    # Updated regex to catch more patterns
    normalized_sections = {}
    
    # We iterate line by line to support context better
    lines = text.split('\n')
    current_title = None
    buffer = []
    
    def flush(title, buf):
        if title and buf:
            content = '\n'.join(buf).strip()
            # If title is numbered, create clean key too
            clean = re.sub(r'^[０-９0-9]+．', '', title).strip()
            clean = re.sub(r'^[０-９0-9]+\)', '', clean).strip()
            # Remove leading ** and trailing **
            clean = re.sub(r'^\*\*', '', clean)
            clean = re.sub(r'\*\*$', '', clean).strip()
            
            clean = re.sub(r'^[０-９0-9]+．', '', clean).strip() # Re-clean in case ** was outside
            
            normalized_sections[title] = content
            if clean:
                normalized_sections[clean] = content
            # Also handle space differences "仁　丹" -> "仁丹"
            clean_space = clean.replace('　', '')
            normalized_sections[title.replace('　', '')] = content
            if clean_space:
                normalized_sections[clean_space] = content
                
            # DEBUG: Print keys for specific items of interest
            if "罪" in title or "霊" in title:
                print(f"DEBUG Extracted: '{title}' -> Clean: '{clean}'")
                
    for line in lines:
        line = line.strip()
        # Check for headers
        # Rank: 【...】 > # **...** > **N. ...** > N. ...
        
        is_header = False
        new_title = None
        
        # Regexes
        m_bracket = re.match(r'^【(.*?)】$', line)
        m_hash = re.match(r'^# \*\*(.*?)\*\*$', line)
        m_bold_num = re.match(r'^\*\*[０-９0-9]+．(.*?)\*\*$', line)
        m_num_dot = re.match(r'^[０-９0-9]+．(.*)$', line)
        m_num_paren = re.match(r'^[0-9]+\)\s*(.*)$', line)
        
        if m_bracket:
            new_title = m_bracket.group(1)
            is_header = True
        elif m_hash:
            new_title = m_hash.group(1)
            is_header = True
        elif m_bold_num:
            new_title = m_bold_num.group(1) # We use the inner text
            new_title = re.sub(r'^[０-９0-9]+．', '', new_title).strip() # Extract just title
            is_header = True
        elif m_num_dot:
            # Heuristic: usually headers are short. If line is long, likely list item in text.
            if len(line) < 50: 
                new_title = line
                is_header = True
        # m_num_paren often used for subtitles like 1) 2). We can treat them as headers if short
        elif m_num_paren:
             if len(line) < 40:
                new_title = line
                is_header = True

        if is_header:
            flush(current_title, buffer)
            current_title = new_title
            buffer = []
        else:
            if current_title:
                buffer.append(line)
                
    flush(current_title, buffer) # Flush last
    
    return normalized_sections


def populate():
    data = load_json(JSON_PATH)
    kakuron_1_sections = extract_sections_kakuron_1(KAKURON_1_PATH)
    kakuron_2_sections = extract_sections_kakuron_2(KAKURON_2_PATH)
    
    # Merge sections 
    all_sections = {**kakuron_1_sections, **kakuron_2_sections}
    
    updated_count = 0
    
    for item in data:
        if item.get('content_ja'):
            continue # Already populated
            
        source = item.get('source')
        title_pt = item.get('title')
        
        target_ja_title = None
        content = None
        
        # Specific overrides for concatenation or complex mapping
        if title_pt == "Doenças Venéreas":
            # Concatenate parts
            p1 = all_sections.get("性病", "")
            p2 = all_sections.get("硬性下疳（梅毒）", "") or all_sections.get("硬性下疳", "")
            p3 = all_sections.get("軟性下疳", "")
            p4 = all_sections.get("淋病", "")
            
            # Since p2, p3, p4 might be missing if keys differ slightly, try best effort
            if not p2: p2 = all_sections.get("硬性下疳", "")
            
            parts = [p for p in [p1, p2, p3, p4] if p]
            if parts:
                content = "\n\n".join(parts)
                target_ja_title = "性病"
        
        elif title_pt == "Doenças Causadas por Pecados e Impurezas":
             p1 = all_sections.get("罪穢の種類と病気", "")
             p2 = all_sections.get("病気と霊", "")
             parts = [p for p in [p1, p2] if p]
             if parts:
                 content = "\n\n".join(parts)
                 target_ja_title = "罪穢による病気"
                 
        elif title_pt == "Doenças Causadas por Espíritos":
             p1 = all_sections.get("肺結核", "") # 1) 肺結核
             p2 = all_sections.get("治療法", "")
             parts = [p for p in [p1, p2] if p]
             if parts:
                 content = "\n\n".join(parts)
                 target_ja_title = "霊による病気の種類"

        else:
            if source == "Estudos Específicos 01":
                target_ja_title = TITLE_MAPPING_01.get(title_pt)
                
            elif source == "Estudos Específicos 02":
                target_ja_title = TITLE_MAPPING_02.get(title_pt)
                
            if target_ja_title:
                content = all_sections.get(target_ja_title)
            
        if content:
            item['title_ja'] = target_ja_title
            item['content_ja'] = content
            updated_count += 1
            print(f"Populated {item['id']}: {title_pt} -> {target_ja_title}")
        else:
            # Only print missing if we expected a mapping
            if target_ja_title:
                print(f"Missing content for {item['id']}: {title_pt} (Target: {target_ja_title})")
        
    print(f"Total updated: {updated_count}")
    save_json(JSON_PATH, data)

if __name__ == "__main__":
    populate()
