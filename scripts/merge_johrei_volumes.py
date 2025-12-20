import re
import json
import os

def normalize_width(s):
    """Converts full-width and circled characters to half-width."""
    # Full-width numbers
    s = s.translate(str.maketrans(
        '０１２３４５６７８９', '0123456789'
    ))
    # Circled numbers
    circled = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'
    for i, char in enumerate(circled, 1):
        s = s.replace(char, str(i))
    return s

def roman_to_int(s):
    if not s: return 0
    rom_val = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
    int_val = 0
    s = s.upper()
    for i in range(len(s)):
        if i > 0 and s[i] in rom_val and s[i-1] in rom_val and rom_val[s[i]] > rom_val[s[i - 1]]:
            int_val += rom_val[s[i]] - 2 * rom_val[s[i - 1]]
        elif s[i] in rom_val:
            int_val += rom_val[s[i]]
    return int_val

IROHA_ORDER = "イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノオクヤマケフコエテアサキユメミシヱヒモセスン"
def kana_to_int(s):
    if not s: return 0
    # Handle single katakana
    if s in IROHA_ORDER:
        return IROHA_ORDER.index(s) + 1
    return 0

def get_label_value(label):
    if not label: return 0
    label = normalize_width(label)
    # Remove dots or spaces
    label = label.strip('. ')
    
    if label.isdigit():
        return int(label)
    
    # Single letter A-Z
    if len(label) == 1 and label.isalpha() and 'A' <= label.upper() <= 'Z':
        return ord(label.upper()) - 64
        
    # Roman or Kana or Unknown
    # Try Kana first
    k_val = kana_to_int(label)
    if k_val > 0:
        return k_val
        
    # Try Roman
    # Basic check if Roman chars
    if all(c.upper() in 'IVXLCDM' for c in label):
        return roman_to_int(label)
        
    return 0

def parse_pt_file(filepath):
    """
    Parses Portuguese Markdown using Leaf Node logic.
    """
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return []

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    items = []
    # Pattern to capture headers. 
    # Group 1: Level (#+)
    # Group 2: Label (Alphanumeric, including Roman, Arabic, Letters)
    # Group 3: Title
    pattern = r'(?m)^(#+)\s+(?:\*\*)?([A-Za-z0-9]+)(?:\*\*)?(?:[\.\\\)\s])*\s+(.*)$'
    
    matches = list(re.finditer(pattern, content))
    section_map = {} # Maps level -> section title
    
    for i, m in enumerate(matches):
        level = len(m.group(1))
        label = m.group(2)
        title = m.group(3).strip()
        
        # Determine if this header is a Section or an Item
        is_section = False
        if i + 1 < len(matches):
            next_level = len(matches[i+1].group(1))
            if next_level > level:
                is_section = True
        
        # Update section map
        if is_section:
            section_map[level] = f"{label}. {title}"
            # Clear deeper sections
            keys_to_remove = [k for k in section_map if k > level]
            for k in keys_to_remove:
                del section_map[k]
            continue
            
        # It's an item
        start = m.end()
        end = matches[i+1].start() if i + 1 < len(matches) else len(content)
        body = content[start:end].strip()
        
        body = re.sub(r'^\s*---\s*$', '', body, flags=re.MULTILINE).strip()

        parent_titles = [section_map[k] for k in sorted(section_map.keys()) if k < level]
        current_section_str = " > ".join(parent_titles) if parent_titles else ""

        items.append({
            'section': current_section_str,
            'label': label,
            'title': title,
            'content': body
        })
            
    return items

