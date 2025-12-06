// --- ESTADO GLOBAL ---
const STATE = {
    mode: 'ensinamentos', // 'ensinamentos' ou 'explicacoes'
    activeTab: 'fundamentos', // aba ativa
    activeLetter: '', // filtro de letra
    activeTags: [], // tags selecionadas (agora array para suportar múltiplas)
    activeCategories: [], // Categorias selecionadas para filtro combinado
    activeSources: [], // Fontes selecionadas para filtro combinado
    bodyFilter: null, // filtro do mapa corporal
    activeFocusPoints: [], // Pontos focais selecionados (array)
    selectedBodyPoint: null, // ID do ponto selecionado no mapa
    data: {}, // dados carregados
    list: [], // lista filtrada atual
    isCrossTabMode: false, // se a busca retorna itens de várias abas
    validCandidates: null, // Cache for autocomplete candidates
    correctionUsed: null // Track if auto-correction was applied
};

// Expose for debugging
window.STATE = STATE;
if (typeof SearchEngine !== 'undefined') window.SearchEngine = SearchEngine;

// Helper to remove accents
function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
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
async function init() {
    setupTheme();
    setupMobileMenu();
    // Initialize Favorites
    if (typeof Favorites !== 'undefined') Favorites.init();

    // Load categories first
    await loadCategories();
}
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
            if (e.target.value) {
                STATE.activeLetter = '';
                // Se quiser que a busca limpe o mapa, descomente a linha abaixo:
                // clearBodyFilter(); 
                STATE.activeTag = null;
                renderAlphabet();
                document.getElementById('clearSearch').classList.remove('hidden');
            } else {
                document.getElementById('clearSearch').classList.add('hidden');
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

        // Check for Deep Link hash
        checkHashAndOpen();

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
    STATE.activeTags = [];       // Reset multiple tags
    STATE.activeCategories = []; // Reset categories
    STATE.activeSources = [];    // Reset sources

    // Clear search using the global helper to ensure full state reset
    if (typeof clearSearch === 'function') {
        clearSearch(false); // false = don't render list immediately, loadData will handle it
    } else {
        // Fallback if helper is missing
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        const clearBtn = document.getElementById('clearSearch');
        if (clearBtn) clearBtn.classList.add('hidden');
    }

    loadData();
}

