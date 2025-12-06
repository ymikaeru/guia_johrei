// Tag Browser - Categorized tag organization and filtering

const TAG_CATEGORIES = {
    'Corpo e Sistemas': [
        'Sistema Digestivo',
        'Coração e Circulação',
        'Rins e Sistema Urinário',
        'Respiratório',
        'Cabeça e Pescoço',
        'Pele',
        'Dentes e Boca',
        'Olhos e Visão',
        'Ouvidos e Audição',
        'Digestivo'
    ],
    'Condições e Sintomas': [
        'Dores e Rigidez',
        'Gripe e Resfriado',
        'Febre e Gripe',
        'Tuberculose',
        'Diabetes',
        'Asma',
        'Hipertensão',
        'Derrame (AVC)',
        'Neuralgia',
        'Artrite',
        'Anemia'
    ],
    'Conceitos Johrei': [
        'Ministração de Johrei',
        'Toxinas e Medicamentos',
        'Purificação',
        'Mundo Espiritual',
        'Pontos Vitais'
    ],
    'Outros': [
        'Saúde da Criança',
        'Gravidez e Saúde da Mulher',
        'Saúde da Mulher',
        'Arte e Beleza',
        'Agricultura e Alimentação',
        'Caso Clínico'
    ]
};

function initializeTagBrowser() {
    const wrapper = document.getElementById('tagBrowserWrapper');
    const content = document.getElementById('tagBrowserContent');

    if (!wrapper || !content) return;

    // 1. Hide on specific tabs (Favorites, Map)
    // Note: main.js also handles this in updateUIForTab, but this acts as a safeguard/init logic
    if (typeof STATE !== 'undefined' && (STATE.activeTab === 'favoritos' || STATE.activeTab === 'mapa')) {
        wrapper.style.display = 'none';
        return;
    }

    // 2. Check if current items have any tags
    const activeTab = STATE.activeTab;
    const items = STATE.data[activeTab] || [];

    // Collect all tags from current items
    const availableTags = new Set();
    items.forEach(item => {
        if (item.tags) {
            item.tags.forEach(tag => availableTags.add(tag));
        }
    });

    if (availableTags.size === 0) {
        wrapper.style.display = 'none';
        return;
    }

    // 3. Show wrapper if conditions met
    wrapper.style.display = 'block';

    // 4. Group tags by category
    const categories = {};
    const uncategorized = [];

    availableTags.forEach(tag => {
        let found = false;
        for (const [cat, tags] of Object.entries(TAG_CATEGORIES)) {
            if (tags.includes(tag)) {
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(tag);
                found = true;
                break;
            }
        }
        if (!found) uncategorized.push(tag);
    });

    // 5. Render HTML
    let html = '';

    // Render categorized tags
    for (const [cat, tags] of Object.entries(categories)) {
        if (tags.length === 0) continue;
        html += `
            <div>
                <h4 class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">${cat}</h4>
                <div class="flex flex-wrap gap-2">
                    ${tags.sort().map(tag => renderTagButton(tag)).join('')}
                </div>
            </div>
        `;
    }

    // Render uncategorized
    if (uncategorized.length > 0) {
        html += `
            <div>
                <h4 class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Outros</h4>
                <div class="flex flex-wrap gap-2">
                    ${uncategorized.sort().map(tag => renderTagButton(tag)).join('')}
                </div>
            </div>
        `;
    }

    content.innerHTML = html;
}

function renderTagButton(tag) {
    const isActive = STATE.activeTags.includes(tag);
    const activeClass = isActive
        ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
        : 'bg-white dark:bg-[#111] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white';

    return `
        <button onclick="toggleTag('${tag}')" 
                class="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border rounded-md transition-all ${activeClass}">
            ${tag}
        </button>
    `;
}

function toggleTagBrowser() {
    const content = document.getElementById('tagBrowserContent');
    const icon = document.getElementById('tagBrowserIcon');

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
    }
}

function toggleTag(tag) {
    const index = STATE.activeTags.indexOf(tag);

    if (index > -1) {
        // Remove tag
        STATE.activeTags.splice(index, 1);
    } else {
        // Add tag
        STATE.activeTags.push(tag);
    }

    // Re-initialize to update button states (simple way)
    initializeTagBrowser();

    // Apply filters in main app
    if (typeof applyFilters === 'function') {
        applyFilters();
    }
}

// Make functions global
window.initializeTagBrowser = initializeTagBrowser;
window.toggleTagBrowser = toggleTagBrowser;
window.toggleTag = toggleTag;
