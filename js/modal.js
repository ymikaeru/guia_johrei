
// --- MODAL LOGIC ---
let currentModalIndex = -1;

function openModal(input) {
    let item;

    if (typeof input === 'number') {
        currentModalIndex = input;
        item = STATE.list[input];
    } else if (typeof input === 'object') {
        item = input;
        // Try to find index in current list for navigation context
        currentModalIndex = STATE.list.findIndex(i => i.id === item.id);
    } else {
        console.error("Invalid input for openModal");
        return;
    }

    if (!item) return;

    // Update URL for Deep Linking using Title (Slug)
    updateUrl(item.title);

    // Safe access to config
    const modeConfig = CONFIG.modes[STATE.mode];
    if (!modeConfig) {
        console.error("Invalid mode:", STATE.mode);
        return;
    }
    const catConfig = modeConfig.cats ? (modeConfig.cats[item._cat] || modeConfig.cats[item.category]) : null;

    document.getElementById('modalTitle').textContent = item.title;
    const catEl = document.getElementById('modalCategory');
    catEl.textContent = catConfig ? catConfig.label : (item._cat || item.category);
    if (catConfig) {
        catEl.className = `text-[10px] font-sans font-bold uppercase tracking-widest block mb-2 text-${catConfig.color}`;
    }

    document.getElementById('modalSource').textContent = item.source || "Fonte Original";
    document.getElementById('modalRef').textContent = `#${item.order || '?'}`; // Use item.order if index not relevant

    // Generate breadcrumb
    const breadcrumbEl = document.getElementById('modalBreadcrumb');
    if (breadcrumbEl) {
        const modeLabel = CONFIG.modes[STATE.mode]?.label || STATE.mode;
        const catLabel = catConfig ? catConfig.label : (item._cat || item.category);
        const sourceHtml = item.source ? `<span class="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ml-2">${item.source}</span>` : '';
        const catColorClass = catConfig ? `text-${catConfig.color}` : 'text-gray-400';
        const breadcrumbHTML = `
            <span class="text-gray-500">${modeLabel}</span>
            <span class="text-gray-600">›</span>
            <span class="${catColorClass}">${catLabel}</span>
            ${sourceHtml}
`;
        breadcrumbEl.innerHTML = breadcrumbHTML;
    }

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
            const pattern = useBoundaries ? `\\b(${terms}) \\b` : `(${terms})`;
            highlightRegex = new RegExp(pattern, 'gi');
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

            return `<button onclick="filterByFocusPoint('${p}')" class="${baseClass} ${colorClass}">${p}</button>`;
        }).join('');
        document.getElementById('modalFocusPoints').innerHTML = html;
    } else {
        fpContainer.classList.add('hidden');
    }

    // Disable buttons if not in context (index -1) or boundaries
    document.getElementById('prevBtn').disabled = currentModalIndex <= 0;
    document.getElementById('nextBtn').disabled = currentModalIndex === -1 || currentModalIndex >= STATE.list.length - 1;

    const modal = document.getElementById('readModal');
    const card = document.getElementById('modalCard');
    const backdrop = document.getElementById('modalBackdrop');

    modal.classList.remove('hidden');
    // Force reflow
    void modal.offsetWidth;

    modal.classList.add('opacity-100');
    card.classList.remove('scale-95', 'opacity-0');
    card.classList.add('scale-100', 'opacity-100');
    backdrop.classList.add('opacity-100');

    // Lock body scroll
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

    card.classList.remove('scale-100', 'opacity-100');
    card.classList.add('scale-95', 'opacity-0');
    backdrop.classList.remove('opacity-100');
    modal.classList.remove('opacity-100');

    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        clearUrl(); // Clear URL on close
    }, 300);
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
// Controle de Fonte
window.changeFontSize = function (size) {
    const content = document.getElementById('modalContent');
    content.classList.remove('text-sm-mode', 'text-lg-mode');

    // Update Content Class
    if (size === 'sm') content.classList.add('text-sm-mode');
    if (size === 'lg') content.classList.add('text-lg-mode');

    // Update UI State
    updateFontSelectorUI(size);
};

function updateFontSelectorUI(activeSize) {
    const sizes = ['sm', 'md', 'lg'];
    const activeClass = 'bg-black text-white border-black dark:bg-white dark:text-black';
    const inactiveClass = 'bg-transparent text-gray-400 border-gray-200 hover:border-gray-900 dark:border-gray-800 dark:hover:border-white';

    sizes.forEach(size => {
        const btn = document.getElementById(`fontSubBtn - ${size} `);
        if (btn) {
            btn.className = `w - 8 h - 8 flex items - center justify - center rounded - full border transition - all ${size === activeSize ? activeClass : inactiveClass} `;
        }
    });
}
