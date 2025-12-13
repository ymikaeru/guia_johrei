// --- MODAL LOGIC ---
let currentModalIndex = -1;
let currentModalItem = null;
STATE.readingMode = 'filtered'; // 'filtered' or 'book'

// Helper for Background Sync (Book Mode)
function syncBackgroundContext(item) {
    if (!item) return;

    let needsUpdate = false;

    // 1. Sync Tab
    if (item._cat && item._cat !== STATE.activeTab) {
        setTab(item._cat);
        // setTab already calls applyFilters, but we might need to override filters next
        needsUpdate = false; // setTab handles render
    }

    // 2. Sync Source Filter if in Book Mode
    if (item.source) {
        const currentSource = STATE.activeSources && STATE.activeSources.length > 0 ? STATE.activeSources[0] : null;
        if (currentSource !== item.source) {
            // STRICT: Clear ALL filters for clean book context
            STATE.activeTags = [];
            STATE.activeFocusPoints = [];
            STATE.bodyFilter = null;
            STATE.activeSources = [item.source];
            needsUpdate = true;
        }
    }

    if (needsUpdate) {
        applyFilters();
        renderActiveFilters();
    }
}

// Refactored to accept direct Item
function openModal(i, explicitItem = null) {
    currentModalIndex = i;
    const item = explicitItem || STATE.list[i];
    currentModalItem = item;

    if (!item) return;

    // Determine Reading Mode
    // If opened via index from list -> Filtered Mode
    // If opened via explicit item (i = -1) -> Book Mode
    if (i >= 0) {
        STATE.readingMode = 'filtered';
    } else {
        STATE.readingMode = 'book';
        // Ensure background is synced when entering book mode
        syncBackgroundContext(item);
    }

    // ... (rest of function remains same)

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

    // Update URL with deep link (Slug + Mode)
    if (item.title) {
        const newUrl = new URL(window.location);
        const slug = typeof toSlug === 'function' ? toSlug(item.title) : item.id;
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
        fpContainer.className = "mb-8 p-0 md:p-6 transition-colors duration-300";

        const html = item.focusPoints.map(p => {
            const isMatch = highlightRegex && highlightRegex.test(removeAccents(p));
            const baseClass = "text-[10px] font-bold uppercase tracking-widest border transition-colors rounded-full px-3 py-1";
            const colorClass = isMatch
                ? "border-yellow-500 bg-yellow-400/20 text-yellow-700 dark:text-yellow-300"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white bg-transparent";
            return '<button onclick="filterByFocusPoint(\'' + p + '\')" class="' + baseClass + ' ' + colorClass + '">' + p + '</button>';
        }).join('');

        const fpTitle = fpContainer.querySelector('h3');
        if (fpTitle) fpTitle.className = "text-[10px] font-sans font-bold uppercase tracking-widest mb-4 opacity-50";

        document.getElementById('modalFocusPoints').innerHTML = html;
    } else {
        fpContainer.classList.add('hidden');
    }

    const modal = document.getElementById('readModal');
    const card = document.getElementById('modalCard');
    const backdrop = document.getElementById('modalBackdrop');

    modal.classList.remove('hidden');
    void modal.offsetWidth;

    card.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';

    const scrollContainer = document.getElementById('modalScrollContainer');
    if (scrollContainer) scrollContainer.scrollTop = 0;

    // --- APPLY READING SETTINGS ---
    if (!STATE.modalFontSize) STATE.modalFontSize = parseInt(localStorage.getItem('modalFontSize')) || 18;
    if (!STATE.modalAlignment) STATE.modalAlignment = localStorage.getItem('modalAlignment') || 'justify';
    if (!STATE.modalTheme) STATE.modalTheme = localStorage.getItem('modalTheme') || 'auto';

    if (typeof setModalTheme === 'function') {
        setModalTheme(STATE.modalTheme);
    }

    const contentEl = document.getElementById('modalContent');
    const size = STATE.modalFontSize;
    const align = STATE.modalAlignment;

    contentEl.style.fontSize = `${size}px`;
    contentEl.style.lineHeight = '1.8';
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

    renderRelatedItems(item);
    initImmersiveMode();
    initSwipeGestures();
}

