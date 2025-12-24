import os
import re
import json
import glob

# Configuration
BASE_DIR = "/Users/michael/Documents/Ensinamentos/guia_johrei/Docx_Original"
PT_DIR_NAME = "MD_Portugues"
JP_DIR_NAME = "MD_Original"
OUTPUT_DIR = "data"

# Mapping of volumes
# format: (output_filename, pt_filename_pattern, jp_filename_pattern)
VOLUME_MAPPINGS = [
    # Curso de Johrei (Volumes 1-10)
    ("johrei_vol01", "- 浄霊法講座 01 (Curso de Johrei).md", "浄霊法講座（一）.md"),
    ("johrei_vol02", "- 浄霊法講座 02 (Curso de Johrei).md", "浄霊法講座（二）.md"),
    ("johrei_vol03", "- 浄霊法講座 03 (Curso de Johrei).md", "浄霊法講座（三）.md"),
    ("johrei_vol04", "- 浄霊法講座 04 (Curso de Johrei).md", "浄霊法講座（四）*.md"), # Wildcard for suffix
    ("johrei_vol05", "- 浄霊法講座 05 (Curso de Johrei).md", "浄霊法講座（五）*.md"),
    ("johrei_vol06", "- 浄霊法講座 06 (Curso de Johrei).md", "浄霊法講座（六）*.md"),
    ("johrei_vol07", "- 浄霊法講座 07 (Curso de Johrei).md", "浄霊法講座（七）*.md"),
    ("johrei_vol08", "- 浄霊法講座 08 (Curso de Johrei).md", "浄霊法講座（八）*.md"), # Matches multiple? (1) exists.
    ("johrei_vol09", "- 浄霊法講座 09 (Curso de Johrei).md", "浄霊法講座（九）*.md"),
    ("johrei_vol10", "- 浄霊法講座 10 (Curso de Johrei).md", "浄霊法講座（十）.md"),
    
    # Explicação Ensinamentos (Volumes 1-3)
    ("explicacoes_vol01", "Explicação Ensinamentos 01.md", "総論１.md"),
    ("explicacoes_vol02", "Explicação Ensinamentos 02.md", "総論２.md"), 
    ("explicacoes_vol03", "Explicação Ensinamentos 03.md", "総論３.md"), 

    # Pontos Focais do Johrei (Volumes 1-2)
    ("pontos_focais_vol01", "Pontos Focais do Johrei 01.md", "各論.md"), 
    ("pontos_focais_vol02", "Pontos Focais do Johrei 02.md", "各論２.md"),
]

def find_file(directory, pattern):
    search_path = os.path.join(directory, pattern)
    files = glob.glob(search_path)
    if not files:
        return None
    # If multiple files match, prefer the one without " (1)" if possible, or usually just the first one
    # For johrei_vol08, we have regular and (1). (1) might be a dupe or version. 
    # Let's pick the shortest filename usually implies the original or main one.
    files.sort(key=len)
    return files[0]

def get_jp_parsing_config(file_path):
    """
    Returns a configuration dictionary for Japanese parsing based on the filename.
    """
    filename = os.path.basename(file_path)
    config = {
        'standard': True,      # #{1,6}
        'box_bracket': True,   # □, 【
        'arabic_bold': True,   # **1. ...
        'kanji_bold': True,    # **一、...
        'parenthesis': False,  # **（1）...
        'numbered_list': True, # 1), 1., etc. (Non-bold, often used in Pontos Focais)
    }

    # Volume 4 & 6: Exclude Arabic bold to avoid excessive sub-sectioning (PT uses broader categories)
    if "浄霊法講座（四）" in filename or "浄霊法講座（六）" in filename:
        config['arabic_bold'] = False
        config['numbered_list'] = False # Also exclude numbered lists to be safe if they appear in text
        
    # Volume 9 & 10: Include Parenthesis headers (used for main structure matching PT)
    if "浄霊法講座（九）" in filename or "浄霊法講座（十）" in filename:
        config['parenthesis'] = True
        
    return config

