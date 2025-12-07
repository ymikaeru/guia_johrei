// --- FUNÇÕES DE UI ---

function formatBodyText(text, searchQuery) {
    if (!text) return '';
    const lines = text.split('\n');
    const highlight = (str) => {
        if (!searchQuery) return str;

        let tokens;
        let useBoundaries = false;

        // Check if query uses specific delimiter (for body point keywords)
        if (searchQuery.includes('|')) {
            tokens = searchQuery.split('|').filter(t => t.trim().length > 0);
            useBoundaries = true; // Use strict word boundaries for predefined keywords
        } else {
            // Default: Split by space for manual search
            tokens = searchQuery.split(/\s+/).filter(t => t.length > 0);
        }

        const terms = tokens
            .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape regex special chars
            .join('|');

        if (!terms) return str;

        // Use word boundaries if requested (prevents Axila -> Maxilar)
        const pattern = useBoundaries ? `\\b(${terms})\\b` : `(${terms})`;
        const regex = new RegExp(pattern, 'gi');
        return str.replace(regex, '<mark class="search-highlight">$1</mark>');
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

        // Conditional classes for category badge prominence
        const categoryBadgeClasses = isCrossTabSearch
            ? `text-[10px] px-2 py-1 rounded-md ${catConfig ? `bg-${catConfig.color} text-white dark:bg-${catConfig.color} dark:text-white` : 'bg-gray-400 text-white'}`
            : `text-[9px] ${catConfig ? `text-${catConfig.color}` : 'text-gray-400'}`;

        return `
        <div onclick="openModal(${i})" class="group p-4 border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111] hover:border-black dark:hover:border-white transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-full shadow-sm hover:shadow-md">
            <div>
                <div class="mb-2">
                    <span class="${categoryBadgeClasses} font-bold uppercase tracking-widest">${catConfig ? catConfig.label : item._cat}</span>
                </div>
                <h3 class="font-serif font-bold text-[1.525rem] leading-tight mb-2 group-hover:text-black dark:group-hover:text-white transition-colors">${item.title}</h3>
                ${activeTab === 'pontos_focais' && item.focusPoints && item.focusPoints.length > 0 ? `
                <div class="mb-3 mt-2">
                    <div class="flex flex-wrap gap-2">
                        ${item.focusPoints.map(fp => {
            const isActive = STATE.activeFocusPoints && STATE.activeFocusPoints.includes(fp);
            const activeClass = isActive
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black';

            return `<button onclick="filterByFocusPoint('${fp}', event)" class="text-[9px] font-bold uppercase tracking-widest border px-2 py-1 rounded-md transition-colors ${activeClass}">
                                ${fp}
                            </button>`;
        }).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            ${activeTab !== 'pontos_focais' ? `
            <div class="mt-[0.3rem] border-t border-gray-50 dark:border-gray-900 flex flex-wrap gap-2">
                 ${(() => {
                    const tags = item.tags || [];
                    const points = item.focusPoints || [];

                    // Combine items: Tags first, then Points
                    let allItems = [
                        ...tags.map(t => ({ text: t, type: 'tag' })),
                        ...points.map(p => ({ text: p, type: 'point' }))
                    ];

                    if (allItems.length === 0) return '';

                    let itemsToShow = allItems.slice(0, 6); // Show up to 6 items

                    // Ensure ALL active tags are visible
                    if (activeTags && activeTags.length > 0) {
                        const hiddenActiveItems = allItems.filter(i => i.type === 'tag' && activeTags.includes(i.text) && !itemsToShow.some(show => show.text === i.text && show.type === 'tag'));

                        if (hiddenActiveItems.length > 0) {
                            // Remove items from the end to make space
                            if (itemsToShow.length + hiddenActiveItems.length > 6) {
                                itemsToShow.splice(itemsToShow.length - hiddenActiveItems.length, hiddenActiveItems.length);
                            }
                            // Add the hidden active tags
                            itemsToShow.push(...hiddenActiveItems);
                        }
                    }

                    return itemsToShow.map(i => {
                        if (i.type === 'tag') {
                            const isActive = activeTags && activeTags.includes(i.text);
                            const activeClass = isActive
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-[#1a1a1a] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#252525]';

                            return `<button onclick="filterByTag('${i.text.replace(/'/g, "\\'")}', event)" class="tag-btn text-[9px] px-2 py-1 rounded-md uppercase tracking-wider font-bold transition-colors ${activeClass}">${i.text}</button>`;
                        } else {
                            // Focus Point (styled like inactive tag)
                            return `<button onclick="filterByFocusPoint('${i.text}', event)" class="text-[9px] font-bold uppercase tracking-widest border border-gray-100 dark:border-gray-800 text-gray-400 px-2 py-1 rounded-md hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">${i.text}</button>`;
                        }
                    }).join('');
                })()}
            </div>
            ` : ''}
        </div>`
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