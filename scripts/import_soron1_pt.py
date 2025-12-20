import json

# User provided content for Soron 1 (Preface)
pt_content = """Prefácio
O Mestre Mokichi Okada (Meishu-Sama), fundador da "Arte Médica Japonesa - Johrei", desejou ardentemente a verdadeira felicidade de toda a humanidade e preconizou a concretização de um mundo ideal na Terra, pautado na Saúde, na Prosperidade e na Paz.

Para tanto, compreendendo que a saúde é o alicerce fundamental da felicidade humana, ele dedicou-se a pesquisas visando o estabelecimento de um método de saúde genuíno. Assim, aperfeiçoou a "Arte Médica Japonesa - Johrei", posicionando-a como o papel central na criação de uma verdadeira civilização.

Este texto foi elaborado com o objetivo de estudar e aprender a teoria e a prática da "Arte Médica Japonesa - Johrei", baseada na ciência espiritual descoberta por Meishu-Sama. O conteúdo está organizado em três partes: Teoria Geral I e II, e Tratados Específicos, citando sempre os ensinamentos de Meishu-Sama. O leitor poderá encontrar passagens que parecem contradizer a medicina contemporânea. No entanto, ao observar a realidade de tantas pessoas gemendo sob o peso das doenças, Meishu-Sama afirmou:

Ao observar a humanidade atual, sou forçado a dizer que seu estado é demasiado miserável. Ver tal situação causa-me um sofrimento insuportável. (Trecho de "Um Sofrimento")

Como se vê, trata-se de advertências e propostas nascidas de um incontrolável amor pela humanidade, e não de uma negação da medicina. Isso fica evidente no seguinte ensinamento:

Parece haver entre os fiéis desta religião quem, ao ministrar o Johrei, profira palavras que neguem a consulta médica, o uso de remédios ou injeções. Isso é um equívoco quanto ao objetivo desta religião e pode gerar mal-entendidos na sociedade, ferindo a imagem da nossa doutrina. Portanto, peço que tenham muita cautela e reitero aqui a advertência para que nunca neguem a medicina. (Trecho da Revista Paraíso Terrestre, nº 17)

Acolhendo firmemente este sentimento de Meishu-Sama, desejamos respeitar as diversas conquistas da medicina moderna, que avança visando a saúde humana, e cooperar mutuamente para contribuir na construção de uma verdadeira saúde.

Para a elaboração deste texto, contamos com a supervisão do Dr. Kazuo Nitta, ex-diretor do Instituto de Pesquisa do Centro de Câncer de Chiba, a quem expressamos nossa profunda gratidão.

1º de abril de 1991"""

def update_soron1():
    pt_json_path = 'data/fundamentos.json'
    try:
        pt_data = json.load(open(pt_json_path, encoding='utf-8'))
    except:
        print("Error loading PT data")
        return

    # Update soron_1
    found = False
    for i in pt_data:
        if i['id'] == 'soron_1':
            i['content'] = pt_content
            i['title'] = "Prefácio" # Better title
            found = True
            break
    
    if not found:
        # Should have been created in previous step, but just in case
        pt_data.insert(0, {
            "id": "soron_1",
            "title": "Prefácio",
            "content": pt_content,
            "source": "User Provided",
            "tags": []
        })
        print("Created soron_1 in PT")
    else:
        print("Updated soron_1 in PT")

    with open(pt_json_path, 'w', encoding='utf-8') as f:
        json.dump(pt_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    update_soron1()
