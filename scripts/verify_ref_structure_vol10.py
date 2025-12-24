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
                sections.append({'type': 'h2', 'title': current_h2, 'content': []})
            elif line.startswith('### '):
                # H3 Header (Item)
                title = line.strip('# ').strip()
                sections.append({'type': 'h3', 'title': title, 'content': []})
            else:
                if sections:
                    sections[-1]['content'].append(line)
                    
        elif lang == 'ja':
            # JA headers in this file seem to be:
            # # **一　、　眼　　　科** (Equivalent to H2)
            # **（１）...** (Equivalent to H3, usually inside bold)
            
            # Or sometimes: # **一 ...**
            if line.startswith('# **') or line.startswith('## '):
                 clean_line = re.sub(r'[*#]', '', line).strip()
                 sections.append({'type': 'h2', 'title': clean_line, 'content': []})
            elif line.startswith('**（') or line.startswith('**('):
                 # Sub items (1), (2), etc
                 clean_line = re.sub(r'[*]', '', line).strip()
                 sections.append({'type': 'h3', 'title': clean_line, 'content': []})
            else:
                if sections:
                     sections[-1]['content'].append(line)

    return sections

def analyze_ref():
    with open('data_reference/johrei_vol10_ref.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    pt_content = data['content']['portugues']
    ja_content = data['content']['japones']
    
    pt_sections = parse_markdown_structure(pt_content, 'pt')
    ja_sections = parse_markdown_structure(ja_content, 'ja')
    
    print(f"PT Sections: {len(pt_sections)}")
    print(f"JA Sections: {len(ja_sections)}")
    
    # Analyze H3 matching
    pt_h3 = [s for s in pt_sections if s['type'] == 'h3']
    ja_h3 = [s for s in ja_sections if s['type'] == 'h3']
    
    print(f"PT H3 Items: {len(pt_h3)}")
    print(f"JA H3 Items: {len(ja_h3)}")
    
    # Print first few to check alignment
    for i in range(min(5, len(pt_h3), len(ja_h3))):
        print(f"Match {i}:")
        print(f"  PT: {pt_h3[i]['title']}")
        print(f"  JA: {ja_h3[i]['title']}")
        
analyze_ref()