// --- HELPER: Search Placeholder ---
function updateSearchPlaceholder(tabId) {
    const inputs = document.querySelectorAll('.search-input');
    let placeholder = 'BUSCAR...';
    if (tabId === 'favoritos' && typeof Favorites !== 'undefined') {
        const trayName = Favorites.activeTray;
        placeholder = `BUSCAR NA APOSTILA ${trayName.toUpperCase()}...`;
    }
    inputs.forEach(i => i.placeholder = placeholder);
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
        const active = STATE.activeTab === id && !STATE.isCrossTabMode; // Hide indicator in cross-tab mode
        const config = catMap[id];
        const label = config ? config.label : id;
        const activeClass = active
            ? `border-${config ? config.color : 'gray-900'} text-${config ? config.color : 'gray-900'}`
            : 'border-transparent hover:text-black dark:hover:text-white';

        return `<button onclick="setTab('${id}')" class="tab-btn ${activeClass}">${label}</button>`;
    }).join('');

    // Adiciona aba Mapa apenas no modo ensinamentos
    if (STATE.mode === 'ensinamentos') {
        const active = STATE.activeTab === 'mapa' && !STATE.isCrossTabMode; // Hide indicator in cross-tab mode
        const activeClass = active
            ? `border-cat-dark text-cat-dark dark:border-white dark:text-white`
            : 'border-transparent hover:text-black dark:hover:text-white';
        html += `<button onclick="setTab('mapa')" class="tab-btn ${activeClass}">Mapas de Aplicação</button>`;
    }

    // Favorites Tab (Dynamic)
    if (typeof Favorites !== 'undefined' && Favorites.list.length > 0) {
        const active = STATE.activeTab === 'favoritos';
        const activeClass = active
            ? `border-blue-600 text-blue-600 font-bold`
            : 'border-transparent text-gray-500 hover:text-blue-600';

        // Use Active Tray Name for Tab Label
        let tabLabel = 'Apostilas';
        if (Favorites.activeTray && Favorites.activeTray !== 'Principal') {
            tabLabel = Favorites.activeTray; // e.g. "Aula 1"
            // Ensure visual limit if name is too long?
            if (tabLabel.length > 20) tabLabel = tabLabel.substring(0, 18) + '...';
        } else if (Favorites.activeTray === 'Principal') {
            tabLabel = 'Apostila Principal'; // More explicit
        }

        html += `<button onclick="setTab('favoritos')" class="tab-btn ${activeClass} flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
            ${tabLabel} (${Favorites.list.length})
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
    < button onclick = "selectMobileOption('${id}')"
class="w-full text-left py-4 px-6 text-xs font-bold uppercase tracking-widest border-b border-gray-50 dark:border-gray-900 last:border-0 transition-colors text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white" >
    ${label}
            </button >
    `;
        }).join('');

        if (STATE.mode === 'ensinamentos') {
            const isActive = STATE.activeTab === 'mapa';
            if (isActive) {
                if (mobileLabel) mobileLabel.textContent = "MAPAS DE APLICAÇÃO";
            } else {
                optionsHtml += `
    < button onclick = "selectMobileOption('mapa')"
class="w-full text-left py-4 px-6 text-xs font-bold uppercase tracking-widest border-b border-gray-50 dark:border-gray-900 last:border-0 transition-colors text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white" >
    MAPAS DE APLICAÇÃO
                </button >
    `;
            }
        }
        mobileOptionsContainer.innerHTML = optionsHtml;
    }

    updateUIForTab(STATE.activeTab);
    updateSearchPlaceholder(STATE.activeTab);
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

    // Hide Tag Browser (labeled "Categorias") on Favorites and Map tabs
    const tagBrowserWrapper = document.getElementById('tagBrowserWrapper');
    if (tagBrowserWrapper) {
        if (tabId === 'favoritos' || tabId === 'mapa') {
            tagBrowserWrapper.style.display = 'none';
        } else {
            // Check if tab has tags to decide visibility
            const hasTags = STATE.data[tabId] && STATE.data[tabId].some(i => i.tags && i.tags.length > 0);
            tagBrowserWrapper.style.display = hasTags ? 'block' : 'none';
        }
        // Always reset state on tab switch
        document.getElementById('tagBrowserContent').classList.add('hidden');
        const tbIcon = document.getElementById('tagBrowserIcon');
        if (tbIcon) tbIcon.style.transform = 'rotate(0deg)';
    }

    // Initialize Tag Browser logic (load tags) if needed
    if (tabId !== 'favoritos' && tabId !== 'mapa') {
        if (typeof initializeTagBrowser === 'function') initializeTagBrowser();
    }

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
    < div class="flex flex-col lg:flex-row gap-8 mb-12 max-w-[100rem] mx-auto items-start" >
            
            < !--Sidebar(Desktop Only) -->
            <div class="hidden lg:block w-72 flex-shrink-0 bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 h-[600px] overflow-y-auto custom-scrollbar sticky top-4 rounded-sm shadow-sm">
                 <div class="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#151515]">
                    <p class="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Filtrar por Região</p>
                <div id="bodyPointSidebarList">
                    <div class="px-5 py-3 cursor-pointer text-[10px] font-bold uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 last:border-0 transition-all group hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-gray-400"
                        onclick="selectCustomOption('', '-- Todos os pontos --', event)">
                        -- Todos os pontos --
                    </div>
                    ${typeof generateSidebarOptions === 'function' ? generateSidebarOptions() : ''}
                 </div>
            </div>

            <!--Mobile Dropdown Selector(Mobile Only)-- >
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
    < div class="flex md:hidden justify-center gap-3 mb-6 w-full" >
        ${views.map((v, i) => `
                    <button onclick="switchMobileView('${v.id}')" 
                        id="tab-${v.id}"
                        class="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border rounded-md transition-all ${i === 0 ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'bg-white dark:bg-black text-gray-400 border-gray-200 dark:border-gray-800'}">
                        ${v.alt}
                    </button>
                `).join('')
            }
            </div >
    `;

        html += mobileTabs;

        html += `   < !--Maps Area(Right on Desktop)-- >
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
        const el = document.getElementById(`view - ${id} `);
        const tab = document.getElementById(`tab - ${id} `);

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

