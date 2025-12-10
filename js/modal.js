// --- MODAL LOGIC ---
let currentModalIndex = -1;
let currentModalItem = null; // Track current item object for robust referencing

// Refactored to accept direct Item (for recommendations outside current list)
function openModal(i, explicitItem = null) {
    currentModalIndex = i;
    const item = explicitItem || STATE.list[i];
    currentModalItem = item;

    if (!item) return;

    // Add to History IMMEDIATELY (Safety First)
    if (typeof addToHistory === 'function') {
        addToHistory(item);
    } else {
        console.warn("addToHistory function not found!");
    }

    const catConfig = CONFIG.modes[STATE.mode].cats[item._cat];

    document.getElementById('modalTitle').textContent = item.title;
    const catEl = document.getElementById('modalCategory');
    catEl.textContent = catConfig ? catConfig.label : (item._cat || 'Geral');

    // Reset classes
    catEl.className = 'text-[10px] font-sans font-bold uppercase tracking-widest block mb-2';
    if (catConfig) {
        catEl.classList.add('text-' + catConfig.color);
    } else {
        catEl.classList.add('text-gray-500');
    }

    const sourceEl = document.getElementById('modalSource');
    const sourceText = item.source || "Fonte Original";
    sourceEl.textContent = sourceText;

    if (item.source) {
        sourceEl.classList.add('cursor-pointer', 'hover:opacity-70', 'transition-opacity', 'underline', 'decoration-dotted', 'underline-offset-4');
        sourceEl.onclick = () => filterBySourceFromModal(item.source);
        sourceEl.title = "Filtrar por esta fonte";
    } else {
        sourceEl.classList.remove('cursor-pointer', 'hover:opacity-70', 'transition-opacity', 'underline', 'decoration-dotted', 'underline-offset-4');
        sourceEl.onclick = null;
        sourceEl.title = "";
    }
    document.getElementById('modalRef').textContent = (i >= 0) ? '#' + (i + 1) : '';

    // Generate breadcrumb (moved up for context if needed, but keeping flow)

    // Update URL with deep link (Slug + Mode)
    if (item.title) {
        const newUrl = new URL(window.location);
        const slug = typeof toSlug === 'function' ? toSlug(item.title) : item.id;

        // Clear ID if present to prefer Item/Mode
        newUrl.searchParams.delete('id');

        newUrl.searchParams.set('item', slug);
        newUrl.searchParams.set('mode', STATE.mode);

        window.history.pushState({ path: newUrl.href }, '', newUrl.href);
    }

    // Breadcrumb
    const breadcrumbEl = document.getElementById('modalBreadcrumb');
    if (breadcrumbEl) {
        const modeLabel = CONFIG.modes[STATE.mode]?.label || STATE.mode;
        const catLabel = catConfig ? catConfig.label : (item._cat || 'Geral');
        const sourceHtml = item.source ? '<span class="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ml-2">' + item.source + '</span>' : '';
        const catColorClass = catConfig ? 'text-' + catConfig.color : 'text-gray-400';
        const breadcrumbHTML =
            '<span class="text-gray-500">' + modeLabel + '</span>' +
            '<span class="text-gray-600 px-2">›</span>' +
            '<span class="' + catColorClass + '">' + catLabel + '</span>' +
            sourceHtml;
        breadcrumbEl.innerHTML = breadcrumbHTML;
    }

    const inputs = document.querySelectorAll('.search-input');
    let searchQuery = inputs.length > 0 ? inputs[0].value.trim() : '';

    // Highlight body point keywords
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
        searchQuery = Array.from(keywords).join('|');
    }
    document.getElementById('modalContent').innerHTML = formatBodyText(item.content, searchQuery, item.focusPoints);

    const fpContainer = document.getElementById('modalFocusContainer');
    const showFocusPoints = true;

    // Highlight Regex
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
            const baseClass = "text-[10px] font-bold uppercase tracking-widest border px-2 py-1 transition-colors";
            const colorClass = isMatch
                ? "border-yellow-500 bg-yellow-100 text-black dark:bg-yellow-900 dark:text-yellow-100"
                : "border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black";

            return '<button onclick="filterByFocusPoint(\'' + p + '\')" class="' + baseClass + ' ' + colorClass + '">' + p + '</button>';
        }).join('');
        document.getElementById('modalFocusPoints').innerHTML = html;
    } else {
        fpContainer.classList.add('hidden');
    }

    // Check for "Read Next" button visibility or state if needed
    // logic moved to readNextInSequence

    const modal = document.getElementById('readModal');
    const card = document.getElementById('modalCard');
    const backdrop = document.getElementById('modalBackdrop');

    modal.classList.remove('hidden');
    void modal.offsetWidth;

    card.classList.add('open');
    backdrop.classList.add('open');

    document.body.style.overflow = 'hidden';

    // Re-check scroll position (Reset)
    const scrollContainer = document.getElementById('modalScrollContainer');
    if (scrollContainer) scrollContainer.scrollTop = 0;

    // --- APPLY READING SETTINGS ---
    if (!STATE.modalFontSize) STATE.modalFontSize = 18;
    if (!STATE.modalAlignment) STATE.modalAlignment = 'justify';

    const contentEl = document.getElementById('modalContent');
    const size = STATE.modalFontSize;
    const align = STATE.modalAlignment;

    contentEl.style.fontSize = `${size}px`;
    contentEl.style.lineHeight = '1.8';

    // Force children inheritance
    contentEl.querySelectorAll('p, li, div').forEach(child => child.style.fontSize = 'inherit');

    if (align === 'hyphen') {
        contentEl.style.textAlign = 'justify';
        contentEl.style.hyphens = 'auto';
        contentEl.style.webkitHyphens = 'auto';
    } else {
        contentEl.style.textAlign = align;
        contentEl.style.hyphens = 'none';
        contentEl.style.webkitHyphens = 'none';
    }

    // Sync Controls
    const slider = document.getElementById('modalFontSlider');
    if (slider) slider.value = size;
    const display = document.getElementById('modalFontSizeDisplay');
    if (display) display.textContent = size;
    const select = document.getElementById('modalAlignSelect');
    if (select) select.value = align;


    if (searchQuery) {
        setTimeout(() => {
            const highlight = document.querySelector('.search-highlight');
            if (highlight) highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
    }

    // Render Related (Recursion safety handled by renderRelatedItems)
    renderRelatedItems(item);
}

function closeModal() {
    const modal = document.getElementById('readModal');
    const card = document.getElementById('modalCard');
    const backdrop = document.getElementById('modalBackdrop');

    // Restore URL
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('id');
    newUrl.searchParams.delete('item');
    newUrl.searchParams.delete('mode');
    window.history.pushState({ path: newUrl.href }, '', newUrl.href);

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

// Helper for Recommendation Clicks
window.openRelatedItem = function (id) {
    // 1. Check if in current list
    const index = STATE.list.findIndex(i => i.id === id);
    if (index !== -1) {
        // Open with context
        openModal(index);
    } else {
        // Open standalone (from Global Data)
        const item = STATE.globalData ? STATE.globalData[id] : null;
        if (item) {
            openModal(-1, item);
        }
    }
}

// --- HISTORY SYSTEM ---
window.toggleHistory = function (e) {
    e.stopPropagation();
    const dropdown = document.getElementById('historyDropdown');
    const listEl = document.getElementById('historyList');

    if (dropdown.classList.contains('hidden')) {
        // Show
        renderHistoryList(listEl);
        dropdown.classList.remove('hidden');

        // Close on click outside
        const closeFn = (ev) => {
            if (!dropdown.contains(ev.target)) {
                dropdown.classList.add('hidden');
                document.removeEventListener('click', closeFn);
            }
        };
        setTimeout(() => document.addEventListener('click', closeFn), 0);
    } else {
        dropdown.classList.add('hidden');
    }
}

function renderHistoryList(container) {
    if (!STATE.readingHistory || STATE.readingHistory.length === 0) {
        container.innerHTML = '<div class="p-4 text-xs text-gray-400 text-center">Nenhum histórico recente</div>';
        return;
    }

    container.innerHTML = STATE.readingHistory.map(h => {
        // Simple time ago
        const diff = Math.floor((Date.now() - h.time) / 60000); // mins
        let timeStr = 'agora';
        if (diff > 0) timeStr = `${diff} m`;
        if (diff > 60) timeStr = `${Math.floor(diff / 60)} h`;

        return `
            <div onclick="openRelatedItem('${h.id}')" class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#222] cursor-pointer border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors group">
                <div class="flex justify-between items-baseline mb-1">
                    <span class="text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-black dark:group-hover:text-gray-300 transition-colors">${h.cat || 'Geral'}</span>
                    <span class="text-[9px] text-gray-300">${timeStr}</span>
                </div>
                <h4 class="font-serif font-medium text-sm text-gray-700 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white line-clamp-1">${h.title}</h4>
            </div>
        `;
    }).join('');
}

// --- RECOMMENDATION SYSTEM ---
function renderRelatedItems(currentItem) {
    const container = document.getElementById('modalRelated');
    const listEl = document.getElementById('modalRelatedList');
    if (!container || !listEl) return;

    if (!currentItem) {
        container.classList.add('hidden');
        return;
    }

    const scores = [];
    const currentTags = new Set(currentItem.tags || []);
    const currentPoints = new Set(currentItem.focusPoints || []);
    const currentCat = currentItem._cat;

    // Use Global Data
    let sourceList = STATE.list;
    if (STATE.globalData && Object.keys(STATE.globalData).length > 0) {
        sourceList = Object.values(STATE.globalData);
    }

    sourceList.forEach((item) => {
        if (item.id === currentItem.id) return;

        let score = 0;
        if (item.tags) item.tags.forEach(t => { if (currentTags.has(t)) score += 5; });
        if (item.focusPoints) item.focusPoints.forEach(p => { if (currentPoints.has(p)) score += 10; });
        if (item._cat === currentCat) score += 2;

        if (score > 0) scores.push({ score, item });
    });

    scores.sort((a, b) => b.score - a.score);
    const topItems = scores.slice(0, 3);

    if (topItems.length === 0) {
        container.classList.add('hidden');
        return;
    }

    const html = topItems.map(({ item }) => {
        const catConfig = CONFIG.modes[STATE.mode].cats[item._cat];
        const catLabel = catConfig ? catConfig.label : (item._cat || 'Geral');

        return `
            <div onclick="openRelatedItem('${item.id}')" class="group cursor-pointer p-4 rounded-lg bg-gray-50 dark:bg-[#161616] border border-gray-100 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all transform hover:-translate-y-1">
                <span class="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">${catLabel}</span>
                <h4 class="font-serif font-bold text-sm leading-tight text-gray-800 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors line-clamp-2">${item.title}</h4>
            </div>
        `;
    }).join('');

    listEl.innerHTML = html;
    container.classList.remove('hidden');
}

// --- MODAL CONTROLS ---

window.setModalFontSize = function (size) {
    size = parseInt(size);
    if (size < 12) size = 12;
    if (size > 25) size = 25;

    STATE.modalFontSize = size;

    const content = document.getElementById('modalContent');
    if (content) {
        content.style.fontSize = `${size}px`;
        // Force children to inherit
        const children = content.querySelectorAll('p, li, div');
        children.forEach(child => child.style.fontSize = 'inherit');
    }

    const display = document.getElementById('modalFontSizeDisplay');
    if (display) display.textContent = size;
}

window.setModalAlignment = function (align) {
    STATE.modalAlignment = align;

    const content = document.getElementById('modalContent');
    if (content) {
        if (align === 'hyphen') {
            content.style.textAlign = 'justify';
            content.style.hyphens = 'auto';
            content.style.webkitHyphens = 'auto';
        } else {
            content.style.textAlign = align;
            content.style.hyphens = 'none';
        }
    }
}

window.toggleAppearanceMenu = function (e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('appearanceMenu');
    menu.classList.toggle('hidden');

    // Close on outside click
    if (!menu.classList.contains('hidden')) {
        const closeFn = (ev) => {
            if (!menu.contains(ev.target) && !ev.target.closest('[onclick="toggleAppearanceMenu(event)"]')) {
                menu.classList.add('hidden');
                document.removeEventListener('click', closeFn);
            }
        };
        setTimeout(() => document.addEventListener('click', closeFn), 0);
    }
}

window.copyDeepLink = function () {
    // Ensure URL is up to date (should be already from openModal)
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        showToast("Link Copiado!");
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast("Erro ao copiar");
    });
}

