import json

def find_id_by_content(data, snippet, label):
    print(f"--- Finding {label} ---")
    snippet_clean = snippet.strip()
    for item in data:
        content = item.get('content', '')
        if snippet_clean in content:
            print(f"FOUND {label}: ID={item['id']} Title={item['title']}")
            return item['id']
    print(f"NOT FOUND {label}")
    return None

try:
    pt_data = json.load(open('data/fundamentos.json', encoding='utf-8'))
except:
    print("Error loading JSON")
    exit()

# Snippets from headings/first lines (approximate)
# Explicação 01: "O Significado Fundamental da Criação da Arte Médica Japonesa"
# Note: Markdown headers usually not in 'content'. We search for body text.
# Let's read the files first to get body text... but I can't read files in this script easily without reading them from disk.
# I'll rely on unique phrases I saw in `head`.

# Explicação 01
# "Dentre as funções orgânicas, os rins desempenham" -> Pts 01
# "A Pesquisa Divina de Meishu-Sama" -> Exp 01?
find_id_by_content(pt_data, "A Pesquisa Divina de Meishu-Sama", "Explicacao 01")

# Explicação 02
# "O Significado Fundamental da Criação" -> Let's try this
find_id_by_content(pt_data, "O Significado Fundamental da Criação", "Explicacao 02 (Title Search)")

# Explicação 03
# "Ao Ministrar o Johrei" -> Maybe title?
find_id_by_content(pt_data, "Ao Ministrar o Johrei", "Explicacao 03 (Title Search)")

# Pontos Focais 02
# "Pontos Vitais Básicos do Johrei"
find_id_by_content(pt_data, "Pontos Vitais Básicos do Johrei", "Pontos Focais 02")

# Check if Pontos Focais 02 refers to Insomnia?
find_id_by_content(pt_data, "insônia", "Insomnia Check")
