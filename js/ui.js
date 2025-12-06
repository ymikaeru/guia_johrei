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
    // Empty State
    if (list.length === 0) {
        if (activeTab === 'favoritos') {
            el.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p class="text-xl font-serif text-gray-400">Sua bandeja de impressão está vazia</p>
                    <p class="text-sm text-gray-400 mt-2">Clique na estrela nos cards para adicionar itens aqui.</p>
                </div>
            `;
            // Call callback to hide empty state container if needed, or handled by Main
            return;
        }
        el.innerHTML = ''; // managed by main.js empty elements usually
        return;
    }
    // Ensure hidden if not empty (main.js handles this typically but good to be safe)
    if (emptyEl) emptyEl.classList.add('hidden');

    // Detect if we're showing cross-tab results
    const uniqueCategories = new Set(list.map(item => item._cat));
    const isCrossTabSearch = uniqueCategories.size > 1;

    let headerHtml = '';
    if (activeTab === 'favoritos' && list.length > 0) {
        headerHtml = `
            <div class="col-span-full flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                   <h2 class="text-2xl font-serif font-bold">Bandeja de Impressão</h2>
                   <p class="text-sm text-gray-500">${list.length} itens selecionados</p>
                </div>
                <button onclick="if(typeof PrintManager !== 'undefined') PrintManager.printBooklet(Favorites.list); else window.print()" class="bg-black text-white dark:bg-white dark:text-black px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-80 transition-opacity print:hidden shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span class="font-bold tracking-wide text-sm">GERAR APOSTILA</span>
                </button>
            </div>
        `;
    }

    el.innerHTML = headerHtml + list.map((item, i) => {
        // Recupera cor e label da configuração
        const catConfig = CONFIG.modes[mode].cats[item._cat];

        // Conditional classes for category badge prominence
        const categoryBadgeClasses = isCrossTabSearch
            ? `text-[10px] px-2 py-1 rounded-md ${catConfig ? `bg-${catConfig.color} text-white dark:bg-${catConfig.color} dark:text-white` : 'bg-gray-400 text-white'}`
            : `text-[9px] ${catConfig ? `text-${catConfig.color}` : 'text-gray-400'}`;

        // Favorites Star
        let favBtn = '';
        if (typeof Favorites !== 'undefined') {
            const isFav = Favorites.is(item.id);
            const emptyStar = `<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />`;
            const filledStar = `<path fill="currentColor" fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />`;

            favBtn = `<button class="fav-btn absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-[5]"
                onclick="event.preventDefault(); event.stopPropagation(); Favorites.toggle('${item.id}')" data-id="${item.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 transition-colors ${isFav ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-500'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    ${isFav ? filledStar : emptyStar}
                </svg>
            </button>`;
        }

        const catLabel = catConfig ? catConfig.label : item._cat;
        const catColor = catConfig ? catConfig.color : 'gray-400';
        const cardClassList = ''; // Assuming cardClassList is an empty string or defined elsewhere if needed

        return `
        <div onclick="openModal(${i})" class="group p-4 border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111] hover:border-${catColor} dark:hover:border-${catColor} transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-full shadow-sm hover:shadow-md">
            
            ${favBtn}

            <div>
                <div class="mb-2 pr-8">
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

            return `<button onclick="filterByFocusPoint('${fp}', event)" class="text-[9px] font-bold uppercase tracking-widest border px-2 py-1 transition-colors ${activeClass}">
                                ${fp}
                            </button>`;
        }).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            ${activeTab !== 'pontos_focais' ? `
            <div class="mt-auto border-t border-gray-50 dark:border-gray-900 pt-3 flex flex-wrap gap-2">
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
                            const activeClass = isActive ? 'active-tag' : 'border border-gray-100 dark:border-gray-800 text-gray-400';
                            return `<button onclick="filterByTag('${i.text}', event)" class="tag-btn text-[9px] px-2 py-1 rounded-md uppercase tracking-wider font-medium ${activeClass}">#${i.text}</button>`;
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