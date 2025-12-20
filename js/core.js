
function unlockApp() {
    document.getElementById('passwordOverlay').classList.add('hidden');
    document.getElementById('appContent').classList.remove('hidden');
    document.getElementById('appContent').classList.add('flex');
    loadData();
}

// --- CARREGAMENTO DE DADOS ---
// --- CARREGAMENTO DE DADOS ---
async function loadData() {
    const cfg = CONFIG.modes[STATE.mode];
    try {
        // 1. Fetch Main Index (Ensinamentos)
        const idxRes = await fetch(`${cfg.path}${cfg.file}?t=${Date.now()}`);
        const idxData = await idxRes.json();

        // 2. Fetch Explicações Index (to merge into Fundamentos)
        const expRes = await fetch(`${cfg.path}explicacoes_index.json?t=${Date.now()}`);
        const expData = await expRes.json();

        const tempData = {};

        // 3. Load Main Content (Fundamentos, Curas, Pontos Focais)
        await Promise.all(idxData.categories.map(async cat => {
            const res = await fetch(`${cfg.path}${cat.file}?t=${Date.now()}`);
            tempData[cat.id] = await res.json();
        }));

        // 4. Load Explicacoes Content
        const explicacoesItems = [];
        await Promise.all(expData.categories.map(async cat => {
            const res = await fetch(`${cfg.path}${cat.file}?t=${Date.now()}`);
            const items = await res.json();
            items.forEach(item => {
                // Add tag/category metadata if needed to distinguish
                item.tags = item.tags || [];
                item.tags.push("Guia de Estudo");
            });
            explicacoesItems.push(...items);
        }));

        // 5. Construct STATE.data with 4 Keys
        STATE.data = {};

        // Tab 1: Fundamentos (Original Fundamentos + Explicações)
        STATE.data['fundamentos'] = [
            ...(tempData['fundamentos'] || []),
            ...explicacoesItems
        ];

        // Process Curas (Casos e Orientações) into Testemunhos and Q&A
        const curasItems = tempData['curas'] || [];

        // Tab 2: Testemunhos (Type: "Caso Clínico" OR "Testemunho" if exists)
        STATE.data['testemunhos'] = curasItems.filter(item =>
            item.type === 'Caso Clínico' || item.type === 'Testemunho'
        );

        // Tab 3: Q&A (Type: "Q&A" OR "Pergunta e Resposta")
        STATE.data['qa'] = curasItems.filter(item =>
            item.type === 'Q&A' || item.type === 'Pergunta e Resposta'
        );

        // Tab 4: Pontos Focais
        STATE.data['pontos_focais'] = tempData['pontos_focais'] || [];


        // Populate Global Cached Data
        STATE.globalData = {};
        Object.entries(STATE.data).forEach(([tabId, items]) => {
            items.forEach(item => {
                if (item && item.id) {
                    STATE.globalData[item.id] = { ...item, _cat: tabId };
                    // Note: _cat is now the TAB ID, which helps renderList know which label to use.
                    // But wait, mappings in CONFIG are for these new keys? Yes.
                }
            });
        });

        console.log("Global Data ID Cache Size:", Object.keys(STATE.globalData).length);

        if (!STATE.activeTab) STATE.activeTab = 'fundamentos';

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

        // Detect Mode Switch
        const urlMode = urlParams.get('mode');

        if (urlMode && CONFIG.modes[urlMode]) {
            if (STATE.mode !== urlMode) {
                console.log(`Deep Link: Switching mode to ${urlMode}`);
                if (typeof setMode === 'function') {
                    setMode(urlMode);
                    return;
                }
            }
        }

        // Fallback: Detect Mode based on ID prefix if logic exists (Optional, kept for backward compat)
        if (itemId && !urlMode) {
            let requiredMode = null;
            if (itemId.startsWith('explicacao_')) {
                // Legacy explicacoes maps to fundamentos tab (merged)
                if (STATE.activeTab !== 'fundamentos') {
                    setTab('fundamentos');
                    return;
                }
            } else if (itemId.startsWith('fundamentos_')) {
                if (STATE.activeTab !== 'fundamentos') { setTab('fundamentos'); return; }
            } else if (itemId.startsWith('curas_') && itemId.includes('q&a')) {
                if (STATE.activeTab !== 'qa') { setTab('qa'); return; }
            } else if (itemId.startsWith('curas_')) {
                // Default curas -> testemunhos
                if (STATE.activeTab !== 'testemunhos') { setTab('testemunhos'); return; }
            } else if (itemId.startsWith('pontos_')) {
                if (STATE.activeTab !== 'pontos_focais') { setTab('pontos_focais'); return; }
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

                // Ensure fresh state
                applyFilters();

                const newIndex = STATE.list.findIndex(listItem => listItem.id === foundId);

                if (newIndex !== -1) {
                    // Item is in the current filtered list
                    openModal(newIndex);
                } else {
                    // Item exists in global data but is hidden by current filters/tabs
                    // Open in "Standalone Mode" (like related items)
                    console.log("Opening deep-linked item in standalone mode:", foundId);
                    const item = STATE.globalData[foundId];
                    if (item) {
                        openModal(-1, item);
                    } else {
                        console.error("Deep-linked item data missing:", foundId);
                    }
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

    if (btnEns && btnGuia) {
        if (newMode === 'ensinamentos') {
            btnEns.className = activeClass;
            btnGuia.className = inactiveClass;
        } else {
            btnEns.className = inactiveClass;
            btnGuia.className = activeClass;
        }
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
