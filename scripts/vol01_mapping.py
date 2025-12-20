#!/usr/bin/env python3
"""
Mapeamento manual dos 6 itens do Vol.01 de Johrei Hō Kōza
Baseado na análise de palavras-chave e conteúdo
"""

# Mapeamento PT -> JP para Vol.01
VOL01_MAPPING = {
    "A Ineficácia dos Medicamentos": "六、薬が効かなくなった",
    "A Verdade sobre a Saúde": "三、健康の真理",
    "A Origem das Bactérias": "二、黴菌の発生",
    "O Ser Humano como Recipiente de Saúde": "四、人間は健康の器",
    "O Princípio do Johrei": "五、浄霊の原理",
    "O Que é a Doença": "一、病気とは何ぞや"
}

# Ordem lógica no documento japonês (baseado nos números)
# 一 (1) → O Que é a Doença
# 二 (2) → A Origem das Bactérias  
# 三 (3) → A Verdade sobre a Saúde
# 四 (4) → O Ser Humano como Recipiente de Saúde
# 五 (5) → O Princípio do Johrei
# 六 (6) → A Ineficácia dos Medicamentos

if __name__ == '__main__':
    print("📋 Mapeamento Vol.01 (6 itens)\n")
    for pt, jp in VOL01_MAPPING.items():
        print(f"PT: {pt}")
        print(f"JP: {jp}")
        print()
