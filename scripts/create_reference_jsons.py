#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para criar JSONs de referência bilíngues (PT-JP) sem fragmentação.
Cada JSON contém o texto completo de um par de arquivos MD.
"""

import os
import json
import glob

# Diretórios
BASE_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/Docx_Original"
PT_DIR = os.path.join(BASE_DIR, "MD_Portugues")
JP_DIR = os.path.join(BASE_DIR, "MD_Original")
OUTPUT_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data_reference"

# Mapeamentos de arquivos PT -> JP
FILE_MAPPINGS = {
    # Curso de Johrei
    "- 浄霊法講座 01 (Curso de Johrei).md": "浄霊法講座（一）.md",
    "- 浄霊法講座 02 (Curso de Johrei).md": "浄霊法講座（二）.md",
    "- 浄霊法講座 03 (Curso de Johrei).md": "浄霊法講座（三）.md",
    "- 浄霊法講座 04 (Curso de Johrei).md": "浄霊法講座（四）（薬理批判）.md",
    "- 浄霊法講座 05 (Curso de Johrei).md": "浄霊法講座（五）（結核・喘息・心臓関係の症状について）.md",
    "- 浄霊法講座 06 (Curso de Johrei).md": "浄霊法講座（六）（薬毒病について）.md",
    "- 浄霊法講座 07 (Curso de Johrei).md": "浄霊法講座（七）（婦　人　病）.md",
    "- 浄霊法講座 08 (Curso de Johrei).md": "浄霊法講座（八）（胃・腸疾患）.md",
    "- 浄霊法講座 09 (Curso de Johrei).md": "浄霊法講座（九）（頭　部）.md",
    "- 浄霊法講座 10 (Curso de Johrei).md": "浄霊法講座（十）.md",
    
    # Explicações
    "Explicação Ensinamentos 01.md": "総論１.md",
    "Explicação Ensinamentos 02.md": "総論２.md",
    "Explicação Ensinamentos 03.md": "総論３.md",
    
    # Pontos Focais
    "Pontos Focais do Johrei 01.md": "各論.md",
    "Pontos Focais do Johrei 02.md": "各論２.md",
}

def read_file_content(file_path):
    """Lê o conteúdo completo de um arquivo MD."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except Exception as e:
        print(f"  ⚠️  Erro ao ler {os.path.basename(file_path)}: {e}")
        return ""

def create_reference_json(pt_filename, jp_filename, output_name):
    """Cria um JSON de referência bilíngue sem fragmentação."""
    pt_path = os.path.join(PT_DIR, pt_filename)
    jp_path = os.path.join(JP_DIR, jp_filename)
    
    # Verifica se os arquivos existem
    if not os.path.exists(pt_path):
        print(f"  ❌ Arquivo PT não encontrado: {pt_filename}")
        return False
    if not os.path.exists(jp_path):
        print(f"  ❌ Arquivo JP não encontrado: {jp_filename}")
        return False
    
    # Lê o conteúdo completo
    pt_content = read_file_content(pt_path)
    jp_content = read_file_content(jp_path)
    
    # Cria o JSON de referência
    reference_data = {
        "metadata": {
            "pt_file": pt_filename,
            "jp_file": jp_filename,
            "description": "JSON de referência bilíngue - conteúdo completo sem fragmentação"
        },
        "content": {
            "portugues": pt_content,
            "japones": jp_content
        },
        "stats": {
            "pt_chars": len(pt_content),
            "jp_chars": len(jp_content),
            "pt_lines": pt_content.count('\n') + 1 if pt_content else 0,
            "jp_lines": jp_content.count('\n') + 1 if jp_content else 0
        }
    }
    
    # Salva o JSON
    output_path = os.path.join(OUTPUT_DIR, f"{output_name}.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(reference_data, f, ensure_ascii=False, indent=2)
    
    print(f"  ✅ Criado: {output_name}.json")
    print(f"     PT: {reference_data['stats']['pt_chars']} chars, {reference_data['stats']['pt_lines']} linhas")
    print(f"     JP: {reference_data['stats']['jp_chars']} chars, {reference_data['stats']['jp_lines']} linhas")
    
    return True

def main():
    # Cria o diretório de saída
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"📁 Criado diretório: {OUTPUT_DIR}\n")
    
    print("🔄 Gerando JSONs de referência bilíngues...\n")
    
    # Processa cada par de arquivos
    success_count = 0
    for pt_file, jp_file in FILE_MAPPINGS.items():
        # Gera nome de saída baseado no arquivo PT
        if "Curso de Johrei" in pt_file:
            vol_num = pt_file.split()[2]
            output_name = f"johrei_vol{vol_num.zfill(2)}_ref"
        elif "Explicação" in pt_file:
            vol_num = pt_file.split()[-1].replace('.md', '')
            output_name = f"explicacoes_vol{vol_num.zfill(2)}_ref"
        elif "Pontos Focais" in pt_file:
            vol_num = pt_file.split()[-1].replace('.md', '')
            output_name = f"pontos_focais_vol{vol_num.zfill(2)}_ref"
        else:
            output_name = pt_file.replace('.md', '_ref')
        
        print(f"📄 Processando: {pt_file}")
        if create_reference_json(pt_file, jp_file, output_name):
            success_count += 1
        print()
    
    print(f"\n✨ Concluído! {success_count}/{len(FILE_MAPPINGS)} JSONs de referência criados.")
    print(f"📂 Salvos em: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
