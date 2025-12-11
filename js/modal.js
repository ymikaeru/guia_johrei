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
        // Clean style: Remove heavy background box
        fpContainer.className = "mb-8 p-0 md:p-6 transition-colors duration-300";

        const html = item.focusPoints.map(p => {
            const isMatch = highlightRegex && highlightRegex.test(removeAccents(p));

            // Clean buttons: transparent bg, thin border or no border
            // Active match: keeps yellow highlight but subtler?
            const baseClass = "text-[10px] font-bold uppercase tracking-widest border transition-colors rounded-full px-3 py-1";

            const colorClass = isMatch
                ? "border-yellow-500 bg-yellow-400/20 text-yellow-700 dark:text-yellow-300"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white bg-transparent";

            return '<button onclick="filterByFocusPoint(\'' + p + '\')" class="' + baseClass + ' ' + colorClass + '">' + p + '</button>';
        }).join('');

        // Update Title Color to match theme indirectly (using opacity/inheritance)
        const fpTitle = fpContainer.querySelector('h3');
        if (fpTitle) fpTitle.className = "text-[10px] font-sans font-bold uppercase tracking-widest mb-4 opacity-50";

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
    if (!STATE.modalTheme) STATE.modalTheme = 'auto';

    // Apply Theme
    if (typeof setModalTheme === 'function') {
        setModalTheme(STATE.modalTheme);
    }

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

