import json
import re

def fix_soron3_alignment():
    path = 'data/fundamentos_ja.json'
    try:
        data = json.load(open(path, encoding='utf-8'))
    except:
        return

    for i in data:
        if i['id'] == 'soron_3':
            # Current content is likely one big block or has single newlines.
            # We want to split it where new bullets '○' or '□' appear, 
            # OR better yet, just replace specific patterns to ensure \n\n
            
            # The structure provided was:
            # □浄霊の力を抜くこと
            # ○『これは...
            # ○『これは...
            # ...
            
            content = i['content']
            
            # Remove title-like first line if it's there and not in PT body?
            # PT body starts with "Quem está ministrando..." (Paragraph 1)
            # JA body starts with "□浄霊の力を抜くこと" (Header?)
            
            # Let's clean it.
            # 1. Replace "□浄霊の力を抜くこと" with "" or check if matches PT title "Suprimir a Força..."
            # PT Title is "Suprimir a Força Física no Johrei"
            # So "□浄霊の力を抜くこと" is likely the header/title in JA. Remove from body.
            content = content.replace("□浄霊の力を抜くこと", "").strip()
            
            # 2. Split by '○' to get paragraphs.
            # The '○' seems to denote new section/paragraph in this source text.
            parts = content.split('○')
            
            # Filter empty
            parts = [p.strip() for p in parts if p.strip()]
            
            # Rejoin with double newline
            new_content = "\n\n".join(parts)
            
            i['content'] = new_content
            print(f"Fixed soron_3 content. New paragraph count: {len(parts)}")
            break

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    fix_soron3_alignment()