def build_jp_regex(config):
    patterns = []
    if config['standard']:
        patterns.append(r'#{1,6}')
    if config['box_bracket']:
        patterns.append(r'□|【')
    if config['arabic_bold']:
        # Matches **1., **1、, **１., **１、
        patterns.append(r'\*\*[0-9０-９]+[、．\.]')
    if config['kanji_bold']:
        # Matches **一、, **一., 一、 (sometimes not bold? assume bold for now matches previous logic)
        patterns.append(r'\*\*?[一二三四五六七八九十百]+[、．\.]')
    if config['parenthesis']:
        # Matches **（1）, **(1), （1）, (1)
        patterns.append(r'\*\*?[（\(][0-9０-９]+[）\)]')
    if config['numbered_list']:
        # Matches 1), 1., １）, etc.
        patterns.append(r'[0-9０-９]+[\)\.）]')
        
    marker_group = '|'.join(patterns)
    # The regex must capture the marker group named 'marker' and the rest as 'title'
    return r'(?m)^(?P<marker>' + marker_group + r')(?P<title>.*)$'

def parse_markdown(file_path, lang='pt'):
    """
    Parses a markdown file into a list of sections.
    Each section is a dict: {'title': str, 'content': str}
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    sections = []
    
    if lang == 'jp':
        config = get_jp_parsing_config(file_path)
        regex = build_jp_regex(config)
    else:
        # Standard Markdown parsing for PT
        regex = r'(?m)^(?P<marker>#{1,6})\s+(?P<title>.*)$'

    matches = list(re.finditer(regex, text))
    
    if not matches:
        return [{'title': 'Full Text', 'content': text.strip()}]

    for i, match in enumerate(matches):
        marker = match.group('marker').strip()
        raw_title = match.group('title').strip()
        
        # Cleanup title
        title = raw_title
        
        # Remove trailing brackets if started with 【
        if marker == '【' and title.endswith('】'):
            title = title[:-1]
            
        # Remove trailing markdown bold if started with bold marker
        # Example: marker="**1、", title="Something**" -> Remove "**"
        if marker.startswith('**') and title.endswith('**'):
            title = title[:-2]
            
        # Remove leading bold if marker didn't capture it (rare, but for safety)
        if title.startswith('**') and title.endswith('**'):
             title = title[2:-2]

        # Determine content range
        start_index = match.end()
        if i < len(matches) - 1:
            end_index = matches[i+1].start()
        else:
            end_index = len(text)
            
        content = text[start_index:end_index].strip()
        
        sections.append({
            'title': title,
            'content': content
        })
        
    return sections

def merge_sections(pt_sections, jp_sections):
    """
    Merges two lists of sections.
    """
    merged = []
    limit = max(len(pt_sections), len(jp_sections))
    
    for i in range(limit):
        item = {
            'id': f"item_{i+1:03d}",
            'title_pt': "",
            'content_pt': "",
            'title_ja': "",
            'content_ja': ""
        }
        
        if i < len(pt_sections):
            item['title_pt'] = pt_sections[i]['title']
            item['content_pt'] = pt_sections[i]['content']
            
        if i < len(jp_sections):
            item['title_ja'] = jp_sections[i]['title']
            item['content_ja'] = jp_sections[i]['content']
            
        merged.append(item)
        
    return merged

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    pt_base = os.path.join(BASE_DIR, PT_DIR_NAME)
    jp_base = os.path.join(BASE_DIR, JP_DIR_NAME)

    for out_name, pt_pat, jp_pat in VOLUME_MAPPINGS:
        print(f"Processing {out_name}...")
        
        pt_file = find_file(pt_base, pt_pat)
        jp_file = find_file(jp_base, jp_pat)
        
        if not pt_file:
            print(f"  [WARNING] PT file not found for pattern: {pt_pat}")
            continue
        if not jp_file:
            print(f"  [WARNING] JP file not found for pattern: {jp_pat}")
            continue
            
        print(f"  Found PT: {os.path.basename(pt_file)}")
        print(f"  Found JP: {os.path.basename(jp_file)}")
        
        pt_sections = parse_markdown(pt_file, lang='pt')
        jp_sections = parse_markdown(jp_file, lang='jp')
        
        print(f"  Extracted {len(pt_sections)} PT sections and {len(jp_sections)} JP sections.")
        
        merged_data = merge_sections(pt_sections, jp_sections)
        
        out_path = os.path.join(OUTPUT_DIR, f"{out_name}.json")
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(merged_data, f, indent=2, ensure_ascii=False)
            
        print(f"  Saved to {out_path}")

if __name__ == "__main__":
    main()
