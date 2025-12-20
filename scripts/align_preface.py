import json
import re

JA_PATH = '/Users/michael/Documents/Ensinamentos/guia_johrei/data/fundamentos_ja.json'

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def align_preface(content):
    # 1. Add Header if missing
    if not content.strip().startswith("まえがき"):
        content = "まえがき\n\n" + content
    
    # 2. Normalize newlines first
    # Replace multiple newlines with a single marker, then reconstruct
    # But be careful not to merge unrelated things.
    # Let's split by existing double newlines first.
    chunks = [c.strip() for c in re.split(r'\n\s*\n', content) if c.strip()]
    
    # We expect chunks to be:
    # 0: まえがき
    # 1: 「日本医術...
    # 2: そのためには...
    # 3: 本テキストは... (Need to split)
    # ...
    
    new_chunks = []
    
    for chunk in chunks:
        # Check for Quote 1: 『現在の人類を...』
        if '『現在の人類を' in chunk and '本テキストは' in chunk:
            # This is the merged chunk 3. Split it.
            # "本テキストは...現状をみられて、"
            # "『現在の人類を...』...（神示の健康「一つの苦しみ」より）"
            # "と仰せられましたように..."
            
            # Split before quote
            parts1 = chunk.split('『現在の人類を')
            pre_quote = parts1[0].strip()
            rest = '『現在の人類を' + parts1[1]
            
            # Split after quote end?
            # Quote ends with （神示の健康「一つの苦しみ」より）
            # Then "と仰せられましたように" follows usually immediately or on new line?
            # In the file viewed, it looked like:
            # ...より）\n\nと仰せられましたように...
            # If so, it might already be split in `chunks` IF there were double newlines.
            # But likely there weren't double newlines, just single.
            
            chunks_inner = []
            chunks_inner.append(pre_quote)
            
            # Find end of quote line
            # It seems to span lines.
            parts2 = rest.split('と仰せられましたように')
            if len(parts2) > 1:
                quote_part = parts2[0].strip()
                post_quote = 'と仰せられましたように' + parts2[1].strip()
                chunks_inner.append(quote_part)
                chunks_inner.append(post_quote)
            else:
                chunks_inner.append(rest)
                
            new_chunks.extend(chunks_inner)
            continue

        # Check for Quote 2: 『本教信徒...』
        # It's usually its own chunk if separated by \n\n.
        # But verify.
        
        # Check for Footer: 平成三年四月一日
        if '平成三年四月一日' in chunk and '尚、本テキスト' in chunk:
            # Split footer
            parts = chunk.split('平成三年四月一日')
            main_text = parts[0].strip()
            footer = '平成三年四月一日'
            new_chunks.append(main_text)
            new_chunks.append(footer)
            continue
            
        new_chunks.append(chunk)

    return '\n\n'.join(new_chunks)

def main():
    data = load_json(JA_PATH)
    updated = False
    
    for item in data:
        if item.get('id') == 'soron_1':
            original = item['content']
            aligned = align_preface(original)
            if aligned != original:
                item['content'] = aligned
                updated = True
                print("Aligned soron_1 (Preface)")
                # Debug print count
                print(f"Old count: {len(re.split(r'\n\s*\n', original))}")
                print(f"New count: {len(re.split(r'\n\s*\n', aligned))}")
                
    if updated:
        save_json(JA_PATH, data)
        print("Saved.")
    else:
        print("No changes.")

if __name__ == "__main__":
    main()