// --- FILTER MENU LOGIC ---
function toggleFilterMenu() {
    const desktopMenu = document.getElementById('filterMenuDesktop');
    const mobileMenu = document.getElementById('filterMenuMobile');
    const isDesktop = window.innerWidth >= 768;

    const menu = isDesktop ? desktopMenu : mobileMenu;
    if (menu) {
        if (menu.classList.contains('hidden')) {
            renderFilterMenu();
            menu.classList.remove('hidden');
            // Close on click outside
            setTimeout(() => {
                document.addEventListener('click', closeFilterMenuOnClickOutside);
            }, 0);
        } else {
            closeFilterMenu();
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

// --- FILTROS E ORDENAÇÃO (INTEGRADO COM BODY-MAP) ---
function applyFilters() {
    // Get value from any search input (they should be synced)
    const inputs = document.querySelectorAll('.search-input');
    const searchValue = inputs.length > 0 ? inputs[0].value : '';
    const q = removeAccents(searchValue); // Normalize for accent-insensitive search

    const { activeTab, activeLetter, activeTags, bodyFilter, activeCategories, activeSources } = STATE;

    let rawItems = [];
    let label = "TODOS";

    // Coleta todos os itens se estivermos buscando, filtrando por tag ou no mapa
    // OU se estivermos na aba FAVORITOS (precisa buscar de todas as categorias)
    // OU se houver filtros combinados ativos (Categorias ou Fontes)
    if (q || activeTags.length > 0 || activeTab === 'mapa' || bodyFilter || activeTab === 'favoritos' || activeCategories.length > 0 || activeSources.length > 0) {
        Object.keys(STATE.data).forEach(cat => {
            if (Array.isArray(STATE.data[cat])) {
                STATE.data[cat].forEach(i => rawItems.push({ ...i, _cat: cat }));
            }
        });

        // Se for favoritos, filtra apenas os favoritados
        if (activeTab === 'favoritos' && typeof Favorites !== 'undefined') {
            rawItems = rawItems.filter(item => Favorites.is(item.id));
        }

        if (activeTab === 'favoritos') label = "APOSTILAS";
        else if (activeTags.length > 0 && bodyFilter) label = `TAGS: ${activeTags.map(t => `#${t}`).join(' ')} + ${document.getElementById('selectedBodyPointName')?.textContent || 'Filtro'} `;
        else if (activeTags.length > 0) label = `TAGS: ${activeTags.map(t => `#${t}`).join(' ')} `;
        else if (bodyFilter) label = "PONTO FOCAL SELECIONADO";
        else if (activeCategories.length > 0 || activeSources.length > 0) label = "RESULTADOS FILTRADOS";
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

        // 1.3 Filter by CATEGORIES (OR Logic for list of categories)
        if (activeCategories.length > 0) {
            if (!activeCategories.includes(item._cat)) return false;
        }

        // 1.4 Filter by SOURCE (OR Logic for list of sources)
        if (activeSources.length > 0) {
            if (!item.source || !activeSources.includes(item.source)) return false;
        }

        // 1.5 Filtro de PONTOS FOCAIS (Multi-select)
        if (STATE.activeFocusPoints.length > 0) {
            if (!item.focusPoints) return false;
            const hasAllPoints = STATE.activeFocusPoints.every(fp => item.focusPoints.includes(fp));
            if (!hasAllPoints) return false;
        }

        // 2. Filtro do MAPA (Integração)
        // Se estiver na aba mapa e nenhum ponto selecionado (e sem busca/tag/cat/source), não mostra nada
        if (activeTab === 'mapa' && !bodyFilter && !q && activeTags.length === 0 && activeCategories.length === 0 && activeSources.length === 0) return false;

        // Se houver um filtro de corpo, usa a função matchBodyPoint do body-map.js
        if (bodyFilter && typeof matchBodyPoint === 'function') {
            if (!matchBodyPoint(item, bodyFilter)) return false;
        }

        // 3. Filtro de LETRA (Alfabeto)
        if (!q && activeTags.length === 0 && !bodyFilter && activeCategories.length === 0 && activeSources.length === 0 && activeLetter && !item.title.toUpperCase().startsWith(activeLetter)) return false;

        return true;
    });

    // 4. Filtro de BUSCA TEXTUAL (Separado do filter loop principal)
    if (q) {
        // Reset correction state
        STATE.correctionUsed = null;

        // Use SearchEngine for smart search with ranking if available
        if (typeof SearchEngine !== 'undefined') {
            filtered = SearchEngine.search(filtered, inputs[0].value, {
                minScore: 5,
                maxResults: 100,
                useOperators: true,
                useFuzzy: true,
                useSynonyms: true
            });

            // --- AUTO-CORRECT FALLBACK ---
            // If 0 results and we have valid query > 2 chars, try correction
            if (filtered.length === 0 && q.length > 2) {
                // Ensure candidates are prepared (using ALL data for candidates, even if filtering local subset)
                if (!STATE.validCandidates) {
                    STATE.validCandidates = new Set();
                    const allItems = [];
                    Object.values(STATE.data).forEach(list => {
                        if (Array.isArray(list)) allItems.push(...list);
                    });

                    allItems.forEach(item => {
                        if (item.title) STATE.validCandidates.add(item.title);
                        if (item.tags) item.tags.forEach(t => STATE.validCandidates.add(t));
                    });
                    if (SearchEngine.synonyms) {
                        Object.keys(SearchEngine.synonyms).forEach(key => {
                            // Always add synonym keys as valid candidates
                            STATE.validCandidates.add(key);
                        });
                    }
                }

                const correction = SearchEngine.suggestCorrection(searchValue, Array.from(STATE.validCandidates));

                if (correction) {
                    // Re-run search with correction
                    filtered = SearchEngine.search(rawItems, correction, { // Search in rawItems again
                        minScore: 5,
                        maxResults: 100,
                        useOperators: true,
                        useFuzzy: true,
                        useSynonyms: true
                    });

                    if (filtered.length > 0) {
                        STATE.correctionUsed = { original: searchValue, corrected: correction };
                    }
                }
            }
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

    if (wasCrossTabMode !== STATE.isCrossTabMode) {
        renderTabs();
    }

    // Special handling for Favorites Tab
    // ... (logic handled above in rawItems init, but filtered here) ...

    // List Visibility logic...
    const list = document.getElementById('contentList');
    const empty = document.getElementById('emptyState');
    if (activeTab === 'mapa') {
        const hasFilters = q || activeTags.length > 0 || bodyFilter;
        if (hasFilters) {
            list.classList.remove('hidden');
            if (filtered.length === 0 && empty) empty.classList.remove('hidden');
        } else {
            list.classList.add('hidden');
            if (empty) empty.classList.add('hidden');
        }
    }

    // Update Counters
    document.querySelectorAll('.search-count').forEach(el => {
        el.textContent = `${filtered.length} Itens`;
    });

    // Clear Buttons
    document.querySelectorAll('.clear-search-btn').forEach(btn => {
        if (q || STATE.activeTags.length > 0) btn.classList.remove('hidden');
        else btn.classList.add('hidden');
    });

    // Render List
    renderList(filtered, activeTags, STATE.mode, STATE.activeTab);

    // --- INJECT CORRECTION BANNER ---
    if (STATE.correctionUsed) {
        const banner = document.createElement('div');
        banner.className = 'bg-yellow-50 border-b border-yellow-200 px-6 py-3 text-sm flex items-center gap-2 text-yellow-800 mb-4 animate-fade-in';
        banner.innerHTML = `
    < svg class="w-4 h-4 text-yellow-600" fill = "none" stroke = "currentColor" viewBox = "0 0 24 24" > <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg >
        <span>Exibindo resultados para <strong>${STATE.correctionUsed.corrected}</strong> em vez de <em>${STATE.correctionUsed.original}</em></span>
`;
        // Insert at top of list
        const container = document.getElementById('resultsContainer');
        if (container) {
            container.insertBefore(banner, container.firstChild);
        }
    }


}

// --- FUNÇÕES AUXILIARES ---

function renderPoints(points, prefix) {
    return points.map(p => {
        const isSelected = STATE.bodyFilter === p.id;
        const activeClass = isSelected ? 'bg-black text-white dark:bg-white dark:text-black scale-125 z-10' : 'bg-white dark:bg-black border border-gray-200 dark:border-gray-800 hover:scale-110';

        return `
    < button onclick = "toggleBodyPoint('${p.id}')"
class="absolute w-3 h-3 rounded-full shadow-sm transition-all duration-300 flex items-center justify-center group ${activeClass}"
style = "left: ${p.x - 1.5}px; top: ${p.y - 1.5}px;"
title = "${p.name}" >
    <span class="sr-only">${p.name}</span>
        </button >
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

    // Update UI
    updateUIForTab('mapa');

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
    document.getElementById('desktopSearchGhost').value = '';
    document.getElementById('mobileSearchGhost').value = '';

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
    // Update active state in state tracking
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

            applyFilters();

            // Autocomplete Logic - Show history or suggestions
            if (val.length === 0) {
                // Show search history when empty
                if (typeof SearchHistory !== 'undefined') {
                    const history = SearchHistory.getHistory();
                    if (history.length > 0) {
                        suggestionsEl.innerHTML = `
                            <div class="px-4 py-2 text-[9px] uppercase tracking-widest text-gray-400 font-bold border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                <span>Buscas Recentes</span>
                                <button onclick="clearAllHistory(event)" class="text-[9px] text-red-400 hover:text-red-600 font-bold uppercase tracking-widest transition-colors">LIMPAR</button>
                            </div>
                            ${history.slice(0, 5).map(h => `
                                <div class="group/item flex items-center justify-between px-4 hover:bg-gray-50 dark:hover:bg-gray-900 border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer">
                                    <div class="flex-grow py-3 flex items-center gap-3" data-title="${h.replace(/"/g, '&quot;')}" data-tab="${STATE.activeTab}">
                                         <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <span class="font-bold font-serif text-sm group-hover/item:text-black dark:group-hover/item:text-white">${h}</span>
                                    </div>
                                    <button onclick="deleteFromHistory('${h.replace(/'/g, "\\'")}', event)" class="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100" title="Remover do histórico">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                            `).join('')}
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

                // 1. Check for Direct Synonyms (High Priority)
                if (typeof SearchEngine !== 'undefined' && SearchEngine.synonyms) {
                    // Check if query is a key or value in synonyms
                    const related = SearchEngine.getRelatedTerms(val);
                    // Filter out the query itself from related
                    const synonyms = related.filter(r => removeAccents(r) !== q && !r.includes(q)); // Show distinct terms

                    synonyms.forEach(syn => {
                        const key = `syn:${syn} `;
                        if (!seen.has(key)) {
                            suggestions.push({
                                text: syn, // Capitalize?
                                type: 'Sinônimo',
                                priority: 4 // Highest
                            });
                            seen.add(key);
                        }
                    });
                }

                // Search across ALL data, not just active tab
                const allData = [];
                Object.keys(STATE.data).forEach(tabId => {
                    if (STATE.data[tabId]) {
                        allData.push(...STATE.data[tabId]);
                    }
                });

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

                // Search in synonyms (Keys match -> Suggest Values)
                if (typeof SearchEngine !== 'undefined' && SearchEngine.synonyms) {
                    const normalizedQ = removeAccents(q);
                    Object.keys(SearchEngine.synonyms).forEach(key => {
                        const values = SearchEngine.synonyms[key];
                        const normalizedKey = removeAccents(key);

                        // Check if query matches the KEY or any of the VALUES
                        const matchKey = normalizedKey.includes(normalizedQ);
                        const matchValue = values.some(v => removeAccents(v).includes(normalizedQ));

                        if (matchKey || matchValue) {
                            // Add Key itself
                            const kKey = `syn:${key}`;
                            if (!seen.has(kKey)) {
                                suggestions.push({
                                    text: key.charAt(0).toUpperCase() + key.slice(1),
                                    type: 'Sinônimo',
                                    priority: 4 // Higher priority than Titles (3)
                                });
                                seen.add(kKey);
                            }

                            // Add all Values
                            values.forEach(val => {
                                const sKey = `syn:${val}`;
                                if (!seen.has(sKey)) {
                                    suggestions.push({
                                        text: val.charAt(0).toUpperCase() + val.slice(1),
                                        type: 'Sinônimo',
                                        priority: 4 // Higher priority than Titles (3)
                                    });
                                    seen.add(sKey);
                                }
                            });
                        }
                    });
                }              // Sort by priority (titles first, then tags, then focus points, then synonyms) and limit to 8
                suggestions.sort((a, b) => b.priority - a.priority);
                currentSuggestions = suggestions.slice(0, 8);
                selectedIndex = -1; // Reset selection

                // --- 3. SPELL CORRECTION (Did You Mean?) ---
                // Only if no results found and query > 2 chars
                if (currentSuggestions.length === 0 && val.length > 2 && typeof SearchEngine !== 'undefined') {
                    // Collect candidates for correction
                    const candidates = new Set();

                    // Add Titles and Tags
                    allData.forEach(item => {
                        if (item.title) candidates.add(item.title);
                        if (item.tags) item.tags.forEach(t => candidates.add(t));
                    });

                    // Add Synonym Keys (Always add them, don't check for results)
                    if (SearchEngine.synonyms) {
                        Object.keys(SearchEngine.synonyms).forEach(k => candidates.add(k));
                    }

                    const correction = SearchEngine.suggestCorrection(val, Array.from(candidates));

                    if (correction) {
                        currentSuggestions.push({
                            text: correction,
                            type: 'Você quis dizer?',
                            priority: 5, // Top priority
                            isCorrection: true
                        });
                    }
                }

                // --- GHOST INPUT LOGIC ---
                const isMobile = window.innerWidth < 768; // Example breakpoint for mobile
                const ghostInput = isMobile ? document.getElementById('mobileSearchGhost') : document.getElementById('desktopSearchGhost');

                if (ghostInput) {
                    // Reset ghost if input changed
                    ghostInput.value = '';

                    // Only show ghost if we have suggestions and input > 1 char
                    if (val.length > 1 && currentSuggestions.length > 0) {
                        const topMatch = currentSuggestions[0];

                        // Only ghost if it acts as a suffix (starts with input) and IS NOT a correction
                        // Case insensitive check, but we display the SUGGESTION's casing
                        if (!topMatch.isCorrection && topMatch.text.toLowerCase().startsWith(val.toLowerCase())) {
                            // Visually align casing:
                            // We want to keep the user's typed casing but append the rest?
                            // Actually, iOS usually replaces the casing with the suggestion's standard casing.
                            // But for "Ghost behind", if user types "baRR", and suggestion is "Barriga",
                            // "Barriga" behind "baRR" looks like "B-a-R-R-i-g-a".
                            // "B" vs "b" clash.
                            // To look perfect, the ghost must MATCH user casing for the prefix.
                            // Hard to do.
                            // Alternative: Ghost Input text color is light gray. Real input text color is solid black.
                            // If they overlap perfectly, black covers gray.
                            // "b" covers "B"? No.
                            // "b" and "B" have different shapes.
                            // Ideal: suggestion.slice(val.length).
                            // But we can't position it easily without canvas measurement.
                            // COMPROMISE: We set ghost value to Suggestion Casing.
                            // Users usually accept the "Official" casing.
                            ghostInput.value = topMatch.text;
                        }
                    }
                }

                if (currentSuggestions.length > 0) {
                    suggestionsEl.innerHTML = currentSuggestions.map((match, index) => {
                        const isSelected = index === selectedIndex;
                        const selectedClass = isSelected ? 'bg-gray-100 dark:bg-gray-800' : '';

                        // Distinct style for corrections
                        if (match.isCorrection) {
                            return `
                                <div data-title="${match.text.replace(/"/g, '&quot;')}" data-tab="${STATE.activeTab}" 
                                class="px-4 py-3 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 cursor-pointer text-sm border-b border-gray-50 dark:border-gray-800 last:border-0 flex justify-between items-center group ${selectedClass}">
                                    <div class="flex items-center gap-2">
                                        <svg class="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                        <span class="font-bold font-serif text-black dark:text-white"><em>Você quis dizer:</em> ${match.text}?</span>
                                    </div>
                                    <span class="text-[9px] uppercase tracking-widest text-yellow-600 border border-yellow-200 rounded px-1.5 py-0.5 bg-yellow-50">Correção</span>
                                </div>
                            `;
                        }

                        return `
                            <div data-title="${match.text.replace(/"/g, '&quot;')}" data-tab="${STATE.activeTab}" 
                            class="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer text-sm border-b border-gray-50 dark:border-gray-800 last:border-0 flex justify-between items-center group ${selectedClass}">
                                <span class="font-bold font-serif group-hover:text-black dark:group-hover:text-white">${match.text}</span>
                                <span class="text-[9px] uppercase tracking-widest text-gray-400 border border-gray-100 dark:border-gray-800 rounded px-1.5 py-0.5 bg-gray-50 dark:bg-gray-900">${match.type}</span>
                            </div>
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

        // Keydown for Ghost Accept
        input.addEventListener('keydown', (e) => {
            const isMobile = window.innerWidth < 768;
            const ghostInput = isMobile ? document.getElementById('mobileSearchGhost') : document.getElementById('desktopSearchGhost');

            if (e.key === 'Tab' || (e.key === 'ArrowRight' && input.selectionStart === input.value.length)) {
                if (ghostInput && ghostInput.value) {
                    e.preventDefault();
                    input.value = ghostInput.value;
                    ghostInput.value = ''; // Clear ghost
                    // Trigger existing logic (updates suggestions too)
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
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
}

function deleteFromHistory(term, event) {
    if (event) event.stopPropagation();

    if (typeof SearchHistory !== 'undefined') {
        SearchHistory.remove(term);

        // Re-trigger input logic
        const inputs = document.querySelectorAll('.search-input');
        if (inputs.length > 0) {
            const input = inputs[0];
            // Trigger logic to re-render suggestions
            // We need to simulate the condition where suggestions are shown (empty input or focus)
            // Using dispatchEvent might be enough if the listener handles it.
            // Line 1153 handles val.length === 0.
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
        }
    }
}

function clearAllHistory(event) {
    if (event) event.stopPropagation();

    if (typeof SearchHistory !== 'undefined') {
        SearchHistory.clearHistory();

        // Re-trigger input logic to refresh suggestions (will hide history)
        const inputs = document.querySelectorAll('.search-input');
        if (inputs.length > 0) {
            const input = inputs[0];
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
        }
    }
}

// --- KEYBOARD SHORTCUTS ---
document.addEventListener('keydown', (e) => {
    // 1. Focus Search: '/' or 'Cmd+K' / 'Ctrl+K'
    if (
        (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) ||
        ((e.metaKey || e.ctrlKey) && e.key === 'k')
    ) {
        e.preventDefault();
        const input = document.getElementById('desktopSearchInput') || document.querySelector('.search-input');
        if (input) {
            // Ensure proper view logic
            const desktopWrapper = document.getElementById('desktopSearchWrapper');
            // If desktop wrapper is visible (offsetParent != null), focus desktop input
            if (desktopWrapper && desktopWrapper.offsetParent !== null) {
                document.getElementById('desktopSearchInput').focus();
            } else {
                // Mobile
                document.querySelector('.search-input').focus();
            }
        }
    }

    // 2. Escape: Close Modal OR Clear/Blur Search
    if (e.key === 'Escape') {
        // If modal open, close it
        const modal = document.getElementById('readModal');
        if (modal && !modal.classList.contains('hidden')) {
            closeModal();
            return;
        }

        // If suggestion box open or input focused, clear/blur
        const active = document.activeElement;
        if (active && active.classList.contains('search-input')) {
            active.blur();
            document.getElementById('searchSuggestions')?.classList.add('hidden');
        }
    }
});

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

    // Update scroll progress bar
    const progressBar = document.getElementById('scrollProgressBar');
    if (progressBar) {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;

        let scrollPercentage = 0;
        if (documentHeight > windowHeight) {
            scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
        }
        progressBar.style.width = Math.min(scrollPercentage, 100) + '%';
    }
});


// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // ... existing initialization ...
    setupSearch();

    // Keyboard Navigation for Modal
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('readModal');
        if (modal && !modal.classList.contains('hidden')) {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowLeft') {
                navModal(-1);
            } else if (e.key === 'ArrowRight') {
                navModal(1);
            }
        }
    });

    // Keyboard shortcut for Search (/)
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

            e.preventDefault();
            document.querySelector('.search-input')?.focus();
        }
    });
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

// --- MODAL LOGIC ---
let currentModalIndex = -1;

function openModal(i) {
    currentModalIndex = i;
    const item = STATE.list[i];
    const catConfig = CONFIG.modes[STATE.mode].cats[item._cat];

    document.getElementById('modalTitle').textContent = item.title;
    const catEl = document.getElementById('modalCategory');
    catEl.textContent = catConfig ? catConfig.label : item._cat;

    // Generate Breadcrumbs
    const breadcrumbEl = document.getElementById('modalBreadcrumb');
    if (breadcrumbEl) {
        const modeLabel = CONFIG.modes[STATE.mode].description;
        const categoryLabel = catConfig ? catConfig.label : item._cat;

        breadcrumbEl.innerHTML = `
            <span class="font-semibold">${modeLabel}</span>
            <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
            <span class="font-semibold">${categoryLabel}</span>
        `;
    }

    // Favorites Button in Modal (Now "Add to Apostila")
    let favBtnHtml = '';
    if (typeof Favorites !== 'undefined') {
        const isFav = Favorites.is(item.id);
        // Icon: Minimalist Swiss Style (Thin)
        const emptyIcon = `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" stroke-width="1" />`;
        const filledIcon = `<path fill="currentColor" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />`;

        favBtnHtml = `<button class="fav-btn ml-auto p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors group/icon"
onclick="Favorites.toggle('${item.id}')" data-id="${item.id}" title="${isFav ? 'Remover da Apostila' : 'Adicionar à Apostila'}">
    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 transition-all duration-300 ${isFav ? 'text-blue-600 fill-blue-600' : 'text-gray-300 hover:text-blue-400 dark:text-gray-600 dark:hover:text-blue-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
        ${isFav ? filledIcon : emptyIcon}
    </svg>
        </button>`;
    }

    if (catConfig) {
        catEl.className = `text - [10px] font - sans font - bold uppercase tracking - widest block mb - 2 text - ${catConfig.color} `;
    }

    // Inject button into header area
    // Find the actions container (parent of close button or font controls)
    const activeModalCard = document.getElementById('modalCard');
    const actionsContainer = activeModalCard.querySelector('.flex.items-center.gap-4');

    if (actionsContainer) {
        // Remove existing favorite button if any
        const existingBtn = actionsContainer.querySelector('.fav-btn');
        if (existingBtn) existingBtn.remove();

        // Inject new button at the beginning (left of font controls)
        // or between font controls and close button?
        // Let's put it to the left of font controls for visibility
        actionsContainer.insertAdjacentHTML('afterbegin', favBtnHtml);
    }
    // I can append it to modalCategory parent or Title parent.
    // Let's replace title area with flex container effectively.
    // BUT modifying HTML structure might break existing CSS.
    // I'll assume I can just append it to the `modalHeader` container dynamically or insert it.
    // Wait, `modalTitle` is inside a div?
    // Let's just modify the `modalCategory` element to include the button next to it? No, category is a span.

    // Simpler: Inject it into `modalTitle`'s parent.
    // Or replace `modalCategory` logic to include it.
    // I will check DOM in next step if this insertion is tricky.
    // But for now, let's insert it into the DOM directly.
    const headerContainer = document.getElementById('modalTitle').parentElement;
    // Check if button already exists to avoid duplication?
    // Better: Re-render header actions completely.
    // Since I can't see the HTML structure fully here, I'll view it first?
    // I already viewed `openModal`.
    // References: `modalTitle`, `modalCategory`.
    // I'll try to find a container.
    // Let's use `document.getElementById('modalActions')` if it exists? No.

    // I will output the button into a new container or append to existing.
    // Let's assume there's a space.
    // Actually, I'll create a container next to category.

    // Plan B: Replace `catEl.innerHTML` with button? No.
    // I'll view index.html modal structure first.


    document.getElementById('modalSource').textContent = item.source || "Fonte Original";
    document.getElementById('modalRef').textContent = `#${i + 1} `;

    const inputs = document.querySelectorAll('.search-input');
    let searchQuery = inputs.length > 0 ? inputs[0].value.trim() : '';

    // Highlight body point keywords if filtering by body point
    if (!searchQuery && STATE.selectedBodyPoint && STATE.activeTab === 'mapa') {
        const pointIds = STATE.selectedBodyPoint.split(',');
        const keywords = new Set();
        pointIds.forEach(pid => {
            const keys = BODY_DATA.keywords[pid];
            if (keys) {
                if (Array.isArray(keys)) keys.forEach(k => keywords.add(k));
                else keywords.add(keys);
            } else {
                keywords.add(pid);
            }
        });
        // Use | as delimiter to preserve phrases (handled in formatBodyText)
        searchQuery = Array.from(keywords).join('|');
    }
    document.getElementById('modalContent').innerHTML = formatBodyText(item.content, searchQuery);

    const fpContainer = document.getElementById('modalFocusContainer');
    // Hide focus points for Fundamentos and Casos e Orientações (curas)
    const showFocusPoints = !['fundamentos', 'curas'].includes(STATE.activeTab);

    // Build Highlight Regex (same logic as formatBodyText)
    let highlightRegex = null;
    if (searchQuery) {
        let tokens;
        let useBoundaries = false;
        if (searchQuery.includes('|')) {
            tokens = searchQuery.split('|').filter(t => t.trim().length > 0);
            useBoundaries = true;
        } else {
            tokens = searchQuery.split(/\s+/).filter(t => t.length > 0);
        }
        const terms = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        if (terms) {
            highlightRegex = new RegExp(useBoundaries ? `\\b(${terms}) \\b` : `(${terms})`, 'i');
        }
    }

    if (showFocusPoints && item.focusPoints && item.focusPoints.length > 0) {
        fpContainer.classList.remove('hidden');
        const html = item.focusPoints.map(p => {
            const isMatch = highlightRegex && highlightRegex.test(removeAccents(p));
            // Highlighting style if matched
            const baseClass = "text-[10px] font-bold uppercase tracking-widest border px-2 py-1 transition-colors";
            const colorClass = isMatch
                ? "border-yellow-500 bg-yellow-100 text-black dark:bg-yellow-900 dark:text-yellow-100" // Highlighted
                : "border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"; // Normal

            return `< button onclick = "filterByFocusPoint('${p}')" class="${baseClass} ${colorClass}" > ${p}</button > `;
        }).join('');
        document.getElementById('modalFocusPoints').innerHTML = html;
    } else {
        fpContainer.classList.add('hidden');
    }

    document.getElementById('prevBtn').disabled = i === 0;
    document.getElementById('nextBtn').disabled = i === STATE.list.length - 1;

    const modal = document.getElementById('readModal');
    const card = document.getElementById('modalCard');
    const backdrop = document.getElementById('modalBackdrop');

    modal.classList.remove('hidden');
    void modal.offsetWidth;

    card.classList.add('open');
    backdrop.classList.add('open');

    document.body.style.overflow = 'hidden';

    if (searchQuery) {
        setTimeout(() => {
            const highlight = document.querySelector('.search-highlight');
            if (highlight) highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
    }

    // Deep Linking: Update URL Hash
    const slug = generateSlug(item.title);
    history.replaceState(null, null, `# / ${slug} `);
}

function closeModal() {
    const modal = document.getElementById('readModal');
    const card = document.getElementById('modalCard');
    const backdrop = document.getElementById('modalBackdrop');

    card.classList.remove('open');
    backdrop.classList.remove('open');

    // Deep Linking: Clear URL Hash
    history.replaceState(null, null, ' ');

    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        currentModalIndex = -1;
    }, 300);
}

// --- DEEP LINKING HELPERS ---
function generateSlug(text) {
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
}

function checkHashAndOpen() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#/')) {
        const slug = hash.substring(2); // Remove #/

        let foundIndex = -1;
        let foundTab = '';

        // Search through all tabs
        for (const tab of Object.keys(STATE.data)) {
            const items = STATE.data[tab];
            const idx = items.findIndex(i => generateSlug(i.title) === slug);
            if (idx !== -1) {
                foundTab = tab;
                foundIndex = idx;
                break;
            }
        }

        if (foundIndex !== -1) {
            // Switch to that tab
            document.querySelectorAll('.tab-btn').forEach(b => {
                if (b.dataset.tab === foundTab) b.click();
            });
            // Open modal (setTimeout to allow list render?)
            setTimeout(() => {
                // Re-find in STATE.list (which is now filtered/populated by switchTab)
                // But wait, switchTab resets filters.
                // We can just find the global index?
                // openModal(i) uses STATE.list[i].
                // If we switched tab, STATE.list should be STATE.data[foundTab] (unless search is active).
                // So foundIndex should be correct index in that tab's list.
                openModal(foundIndex);
            }, 100);
        }
    }
}

function navModal(dir) {
    const next = currentModalIndex + dir;
    if (next >= 0 && next < STATE.list.length) {
        const content = document.getElementById('modalContent');
        content.style.opacity = '0';
        setTimeout(() => {
            openModal(next);
            content.style.opacity = '1';
        }, 200);
    }
}

// Controle de Fonte
window.changeFontSize = function (size) {
    const content = document.getElementById('modalContent');
    content.classList.remove('text-sm-mode', 'text-lg-mode');
    if (size === 'sm') content.classList.add('text-sm-mode');
    if (size === 'lg') content.classList.add('text-lg-mode');
};
// --- BODY MAP HELPERS ---
function generateSidebarOptions() {
    if (typeof BODY_DATA === 'undefined') return '';

    let html = '';
    // Front Points
    if (BODY_DATA.points && BODY_DATA.points.front) {
        BODY_DATA.points.front.forEach(p => {
            html += renderSidebarItem(p);
        });
    }
    // Back Points
    if (BODY_DATA.points && BODY_DATA.points.back) {
        BODY_DATA.points.back.forEach(p => {
            html += renderSidebarItem(p);
        });
    }
    return html;
}

function renderSidebarItem(p) {
    return `<div class="px-5 py-3 cursor-pointer text-[10px] font-bold uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 last:border-0 transition-all group hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-gray-500"
        onclick="toggleBodyPoint('${p.id}')">
        ${p.name}
    </div>`;
}