window.copyCardContent = function () {
    if (!currentModalItem) return;

    // Create plain text representation
    // Strip HTML tags for content
    const tmp = document.createElement("DIV");
    tmp.innerHTML = currentModalItem.content;
    const cleanContent = tmp.textContent || tmp.innerText || "";

    const text = `${currentModalItem.title}\n\n${cleanContent}\n\nFonte: ${currentModalItem.source || 'Johrei: Guia Prático'}`;

    navigator.clipboard.writeText(text).then(() => {
        showToast("Texto Copiado!");
    }).catch(err => {
        console.error('Failed to copy', err);
        showToast("Erro ao copiar");
    });
}

// --- SEQUENTIAL READING (Ignore Filters) ---
window.readPrevInSequence = function () {
    if (!currentModalItem || !currentModalItem._cat) return;

    const cat = currentModalItem._cat;
    let sourceArray = [];

    // Determine source array (Original Full List)
    if (cat && STATE.data[cat]) {
        sourceArray = STATE.data[cat];
    } else {
        // Fallback: Global
        Object.values(STATE.data).forEach(arr => sourceArray.push(...arr));
    }

    // Find index by ID
    const idx = sourceArray.findIndex(i => i.id === currentModalItem.id);

    if (idx > 0) {
        // Prepare PREV item
        const prevItem = sourceArray[idx - 1];
        if (!prevItem._cat) prevItem._cat = cat;

        // Transition
        const scrollC = document.getElementById('modalScrollContainer');
        if (scrollC) scrollC.style.opacity = '0';

        setTimeout(() => {
            openModal(-1, prevItem);
            if (scrollC) {
                scrollC.scrollTop = 0;
                scrollC.style.opacity = '1';
            }
        }, 200);

    } else {
        showToast("Início da sequência");
    }
}

