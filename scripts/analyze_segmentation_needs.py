#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para ajudar a segmentar conteúdo japonês baseado na estrutura do português.
Identifica seções japonesas e sugere pontos de corte.
"""

import json
import os
import re

DATA_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"

def analyze_item(item):
    """Analisa um item e sugere segmentação"""
    pt_content = item.get('content_pt', '')
    ja_content = item.get('content_ja', '')
    
    # Conta seções marcadas com **(A)**, **(B)**, **(1)**, etc.
    pt_markers = re.findall(r'\*\*\([A-Z0-9]+\)', pt_content)
    ja_markers = re.findall(r'[（\(][イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノオクヤマケフコエテアサキユメミシヱヒモセス1234567890一二三四五六七八九十]+[）\)]', ja_content)
    
    pt_para_count = len([p for p in pt_content.split('\n\n') if p.strip()])
    ja_para_count = len([p for p in ja_content.split('\n\n') if p.strip()])
    
    # Detecta marcadores de sub-seções no japonês
    ja_numbers = re.findall(r'^[**]*[１-９一-十0-9]+、', ja_content, re.MULTILINE)
    
    return {
        'id': item.get('id'),
        'title_pt': item.get('title_pt', '')[:60],
        'pt_markers': pt_markers,
        'ja_markers': ja_markers,
        'pt_paras': pt_para_count,
        'ja_paras': ja_para_count,
        'ja_subsections': ja_numbers,
        'needs_segmentation': (pt_para_count > 1 and ja_para_count == 1 and len(ja_content) > 500)
    }

def main():
    json_file = 'johrei_vol04.json'
    filepath = os.path.join(DATA_DIR, json_file)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print("=" * 80)
    print(f"ANÁLISE DE SEGMENTAÇÃO: {json_file}")
    print("=" * 80)
    
    for item in data:
        analysis = analyze_item(item)
        
        if analysis['needs_segmentation']:
            print(f"\n🔴 {analysis['id']}: {analysis['title_pt']}")
            print(f"   PT: {analysis['pt_paras']} parágrafos | JP: {analysis['ja_paras']} parágrafos")
            print(f"   PT Marcadores: {analysis['pt_markers']}")
            print(f"   JP Marcadores: {analysis['ja_markers'][:5]}...")  # Primeiros 5
            print(f"   JP Subseções numeradas: {len(analysis['ja_subsections'])} encontradas")
            print(f"   ⚠️ PRECISA SEGMENTAÇÃO!")
        elif analysis['pt_paras'] != analysis['ja_paras'] and analysis['pt_paras'] > 0:
            print(f"\n🟡 {analysis['id']}: {analysis['title_pt']}")
            print(f"   PT: {analysis['pt_paras']} §  | JP: {analysis['ja_paras']} §")

if __name__ == "__main__":
    main()
