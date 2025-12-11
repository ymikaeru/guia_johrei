// --- FUNÇÕES DE UI (Animations Disabled) ---

function formatBodyText(text, searchQuery, focusPoints) {
    if (!text) return '';
    const lines = text.split('\n');
    const highlight = (str) => {
        let result = str;

        // 1. Highlight Focus Points (Sober Style) - Run FIRST so Search can override
        if (focusPoints && focusPoints.length > 0) {
            // Remove accents for matching? Or strict? Usually body points are standard.
            // We use simple regex for points.
            const fpTerms = focusPoints
                .filter(fp => fp && fp.length > 0)
                .map(fp => fp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .join('|');

            if (fpTerms) {
                // Whole words for focus points to avoid matching parts of other words
                const fpRegex = new RegExp(`\\b(${fpTerms})\\b`, 'gi');
                result = result.replace(fpRegex, '<span class="focus-point-span">$1</span>');
            }
        }

        if (!searchQuery) return result;

        let tokens;
        let useBoundaries = false;

        if (searchQuery.includes('|')) {
            tokens = searchQuery.split('|').filter(t => t.trim().length > 0);
            useBoundaries = true; // Keep explicit boundaries for pipe-separated keywords
        } else {
            // Default: Split by space
            tokens = searchQuery.split(/\s+/).filter(t => t.length > 0);
        }

        const terms = tokens
            .map(t => {
                const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Refined Logic (User Feedback):
                // - Short words (< 3 chars) match strictly whole words (e.g. "o" won't match "cabelo")
                // - Longer words allow partial match (e.g. "toxina" matches "toxinas")
                if (!useBoundaries && t.length < 3) {
                    return `\\b${escaped}\\b`;
                }
                return escaped;
            })
            .join('|');

        if (!terms) return result;

        // Use word boundaries if requested OR if we built them manually above
        // Note: If useBoundaries is true (from |), we wrap everything in \b...\b later.
        // If false, we use the terms as is (which might contain \b for short words).
        const pattern = useBoundaries ? `\\b(${terms})\\b` : `(${terms})`;

        // We need to be careful NOT to match inside existing HTML tags (like <span class="...">)
        // Simple regex replace on HTML is tricky. 
        // Strategy: We want to match text, but ignore tag attributes. 
        // Since our structure is simple (just spans), maybe we assume search query doesn't match attributes?
        // E.g. "gray" search query.
        // Risk: <span class="bg-gray-100"> -> <span class="bg-<mark>gray</mark>-100"> -> BROKEN.

        // SAFE APPROACH: 
        // If we have focus highlight, we rely on the browser not to explode? 
        // OR we use a smarter replace needed?
        // Given complexity, let's keep it simple for now and assume search query is usually medical terms, not "class" or "gray".

        const regex = new RegExp(pattern, 'gi');
        return result.replace(regex, '<mark class="search-highlight">$1</mark>');
    };

    return lines.map(line => {
        const cleanLine = line.trim();
        if (!cleanLine) return '<br>';

        const qaMatch = cleanLine.match(/^(Pergunta|Resposta|P|R|P\.|R\.)(\s*[:\-\.]\s*)(.*)/i);

        if (qaMatch) {
            const label = qaMatch[1];
            const separator = qaMatch[2];
            const content = qaMatch[3];
            const isAnswer = /^(Resposta|R)/i.test(label);
            const indentClass = isAnswer ? 'pl-6 border-l-2 border-gray-100 dark:border-gray-800' : '';

            return `<p class="${indentClass}"><strong class="qa-label">${label}${separator}</strong>${highlight(content)}</p>`;
        }

        if (cleanLine.length < 80 && cleanLine === cleanLine.toUpperCase() && !cleanLine.endsWith('.')) {
            return `<h3>${highlight(cleanLine)}</h3>`;
        }

        return `<p>${highlight(cleanLine)}</p>`;
    }).join('');
}

function renderList(list, activeTags, mode, activeTab) {
    const el = document.getElementById('contentList');
    const emptyEl = document.getElementById('emptyState');
    if (!list || list.length === 0) {
        el.innerHTML = '';
        // Don't show empty state on map tab
        if (activeTab !== 'mapa') {
            emptyEl.classList.remove('hidden');
        } else {
            emptyEl.classList.add('hidden');
        }
        return;
    }
    emptyEl.classList.add('hidden');

    // Detect if we're showing cross-tab results
    const uniqueCategories = new Set(list.map(item => item._cat));
    const isCrossTabSearch = uniqueCategories.size > 1;

    el.innerHTML = list.map((item, i) => {
        // Recupera cor e label da configuração
        const catConfig = CONFIG.modes[mode].cats[item._cat];

        const currentApostila = STATE.apostilas ? STATE.apostilas[STATE.mode] : null;
        const isInApostila = currentApostila && currentApostila.items.includes(item.id);

        return `
        <article onclick="openModal(${i})" class="group py-8 px-8 border-t border-gray-100 dark:border-gray-900 cursor-pointer relative flex flex-col gap-6 hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a]/30 transition-colors">
            
            <!-- Category Label -->
            <div class="flex justify-between items-start">
                <span class="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                    ${catConfig ? catConfig.label : item._cat}
                </span>

                <!-- Add to Apostila (Subtle Icon) -->
                <button onclick="event.stopPropagation(); toggleApostilaItem('${item.id}', this)" 
                    class="w-6 h-6 flex items-center justify-center rounded-full transition-colors ${isInApostila ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'}" 
                    title="Adicionar à Apostila">
                     <svg class="w-4 h-4" fill="${isInApostila ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                </button>
            </div>

            <!-- Title -->
            <h3 class="font-serif font-medium text-3xl md:text-4xl leading-[1.1] text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors max-w-2xl">
                ${item.title}
            </h3>

            ${activeTab === 'pontos_focais' && item.focusPoints && item.focusPoints.length > 0 ? `
            <!-- Focus Points (Editorial Subtitle Style) -->
            <div class="mt-1">
                <p class="text-xs md:text-sm font-sans font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-relaxed">
                    ${item.focusPoints.join('<span class="mx-2 text-gray-300 dark:text-gray-700">&middot;</span>')}
                </p>
            </div>
            ` : ''}

            ${activeTab !== 'pontos_focais' ? `
            <!-- Tags & Metadata (Minimalist) -->
            <div class="flex flex-wrap gap-3 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                 ${(() => {
                    const tags = item.tags || [];
                    const points = item.focusPoints || [];

                    // Combine items: Tags first, then Points
                    let allItems = [
                        ...tags.map(t => ({ text: t, type: 'tag' })),
                        ...points.map(p => ({ text: p, type: 'point' }))
                    ];

                    if (allItems.length === 0) return '';

                    let itemsToShow = allItems.slice(0, 4); // Minimalist: Show fewer items

                    return itemsToShow.map(i => {
                        const isActive = activeTags && activeTags.includes(i.text);
                        const activeClass = isActive
                            ? 'text-black dark:text-white underline decoration-2 opacity-100'
                            : 'text-gray-400 hover:text-black dark:hover:text-white hover:underline opacity-100'; // Make inactive always visible but gray

                        return `<button onclick="filterByTag('${i.text.replace(/'/g, "\\'")}', event)" class="text-[10px] font-bold uppercase tracking-widest transition-colors before:content-['#'] before:mr-0.5 before:opacity-50 text-left ${activeClass}">${i.text}</button>`;
                    }).join('');
                })()}
            </div>
            ` : ''}
        </article>`
    }).join('');
}

// --- CORREÇÃO DO DIAGRAMA (TEXTO CENTRALIZADO ACIMA) ---
function createDiagram(view, points) {
    const isBack = view === 'back';
    const transform = isBack ? 'translate(206.326, 0) scale(-1, 1)' : '';

    return `
    <svg viewBox="0 0 206.326 206.326" class="w-full h-full drop-shadow-sm diagram-svg" style="overflow: visible;">
        <g transform="${transform}">
            <path d="${BODY_DATA.path}" fill="none" stroke="currentColor" stroke-width="1.5" class="text-gray-300 dark:text-gray-700"/>
        </g>
        ${points.map(p => `
            <g class="body-point cursor-pointer group" onclick="filterByBody('${p.id}')">
                
                <circle cx="${p.x}" cy="${p.y}" r="15" fill="transparent" />
                
                <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="currentColor" class="text-black dark:text-white visual"/>
                
                <text x="${p.x}" y="${p.y - 6}" 
                      text-anchor="middle" 
                      fill="currentColor" 
                      class="text-black dark:text-white"
                      style="pointer-events: none;">
                    ${p.name}
                </text>
            </g>`).join('')}
    </svg>`;
}