window.readNextInSequence = function () {
    if (!currentModalItem || !currentModalItem._cat) return;

    const cat = currentModalItem._cat;
    let sourceArray = [];

    // Determine source array (Original Full List)
    if (cat && STATE.data[cat]) {
        sourceArray = STATE.data[cat];
    } else {
        // Fallback: search in all categories (Global)
        Object.values(STATE.data).forEach(arr => sourceArray.push(...arr));
    }

    // Find index by ID
    const idx = sourceArray.findIndex(i => i.id === currentModalItem.id);

    if (idx !== -1 && idx < sourceArray.length - 1) {
        // Prepare next item
        const nextItem = sourceArray[idx + 1];
        // Ensure it has category property for rendering
        if (!nextItem._cat) nextItem._cat = cat;

        // UI Transition
        const scrollC = document.getElementById('modalScrollContainer');
        if (scrollC) scrollC.style.opacity = '0';

        setTimeout(() => {
            openModal(-1, nextItem);
            if (scrollC) {
                scrollC.scrollTop = 0;
                scrollC.style.opacity = '1';
            }
        }, 200);

    } else {
        showToast("Fim da sequência");
    }
}

function showToast(msg) {
    const toast = document.getElementById('toastNotification');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;

    msgEl.textContent = msg;
    toast.classList.remove('opacity-0', 'scale-90');

    setTimeout(() => {
        toast.classList.add('opacity-0', 'scale-90');
    }, 2000);
}

window.filterBySourceFromModal = function (source) {
    closeModal();
    // Small delay to allow modal close animation to start/finish smoothly
    setTimeout(() => {
        // Ensure the source is added as a filter
        if (!STATE.activeSources.includes(source)) {
            toggleFilter('source', source);
        } else {
            // Even if already active, just apply to be safe (though toggle would remove it if we just called toggle)
            // But if user clicks "Filter by this", they expect it to be filtered.
            // If it is ALREADY active, do we remove it?
            // "Filter by source" usually means "Ensure this filter is on".
            // Since `toggleFilter` toggles, we check first.
            applyFilters();
        }

        // Scroll to top to see results
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
}
