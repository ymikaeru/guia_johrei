
// --- PULL TO REFRESH LOGIC ---
(function initPullToRefresh() {
    let ptrStart = 0;
    let ptrCurrent = 0;
    let ptrDistance = 0;
    const ptrThreshold = 80;

    // Check DOMContentLoaded to ensure spinner exists
    document.addEventListener('DOMContentLoaded', () => {
        const spinner = document.getElementById('ptr-spinner');
        if (!spinner) return;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                ptrStart = e.touches[0].screenY;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && ptrStart > 0) {
                ptrCurrent = e.touches[0].screenY;
                ptrDistance = ptrCurrent - ptrStart;

                if (ptrDistance > 0) {
                    // Resistance
                    const translateY = Math.min(ptrDistance * 0.4, 100);
                    const opacity = Math.min(ptrDistance / ptrThreshold, 1);

                    spinner.style.transform = `translateY(${translateY}px)`;
                    spinner.style.opacity = opacity;

                    // Only prevent default if we are purely pulling down at top
                    if (ptrDistance > 10 && e.cancelable) {
                        e.preventDefault();
                    }
                }
            }
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (window.scrollY === 0 && ptrStart > 0) {
                if (ptrDistance > ptrThreshold) {
                    // RELOAD ACTION
                    spinner.style.transform = `translateY(60px)`;
                    spinner.style.opacity = '1';
                    // Optional: Vibrate if supported
                    if (navigator.vibrate) navigator.vibrate(50);

                    setTimeout(() => {
                        location.reload();
                    }, 500);
                } else {
                    // Reset
                    spinner.style.transform = 'translateY(0)';
                    spinner.style.opacity = '0';
                }
            }
            ptrStart = 0;
            ptrDistance = 0;
        });
    });
})();

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Carrega Tema Salvo (Removido)
    // if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');

    // 2. Verifica Autenticação
    if (localStorage.getItem('johrei_auth') === CONFIG.password) {
        unlockApp();
    }

    // 3. Listener do Formulário de Senha
    const passForm = document.getElementById('passwordForm');
    if (passForm) {
        passForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (document.getElementById('passwordInput').value === CONFIG.password) {
                localStorage.setItem('johrei_auth', CONFIG.password);
                unlockApp();
            } else {
                document.getElementById('passwordError').classList.remove('hidden');
            }
        });
    }

    // 4. Listeners de Busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const clearBtn = document.getElementById('clearSearch');
            if (e.target.value) {
                STATE.activeLetter = '';
                // Se quiser que a busca limpe o mapa, descomente a linha abaixo:
                // clearBodyFilter(); 
                STATE.activeTag = null;
                renderAlphabet();
                if (clearBtn) clearBtn.classList.remove('hidden');
            } else {
                if (clearBtn) clearBtn.classList.add('hidden');
            }
            applyFilters();
        });
    }
});

function unlockApp() {
    document.getElementById('passwordOverlay').classList.add('hidden');
    document.getElementById('appContent').classList.remove('hidden');
    document.getElementById('appContent').classList.add('flex');
    loadData();
}

// --- CARREGAMENTO DE DADOS ---
async function loadData() {
    const cfg = CONFIG.modes[STATE.mode];
    try {
        const idxRes = await fetch(`${cfg.path}${cfg.file}`);
        const idxData = await idxRes.json();
        const tempData = {};

        await Promise.all(idxData.categories.map(async cat => {
            const res = await fetch(`${cfg.path}${cat.file}`);
            tempData[cat.id] = await res.json();
        }));

        // Create STATE.data in the desired order
        STATE.data = {};

        // For ensinamentos mode, set specific order
        // Build STATE.data with tabs in desired order
        if (STATE.mode === 'ensinamentos') {
            STATE.data = {};
            STATE.data['fundamentos'] = tempData['fundamentos'];
            STATE.data['curas'] = tempData['curas'];
            STATE.data['pontos_focais'] = tempData['pontos_focais'];
        } else {
            // For other modes, just copy all data
            STATE.data = tempData;
        }

        if (!STATE.activeTab) STATE.activeTab = Object.keys(STATE.data)[0];

        renderTabs();
        renderAlphabet();
        applyFilters();

        // Initialize tag browser if available
        if (typeof initializeTagBrowser === 'function') {
            initializeTagBrowser();
        }

        // Render inicial se já estiver na aba mapa (raro no load, mas seguro)
        if (STATE.activeTab === 'mapa') {
            setTimeout(renderBodyMaps, 100);
        }

    } catch (e) { console.error("Erro load:", e); }
}

// --- CONTROLE DE MODO ---
function setMode(newMode) {
    if (STATE.mode === newMode) return;
    STATE.mode = newMode;

    const btnEns = document.getElementById('switch-ens');
    const btnGuia = document.getElementById('switch-guia');
    const activeClass = 'flex-1 py-4 text-[10px] md:text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition-all btn-mode-active';
    const inactiveClass = 'flex-1 py-4 text-[10px] md:text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition-all btn-mode-inactive';

    if (newMode === 'ensinamentos') {
        btnEns.className = activeClass;
        btnGuia.className = inactiveClass;
    } else {
        btnEns.className = inactiveClass;
        btnGuia.className = activeClass;
    }

    const descEl = document.getElementById('modeDescription');
    descEl.style.opacity = '0';
    setTimeout(() => {
        descEl.textContent = CONFIG.modes[newMode].description;
        descEl.style.opacity = '1';
    }, 150);

    STATE.activeTab = null;
    STATE.activeLetter = '';

    // Reseta filtros do mapa usando a função do body-map.js se existir
    if (typeof clearBodyFilter === 'function') clearBodyFilter();
    else STATE.bodyFilter = null;

    STATE.activeTag = null;
    document.querySelectorAll('.search-input').forEach(input => input.value = '');

    loadData();
}

