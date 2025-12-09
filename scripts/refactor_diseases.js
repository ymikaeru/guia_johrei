const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/pontos_focais.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Configuration for splitting
const refactorConfig = {
    "pf121": {
        titles: [
            "Indigestão (Dispepsia)",
            "Desenvolvimento Deficiente",
            "Úlcera Gástrica Infantil",
            "Coqueluche",
            "Meningite",
            "Choro Noturno (Manha)",
            "Escarlatina",
            "Disenteria Infantil (Ekiri)",
            "Paralisia Infantil (Poliomielite)",
            "Sarampo",
            "Asma Infantil",
            "Pneumonia Infantil",
            "Hérnia (Deslocamento do Intestino)",
            "Difteria"
        ],
        baseId: "pf_child",
        categoryName: "Doenças Infantis"
    },
    "pf124": {
        titles: [
            "Sarna e Doenças de Pele",
            "Beribéri",
            "Nevralgia",
            "Reumatismo",
            "Enurese Noturna (Xixi na Cama)",
            "Ronco"
        ],
        baseId: "pf_other",
        categoryName: "Câncer e Outras Doenças"
    }
};

const newItems = [];
const idsToRemove = new Set(Object.keys(refactorConfig));

data.forEach(item => {
    if (refactorConfig[item.id]) {
        const config = refactorConfig[item.id];
        const content = item.content;

        let remainingContent = content;

        config.titles.forEach((title, index) => {
            // Regex to find start of this item: "1) Title"
            // We use simple string finding because regex with dynamic title is tricky with special chars
            // Check for "1) Title" or "10) Title"
            const num = index + 1;
            const searchStr = `${num}) ${title}`;

            const startIndex = remainingContent.indexOf(searchStr);
            if (startIndex === -1) {
                console.warn(`Could not find sub-item: ${searchStr} in ${item.id}`);
                return;
            }

            // Find end of this item (start of next item or end of string)
            // Next item starts with "num+1) "
            // BUT careful, "12)" vs "1)"
            const nextNum = num + 1;
            // Look for "\n\nnextNum) " or just "nextNum) " if at start of line
            // The content has newlines between items.
            // Safe bet: Look for "\n\n" followed by nextNum + ") "

            // Actually, we can just slice from startIndex.
            // And find the NEXT title in the list?
            // Or look for any pattern `\n\n\d+\)`

            const contentStart = startIndex + searchStr.length;

            // Detect end index
            let endIndex = remainingContent.length;
            const nextItemPattern = new RegExp(`\\n\\n${nextNum}\\)`);
            const match = remainingContent.slice(startIndex).match(nextItemPattern);

            if (match) {
                endIndex = startIndex + match.index;
            }

            // Extract Content
            let itemBody = remainingContent.substring(contentStart, endIndex).trim();

            // Create New Item
            const newItem = {
                id: `${config.baseId}_${num}`,
                title: title,
                content: itemBody,
                category: config.categoryName, // Explicit category
                source: item.source, // Keep source
                tags: [...(item.tags || []), config.categoryName], // Inherit tags + Category
                focusPoints: item.focusPoints || [], // Inherit (mostly empty)
                system: item.system,
                order: item.order + (index * 0.1), // Keep relative order
                type: "Caso Clínico" // Assuming these are cases/descriptions
            };

            newItems.push(newItem);
        });

    } else {
        newItems.push(item);
    }
});

// Replace the original items (which were NOT pushed to newItems because of else block? 
// No, the logic was: `if (refactor) { process } else { push }`.
// But inside `if`, I am pushing ONLY the new generated items.
// So the original `pf121` and `pf124` effectively disappear. Correct.

// Write back
fs.writeFileSync(dataPath, JSON.stringify(newItems, null, 2), 'utf8');
console.log(`Refactor complete. Generated ${newItems.length} total items.`);
