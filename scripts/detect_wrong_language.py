import json
import re

def detect_portuguese_in_ja():
    path = 'data/fundamentos_ja.json'
    try:
        data = json.load(open(path, encoding='utf-8'))
    except Exception as e:
        print(f"Error: {e}")
        return

    # Japanese regex ranges (Hiragana, Katakana, Kanji)
    jp_pattern = re.compile(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]')
    
    suspects = []

    for item in data:
        content = item.get('content', '')
        if not content:
            continue
            
        # Check if it has Japanese characters
        if not jp_pattern.search(content):
            # It has NO Japanese characters. Likely Portuguese or broken.
            suspects.append({
                "id": item['id'],
                "snippet": content[:50].replace('\n', ' ')
            })
        else:
            # Maybe mixed?
            # Calculate ratio of JP chars to total length?
            total = len(content)
            jp_count = len(jp_pattern.findall(content))
            ratio = jp_count / total if total > 0 else 0
            
            # If ratio is very low, it might be mostly PT with some formatting symbols
            if ratio < 0.05:
                suspects.append({
                    "id": item['id'],
                    "snippet": f"[Low JP Ratio: {ratio:.2f}] " + content[:50].replace('\n', ' ')
                })

    print(f"Found {len(suspects)} suspect items.")
    for s in suspects:
        print(f"ID: {s['id']} | {s['snippet']}...")

if __name__ == "__main__":
    detect_portuguese_in_ja()
