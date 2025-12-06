/**
 * PrintManager.js
 * Generates a "Booklet" style printable view for Favorites.
 * Features: Cover Page, Table of Contents, Chapter-based layout.
 */

const PrintManager = {
    // Main function to trigger printing
    printBooklet(favoriteIds) {
        if (!favoriteIds || favoriteIds.length === 0) {
            alert('Sua bandeja está vazia.');
            return;
        }

        // 1. Resolve Items from Global STATE
        const items = this.resolveItems(favoriteIds);
        if (items.length === 0) return;

        // 2. Generate HTML Content
        const htmlContent = this.generateHTML(items);

        // 3. Open Print Window
        this.openPrintWindow(htmlContent);
    },

    resolveItems(ids) {
        if (typeof STATE === 'undefined' || !STATE.data) return [];

        const solved = [];
        const uniqueIds = new Set(ids);

        // Iterate all categories to find items
        Object.keys(STATE.data).forEach(cat => {
            if (Array.isArray(STATE.data[cat])) {
                STATE.data[cat].forEach(item => {
                    if (uniqueIds.has(item.id)) {
                        solved.push({ ...item, _cat: cat });
                    }
                });
            }
        });

        return solved;
    },

    generateHTML(items) {
        const date = new Date().toLocaleDateString('pt-BR');

        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>&nbsp;</title>
                <style>
                    /* Reset & Base */
                    * { box-sizing: border-box; }
                    body { 
                        font-family: 'Times New Roman', Times, serif; 
                        line-height: 1.6; 
                        color: #000;
                        margin: 0;
                        padding: 0;
                    }

                    /* Print Specifics */
                    @media print {
                        @page { margin: 2cm; size: A4; }
                        body { margin: 0; -webkit-print-color-adjust: exact; }
                        .no-print { display: none; }
                        .page-break { page-break-before: always; }
                        .avoid-break { page-break-inside: avoid; }
                    }

                    /* Cover */
                    .book-cover {
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-start; /* Changed from center */
                        padding-top: 25vh; /* Push down */
                        align-items: center;
                        text-align: center;
                        background: white;
                    }
                    .book-cover h1 { font-size: 3rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 2px; }
                    .book-cover h2 { font-size: 1.5rem; font-weight: normal; margin-bottom: 3rem; color: #555; }
                    .book-cover .meta { margin-top: auto; padding-bottom: 4rem; font-size: 0.9rem; color: #777; }

                    /* Index */
                    .book-index { padding: 4rem 0; }
                    .book-index h2 { text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 2rem; }
                    .index-list { list-style: none; padding: 0; }
                    .index-item { display: flex; justify-content: space-between; margin-bottom: 0.8rem; border-bottom: 1px dotted #ccc; }
                    .index-item span { background: #fff; padding-right: 5px; font-weight: bold; }
                    .index-item .page-num { background: #fff; padding-left: 5px; color: #555; }

                    /* Content */
                    .book-item { margin-top: 0; padding-top: 3rem; }
                    .item-header { border-bottom: 1px solid #ddd; padding-bottom: 1rem; margin-bottom: 2rem; }
                    .item-cat { font-family: sans-serif; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; color: #666; display: block; margin-bottom: 0.5rem; }
                    .item-title { font-size: 2rem; margin: 0 0 0.5rem 0; line-height: 1.2; font-weight: bold; }
                    
                    /* Focus Points (New Clean Layout) */
                    .focus-points {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.5rem;
                        margin-bottom: 2rem;
                        align-items: center;
                    }
                    .fp-label {
                        font-family: sans-serif;
                        font-size: 0.7rem;
                        font-weight: bold;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: #888;
                        margin-right: 0.5rem;
                    }
                    .fp-tag {
                        font-family: sans-serif;
                        font-size: 0.75rem;
                        color: #000;
                        border: 1px solid #ddd;
                        padding: 0.2rem 0.6rem;
                        border-radius: 4px;
                        background: #f9f9f9;
                    }

                    .item-content { font-size: 1.1rem; text-align: justify; margin-bottom: 2rem; }
                    .item-content p { margin-bottom: 1rem; }

                    .item-footer { 
                        font-family: sans-serif; 
                        font-size: 0.75rem; 
                        color: #666; 
                        border-top: 1px solid #eee; 
                        padding-top: 0.5rem; 
                        display: flex; 
                        gap: 1rem;
                    }
                    .tag-pill { border: 1px solid #ddd; padding: 2px 6px; border-radius: 4px; }

                    /* Map Markers */
                    .book-maps .map-row { display: flex; justify-content: center; gap: 1cm; flex-wrap: wrap; }
                    .book-maps .map-wrapper { position: relative; display: inline-block; margin-bottom: 2rem; }
                    .book-maps .map-img { height: 20cm; width: auto; max-width: 100%; border: 1px solid #eee; display: block; }
                    .book-maps .map-marker {
                        position: absolute;
                        width: 24px;
                        height: 24px;
                        margin-left: -12px; /* Center offset */
                        margin-top: -12px;
                        background: rgba(185, 28, 28, 0.9); /* Red-700 */
                        color: white;
                        border-radius: 50%;
                        font-size: 11px;
                        font-weight: bold;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        border: 2px solid white;
                        z-index: 10;
                    }
                    .book-maps .legend {
                        margin-top: 1rem;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 1rem;
                        justify-content: center;
                        font-size: 0.9rem;
                    }
                    .book-maps .legend-item { display: flex; align-items: center; gap: 0.3rem; }
                    .book-maps .legend-dot { 
                        width: 16px; height: 16px; background: rgba(185, 28, 28, 0.9); 
                        border-radius: 50%; color: white; font-size: 9px; 
                        display: flex; align-items: center; justify-content: center; font-weight: bold;
                    }

                    /* Inline Map Styles */
                    .inline-map-container {
                        margin-top: 2rem;
                        border-top: 1px dashed #ddd;
                        padding-top: 2rem;
                        page-break-inside: avoid;
                    }
                    .inline-map-row { display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap; }
                    .inline-map-wrapper { position: relative; display: inline-block; }
                    .inline-map-img { height: 12cm; width: auto; max-width: 100%; border: 1px solid #eee; display: block; }
                    
                    /* Custom Page Numbering (Best Effort) */
                    @page {
                        margin: 1.5cm;
                        @bottom-center {
                            content: counter(page);
                            font-family: sans-serif;
                            font-size: 10pt;
                        }
                    }

                </style>
            </head>
            <body>
                <!-- COVER -->
                <div class="book-cover">
                    <div>
                        <img src="assets/images/cover-logo.jpg" style="width: 90px; height: auto; margin: 0 auto 1.5rem; display: block;">
                        <h1>Guia Johrei</h1>
                    </div>
                    <div class="meta">
                        <p>Gerado em: ${date}</p>
                    </div>
                </div>

                <!-- INDEX -->
                <div class="book-index page-break">
                    <h2>Índice</h2>
                    <ul class="index-list">
                        ${items.map((item, i) => `
                            <li class="index-item">
                                <span>${i + 1}. ${item.title}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- CONTENT -->
                ${items.map((item, i) => `
                    <article class="book-item page-break">
                        <header class="item-header">
                            <span class="item-cat">${item._cat} | #${i + 1}</span>
                            <h1 class="item-title">${item.title}</h1>
                            
                            ${item.focusPoints && item.focusPoints.length > 0 ? `
                            <div class="focus-points">
                                <span class="fp-label">Locais:</span>
                                ${item.focusPoints.map(fp => `<span class="fp-tag">${fp}</span>`).join('')}
                            </div>
                            ` : ''}

                        </header>
                        
                        <div class="item-content">
                            ${item.content ? item.content.replace(/\n\n/g, '<p>').replace(/\n/g, '<br>') : ''}
                        </div>

                        ${this.renderFooter(item)}
                    </article>
                `).join('')}

                ${this.renderMaps(items)}
                
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;
    },

    renderFooter(item) {
        let html = '<footer class="item-footer avoid-break">';

        if (item.source) html += `<span><strong>Fonte:</strong> ${item.source}</span>`;

        if (item.tags && item.tags.length > 0) {
            html += `<span><strong>Tags:</strong> ${item.tags.join(', ')}</span>`;
        }

        html += '</footer>';
        return html;
    },

    renderMaps(items) {
        // 1. Collect all unique focus point strings
        const fpSet = new Set();
        items.forEach(item => {
            if (item.focusPoints) item.focusPoints.forEach(fp => fpSet.add(fp));
        });

        if (fpSet.size === 0) return '';
        if (typeof BODY_DATA === 'undefined') return '';

        // 2. Resolve to Point IDs and Coordinates
        const pointsToRender = { front: [], back: [], detail: [] };
        const legendData = { front: [], back: [], detail: [] };

        const norm = str => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Sort set for consistency
        const sortedFp = Array.from(fpSet).sort();

        // Intermediate storage to group by view BEFORE numbering
        const viewPoints = { front: [], back: [], detail: [] };

        sortedFp.forEach(fpName => {
            const cleanName = norm(fpName);
            let foundId = null;
            // Search Keywords
            for (const [id, keywords] of Object.entries(BODY_DATA.keywords)) {
                if (keywords.some(k => norm(k) === cleanName) || id === cleanName) {
                    foundId = id;
                    break;
                }
            }

            if (foundId) {
                // Find in views
                ['front', 'back', 'detail'].forEach(view => {
                    const pData = BODY_DATA.points[view].find(p => p.id === foundId);
                    if (pData) {
                        // Check duplicates if needed, but sortedFp is unique strings. 
                        // One string maps to one ID, but ID could be in multiple views (unlikely in current data, but possible)
                        // Actually, pData is unique per view.
                        viewPoints[view].push({ pData, name: fpName });
                    }
                });
            }
        });

        let hasContent = false;

        // 3. Assign Numbers Per View
        ['front', 'back', 'detail'].forEach(view => {
            if (viewPoints[view].length > 0) {
                hasContent = true;
                viewPoints[view].forEach((item, index) => {
                    const num = index + 1; // 1-based index per view
                    pointsToRender[view].push({
                        x: item.pData.x,
                        y: item.pData.y,
                        number: num
                    });
                    legendData[view].push({
                        number: num,
                        name: item.name
                    });
                });
            }
        });

        if (!hasContent) return '';

        // 3. Generate HTML
        let html = `
            <div class="book-maps page-break">
                <h2 style="text-align: center; text-transform: uppercase; margin-bottom: 2rem; border-bottom: 2px solid #000; padding-bottom: 1rem;">Glossário de Locais</h2>
        `;

        const viewTitles = { front: 'Frente', back: 'Costas', detail: 'Detalhes' };
        const viewImages = {
            front: 'assets/images/mapa_corporal_1.jpg',
            back: 'assets/images/mapa_corporal_2.jpg',
            detail: 'assets/images/mapa_corporal_3.jpg'
        };

        ['front', 'back', 'detail'].forEach(view => {
            if (pointsToRender[view].length > 0) {
                html += `
                    <div style="margin-bottom: 3rem; page-break-inside: avoid;">
                        <h3 style="text-align: center; font-size: 1.2rem; text-transform: uppercase; margin-bottom: 1rem;">${viewTitles[view]}</h3>
                        
                        <div style="text-align: center;">
                            <div class="map-wrapper">
                                <img src="${viewImages[view]}" class="map-img" style="height: 18cm;"> 
                                ${pointsToRender[view].map(p => `
                                    <div class="map-marker" style="left: ${p.x}%; top: ${p.y}%;">${p.number}</div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="legend">
                            ${legendData[view].map(item => `
                                <div class="legend-item">
                                    <div class="legend-dot">${item.number}</div>
                                    <span>${item.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });

        html += `</div>`;
        return html;
    },

    openPrintWindow(content) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(content);
            printWindow.document.close();
        } else {
            alert('Por favor, permita popups para imprimir a apostila.');
        }
    }
};

window.PrintManager = PrintManager;
