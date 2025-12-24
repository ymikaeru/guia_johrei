import json
import re

# Lines extracted from Docx manually via previous `sed` output:
# 313: 腎臓といふものは...
# 314: 腎臓はそういふ訳で...
# 316: 又、腎臓と肺臓が水で...
# 317: 腎臓病にも種々あります...
# 319: 【腎臓結核】
# 320: よく萎縮腎を腎臓結核と...
# 326: 水膿溜結が腎臓を圧迫するので...
# 328: 肩、背面腎臓部
# 331: 独逸の或学者は...
# 332: 尿毒といふものは...

# I will formulate the content string manually based on the grep/sed output.
# I am skipping headers/bullets to match standard content format.
# Note: '肩、背面腎臓部' (328) might be a "Pointos" list - usually kept? 
# Usually in `content` field we keep the running text. Points are often separate or at end.
# PT content for pf98 has 8 paragraphs. The above list has ~9 items if we count 328.

new_content = """腎臓といふものは「物を洗ふ水の働き」をするものであります。それで心臓が熱を吸収して毒素を焼熱すると灰が出来るから、其灰の如なものを水で洗って流す。－それが腎臓の役目であります。ですから、毒物に中ると、非常に下痢をしたり、小便が沢山出る。其際尿は、腎臓が洗った汚水であります。

腎臓はそういふ訳で、水の浄化作用の役目で、心臓は火の方の浄化作用の役目であります。ですから、心臓と腎臓は、重要な夫婦役になります。それで、心臓のシに濁りを打つと腎のジとなってゐるのも面白いと思ふのであります。

又、腎臓と肺臓が水で、心臓と肝臓が火の役とも言へるので、又、心臓が霊で肝臓は体、肺が霊で、腎臓は体とも言へるのであります。

腎臓病にも種々あります。腎臓結核、萎縮腎、腎盂炎等であります。

【腎臓結核】
よく萎縮腎を腎臓結核と誤られます。本当の腎臓結核は、右か左のどっちかの内部に水膿が溜結し、それが化膿して痛みを有つのであります。そうして、普通は膀胱へ移行するもので、非常に悪性で、小便に血液が混るのであります。

水膿溜結が腎臓を圧迫するので、腎臓は充分の活動が出来ないので、其の為尿が溢れる、其尿が毒素となり、又は浮腫になるのであります。

独逸の或学者は、「万病は尿酸が原因である」とも謂ってゐます。今も此説は相当認められてをるやうであります。リュウマチスで、赤く腫れないのは此尿毒が原因であります。私は之を腎臓性リュウマチスと言ってをりますが、非常に治り易く、此尿素は割合に弱性で、溶解し易いものであります。

尿毒といふものは、凡有る病気になります。よく腎臓が悪くて肩が凝る人がありますが、これは矢張り、尿毒が肩に集る人であります。
此尿毒は、肋膜、喘息の原因となる事もあります。ですから腎臓の為に喘息を起し、喘息の為に心臓病が起るんですから、間接には、腎臓が心臓病の原因になる訳であります。
腎臓の原因で脚気と似てゐる症状を起す事もあります。之は割合多いので、或は真の脚気より多いかも知れないと思ふ程で、足が重く腫れたりなどして、脚気の如な症状を起しますが、脚気とは全然異ふ。私は之を“腎臓脚気”と言ってをります。"""

f_path = 'data/fundamentos_ja.json'
with open(f_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

found = False
for item in data:
    if item['id'] == 'pf98':
        item['content'] = new_content
        found = True
        print("Updated pf98 content.")
        break

if found:
    with open(f_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
else:
    print("pf98 not found to update.")
