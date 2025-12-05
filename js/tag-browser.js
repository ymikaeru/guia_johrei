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

    // Only show on ensinamentos mode and NOT on map tab
    if (STATE.mode !== 'ensinamentos' || STATE.activeTab === 'mapa') {
        wrapper.style.display = 'none';
        return;
    }

    wrapper.style.display = 'block';

    // Get all tags from current data with counts
    const tagCounts = {};
    if (STATE.data && STATE.data[STATE.activeTab]) {
        STATE.data[STATE.activeTab].forEach(item => {
            const tags = item.tags || [];
            tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
    }

    // Generate HTML for each category
    let html = '';
    for (const [category, tags] of Object.entries(TAG_CATEGORIES)) {
        // Filter to only tags that exist in data
        const availableTags = tags.filter(tag => tagCounts[tag] > 0);

        if (availableTags.length === 0) continue;

        html += `
            <div class="tag-category">
                <div class="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3">${category}</div>
                <div class="flex flex-wrap gap-2">
                    ${availableTags.map(tag => {
            const count = tagCounts[tag] || 0;
            const isActive = STATE.activeTags.includes(tag);
            return `
                            <button onclick="toggleTag('${tag.replace(/'/g, "\\'")}', event)" 
                                class="tag-pill ${isActive ? 'tag-pill-active' : ''}"
                                data-tag="${tag}">
                                <span>${tag}</span>
                                <span class="tag-count">${count}</span>
                            </button>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    content.innerHTML = html;

    // Restore collapsed state from localStorage
    const isExpanded = localStorage.getItem('tagBrowserExpanded') === 'true';
    if (isExpanded) {
        content.classList.remove('hidden');
        document.getElementById('tagBrowserIcon').style.transform = 'rotate(180deg)';
    }
}

function toggleTagBrowser() {
    const content = document.getElementById('tagBrowserContent');
    const icon = document.getElementById('tagBrowserIcon');

    const isExpanded = !content.classList.contains('hidden');

    if (isExpanded) {
        content.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
        localStorage.setItem('tagBrowserExpanded', 'false');
    } else {
        content.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
        localStorage.setItem('tagBrowserExpanded', 'true');
    }
}

function toggleTag(tag, event) {
    if (event) event.preventDefault();

    const index = STATE.activeTags.indexOf(tag);

    if (index > -1) {
        // Remove tag
        STATE.activeTags.splice(index, 1);
    } else {
        // Add tag
        STATE.activeTags.push(tag);
    }

    // Update UI
    updateTagPillStates();

    // Apply filters
    applyFilters();
}

function updateTagPillStates() {
    document.querySelectorAll('.tag-pill').forEach(pill => {
        const tag = pill.dataset.tag;
        if (STATE.activeTags.includes(tag)) {
            pill.classList.add('tag-pill-active');
        } else {
            pill.classList.remove('tag-pill-active');
        }
    });
}

// Export functions to global scope
window.toggleTagBrowser = toggleTagBrowser;
window.toggleTag = toggleTag;
