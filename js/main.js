// --- ESTADO GLOBAL ---
let STATE = {
    mode: 'ensinamentos',
    activeTab: null,
    activeLetter: '',
    bodyFilter: [], // Array para múltiplos filtros
    activeTag: null,
    data: {},
    list: [],
    idx: -1
};

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Carrega Tema Salvo
    if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');

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
        STATE.data = {};

        await Promise.all(idxData.categories.map(async cat => {
            const res = await fetch(`${cfg.path}${cat.file}`);
            STATE.data[cat.id] = await res.json();
        }));

        if (!STATE.activeTab) STATE.activeTab = Object.keys(STATE.data)[0];

        renderTabs();
        renderAlphabet();
        applyFilters();

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
    document.getElementById('searchInput').value = '';

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
    document.getElementById('searchInput').value = '';

    renderTabs();
    applyFilters();
}

function renderTabs() {
    const container = document.getElementById('tabsContainer');
    const catMap = CONFIG.modes[STATE.mode].cats;

    let html = Object.keys(STATE.data).map(id => {
        const active = STATE.activeTab === id;
        const config = catMap[id];
        const label = config ? config.label : id;
        const activeClass = active
            ? `border-${config.color} text-${config.color}`
            : 'border-transparent hover:text-black dark:hover:text-white';

        return `<button onclick="setTab('${id}')" class="tab-btn ${activeClass}">${label}</button>`;
    }).join('');

    // Adiciona aba Mapa apenas no modo ensinamentos
    if (STATE.mode === 'ensinamentos') {
        const active = STATE.activeTab === 'mapa';
        const activeClass = active
            ? `border-cat-dark text-cat-dark dark:border-white dark:text-white`
            : 'border-transparent hover:text-black dark:hover:text-white';
        html += `<button onclick="setTab('mapa')" class="tab-btn ${activeClass}">Mapa Corporal</button>`;
    }

    container.innerHTML = html;
    updateUIForTab(STATE.activeTab);
}

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
    } else if (tabId === 'mapa') {
        map.classList.remove('hidden');
        list.classList.add('hidden'); // Hide list for map tab
        if (empty) empty.classList.add('hidden');

        // Render Static Images
        const views = [
            { id: 'front', img: 'assets/images/mapa_corporal_1.jpg', alt: 'Frente' },
            { id: 'detail', img: 'assets/images/mapa_corporal_3.jpg', alt: 'Detalhes' },
            { id: 'back', img: 'assets/images/mapa_corporal_2.jpg', alt: 'Costas' }
        ];

        let html = `
            <!-- Mapas Desktop: Grid 3 colunas -->
            <div class="hidden md:grid md:grid-cols-3 gap-6 mb-12 max-w-[100rem] mx-auto">
        `;

        views.forEach(view => {
            html += `
                <div class="relative">
                    <img src="${view.img}" alt="${view.alt}" class="w-full h-auto object-contain p-4" />
                </div>
            `;
        });

        html += `</div>`;

        // Mapas Mobile: Scroll horizontal
        html += `
            <div class="md:hidden flex overflow-x-auto snap-x gap-4 pb-8 hide-scrollbar">
                ${views.map(view => `
                    <div class="snap-center shrink-0 w-[85vw] relative">
                        <img src="${view.img}" alt="${view.alt}" class="w-full h-auto object-contain" />
                    </div>
                `).join('')}
            </div>
            <p class="text-center text-[10px] font-bold uppercase tracking-widest text-gray-300 mt-4 md:hidden">Deslize para ver mais</p>
        `;

        map.innerHTML = html;
    }
}

