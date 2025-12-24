import json
import os
import re

# Directories
DATA_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"
JP_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/Docx_Original/MD_Original/json_output"

# File Paths
PT_FILES = {
    "pontos_focais": os.path.join(DATA_DIR, "pontos_focais.json"),
    "contexto": os.path.join(DATA_DIR, "explicacoes_contexto.json")
}

JP_FILES = {
    "kakuron": os.path.join(JP_DIR, "各論.json"),
    "kakuron2": os.path.join(JP_DIR, "各論２.json"),
    "soron1": os.path.join(JP_DIR, "総論１.json")
}

# --- Mapping Dictionaries ---

# PT Snippet -> JP Snippet for Contexto
CONTEXTO_MAP = {
    "Prefácio": "まえがき",
    "Capítulo 1": "第一章",
    "Problemas de Saúde": "現代の健康問題",
    "Definição de Saúde": "健康の定義",
    "Transição da Noite para o Dia e a": "夜昼転換と「日本医術・浄霊」", # Chapter 2
    "Sobre a Transição da Noite": "夜昼転換について", # Section 1
    "Mundo do Dia": "昼の世界",
    "Motivação": "動機",
    "Essência da Saúde": "健康の真諦",
    "Capacidade Natural": "自然良能力"
}

# English Topic -> JP Keywords
KEYWORDS_JP = {
    "Headache": ["頭痛", "頭"],
    "Dizziness": ["眩暈"],
    "Myopia": ["近視"],
    "Astigmatism": ["乱視"],
    "Cataract": ["底翳", "白内障"],
    "Glaucoma": ["緑内障"],
    "Eye": ["眼", "目"],
    "Ear": ["耳"],
    "Tinnitus": ["耳鳴り"],
    "Otitis": ["中耳炎"],
    "Nose": ["鼻"],
    "Sinusitis": ["蓄膿"],
    "Teeth": ["歯"],
    "Toothache": ["歯痛"],
    "Pyorrhea": ["歯槽膿漏"],
    "Throat": ["喉", "咽喉"],
    "Tonsillitis": ["扁桃腺"],
    "Stomach": ["胃"],
    "Gastric": ["胃"],
    "Ulcer": ["潰瘍"],
    "Gastroptosis": ["胃下垂"],
    "Cramp": ["痙攣"],
    "Heart": ["心臓"],
    "Angina": ["狭心症"],
    "Lung": ["肺"],
    "TB": ["結核"],
    "Asthma": ["喘息"],
    "Pleurisy": ["肋膜"],
    "Kidney": ["腎臓"],
    "Nephritis": ["腎臓炎", "腎炎"],
    "Atrophic": ["萎縮腎"],
    "Uremia": ["尿毒"],
    "Liver": ["肝臓"],
    "Intestine": ["腸"],
    "Appendicitis": ["盲腸"],
    "Constipation": ["便秘"],
    "Diarrhea": ["下痢"],
    "Pylorus": ["幽門"],
    "Hemorrhoids": ["痔"],
    "Uterus": ["子宮"],
    "Menstruation": ["月経"],
    "Women": ["婦人"],
    "Cancer": ["癌", "がん"],
    "Tongue": ["舌"],
    "Esophagus": ["食道"],
    "Insomnia": ["不眠"],
    "Brain": ["脳", "頭脳"],
    "Meningitis": ["脳膜", "髄膜"],
    "Apoplexy": ["脳溢血"],
    "Stroke": ["脳出血", "中風"],
    "Cold": ["風邪", "感冒"],
    "Neuralgia": ["神経痛"],
    "Rheumatism": ["リュウマチ", "リウマチ"],
    "Pain": ["痛"],
    "Occipital": ["後頭部", "後頭"],
    "Frontal": ["前頭部", "前額"],
    "Vertex": ["脳天", "頭頂"],
    "Cervical": ["頸", "首"],
    "Medulla": ["延髄"],
    "Parotid": ["耳下腺"],
    "Inguinal": ["鼠蹊", "鼠径"],
    "Shoulder": ["肩"],
    "Mental": ["精神"],
    "Epilepsy": ["癲癇"],
    "Gonorrhea": ["淋病"],
    "Syphilis": ["梅毒"],
    "Baldness": ["禿"],
    "Hiccough": ["吃逆", "しゃっくり"],
    "SeaSickness": ["船酔"],
    "Frostbite": ["凍傷"],
    "Burn": ["火傷"],
    "Wart": ["疣"],
    "Corn": ["魚の目"],
    "Athlete": ["水虫"],
    "NightSweat": ["寝汗"],
    "BedWetting": ["夜尿"],
    "Infertility": ["不妊"],
    "MorningSickness": ["悪阻", "つわり"],
    "Lactation": ["乳汁"],
    "WhoopingCough": ["百日咳"],
    "Measles": ["麻疹"],
    "ChickenPox": ["水痘"],
    "Hernia": ["脱腸"]
}

