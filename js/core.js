
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
        const idxRes = await fetch(`${cfg.path}${cfg.file}?t=${Date.now()}`);
        const idxData = await idxRes.json();
        const tempData = {};

        await Promise.all(idxData.categories.map(async cat => {
            const res = await fetch(`${cfg.path}${cat.file}?t=${Date.now()}`);
            tempData[cat.id] = await res.json();
        }));

        // Create STATE.data in the desired order
        STATE.data = {};
        if (!STATE.globalData) STATE.globalData = {};

        // Populate Global Data Cache (Flattened)
        Object.entries(tempData).forEach(([catId, categoryItems]) => {
            if (Array.isArray(categoryItems)) {
                categoryItems.forEach(item => {
                    if (item && item.id) {
                        // Inject category for reference
                        STATE.globalData[item.id] = { ...item, _cat: catId };
                    }
                });
            }
        });
        console.log("Global Data ID Cache Size:", Object.keys(STATE.globalData).length);

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

        // New: Check URL for Deep Link AFTER UI is fully rendered
        checkUrlForDeepLink();

    } catch (e) { console.error("Erro load:", e); }
}

function checkUrlForDeepLink() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const itemSlug = urlParams.get('item');
        const itemId = urlParams.get('id');

        // Detect Mode Switch requirement based on ID prefix
        if (itemId) {
            let requiredMode = null;
            if (itemId.startsWith('explicacao_')) {
                requiredMode = 'explicacoes';
            } else if (itemId.startsWith('fundamentos_') || itemId.startsWith('curas_') || itemId.startsWith('pontos_')) {
                requiredMode = 'ensinamentos';
            }

            // If we are in the wrong mode, switch mode and return.
            // setMode will check if mode is different, update STATE, and call loadData.
            // loadData will eventually call checkUrlForDeepLink again.
            if (requiredMode && STATE.mode !== requiredMode) {
                console.log(`Deep Link: Switching mode to ${requiredMode} for id ${itemId}`);
                if (typeof setMode === 'function') {
                    setMode(requiredMode);
                    return; // Stop here, let the reload handle it
                }
            }
        }

        if (STATE.globalData) {
            let foundId = null;

            // 1. Try Direct ID Match
            if (itemId && STATE.globalData[itemId]) {
                foundId = itemId;
            }

            // 2. Try Slug Match (if no ID match or ID not provided)
            if (!foundId && itemSlug) {
                foundId = Object.keys(STATE.globalData).find(key => {
                    const item = STATE.globalData[key];
                    return item && item.title && toSlug(item.title) === itemSlug;
                });
            }

            if (foundId) {
                console.log("Deep link found for:", foundId);
                // Ensure list is filtered/ready? 
                // Currently filterList filters based on STATE.selectedCategory etc.
                // If the item is in globalData but not in list (due to filters), openModal might fail if it relies on index in STATE.list.
                // We should force a "Global Search" state or reset filters to ensure item is in list.

                // For safety, clear filters to ensure item appears in list
                // But blindly clearing filters might be annoying. 
                // Better: find index in global list, or just ensure it's in render list.

                // Existing logic used filterList(), then findIndex in STATE.list.
                // Let's reset filters to ensure visibility.
                if (typeof clearSearch === 'function') clearSearch(); // This might be too aggressive?

                // Alternative: just ensure the category of the item is active?
                // The item has `_cat`.
                const item = STATE.globalData[foundId];
                if (item && item._cat) {
                    // We could set STATE.selectedCategory... but let's just use filterList default
                }

                filterList(); // Re-run filter to be sure (init state)

                const newIndex = STATE.list.findIndex(listItem => listItem.id === foundId);
                if (newIndex !== -1) {
                    openModal(newIndex);
                } else {
                    console.error("Deep-linked item not found in filtered list:", foundId);
                    // Fallback: If not in list, maybe force add it? (Complicated)
                    // If we cleared search/filters, it SHOULD be in list unless logic is weird.
                }
            }
        }
    } catch (e) {
        console.error("Error checking deep link:", e);
    }
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
    STATE.activeTags = [];       // Reset Tags
    STATE.activeCategories = []; // Reset Categories
    STATE.activeSources = [];    // Reset Sources

    // Update Active Filters UI
    if (typeof renderActiveFilters === 'function') renderActiveFilters();

    // Update Search Inputs (Clear and Set Placeholder)
    document.querySelectorAll('.search-input').forEach(input => input.value = '');
    updateSearchPlaceholder();

    loadData();
}

// --- CONTROLE DE ABAS ---
function setTab(id) {
    // Fast Exit for Clear Button: reduce friction when switching contexts
    document.querySelectorAll('.clear-search-btn').forEach(btn => {
        btn.classList.add('fast-exit');
        // Cleanup after transition
        setTimeout(() => btn.classList.remove('fast-exit'), 300);
    });

    STATE.activeTab = id;
    STATE.activeLetter = '';

    // Ao mudar de aba, geralmente queremos resetar o filtro específico do corpo
    // a menos que estejamos indo PARA o mapa.
    if (id !== 'mapa' && typeof clearBodyFilter === 'function') {
        clearBodyFilter();
    }

    // STATE.activeTag = null; // Removed to persist tags across tabs
    // STATE.activeTags is NOT cleared here, so filters persist.

    document.querySelectorAll('.search-input').forEach(input => input.value = '');

    renderTabs();
    applyFilters();
    updateMapLayout(id);

    // Refresh tag browser with new tab data
    if (typeof initializeTagBrowser === 'function') {
        initializeTagBrowser();
    }
}