function closeModal() {
    const modal = document.getElementById('readModal');
    const card = document.getElementById('modalCard');
    const backdrop = document.getElementById('modalBackdrop');
    const item = currentModalItem; // Capture current item before closing

    stopSpeech(); // Stop audio if playing
    destroyImmersiveMode();
    destroySwipeGestures();

    // Restore URL
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('id');
    newUrl.searchParams.delete('item');
    newUrl.searchParams.delete('mode');
    window.history.pushState({ path: newUrl.href }, '', newUrl.href);

    card.classList.remove('open');
    backdrop.classList.remove('open');

    // Stop Immersive Timer
    destroyImmersiveMode();

    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';

        // --- HIGHLIGHT CARD ON CLOSE (User Request) ---
        if (item) {
            // Check if item is in current STATE.list
            let index = STATE.list.findIndex(i => i.id === item.id);
            if (index === -1) {
                // If not in list (e.g. cross-book nav happened without filter update),
                // we might need to force a list update to show the card.
                // But for now, let's assume if they navigated, the list usually updates for the arrows to work.
                // If they opened a "Related Item" without filtering, index is -1.
                // In that case, we can't scroll to it unless we switch the list to that context.
                // The User prefers "Highlight" over "Filter Tag".
                // So, if index is -1, maybe we SHOULD silently filter/sync to that book so we can show it?
                // Let's rely on the fact that if they navigated deep, we likely switched context.
            }

            if (index !== -1) {
                const cardEl = document.getElementById('card-' + index);
                if (cardEl) {
                    cardEl.scrollIntoView({ behavior: 'auto', block: 'center' });
                    // Flash Highlight
                    cardEl.classList.add('bg-yellow-50', 'dark:bg-yellow-900/20', 'transition-colors', 'duration-500');
                    setTimeout(() => {
                        cardEl.classList.remove('bg-yellow-50', 'dark:bg-yellow-900/20');
                    }, 1000);
                }
            }
        }
    }, 250);
}

// --- IMMERSIVE READING MODE ---
let immersiveTimer = null;
let isControlsVisible = true;

function initImmersiveMode() {
    const scrollContainer = document.getElementById('modalScrollContainer');
    if (!scrollContainer) return;

    // Reset State
    showControls();

    // Listeners
    scrollContainer.addEventListener('scroll', resetImmersiveTimer);
    scrollContainer.addEventListener('scroll', updateProgressBar);
    scrollContainer.addEventListener('click', toggleImmersiveControls);
    scrollContainer.addEventListener('touchstart', resetImmersiveTimer);

    // Start Timer
    resetImmersiveTimer();
    updateProgressBar(); // Init state
}

function destroyImmersiveMode() {
    clearTimeout(immersiveTimer);
    const scrollContainer = document.getElementById('modalScrollContainer');
    if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', resetImmersiveTimer);
        scrollContainer.removeEventListener('scroll', updateProgressBar);
        scrollContainer.removeEventListener('click', toggleImmersiveControls);
        scrollContainer.removeEventListener('touchstart', resetImmersiveTimer);
    }
}


// --- SWIPE GESTURES ---
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function initSwipeGestures() {
    const card = document.getElementById('modalCard');
    if (!card) return;

    card.addEventListener('touchstart', handleTouchStart, { passive: true });
    card.addEventListener('touchend', handleTouchEnd, { passive: true });
}

function destroySwipeGestures() {
    const card = document.getElementById('modalCard');
    if (!card) return;

    card.removeEventListener('touchstart', handleTouchStart);
    card.removeEventListener('touchend', handleTouchEnd);
}

function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipeGesture();
}

function handleSwipeGesture() {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const threshold = 50; // min swipe distance

    // Check if horizontal swipe is dominant
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                // Swiped Right -> Prev
                readPrevInSequence();
            } else {
                // Swiped Left -> Next
                readNextInSequence();
            }
        }
    }
}



function updateProgressBar() {
    const scrollContainer = document.getElementById('modalScrollContainer');
    const bar = document.getElementById('modalProgressBar');
    if (!scrollContainer || !bar) return;

    const scrollTop = scrollContainer.scrollTop;
    const scrollHeight = scrollContainer.scrollHeight;
    const clientHeight = scrollContainer.clientHeight;

    const availableScroll = scrollHeight - clientHeight;
    let percentage = 0;

    if (availableScroll > 0) {
        percentage = (scrollTop / availableScroll) * 100;
    }

    bar.style.width = `${percentage}%`;
}

