import json

PT_PATH = '/Users/michael/Documents/Ensinamentos/guia_johrei/data/fundamentos.json'
JA_PATH = '/Users/michael/Documents/Ensinamentos/guia_johrei/data/fundamentos_ja.json'

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# Load both files
pt_data = load_json(PT_PATH)
ja_data = load_json(JA_PATH)

# Get the Preface items
pt_item = [x for x in pt_data if x.get('title') == 'Prefácio'][0]
ja_item = [x for x in ja_data if x.get('id') == 'soron_1'][0]

# The Japanese content should be restructured to match PT paragraph breaks
# Based on semantic alignment:
ja_aligned = """「日本医術・浄霊」を創始された岡田茂吉師（明主様）は、全人類の真の幸福を願われ、この地上に健・富・和の理想世界を実現することを唱えられました。

そのためには、健康こそが人間幸福の根本であることを感得されて、真の健康法確立に向かって研究を重ねながら、「日本医術・浄霊」を完成され、それを真文明創造の核心的役割をなすものとして位置づけられました。

本テキストは、明主様によって発見された神霊科学に基づく「日本医術・浄霊」の理論と実際を研究し、学ぶことを目的として作成されたものです。明主様の御教えを引用させていただきながら、総論一及び二、そして各論からなる三部構成としてまとめております。中には、現代医療と矛盾するような箇所もあるかと思いますが、それは多くの人々が病苦に呻吟している現状をみられて、

『現在の人類を観る時余りに悲惨といわねばならない。それらを観る私は実に堪えられない悩みである』　　　　　　　　　　　　　　　　（神示の健康「一つの苦しみ」より）

と仰せられましたように、やむにやまれぬ人類愛の御心からの警告・提言であり、医療拒否を意味するものではありません。それは次のような御教えからも明らかであります。

『本教信徒の中に、浄霊の場合、医師にかかる事、薬を飲む事、注射をする事等に就て否定する如き言葉ありやにて、本教の主旨を履き違え、社会の誤解を受くる事は本教を傷つける結果となる事は勿論で、此点充分注意され、決して医療を否定する如き事無きよう茲に重ねて戒意を促す次第である』（地上天国誌十七号より）

こうした明主様の御心をしっかりと受け止めながら、人間の健康を願い進歩発展を遂げつつある現代医学の様々な功績を尊重し、協力し合って、真の健康づくりに貢献してまいりたいと切に願うものであります。

尚、本テキストの作成に当たりましては、前千葉県がんセンター研究局長の新田和男医学博士に監修の労をとっていただきました。あらためてここに、深く感謝申し上げる次第であります。

平成三年四月一日"""

# Update the Japanese item
ja_item['content'] = ja_aligned

# Save
save_json(JA_PATH, ja_data)
print("Fixed! Japanese Preface now has exact paragraph alignment with Portuguese.")
print(f"PT paragraphs: {len(pt_item['content'].split(chr(10)+chr(10)))}")
print(f"JA paragraphs: {len(ja_aligned.split(chr(10)+chr(10)))}")
