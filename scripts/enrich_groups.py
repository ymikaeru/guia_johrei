
import json
import re
import os

# Volume 1 Mapping
VOL1_GROUPS_JP = {
    "第一章": "脳疾患と腎臓の働き",
    "第二章": "眼・鼻・耳・歯の病気",
    "第三章": "心臓病について",
    "第四章": "肺病について",
    "第五章": "胃病について",
    "第六章": "肝臓病について",
    "第七章": "腎臓病について",
    "参考 第一章": "がん病について",
    "参考 第二章": "婦人病について",
    "参考 第三章": "小児病について",
    "参考 第四章": "精神病について",
    "参考 第五章": "胸部疾患"
}

VOL1_GROUPS_PT = {
    "脳疾患と腎臓の働き": "Doenças Cerebrais e o Funcionamento Renal",
    "眼・鼻・耳・歯の病気": "Doenças dos Olhos, Nariz, Ouvidos e Dentes",
    "心臓病について": "Doenças Cardíacas",
    "肺病について": "Doenças Pulmonares",
    "胃病について": "Doenças Gástricas",
    "肝臓病について": "Doenças Hepáticas",
    "腎臓病について": "Doenças Renais",
    "がん病について": "Sobre o Câncer",
    "婦人病について": "Doenças Femininas",
    "小児病について": "Doenças Infantis",
    "精神病について": "Doenças Mentais",
    "胸部疾患": "Doenças Torácicas"
}

# Volume 2 Mapping (Based on Headers ##)
VOL2_GROUPS_PT = {
    "Ⅰ．浄霊の基本的急所について": "I. Pontos Vitais Básicos do Johrei",
    "Ⅱ．頭部": "II. Cabeça",
    "Ⅲ．胸部": "III. Tórax",
    "Ⅳ．腹部": "IV. Abdômen",
    "Ⅴ．生殖器": "V. Órgãos Reprodutores",
    "Ⅵ．婦人病": "VI. Doenças Femininas",
    "Ⅶ．小児": "VII. Crianças",
    "Ⅷ．癌病及びその他の病気": "VIII. Câncer e Outras Doenças",
    "Ⅹ．腫物及び火傷・切傷": "X. Tumores, Queimaduras e Cortes",
    "ⅩⅠ．薬毒の種々相": "XI. Vários Aspectos das Toxinas de Medicamentos",
    "Ⅰ．宗教による治療": "I. Tratamento pela Religião" # In Vol 2 Part 2? Or just extra section
}