# PT Key -> English Topic
PT_KEYWORD_MAP = {
    "Cabeça": "Headache",
    "Enxaqueca": "Headache",
    "Tontura": "Dizziness",
    "Vertigen": "Dizziness",
    "Miopia": "Myopia",
    "Astigmatismo": "Astigmatism",
    "Catarata": "Cataract",
    "Glaucoma": "Glaucoma",
    "Olho": "Eye",
    "Visual": "Eye",
    "Ouvido": "Ear",
    "Zumbido": "Tinnitus",
    "Otite": "Otitis",
    "Surdez": "Ear",
    "Nariz": "Nose",
    "Rinite": "Nose",
    "Sinusite": "Sinusitis",
    "Dente": "Teeth",
    "Dentária": "Teeth",
    "Piorreia": "Pyorrhea",
    "Garganta": "Throat",
    "Amígdala": "Tonsillitis",
    "Estômago": "Stomach",
    "Gástric": "Gastric",
    "Úlcera": "Ulcer",
    "Ptose": "Gastroptosis",
    "Cãibra": "Cramp", # Cramp of stomach
    "Coração": "Heart",
    "Cardíac": "Heart",
    "Angina": "Angina",
    "Pulmão": "Lung",
    "Bronquite": "Lung",
    "Pneumonia": "Lung",
    "Tuberculose": "TB",
    "Asma": "Asthma",
    "Pleurisia": "Pleurisy",
    "Rim": "Kidney",
    "Rins": "Kidney",
    "Nefrit": "Nephritis",
    "Atrófico": "Atrophic",
    "Uremia": "Uremia",
    "Fígado": "Liver",
    "Hepat": "Liver",
    "Intestino": "Intestine",
    "Apendicite": "Appendicitis",
    "Prisão de Ventre": "Constipation",
    "Diarreia": "Diarrhea",
    "Piloro": "Pylorus",
    "Hemorroida": "Hemorrhoids",
    "Anal": "Hemorrhoids",
    "Útero": "Uterus",
    "Menstrua": "Menstruation",
    "Mulher": "Women",
    "Feminina": "Women",
    "Câncer": "Cancer",
    "Língua": "Tongue",
    "Esôfago": "Esophagus",
    "Insônia": "Insomnia",
    "Cerebral": "Brain",
    "Meningite": "Meningitis",
    "Derrame": "Stroke",
    "Apoplexia": "Apoplexy",
    "Gripe": "Cold",
    "Resfriado": "Cold",
    "Nerv": "Neuralgia",
    "Reumat": "Rheumatism",
    "Dor": "Pain",
    "Occipital": "Occipital",
    "Frontal": "Frontal",
    "Topo": "Vertex", # Cabeça (Topo)
    "Cervical": "Cervical",
    "Nuca": "Cervical", # Roughly
    "Pescoço": "Cervical",
    "Medula": "Medulla",
    "Parótida": "Parotid",
    "Inguinal": "Inguinal",
    "Virilha": "Inguinal",
    "Ombro": "Shoulder",
    "Mental": "Mental",
    "Epilepsia": "Epilepsy",
    "Gonorreia": "Gonorrhea",
    "Sífilis": "Syphilis",
    "Calvície": "Baldness",
    "Soluço": "Hiccough",
    "Enjoo": "SeaSickness",
    "Congelamento": "Frostbite",
    "Queimadura": "Burn",
    "Verruga": "Wart",
    "Calo": "Corn",
    "Pé de Atleta": "Athlete",
    "Suor Noturno": "NightSweat",
    "Xixi": "BedWetting",
    "Noturna": "BedWetting", # Enurese Noturna
    "Infertilidade": "Infertility",
    "Enjoo de Gravidez": "MorningSickness",
    "Leite": "Lactation",
    "Coqueluche": "WhoopingCough",
    "Sarampo": "Measles",
    "Catapora": "ChickenPox",
    "Hérnia": "Hernia"
}

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def find_best_match_jp_keywords(pt_title, jp_list):
    # 1. Identify Topics in PT Title
    topics = []
    pt_title_lower = pt_title.lower()
    
    # Priority check: Cancer
    if "câncer" in pt_title_lower or "tumor" in pt_title_lower:
        topics.append("Cancer")
        
    for pt_key, eng_key in PT_KEYWORD_MAP.items():
        if pt_key.lower() in pt_title_lower:
            if eng_key not in topics:
                topics.append(eng_key)
    
    if not topics:
        return None, None

    # 2. Score JP Items
    best_item = None
    best_score = 0
    
    for item in jp_list:
        title = item.get('title', '')
        content = item.get('content', '')
        score = 0
        
        # Check for ALL topics
        for topic in topics:
            jp_kws = KEYWORDS_JP.get(topic, [])
            match_found = False
            for kw in jp_kws:
                if kw in title:
                    score += 2 # Higher weight for title
                    match_found = True
                    break
            
            # If not in title, check content (lower weight)
            if not match_found:
                for kw in jp_kws:
                    if kw in content:
                        score += 1
                        match_found = True
                        break

        
        # Boost for exact matches or high coverage
        # If PT has 2 topics (Stomach, Cancer), JP must have both.
        if score > best_score:
            best_score = score
            best_item = item
        elif score == best_score and score > 0:
            # Tie breaker? 
            # Prefer shorter title? Or earlier order?
            # For now, stick with first occurrence.
            pass
            
    # Threshold
    # Must have some match
    if best_score > 0:
        return best_item['title'], best_item['content']

    return None, None

