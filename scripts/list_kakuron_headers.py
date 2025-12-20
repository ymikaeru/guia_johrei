import re

def list_headers():
    files = ["Docx_Original/各論.md", "Docx_Original/各論２.md"]
    for fpath in files:
        print(f"--- FILE: {fpath} ---")
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                for i, line in enumerate(lines):
                    # Check for headers like brackets or bullets
                    stripped = line.strip()
                    if stripped.startswith('［') or stripped.startswith('[') or stripped.startswith('□'):
                        print(f"{i}: {stripped}")
                    # Also check for lines that seem like titles (short, usually followed by text)
                    elif len(stripped) < 20 and stripped and not stripped.startswith(('(','（')):
                        # Heuristic
                        pass
        except Exception as e:
            print(f"Error reading {fpath}: {e}")

if __name__ == "__main__":
    list_headers()
