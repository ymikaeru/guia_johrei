
import re
import json

def parse_markdown_jap(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    structured_data = []
    
    # Defaults and State
    current_volume = "Johrei Hō Kōza Vol.01" # Start with Vol 1
    current_item = None
    buffer_content = []

    # Regex patterns
    # Volume Header: 浄霊法講座（一） at start of a line
    # Sometimes may just be number. We will look for 浄霊法講座（X）
    volume_pattern = re.compile(r'^浄霊法講座（([一二三四五六七八九十]+)）')
    
    # Updated regex to handle Kanji AND Numerals (Full/Half width)
    # Section Header: **一、Title** or **１、Title**
    section_pattern_md = re.compile(r'^\s*(?:#+\s*)?\*\*\s*([一二三四五六七八九十０-９\d]+)[、\.]\s*(.+?)\s*\*\*')
    section_pattern_plain = re.compile(r'^\s*(?:#+\s*)?([一二三四五六七八九十０-９\d]+)[、\.]\s*(.+)$')
    
    # Date pattern to skip: 2021.01.222024.11.21 or similar
    date_pattern = re.compile(r'^\d{4}\.\d{2}\.\d{2}')

    # Helpers
    def get_section_num(section_str):
        # If it's already a digit string (half or full width)
        if section_str.isdigit():
            return int(section_str)
        
        # Handle full-width digits explicitly if isdigit() doesn't cover them (it usually does for unicode digits)
        # But let's map standard Kanji nums
        nums = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
                '１':1, '２':2, '３':3, '４':4, '５':5, '６':6, '７':7, '８':8, '９':9, '０':0}
        
        if section_str in nums:
            return nums[section_str]
        
        # Simple tens logic (十一 to 十九)
        if len(section_str) == 2 and section_str.startswith('十'):
             suffix = section_str[1]
             if suffix in nums:
                return 10 + nums[suffix]

        # Handle '11' etc in string form if not caught by isdigit
        try:
            # unicodedata.normalize('NFKC', section_str) might help but let's just try casting
            return int(section_str)
        except:
            pass
            
        return 0

    kanji_numbers = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}

    def get_volume_str(kanji_num):
        num = kanji_numbers.get(kanji_num, 0)
        return f"Johrei Hō Kōza Vol.{num:02d}"

    def save_current_item():
        if current_item:
            # Clean buffer
            content = '\n'.join(buffer_content).strip()
            if content:
                current_item['content'] = content
                structured_data.append(current_item)

    for line in lines:
        line_stripped = line.strip()
        
        # Check for Volume Change
        vol_match = volume_pattern.match(line_stripped)
        if vol_match:
            save_current_item()
            current_item = None
            buffer_content = []
            current_volume = get_volume_str(vol_match.group(1))
            continue

        # Check for Section Header (Start of a new teaching)
        # Try MD pattern first
        sec_match = section_pattern_md.match(line_stripped)
        if not sec_match:
            # Try plain pattern
            sec_match = section_pattern_plain.match(line_stripped)
        
        if sec_match:
            save_current_item()
            buffer_content = []
            
            section_num_kanji = sec_match.group(1)
            title = sec_match.group(2).strip()
            
            current_item = {
                "original_title": title,
                "source": current_volume,
                "section_kanji": section_num_kanji
            }
            continue

        # Skip Dates
        if date_pattern.match(line_stripped):
            continue
            
        # Accumulate Content
        if current_item:
            # Add line, preserving some markdown structure if needed, or just plain text
            # The user wants "original text", MD is fine.
            buffer_content.append(line.rstrip()) # Keep newlines in buffer logic, strip trailing

    # Save last
    save_current_item()
    
    return structured_data

    return structured_data

import glob
import os

def extract_all():
    all_data = []
    # Target files: Main one + numbered ones + the new Vol 8 one
    # We can just look for all .md files and check if they match our volume pattern
    
    files = glob.glob('Docx_Original/*.md')
    
    for file_path in files:
        # We need to determine "Current Volume" from the filename if the file content doesn't have it at the top
        # The new file '浄霊法講座（八）...' suggests Vol 8.
        # But '浄霊法講座 01.md' etc also exist.
        
        print(f"Processing {file_path}...")
        data = parse_markdown_jap(file_path)
        
        # If the file didn't set a volume (e.g. no header line), we might need to infer it?
        # Our parser sets default "Johrei Hō Kōza Vol.01" which might be WRONG for other files if they don't have the header.
        # Let's inspect the Vol 8 file again. It has "# **一　、　胃　　　疾　　　患**" but DOES IT HAVE VOLUME HEADER?
        # Line 1 is the Section 1 header. I don't see "浄霊法講座（八）" as a line on its own in the file view.
        # The filename HAS it.
        # We should infer volume from filename if possible.
        
        if data:
            # If the parser used the default Vol 01 and didn't find a header, we should fix it.
            # Filename based override:
            basename = os.path.basename(file_path)
            
            # Check for (八)
            if '（八）' in basename:
                vol_str = "Johrei Hō Kōza Vol.08"
                for item in data:
                    if item['source'] == "Johrei Hō Kōza Vol.01": # Only override default
                        item['source'] = vol_str
            
            # Check for 01, 02...
            elif '浄霊法講座 ' in basename:
                try:
                    # Extract number 01, 02 from "- 浄霊法講座 01..."
                    match = re.search(r'浄霊法講座 (\d+)', basename)
                    if match:
                        num = int(match.group(1))
                        vol_str = f"Johrei Hō Kōza Vol.{num:02d}"
                        for item in data:
                             if item['source'] == "Johrei Hō Kōza Vol.01":
                                item['source'] = vol_str
                except:
                    pass

            all_data.extend(data)

    # Output
    output_path = 'data/teachings_ja_raw.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"Extracted {len(all_data)} items to {output_path}")

if __name__ == "__main__":
    extract_all()
