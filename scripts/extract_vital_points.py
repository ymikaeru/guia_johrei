#!/usr/bin/env python3
"""
Extract Vital Points and Focal Points from Bilingual JSONs
Analyzes all content to create a comprehensive anatomical reference.
"""

import json
import os
from pathlib import Path
from collections import defaultdict
import re

# Anatomical terms dictionary with Portuguese and Japanese variants
ANATOMICAL_TERMS = {
    # Cabeça e Pescoço
    'cabeça': ['cabeça', 'crânio', '頭'],
    'topo_da_cabeça': ['topo da cabeça', 'alto da cabeça', 'nōten', '脳天'],
    'centro_da_cabeça': ['centro da cabeça', 'centro do cérebro'],
    'cérebro': ['cérebro', 'brain', '脳'],
    'lobo_frontal': ['lobo frontal', 'frontal', 'região frontal', 'testa', 'fronte', '前頭部'],
    'região_occipital': ['região occipital', 'occipital', '後頭部'],
    'bulbo_raquidiano': ['bulbo raquidiano', 'bulbo', 'enzui', '延髄'],
    'nuca': ['nuca', 'região cervical posterior'],
    'pescoço': ['pescoço', 'cervical', '頸', '首'],
    'glândulas_linfáticas': ['glândula linfática', 'glândulas linfáticas', 'linfática cervical', '淋巴腺'],
    'glândula_parótida': ['glândula parótida', 'parótida', '耳下腺'],
    'olhos': ['olho', 'olhos', 'ocular', 'globo ocular', '眼', '目'],
    'sobrancelhas': ['sobrancelha', 'sobrancelhas', 'parte superior dos olhos'],
    'ouvidos': ['ouvido', 'ouvidos', 'orelha', '耳'],
    'nariz': ['nariz', 'nasal', 'ponte nasal', 'lados do nariz', '鼻'],
    'boca': ['boca', 'bucal', 'oral', 'cavidade bucal', '口'],
    'garganta': ['garganta', 'laringe', 'faringe', 'arredores da garganta', '咽喉', '喉'],
    'língua': ['língua', 'lingual', '舌'],
    'dentes': ['dente', 'dentes', 'dental', '歯'],
    'gengiva': ['gengiva', 'gengivas', '歯茎'],
    'amígdalas': ['amígdala', 'amígdalas', '扁桃腺'],
    'têmporas': ['têmpora', 'têmporas', 'temporal', 'こめかみ'],
    
    # Tórax e Abdômen
    'tórax': ['tórax', 'peito', 'torácico', '胸'],
    'coração': ['coração', 'cardíaco', 'região cardíaca', '心臓'],
    'pulmões': ['pulmão', 'pulmões', 'pulmonar', '肺'],
    'brônquios': ['brônquio', 'brônquios', 'bronquial', '気管支'],
    'estômago': ['estômago', 'gástrico', 'região gástrica', '胃'],
    'esôfago': ['esôfago', 'esofágico'],
    'abdômen': ['abdômen', 'abdominal', 'barriga'],
    'baixo_ventre': ['baixo ventre', 'baixo abdômen', '下腹部'],
    'diafragma': ['diafragma', '横隔膜'],
    'fígado': ['fígado', 'hepático', '肝臓'],
    'vesícula': ['vesícula', 'vesícula biliar', '胆嚢'],
    'pâncreas': ['pâncreas', 'pancreático', '膵臓'],
    'baço': ['baço', 'esplênico'],
    'intestinos': ['intestino', 'intestinos', 'intestinal', '腸'],
    
    # Costas e Coluna
    'costas': ['costas', 'dorsal', 'região dorsal', '背中'],
    'coluna': ['coluna', 'coluna vertebral', 'espinha', 'vertebral'],
    'omoplatas': ['omoplata', 'omoplatas', 'escápula', 'entre as omoplatas'],
    'região_lombar': ['região lombar', 'lombar', 'cintura', '腰'],
    'cóccix': ['cóccix', 'sacro', 'coccígeo', '尾底骨'],
    
    # Membros Superiores
    'ombros': ['ombro', 'ombros', '肩'],
    'braços': ['braço', 'braços', 'raiz do braço'],
    'axilas': ['axila', 'axilas', 'axilares'],
    'cotovelos': ['cotovelo', 'cotovelos'],
    'punhos': ['punho', 'punhos'],
    'mãos': ['mão', 'mãos', '手'],
    'dedos_mão': ['dedo', 'dedos', 'polegar'],
    
    # Membros Inferiores  
    'virilha': ['virilha', 'região inguinal', 'inguinal'],
    'glúteos': ['glúteo', 'glúteos', 'nádegas'],
    'quadris': ['quadril', 'quadris', 'coxas'],
    'pernas': ['perna', 'pernas', '脚'],
    'joelhos': ['joelho', 'joelhos'],
    'tornozelos': ['tornozelo', 'tornozelos'],
    'pés': ['pé', 'pés', '足'],
    'coxas': ['coxa', 'coxas', 'lateral da coxa', '腿'],
    
    # Órgãos Internos
    'rins': ['rim', 'rins', 'renal', 'região renal', '腎臓'],
    'bexiga': ['bexiga', 'vesical', '膀胱'],
    'útero': ['útero', 'uterino', 'costas do útero'],
    'região_genital': ['região genital', 'genital', 'púbis', 'anogenital', '陰部'],
    'ânus': ['ânus', 'anal', 'reto'],
    'próstata': ['próstata', 'prostático'],
    
    # Sistemas e Estruturas
    'sistema_nervoso': ['sistema nervoso', 'nervoso', 'nervo', '神経'],
    'vasos_sanguíneos': ['vaso sanguíneo', 'artéria', 'veia', 'vascular', '血管'],
    'músculos': ['músculo', 'músculos', 'muscular'],
    'ossos': ['osso', 'ossos', 'ósseo', 'esqueleto'],
    'pele': ['pele', 'cutâneo', 'derme', '皮膚'],
}