// --- CONTROLE DE ABAS ---
function setTab(id) {
    STATE.activeTab = id;
    STATE.activeLetter = '';

    // Ao mudar de aba, geralmente queremos resetar o filtro específico do corpo
    // a menos que estejamos indo PARA o mapa.
    if (id !== 'mapa' && typeof clearBodyFilter === 'function') {
        clearBodyFilter();
    }

    STATE.activeTag = null;
    document.querySelectorAll('.search-input').forEach(input => input.value = '');

    renderTabs();
    applyFilters();

    // Refresh tag browser with new tab data
    if (typeof initializeTagBrowser === 'function') {
        initializeTagBrowser();
    }
}

function renderTabs() {
    const container = document.getElementById('tabsContainer');

    const catMap = CONFIG.modes[STATE.mode].cats;

    // Desktop Tabs
    let html = Object.keys(STATE.data).map(id => {
        const active = STATE.activeTab === id; // Keep active tab highlighted even in cross-tab mode
        const config = catMap[id];
        const label = config ? config.label : id;
        const activeClass = active
            ? `border-${config ? config.color : 'gray-900'} text-${config ? config.color : 'gray-900'}`
            : 'border-transparent hover:text-black dark:hover:text-white';

        return `<button onclick="setTab('${id}')" class="tab-btn ${activeClass}">${label}</button>`;
    }).join('');

    // Adiciona aba Mapa apenas no modo ensinamentos
    if (STATE.mode === 'ensinamentos') {
        const active = STATE.activeTab === 'mapa'; // Keep active tab highlighted
        const activeClass = active
            ? `border-cat-dark text-cat-dark dark:border-white dark:text-white`
            : 'border-transparent hover:text-black dark:hover:text-white';
        html += `<button onclick="setTab('mapa')" class="tab-btn ${activeClass}">Mapas de Aplicação</button>`;
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

        if (STATE.mode === 'ensinamentos') {
            const isActive = STATE.activeTab === 'mapa';
            if (isActive) {
                if (mobileLabel) mobileLabel.textContent = "MAPAS DE APLICAÇÃO";
            } else {
                optionsHtml += `
                <button onclick="selectMobileOption('mapa')"
                    class="w-full text-left py-4 px-6 text-xs font-bold uppercase tracking-widest border-b border-gray-50 dark:border-gray-900 last:border-0 transition-colors text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white">
                    MAPAS DE APLICAÇÃO
                </button>
    `;
            }
        }
        mobileOptionsContainer.innerHTML = optionsHtml;
    }

    updateUIForTab(STATE.activeTab);
}

// --- CUSTOM DROPDOWN LOGIC ---
function toggleMobileDropdown() {
    const menu = document.getElementById('mobileDropdownMenu');
    const icon = document.getElementById('mobileDropdownIcon');

    if (menu.classList.contains('hidden')) {
        // Open
        menu.classList.remove('hidden');

        requestAnimationFrame(() => {
            menu.classList.remove('-translate-y-4', 'opacity-0', 'duration-150', 'ease-in');
            menu.classList.add('translate-y-0', 'opacity-100', 'duration-300', 'ease-out');
            icon.style.transform = 'rotate(180deg)';
        });
    } else {
        closeMobileDropdown();
    }
}

function closeMobileDropdown() {
    const menu = document.getElementById('mobileDropdownMenu');
    const icon = document.getElementById('mobileDropdownIcon');

    menu.classList.remove('translate-y-0', 'opacity-100', 'duration-300', 'ease-out');
    menu.classList.add('-translate-y-4', 'opacity-0', 'duration-150', 'ease-in');
    icon.style.transform = 'rotate(0deg)';

    setTimeout(() => {
        menu.classList.add('hidden');
    }, 150); // Match transition duration (half of open)
}

function selectMobileOption(id) {
    setTab(id);
    closeMobileDropdown();
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('mobileDropdownMenu');
    const btn = document.getElementById('mobileDropdownBtn');
    if (dropdown && !dropdown.classList.contains('hidden') && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        closeMobileDropdown();
    }
});