function resetImmersiveTimer() {
    showControls();
    clearTimeout(immersiveTimer);
    // Hide after 3 seconds of inactivity
    immersiveTimer = setTimeout(hideControls, 3000);
}

function hideControls() {
    isControlsVisible = false;
    const footer = document.getElementById('modalFooter');

    // User Request: Hide ONLY the bottom bar (footer)
    // Header remains visible

    if (footer) {
        footer.style.opacity = '0';
        footer.style.pointerEvents = 'none';
        footer.style.transform = 'translateY(100%)';
    }
}

function showControls() {
    // Check if footer is already visible (optimization)
    const footer = document.getElementById('modalFooter');
    if (isControlsVisible && footer && footer.style.opacity === '1') return;

    isControlsVisible = true;

    if (footer) {
        footer.style.opacity = '1';
        footer.style.pointerEvents = 'auto';
        footer.style.transform = 'translateY(0)';
    }
}

function toggleImmersiveControls(e) {
    // Ignore clicks on interactive elements inside the content
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
        return;
    }

    if (isControlsVisible) {
        clearTimeout(immersiveTimer);
        hideControls();
    } else {
        resetImmersiveTimer();
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
    } else if (STATE.readingMode === 'book') {
        // --- CROSS-BOOK NAVIGATION (Continuous Mode) ---
        // If we reach the end of the list in Book Mode (which is limited by source),
        // we should try to jump to the NEXT book/source.
        // NOTE: This assumes STATE.list IS currently filtered by a source.
        // If STATE.list is the FULL manual list (no filters), then we are truly at the end.

        // 1. Identify current source (if any)
        const currentSource = currentModalItem ? currentModalItem.source : null;

        if (dir > 0 && currentSource) {
            // Going Next + Has Source context
            // Identify Next Source Logic
            // We need a list of unique sources in consistent order.
            // Using globalData to derive list or hardcoded?
            // Let's use STATE.globalData to get all unique sources in order of keys (or some index)
            // Ideally we need the order from the original JSONs.

            // Heuristic: Find first item in globalData that is DIFFERENT source and after current items.
            // This is expensive. Better: if we have `STATE.activeSources` set, we know where we are.
            if (STATE.activeSources && STATE.activeSources.length > 0) {
                // We are locked to a source. Let's find the next one.
                // We need a master list of sources.
                // Let's derive it from the GLOBAL keys order in STATE.data[STATE.activeTab]
                const fullList = STATE.data[STATE.activeTab] || [];
                // Find index of current item in full list
                const globalIndex = fullList.findIndex(i => i.id === currentModalItem.id);

                if (globalIndex !== -1 && globalIndex < fullList.length - 1) {
                    // Get next item from FULL list
                    const nextGlobalItem = fullList[globalIndex + 1];

                    // If next item has a DIFFERENT source, we switch to it.
                    const nextSource = nextGlobalItem.source;
                    if (nextSource && nextSource !== currentSource) {
                        // SWITCH SOURCE CONTEXT
                        STATE.activeSources = [nextSource];
                        STATE.activeTags = []; // Clear other filters
                        STATE.bodyFilter = null;

                        // Re-apply filters to load new book
                        applyFilters();

                        // Open first item of new list
                        openModal(0);

                        // Optional: Toast "Mudando para [Fonte]"
                        const toast = document.createElement('div');
                        toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest z-[10000] animate-fade-in-out';
                        toast.textContent = `Lendo: ${nextSource}`;
                        document.body.appendChild(toast);
                        setTimeout(() => toast.remove(), 2000);
                        return; // Done
                    }
                }
            }
        }
    }
}

