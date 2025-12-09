
// --- LAYOUT HELPER FOR MAP MODE ---
function updateMapLayout(activeTab) {
    // Reverted: User wants specific sidebar scroll, handled in render logic.
}

function renderTabs() {
    const container = document.getElementById('tabsContainer');

    const catMap = CONFIG.modes[STATE.mode].cats;

    // Check if search is active (Global Search visual feedback)
    const searchQuery = document.getElementById('searchInput')?.value?.trim() || '';
    const hasActiveFilters = STATE.activeTags.length > 0 || STATE.activeCategories.length > 0 || STATE.activeSources.length > 0 || STATE.activeFocusPoints.length > 0;
    const isSearchActive = searchQuery.length > 0 || hasActiveFilters;

    // Desktop Tabs
    let html = '';
    if (STATE.data) {
        html = Object.keys(STATE.data).map(id => {
            const active = !isSearchActive && STATE.activeTab === id;
            const config = catMap[id];
            const label = config ? config.label : id;
            const activeClass = active
                ? `border-${config ? config.color : 'gray-900'} text-${config ? config.color : 'gray-900'}`
                : 'border-transparent hover:text-black dark:hover:text-white text-gray-400';

            return `<button onclick="setTab('${id}')" class="tab-btn ${activeClass}">${label}</button>`;
        }).join('');
    }

    // Adiciona aba Mapa apenas no modo ensinamentos
    if (STATE.mode === 'ensinamentos') {
        const active = !isSearchActive && STATE.activeTab === 'mapa';
        const activeClass = active
            ? `border-cat-dark text-cat-dark dark:border-white dark:text-white`
            : 'border-transparent hover:text-black dark:hover:text-white text-gray-400';
        html += `<button onclick="setTab('mapa')" class="tab-btn ${activeClass}">Mapas de Aplicação</button>`;
    }

    // Adiciona aba Apostilas se houver itens (Modo Específico)
    const currentApostila = STATE.apostilas ? STATE.apostilas[STATE.mode] : null;
    if (currentApostila && currentApostila.items.length > 0) {
        const active = !isSearchActive && STATE.activeTab === 'apostila';
        const activeClass = active
            ? 'border-yellow-500 text-yellow-500' // Gold color for Apostila
            : 'border-transparent hover:text-black dark:hover:text-white text-gray-400';

        let label = currentApostila.title || 'Apostila';
        if (label.length > 15) label = label.substring(0, 12) + '...';

        html += `<button onclick="setTab('apostila')" class="tab-btn ${activeClass} flex items-center gap-2 ml-auto">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
            ${label}
            <span class="text-[0.65em] font-bold bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full ml-1 ${active ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30' : ''}">${currentApostila.items.length}</span>
        </button>`;
    }

    container.innerHTML = html;

    // Mobile Dropdown Options (Custom)
    const mobileOptionsContainer = document.getElementById('mobileDropdownOptions');
    const mobileLabel = document.getElementById('mobileDropdownLabel');

    if (mobileOptionsContainer) {
        let optionsHtml = Object.keys(STATE.data).map(id => {
            const config = catMap[id];
            const label = config ? config.label : id;
            const isActive = STATE.activeTab === id;

            if (isActive) {
                if (mobileLabel) mobileLabel.textContent = label;
                return ''; // Don't show active item in list
            }

            return `
            <button onclick="selectMobileOption('${id}')"
                class="w-full text-left py-4 px-6 text-xs font-bold uppercase tracking-widest border-b border-gray-50 dark:border-gray-900 last:border-0 transition-colors text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white">
                ${label}
            </button>
    `;
        }).join('');

        // Add Map Option to Mobile
        if (STATE.mode === 'ensinamentos') {
            const isMapActive = STATE.activeTab === 'mapa';
            if (!isMapActive) {
                optionsHtml += `
                 <button onclick="selectMobileOption('mapa')" class="w-full text-left py-4 px-6 text-xs font-bold uppercase tracking-widest border-b border-gray-50 dark:border-gray-900 last:border-0 transition-colors text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white">MAPAS DE APLICAÇÃO</button>`;
            } else if (mobileLabel && STATE.activeTab === 'mapa') {
                mobileLabel.textContent = "MAPAS DE APLICAÇÃO";
            }
        }

        // Add Apostila Option to Mobile
        const currentApostila = STATE.apostilas ? STATE.apostilas[STATE.mode] : null;
        if (currentApostila && currentApostila.items.length > 0) {
            const isApostilaActive = STATE.activeTab === 'apostila';
            const label = (currentApostila.title || 'MINHA APOSTILA').toUpperCase();
            if (!isApostilaActive) {
                optionsHtml += `
                 <button onclick="selectMobileOption('apostila')" class="w-full text-left py-4 px-6 text-xs font-bold uppercase tracking-widest border-b border-gray-50 dark:border-gray-900 last:border-0 transition-colors text-yellow-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-yellow-600 flex justify-between">
                    <span>${label}</span>
                    <span class="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full">${currentApostila.items.length}</span>
                 </button>`;
            } else if (mobileLabel && STATE.activeTab === 'apostila') {
                mobileLabel.innerHTML = `${label} <span class="ml-2 text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md align-middle">${currentApostila.items.length}</span>`;
            }
        }

        mobileOptionsContainer.innerHTML = optionsHtml;
    }

    updateUIForTab(STATE.activeTab);
}