function updateUIForTab(tabId) {
    const alpha = document.getElementById('alphabetWrapper');
    const map = document.getElementById('bodyMapContainer');
    const list = document.getElementById('contentList');
    const empty = document.getElementById('emptyState');

    alpha.classList.add('hidden');
    map.classList.add('hidden');
    list.classList.remove('hidden'); // Ensure list is visible by default

    if (tabId === 'pontos_focais') {
        alpha.classList.remove('hidden');
        renderAlphabet();
    }
    // Toggle Search Visibility
    const desktopSearch = document.getElementById('desktopSearchWrapper');
    const mobileSearch = document.getElementById('mobileSearchWrapper');

    if (tabId === 'mapa') {
        if (desktopSearch) desktopSearch.classList.add('invisible'); // Invisible to keep layout? Or hidden? Let's use invisible to avoid header jumping
        if (mobileSearch) mobileSearch.classList.add('hidden');
    } else {
        if (desktopSearch) desktopSearch.classList.remove('invisible');
        if (mobileSearch) mobileSearch.classList.remove('hidden');
    }

    // Hide lists if map
    if (tabId === 'mapa') {
        map.classList.remove('hidden');
        list.classList.add('hidden'); // Hide list for map tab
        if (empty) empty.classList.add('hidden');

        // Render Interactive Body Maps
        const views = [
            { id: 'front', img: 'assets/images/mapa_corporal_1.jpg', alt: 'Frente', points: BODY_DATA.points.front },
            { id: 'detail', img: 'assets/images/mapa_corporal_3.jpg', alt: 'Detalhes', points: BODY_DATA.points.detail },
            { id: 'back', img: 'assets/images/mapa_corporal_2.jpg', alt: 'Costas', points: BODY_DATA.points.back }
        ];

        let html = `
        <div class="flex flex-col lg:flex-row gap-8 mb-12 max-w-[100rem] mx-auto items-start">
            
            <!-- Sidebar (Desktop Only) -->
            <div class="hidden lg:block w-72 flex-shrink-0 bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 h-[600px] overflow-y-auto custom-scrollbar sticky top-4 rounded-sm shadow-sm">
                 <div class="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#151515]">
                    <p class="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Filtrar por Região</p>
                 </div>
                 <div id="bodyPointSidebarList">
                    <div class="px-5 py-3 cursor-pointer text-[10px] font-bold uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 last:border-0 transition-all group hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-gray-400"
                        onclick="selectCustomOption('', '-- Todos os pontos --', event)">
                        -- Todos os pontos --
                    </div>
                    ${generateSidebarOptions()}
                 </div>
            </div>

            <!-- Mobile Dropdown Selector (Mobile Only) -->
            <div class="block lg:hidden w-full mb-8 relative z-30">
                 <div class="-mx-8 md:-mx-12 px-8 md:px-12 pt-2 pb-0 border-b border-gray-100 dark:border-gray-900">
                    <div class="relative inline-block w-full text-left" id="customBodyPointDropdown">
                        <button type="button" onclick="toggleCustomDropdown(event)"
                            class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-4">
                            <span id="customDropdownLabel">Filtrar por Região</span>
                            <svg id="customDropdownIcon" class="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>

                        <div id="customDropdownMenu"
                        class="hidden absolute left-0 right-0 z-[100] mt-0 w-full bg-white dark:bg-[#111] shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[50vh] overflow-y-auto custom-scrollbar transform transition-all duration-300 origin-top opacity-0 -translate-y-2 rounded-xl">
                            <div class="py-0">
                                <div class="px-5 py-4 cursor-pointer text-[10px] font-bold uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 last:border-0 transition-all flex justify-between items-center bg-white dark:bg-[#111] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-gray-400"
                                    onclick="selectCustomOption('', '-- Todos os pontos --', event)">
                                    -- Todos os pontos --
                                </div>
                                ${generateSidebarOptions()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        `;

        // Mobile Tabs
        const mobileTabs = `
            <div class="flex md:hidden justify-center gap-3 mb-6 w-full">
                ${views.map((v, i) => `
                    <button onclick="switchMobileView('${v.id}')" 
                        id="tab-${v.id}"
                        class="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border rounded-md transition-all ${i === 0 ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'bg-white dark:bg-black text-gray-400 border-gray-200 dark:border-gray-800'}">
                        ${v.alt}
                    </button>
                `).join('')
            }
            </div>
            `;

        html += mobileTabs;

        html += `   <!-- Maps Area (Right on Desktop) -->
            <div id="mobile-map-container" class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                `;

        views.forEach((view, i) => {
            // Mobile: Only first one visible by default. Desktop: All visible.
            const visibilityClass = i === 0 ? 'block' : 'hidden';

            html += `
                <div id="view-${view.id}" class="${visibilityClass} md:block relative group transition-all duration-300">
                    <p class="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">${view.alt}</p>
                    <div class="relative inline-block w-full bg-white dark:bg-[#111] rounded-lg p-2">
                        <img src="${view.img}" alt="${view.alt}" class="w-full h-auto object-contain" id="${view.id}_img" />
                        <svg class="absolute inset-0 w-full h-full pointer-events-none" id="${view.id}_svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                            ${renderBodyPoints(view.points, view.id)}
                        </svg>
                    </div>
                </div>
                `;
        });

        html += `   </div>
        </div > `;

        map.innerHTML = html;
    }
}

// --- MOBILE MAP NAVIGATION ---
window.switchMobileView = function (targetId) {
    const views = ['front', 'detail', 'back'];
    STATE.currentMobileView = targetId;

    views.forEach(id => {
        const el = document.getElementById(`view-${id}`);
        const tab = document.getElementById(`tab-${id}`);

        if (el && tab) {
            if (id === targetId) {
                el.classList.remove('hidden');
                // Active Styling
                tab.classList.remove('bg-white', 'dark:bg-black', 'text-gray-400', 'border-gray-200', 'dark:border-gray-800');
                tab.classList.add('bg-black', 'text-white', 'border-black', 'dark:bg-white', 'dark:text-black');
            } else {
                el.classList.add('hidden');
                // Inactive Styling
                tab.classList.remove('bg-black', 'text-white', 'border-black', 'dark:bg-white', 'dark:text-black');
                tab.classList.add('bg-white', 'dark:bg-black', 'text-gray-400', 'border-gray-200', 'dark:border-gray-800');
            }
        }
    });
};

/* Observer removed as we are back to tab switching */
function updateTabStyle(activeId) {
    // Legacy function, can be removed or kept empty if other things call it
}


// Global helper to switch view based on point
window.autoSwitchMapToPoint = function (pointId) {
    if (window.innerWidth >= 768) return; // Desktop doesn't need switching

    // Find which map contains the point
    let targetView = 'front'; // Default
    if (BODY_DATA.points.back.some(p => p.id === pointId)) targetView = 'back';
    else if (BODY_DATA.points.detail.some(p => p.id === pointId)) targetView = 'detail';

    // Only switch if different (and exists)
    if (targetView) {
        window.switchMobileView(targetView);
    }
};

