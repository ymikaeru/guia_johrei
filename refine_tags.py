import json
import os

files_to_update = ['data/curas.json', 'data/fundamentos.json']

# Tag Mapping Dictionary
# Format: "New Tag": ["keyword1", "keyword2", ...]
TAG_MAP = {
    "Gravidez e Saúde da Mulher": ["gravidez", "grávida", "parto", "aborto", "feto", "natimorto", "menstruação", "útero", "ovário", "trompas", "seios", "mama", "amamentação", "leite materno"],
    "Rins e Sistema Urinário": ["rim", "rins", "urina", "urinária", "bexiga", "nefrite"],
    "Sistema Digestivo": ["estômago", "digestão", "digestivo", "fígado", "intestino", "barriga", "abdômen", "peritônio", "apendicite", "gastrite", "úlcer", "diarreia", "prisão de ventre"],
    "Olhos e Visão": ["olho", "olhos", "visão", "cegueira", "cego", "catarata", "glaucoma", "miopia", "astigmatismo", "tracoma"],
    "Ouvidos e Audição": ["ouvido", "ouvidos", "audição", "surdez", "surdo", "otite", "tímpano", "zumbido"],
    "Gripe e Resfriado": ["gripe", "resfriado", "febre", "tosse", "catarro", "pneumonia", "bronquite", "asma", "coriza"],
    "Tuberculose": ["tuberculose", "pleurisia", "tísico"],
    "Câncer": ["câncer", "tumor", "carcinoma", "sarcoma"],
    "Coração e Circulação": ["coração", "cardíaco", "sangue", "circulação", "pressão alta", "hipertensão", "derrame", "arteriosclerose"],
    "Pele": ["pele", "eczema", "coceira", "sarna", "ferida", "furúnculo", "inchaço", "pus", "varíola", "sarampo"],
    "Dentes e Boca": ["dente", "dentário", "piorreia", "gengiva", "boca", "cárie"],
    "Mundo Espiritual": ["espírito", "espiritual", "encosto", "antepassado", "reencarnação", "carma", "pecado", "milagre", "Deus", "Satanás"],
    "Agricultura e Alimentação": ["agricultura", "solo", "adubo", "alimento", "nutrição", "carne", "peixe", "vegetariano", "arroz", "trigo"],
    "Arte e Beleza": ["arte", "belo", "beleza", "estética"],
    "Toxinas e Medicamentos": ["remédio", "medicamento", "vacina", "soro", "injeção", "droga", "penicilina", "toxina", "veneno"]
}

def normalize_text(text):
    return text.lower()

for file_path in files_to_update:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue

    with open(file_path, 'r') as f:
        data = json.load(f)

    updated_count = 0
    for item in data:
        content = normalize_text(item.get('content', ''))
        title = normalize_text(item.get('title', ''))
        full_text = f"{title} {content}"
        
        current_tags = item.get('tags', [])
        original_tags_count = len(current_tags)
        
        for new_tag, keywords in TAG_MAP.items():
            # Check if any keyword is in the text
            if any(keyword in full_text for keyword in keywords):
                if new_tag not in current_tags:
                    current_tags.append(new_tag)
        
        # Clean up tags: remove duplicates and sort
        item['tags'] = sorted(list(set(current_tags)))
        
        if len(item['tags']) != original_tags_count:
            updated_count += 1

    if updated_count > 0:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated {updated_count} items in {file_path}")
    else:
        print(f"No items needed update in {file_path}")
