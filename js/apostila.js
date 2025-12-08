
// --- APOSTILA FEATURE LOGIC ---

// Global state for Apostila (will be initialized in state.js, but fallback here)
if (!window.STATE) window.STATE = {};
if (!window.STATE.apostilas) {
    window.STATE.apostilas = {
        ensinamentos: { items: [], title: "Minha Apostila" },
        explicacoes: { items: [], title: "Meus Estudos" }
    };
}

/**
 * Toggles a card's presence in the Apostila.
 * @param {string} cardId - The ID of the card to toggle.
 * @param {HTMLElement} btnElement - The button element triggered (for visual feedback).
 */
function toggleApostilaItem(cardId, btnElement) {
    const icon = btnElement.querySelector('svg');
    const currentApostila = STATE.apostilas[STATE.mode];
    const index = currentApostila.items.indexOf(cardId);

    if (index === -1) {
        // First item check: Prompt for Title
        if (currentApostila.items.length === 0) {
            // Simple prompt for now, can be upgraded to modal later
            // We use setTimeout to allow the click calculation to finish avoiding UI glitch
            setTimeout(() => {
                const newTitle = prompt("Dê um nome para sua nova apostila:", currentApostila.title);
                if (newTitle && newTitle.trim() !== "") {
                    currentApostila.title = newTitle;
                    if (STATE.activeTab === 'apostila') renderApostilaView();
                    renderTabs(); // Refresh name in tab
                }
            }, 50);
        }

        // Add
        currentApostila.items.push(cardId);
        if (icon) {
            icon.setAttribute('fill', 'currentColor'); // Solid fill
            icon.classList.add('text-yellow-500');
            icon.classList.remove('text-gray-400'); // Circle logic handled in UI update next
        }
        showToast('Adicionado à Apostila');
    } else {
        // Remove
        currentApostila.items.splice(index, 1);
        if (icon) {
            icon.setAttribute('fill', 'none'); // Outline
            icon.classList.remove('text-yellow-500');
            icon.classList.add('text-gray-400');
        }
        showToast('Removido da Apostila');
    }

    // Refresh Tabs to show/hide Apostila tab if needed
    if (typeof renderTabs === 'function') renderTabs();

    // If we are currently IN the Apostila tab, re-render the view
    if (STATE.activeTab === 'apostila') {
        renderApostilaView();
    }
}

/**
 * Renders the main Apostila interface in the content area.
 */
function renderApostilaView() {
    const container = document.getElementById('contentList');
    const currentApostila = STATE.apostilas[STATE.mode];

    container.innerHTML = '';
    container.classList.remove('hidden');

    if (currentApostila.items.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 opacity-50">
                <p class="text-xl font-serif italic text-gray-400">Sua apostila está vazia.</p>
                <p class="text-sm text-gray-500 mt-2">Adicione cards clicando no ícone de círculo.</p>
            </div>
        `;
        return;
    }

    // Header & Controls
    let html = `
        <div class="w-full max-w-4xl mx-auto mb-12">
            <div class="bg-white dark:bg-[#111] p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                 <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm2-4h12v2H6zm3 8h5v2H9zm-5 6h16v2H4zm2 4h12v2H6z"/></svg>
                 </div>

                 <h2 class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Configurar Impressão</h2>
                 
                 <div class="flex flex-col md:flex-row gap-6 items-end">
                    <div class="flex-grow w-full">
                        <label class="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Título da Apostila</label>
                        <input type="text" id="apostilaTitleInput" 
                            value="${currentApostila.title}" 
                            oninput="updateApostilaTitle(this.value)"
                            class="w-full text-2xl md:text-3xl font-serif bg-transparent border-b-2 border-gray-100 dark:border-gray-800 focus:border-black dark:focus:border-white outline-none py-2 transition-colors placeholder-gray-300 dark:placeholder-gray-700" 
                            placeholder="Digite um título..."
                        />
                    </div>
                    <button onclick="printApostila()" class="w-full md:w-auto px-8 py-4 bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:scale-105 transition-transform flex items-center justify-center gap-3 shadow-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Imprimir / Gerar PDF
                    </button>
                 </div>
            </div>
        </div>

        <div class="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
    `;

    // Render Cards in List (Simplified View)
    currentApostila.items.forEach(id => {
        // Find data in GLOBAL CACHE
        const item = STATE.globalData ? STATE.globalData[id] : null;

        if (item) {
            html += `
                <div class="flex items-center gap-4 bg-white dark:bg-[#111] p-4 rounded-lg border border-gray-100 dark:border-gray-800 group hover:border-black dark:hover:border-white transition-colors">
                    <div class="flex-grow">
                        <h3 class="font-serif text-lg text-gray-900 dark:text-gray-100">${item.title}</h3>
                        <p class="text-xs text-gray-400 uppercase tracking-widest mt-1">${item.source || 'Fonte desconhecida'}</p>
                    </div>
                    <button onclick="toggleApostilaItem('${item.id}', this)" class="p-2 text-gray-300 hover:text-red-500 transition-colors" title="Remover">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;
        } else {
            // Fallback if item undefined in cache (shouldn't happen with globalData)
            console.warn("Item not found in Global Data:", id);
        }
    });

    html += `</div>`;
    container.innerHTML = html;
}

