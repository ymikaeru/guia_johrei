import json

PONTOS_FOCAIS_PATH = 'data/pontos_focais.json'

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def main():
    items = load_json(PONTOS_FOCAIS_PATH)
    
    issues = {
        'empty': [],
        'too_long': [],
        'too_short': [],
        'numbered': [],
        'unsplit': [],
        'suspicious_ending': []
    }
    
    suspicious_endings = [" e", " ou", ",", " de", " da", " do", " em", " na", " no", " para", " com", " sem", " a", " o"]

    for item in items:
        title = item.get('title', 'Untitled')
        fps = item.get('focusPoints', [])
        
        if not fps:
            issues['empty'].append(title)
            continue
            
        for fp in fps:
            # Check length
            if len(fp) > 60:
                issues['too_long'].append(f"{title}: '{fp}'")
            if len(fp) < 3:
                issues['too_short'].append(f"{title}: '{fp}'")
                
            # Check numbers
            if any(char.isdigit() for char in fp):
                issues['numbered'].append(f"{title}: '{fp}'")
                
            # Check unsplit
            if " e " in fp or " ou " in fp or "," in fp:
                # Ignore if it's a common phrase like "Cabeça e Pescoço" (maybe too strict?)
                # Let's flag it for manual review anyway
                issues['unsplit'].append(f"{title}: '{fp}'")
                
            # Check endings
            for end in suspicious_endings:
                if fp.endswith(end):
                    issues['suspicious_ending'].append(f"{title}: '{fp}'")
                    break

    print(f"Analyzed {len(items)} items.\n")
    
    if issues['empty']:
        print(f"--- EMPTY FOCUS POINTS ({len(issues['empty'])}) ---")
        for t in issues['empty']: print(f"- {t}")
        print("")

    if issues['suspicious_ending']:
        print(f"--- SUSPICIOUS ENDINGS ({len(issues['suspicious_ending'])}) ---")
        for t in issues['suspicious_ending']: print(f"- {t}")
        print("")

    if issues['numbered']:
        print(f"--- CONTAINING NUMBERS ({len(issues['numbered'])}) ---")
        for t in issues['numbered']: print(f"- {t}")
        print("")

    if issues['too_long']:
        print(f"--- TOO LONG (>60 chars) ({len(issues['too_long'])}) ---")
        for t in issues['too_long']: print(f"- {t}")
        print("")
        
    if issues['unsplit']:
        print(f"--- POTENTIALLY UNSPLIT (Contains ' e ', ' ou ', ',') ({len(issues['unsplit'])}) ---")
        # Limit output
        for t in issues['unsplit'][:20]: print(f"- {t}")
        if len(issues['unsplit']) > 20: print(f"... and {len(issues['unsplit']) - 20} more")
        print("")

if __name__ == "__main__":
    main()
