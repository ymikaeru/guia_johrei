import re

def final_search():
    files = ["Docx_Original/各論.md", "Docx_Original/各論２.md"]
    pats = {
        "Milk": r"乳",
        "Intestinal Hemorrhage": r"腸出血|下血"
    }

    for fpath in files:
        print(f"--- FILE: {fpath} ---")
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                for i, line in enumerate(lines):
                    for key, pat in pats.items():
                        if re.search(pat, line):
                            print(f"Match {key} at Line {i}: {line.strip()[:80]}...")
        except Exception as e:
            print(f"Error {fpath}: {e}")

if __name__ == "__main__":
    final_search()