// Helper for Recommendation Clicks
// Helper for Recommendation Clicks
// Helper for Recommendation Clicks
window.openRelatedItem = function (id) {
    const item = STATE.globalData ? STATE.globalData[id] : null;

    if (item) {
        // 1. Sync Tab if needed
        if (item._cat && item._cat !== STATE.activeTab) {
            setTab(item._cat);
        }

        // 2. Sync Source Filter (User Request: Contextualize background list)
        // REVERT: We DO NOT lock the source filter anymore to allow "Continuous Mode" feel.
        // Instead, we just let it open.
        // However, if we don't filter, the `STATE.list` might not contain the item, causing index = -1.
        // If index = -1, arrows don't work well unless we fallback to "Cross-Book" logic.
        // BUT, for the arrows to work on *this* book, we nominally need the list to be this book.
        // The User prefers "Highlight on Close" over "Source Tag".
        // So we will SILENTLY filter (change list) but NOT add the generic activeSource tag visually?
        // No, `activeSources` drives the UI pill.
        // Let's TRY leaving `activeSources` EMPTY.
        // If empty, `STATE.list` is the full Tab list.
        // Then `index` will be the index in the FULL list.
        // IF the item is in the current Tab list (which it typically is if we synced Tab),
        // then index != -1, and arrows work perfectly across the whole Tab!
        // This effectively gives "Continuous Mode" by default.

        // OLD LOGIC REMOVED:
        /*
        if (item.source) {
            STATE.activeTags = [];
            STATE.activeFocusPoints = [];
            STATE.bodyFilter = null;
            STATE.activeSources = [item.source];

            applyFilters();
            renderActiveFilters();
        }
        */

        // Clean slate for other filters though to ensure visibility
        STATE.activeTags = [];
        STATE.activeFocusPoints = [];
        STATE.bodyFilter = null;
        STATE.activeSources = []; // Ensure we are NOT source constrained

        applyFilters();
        renderActiveFilters();


        // 3. Find index in the NEWLY filtered list
        const index = STATE.list.findIndex(i => i.id === id);

        if (index !== -1) {
            // Open with context of the new list
            openModal(index);
        } else {
            // Should be rare if we just filtered by its source, but possible if other filters block it
            openModal(-1, item);
        }
    } else {
        console.error("Related item not found:", id);
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
    if (size > 32) size = 32;

    STATE.modalFontSize = size;
    localStorage.setItem('modalFontSize', size);

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
    localStorage.setItem('modalAlignment', align);

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
    localStorage.setItem('modalTheme', theme);
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
    let backdropBg = '';
    let metaTextClass = '';

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
            backdropBg = 'bg-black/80';
            metaTextClass = 'text-[#7a7a80]';
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
            backdropBg = 'bg-black/80';
            metaTextClass = 'text-[#757575]';
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
            backdropBg = 'bg-black/80';
            metaTextClass = 'text-[#8c7b68]';
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
            backdropBg = 'bg-black/80';
            metaTextClass = 'text-[#8f8b80]';
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
            backdropBg = 'bg-white/95';
            metaTextClass = 'text-gray-500';
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
            backdropBg = 'bg-white/95 dark:bg-black/95';
            metaTextClass = 'text-gray-400';
            break;
    }

    // Apply Styles
    scrollContainer.classList.add(...bgClass.split(' '));
    content.classList.add(...textClass.split(' '), fontClass);

    // Apply Backdrop
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop) {
        // Reset base classes (keep core transition/position/blur)
        // Note: backdrop has defaults in HTML: "absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-md opacity-0 transition-opacity duration-300"
        // We override the color part.
        backdrop.className = `absolute inset-0 backdrop-blur-md opacity-0 transition-opacity duration-300 ${backdropBg} open`;
        // Re-add 'open' if it was open (logic in openModal puts 'open' class for opacity)
        // Wait, 'open' class controls opacity in CSS or logic? 
        // In openModal: backdrop.classList.add('open');
        // Let's check CSS/Logic. Usually 'open' adds opacity-100.
        // Yes line 190: backdrop.classList.add('open');
        // So we must preserve 'open' if it's currently open.
        // However, this function is called ON open, and on switch.
        // If we reset className, we lose 'open'.
        // Better approach: remove all bg- classes and add new one.

        // Simpler: Just set style directly or use cleaner class manipulation
        // But Tailwind classes are dynamic.
        // Let's just set ClassName string and re-add 'open' if it was there?
        // OR: `backdrop.className` replacement is risky if we don't know "open" state.

        // SAFER:
        backdrop.classList.remove('bg-white/95', 'dark:bg-black/95', 'bg-[#4A494E]', 'bg-[#EDEDED]', 'bg-[#EEE2CC]', 'bg-[#FFFCF5]', 'bg-white', 'bg-black/90', 'bg-black/95', 'bg-black/80');
        // Add new one
        const bgParts = backdropBg.split(' ');
        backdrop.classList.add(...bgParts);
    }

    // Apply Meta Colors (Source, Related, etc)
    const sourceLabel = document.getElementById('modalSourceLabel');
    const refLabel = document.getElementById('modalRef');
    const relatedLabel = document.getElementById('modalRelatedLabel');
    const categoryLabel = document.getElementById('modalCategory'); // Breadcrumb is also meta

    const metaElements = [sourceLabel, refLabel, relatedLabel, categoryLabel];
    metaElements.forEach(el => {
        if (el) {
            // Remove previous hardcoded gray classes to avoid conflict
            el.classList.remove('text-gray-300', 'text-gray-400', 'text-[#7a7a80]', 'text-[#757575]', 'text-[#8c7b68]', 'text-[#8f8b80]', 'text-gray-500');
            el.classList.add(metaTextClass.replace('text-', '')); // Logic check: metaTextClass is full class like 'text-[#...]'
            // Simpler: just add the class string.
            // But if it's 'text-[#...]', classList.add fails if not standard? No, Tailwind arbitrary values work as class names.
            // However, removing dynamic colors is hard if we don't track them.
            // For now, I listed specific removals. 
            // Better: el.className = ... but that wipes alignment/font classes.
            el.className = el.className.replace(/text-\[#.*?\]/g, '').replace(/text-gray-\d+/g, '').trim();
            el.classList.add(metaTextClass.split(' ')[0]); // Assuming single class in variable
        }
    });

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

    // Update Category Color matches Theme
    const catEl = document.getElementById('modalCategory');
    if (catEl) {
        let catColor = '';
        switch (theme) {
            case 'quiet': catColor = 'text-[#ABAAAE]'; break;
            case 'paper': catColor = 'text-[#555]'; break; // Dark gray
            case 'calm': catColor = 'text-[#8c7b6c]'; break; // Muted brown
            case 'focus': catColor = 'text-[#666]'; break;
            case 'bold': catColor = 'text-black'; break;
            case 'original': default: catColor = 'text-gray-500'; break;
        }
        // Reset base classes and add theme color
        catEl.className = `text-[10px] font-sans font-bold uppercase tracking-widest block mb-2 ${catColor}`;
    }

    if (source) {
        source.className = `text-xs font-sans font-bold uppercase tracking-widest text-center transition-colors duration-300 ${titleClass}`;
        source.style.opacity = theme === 'quiet' ? '0.6' : '1';
    }

    // Apply to Header & Footer
    if (header) {
        header.className = `flex-none px-6 py-4 border-b flex justify-between items-center backdrop-blur-md z-20 relative transition-all duration-500 ease-in-out ${interfaceBg} ${interfaceBorder}`;
    }
    if (footer) {
        // Absolute positioning so content fills full height behind it
        footer.className = `absolute bottom-0 w-full p-3 md:p-6 border-t z-20 transition-all duration-500 ease-in-out ${interfaceBg} ${interfaceBorder}`;
    }

    // Apply Scroll Container Padding to prevent content being hidden behind absolute footer
    if (scrollContainer) {
        // Ensure enough padding at bottom for the footer
        scrollContainer.classList.add('pb-24', 'md:pb-32');
    }

    // Update Navigation Buttons (Arrows) Colors
    const btnPrev = document.getElementById('btnReadPrev');
    const btnNext = document.getElementById('btnReadNext');

    // Define button styles based on theme
    let arrowBg = '';
    let arrowText = '';
    let iconColor = '';

    switch (theme) {
        case 'quiet':
            arrowBg = 'bg-[#5A595E] hover:bg-[#6A696E]';
            arrowText = 'text-[#E0E0E0]';
            iconColor = 'text-[#ABAAAE] hover:text-[#E0E0E0]';
            break;
        case 'paper':
            arrowBg = 'bg-white hover:bg-gray-100 border border-[#DEDEDE]';
            arrowText = 'text-[#1D1D1D]';
            iconColor = 'text-gray-400 hover:text-black';
            break;
        case 'calm':
            arrowBg = 'bg-[#E0D4BE] hover:bg-[#D4C4A8]';
            arrowText = 'text-[#2b241e]';
            iconColor = 'text-[#8c7b6c] hover:text-[#2b241e]';
            break;
        case 'focus':
            arrowBg = 'bg-[#EBE5D5] hover:bg-[#DCD0B0]';
            arrowText = 'text-[#141205]';
            iconColor = 'text-[#999] hover:text-black';
            break;
        case 'bold':
            arrowBg = 'bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#252525] border border-gray-200';
            arrowText = 'text-black dark:text-gray-100';
            iconColor = 'text-gray-400 hover:text-black dark:hover:text-white';
            break;
        case 'original':
        default:
            arrowBg = 'bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#252525]';
            arrowText = 'text-gray-900 dark:text-gray-100';
            iconColor = 'text-gray-400 hover:text-black dark:hover:text-white';
            break;
    }

    const arrowBaseClass = "py-2 md:py-4 rounded-lg text-lg font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 flex-1";

    if (btnPrev) {
        btnPrev.className = `${arrowBaseClass} ${arrowBg} ${arrowText}`;
    }
    if (btnNext) {
        btnNext.className = `${arrowBaseClass} ${arrowBg} ${arrowText}`;
    }

    // Update Header Icons
    const headerBtns = [
        'btnHeaderAppearance', 'btnHeaderCopyText', 'btnHeaderCopyLink', 'btnHeaderHistory', 'btnHeaderClose'
    ];
    headerBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            const isHidden = btn.classList.contains('hidden');
            const base = "w-10 h-10 flex items-center justify-center rounded-full transition-colors";
            // Hover bg depends on theme too? Standardizing hover bg to be subtle
            const hoverBg = theme === 'quiet' ? 'hover:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10';
            btn.className = `${base} ${iconColor} ${hoverBg} ${isHidden ? 'hidden' : ''}`;
        }
    });

    // Update Footer Close Button
    const btnFooterClose = document.getElementById('btnFooterClose');
    if (btnFooterClose) {
        const baseFooterClose = "py-2 md:py-4 rounded-lg text-lg font-bold uppercase tracking-widest transition-colors";
        // e.g. "hover:bg-red-50" might clash, so let's simplify to standard theme toggle
        const hoverBg = theme === 'quiet' ? 'hover:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10';
        btnFooterClose.className = `${baseFooterClose} ${iconColor} ${hoverBg}`;
    }

    // Update Focus Points Section (Container & Buttons)
    const fpContainer = document.getElementById('modalFocusContainer');
    if (fpContainer) {
        const fpTitle = fpContainer.querySelector('h3');
        const fpButtons = fpContainer.querySelectorAll('button');

        // Define Theme Styles
        let fpBg = '', fpTitleColor = '', fpBtnNormal = '';

        switch (theme) {
            case 'quiet':
                fpBg = 'bg-[#535257] border-l-4 border-[#888]';
                fpTitleColor = 'text-[#E0E0E0] opacity-90';
                fpBtnNormal = 'border-[#999] text-[#E0E0E0] hover:bg-white/10 hover:border-white';
                break;
            case 'paper':
                fpBg = 'bg-[#F9F9F9] border-l-4 border-[#DEDEDE]';
                fpTitleColor = 'text-[#555]';
                fpBtnNormal = 'border-[#ccc] text-[#333] hover:bg-black/5 hover:border-[#999]';
                break;
            case 'calm':
                fpBg = 'bg-[#E6CEA8]/20 border-l-4 border-[#C5B595]';
                fpTitleColor = 'text-[#5C4D3D]';
                fpBtnNormal = 'border-[#C5B595] text-[#362D25] hover:bg-[#362D25]/5 hover:border-[#8C7B6C]';
                break;
            case 'focus':
                fpBg = 'bg-[#FFF9C4]/20 border-l-4 border-[#EBE5D5]';
                fpTitleColor = 'text-[#5D4037] opacity-80';
                fpBtnNormal = 'border-[#D7CCC8] text-[#5D4037] hover:bg-black/5 hover:border-[#A1887F]';
                break;
            case 'bold':
                fpBg = 'bg-gray-50 border-l-4 border-black';
                fpTitleColor = 'text-black font-bold';
                fpBtnNormal = 'border-black text-black hover:bg-black hover:text-white';
                break;
            default: // original
                fpBg = 'bg-gray-50 dark:bg-[#1C1C1E] border-l-4 border-gray-200 dark:border-gray-700';
                fpTitleColor = 'text-gray-400';
                fpBtnNormal = 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white hover:border-gray-400';
                break;
        }

        // Apply Container Styles
        // Note: we preserve layout classes but update colors
        const fpBase = "mb-8 p-6 rounded-r-xl transition-colors duration-300";
        fpContainer.className = `${fpBase} ${fpBg}`;

        if (fpTitle) fpTitle.className = `text-[10px] font-sans font-bold uppercase tracking-widest mb-4 ${fpTitleColor}`;

        // Update Buttons
        fpButtons.forEach(btn => {
            if (btn.classList.contains('border-yellow-500')) {
                // Keep match (highlighted) logic, but maybe tune text color for dark themes
                if (theme === 'quiet' || theme === 'original') { // Darkish contexts
                    // Ensure yellow text pops
                    btn.classList.remove('text-yellow-700');
                    btn.classList.add('text-yellow-600', 'dark:text-yellow-300');
                }
            } else {
                const btnBase = "text-[10px] font-bold uppercase tracking-widest border transition-colors rounded-full px-3 py-1 bg-transparent";
                btn.className = `${btnBase} ${fpBtnNormal}`;
            }
        });
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

    const ref = currentModalItem.ref ? ` - ${currentModalItem.ref}` : '';
    const text = `${currentModalItem.title}\n\n${cleanContent}\n\n> Fonte: ${currentModalItem.source || 'Johrei: Guia Prático'}${ref}`;

    navigator.clipboard.writeText(text).then(() => {
        showToast("Texto Copiado!");
    }).catch(err => {
        console.error('Failed to copy', err);
        showToast("Erro ao copiar");
        showToast("Erro ao copiar");
    });
}

