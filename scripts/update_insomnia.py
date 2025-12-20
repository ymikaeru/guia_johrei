import json
import re

# pf73 (Insomnia) Content from `cat` output of 各論２.md
new_content_pf73 = """不眠症とは少しも睡くならないものと、少しは睡れるが熟睡出来ないのとあります。
右は何れも脳貧血が原因で、延髄即ち盆の窪の辺に、毒素が凝結して、それが動脈を圧迫する為、血液が頭脳へ通るのが阻害されるからであります。
又、此凝り（凝結）は、右側が主になってをります。
此凝結を溶解すれば、血液は上伸して貧血は治り、孰眠出来る様になります。
脳貧血が不眠症の原因といふ事は、前頭部だけの貧血であります。としたら、何故、前頭部の貧血が睡れないかといふと、之は人間が霊に依られ易くなるからであります。
よく、不眠症が嵩じて精神病になる人がありますが、精神病は、不眠症が長い間続いた後に起るものであります。
之を反対に言えば、睡れるやうになれば、精神病は治るのであります。"""

def update_db(file, items):
    try:
        data = json.load(open(file, encoding='utf-8'))
    except FileNotFoundError:
        print(f"Creating {file}...")
        data = []
        
    updated = False
    for item_data in items:
        target_id = item_data['id']
        found = False
        for item in data:
            if item['id'] == target_id:
                item['content'] = item_data['content']
                item['title'] = item_data.get('title', item.get('title', ''))
                found = True
                updated = True
                print(f"Updated {target_id} in {file}")
                break
        if not found:
            # Create new if not found? Wait, usually we expect structure to exist.
            # But pf73 was missing in proper JA file for sure.
            new_item = {
               "id": target_id,
               "title": item_data.get('title', "Insônia (JA)"),
               "content": item_data['content'],
               "source": "Mapeamento Manual",
               "tags": []
            }
            data.append(new_item)
            updated = True
            print(f"Created {target_id} in {file}")

    if updated:
        with open(file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

update_db('data/fundamentos_ja.json', [
    {'id': 'pf73', 'content': new_content_pf73, 'title': '不眠症'}
])
update_db('data/pontos_focais_ja.json', [ # Just in case it's used
    {'id': 'pf73', 'content': new_content_pf73, 'title': '不眠症'}
])