function updateApostilaTitle(newTitle) {
    if (STATE.apostilas && STATE.apostilas[STATE.mode]) {
        STATE.apostilas[STATE.mode].title = newTitle;
        // Optionally debounce tab update
        if (typeof renderTabs === 'function') renderTabs();
    }
}
/**
 * Generates the print view (using a print window or printing the formatted content).
 */
function printApostila() {
    const currentApostila = STATE.apostilas[STATE.mode];
    const items = [];

    // Gather Data from Global Cache
    currentApostila.items.forEach(id => {
        const item = STATE.globalData ? STATE.globalData[id] : null;
        if (item) items.push(item);
    });

    if (items.length === 0) return;

    // Detect Global Body Points mentioned
    const mentionedPoints = new Set();
    const pointKeywords = [];

    // 1. Build Keyword Map from BODY_DATA
    // This assumes BODY_DATA is globally available from js/data.js
    if (typeof BODY_DATA !== 'undefined' && BODY_DATA.keywords) {
        Object.keys(BODY_DATA.keywords).forEach(pointId => {
            BODY_DATA.keywords[pointId].forEach(kw => {
                pointKeywords.push({ term: kw.toLowerCase(), id: pointId });
            });
        });
    }

    // 2. Scan Items for Keywords (Very simplistic text match)
    items.forEach(item => {
        // Check item tags
        if (item.tags) {
            item.tags.forEach(tag => {
                // Try to find matching point for tag
                // This logic mirrors finding a point by fuzzy name
                const tagLower = tag.toLowerCase();
                pointKeywords.forEach(pk => {
                    if (tagLower.includes(pk.term) || pk.term.includes(tagLower)) {
                        mentionedPoints.add(pk.id);
                    }
                });
            });
        }

        // Also check item "searchKeywords" if available
        if (item.searchKeywords) {
            item.searchKeywords.forEach(sk => {
                const skLower = sk.toLowerCase();
                pointKeywords.forEach(pk => {
                    if (skLower === pk.term) mentionedPoints.add(pk.id);
                });
            });
        }
    });

    // 3. Generate HTML content for Print Window
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${currentApostila.title}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Inter:wght@300;400;700&display=swap');
                
                body { font-family: 'Inter', sans-serif; color: #000; padding: 40px; max-width: 800px; mx-auto; }
                h1, h2, h3 { font-family: 'Cormorant Garamond', serif; }
                
                .cover { text-align: center; margin-top: 200px; page-break-after: always; }
                .cover h1 { font-size: 48px; margin-bottom: 20px; }
                .cover p { font-size: 14px; text-transform: uppercase; letter-spacing: 0.2em; color: #666; }
                
                .item { margin-bottom: 60px; page-break-inside: avoid; }
                .item h2 { font-size: 24px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                .item .meta { font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 20px; letter-spacing: 0.1em; }
                .item-content { font-size: 14px; line-height: 1.8; text-align: justify; }
                .item-content p { margin-bottom: 1em; }

                .glossary-section { page-break-before: always; border-top: 5px solid #000; padding-top: 40px; }
                .map-container { position: relative; width: 400px; margin: 0 auto; }
                .map-container svg { width: 100%; height: auto; }
                
                .glossary-list { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 12px; }
                .glossary-item { padding: 10px; background: #f9f9f9; border-left: 2px solid #000; }
                .glossary-item strong { display: block; text-transform: uppercase; margin-bottom: 4px; }
                
                @media print {
                    @page { margin: 2cm; }
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="cover">
                <h1>${currentApostila.title}</h1>
                <p>Guia de Estudos Johrei</p>
                <p style="margin-top: 40px; font-size: 10px;">Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            ${items.map(item => `
                <div class="item">
                    <h2>${item.title}</h2>
                    <div class="meta">${item.course ? item.course + ' • ' : ''} ${item.source}</div>
                    <div class="item-content">
                        ${item.content.replace(/\n/g, '<br>')}
                    </div>
                </div>
            `).join('')}

            ${mentionedPoints.size > 0 ? generateMapsHtml([...mentionedPoints]) : ''}

            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(printContent);
    win.document.close();
}

/**
 * Helper to generate maps HTML for the print view.
 * Reuses the global generate maps logic but simplifies it for print.
 */
function generateMapsHtml(pointIds) {
    // We need to render the maps that contain these points.
    // We can assume Front and Back are the main ones.

    // This relies on renderBodyPoints from body-map-helpers.js being available globally?
    // Actually, renderBodyPoints generates SVG content. We can re-use it if we mock the view.

    // Filter points for Front View
    const frontPoints = (BODY_DATA.points.front || []).filter(p => pointIds.includes(p.id));
    const backPoints = (BODY_DATA.points.back || []).filter(p => pointIds.includes(p.id));

    if (frontPoints.length === 0 && backPoints.length === 0) return '';

    // Assign global indices for the glossary matches
    let globalIndex = 1;
    function assignIndex(p) { p._printIndex = globalIndex++; return p; }

    // We clone objects to avoid polluting the global BODY_DATA
    const frontPointsIndexed = frontPoints.map(p => ({ ...p })).map(assignIndex);
    const backPointsIndexed = backPoints.map(p => ({ ...p })).map(assignIndex);
    const allPointsIndexed = [...frontPointsIndexed, ...backPointsIndexed];

    return `
        <div class="glossary-section">
            <h2 style="text-align: center; margin-bottom: 40px;">Glossário de Pontos Focais</h2>
            
            <div style="display: flex; justify-content: center; gap: 40px;">
                ${frontPointsIndexed.length > 0 ? `
                <div class="map-container">
                    <p style="text-align: center; text-transform: uppercase; font-size: 10px; font-weight: bold; margin-bottom: 10px;">Frente</p>
                    <div style="position: relative;">
                        <img src="assets/images/mapa_corporal_1.jpg" style="width: 100%; opacity: 0.3;" />
                        <svg viewBox="0 0 100 100" style="position: absolute; top:0; left:0; width: 100%; height: 100%;">
                            ${frontPointsIndexed.map(p => `
                                <circle cx="${p.x}" cy="${p.y}" r="2.5" fill="black" />
                                <text x="${p.x}" y="${p.y + 1}" font-size="2.5" fill="white" text-anchor="middle" font-weight="bold">${p._printIndex}</text>
                            `).join('')}
                        </svg>
                    </div>
                </div>` : ''}

                ${backPointsIndexed.length > 0 ? `
                <div class="map-container">
                    <p style="text-align: center; text-transform: uppercase; font-size: 10px; font-weight: bold; margin-bottom: 10px;">Costas</p>
                    <div style="position: relative;">
                         <img src="assets/images/mapa_corporal_2.jpg" style="width: 100%; opacity: 0.3;" />
                         <svg viewBox="0 0 100 100" style="position: absolute; top:0; left:0; width: 100%; height: 100%;">
                            ${backPointsIndexed.map(p => `
                                <circle cx="${p.x}" cy="${p.y}" r="2.5" fill="black" />
                                <text x="${p.x}" y="${p.y + 1}" font-size="2.5" fill="white" text-anchor="middle" font-weight="bold">${p._printIndex}</text>
                            `).join('')}
                        </svg>
                    </div>
                </div>` : ''}
            </div>

            <div class="glossary-list">
                ${allPointsIndexed.map(p => `
                    <div class="glossary-item">
                        <strong><span style="display:inline-block; width: 20px; height: 20px; background:black; color:white; text-align:center; border-radius:50%; font-size:10px; line-height:20px; margin-right: 8px;">${p._printIndex}</span> ${p.name}</strong>
                        Indicado para tratamento localizado.
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Helper to show a simple toast notification
function showToast(msg) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'fixed bottom-8 right-8 bg-black text-white px-6 py-3 rounded-lg shadow-xl text-xs font-bold uppercase tracking-widest transform translate-y-20 opacity-0 transition-all duration-300 z-[100]';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2000);
}
