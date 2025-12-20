#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para segmentar conteúdo japonês em múltiplos cards,
seguindo a estrutura do português que foi fragmentado.
"""

import json
import os
import re

DATA_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/data"

def find_japanese_sections(text):
    """
    Encontra marcadores de seção no texto japonês.
    Retorna lista de (posição, marcador, tipo)
    """
    markers = []
    
    # Marcadores comuns:
    # **１、 **２、 etc.
    pattern1 = re.compile(r'\*\*([１-９0-9一二三四五六七八九十]+)、')
    for match in pattern1.finditer(text):
        markers.append((match.start(), match.group(0), 'numbered'))
    
    # （イ）（ロ）（ハ）etc.
    pattern2 = re.compile(r'[（\(]([イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノオクヤマケフコエテアサキユメミシヱヒモセス]+)[）\)]')
    for match in pattern2.finditer(text):
        markers.append((match.start(), match.group(0), 'kana'))
    
    # （註 ou (註
    pattern3 = re.compile(r'[（\(]註[^）\)]+[）\)]')
    for match in pattern3.finditer(text):
        markers.append((match.start(), match.group(0), 'note'))
    
    # Ordenar por posição
    markers.sort(key=lambda x: x[0])
    
    return markers

def segment_japanese_content(ja_content):
    """
    Segmenta conteúdo japonês baseado em marcadores.
    Retorna lista de segmentos.
    """
    if not ja_content or len(ja_content.strip()) == 0:
        return []
    
    markers = find_japanese_sections(ja_content)
    
    if len(markers) == 0:
        # Sem marcadores, retorna o texto inteiro
        return [ja_content.strip()]
    
    segments = []
    
    for i, (pos, marker, mtype) in enumerate(markers):
        if i == 0 and pos > 0:
            # Há conteúdo antes do primeiro marcador
            segments.append(ja_content[:pos].strip())
        
        # Conteúdo deste marcador até o próximo
        start = pos
        end = markers[i+1][0] if i+1 < len(markers) else len(ja_content)
        
        segment = ja_content[start:end].strip()
        if segment:
            segments.append(segment)
    
    return segments

def analyze_and_segment_volume(json_file):
    """
    Analisa um volume e sugere segmentações.
    """
    filepath = os.path.join(DATA_DIR, json_file)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"\n{'='*80}")
    print(f"ANALISANDO: {json_file}")
    print(f"{'='*80}\n")
    
    for item in data:
        item_id = item.get('id')
        title_pt = item.get('title_pt', '')[:60]
        ja_content = item.get('content_ja', '')
        
        if not ja_content or len(ja_content.strip()) < 100:
            continue
        
        segments = segment_japanese_content(ja_content)
        
        if len(segments) > 1:
            print(f"📦 {item_id}: {title_pt}")
            print(f"   Conteúdo japonês pode ser dividido em {len(segments)} segmentos:")
            
            for i, seg in enumerate(segments[:5], 1):  # Mostrar primeiros 5
                preview = seg[:80].replace('\n', ' ')
                print(f"   {i}. {preview}...")
            
            if len(segments) > 5:
                print(f"   ... e mais {len(segments) - 5} segmentos")
            print()

def main():
    volumes = [
        'johrei_vol01.json',
        'johrei_vol02.json', 
        'johrei_vol03.json',
        'johrei_vol04.json',
        'johrei_vol05.json',
    ]
    
    for vol in volumes:
        if os.path.exists(os.path.join(DATA_DIR, vol)):
            analyze_and_segment_volume(vol)

if __name__ == "__main__":
    main()
