// --- ESTADO GLOBAL ---
let STATE = {
    mode: 'ensinamentos',
    activeTab: null,
    activeLetter: '',
    bodyFilter: '',
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
                STATE.bodyFilter = '';
                STATE.activeTag = null;
                resetMapVisuals();
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
        renderDiagrams();

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
    STATE.bodyFilter = '';
    STATE.activeTag = null;
    document.getElementById('searchInput').value = '';

    loadData();
}

// --- CONTROLE DE ABAS ---
function setTab(id) {
    STATE.activeTab = id;
    STATE.activeLetter = '';
    STATE.bodyFilter = '';
    STATE.activeTag = null;

    resetMapVisuals();
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

    alpha.classList.add('hidden');
    map.classList.add('hidden');

    if (tabId === 'pontos_focais') {
        alpha.classList.remove('hidden');
        renderAlphabet();
    } else if (tabId === 'mapa') {
        map.classList.remove('hidden');
    }
}

// --- MAPA CORPORAL ---
function getActivePoints(view) {
    if (Object.keys(STATE.data).length === 0) return BODY_DATA.points[view];

    let allItems = [];
    Object.keys(STATE.data).forEach(cat => {
        STATE.data[cat].forEach(item => allItems.push(item));
    });

    return BODY_DATA.points[view].filter(p => {
        const keywords = BODY_DATA.keywords[p.id];
        if (!keywords) return false;
        return allItems.some(item => {
            if (!item.focusPoints) return false;
            return item.focusPoints.some(fp =>
                keywords.some(kw => fp.toLowerCase().includes(kw))
            );
        });
    });
}

function renderDiagrams() {
    // As funções createDiagram estão no ui.js, mas como unificamos a lógica de acesso ao DOM aqui,
    // se você estiver usando o modo "sem módulos", certifique-se de que o createDiagram está disponível.
    // Aqui assumimos que o createDiagram está no escopo global via ui.js
    document.getElementById('frontDiagram').innerHTML = createDiagram('front', getActivePoints('front'));
    document.getElementById('backDiagram').innerHTML = createDiagram('back', getActivePoints('back'));
}

function filterByBody(pointId) {
    document.querySelectorAll('.body-point').forEach(p => {
        if (p.getAttribute('onclick').includes(pointId)) {
            p.classList.add('active');
            p.classList.remove('dimmed');
        } else {
            p.classList.remove('active');
            p.classList.add('dimmed');
        }
    });

    document.getElementById('searchInput').value = '';
    STATE.activeLetter = '';
    STATE.bodyFilter = pointId;
    STATE.activeTag = null;

    applyFilters();

    const list = document.getElementById('contentList');
    const offset = 140;
    if (list) {
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = list.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
}

function resetMapVisuals() {
    document.querySelectorAll('.body-point').forEach(p => {
        p.classList.remove('active');
        p.classList.remove('dimmed');
    });
}

// --- FILTROS E ORDENAÇÃO (CORRIGIDO) ---
function applyFilters() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    const { activeTab, activeLetter, bodyFilter, activeTag } = STATE;
    let rawItems = [];
    let label = "TODOS";

    if (q || activeTag || activeTab === 'mapa') {
        Object.keys(STATE.data).forEach(cat => {
            STATE.data[cat].forEach(i => rawItems.push({ ...i, _cat: cat }));
        });
        if (activeTag) label = `TAG: #${activeTag.toUpperCase()}`;
        else if (q) label = "RESULTADOS DA BUSCA";
        else if (activeTab === 'mapa') label = bodyFilter ? "REGIÃO SELECIONADA" : "SELECIONE UMA REGIÃO ACIMA";
    } else {
        rawItems = (STATE.data[activeTab] || []).map(i => ({ ...i, _cat: activeTab }));
        label = CONFIG.modes[STATE.mode].cats[activeTab] ? CONFIG.modes[STATE.mode].cats[activeTab].label : activeTab;
    }

    let filtered = rawItems.filter(item => {
        if (activeTag && (!item.tags || !item.tags.includes(activeTag))) return false;
        if (activeTab === 'mapa' && !q && !bodyFilter && !activeTag) return false;

        if (bodyFilter) {
            const keywords = BODY_DATA.keywords[bodyFilter];
            if (!(item.focusPoints && item.focusPoints.some(fp => keywords.some(kw => fp.toLowerCase().includes(kw))))) return false;
        }

        if (!q && !bodyFilter && !activeTag && activeLetter && !item.title.toUpperCase().startsWith(activeLetter)) return false;

        if (q) {
            const content = (item.content || '').toLowerCase();
            const title = item.title.toLowerCase();
            const tags = item.tags || [];
            return title.includes(q) || content.includes(q) || tags.some(t => t.toLowerCase().includes(q));
        }
        return true;
    });

    // --- CORREÇÃO DA ORDENAÇÃO AQUI ---
    filtered.sort((a, b) => {
        // Se tiver ordem numérica explícita no JSON, usa ela
        if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
        }
        // SE NÃO TIVER ORDEM, NÃO MEXE (Retorna 0)
        // Isso garante que a ordem original do array (DOCX) seja preservada
        return 0;
    });

    STATE.list = filtered;
    document.getElementById('searchCount').textContent = `${filtered.length} Itens`;

    renderList(filtered, activeTag, STATE.mode);
}

// --- FUNÇÕES AUXILIARES ---

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').classList.add('hidden');
    STATE.activeTag = null;
    resetMapVisuals();
    applyFilters();
}

function filterByTag(tag, event) {
    if (event) event.stopPropagation();

    if (STATE.activeTag === tag) STATE.activeTag = null;
    else STATE.activeTag = tag;

    document.getElementById('searchInput').value = '';
    STATE.activeLetter = '';
    STATE.bodyFilter = '';
    resetMapVisuals();

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