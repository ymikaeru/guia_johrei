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

    // Only show on ensinamentos/explicacoes mode and NOT on map tab, OR if there are active filters
    const hasActiveFilters = (STATE.activeTags && STATE.activeTags.length > 0) ||
        (STATE.activeCategories && STATE.activeCategories.length > 0) ||
        (STATE.activeSources && STATE.activeSources.length > 0) ||
        (STATE.activeFocusPoints && STATE.activeFocusPoints.length > 0) ||
        STATE.bodyFilter;

    const allowedModes = ['ensinamentos', 'explicacoes'];

    if ((!allowedModes.includes(STATE.mode) || STATE.activeTab === 'mapa') && !hasActiveFilters) {
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
            return `
                            <button onclick="toggleFilter('source', '${src.replace(/'/g, "\\'")}')" 
                                class="tag-pill ${isActive ? 'tag-pill-active' : ''}">
                                <span>${src}</span>
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
    // BUT if we are showing because of active filters (and arguably normally hidden), maybe default to hidden?
    // Actually, keep logic simple: check localStorage.

    // Logic for toggle button visibility: HIDE toggle if not in allowed modes
    const toggleBtn = document.getElementById('tagBrowserToggle');
    // allowedModes is already defined above.


    if (!allowedModes.includes(STATE.mode) || STATE.activeTab === 'mapa') {
        if (toggleBtn) toggleBtn.style.display = 'none';
        // content should be hidden if button hidden? No, content is toggled.
        // If button hidden, user can't toggle. Content should be hidden.
        content.classList.add('hidden');
    } else {
        if (toggleBtn) toggleBtn.style.display = 'flex';

        // const isExpanded = localStorage.getItem('tagBrowserExpanded') === 'true'; 
        // Force closed by default as per user request
        const isExpanded = false;

        if (isExpanded) {
            content.classList.remove('hidden');
            document.getElementById('tagBrowserIcon').style.transform = 'rotate(180deg)';
        } else {
            content.classList.add('hidden');
            document.getElementById('tagBrowserIcon').style.transform = 'rotate(0deg)';
        }
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

        // Remove click listener immediately
        document.removeEventListener('click', closeByOutsideClick);
    } else {
        content.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
        localStorage.setItem('tagBrowserExpanded', 'true');

        // Add click listener to close when clicking outside
        // Delay slightly to prevent the current click from closing it immediately
        setTimeout(() => {
            document.addEventListener('click', closeByOutsideClick);
        }, 10);
    }
}

function closeByOutsideClick(event) {
    const wrapper = document.getElementById('tagBrowserWrapper');
    if (wrapper && !wrapper.contains(event.target)) {
        // Toggle (Close)
        toggleTagBrowser();
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