def parse_jp_file(filepath):
    """
    Parses Japanese Markdown using Leaf Node logic.
    Supports standard Markdown headers (#) and bold-only headers (**).
    """
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return []

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    items = []
    # Pattern to capture headers.
    # Group 1: Hashes (#+)
    # Group 2: Bold Marker (**) - only if Hashes are missing
    # Group 3: Label
    # Group 4: Title
    # Updates: Allow leading whitespace    # Regex: Restrict Label (Group 3) to 20 chars to avoid matching sentences
    pattern = r'(?m)^\s*(?:(#+)\s*|(\*\*)?)([^\s、\.]{1,20})(?:\*\*)?(?:[、\.\s])*\s*(.*)$'
    matches = list(re.finditer(pattern, content))
    
    enriched_matches = []
    for m in matches:

        hashes = m.group(1)
        bold = m.group(2)
        label = m.group(3).replace('*', '')
        title = m.group(4).strip().rstrip('*')
        start, end = m.span()
        
        if hashes:
            level = len(hashes)
            # Vol 5 Specific Fix: User used ## for items (e.g. ## 1. Title).
            # Downgrade to Level 3 if label is a digit to restore hierarchy under **一、** (L2).
            if level == 2 and re.match(r'^\d+$', label):
                level = 3
            # Filter Logic
            norm_label = normalize_width(label)
            # Skip circled numbers and other special chars before int check
            if norm_label.isdigit() and int(norm_label) > 1900:
                continue # Skip year headers

        elif bold:
             # Validate label for bold-only
             if '*' in label:
                 continue
             
             # Separator check
             sep_region = content[m.end(3):m.start(4)]
             if not re.search(r'[、\.\s　]', sep_region):
                  continue

             if re.match(r'^[一二三四五六七八九十百]+$', label):
                 level = 2
             elif re.match(r'^\d+$', label):
                 level = 3
             elif re.match(r'^[A-Za-z]+$', label):
                  if len(label) == 1 or re.match(r'^[IVXLCDMivxlcdm]+$', label):
                      level = 3
                  else:
                      continue
             elif re.match(r'^[\u30A0-\u30FF]$', label):
                 level = 3
             else:
                 continue
        else:
             if m.start() == 0:
                 level = 1
             else:
                 continue

        enriched_matches.append({
            'level': level,
            'label': label,
            'title': title,
            'start': start,
            'end': end
        })
        
    section_map = {}
    for i, m in enumerate(enriched_matches):
        level = m['level']
        label = m['label']
        title = m['title']
        
        is_section = False
        if i + 1 < len(enriched_matches):
            next_level = enriched_matches[i+1]['level']
            if next_level > level and level < 3:
                is_section = True
                
        if is_section:
            section_map[level] = f"{label}、{title}"
            keys_to_remove = [k for k in section_map if k > level]
            for k in keys_to_remove:
                del section_map[k]
            continue
            
        # Item
        content_start = m['end']
        
        content_end = enriched_matches[i+1]['start'] if i + 1 < len(enriched_matches) else len(content)
        body = content[content_start:content_end].strip()
        body = re.sub(r'^\s*---\s*$', '', body, flags=re.MULTILINE).strip()
        
        parent_titles = [section_map[k] for k in sorted(section_map.keys()) if k < level]
        current_section_str = " > ".join(parent_titles) if parent_titles else ""

        items.append({
            'section': current_section_str,
            'label': label,
            'title': title,
            'content': body
        })

    return items