function renderBodyMapViews() {
    const map = document.getElementById('bodyMapContainer');
    if (!map) return;

    // Render Interactive Body Maps
    const views = [
        { id: 'front', img: 'assets/images/mapa_corporal_1.jpg', alt: 'Frente', points: BODY_DATA.points.front },
        { id: 'detail', img: 'assets/images/mapa_corporal_3.jpg', alt: 'Detalhes', points: BODY_DATA.points.detail },
        { id: 'back', img: 'assets/images/mapa_corporal_2.jpg', alt: 'Costas', points: BODY_DATA.points.back }
    ];

    let html = `
    <div class="flex flex-col lg:flex-row gap-8 mb-12 max-w-[100rem] mx-auto items-start">
        <!-- Sidebar (Desktop Only) -->
        <div class="hidden lg:block w-72 flex-shrink-0 bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 sticky top-4 rounded-sm shadow-sm" style="height: 500px; overflow-y: auto !important;">
                <div class="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#151515]">
                <p class="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Filtrar por Região</p>
                </div>
                <div id="bodyPointSidebarList">
                <div class="px-5 py-3 cursor-pointer text-[10px] font-bold uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 last:border-0 transition-all group hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-gray-400"
                    onclick="selectCustomOption('', '-- Todos os pontos --', event)">
                    -- Todos os pontos --
                </div>
                ${typeof generateSidebarOptions === 'function' ? generateSidebarOptions() : ''}
                </div>
        </div>

        <!-- Mobile Maps Area -->
        <div class="w-full lg:hidden mb-6 px-4">
             <div class="bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
                <button onclick="const el = document.getElementById('mobileBodyFilterList'); el.classList.toggle('hidden');" 
                    class="w-full px-4 py-3 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 dark:hover:bg-[#151515]">
                    <span>Filtrar por Região</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div id="mobileBodyFilterList" class="hidden border-t border-gray-100 dark:border-gray-800 max-h-64 overflow-y-auto">
                     <div class="px-5 py-3 cursor-pointer text-[10px] font-bold uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 last:border-0 transition-all text-gray-400 hover:text-black dark:hover:text-white"
                        onclick="selectCustomOption('', '-- Todos os pontos --', event); document.getElementById('mobileBodyFilterList').classList.add('hidden');">
                        -- Todos os pontos --
                    </div>
                    ${typeof generateSidebarOptions === 'function' ? generateSidebarOptions() : ''}
                </div>
             </div>
        </div>

            <div id="mobile-map-container" class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        ${views.map((view, i) => {
        const visibilityClass = i === 0 ? 'block' : 'hidden'; // Only first visible on mobile initial
        return `
            <div id="view-${view.id}" class="${visibilityClass} md:block relative group transition-all duration-300">
                <p class="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">${view.alt}</p>
                <div class="relative inline-block w-full bg-white dark:bg-[#111] rounded-lg p-2">
                    <img src="${view.img}" alt="${view.alt}" class="w-full h-auto object-contain" id="${view.id}_img" />
                    <svg class="absolute inset-0 w-full h-full pointer-events-none" id="${view.id}_svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                        ${renderBodyPoints(view.points, view.id)}
                    </svg>
                </div>
            </div>`;
    }).join('')}
        </div>
    </div>
    
    <!-- Mobile Tabs (Below map for easy access) -->
    <div class="flex md:hidden justify-center gap-3 mt-6 w-full">
            ${views.map((v, i) => `
                <button onclick="switchMobileView('${v.id}')"
                    id="tab-${v.id}"
                    class="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border rounded-md transition-all ${i === 0 ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'bg-white dark:bg-black text-gray-400 border-gray-200 dark:border-gray-800'}">
                    ${v.alt}
                </button>
        `).join('')}
    </div>
    `;

    map.innerHTML = html;
}