def main():
    print("Loading Files...")
    pt_contexto = load_json(PT_FILES["contexto"])
    pt_focais = load_json(PT_FILES["pontos_focais"])
    
    jp_kakuron = load_json(JP_FILES["kakuron"])
    jp_kakuron2 = load_json(JP_FILES["kakuron2"])
    jp_soron1 = load_json(JP_FILES["soron1"])

    # --- 1. Populate Contexto ---
    print("\nProcessing Contexto (Keyword Map)...")
    matched_count = 0
    for item in pt_contexto:
        pt_t = item.get('title', '')
        # Special logic used: search snippet in map
        target_jp_snippet = None
        for pt_snip, jp_snip in CONTEXTO_MAP.items():
            if pt_snip in pt_t:
                target_jp_snippet = jp_snip
                break
        
        if target_jp_snippet:
            # Find in JP List
            for jp_item in jp_soron1:
                if target_jp_snippet in jp_item['title']:
                    item['title_ja'] = jp_item['title']
                    item['content_ja'] = jp_item['content']
                    matched_count += 1
                    break
    print(f"  -> Matched {matched_count} items in Contexto.")

    # --- 2. Populate Pontos Focais ---
    print("\nProcessing Pontos Focais (Keyword Match)...")
    matched_count = 0
    for item in pt_focais:
        source = item.get('source', '')
        pt_t = item.get('title', '')
        
        target_list = []
        if "Estudos Específicos 01" in source:
            target_list = jp_kakuron
        elif "Estudos Específicos 02" in source:
            target_list = jp_kakuron2
        
        if target_list:
            t_ja, c_ja = find_best_match_jp_keywords(pt_t, target_list)
            if t_ja:
                item['title_ja'] = t_ja
                item['content_ja'] = c_ja
                matched_count += 1
            else:
                 # Clean up previous bad run
                if 'title_ja' in item:
                    del item['title_ja']
                if 'content_ja' in item:
                    del item['content_ja']

    print(f"  -> Matched {matched_count} items in Pontos Focais.")

    # --- Save ---
    print("\nSaving files...")
    save_json(PT_FILES["contexto"], pt_contexto)
    save_json(PT_FILES["pontos_focais"], pt_focais)
    print("Done.")

if __name__ == "__main__":
    main()