// --- TEXT TO SPEECH (Audio) ---
let currentUtterance = null;

window.toggleSpeech = function () {
    const btn = document.getElementById('btnHeaderSpeech');

    if (window.speechSynthesis.speaking) {
        stopSpeech();
        return;
    }

    if (!currentModalItem) return;

    // Get Clean Text
    const tmp = document.createElement("DIV");
    tmp.innerHTML = currentModalItem.content;
    const cleanContent = tmp.textContent || tmp.innerText || "";
    const fullText = `${currentModalItem.title}. ${cleanContent}`;

    // Create Utterance
    const utterance = new SpeechSynthesisUtterance(fullText);

    // Select Best Voice (iOS/Mac High Quality)
    const bestVoice = getBestVoice();
    if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang; // Ensure lang matches voice
    } else {
        utterance.lang = 'pt-BR'; // Fallback
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Events
    utterance.onend = function () {
        resetSpeechIcon();
    };
    utterance.onerror = function (e) {
        console.error('Speech error', e);
        resetSpeechIcon();
    };

    // Start
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);

    // Update Icon to Stop (Square)
    if (btn) {
        btn.innerHTML = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"></path></svg>`;
        btn.classList.add('text-black', 'dark:text-white', 'animate-pulse');
        btn.classList.remove('text-gray-400');
    }
}

