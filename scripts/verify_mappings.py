import json
import re

def check_match(pt_data, ja_data, id_check, ja_snippet, label):
    print(f"\n--- Checking {label} (ID: {id_check}) ---")
    ja_item = next((i for i in ja_data if i['id'] == id_check), None)
    if not ja_item:
        print(f"JA Item {id_check} NOT FOUND")
        return False
    
    content = ja_item['content']
    if ja_snippet in content:
        print("MATCH VERIFIED!")
        return True
    else:
        print("MATCH FAILED. Snippet not found.")
        print(f"Snippet: {ja_snippet}")
        print(f"Content start: {content[:50]}...")
        return False

try:
    pt_data = json.load(open('data/fundamentos.json'))
    ja_data = json.load(open('data/fundamentos_ja.json'))
except:
    print("Error loading JSON")
    exit()

# 1. Find Insomnia ID (Kakuron 2)
insomnia_id = None
for i in pt_data:
    if 'Insônia' in i['title']:
        insomnia_id = i['id']
        print(f"Found Insomnia ID in Title: {insomnia_id} ({i['title']})")
        break
if not insomnia_id:
    for i in pt_data:
        if 'Insônia' in i['content']: # Simple check
            # print(f"Found Insomnia in content: {i['id']}")
            pass

# Manual check for Kakuron 2 snippet
kakuron2_snippet = "不眠症とは少しも睡くならないもの"
# We don't have the insomnia_id verified for JA yet.
# Let's search JA data for the snippet directly to be sure.
found_k2 = False
for i in ja_data:
    if kakuron2_snippet in i['content']:
        print(f"FOUND Kakuron 2 in JA Data! ID: {i['id']} Title: {i['title']}")
        found_k2 = True
        break
if not found_k2: print("Kakuron 2 snippet NOT FOUND in JA data.")

# 2. Check Soron 2 (Vital Points) -> fundamentos_2 ?
soron2_snippet = "急所を見つけてやる"
check_match(pt_data, ja_data, 'fundamentos_2', soron2_snippet, 'Soron 2')

# 3. Check Soron 3 (Relax) -> fundamentos_4 ?
soron3_snippet = "浄霊の力を抜くこと" # from header... maybe content differs?
# "浄霊の力を抜くこと" was in the header of Soron 3.md. 
# Let's check if it's in content of fundamentos_4.
check_match(pt_data, ja_data, 'fundamentos_4', "力を抜く", 'Soron 3 (Broad check)')