// --- FILTROS E ORDENAÇÃO (INTEGRADO COM BODY-MAP) ---
function toggleFilterMenu(event) {
    if (event) event.stopPropagation();

    const desktopMenu = document.getElementById('filterMenuDesktop');
    const mobileMenu = document.getElementById('filterMenuMobile');

    // Only proceed if at least one menu exists
    if (!desktopMenu && !mobileMenu) {
        console.warn('No filter menus found');
        return;
    }

    // Check if either menu is currently visible
    const desktopVisible = desktopMenu && !desktopMenu.classList.contains('hidden');
    const mobileVisible = mobileMenu && !mobileMenu.classList.contains('hidden');
    const anyVisible = desktopVisible || mobileVisible;

    if (anyVisible) {
        // Close all menus
        closeFilterMenu();
    } else {
        // Open menus
        if (desktopMenu) {
            desktopMenu.classList.remove('hidden');
            renderFilterMenu();
            // Add outside click listener with delay
            setTimeout(() => {
                document.addEventListener('click', closeFilterMenuOnClickOutside);
            }, 300);
        }
        if (mobileMenu) {
            mobileMenu.classList.remove('hidden');
            renderFilterMenu();
        }
    }
}

function closeFilterMenu() {
    document.getElementById('filterMenuDesktop')?.classList.add('hidden');
    document.getElementById('filterMenuMobile')?.classList.add('hidden');
    document.removeEventListener('click', closeFilterMenuOnClickOutside);
}

function closeFilterMenuOnClickOutside(e) {
    const desktopMenu = document.getElementById('filterMenuDesktop');
    const mobileMenu = document.getElementById('filterMenuMobile');
    const btnDesktop = document.getElementById('filterBtnDesktop');
    const btnMobile = document.getElementById('filterBtnMobile');

    // Check if click is outside desktop menu AND button
    if (!desktopMenu?.classList.contains('hidden') && !desktopMenu?.contains(e.target) && !btnDesktop?.contains(e.target)) {
        document.getElementById('filterMenuDesktop').classList.add('hidden');
    }
    // Check if click is outside mobile menu AND button
    if (!mobileMenu?.classList.contains('hidden') && !mobileMenu?.contains(e.target) && !btnMobile?.contains(e.target)) {
        document.getElementById('filterMenuMobile').classList.add('hidden');
    }

    // Remove listener if both are hidden
    if (document.getElementById('filterMenuDesktop')?.classList.contains('hidden') &&
        document.getElementById('filterMenuMobile')?.classList.contains('hidden')) {
        document.removeEventListener('click', closeFilterMenuOnClickOutside);
    }
}

function renderFilterMenu() {
    const containerDesktop = document.getElementById('filterMenuDesktop');
    const containerMobile = document.getElementById('filterMenuMobile');
    if (!containerDesktop && !containerMobile) return;

    // Get Categories
    const categories = Object.keys(CONFIG.modes[STATE.mode].cats).map(key => ({
        id: key,
        label: CONFIG.modes[STATE.mode].cats[key].label
    }));

    // Get Sources (unique from loaded data)
    let allItems = [];
    Object.keys(STATE.data).forEach(key => {
        if (Array.isArray(STATE.data[key])) {
            allItems = allItems.concat(STATE.data[key]);
        }
    });

    const sources = [...new Set(allItems.map(i => i.source).filter(s => s))].sort();

    const generateMenuHTML = () => {
        let html = '<div class="p-4 space-y-4 max-h-96 overflow-y-auto">';

        // Categories Section
        html += '<div><h3 class="font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">Categorias</h3><div class="space-y-2">';
        categories.forEach(cat => {
            const isChecked = STATE.activeCategories.includes(cat.id);
            html += `
            <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" onchange="toggleFilter('category', '${cat.id}')" class="form-checkbox text-swiss-red rounded" ${isChecked ? 'checked' : ''}>
                <span class="text-sm ${isChecked ? 'font-semibold text-swiss-red' : 'text-gray-600 dark:text-gray-400'}">${cat.label}</span>
            </label>
        `;
        });
        html += '</div></div>';

        // Sources Section
        if (sources.length > 0) {
            html += '<div class="border-t border-gray-100 dark:border-gray-700 pt-2"><h3 class="font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">Fontes</h3><div class="space-y-2">';
            sources.forEach(src => {
                const isChecked = STATE.activeSources.includes(src);
                html += `
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" onchange="toggleFilter('source', '${src}')" class="form-checkbox text-swiss-red rounded" ${isChecked ? 'checked' : ''}>
                    <span class="text-sm ${isChecked ? 'font-semibold text-swiss-red' : 'text-gray-600 dark:text-gray-400'}">${src}</span>
                </label>
            `;
            });
            html += '</div></div>';
        }

        html += '</div>'; // End container

        // Reset Button
        if (STATE.activeCategories.length > 0 || STATE.activeSources.length > 0) {
            html += `
            <div class="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky bottom-0">
                <button onclick="STATE.activeCategories=[]; STATE.activeSources=[]; applyFilters(); renderFilterMenu();" class="w-full text-xs text-swiss-red hover:underline">Limpar Filtros</button>
            </div>
        `;
        }

        return html;
    };

    const html = generateMenuHTML();
    if (containerDesktop) containerDesktop.innerHTML = html;
    if (containerMobile) containerMobile.innerHTML = html;
}

