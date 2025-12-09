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
        'Digestivo',
        'Sistema Nervoso e Cabeça', // Added from enrichment
        'Sistema Reprodutor'      // Added from enrichment
    ],
    'Público e Ciclo de Vida': [ // New Category
        'Saúde da Criança',
        'Doenças Infantis',
        'Saúde da Mulher',
        'Gravidez e Saúde da Mulher',
        'Doenças Femininas'
    ],
    'Condições e Sintomas': [
        'Dores e Rigidez',
        'Gripe e Resfriado',
        'Febre',
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
        'Arte e Beleza',
        'Agricultura e Alimentação',
        'Caso Clínico'
    ]
};

const ICON_MAP = {
    'Coração e Circulação': '❤️',
    'Rins e Sistema Urinário': '💧',
    'Respiratório': '🫁',
    'Sistema Respiratório': '🫁',
    'Cabeça e Pescoço': '🧠',
    'Sistema Nervoso e Cabeça': '🧠',
    'Sistema Digestivo': '🍽️',
    'Digestivo': '🍽️',
    'Olhos e Visão': '👁️',
    'Ouvidos e Audição': '👂',
    'Dentes e Boca': '🦷',
    'Pele': '🖐️',
    'Sistema Reprodutor': '♀️',
    'Saúde da Mulher': '👩',
    'Gravidez e Saúde da Mulher': '🤰',
    'Saúde da Criança': '👶',
    'Doenças Infantis': '👶',
    'Mundo Espiritual': '👻',
    'Purificação': '✨',
    'Ministração de Johrei': '✋'
};

function formatSourceLabel(src) {
    if (src.includes('Johrei Hõ Kõza')) {
        return src.replace('Johrei Hõ Kõza ', 'Vol. ');
    }
    if (src.includes('Estudos Específicos')) {
        return src.replace('Estudos Específicos ', 'Estudos ');
    }
    return src;
}

function initializeTagBrowser() {
    const wrapper = document.getElementById('tagBrowserWrapper');
    const content = document.getElementById('tagBrowserContent');

    if (!wrapper || !content) return;

    // Only show on ensinamentos/explicacoes mode and NOT on map tab, OR if there are active filters
    const hasActiveFilters = (STATE.activeTags && STATE.activeTags.length > 0) ||
        (STATE.activeCategories && STATE.activeCategories.length > 0) ||
        (STATE.activeSources && STATE.activeSources.length > 0) ||
        (STATE.activeFocusPoints && STATE.activeFocusPoints.length > 0) ||
        STATE.bodyFilter;

    const allowedModes = ['ensinamentos', 'explicacoes'];

    if ((!allowedModes.includes(STATE.mode) || STATE.activeTab === 'mapa' || STATE.activeTab === 'apostila') && !hasActiveFilters) {
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

    // --- INJECT SOURCES SECTION ---
    let html = '';

    // Get unique sources
    const allItems = STATE.data[STATE.activeTab] || [];
    const sourceCounts = {};
    allItems.forEach(item => {
        if (item.source) {
            sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
        }
    });
    const validSources = Object.keys(sourceCounts).sort();

    if (validSources.length > 0) {
        html += `
            <div class="tag-category">
                <div class="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3">Fontes</div>
                <div class="flex flex-wrap gap-2">
                    ${validSources.map(src => {
            const count = sourceCounts[src];
            const isActive = STATE.activeSources.includes(src);
            const label = formatSourceLabel(src);
            return `
                            <button onclick="toggleFilter('source', '${src.replace(/'/g, "\\'")}')" 
                                class="tag-pill ${isActive ? 'tag-pill-active' : ''} text-xs">
                                <span>${label}</span>
                                <span class="tag-count">${count}</span>
                            </button>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    // Generate HTML for each category
    for (const [category, tags] of Object.entries(TAG_CATEGORIES)) {
        // Filter to only tags that exist in data
        const availableTags = tags.filter(tag => tagCounts[tag] > 0);

        if (availableTags.length === 0) continue;

        html += `
            <div class="tag-category">
                <div class="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3 mt-4">${category}</div>
                <div class="flex flex-wrap gap-2">
                    ${availableTags.map(tag => {
            const count = tagCounts[tag] || 0;
            const isActive = STATE.activeTags.includes(tag);
            const icon = ICON_MAP[tag] ? `<span class="mr-1 opacity-70">${ICON_MAP[tag]}</span>` : '';
            return `
                            <button onclick="toggleTag('${tag.replace(/'/g, "\\'")}', event)" 
                                class="tag-pill ${isActive ? 'tag-pill-active' : ''}"
                                data-tag="${tag}">
                                ${icon}
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


    // Logic for toggle button visibility: HIDE toggle if not in allowed modes
    const toggleBtn = document.getElementById('tagBrowserToggle');

    if (!allowedModes.includes(STATE.mode) || STATE.activeTab === 'mapa') {
        if (toggleBtn) toggleBtn.style.display = 'none';
        content.classList.add('hidden');
    } else {
        if (toggleBtn) toggleBtn.style.display = 'flex';

        // Force closed by default as per user request
        const isExpanded = false;

        if (isExpanded) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    }
}

function toggleTagBrowser() {
    const content = document.getElementById('tagBrowserContent');

    const isExpanded = !content.classList.contains('hidden');

    if (isExpanded) {
        content.classList.add('hidden');
        localStorage.setItem('tagBrowserExpanded', 'false');
        document.removeEventListener('click', closeByOutsideClick);
    } else {
        content.classList.remove('hidden');
        localStorage.setItem('tagBrowserExpanded', 'true');
        setTimeout(() => {
            document.addEventListener('click', closeByOutsideClick);
        }, 10);
    }
}

function closeByOutsideClick(event) {
    const wrapper = document.getElementById('tagBrowserWrapper');
    if (wrapper && !wrapper.contains(event.target)) {
        toggleTagBrowser();
    }
}

function toggleTag(tag, event) {
    if (event) event.preventDefault();

    const index = STATE.activeTags.indexOf(tag);

    if (index > -1) {
        STATE.activeTags.splice(index, 1);
    } else {
        STATE.activeTags.push(tag);
    }

    updateTagPillStates();
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

window.toggleTagBrowser = toggleTagBrowser;
window.toggleTag = toggleTag;
