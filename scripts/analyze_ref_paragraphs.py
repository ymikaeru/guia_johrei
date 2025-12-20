import json
import re

def parse_markdown_structure(text, lang='pt'):
    lines = text.split('\n')
    sections = []
    
    current_h2 = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if lang == 'pt':
            if line.startswith('## '):
                # H2 Header
                current_h2 = line.strip('# ').strip()
            elif line.startswith('### '):
                # H3 Header (Item)
                title = line.strip('# ').strip()
                sections.append({'type': 'h3', 'title': title, 'content': []})
            else:
                if sections:
                    sections[-1]['content'].append(line)
                    
        elif lang == 'ja':
            if line.startswith('# **') or line.startswith('## '):
                 clean_line = re.sub(r'[*#]', '', line).strip()
            elif line.startswith('**（') or line.startswith('**('):
                 clean_line = re.sub(r'[*]', '', line).strip()
                 sections.append({'type': 'h3', 'title': clean_line, 'content': []})
            else:
                if sections:
                     sections[-1]['content'].append(line)

    return sections

def analyze_ref_paragraphs():
    with open('data_reference/johrei_vol10_ref.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    pt_content = data['content']['portugues']
    ja_content = data['content']['japones']
    
    pt_sections = parse_markdown_structure(pt_content, 'pt')
    ja_sections = parse_markdown_structure(ja_content, 'ja')
    
    # Filter only items (H3)
    pt_items = [s for s in pt_sections if s['type'] == 'h3']
    ja_items = [s for s in ja_sections if s['type'] == 'h3']
    
    print(f"Items found - PT: {len(pt_items)}, JA: {len(ja_items)}")
    
    limit = min(len(pt_items), len(ja_items))
    
    for i in range(limit):
        pt_text = '\n'.join(pt_items[i]['content']).strip()
        ja_text = '\n'.join(ja_items[i]['content']).strip()
        
        # Split by double newline to find paragraphs (basic markdown check)
        pt_paras = [p for p in re.split(r'\n\s*\n', pt_text) if p.strip()]
        ja_paras = [p for p in re.split(r'\n\s*\n', ja_text) if p.strip()]
        
        count_pt = len(pt_paras)
        count_ja = len(ja_paras)
        
        if i < 5:
            print(f"Item {i+1}: {pt_items[i]['title'][:30]}...")
            print(f"   PT: {count_pt} paras | JA: {count_ja} paras")
            # print(f"   JA Sample: {ja_paras[0][:30] if ja_paras else 'EMPTY'}...")

        status = "MATCH" if count_pt == count_ja else "MISMATCH"
        if status == "MISMATCH":
             print(f"[{status}] Item {i+1}: {pt_items[i]['title'][:30]}...")
             print(f"   PT: {count_pt} paras | JA: {count_ja} paras")

analyze_ref_paragraphs()