function toggleFilter(type, value) {
    let targetArray = type === 'category' ? STATE.activeCategories : STATE.activeSources;

    if (targetArray.includes(value)) {
        targetArray = targetArray.filter(i => i !== value);
    } else {
        targetArray.push(value);
    }

    if (type === 'category') STATE.activeCategories = targetArray;
    else STATE.activeSources = targetArray;

    applyFilters();
    renderFilterMenu();
}
function applyFilters() {
    // Get value from any search input (they should be synced)
    const inputs = document.querySelectorAll('.search-input');
    // --- FILTER MENU LOGIC ---

    const searchValue = inputs.length > 0 ? inputs[0].value : '';
    const q = removeAccents(searchValue); // Normalize for accent-insensitive search

    const { activeTab, activeLetter, activeTags, bodyFilter } = STATE;

    let rawItems = [];
    let label = "TODOS";

    // Coleta todos os itens se estivermos buscando, filtrando por tag ou no mapa
    if (q || activeTags.length > 0 || activeTab === 'mapa' || bodyFilter) {
        Object.keys(STATE.data).forEach(cat => {
            STATE.data[cat].forEach(i => rawItems.push({ ...i, _cat: cat }));
        });

        if (activeTags.length > 0 && bodyFilter) label = `TAGS: ${activeTags.map(t => `#${t}`).join(' ')} + ${document.getElementById('selectedBodyPointName')?.textContent || 'Filtro'} `;
        else if (activeTags.length > 0) label = `TAGS: ${activeTags.map(t => `#${t}`).join(' ')} `;
        else if (bodyFilter) label = "PONTO FOCAL SELECIONADO";
        else if (q) label = "RESULTADOS DA BUSCA";
        else if (activeTab === 'mapa') label = "SELECIONE UMA REGIÃO ACIMA";
    } else {
        // Caso contrário, pega apenas itens da aba atual
        rawItems = (STATE.data[activeTab] || []).map(i => ({ ...i, _cat: activeTab }));
        label = CONFIG.modes[STATE.mode].cats[activeTab] ? CONFIG.modes[STATE.mode].cats[activeTab].label : activeTab;
    }
    // Filter Logic
    let filtered = rawItems.filter(item => {
        // 1. Text Search (Check title, content, tags, focus points)
        if (q.length > 0) {
            const searchableText = removeAccents((
                (item.title || '') + ' ' +
                (item.content || '') + ' ' +
                (item.tags ? item.tags.join(' ') : '') + ' ' +
                (item.focusPoints ? item.focusPoints.join(' ') : '')
            ).toLowerCase());

            // Strict Search: ALL terms must match (AND logic)
            const terms = q.split(/\s+/).filter(t => t.length > 0);
            const matchesAll = terms.every(term => searchableText.includes(term));

            if (!matchesAll) return false;
        }

        // 1.2 Filter by TAGS (AND Logic)
        if (activeTags.length > 0) {
            if (!item.tags) return false;
            // Check if item has ALL active tags
            const hasAllTags = activeTags.every(tag => item.tags.includes(tag));
            if (!hasAllTags) return false;
        }

        // 1.5 Filtro de PONTOS FOCAIS (Multi-select)
        if (STATE.activeFocusPoints.length > 0) {
            if (!item.focusPoints) return false;
            const hasAllPoints = STATE.activeFocusPoints.every(fp => item.focusPoints.includes(fp));
            if (!hasAllPoints) return false;
        }

        // 1.6 Filtro de FONTE (OR Logic for list of sources)
        if (STATE.activeSources.length > 0) {
            if (!item.source || !STATE.activeSources.includes(item.source)) return false;
        }

        // 2. Filtro do MAPA (Integração)
        // Se estiver na aba mapa e nenhum ponto selecionado (e sem busca/tag), não mostra nada
        if (activeTab === 'mapa' && !bodyFilter && !q && activeTags.length === 0) return false;

        // Na aba mapa, mostrar apenas itens com pontos focais
        if (activeTab === 'mapa' && !item.focusPoints) return false;

        // Se houver um filtro de corpo, usa a função matchBodyPoint do body-map.js
        if (bodyFilter && typeof matchBodyPoint === 'function') {
            if (!matchBodyPoint(item, bodyFilter)) return false;
        }

        // 3. Filtro de LETRA (Alfabeto)
        if (!q && activeTags.length === 0 && !bodyFilter && activeLetter && !item.title.toUpperCase().startsWith(activeLetter)) return false;

        // 4. Filtro de BUSCA TEXTUAL - Now handled by SearchEngine below
        // Keep this for non-search filters only
        if (!q) return true;

        // Search filtering will be handled separately
        return true;
    });

    // If there's a search query, use the advanced SearchEngine
    if (q) {
        // Add to search history
        if (typeof SearchHistory !== 'undefined') {
            SearchHistory.addSearch(inputs[0].value);
        }

        // Use SearchEngine for smart search with ranking
        if (typeof SearchEngine !== 'undefined') {
            filtered = SearchEngine.search(filtered, inputs[0].value, {
                minScore: 10,
                maxResults: 100,
                useOperators: true,
                useFuzzy: true,
                useSynonyms: true
            });
        } else {
            // Fallback to basic search if SearchEngine not loaded
            filtered = filtered.filter(item => {
                const content = removeAccents(item.content || '');
                const title = removeAccents(item.title);
                const tags = item.tags || [];
                const fps = item.focusPoints || [];

                return title.includes(q) ||
                    content.includes(q) ||
                    tags.some(t => removeAccents(t).includes(q)) ||
                    fps.some(fp => removeAccents(fp).includes(q));
            });
        }
    } else {
        // Ordenação (Preserva ordem numérica se existir) - only when not searching
        filtered.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            return 0;
        });
    }

    STATE.list = filtered;

    // Detect cross-tab mode and update state
    const uniqueCategories = new Set(filtered.map(item => item._cat));
    const wasCrossTabMode = STATE.isCrossTabMode;
    STATE.isCrossTabMode = uniqueCategories.size > 1;

    // Re-render tabs if cross-tab mode changed
    if (wasCrossTabMode !== STATE.isCrossTabMode) {
        renderTabs();
    }

    // LIST VISIBILITY ON MAP TAB
    // Ensure list is visible if we have results and filters, even on 'mapa' tab
    const list = document.getElementById('contentList');
    const empty = document.getElementById('emptyState');

    if (activeTab === 'mapa') {
        const hasFilters = q || activeTags.length > 0 || bodyFilter;
        if (hasFilters) {
            list.classList.remove('hidden');
            if (filtered.length === 0 && empty) empty.classList.remove('hidden');
        } else {
            // If no filters, hide list (show only map)
            list.classList.add('hidden');
            if (empty) empty.classList.add('hidden');
        }
    }

    // Atualiza contadores e UI (Multiple elements)
    document.querySelectorAll('.search-count').forEach(el => {
        el.textContent = `${filtered.length} Itens`;
    });

    // Show/Hide Clear Buttons
    document.querySelectorAll('.clear-search-btn').forEach(btn => {
        if (q || STATE.activeTags.length > 0) btn.classList.remove('hidden');
        else btn.classList.add('hidden');
    });
    // Render filtered results
    renderList(filtered, activeTags, STATE.mode, activeTab);
}

