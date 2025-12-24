
import re
import json

def parse_japanese_text(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    structured_data = []
    current_volume = "Johrei Hō Kōza Vol.01" # Default
    current_item = None
    
    # Regex patterns
    volume_pattern = re.compile(r'浄霊法講座（([一二三四五六七八九十]+)）')
    section_pattern = re.compile(r'^[一二三四五六七八九十]+、(.+)$')
    kanji_numbers = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}

    def get_volume_str(kanji_num):
        # Simplistic conversion for 1-10. 
        # Vol.01, Vol.02 etc
        num = kanji_numbers.get(kanji_num, 0)
        return f"Johrei Hō Kōza Vol.{num:02d}"

    buffer_content = []

    def save_current_item():
        if current_item:
            current_item['content'] = '\n'.join(buffer_content).strip()
            structured_data.append(current_item)

    for line in lines:
        line = line.strip()
        if not line:
            if buffer_content and buffer_content[-1] != "":
                buffer_content.append("") # Keep paragraph breaks
            continue

        # Check for Volume Header
        vol_match = volume_pattern.search(line)
        if vol_match:
            save_current_item()
            current_item = None
            buffer_content = []
            current_volume = get_volume_str(vol_match.group(1))
            continue

        # Check for Section Header (Title)
        sec_match = section_pattern.match(line)
        if sec_match:
            save_current_item()
            buffer_content = []
            title = sec_match.group(1).strip()
            # If title is numeric/date like, skip? 
            # The dates in the file look like 2021.01... which don't match pattern 'Number、Title' usually.
            # But wait, looking at file content: "一、病気とは何ぞや" matches.
            
            section_full = line.split('、')[0] # 一
            
            current_item = {
                "original_title": title,
                "source": current_volume,
                "section_number": section_full
            }
            continue

        # Date lines or Subtitles
        # Dates: 2021.01...
        if re.match(r'^\d{4}\.\d{2}\.\d{2}', line):
            continue
            
        # Add to content
        if current_item:
            buffer_content.append(line)

    save_current_item()
    
    return structured_data

data = parse_japanese_text('Docx_Original/temp_jp.txt')

# Save to JSON
with open('Docx_Original/extracted_jp.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(data)} items.")
