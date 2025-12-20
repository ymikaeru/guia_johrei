import os
import re

def normalize_width(s):
    """Converts full-width characters to half-width."""
    return s.translate(str.maketrans(
        '０１２３４５６７８９', '0123456789'
    ))

def align_file(filepath):
    filename = os.path.basename(filepath)
    # Special handling for Vol 2: Its Kanji headers correspond to Items (###) in PT
    is_vol_2 = "浄霊法講座2.md" in filename

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = []
    
    # Pattern for Kanji Section
    # Matches:
    # 1. Standard: **一、Header**
    # 2. Existing: ## 一、Header
    # 3. Trailing: (Citation)
    # Group 1: Kanji Numeral
    # Group 2: Title
    # Group 3: Trailing content (citation, etc.)
    # Note: (?:\s|、|\.) matches separators
    kanji_pattern = re.compile(r'^(?:#+\s*)?(?:\*\*)?\s*([一二三四五六七八九十]+)\s*[、.．\s]\s*(.*?)\s*(?:\*\*)?(.*)$')
    
    # Pattern for Item (Number/Kana)
    # Matches: **1、...** or **(1)...** or **イ、...**
    item_pattern = re.compile(r'^(?:#+\s*)?(?:\*\*)?\s*([（(]?[0-9０-９]+[)）]?|[イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノ])\s*[、.．\s)]?\s*(.*?)\s*(?:\*\*)?(.*)$')
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            new_lines.append(line)
            continue
            
        # Identify Section (Kanji)
        k_match = kanji_pattern.match(stripped)
        if k_match:
            # Check length to ensure it's a header and not a long sentence
            # Only match if it actually starts with specific markers if not bolded
            if len(stripped) < 200: 
                kanji = k_match.group(1)
                title = k_match.group(2)
                trailing = k_match.group(3)
                
                # Reformat to Markdown Header
                # If Vol 2, downgrade Kanji sections to Level 3 (Items) to match PT structure
                prefix = "###" if is_vol_2 else "##"
                # Added space after comma for standard parsing regex compliance
                new_line = f"{prefix} {kanji}、 {title}{trailing}\n"
                new_lines.append(new_line)
                continue

        # Identify Item (Number/Kana)
        i_match = item_pattern.match(stripped)
        if i_match:
            if len(stripped) < 300: 
                raw_num = normalize_width(i_match.group(1))
                # Strip parentheses for cleaner markdown header (e.g. ### 1. Title)
                num = raw_num.replace('（', '').replace('）', '').replace('(', '').replace(')', '')
                title = i_match.group(2)
                trailing = i_match.group(3)
                # Reformat to Markdown Header Level 3
                new_line = f"### {num}. {title}{trailing}\n"
                new_lines.append(new_line)
                continue
        
        # Handle cases where bold starts inline (e.g. text』**1...)
        if '』**' in line:
            parts = line.split('』**')
            if len(parts) == 2:
                # Part 1 is previous text + quote
                new_lines.append(parts[0] + '』\n')
                
                # Part 2 is potentially a header **...
                # Re-evaluate part 2
                part2 = '**' + parts[1]
                p2_stripped = part2.strip()
                
                # Check if part2 matches our patterns
                k_match_2 = kanji_pattern.match(p2_stripped)
                i_match_2 = item_pattern.match(p2_stripped)
                
                if k_match_2:
                     kanji = k_match_2.group(1)
                     title = k_match_2.group(2)
                     trailing = k_match_2.group(3)
                     prefix = "###" if is_vol_2 else "##"
                     new_lines.append(f"{prefix} {kanji}、 {title}{trailing}\n")
                elif i_match_2:
                     raw_num = normalize_width(i_match_2.group(1))
                     num = raw_num.replace('（', '').replace('）', '').replace('(', '').replace(')', '')
                     title = i_match_2.group(2)
                     trailing = i_match_2.group(3)
                     new_lines.append(f"### {num}. {title}{trailing}\n")
                else:
                    new_lines.append(part2)
                continue

        new_lines.append(line)
        
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"Aligned: {filepath}")

def main():
    base_dir = "Markdown/MD_Original"
    # Target Volumes 2-10
    for i in range(2, 11):
        filename = f"浄霊法講座{i}.md"
        path = os.path.join(base_dir, filename)
        if os.path.exists(path):
            align_file(path)
        else:
            print(f"Skipping {filename} (Not found)")

if __name__ == "__main__":
    main()
