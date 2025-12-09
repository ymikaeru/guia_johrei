import json

file_path = 'data/pontos_focais.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

count = 0
for item in data:
    if item['title'] == "Otorreia (":
        print("Fixing Otorreia...")
        # Reconstruct
        # Current Body starts with "Pus no Ouvido) Lavagens..."
        # We want Title: "Otorreia (Pus no Ouvido)"
        # Body: "Lavagens..."
        
        current_body = item['content']
        # Find the closing parenthesis
        close_idx = current_body.find(') ')
        
        if close_idx != -1:
            part_to_restore = current_body[:close_idx+1] # "Pus no Ouvido)"
            rest_of_body = current_body[close_idx+2:] # Skip ") "
            
            item['title'] = item['title'].strip() + str(part_to_restore) # "Otorreia (Pus no Ouvido)"
            item['content'] = rest_of_body
            count += 1
        else:
             print("Could not find closing parenthesis in body.")

if count > 0:
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Fixed Otorreia.")
else:
    print("Otorreia not found or already fixed.")