function stopSpeech() {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
    }
    resetSpeechIcon();
}

function resetSpeechIcon() {
    const btn = document.getElementById('btnHeaderSpeech');
    if (btn) {
        // Speaker Icon
        btn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>`;
        btn.classList.remove('text-black', 'dark:text-white', 'animate-pulse');
        btn.classList.add('text-gray-400');
    }
    currentUtterance = null;
}

function getBestVoice() {
    const voices = window.speechSynthesis.getVoices();
    // Priority List for Natural Voices
    const preferences = ['Luciana', 'Daniel', 'Joana', 'Google Português do Brasil'];

    for (const name of preferences) {
        const voice = voices.find(v => v.name.includes(name));
        if (voice) return voice;
    }

    // Fallback: Any PT-BR
    return voices.find(v => v.lang === 'pt-BR' || v.lang === 'pt_BR');
}

// --- SEQUENTIAL READING (Ignore Filters) ---
// Navigation: Previous
window.readPrevInSequence = function () {
    // Mode 1: Filtered Navigation (Search Results)
    if (STATE.readingMode === 'filtered') {
        const idx = currentModalIndex;
        if (idx > 0) {
            transitionModal(STATE.list[idx - 1]);
        } else {
            showToast("Início dos resultados");
        }
        return;
    }

    // Mode 2: Book Navigation (Sequence)
    // Fallback
    if (!currentModalItem || !currentModalItem._cat) return;

    const cat = currentModalItem._cat;
    let sourceArray = [];
    if (cat && STATE.data[cat]) {
        sourceArray = STATE.data[cat];
    } else {
        Object.values(STATE.data).forEach(arr => sourceArray.push(...arr));
    }

    const idx = sourceArray.findIndex(i => i.id === currentModalItem.id);

    if (idx > 0) {
        const prevItem = sourceArray[idx - 1];
        if (!prevItem._cat) prevItem._cat = cat;

        syncBackgroundContext(prevItem); // Sync Background
        transitionModal(prevItem);

    } else if (idx === 0) {
        // Jump to Previous Category
        const categories = Object.keys(STATE.data);
        const currentCatIndex = categories.indexOf(cat);

        if (currentCatIndex > 0) {
            const prevCat = categories[currentCatIndex - 1];
            const prevList = STATE.data[prevCat];
            if (prevList && prevList.length > 0) {
                const prevItem = prevList[prevList.length - 1];
                if (!prevItem._cat) prevItem._cat = prevCat;

                showToast(`Retornando para ${CONFIG.modes[STATE.mode].cats[prevCat].label}`);
                syncBackgroundContext(prevItem); // Sync Background
                transitionModal(prevItem);
            }
        } else {
            showToast("Início da sequência");
        }
    } else {
        showToast("Início da sequência");
    }
}

// Navigation: Next
window.readNextInSequence = function () {
    // Mode 1: Filtered Navigation (Search Results)
    if (STATE.readingMode === 'filtered') {
        const idx = currentModalIndex;
        if (idx !== -1 && idx < STATE.list.length - 1) {
            transitionModal(STATE.list[idx + 1]);
        } else {
            showToast("Fim dos resultados");
        }
        return;
    }

    // Mode 2: Book Navigation (Sequence)
    if (!currentModalItem || !currentModalItem._cat) return;

    const cat = currentModalItem._cat;
    let sourceArray = [];
    if (cat && STATE.data[cat]) {
        sourceArray = STATE.data[cat];
    } else {
        Object.values(STATE.data).forEach(arr => sourceArray.push(...arr));
    }

    const idx = sourceArray.findIndex(i => i.id === currentModalItem.id);

    if (idx !== -1 && idx < sourceArray.length - 1) {
        const nextItem = sourceArray[idx + 1];
        if (!nextItem._cat) nextItem._cat = cat;

        syncBackgroundContext(nextItem); // Sync Background
        transitionModal(nextItem);

    } else if (idx === sourceArray.length - 1) {
        // Jump to Next Category
        const categories = Object.keys(STATE.data);
        const currentCatIndex = categories.indexOf(cat);

        if (currentCatIndex !== -1 && currentCatIndex < categories.length - 1) {
            const nextCat = categories[currentCatIndex + 1];
            const nextList = STATE.data[nextCat];
            if (nextList && nextList.length > 0) {
                const nextItem = nextList[0];
                if (!nextItem._cat) nextItem._cat = nextCat;

                showToast(`Avançando para ${CONFIG.modes[STATE.mode].cats[nextCat].label}`);
                syncBackgroundContext(nextItem); // Sync Background
                transitionModal(nextItem);
            }
        } else {
            showToast("Fim da sequência");
        }
    } else {
        showToast("Fim da sequência");
    }
}

// Helper for smooth transition
function transitionModal(item) {
    const scrollC = document.getElementById('modalScrollContainer');
    if (scrollC) scrollC.style.opacity = '0';

    setTimeout(() => {
        // Pass -1 to force Book Mode if we are in Book Mode?
        // Wait, if we are in 'filtered' mode, we usually pass index.
        // But transitionModal usually takes an item.
        // If we are in 'filtered' mode, we should pass the index to openModal to maintain 'filtered' state.

        if (STATE.readingMode === 'filtered') {
            const listIdx = STATE.list.findIndex(i => i.id === item.id);
            openModal(listIdx); // Passing index maintains 'filtered' mode
        } else {
            openModal(-1, item); // Passing -1 maintains (or sets) 'book' mode
        }

        if (scrollC) {
            scrollC.scrollTop = 0;
            scrollC.style.opacity = '1';
        }
    }, 200);
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