def enrich_vol01():
    print("Enriching Vol 01...")
    json_path = "data/pontos_focais_vol01_bilingual.json"
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Simple logic: Assign groups based on ID ranges or Title matching if possible.
    # Since we don't have perfect line mapping, let's look at the "raw_jp" source or just hardcode ranges?
    # Actually, iterate through the Markdown to get the order, then match to JSON items in order.
    
    md_path = "Markdown/MD_Original/各論.md"
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    current_chapters = [] # Stack of headers
    current_group_jp = "未分類"
    
    # We will build a list of (TitleJP, GroupJP) from Markdown
    md_structure = []
    
    current_h2 = ""
    current_h3 = ""
    
    for line in lines:
        line = line.strip()
        if line.startswith("## "):
            current_h2 = line.replace("## ", "").strip()
            # Reset H3 when H2 changes? Usually yes.
            current_h3 = "" 
        elif line.startswith("### "):
            # Capture ### items (e.g., Intro item for the chapter or section)
            # Remove 〔 and 〕 and 【 and 】 just in case
            title = line.replace("### ", "").replace("〔", "").replace("〕", "").replace("【", "").replace("】", "").strip()
            group = VOL1_GROUPS_JP.get(current_h2, current_h2)
            md_structure.append({"title": title, "group_jp": group})

        elif line.startswith("#### 【"):
            title = line.replace("#### 【", "").replace("】", "").strip()
            
            # Determine Group based on H2
            group = VOL1_GROUPS_JP.get(current_h2, current_h2)
            
            md_structure.append({"title": title, "group_jp": group})

    # Now assign to JSON
    # JSON items might not be perfectly identical in title, so fuzzy match or index match?
    # IDs are pontosfocaisvol01_01 to 69.
    # Markdown entries count?
    print(f"  Found {len(md_structure)} items in MD.")
    print(f"  Found {len(data)} items in JSON.")
    
    # Direct index matching is risky if counts differ. 
    # Vol 1 JSON has 35 items currently (some excluded?). No, previous steps said 69 generated, but user only provided PT for 35?
    # "Vol 01 now has 35 bilingual items". 
    # Ah, `pontos_focais_vol01_bilingual.json` has 35. 
    # The source `pontos_focais_vol01_jp.json` likely has 69.
    # We should filter md_structure to only those present in JSON?
    # Matching by Title JP is best.
    
    count = 0
    for item in data:
        t_jp = item['title_jp']
        # Find in md_structure
        match = next((x for x in md_structure if x['title'] in t_jp or t_jp in x['title']), None)
        if match:
            group_jp = match['group_jp']
            group_pt = VOL1_GROUPS_PT.get(group_jp, group_jp)
            
            item['category_jp'] = group_jp
            item['category_pt'] = group_pt
            count += 1
        else:
            print(f"  Warning: No category match for {t_jp}")
            
    print(f"  Updated {count} items in Vol 01.")
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def enrich_vol02():
    print("Enriching Vol 02...")
    json_path = "data/pontos_focais_vol02_bilingual.json"
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    md_path = "Markdown/MD_Original/各論２.md"
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    md_structure = []
    current_h2 = ""
    current_h3 = "" # Sub-category in Vol 2? 
                    # Structure: ## Ⅰ．...  -> ### １．... -> #### 1) ...
                    # JSON Titles seem to be "１．熱と痛み..." (H3 level) OR "1) 脳溢血" (H4 level)?
                    # Looking at JSON sample: "title_jp": "１．熱と痛みのある所が急所" is an H3.
                    # "title_jp": "1)　脳天、後頭部、延髄、肩" is an H4.
                    # The user wants "categories". 
                    # Ideally, H2 is the broad category ("Ⅱ．頭部" -> Head), H3 is sub ("１．脳" -> Brain).
                    # Let's try to capture H2 as the main Category.
    
    item_buffer = [] # (Title, Group)
    
    for line in lines:
        line = line.strip()
        if line.startswith("## "):
            current_h2 = line.replace("## ", "").strip()
        elif line.startswith("### "):
            # This is an item title in some cases? 
            # Or a subcategory?
            # In JSON sample: "title_jp": "１．熱と痛みのある所が急所" -> This corresponds to `### １．...`
            # For these top level items, Group is H2.
            title = line.replace("### ", "").strip()
            md_structure.append({"title": title, "group_jp": current_h2})
            
        elif line.startswith("#### "):
            # This is an item title. Group is H2.
            title = line.replace("#### ", "").strip()
            # Clean "1) " etc? JSON title includes it? 
            # JSON: "1)　脳天..." (full width space). MD: "1)　脳天..."
            md_structure.append({"title": title, "group_jp": current_h2})

    print(f"  Found {len(md_structure)} items in MD.")
    print(f"  Found {len(data)} items in JSON.")

    count = 0
    for item in data:
        t_jp = item['title_jp']
        # Fuzzy match title
        # Remove whitespace
        t_jp_clean = t_jp.replace(" ", "").replace("　", "")
        
        match = None
        for cand in md_structure:
            c_title_clean = cand['title'].replace(" ", "").replace("　", "")
            if t_jp_clean in c_title_clean or c_title_clean in t_jp_clean:
                match = cand
                break
        
        if match:
            group_jp = match['group_jp']
            group_pt = VOL2_GROUPS_PT.get(group_jp, group_jp)
            
            item['category_jp'] = group_jp
            item['category_pt'] = group_pt
            count += 1
        else:
             print(f"  Warning: No category match for {t_jp}")

    print(f"  Updated {count} items in Vol 02.")
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    enrich_vol01()
    enrich_vol02()
