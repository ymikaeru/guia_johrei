import json
import re
import os
import glob
from collections import OrderedDict

# Files to ignore (we already processed pts focais, and want to avoid backups)
IGNORE_FILES = {
    'data/pontos_focais.json', 
    'data/pontos_focais.json.backup', 
    'data/index.json', 
    'data/curas.json.backup', 
    'data/fundamentos.json.backup'
}

# Master dictionary for Focus Points with correct casing
FIXED_CASING = {
    'estomago': 'Estômago', 'estômago': 'Estômago',
    'rins': 'Rins',
    'utero': 'Útero', 'útero': 'Útero',
    'cabeca': 'Cabeça', 'cabeça': 'Cabeça',
    'bulbo': 'Bulbo',
    'olhos': 'Olhos',
    'nariz': 'Nariz',
    'frontal': 'Frontal',
    'occipital': 'Occipital',
    'garganta': 'Garganta',
    'figado': 'Fígado', 'fígado': 'Fígado',
    'pele': 'Pele',
    'pernas': 'Pernas',
    'membros': 'Membros',
    'intestino': 'Intestino',
    'ovarios': 'Ovários', 'ovários': 'Ovários',
    'face': 'Face',
    'glandulas linfaticas': 'Glândulas Linfáticas', 'glândulas linfáticas': 'Glândulas Linfáticas',
    'glandula parotida': 'Glândula Parótida', 'glândula parótida': 'Glândula Parótida',
    'baixo ventre': 'Baixo Ventre',
    'ombros': 'Ombros',
    'pescoco': 'Pescoço', 'pescoço': 'Pescoço',
    'regiao renal': 'Região Renal', 'região renal': 'Região Renal',
    'bochechas': 'Bochechas',
    'maxilar': 'Maxilar',
    'ouvidos': 'Ouvidos',
    'diafragma': 'Diafragma',
    'virilha': 'Virilha',
    'pes': 'Pés', 'pés': 'Pés',
    'maos': 'Mãos', 'mãos': 'Mãos',
    'amigdalas': 'Amígdalas', 'amígdalas': 'Amígdalas',
    'pleura': 'Pleura',
    'peritonio': 'Peritônio', 'peritônio': 'Peritônio'
}

# Terms to search for (keys of the map above, plus some simple unaccented variants mapped to keys if needed, 
# but FIXED_CASING handles most input variants mapping to Output Value)
# actually we want to search for the keys in FIXED_CASING in the text.

def apply_points():
    data_files = glob.glob('data/*.json')
    total_updated_files = 0
    total_updated_items = 0

    for file_path in data_files:
        if file_path in IGNORE_FILES:
            continue
        
        # Determine if file path is likely a backup
        if file_path.endswith('.backup'): 
            continue

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content_raw = f.read()
                if not content_raw.strip(): continue
                data = json.loads(content_raw)
            
            # Helper to handle list or dict wrapper
            items = []
            is_dict_wrapper = False
            
            if isinstance(data, list):
                items = data
            elif isinstance(data, dict):
                is_dict_wrapper = True
                # Try to find the list. usually strictly list files, but just in case.
                # If the structure is unknown, we skip dicts for safety unless we know the key.
                # Assuming standard format is list of objects.
                # If it's a dict like index.json, we might skip.
                print(f"Skipping {file_path} (root is dict).")
                continue
            
            file_updated = False
            
            for item in items:
                if not isinstance(item, dict):
                    continue
                
                # Check text content
                title = item.get('title', '') or item.get('title_pt', '') or item.get('tituloconteudo', '')
                content = item.get('content', '') or item.get('content_pt', '') or item.get('conteudo', '')
                full_text = (title + " " + content).lower()
                
                # Find points
                found_points = set(item.get('focusPoints', []))
                
                for search_term, canonical_form in FIXED_CASING.items():
                    # Check for whole word match
                    # Escape search term for regex
                    escaped_term = re.escape(search_term)
                    # Pattern: word boundary + term + word boundary
                    if re.search(r'\b' + escaped_term + r'\b', full_text):
                        found_points.add(canonical_form)
                
                # Convert back to sorted list
                new_points_list = sorted(list(found_points))
                
                # Update if changed
                if new_points_list != sorted(item.get('focusPoints', [])):
                    item['focusPoints'] = new_points_list
                    file_updated = True
                    total_updated_items += 1
            
            if file_updated:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"Updated {file_path}")
                total_updated_files += 1

        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    print(f"\nProcessing Complete.")
    print(f"Updated {total_updated_files} files.")
    print(f"Updated {total_updated_items} items total.")

if __name__ == "__main__":
    apply_points()
