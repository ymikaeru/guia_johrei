// --- FUNÇÕES DE UI ---

function formatBodyText(text, searchQuery) {
    if (!text) return '';
    const lines = text.split('\n');
    const highlight = (str) => {
        if (!searchQuery) return str;
        const regex = new RegExp(`(${searchQuery})`, 'gi');
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

function renderList(list, activeTags, mode) {
    const el = document.getElementById('contentList');
    const emptyEl = document.getElementById('emptyState');
    if (!list || list.length === 0) {
        el.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }
    emptyEl.classList.add('hidden');

    el.innerHTML = list.map((item, i) => {
        // Recupera cor e label da configuração
        const catConfig = CONFIG.modes[mode].cats[item._cat];

        return `
        <div onclick="openModal(${i})" class="group p-4 border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111] hover:border-black dark:hover:border-white transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-full shadow-sm hover:shadow-md">
            <div>
                <div class="mb-2">
                    <span class="text-[9px] font-bold uppercase tracking-widest ${catConfig ? `text-${catConfig.color}` : 'text-gray-400'}">${catConfig ? catConfig.label : item._cat}</span>
                </div>
                <h3 class="font-serif font-bold text-lg leading-tight mb-2 group-hover:text-black dark:group-hover:text-white transition-colors">${item.title}</h3>
            </div>
            <div class="mt-[0.3rem] border-t border-gray-50 dark:border-gray-900 flex flex-wrap gap-2">
                 ${item.tags ? (() => {
                let tagsToShow = item.tags.slice(0, 4);

                // Ensure ALL active tags are visible
                if (activeTags && activeTags.length > 0) {
                    const hiddenActiveTags = activeTags.filter(t => item.tags.includes(t) && !tagsToShow.includes(t));

                    if (hiddenActiveTags.length > 0) {
                        // Remove items from the end to make space
                        tagsToShow.splice(tagsToShow.length - hiddenActiveTags.length, hiddenActiveTags.length);
                        // Add the hidden active tags
                        tagsToShow.push(...hiddenActiveTags);
                    }
                }

                return tagsToShow.map(t => {
                    const isActive = activeTags && activeTags.includes(t);
                    const activeClass = isActive ? 'active-tag' : 'border border-gray-100 dark:border-gray-800 text-gray-400';
                    return `<button onclick="filterByTag('${t}', event)" class="tag-btn text-[9px] px-2 py-1 rounded-md uppercase tracking-wider font-medium ${activeClass}">#${t}</button>`;
                }).join('');
            })() : ''}
            </div>
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