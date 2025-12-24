import json

# User provided content for Soron 3
pt_content = """Suprimir a Força Física no Johrei
Quem está ministrando o Johrei? Há um nódulo na região renal... Ainda é considerável. A falta de apetite deve-se também à febre. Há um nódulo no abdômen. Parece faltar um pouco de Força Espiritual. Nódulos assim costumam dissolver-se rapidamente... É necessário ministrar com mais frequência. Se continuar nesse ritmo, a vida corre perigo. É preciso que ocorra mais diarreia, caso contrário, não haverá solução.

O resultado depende da Força Espiritual de quem ministra. Se a Força Espiritual for intensa, a cura é imediata. Diz-se que a Força Espiritual é fraca porque se coloca força física; se não colocar força alguma, a energia torna-se extremamente intensa. Assim, a dissolução ocorre rapidamente.

É estranho que ainda não tenha curado... Creio que esteja colocando força no Johrei. Já deve ter sido advertido sobre isso. Está ministrando nas costas, certo? Naturalmente, é nas costas. Mas ainda há força. Caso contrário, já deveria ter curado. Diga-lhe para tirar mais a força. Como o problema está nas costas, deve-se tratar ali. Sem colocar força, com a intenção de atravessar para o outro lado. Isso é difícil. Trata-se de fazer a luz passar para o outro lado sem utilizar força física.

O ponto crucial é: quanto mais rígido estiver o local, menos força se deve colocar. Contudo, quanto mais duro, mais se tende a colocar força na tentativa de dissolver. Por isso não dissolve. Quando pensarem "isso não está dissolvendo", é certo que há força aplicada. A força deve ser mínima, quase inexistente, tocando suavemente, como se fosse algo "fofo". Apenas o Sonen (pensamento/intenção) deve ser firme, com o desejo de penetrar.

Quem está ministrando? O alvo está errado. Isso é, sem dúvida, Yakudoku (Veneno Medicinal). Pessoas assim têm febre originada nos gânglios linfáticos do pescoço. Como haverá inchaço em um dos lados do pescoço, deve-se tratar bem essa área; em seguida, verifique a medula oblonga, pois um dos lados estará inchado. Ministrando aí, a febre diminuirá. Se não diminuir, é porque há força no Johrei. Ao relaxar e tratar o local, a febre cederá gradualmente e a cura virá. Não é nada grave. Espaços intercostais, costas, região lombar — ao tratar essas áreas, a cura é relativamente simples."""

def update_soron3_pt():
    pt_json_path = 'data/fundamentos.json'
    try:
        pt_data = json.load(open(pt_json_path, encoding='utf-8'))
    except:
        print("Error loading PT data")
        return

    # Update soron_3
    found = False
    for i in pt_data:
        if i['id'] == 'soron_3':
            i['content'] = pt_content
            i['title'] = "Suprimir a Força Física no Johrei"
            found = True
            break
    
    if not found:
        pt_data.append({
            "id": "soron_3",
            "title": "Suprimir a Força Física no Johrei",
            "content": pt_content,
            "source": "User Provided",
            "tags": []
        })
        print("Created soron_3 in PT")
    else:
        print("Updated soron_3 in PT")

    with open(pt_json_path, 'w', encoding='utf-8') as f:
        json.dump(pt_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    update_soron3_pt()