function updateUIForTab(tabId) {
    const alpha = document.getElementById('alphabetWrapper');
    const map = document.getElementById('bodyMapContainer');
    const list = document.getElementById('contentList');
    const empty = document.getElementById('emptyState');
    const searchInputs = document.querySelectorAll('.search-input');

    alpha.classList.add('hidden');
    map.classList.add('hidden');
    list.classList.remove('hidden'); // Ensure list is visible by default for standard tabs and Apostila
    if (empty) empty.classList.add('hidden'); // Default hide empty

    if (tabId === 'pontos_focais') {
        alpha.classList.remove('hidden');
        renderAlphabet();
    }

    if (tabId === 'mapa') {
        searchInputs.forEach(input => input.classList.add('input-faded'));
        map.classList.remove('hidden');

        // Intelligent Visibility: Only hide list if NO point is selected
        // We check both legacy STATE.bodyFilter and new STATE.selectedBodyPoint
        const hasSelection = STATE.bodyFilter || (STATE.selectedBodyPoint && STATE.selectedBodyPoint.length > 0);

        if (hasSelection) {
            list.classList.remove('hidden');
        } else {
            list.classList.add('hidden');
        }

        renderBodyMapViews(); // Ensure this helper exists or inline logic
    } else if (tabId === 'apostila') {
        searchInputs.forEach(input => input.classList.add('input-faded')); // Hide search for Apostila

        // Hide Tag Browser / Add All buttons in Apostila to avoid confusion
        const tagBrowser = document.getElementById('tagBrowserWrapper');
        if (tagBrowser) tagBrowser.style.display = 'none';

        // Remove Grid Layout for Apostila (It handles its own layout)
        list.className = ''; // Reset classes (removes grid/cols/gap)

        if (typeof renderApostilaView === 'function') {
            renderApostilaView();
        }
    } else {
        searchInputs.forEach(input => input.classList.remove('input-faded'));

        // Show Tag Browser for normal tabs
        const tagBrowser = document.getElementById('tagBrowserWrapper');
        if (tagBrowser) tagBrowser.style.display = 'block';

        // Restore Standard Grid Layout
        list.className = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-12 pt-12';

        // Standard list view is handled by applyFilters() which is called in setTab
    }
}

/* Observer removed as we are back to tab switching */
function updateTabStyle(activeId) {
    // Legacy function, can be removed or kept empty if other things call it
}

function renderPoints(points, prefix) {
    return points.map(p => {
        const isSelected = STATE.bodyFilter === p.id;
        const activeClass = isSelected ? 'bg-black text-white dark:bg-white dark:text-black scale-125 z-10' : 'bg-white dark:bg-black border border-gray-200 dark:border-gray-800 hover:scale-110';

        return `
        <button onclick="toggleBodyPoint('${p.id}')"
    class="absolute w-3 h-3 rounded-full shadow-sm transition-all duration-300 flex items-center justify-center group ${activeClass}"
    style="left: ${p.x - 1.5}px; top: ${p.y - 1.5}px;"
    title="${p.name}">
        <span class="sr-only">${p.name}</span>
        </button>
        `;
    }).join('');
}

