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

    // Header Logic for Favorites (Always calculate if activeTab is favorites)
    let headerHtml = '';
    if (activeTab === 'favoritos' && typeof Favorites !== 'undefined') {
        const currentTray = Favorites.activeTray;
        const trayNames = Object.keys(Favorites.trays);

        // Tray Selector Options
        const options = trayNames.map(name =>
            `<option value="${name}" ${name === currentTray ? 'selected' : ''}>${name} (${Favorites.trays[name].length})</option>`
        ).join('');

        // Action Buttons
        const canDelete = currentTray !== 'Principal';
        const deleteBtn = canDelete ? `
            <button onclick="if(confirm('Tem certeza que deseja excluir a apostila \\'${currentTray}\\'?')) Favorites.deleteTray('${currentTray}')" 
                class="ml-2 text-gray-400 hover:text-red-500 transition-colors" title="Excluir Apostila">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        ` : '';

        const currentTrayCount = Favorites.trays[currentTray] ? Favorites.trays[currentTray].length : 0;
        const clearBtn = currentTrayCount > 0 ? `
            <button onclick="window.confirmClearTray(event)" 
                class="text-red-400 hover:text-red-600 font-bold text-[10px] uppercase tracking-widest px-3 py-2 border border-red-100 hover:border-red-300 rounded transition-colors mr-2">
                Limpar
            </button>
        ` : '';

        const renameBtn = canDelete ? `
             <button onclick="renameCurrentTray()" class="ml-2 text-[10px] uppercase font-bold text-blue-400 hover:text-blue-600 hover:underline">Renomear</button>
        ` : '';

        headerHtml = `
            <div class="col-span-full mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div class="flex flex-col">
                         <div class="flex items-center gap-2 mb-1">
                            <div class="relative">
                                <select onchange="if(this.value === 'NEW') { createNewTray() } else { Favorites.switchTray(this.value) }" 
                                    class="bg-gray-50 dark:bg-gray-900 border-0 text-xl font-serif font-bold text-gray-900 dark:text-gray-100 pr-8 pl-0 focus:ring-0 focus:border-gray-300 cursor-pointer py-1">
                                    ${options}
                                    <option value="NEW" class="text-blue-500 font-sans text-sm font-bold">+ Nova Apostila...</option>
                                </select>
                            </div>
                            ${deleteBtn}
                         </div>
                         <div class="flex items-center gap-2">
                            <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">${list ? list.length : 0} itens</p>
                            ${renameBtn}
                         </div>
                    </div>

                    <div class="flex items-center self-end md:self-auto gap-2">
                        ${clearBtn}
                        <button onclick="if(typeof PrintManager !== 'undefined') PrintManager.printBooklet(Favorites.list, Favorites.activeTray); else window.print()" 
                             class="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-80 transition-opacity print:hidden shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span class="font-bold tracking-wide text-[10px]">GERAR APOSTILA</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    if (!list || list.length === 0) {
        if (activeTab === 'favoritos') {
            el.innerHTML = headerHtml + `
                <div class="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                     <h2 class="text-2xl font-serif font-bold">Apostilas</h2>stila está vazia</p>
                    <p class="text-sm text-gray-400 mt-2">Clique na estrela nos cards para adicionar itens.</p>
                </div>
            `;
            if (emptyEl) emptyEl.classList.add('hidden'); // We handled empty state manually
            return;
        }

        el.innerHTML = '';
        if (activeTab !== 'mapa') {
            emptyEl.classList.remove('hidden');
        } else {
            emptyEl.classList.add('hidden');
        }
        return;
    }
    // Ensure hidden if not empty
    if (emptyEl) emptyEl.classList.add('hidden');

    // Detect if we're showing cross-tab results
    const uniqueCategories = new Set(list.map(item => item._cat));
    const isCrossTabSearch = uniqueCategories.size > 1;

    el.innerHTML = headerHtml + list.map((item, i) => {
        // Recupera cor e label da configuração
        const catConfig = CONFIG.modes[mode].cats[item._cat];

        // Conditional classes for category badge prominence
        const categoryBadgeClasses = isCrossTabSearch
            ? `text-[10px] px-2 py-1 rounded-md ${catConfig ? `bg-${catConfig.color} text-white dark:bg-${catConfig.color} dark:text-white` : 'bg-gray-400 text-white'}`
            : `text-[9px] ${catConfig ? `text-${catConfig.color}` : 'text-gray-400'}`;

        // Favorites Bookmark (Now "Add to Apostila")
        let favBtn = '';
        if (typeof Favorites !== 'undefined') {
            const isFav = Favorites.is(item.id);
            // Icon: Minimalist Swiss Style
            // Empty: Thin elegant circle
            const emptyIcon = `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" stroke-width="1" />`;
            // Filled: Thin circle with check mark
            const filledIcon = `<path fill="currentColor" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />`;
            // Hover (Add): Thin circle with plus (Visualized via CSS or just simpler interaction? Let's stick to state icons first for elegance)

            favBtn = `<button class="fav-btn absolute top-3 right-3 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors z-[5] group/icon"
                onclick="event.preventDefault(); event.stopPropagation(); Favorites.toggle('${item.id}')" data-id="${item.id}" title="${isFav ? 'Remover da Apostila' : 'Adicionar à Apostila'}">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 transition-all duration-300 ${isFav ? 'text-blue-600 fill-blue-600' : 'text-gray-300 hover:text-blue-400 dark:text-gray-600 dark:hover:text-blue-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                    ${isFav ? filledIcon : emptyIcon}
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