// --- FILTROS E ORDENAÇÃO (INTEGRADO COM BODY-MAP) ---
function applyFilters() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    const { activeTab, activeLetter, activeTag, bodyFilter } = STATE;

    let rawItems = [];
    let label = "TODOS";

    // Coleta todos os itens se estivermos buscando, filtrando por tag ou no mapa
    if (q || activeTag || activeTab === 'mapa' || bodyFilter) {
        Object.keys(STATE.data).forEach(cat => {
            STATE.data[cat].forEach(i => rawItems.push({ ...i, _cat: cat }));
        });

        if (activeTag && bodyFilter) label = `TAG: #${activeTag} + ${document.getElementById('selectedBodyPointName')?.textContent || 'Filtro'}`;
        else if (activeTag) label = `TAG: #${activeTag.toUpperCase()}`;
        else if (bodyFilter) label = "PONTO FOCAL SELECIONADO";
        else if (q) label = "RESULTADOS DA BUSCA";
        else if (activeTab === 'mapa') label = "SELECIONE UMA REGIÃO ACIMA";
    } else {
        // Caso contrário, pega apenas itens da aba atual
        rawItems = (STATE.data[activeTab] || []).map(i => ({ ...i, _cat: activeTab }));
        label = CONFIG.modes[STATE.mode].cats[activeTab] ? CONFIG.modes[STATE.mode].cats[activeTab].label : activeTab;
    }

    let filtered = rawItems.filter(item => {
        // 1. Filtro de TAG
        if (activeTag && (!item.tags || !item.tags.includes(activeTag))) return false;

        // 2. Filtro do MAPA (Integração)
        // Se estiver na aba mapa e nenhum ponto selecionado (e sem busca/tag), não mostra nada
        if (activeTab === 'mapa' && !bodyFilter && !q && !activeTag) return false;

        // Se houver um filtro de corpo, usa a função matchBodyPoint do body-map.js
        if (bodyFilter && typeof matchBodyPoint === 'function') {
            if (!matchBodyPoint(item, bodyFilter)) return false;
        }

        // 3. Filtro de LETRA (Alfabeto)
        if (!q && !activeTag && !bodyFilter && activeLetter && !item.title.toUpperCase().startsWith(activeLetter)) return false;

        // 4. Filtro de BUSCA TEXTUAL
        if (q) {
            const content = (item.content || '').toLowerCase();
            const title = item.title.toLowerCase();
            const tags = item.tags || [];
            return title.includes(q) || content.includes(q) || tags.some(t => t.toLowerCase().includes(q));
        }
        return true;
    });

    // Ordenação (Preserva ordem numérica se existir)
    filtered.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
        }
        return 0;
    });

    STATE.list = filtered;

    // Atualiza contadores e UI
    const countEl = document.getElementById('searchCount');
    if (countEl) countEl.textContent = `${filtered.length} Itens`;

    renderList(filtered, activeTag, STATE.mode);
}

// --- FUNÇÕES AUXILIARES ---

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').classList.add('hidden');
    STATE.activeTag = null;

    // Opcional: Limpar mapa ao limpar busca? Geralmente não.
    // if(typeof clearBodyFilter === 'function') clearBodyFilter();

    applyFilters();
}

function filterByTag(tag, event) {
    if (event) event.stopPropagation();

    if (STATE.activeTag === tag) STATE.activeTag = null;
    else STATE.activeTag = tag;

    document.getElementById('searchInput').value = '';
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
    STATE.activeTag = null;
    renderAlphabet();
    applyFilters();
}

function renderAlphabet() {
    const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const container = document.getElementById('alphabetContainer');
    const currentData = STATE.data[STATE.activeTab] || [];
    const availableLetters = new Set(currentData.map(i => i.title ? i.title.charAt(0).toUpperCase() : ''));

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
    if (catConfig) {
        catEl.className = `text-[10px] font-sans font-bold uppercase tracking-widest block mb-2 text-${catConfig.color}`;
    }

    document.getElementById('modalSource').textContent = item.source || "Fonte Original";
    document.getElementById('modalRef').textContent = `#${i + 1}`;

    const searchQuery = document.getElementById('searchInput').value.trim();
    document.getElementById('modalContent').innerHTML = formatBodyText(item.content, searchQuery);

    const fpContainer = document.getElementById('modalFocusContainer');
    if (item.focusPoints && item.focusPoints.length > 0) {
        fpContainer.classList.remove('hidden');
        document.getElementById('modalFocusPoints').innerHTML = item.focusPoints.map(p =>
            `<span class="text-[10px] font-bold uppercase tracking-widest border border-black dark:border-white px-2 py-1 bg-white dark:bg-black text-black dark:text-white">${p}</span>`
        ).join('');
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
}

function closeModal() {
    const modal = document.getElementById('readModal');
    const card = document.getElementById('modalCard');
    const backdrop = document.getElementById('modalBackdrop');

    card.classList.remove('open');
    backdrop.classList.remove('open');

    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }, 250);
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