def align_items(pt_items, jp_items):
    """
    Aligns PT and JP items based on sequential label values.
    Inserts empty items where gaps are detected.
    Handles Section numbering resets (e.g. PT 1..5, 1..5 vs JP 1..10).
    """
    aligned_pt = []
    aligned_jp = []
    
    i = 0
    j = 0
    
    prev_pt_val = 0
    prev_jp_val = 0
    
    while i < len(pt_items) or j < len(jp_items):
        pt = pt_items[i] if i < len(pt_items) else None
        jp = jp_items[j] if j < len(jp_items) else None
        
        if pt and not jp:
            aligned_pt.append(pt)
            aligned_jp.append({})
            i += 1
            continue
        if jp and not pt:
            aligned_pt.append({})
            aligned_jp.append(jp)
            j += 1
            continue
            
        pt_val = get_label_value(pt['label'])
        jp_val = get_label_value(jp['label'])
        
        # Check for Reset Pattern
        # If PT resets (drops value) but JP continues (increases), assume they align (Section Reset vs Continuous)
        force_match = False
        if prev_pt_val > 0 and prev_jp_val > 0:
             if pt_val < prev_pt_val and jp_val > prev_jp_val:
                 force_match = True

        if pt_val == jp_val or force_match:
            aligned_pt.append(pt)
            aligned_jp.append(jp)
            prev_pt_val = pt_val
            prev_jp_val = jp_val
            i += 1
            j += 1
            continue
            
        elif pt_val > 0 and jp_val > 0:
            if pt_val == jp_val + 1:
                # PT is ahead (e.g. PT=9, JP=8). JP missing item.
                aligned_pt.append({})
                aligned_jp.append(jp)
                prev_jp_val = jp_val # Track handled value
                j += 1
            elif jp_val == pt_val + 1:
                # JP is ahead (e.g. PT=8, JP=9). PT missing item.
                aligned_pt.append(pt)
                aligned_jp.append({})
                prev_pt_val = pt_val
                i += 1
            else:
                 # Large gap or unknown pattern
                 # Default: Align them if no better option? 
                 # Or treat as mismatch (Insert Empty for lower value).
                 # If numeric, assume gap filling.
                 if pt_val < jp_val:
                     # PT is behind. e.g. PT=1, JP=7. (If not forced match above).
                     # Assume PT item has no JP match?
                     aligned_pt.append(pt)
                     aligned_jp.append({})
                     prev_pt_val = pt_val
                     i += 1
                 else:
                     # JP is behind.
                     aligned_pt.append({})
                     aligned_jp.append(jp)
                     prev_jp_val = jp_val
                     j += 1
        else:
            # Non-numeric labels. Force match.
            aligned_pt.append(pt)
            aligned_jp.append(jp)
            i += 1
            j += 1

    return aligned_pt, aligned_jp

def process_volume(vol_num):
    pt_path = f'Markdown/MD_Portugues/Johrei Ho Kohza ({vol_num}).md'
    jp_path = f'Markdown/MD_Original/浄霊法講座{vol_num}.md'
    out_path = f'data/johrei_vol{vol_num:02d}_bilingual.json'
    
    print(f"Processing Volume {vol_num}...")
    
    pt_items = parse_pt_file(pt_path)
    jp_items = parse_jp_file(jp_path)
    
    print(f"  Vol {vol_num}: Found {len(pt_items)} PT items and {len(jp_items)} JP items")
    
    # DEBUG: Print JP items for Vol 8
    if vol_num == 8:
        print("  DEBUG Vol 8 JP Items:", [item['label'] for item in jp_items])

    # Align items
    aligned_pt, aligned_jp = align_items(pt_items, jp_items)
    
    print(f"  Vol {vol_num}: Aligned to {len(aligned_pt)} items")
    
    merged = []
    
    for k in range(len(aligned_pt)):
        pt = aligned_pt[k]
        jp = aligned_jp[k]
        
        item = {
            'id': f"johrei_vol{vol_num:02d}_{k+1:02d}",
            'book_name': 'Johrei Ho Kohza',
            'volume': str(vol_num),
            'order': k + 1,
            'label_pt': pt.get('label', ''),
            'title_pt': pt.get('title', ''),
            'content_pt': pt.get('content', ''),
            'label_jp': jp.get('label', ''),
            'title_jp': jp.get('title', ''),
            'content_jp': jp.get('content', ''),
            'section_pt': pt.get('section', ''),
            'section_jp': jp.get('section', '')
        }
        merged.append(item)
        
    if merged:
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(merged, f, indent=2, ensure_ascii=False)
        print(f"  Created {out_path} with {len(merged)} items.")
    else:
        print(f"  Failed to create {out_path} (no data)")

def main():
    for vol in range(2, 11):
        process_volume(vol)

if __name__ == "__main__":
    main()
