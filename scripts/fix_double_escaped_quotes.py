import json
import glob
import os

def fix_string(s):
    if isinstance(s, str):
        # Replace \" with "
        # In the string value in memory, this is a backslash char followed by a quote char.
        return s.replace('\\"', '"')
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
        # Skip backup files
        if file_path.endswith('.backup'):
            continue
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if not content.strip():
                    continue
                data = json.loads(content)
            
            # Check if any change is needed by dumping and comparing? 
            # Or just process and compare content?
            # recursive_fix creates a new structure.
            
            fixed_data = recursive_fix(data)
            
            # Convert back to JSON string to check valid formatting and equality logic
            # (Comparing objects directly might be slow if large, but safer)
            
            if fixed_data != data:
                print(f"Fixing {file_path}...")
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(fixed_data, f, indent=2, ensure_ascii=False)
                count += 1
                
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    print(f"Fixed {count} files.")

if __name__ == "__main__":
    main()