window.setModalTheme = function (theme) {
    STATE.modalTheme = theme;
    const scrollContainer = document.getElementById('modalScrollContainer');
    const content = document.getElementById('modalContent');
    const title = document.getElementById('modalTitle');
    const source = document.getElementById('modalSource');
    const header = document.getElementById('modalHeader');
    const footer = document.getElementById('modalFooter');
    const card = document.getElementById('modalCard');

    if (!scrollContainer || !content) return;

    // Reset classes first
    scrollContainer.className = 'flex-grow overflow-y-auto scroll-smooth relative transition-colors duration-300';
    content.className = 'rich-text leading-loose transition-colors duration-300'; // font-serif handled by theme or default?

    // Default Variables
    let bgClass = '';
    let textClass = '';
    let titleClass = '';
    let interfaceBg = '';
    let interfaceBorder = '';
    let cardBg = '';
    let fontClass = 'font-serif';

    // Highlight Variables
    let highlightBg = '#fef08a';
    let highlightText = '#000000';
    // Focus Point Variables
    let focusPointBg = '#f3f4f6';
    let focusPointText = '#1f2937';

    switch (theme) {
        case 'quiet':
            // user: bg #4A494E text #ABAAAE
            bgClass = 'bg-[#4A494E]';
            textClass = 'text-[#ABAAAE]';
            titleClass = 'text-[#d4d4d4]'; // lighter for title
            interfaceBg = 'bg-[#4A494E]/95';
            interfaceBorder = 'border-[#5A595E]';
            cardBg = '#4A494E';
            // Custom Highlight for Dark Mode (Muted Olive/Gold)
            highlightBg = '#635F40';
            highlightText = '#E0E0E0';
            // Custom Focus for Quiet
            focusPointBg = '#5c5c61';
            focusPointText = '#ffffff';
            break;
        case 'paper':
            // user: bg #EDEDED text #1D1D1D
            bgClass = 'bg-[#EDEDED]';
            textClass = 'text-[#1D1D1D]';
            titleClass = 'text-[#000000]';
            interfaceBg = 'bg-[#EDEDED]/95';
            interfaceBorder = 'border-[#DEDEDE]';
            cardBg = '#EDEDED';
            highlightBg = '#E3DEB3'; // Muted Paper Yellow
            highlightText = '#1D1D1D';
            // Custom Focus for Paper
            focusPointBg = '#d6d3c9';
            focusPointText = '#1D1D1D';
            break;
        case 'calm':
            // user: bg #EEE2CC text #362D25
            bgClass = 'bg-[#EEE2CC]';
            textClass = 'text-[#362D25]';
            titleClass = 'text-[#2b241e]';
            interfaceBg = 'bg-[#EEE2CC]/95';
            interfaceBorder = 'border-[#E0D4BE]';
            cardBg = '#EEE2CC';
            highlightBg = '#E6CEA8'; // Warm Sepia Highlight
            highlightText = '#362D25';
            // Custom Focus for Calm
            focusPointBg = '#dbc8a4';
            focusPointText = '#2b241e';
            break;
        case 'focus':
            // user: bg #FFFCF5 text #141205
            bgClass = 'bg-[#FFFCF5]';
            textClass = 'text-[#141205]';
            titleClass = 'text-[#000000]';
            interfaceBg = 'bg-[#FFFCF5]/95';
            interfaceBorder = 'border-[#EBE5D5]';
            cardBg = '#FFFCF5';
            highlightBg = '#fff59d'; // Light Yellow
            highlightText = '#000000';
            // Custom Focus for Focus Theme
            focusPointBg = '#e8e8e8'; // Very subtle gray
            focusPointText = '#000000';
            break;
        case 'bold':
            // Semibold logic
            bgClass = 'bg-white';
            textClass = 'text-black font-semibold'; // Apply semibold here
            titleClass = 'text-black font-bold';
            interfaceBg = 'bg-white/95';
            interfaceBorder = 'border-gray-200';
            cardBg = '#ffffff';
            // Custom font weight handling might be needed if classes clash, but 'font-semibold' should work.
            highlightBg = '#fef08a';
            highlightText = '#000000';
            // Custom Focus for Bold (Standard)
            focusPointBg = '#f3f4f6';
            focusPointText = '#1f2937';
            break;
        case 'original':
        default: // White (Standard)
            bgClass = 'bg-white';
            textClass = 'text-gray-900';
            titleClass = 'text-black';
            interfaceBg = 'bg-white/95';
            interfaceBorder = 'border-gray-100';
            cardBg = '#ffffff';
            highlightBg = '#fef08a';
            highlightText = '#000000';
            // Custom Focus for Original (Standard)
            focusPointBg = '#f3f4f6';
            focusPointText = '#1f2937';
            break;
    }

    // Apply Styles
    scrollContainer.classList.add(...bgClass.split(' '));
    content.classList.add(...textClass.split(' '), fontClass);

    // Apply Highlight Variables
    content.style.setProperty('--highlight-bg', highlightBg);
    content.style.setProperty('--highlight-text', highlightText);

    // Apply Focus Point Variables
    content.style.setProperty('--focus-point-bg', focusPointBg);
    content.style.setProperty('--focus-point-text', focusPointText);

    if (card) card.style.backgroundColor = cardBg;

    // Force color inheritance to override specific .rich-text CSS rules
    content.querySelectorAll('p, li, div, h1, h2, h3, h4, h5, h6, strong, span, em').forEach(child => {
        child.style.color = 'inherit';
    });

    if (title) {
        title.className = `text-3xl md:text-4xl ${fontClass} font-medium mb-8 md:mb-12 leading-[1.2] text-center transition-colors duration-300 ${titleClass}`;
    }

    if (source) {
        source.className = `text-xs font-sans font-bold uppercase tracking-widest text-center transition-colors duration-300 ${titleClass}`;
        source.style.opacity = theme === 'quiet' ? '0.6' : '1';
    }

    // Apply to Header & Footer
    if (header) {
        header.className = `flex-none px-6 py-4 border-b flex justify-between items-center backdrop-blur-md z-20 relative transition-colors duration-300 ${interfaceBg} ${interfaceBorder}`;
    }
    if (footer) {
        footer.className = `flex-none p-4 md:p-6 border-t z-20 transition-colors duration-300 ${interfaceBg} ${interfaceBorder}`;
    }

    // Update active state in menu (Visual feedback)
    // We can't easily access the buttons here without IDs or complex selectors, 
    // but the logic works.
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