def extract_anatomical_mentions(text):
    """Extract all anatomical terms mentioned in text."""
    text_lower = text.lower()
    mentions = set()
    
    for term_key, variants in ANATOMICAL_TERMS.items():
        for variant in variants:
            if variant.lower() in text_lower:
                mentions.add(term_key)
                break
    
    return mentions

def analyze_all_jsons(data_dir):
    """Analyze all JSON files and extract anatomical mentions."""
    json_files = sorted(Path(data_dir).glob("*_bilingual.json"))
    
    # Track mentions with examples
    term_mentions = defaultdict(lambda: {'count': 0, 'examples': []})
    
    for json_file in json_files:
        print(f"Analyzing: {json_file.name}")
        
        with open(json_file, 'r', encoding='utf-8') as f:
            items = json.load(f)
        
        for item in items:
            combined_text = f"{item.get('title_pt', '')} {item.get('content_pt', '')} {item.get('title_jp', '')} {item.get('content_jp', '')}"
            
            mentions = extract_anatomical_mentions(combined_text)
            
            for term in mentions:
                term_mentions[term]['count'] += 1
                if len(term_mentions[term]['examples']) < 3:
                    term_mentions[term]['examples'].append({
                        'id': item['id'],
                        'title': item.get('title_pt', item.get('title_jp', ''))[:80]
                    })
    
    return term_mentions

def generate_markdown_report(term_mentions, output_file):
    """Generate a structured markdown report of vital points."""
    
    # Organize by body region
    regions = {
        '🧠 Cabeça e Pescoço': [
            'topo_da_cabeça', 'cabeça', 'centro_da_cabeça', 'cérebro', 'lobo_frontal',
            'região_occipital', 'bulbo_raquidiano', 'nuca', 'pescoço',
            'glândulas_linfáticas', 'glândula_parótida', 'olhos', 'sobrancelhas',
            'ouvidos', 'nariz', 'boca', 'garganta', 'língua', 'dentes', 'gengiva',
            'amígdalas', 'têmporas'
        ],
        '🫁 Tórax e Abdômen': [
            'tórax', 'coração', 'pulmões', 'brônquios', 'estômago', 'esôfago',
            'abdômen', 'baixo_ventre', 'diafragma', 'fígado', 'vesícula',
            'pâncreas', 'baço', 'intestinos'
        ],
        '🦴 Costas e Coluna': [
            'costas', 'coluna', 'omoplatas', 'região_lombar', 'cóccix'
        ],
        '💪 Membros': [
            'ombros', 'braços', 'axilas', 'cotovelos', 'punhos', 'mãos', 'dedos_mão',
            'virilha', 'glúteos', 'quadris', 'pernas', 'joelhos', 'tornozelos',
            'pés', 'coxas'
        ],
        '🫘 Órgãos Internos': [
            'rins', 'bexiga', 'útero', 'região_genital', 'ânus', 'próstata'
        ],
        '🔬 Sistemas e Estruturas': [
            'sistema_nervoso', 'vasos_sanguíneos', 'músculos', 'ossos', 'pele'
        ]
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Pontos Vitais e Pontos Focais - Anatomia do Johrei\n\n")
        f.write("Lista completa de partes do corpo, órgãos e pontos vitais mencionados nos 637 itens bilíngues.\n\n")
        f.write("---\n\n")
        
        total_terms = 0
        total_mentions = 0
        
        for region_name, terms in regions.items():
            f.write(f"## {region_name}\n\n")
            
            region_terms = []
            for term in terms:
                if term in term_mentions and term_mentions[term]['count'] > 0:
                    region_terms.append((term, term_mentions[term]))
            
            # Sort by frequency
            region_terms.sort(key=lambda x: x[1]['count'], reverse=True)
            
            for term, data in region_terms:
                term_display = term.replace('_', ' ').title()
                count = data['count']
                
                f.write(f"### {term_display}\n")
                f.write(f"- **Frequência**: {count} menções\n")
                
                if data['examples']:
                    f.write(f"- **Exemplos**:\n")
                    for ex in data['examples'][:3]:
                        f.write(f"  - `{ex['id']}`: {ex['title']}\n")
                
                f.write("\n")
                
                total_terms += 1
                total_mentions += count
            
            f.write("---\n\n")
        
        # Summary
        f.write("## Resumo\n\n")
        f.write(f"- **Total de termos anatômicos identificados**: {total_terms}\n")
        f.write(f"- **Total de menções**: {total_mentions}\n")
        f.write(f"- **Média de menções por termo**: {total_mentions/total_terms if total_terms > 0 else 0:.1f}\n")

def main():
    base_dir = Path(__file__).parent.parent / "data"
    artifacts_dir = Path("/Users/michael/.gemini/antigravity/brain/bc6b8bb0-b346-4a5f-a6b9-902dc5b3b1dd")
    output_file = artifacts_dir / "pontos_vitais_anatomia.md"
    
    print("=" * 60)
    print("Extracting Vital Points and Focal Points")
    print("=" * 60)
    
    term_mentions = analyze_all_jsons(base_dir)
    
    print(f"\nGenerating report...")
    generate_markdown_report(term_mentions, output_file)
    
    print(f"\n✓ Report saved to: {output_file}")
    print("=" * 60)

if __name__ == "__main__":
    main()
