import json
import glob
import os

def fix_string(s):
    if isinstance(s, str):
        # Unescape literal backslash+n to actual newline
        return s.replace('\\n', '\n')
    return s

def recursive_fix(data):
    if isinstance(data, dict):
        return {k: recursive_fix(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [recursive_fix(i) for i in data]
    elif isinstance(data, str):
        return fix_string(data)
    else:
        return data

def main():
    files = glob.glob('data/*.json')
    count = 0
    for file_path in files:
        if file_path.endswith('.backup'):
            continue
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if not content.strip():
                    continue
                data = json.loads(content)
            
            fixed_data = recursive_fix(data)
            
            if fixed_data != data:
                print(f"Fixing {file_path}...")
                with open(file_path, 'w', encoding='utf-8') as f:
                    # dump with ensure_ascii=False to keep unicode
                    # dump uses \n for actual newlines if pretty-printing?
                    # No, valid JSON strings MUST escape newlines as \n.
                    # Wait. 
                    # If I have a string in memory: "Line1\nLine2"
                    # json.dump will write it as "Line1\nLine2" in the file.
                    # If I had "Line1\\nLine2" in memory, json.dump writes "Line1\\nLine2".
                    
                    # The issue is "Line1\\nLine2" in memory.
                    # My fix_string creates "Line1\nLine2" in memory.
                    # json.dump will write "\n" (escaped newline) in the file.
                    
                    json.dump(fixed_data, f, indent=2, ensure_ascii=False)
                count += 1
                
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    print(f"Fixed {count} files.")

if __name__ == "__main__":
    main()