function renderActiveFilters() {
    const container = document.getElementById('activeFiltersWrapper');
    if (!container) return;

    // HIDE filters if in Apostila view (User request)
    if (STATE.activeTab === 'apostila') {
        container.innerHTML = '';
        container.classList.add('hidden');
        return;
    } else {
        container.classList.remove('hidden');
    }

    let items = [];

    // Categories
    if (STATE.activeCategories) {
        STATE.activeCategories.forEach(catId => {
            const label = CONFIG.modes[STATE.mode].cats[catId]?.label || catId;
            items.push({ text: label, onclick: `toggleFilter('category', '${catId}')` });
        });
    }

    // Sources
    if (STATE.activeSources) {
        STATE.activeSources.forEach(src => {
            items.push({
                text: src,
                onclick: `toggleFilter('source', '${src.replace(/'/g, "\\'")}')`
            });
        });
    }

    // Tags
    if (STATE.activeTags) {
        STATE.activeTags.forEach(tag => {
            items.push({ text: '#' + tag, onclick: `filterByTag('${tag.replace(/'/g, "\\'")}')` });
        });
    }

    // Focus Points (New)
    if (STATE.activeFocusPoints) {
        STATE.activeFocusPoints.forEach(fp => {
            items.push({ text: 'Ponto: ' + fp, onclick: `filterByFocusPoint('${fp.replace(/'/g, "\\'")}')` });
        });
    }

    // Body Filter
    if (STATE.bodyFilter) {
        // Find body point name if possible
        const point = BODY_DATA && BODY_DATA.points ?
            (BODY_DATA.points.front.find(p => p.id === STATE.bodyFilter) ||
                BODY_DATA.points.back.find(p => p.id === STATE.bodyFilter) ||
                BODY_DATA.points.detail.find(p => p.id === STATE.bodyFilter))
            : null;

        const label = point ? point.name : STATE.bodyFilter;
        items.push({ text: 'Região: ' + label, onclick: `toggleBodyPoint('${STATE.bodyFilter}')` });
    }

    if (items.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    // Generate Chips HTML
    const chipsHtml = items.map(item => `
        <button onclick="${item.onclick}" class="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:border-red-400 hover:text-red-500 transition-all shadow-sm">
            <span>${item.text}</span>
            <svg class="w-3 h-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
    `).join('');

    // Prepend Label
    container.innerHTML = `
        <span class="text-[10px] font-bold uppercase tracking-widest text-gray-300 self-center mr-2">Filtros:</span>
        ${chipsHtml}
    `;
}

function updateSearchPlaceholder() {
    const inputs = document.querySelectorAll('.search-input');
    const placeholder = STATE.mode === 'ensinamentos'
        ? 'Somente Ensinamentos'
        : 'Somente Guias';

    inputs.forEach(input => {
        input.placeholder = placeholder;
    });
}

function renderAlphabet() {
    const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const container = document.getElementById('alphabetContainer');
    const currentData = STATE.data[STATE.activeTab] || [];
    const availableLetters = new Set(currentData.map(i => i.title ? i.title.charAt(0).toUpperCase() : ''));

    // Clear container
    container.innerHTML = `<button onclick="filterByLetter('')" class="flex-none w-10 h-10 flex items-center justify-center text-xs font-bold border border-gray-200 dark:border-gray-800 rounded-full transition-all ${STATE.activeLetter === '' ? 'btn-swiss-active' : 'bg-white dark:bg-black'}" id="btn-letter-all">*</button>`;

    abc.forEach(l => {
        if (availableLetters.has(l)) {
            const active = STATE.activeLetter === l ? 'btn-swiss-active' : 'bg-white dark:bg-black hover:border-black dark:hover:border-white';
            const html = `<button onclick="filterByLetter('${l}')" class="flex-none w-10 h-10 flex items-center justify-center text-xs font-bold border border-gray-200 dark:border-gray-800 rounded-full transition-all ${active}">${l}</button>`;
            container.insertAdjacentHTML('beforeend', html);
        }
    });
}

function toggleSearch(type, forceState = null) {
    const wrapper = document.getElementById(`${type} SearchInputWrapper`);
    const btn = document.getElementById(`${type} SearchBtn`);
    const input = document.getElementById(`${type} SearchInput`);

    if (!wrapper) return;

    const isExpanded = wrapper.classList.contains('w-0');
    const shouldExpand = forceState !== null ? forceState : !isExpanded;

    if (shouldExpand) {
        wrapper.classList.remove('w-0');
        wrapper.classList.add('w-full');
        btn.classList.add('hidden');
        btn.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => input.focus(), 100);
    } else {
        wrapper.classList.remove('w-full');
        wrapper.classList.add('w-0');
        btn.classList.remove('opacity-0', 'pointer-events-none');
    }
}