// --- FUNÇÕES AUXILIARES ---

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

function toggleBodyPoint(id) {
    if (STATE.bodyFilter === id) {
        STATE.bodyFilter = null;
        document.getElementById('mobileFab').classList.add('hidden');
    } else {
        STATE.bodyFilter = id;
        // Show FAB on mobile if point selected
        if (window.innerWidth < 768) {
            const fab = document.getElementById('mobileFab');
            fab.classList.remove('hidden');
            // Update FAB count if possible? For now just visual cue.
            // Pulse animation
            fab.firstElementChild.classList.add('scale-110');
            setTimeout(() => fab.firstElementChild.classList.remove('scale-110'), 200);
        }
    }

    // Update UI for CURRENT tab, not hardcoded 'mapa'
    // This was causing tags to navigate to maps tab
    updateUIForTab(STATE.activeTab);

    // Update list
    applyFilters();

    // Scroll behavior - simplified: use FAB for explicit action on mobile, auto-scroll on desktop
    if (window.innerWidth >= 768 && STATE.bodyFilter) {
        const list = document.getElementById('contentList');
        list.classList.remove('hidden');
        setTimeout(() => {
            list.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
}

// Mobile FAB Action
function scrollToResults() {
    const list = document.getElementById('contentList');
    list.classList.remove('hidden');
    list.scrollIntoView({ behavior: 'smooth' });
    // Hide FAB after interaction? or keep it? Keep it until deselected.
    document.getElementById('mobileFab').classList.add('hidden');
}

function clearSearch() {
    document.querySelectorAll('.search-input').forEach(input => input.value = '');

    STATE.activeTags = [];

    // Opcional: Limpar mapa ao limpar busca? Geralmente não.
    // if(typeof clearBodyFilter === 'function') clearBodyFilter();

    applyFilters();

    // Collapse search if empty
    toggleSearch('desktop', false);
    toggleSearch('mobile', false);
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

function filterByTag(tag, event) {
    if (event) event.stopPropagation();

    const index = STATE.activeTags.indexOf(tag);
    if (index > -1) {
        STATE.activeTags.splice(index, 1); // Remove if exists
    } else {
        STATE.activeTags.push(tag); // Add if not exists
    }

    document.querySelectorAll('.search-input').forEach(input => input.value = '');
    STATE.activeLetter = '';

    // DECISÃO DE INTEGRAÇÃO:
    // Se estivermos na aba MAPA, NÃO limpamos o bodyFilter.
    // Isso permite clicar em "Cabeça" e depois na tag "#Cura" para ver a interseção.
    if (STATE.activeTab !== 'mapa') {
        if (typeof clearBodyFilter === 'function') clearBodyFilter();
        STATE.bodyFilter = null;
    }

    applyFilters();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function filterByLetter(l) {
    STATE.activeLetter = l;
    STATE.activeTags = [];
    renderAlphabet();
    applyFilters();
}

function filterByFocusPoint(point, event) {
    if (event) event.stopPropagation();
    closeModal();

    if (STATE.activeTab === 'pontos_focais') {
        // Multi-select mode
        const index = STATE.activeFocusPoints.indexOf(point);
        if (index > -1) {
            STATE.activeFocusPoints.splice(index, 1);
        } else {
            STATE.activeFocusPoints.push(point);
        }
    } else {
        // Standard Search Mode (for other tabs)
        const inputs = document.querySelectorAll('.search-input');
        inputs.forEach(input => input.value = point);

        STATE.activeTags = [];
        STATE.activeLetter = '';
        STATE.bodyFilter = null;
        STATE.activeFocusPoints = [];
    }

    applyFilters();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- SETUP ---
function setupSearch() {
    const inputs = document.querySelectorAll('.search-input');
    const suggestionsEl = document.getElementById('searchSuggestions');

    let currentSuggestions = [];
    let selectedIndex = -1;

    // Event delegation for suggestion clicks
    suggestionsEl.addEventListener('click', (e) => {
        const suggestionEl = e.target.closest('[data-title]');
        if (suggestionEl) {
            const title = suggestionEl.dataset.title;
            const tab = suggestionEl.dataset.tab;
            selectSuggestion(title, tab);
        }
    });

    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            // Sync all inputs
            const val = e.target.value;
            inputs.forEach(i => {
                if (i !== e.target) i.value = val;
            });

            STATE.activeLetter = '';
            STATE.activeTags = [];

            // When searching, results will come from all tabs
            // No need to switch tabs - applyFilters handles cross-tab search

            // Build allData FIRST for auto-correction check
            const allData = [];
            Object.keys(STATE.data).forEach(tabId => {
                if (STATE.data[tabId]) {
                    allData.push(...STATE.data[tabId]);
                }
            });



            // Auto-correction: ONLY if query has ZERO results, try synonyms
            if (val.length > 2 && typeof SearchEngine !== 'undefined' && SearchEngine.synonyms) {
                const q = removeAccents(val);
                const related = SearchEngine.getRelatedTerms(val);
                const synonyms = related.filter(r => removeAccents(r) !== q && !removeAccents(r).includes(q));

                if (synonyms.length > 0) {
                    // Count results for query
                    const queryPattern = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                    const queryCount = allData.filter(item => {
                        const searchable = removeAccents((
                            (item.title || '') + ' ' +
                            (item.tags ? item.tags.join(' ') : '') + ' ' +
                            (item.focusPoints ? item.focusPoints.join(' ') : '') + ' ' +
                            (item.content || '')
                        ).toLowerCase());
                        return queryPattern.test(searchable);
                    }).length;

                    // ONLY auto-correct if query has ZERO results
                    if (queryCount === 0) {
                        // Find first synonym that HAS results
                        for (const syn of synonyms.slice(0, 3)) {
                            const synNorm = removeAccents(syn.toLowerCase());
                            const synPattern = new RegExp(`\\b${synNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                            const synCount = allData.filter(item => {
                                const searchable = removeAccents((
                                    (item.title || '') + ' ' +
                                    (item.tags ? item.tags.join(' ') : '') + ' ' +
                                    (item.focusPoints ? item.focusPoints.join(' ') : '') + ' ' +
                                    (item.content || '')
                                ).toLowerCase());
                                return synPattern.test(searchable);
                            }).length;

                            if (synCount > 0) {
                                // Auto-correct to first synonym with results
                                inputs.forEach(i => {
                                    if (i !== e.target) i.value = syn;
                                });
                                e.target.value = syn;
                                break;
                            }
                        }
                    }
                }
            }

            applyFilters();

            // Autocomplete Logic - Show history or suggestions
            if (val.length === 0) {
                // Show search history when empty
                if (typeof SearchHistory !== 'undefined') {
                    const history = SearchHistory.getHistory();
                    if (history.length > 0) {
                        suggestionsEl.innerHTML = `
            <div class="px-4 py-2 text-[9px] uppercase tracking-widest text-gray-400 font-bold border-b border-gray-50 dark:border-gray-800">Buscas Recentes</div>
                ${history.slice(0, 5).map(h => `
                                <div data-title="${h.replace(/"/g, '&quot;')}" data-tab="${STATE.activeTab}" 
                                     class="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer text-sm border-b border-gray-50 dark:border-gray-800 last:border-0 flex justify-between items-center group">
                                    <span class="font-bold font-serif group-hover:text-black dark:group-hover:text-white">${h}</span>
                                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            `).join('')
                            }
        `;
                        suggestionsEl.classList.remove('hidden');
                    } else {
                        suggestionsEl.classList.add('hidden');
                    }
                } else {
                    suggestionsEl.classList.add('hidden');
                }
                currentSuggestions = [];
            } else if (val.length > 1) {
                const q = removeAccents(val);

                const suggestions = [];
                const seen = new Set();

                // Build allData FIRST so we can check if terms have results
                const allData = [];
                Object.keys(STATE.data).forEach(tabId => {
                    if (STATE.data[tabId]) {
                        allData.push(...STATE.data[tabId]);
                    }
                });

                // 1. Check for Direct Synonyms (High Priority)
                if (typeof SearchEngine !== 'undefined' && SearchEngine.synonyms) {
                    const related = SearchEngine.getRelatedTerms(val);
                    // Filter out the query itself from related
                    const synonyms = related.filter(r => removeAccents(r) !== q && !removeAccents(r).includes(q));



                    // Check if query itself has matches in data
                    const queryHasResults = allData.some(item => {
                        const searchable = removeAccents((
                            (item.title || '') + ' ' +
                            (item.tags ? item.tags.join(' ') : '') + ' ' +
                            (item.focusPoints ? item.focusPoints.join(' ') : '') + ' ' +
                            (item.content || '')
                        ).toLowerCase());
                        return searchable.includes(q);
                    });



                    // If query has NO results, check if synonyms do
                    if (!queryHasResults && synonyms.length > 0) {

                        // Find first synonym that has results
                        for (const syn of synonyms.slice(0, 3)) {
                            const synNorm = removeAccents(syn.toLowerCase());
                            const synHasResults = allData.some(item => {
                                const searchable = removeAccents((
                                    (item.title || '') + ' ' +
                                    (item.tags ? item.tags.join(' ') : '') + ' ' +
                                    (item.focusPoints ? item.focusPoints.join(' ') : '') + ' ' +
                                    (item.content || '')
                                ).toLowerCase());
                                return searchable.includes(synNorm);
                            });



                            if (synHasResults) {
                                // Promote this to "Você quis dizer?" instead of synonym

                                suggestions.push({
                                    text: syn,
                                    type: 'Você quis dizer?',
                                    priority: 5 // Highest priority
                                });
                                seen.add(`correction:${syn}`);
                                break; // Only suggest one correction
                            }
                        }
                    } else if (queryHasResults) {

                        // Query has results, show synonyms normally
                        synonyms.slice(0, 3).forEach(syn => {
                            const key = `syn:${syn}`;
                            if (!seen.has(key)) {
                                suggestions.push({
                                    text: syn,
                                    type: 'Sinônimo',
                                    priority: 4
                                });
                                seen.add(key);
                            }
                        });
                    }
                }

                // Now search in titles, tags, focus points
                allData.forEach(item => {
                    // Search in title
                    if (item.title && removeAccents(item.title).includes(q)) {
                        const key = `title:${item.title} `;
                        if (!seen.has(key)) {
                            suggestions.push({
                                text: item.title,
                                type: 'Título',
                                priority: 3
                            });
                            seen.add(key);
                        }
                    }

                    // Search in tags
                    if (item.tags && Array.isArray(item.tags)) {
                        item.tags.forEach(tag => {
                            if (removeAccents(tag).includes(q)) {
                                const key = `tag:${tag} `;
                                if (!seen.has(key)) {
                                    suggestions.push({
                                        text: tag,
                                        type: 'Tag',
                                        priority: 2
                                    });
                                    seen.add(key);
                                }
                            }
                        });
                    }

                    // Search in focus points
                    if (item.focusPoints && Array.isArray(item.focusPoints)) {
                        item.focusPoints.forEach(fp => {
                            if (removeAccents(fp).includes(q)) {
                                const key = `fp:${fp} `;
                                if (!seen.has(key)) {
                                    suggestions.push({
                                        text: fp,
                                        type: 'Ponto Focal',
                                        priority: 1
                                    });
                                    seen.add(key);
                                }
                            }
                        });
                    }
                });

                // Sort by priority (synonyms first, then titles, tags, focus points) and limit to 8
                suggestions.sort((a, b) => b.priority - a.priority);
                currentSuggestions = suggestions.slice(0, 8);
                selectedIndex = -1; // Reset selection

                // --- SPELL CORRECTION (Did You Mean?) ---
                // Only if no results found and query > 2 chars
                if (currentSuggestions.length === 0 && val.length > 2 && typeof SearchEngine !== 'undefined') {
                    const candidates = new Set();

                    // Add Titles and Tags
                    allData.forEach(item => {
                        if (item.title) candidates.add(item.title);
                        if (item.tags) item.tags.forEach(t => candidates.add(t));
                    });

                    // Add Synonym Keys
                    if (SearchEngine.synonyms) {
                        Object.keys(SearchEngine.synonyms).forEach(k => candidates.add(k));
                    }

                    const correction = SearchEngine.suggestCorrection(val, Array.from(candidates));

                    if (correction) {
                        currentSuggestions.push({
                            text: correction,
                            type: 'Você quis dizer?',
                            priority: 5 // Top priority
                        });
                    }
                }

                if (currentSuggestions.length > 0) {
                    suggestionsEl.innerHTML = currentSuggestions.map((match, index) => {
                        const isSelected = index === selectedIndex;
                        const selectedClass = isSelected ? 'bg-gray-100 dark:bg-gray-800' : '';
                        return `
                            <div data-title="${match.text.replace(/"/g, '&quot;')}" data-tab="${STATE.activeTab}" 
                            class="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer text-sm border-b border-gray-50 dark:border-gray-800 last:border-0 flex justify-between items-center group ${selectedClass}">
                                <span class="font-bold font-serif group-hover:text-black dark:group-hover:text-white">${match.text}</span>
                                <span class="text-[9px] uppercase tracking-widest text-gray-400 border border-gray-100 dark:border-gray-800 rounded px-1.5 py-0.5 bg-gray-50 dark:bg-gray-900">${match.type}</span>
                            </div >
        `;
                    }).join('');
                    suggestionsEl.classList.remove('hidden');
                } else {
                    suggestionsEl.classList.add('hidden');
                }
            } else {
                suggestionsEl.classList.add('hidden');
                currentSuggestions = [];
            }
        });

        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            if (currentSuggestions.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % currentSuggestions.length;
                updateSuggestionHighlight();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = selectedIndex <= 0 ? currentSuggestions.length - 1 : selectedIndex - 1;
                updateSuggestionHighlight();
            } else if (e.key === 'Enter') {
                if (selectedIndex >= 0 && selectedIndex < currentSuggestions.length) {
                    e.preventDefault();
                    const selected = currentSuggestions[selectedIndex];
                    selectSuggestion(selected.text, STATE.activeTab);
                }
            } else if (e.key === 'Escape') {
                suggestionsEl.classList.add('hidden');
                selectedIndex = -1;
            }
        });

        // Hide on blur (delayed to allow click)
        input.addEventListener('blur', () => {
            setTimeout(() => {
                suggestionsEl.classList.add('hidden');
            }, 200);
        });

        // Show on focus if has value
        input.addEventListener('focus', (e) => {
            if (e.target.value.length > 1) {
                // Re-trigger search to show suggestions
                e.target.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    });

    // Helper function to update visual highlight
    function updateSuggestionHighlight() {
        const suggestionDivs = suggestionsEl.querySelectorAll('[data-title]');
        suggestionDivs.forEach((div, index) => {
            if (index === selectedIndex) {
                div.classList.add('bg-gray-100', 'dark:bg-gray-800');
            } else {
                div.classList.remove('bg-gray-100', 'dark:bg-gray-800');
            }
        });
    }
}

function selectSuggestion(title, tab) {
    // Set search input value
    const inputs = document.querySelectorAll('.search-input');
    inputs.forEach(input => input.value = title);

    // Hide suggestions
    document.getElementById('searchSuggestions').classList.add('hidden');

    // Clear other filters to ensure clean search results
    STATE.activeTags = [];
    STATE.activeLetter = '';
    STATE.bodyFilter = null;
    STATE.activeFocusPoints = [];

    // Apply filters to show results
    applyFilters();

    // Auto-trigger suggestions for the new term (synonyms, etc.)
    if (inputs.length > 0) {
        // Dispatch input event to trigger suggestion dropdown
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    }
}

// Scroll to Top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll-to-top button based on scroll position
window.addEventListener('scroll', () => {
    const scrollBtn = document.getElementById('scrollToTopBtn');
    if (scrollBtn) {
        if (window.scrollY > 300) {
            scrollBtn.classList.remove('opacity-0', 'pointer-events-none');
            scrollBtn.classList.add('opacity-100', 'pointer-events-auto');
        } else {
            scrollBtn.classList.remove('opacity-100', 'pointer-events-auto');
            scrollBtn.classList.add('opacity-0', 'pointer-events-none');
        }
    }
});


// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // ... existing initialization ...
    setupSearch();
});

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
