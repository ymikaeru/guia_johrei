#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para analisar alinhamento de parágrafos entre PT e JP nos JSONs.
Identifica seções com alinhamento perfeito vs. desalinhamento.
"""

import json
import os

DATA_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"

def count_paragraphs(text):
    """Conta parágrafos (separados por \n\n)"""
    if not text or not text.strip():
        return 0
    return len([p for p in text.split('\n\n') if p.strip()])

def analyze_alignment(json_file):
    """Analisa alinhamento de um arquivo JSON"""
    filepath = os.path.join(DATA_DIR, json_file)
    
    if not os.path.exists(filepath):
        return None
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    total = len(data)
    aligned = 0
    misaligned = []
    
    for item in data:
        pt_content = item.get('content_pt', '')
        ja_content = item.get('content_ja', '')
        
        pt_paras = count_paragraphs(pt_content)
        ja_paras = count_paragraphs(ja_content)
        
        if pt_paras == ja_paras and pt_paras > 0:
            aligned += 1
        elif pt_paras > 0 or ja_paras > 0:  # Pelo menos um tem conteúdo
            misaligned.append({
                'id': item.get('id'),
                'title_pt': item.get('title_pt', '')[:50],
                'pt_paras': pt_paras,
                'ja_paras': ja_paras,
                'diff': abs(pt_paras - ja_paras)
            })
    
    return {
        'file': json_file,
        'total': total,
        'aligned': aligned,
        'misaligned': len(misaligned),
        'alignment_rate': (aligned / total * 100) if total > 0 else 0,
        'worst_cases': sorted(misaligned, key=lambda x: x['diff'], reverse=True)[:5]
    }

def main():
    json_files = [
        'johrei_vol01.json',
        'johrei_vol02.json',
        'johrei_vol03.json',
        'johrei_vol04.json',
        'johrei_vol05.json',
        'johrei_vol06.json',
        'johrei_vol07.json',
        'johrei_vol08.json',
        'johrei_vol09.json',
        'johrei_vol10.json',
    ]
    
    print("=" * 80)
    print("ANÁLISE DE ALINHAMENTO PT-JP")
    print("=" * 80)
    
    for json_file in json_files:
        result = analyze_alignment(json_file)
        
        if not result:
            continue
        
        print(f"\n📁 {result['file']}")
        print(f"   Total de itens: {result['total']}")
        print(f"   Alinhados: {result['aligned']} ({result['alignment_rate']:.1f}%)")
        print(f"   Desalinhados: {result['misaligned']}")
        
        if result['worst_cases']:
            print(f"\n   Piores casos:")
            for case in result['worst_cases']:
                print(f"   - [{case['id']}] {case['title_pt']}")
                print(f"     PT: {case['pt_paras']} parágrafos | JP: {case['ja_paras']} parágrafos (diff: {case['diff']})")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()
