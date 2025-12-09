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

    // Generate breadcrumb
    const breadcrumbEl = document.getElementById('modalBreadcrumb');
    if (breadcrumbEl) {
        const modeLabel = CONFIG.modes[STATE.mode]?.label || STATE.mode;
        const catLabel = catConfig ? catConfig.label : item._cat;
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
    document.getElementById('modalContent').innerHTML = formatBodyText(item.content, searchQuery, item.focusPoints);

    const fpContainer = document.getElementById('modalFocusContainer');
    // Always show if data exists (Don't hide for Fundamentos anymore)
    const showFocusPoints = true;

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
            const pattern = useBoundaries ? `\\b(${terms})\\b` : `(${terms})`;
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

    // --- APPLY READING SETTINGS ---
    // define defaults if missing
    if (!STATE.modalFontSize) STATE.modalFontSize = 18;
    if (!STATE.modalAlignment) STATE.modalAlignment = 'justify';

    // Apply styles
    const contentEl = document.getElementById('modalContent');
    const size = STATE.modalFontSize;
    const align = STATE.modalAlignment;

    contentEl.style.fontSize = `${size}px`;
    contentEl.style.lineHeight = '1.8';

    // Force children to inherit (fixes issue where P tags have fixed size from CSS)
    const children = contentEl.querySelectorAll('p, li, div');
    children.forEach(child => child.style.fontSize = 'inherit');

    if (align === 'hyphen') {
        contentEl.style.textAlign = 'justify';
        contentEl.style.hyphens = 'auto';
        contentEl.style.webkitHyphens = 'auto';
    } else {
        contentEl.style.textAlign = align;
        contentEl.style.hyphens = 'none';
        contentEl.style.webkitHyphens = 'none';
    }

    // Sync UI Controls
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
            content.style.webkitHyphens = 'none';
        }
    }
}
