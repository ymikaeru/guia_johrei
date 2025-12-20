#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para popular fundamentos_ptJp.json com textos originais japoneses
de 浄霊法講座_02.md, alinhando com os textos portugueses em fundamentos.json
"""

import json
import re

# Caminhos dos arquivos
PT_JSON = "/Users/michael/Documents/Ensinamentos/guia_johrei/data/fundamentos.json"
JA_MD = "/Users/michael/Documents/Ensinamentos/guia_johrei/Docx_Original/浄霊法講座_02.md"
OUTPUT_JSON = "/Users/michael/Documents/Ensinamentos/guia_johrei/data/fundamentos_ptJp.json"

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def load_japanese_md(path):
    """Carrega o arquivo markdown japonês"""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def extract_japanese_sections(md_content):
    """
    Extrai seções do markdown japonês baseado em títulos marcados com **título**
    Suporta tanto **título** quanto # **título**
    """
    sections = {}
    
    # Primeiro, vamos dividir o conteúdo por títulos (com ou sem #)
    # Padrão: captura # **título** ou **título** no início da linha
    title_pattern = r'^(?:#\s*)?\*\*(.+?)\*\*\s*$'
    
    lines = md_content.split('\n')
    current_title = None
    current_content = []
    
    for i, line in enumerate(lines):
        match = re.match(title_pattern, line)
        if match:
            # Salva a seção anterior se existir
            if current_title and current_content:
                # Remove linhas vazias do início e fim
                content_text = '\n'.join(current_content).strip()
                if content_text:
                    sections[current_title] = content_text
            
            # Inicia nova seção
            current_title = match.group(1).strip()
            current_content = []
        elif current_title:
            # Adiciona linha ao conteúdo da seção atual
            current_content.append(line)
    
    # Salva a última seção
    if current_title and current_content:
        content_text = '\n'.join(current_content).strip()
        if content_text:
            sections[current_title] = content_text
    
    # Também extrai o texto introdutório específico do Vol.02
    intro_match = re.search(r'浄霊法講座（二）\n\n(.+?)(?=\n(?:#\s*)?\*\*)', md_content, re.DOTALL)
    if intro_match:
        sections['浄霊法講座（二）_intro'] = intro_match.group(1).strip()
    
    return sections



def clean_start_text(text):
    """Remove prefixos comuns para encontrar o início real do conteúdo"""
    # Remove linhas vazias do início
    text = text.lstrip('\n')
    # Remove marcadores de seção se houver
    text = re.sub(r'^\(.+?\)\s*\n', '', text)
    return text

def find_matching_japanese(pt_title, pt_content, ja_sections):
    """
    Encontra a seção japonesa correspondente ao título/conteúdo português.
    Retorna uma tupla (título_japonês, conteúdo_japonês) ou (None, None).
    """
    # Mapeamento manual de títulos PT -> JA
    title_map = {
        # Vol.01 - Seções principais
        "O Que é a Doença": "一、病気とは何ぞや",
        "A Origem das Bactérias": "二、黴菌の発生",
        "A Verdade sobre a Saúde": "三、健康の真理",
        "O Ser Humano como Recipiente de Saúde": "四、人間は健康の器",
        "O Princípio do Johrei": "五、浄霊の原理",
        "A Ineficácia dos Medicamentos": "六、薬が効かなくなった",
        
        # Vol.02 - Introdução
        "Curso de Johrei (II)": "浄霊法講座（二）_intro",
        
        # Vol.02 - Seções principais
        "A Racionalidade do Johrei": "一、浄霊の合理性",
        "A Força Espiritual no Johrei": "二、浄霊の霊力について",
        "A Ordem do Johrei e os Pontos Vitais": "三、浄霊の順序と浄霊の急所",
        "O Processo de Acúmulo e Eliminação de Toxinas": "四、毒素集溜の経過と排泄の順序",
        "O Funcionamento Cerebral e as Toxinas": "五、頭の働きと薬毒について",
        "A Mulher e o Calor na Região Frontal": "六、婦人と前頭部の熱",
        "Intoxicação por Cosméticos": "七、化粧品中毒",
        "A Beleza Natural e o Ganho Triplo": "八、顔の自然美と一挙三得",
    }
    
    # Tenta encontrar pelo mapeamento de título
    if pt_title in title_map:
        ja_title = title_map[pt_title]
        if ja_title in ja_sections:
            # Remove o sufixo "_intro" se existir para o título de exibição
            display_title = ja_title.replace("_intro", "")
            return (display_title, ja_sections[ja_title])
    
    # Se não encontrar, retorna None, None
    return (None, None)

def main():
    print("Carregando arquivos...")
    pt_data = load_json(PT_JSON)
    ja_md_content = load_japanese_md(JA_MD)
    
    print("Extraindo seções japonesas...")
    ja_sections = extract_japanese_sections(ja_md_content)
    
    print(f"Encontradas {len(ja_sections)} seções japonesas")
    print("Seções disponíveis:")
    for title in sorted(ja_sections.keys()):
        content_preview = ja_sections[title][:50].replace('\n', ' ')
        print(f"  - {title}: {content_preview}...")
    
    # Cria a estrutura de saída
    output_data = []
    
    print("\nProcessando entradas portuguesas...")
    for pt_item in pt_data:
        pt_id = pt_item.get('id', '')
        pt_title = pt_item.get('title', '')
        pt_content = pt_item.get('content', '')
        pt_source = pt_item.get('source', '')
        
        # Só processa itens de "Johrei Hō Kōza Vol.01" e "Vol.02"
        if pt_source not in ["Johrei Hō Kōza Vol.01", "Johrei Hō Kōza Vol.02"]:
            continue
        
        print(f"\nProcessando: {pt_id} - {pt_title}")
        
        # Busca o título e conteúdo japonês correspondente
        ja_title, ja_content = find_matching_japanese(pt_title, pt_content, ja_sections)
        
        if ja_content:
            # Limpa o início do texto para garantir alinhamento
            ja_content_clean = clean_start_text(ja_content)
            pt_content_clean = clean_start_text(pt_content)
            
            # Cria o objeto combinado
            combined_item = {
                "id": pt_id,
                "title_pt": pt_title,
                "title_ja": ja_title if ja_title else "",
                "content_pt": pt_content_clean,
                "content_ja": ja_content_clean,
                "source": pt_source,
                "tags": pt_item.get('tags', []),
                "order": pt_item.get('order', 0)
            }
            
            output_data.append(combined_item)
            print(f"  ✓ Título: {ja_title}")
            print(f"  ✓ Conteúdo japonês encontrado ({len(ja_content_clean)} caracteres)")
        else:
            print(f"  ✗ Conteúdo japonês NÃO encontrado para '{pt_title}'")
    
    # Salva o resultado
    print(f"\nSalvando {len(output_data)} entradas em {OUTPUT_JSON}...")
    save_json(OUTPUT_JSON, output_data)
    print("✓ Concluído!")
    print(f"\nResumo:")
    print(f"  - Total de itens processados: {len(output_data)}")
    print(f"  - Arquivo salvo em: {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
