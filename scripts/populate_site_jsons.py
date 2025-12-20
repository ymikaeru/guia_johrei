#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para popular os JSONs do site com conteúdo japonês dos JSONs de referência.
Adiciona campos title_ja e content_ja para criar interface de comparação bilíngue.
"""

import os
import json

# Diretórios
DATA_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"
REF_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data_reference"

# Mapeamento: arquivo do site -> arquivo de referência
SITE_TO_REF_MAPPING = {
    # Johrei volumes (já fragmentados no site, mas queremos adicionar JP)
    "johrei_vol01.json": "johrei_vol01_ref.json",
    "johrei_vol02.json": "johrei_vol02_ref.json",
    "johrei_vol03.json": "johrei_vol03_ref.json",
    "johrei_vol04.json": "johrei_vol04_ref.json",
    "johrei_vol05.json": "johrei_vol05_ref.json",
    "johrei_vol06.json": "johrei_vol06_ref.json",
    "johrei_vol07.json": "johrei_vol07_ref.json",
    "johrei_vol08.json": "johrei_vol08_ref.json",
    "johrei_vol09.json": "johrei_vol09_ref.json",
    "johrei_vol10.json": "johrei_vol10_ref.json",
    
    # Explicações
    "explicacoes_vol01.json": "explicacoes_vol01_ref.json",
    "explicacoes_vol02.json": "explicacoes_vol02_ref.json",
    "explicacoes_vol03.json": "explicacoes_vol03_ref.json",
    
    # Pontos Focais
    "pontos_focais_vol01.json": "pontos_focais_vol01_ref.json",
    "pontos_focais_vol02.json": "pontos_focais_vol02_ref.json",
}

def load_json(file_path):
    """Carrega um arquivo JSON."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"  ⚠️  Erro ao carregar {os.path.basename(file_path)}: {e}")
        return None

def save_json(data, file_path):
    """Salva dados em um arquivo JSON."""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"  ❌ Erro ao salvar {os.path.basename(file_path)}: {e}")
        return False

def parse_jp_sections(jp_content):
    """
    Parseia o conteúdo japonês completo em seções baseadas em headers.
    Retorna lista de dicts com {title, content}.
    """
    import re
    
    sections = []
    
    # Regex para capturar headers japoneses (similar ao merge_volumes.py)
    # Inclui: #, □, 【, **数字、, **（数字）, etc.
    header_pattern = r'(?m)^(?P<marker>#{1,6}|□|【|\*\*[0-9０-９]+[、．\.]|\*\*?[一二三四五六七八九十百]+[、．\.]|\*\*?[（\(][0-9０-９]+[）\)]|[0-9０-９]+[\)\.）])(?P<title>.*)$'
    
    matches = list(re.finditer(header_pattern, jp_content))
    
    if not matches:
        # Se não houver headers, retorna o conteúdo completo como uma seção
        return [{"title": "", "content": jp_content.strip()}]
    
    for i, match in enumerate(matches):
        marker = match.group('marker')
        title = match.group('title').strip()
        
        # Remove ** do título se existir
        if title.startswith('**'):
            title = title[2:]
        if title.endswith('**'):
            title = title[:-2]
        
        # Pega o conteúdo até o próximo header
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(jp_content)
        content = jp_content[start:end].strip()
        
        sections.append({
            "title": title,
            "content": content
        })
    
    return sections

def find_matching_jp_section(pt_title, pt_content, jp_sections):
    """
    Encontra a seção japonesa correspondente à seção portuguesa.
    Usa correspondência de título ou posição.
    """
    # Estratégia 1: Tentar encontrar por título similar
    # (isso seria mais complexo, então vamos usar posição por enquanto)
    
    # Estratégia 2: Usar a ordem das seções
    # Assumindo que as seções estão na mesma ordem
    return None  # Placeholder - implementaremos lógica mais sofisticada

def populate_site_json(site_file, ref_file):
    """
    Popula um JSON do site com conteúdo japonês do JSON de referência.
    """
    site_path = os.path.join(DATA_DIR, site_file)
    ref_path = os.path.join(REF_DIR, ref_file)
    
    # Verifica se os arquivos existem
    if not os.path.exists(site_path):
        print(f"  ⚠️  Arquivo do site não encontrado: {site_file}")
        return False
    if not os.path.exists(ref_path):
        print(f"  ⚠️  Arquivo de referência não encontrado: {ref_file}")
        return False
    
    # Carrega os JSONs
    site_data = load_json(site_path)
    ref_data = load_json(ref_path)
    
    if not site_data or not ref_data:
        return False
    
    # Pega o conteúdo japonês completo
    jp_content = ref_data.get('content', {}).get('japones', '')
    
    if not jp_content:
        print(f"  ⚠️  Conteúdo japonês vazio em {ref_file}")
        return False
    
    # Parseia as seções japonesas
    jp_sections = parse_jp_sections(jp_content)
    
    print(f"  📊 Site: {len(site_data)} seções PT | Referência: {len(jp_sections)} seções JP")
    
    # Estratégia simples: mapear por índice (assumindo mesma ordem)
    # Se o número de seções for diferente, precisaremos de lógica mais sofisticada
    updated_count = 0
    
    for i, item in enumerate(site_data):
        # Se já tem conteúdo japonês, pula
        if item.get('title_ja') or item.get('content_ja'):
            continue
        
        # Tenta mapear pela posição
        if i < len(jp_sections):
            jp_section = jp_sections[i]
            item['title_ja'] = jp_section['title']
            item['content_ja'] = jp_section['content']
            updated_count += 1
        else:
            # Se não houver seção JP correspondente, deixa vazio
            item['title_ja'] = ""
            item['content_ja'] = ""
    
    # Salva o JSON atualizado
    if save_json(site_data, site_path):
        print(f"  ✅ Atualizado: {updated_count}/{len(site_data)} itens com conteúdo japonês")
        return True
    
    return False

def main():
    print("🔄 Populando JSONs do site com conteúdo japonês...\n")
    
    success_count = 0
    total_count = len(SITE_TO_REF_MAPPING)
    
    for site_file, ref_file in SITE_TO_REF_MAPPING.items():
        print(f"📄 Processando: {site_file}")
        if populate_site_json(site_file, ref_file):
            success_count += 1
        print()
    
    print(f"\n✨ Concluído! {success_count}/{total_count} arquivos atualizados.")
    print(f"📂 JSONs atualizados em: {DATA_DIR}")

if __name__ == "__main__":
    main()
