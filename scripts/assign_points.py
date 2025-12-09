import json

files = ['data/pontos_focais.json', 'data/fundamentos.json']

# Mapping Title to Focus Point IDs
point_map = {
    # Doenças Infantis
    "Indigestão (Dispepsia)": ["estomago"],
    "Desenvolvimento Deficiente": ["vertice", "frontal"], 
    "Úlcera Gástrica Infantil": ["estomago"],
    "Coqueluche": ["pulmoes", "garganta"],
    "Meningite": ["frontal", "vertice", "pescoco"],
    "Choro Noturno (Manha)": ["frontal", "ombros"],
    "Escarlatina": ["rins", "garganta"], 
    "Disenteria Infantil (Ekiri)": ["estomago", "frontal", "occipital"], 
    "Paralisia Infantil (Poliomielite)": ["membros", "rins", "pernas"],
    "Sarampo": ["pulmoes", "pele"], 
    "Asma Infantil": ["pulmoes", "diafragma", "rins"],
    "Pneumonia Infantil": ["pulmoes"],
    "Hérnia (Deslocamento do Intestino)": ["inguinal", "intestino", "baixo-ventre"],
    "Difteria": ["garganta"],
    
    # Outras Doenças
    "Sarna e Doenças de Pele": ["membros", "rins", "pele"],
    "Beribéri": ["membros", "rins"],
    "Nevralgia": ["torax", "bracos", "regiao_omoplatas"],
    "Reumatismo": ["membros", "rins"],
    "Enurese Noturna (Xixi na Cama)": ["rins", "baixo-ventre", "frontal"],
    "Ronco": ["nariz", "garganta"],
    
    # Fundamentos / Estudos Específicos 2
    "Apendicite": ["inguinal", "intestino", "rins", "coccix"],
    "Intoxicação por Cosméticos": ["pele", "rosto", "dentes"],
    "Diabetes": ["pancreas", "ombros", "rins"],
    "Tuberculose Intestinal": ["intestino", "pescoco", "ombros"],
    "Febre Tifoide": ["intestino", "estomago", "occipital"],
    "Câncer Retal": ["anus", "intestino"],
    "Fístula Anal": ["anus"],
    "Prurido Anal": ["anus"],
    "Prolapso Retal": ["anus"],
    "Frigidez": ["utero", "baixo-ventre"],
    "Enjoos Matinais (Hiperêmese Gravídica)": ["estomago", "utero", "rins"]
}

total_count = 0

for file_path in files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        count = 0
        for item in data:
            if item['title'] in point_map:
                item['focusPoints'] = point_map[item['title']]
                count += 1
                try:
                    print(f"Assigned points to: {item['title']} -> {item['focusPoints']}")
                except:
                    pass
        
        if count > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"Updated {count} items in {file_path}")
            total_count += count
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

print(f"Total updated: {total_count}")
