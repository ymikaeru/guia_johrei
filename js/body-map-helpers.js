// --- INTERACTIVE BODY MAP HELPERS ---

function renderBodyPoints(points, viewId) {
    if (!points || points.length === 0) return '';

    return points.map(point => {
        // Check if this point is in the selected IDs (comma-separated)
        const selectedIds = STATE.selectedBodyPoint ? STATE.selectedBodyPoint.split(',') : [];
        const isSelected = selectedIds.includes(point.id);

        // Check if this point is being previewed
        const isPreviewed = !isSelected && isPointPreviewed(point.id);

        // Elegant color scheme: slate for default, purple for selected, orange for preview
        let fillColor, fillOpacity, strokeColor, strokeWidth, baseRadius;

        if (isSelected) {
            fillColor = '#7c3aed';      // Purple
            fillOpacity = '1';
            strokeColor = '#7c3aed';
            strokeWidth = '0.4';
            baseRadius = 1.8;
        } else if (isPreviewed) {
            fillColor = '#f59e0b';      // Amber/Orange
            fillOpacity = '0.9';
            strokeColor = '#f59e0b';
            strokeWidth = '0.35';
            baseRadius = 1.6;
        } else {
            fillColor = '#94a3b8';      // Slate
            fillOpacity = '0.6';
            strokeColor = '#ffffff';
            strokeWidth = '0.25';
            baseRadius = 1.2;
        }

        // Use different rx/ry to create circles that appear round when stretched
        // Aspect ratio compensation: make rx larger to compensate for X-axis flattening
        const rx = baseRadius * 1.5; // Wider in X to compensate for flattening
        const ry = baseRadius;       // Normal in Y

        const glowFilter = isSelected
            ? 'drop-shadow(0 0 3px rgba(124, 58, 237, 0.6))'
            : isPreviewed
                ? 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.6))'
                : 'none';

        return `
            <ellipse 
                cx="${point.x}" 
                cy="${point.y}" 
                rx="${rx}" 
                ry="${ry}" 
                fill="${fillColor}" 
                fill-opacity="${fillOpacity}"
                stroke="${strokeColor}"
                stroke-width="${strokeWidth}"
                class="body-map-point pointer-events-auto cursor-pointer transition-all duration-200"
                style="filter: ${glowFilter};"
                data-point-id="${point.id}"
                data-point-name="${point.name}"
                onclick="selectBodyPoint('${point.id}')"
                onmouseover="highlightBodyPoint(this, '${point.name}', event)"
                onmouseout="unhighlightBodyPoint(this)"
            >
                <title>${point.name}</title>
            </ellipse>
        `;
    }).join('');
}


function selectBodyPoint(pointIds) {
    if (!pointIds) {
        clearBodyFilter();
        return;
    }

    // Handle both single ID and comma-separated multiple IDs
    STATE.selectedBodyPoint = pointIds;

    const idArray = pointIds.split(',');

    // Find the point name from first ID
    let pointName = '';
    ['front', 'back', 'detail'].forEach(view => {
        const point = BODY_DATA.points[view].find(p => p.id === idArray[0]);
        if (point) pointName = point.name;
    });

    // Update Custom Dropdown Label (if exists)
    const btnLabel = document.getElementById('customDropdownLabel');
    if (btnLabel) {
        btnLabel.textContent = pointName || '-- Todos os pontos --';
    }

    // Update label
    const label = document.getElementById('selectedPointLabel');
    if (label) {
        label.textContent = `Filtrando por: ${pointName}`;
        label.classList.remove('hidden');
    }

    // Filter content based on body point keywords (use first ID for keywords)
    filterByBodyPoint(idArray[0]);

    // Re-render maps to update selected point visualization
    updateUIForTab('mapa');

    // Scroll to results
    const contentList = document.getElementById('contentList');
    if (contentList) {
        contentList.classList.remove('hidden');
        setTimeout(() => {
            contentList.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

function selectBodyPointFromDropdown(pointIds) {
    selectBodyPoint(pointIds);
}

function filterByBodyPoint(pointId) {
    // Get keywords for this body point
    const keywords = BODY_DATA.keywords[pointId] || [];

    if (keywords.length === 0) {
        // Fallback or explicit no results
        // Just show all? Or clear?
        // Let's defer to applyFilters but with a warning or empty list?
        // User reports "no results", which is correct behavior if keywords are missing.
        // We will maintain this behavior but ensure main.js knows about it.
        applyFilters();
        return;
    }

    // Collect all items
    let allItems = [];
    Object.keys(STATE.data).forEach(tabId => {
        if (STATE.data[tabId]) {
            STATE.data[tabId].forEach(item => {
                allItems.push({ ...item, _cat: tabId });
            });
        }
    });

    // Filter items that match any of the keywords
    const filtered = allItems.filter(item => {
        const searchText = removeAccents((item.title + ' ' + item.content).toLowerCase());
        return keywords.some(keyword => searchText.includes(removeAccents(keyword.toLowerCase())));
    });

    STATE.list = filtered;
    renderList(filtered, STATE.activeTags, STATE.mode, STATE.activeTab);

    // Update counter
    document.querySelectorAll('.search-count').forEach(el => {
        el.textContent = `${filtered.length} Itens`;
    });
}

function highlightBodyPoint(element, name, event) {
    // Skip if this point is already selected
    const pointId = element.getAttribute('data-point-id');
    const selectedIds = STATE.selectedBodyPoint ? STATE.selectedBodyPoint.split(',') : [];
    if (selectedIds.includes(pointId)) return;

    // Apply hover effect: larger size, purple color, glow
    const hoverRadius = 2.2;
    element.setAttribute('rx', hoverRadius * 1.5);
    element.setAttribute('ry', hoverRadius);
    element.setAttribute('fill', '#7c3aed');
    element.setAttribute('fill-opacity', '1');
    element.setAttribute('stroke', '#7c3aed');
    element.setAttribute('stroke-width', '0.5');
    element.style.filter = 'drop-shadow(0 0 4px rgba(124, 58, 237, 0.8))';

    // Create or get tooltip element
    let tooltip = document.getElementById('bodyPointTooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'bodyPointTooltip';
        tooltip.className = 'fixed z-50 px-3 py-1.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 text-[10px] font-bold uppercase tracking-[0.15em] shadow-sm pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3';
        document.body.appendChild(tooltip);
    }

    tooltip.textContent = name;
    tooltip.style.display = 'block';

    // Position tooltip centered above the element
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2);
    const topY = rect.top; // Position above the element

    tooltip.style.left = centerX + 'px';
    tooltip.style.top = (topY - 8) + 'px'; // 8px gap
}

function unhighlightBodyPoint(element) {
    // Skip if this point is selected
    const pointId = element.getAttribute('data-point-id');
    const selectedIds = STATE.selectedBodyPoint ? STATE.selectedBodyPoint.split(',') : [];
    if (selectedIds.includes(pointId)) return;

    // Restore default appearance
    const defaultRadius = 1.2;
    element.setAttribute('rx', defaultRadius * 1.5);
    element.setAttribute('ry', defaultRadius);
    element.setAttribute('fill', '#94a3b8');
    element.setAttribute('fill-opacity', '0.6');
    element.setAttribute('stroke', '#ffffff');
    element.setAttribute('stroke-width', '0.25');
    element.style.filter = 'none';

    // Hide tooltip
    const tooltip = document.getElementById('bodyPointTooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// Preview points when hovering over dropdown options
let previewState = null;

function previewBodyPoints(pointIds) {
    if (!pointIds) {
        clearBodyPointPreview();
        return;
    }

    previewState = pointIds;
    updatePointsVisual();
}

function clearBodyPointPreview() {
    previewState = null;
    updatePointsVisual();
}

function isPointPreviewed(pointId) {
    if (!previewState) return false;
    const previewIds = previewState.split(',');
    return previewIds.includes(pointId);
}

function updatePointsVisual() {
    // Update all ellipse elements directly
    const allEllipses = document.querySelectorAll('.body-map-point');
    const selectedIds = STATE.selectedBodyPoint ? STATE.selectedBodyPoint.split(',') : [];
    const previewIds = previewState ? previewState.split(',') : [];

    allEllipses.forEach(ellipse => {
        const pointId = ellipse.getAttribute('data-point-id');
        const isSelected = selectedIds.includes(pointId);
        const isPreviewed = !isSelected && previewIds.includes(pointId);

        let fillColor, fillOpacity, strokeColor, strokeWidth, baseRadius;

        if (isSelected) {
            fillColor = '#7c3aed';
            fillOpacity = '1';
            strokeColor = '#7c3aed';
            strokeWidth = '0.4';
            baseRadius = 1.8;
        } else if (isPreviewed) {
            fillColor = '#f59e0b';
            fillOpacity = '0.9';
            strokeColor = '#f59e0b';
            strokeWidth = '0.35';
            baseRadius = 1.6;
        } else {
            fillColor = '#94a3b8';
            fillOpacity = '0.6';
            strokeColor = '#ffffff';
            strokeWidth = '0.25';
            baseRadius = 1.2;
        }

        const rx = baseRadius * 1.5;
        const ry = baseRadius;

        const glowFilter = isSelected
            ? 'drop-shadow(0 0 3px rgba(124, 58, 237, 0.6))'
            : isPreviewed
                ? 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.6))'
                : 'none';

        ellipse.setAttribute('rx', rx);
        ellipse.setAttribute('ry', ry);
        ellipse.setAttribute('fill', fillColor);
        ellipse.setAttribute('fill-opacity', fillOpacity);
        ellipse.setAttribute('stroke', strokeColor);
        ellipse.setAttribute('stroke-width', strokeWidth);
        ellipse.style.filter = glowFilter;
    });
}



// --- CUSTOM DROPDOWN / SIDEBAR FUNCTIONS ---

function generateSidebarOptions() {
    const allPoints = [
        ...BODY_DATA.points.front,
        ...BODY_DATA.points.back,
        ...BODY_DATA.points.detail
    ];

    const pointsByName = {};
    allPoints.forEach(point => {
        if (!pointsByName[point.name]) {
            pointsByName[point.name] = [];
        }
        pointsByName[point.name].push(point.id);
    });

    const sortedNames = Object.keys(pointsByName).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return sortedNames.map(name => {
        const ids = pointsByName[name].join(',');
        return `
            <div class="px-5 py-3 cursor-pointer text-[10px] font-bold uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 last:border-0 transition-all group hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                onclick="selectCustomOption('${ids}', '${name}', event)"
                onmouseenter="previewBodyPoints('${ids}')"
                onmouseleave="clearBodyPointPreview()"
            >
                <span class="text-gray-900 dark:text-gray-100 group-hover:text-white dark:group-hover:text-black transition-colors block">${name}</span>
            </div>
        `;
    }).join('');
}

function toggleCustomDropdown(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('customDropdownMenu');
    const icon = document.getElementById('customDropdownIcon');

    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        // Animate open
        requestAnimationFrame(() => {
            menu.classList.remove('opacity-0', '-translate-y-2');
            menu.classList.add('opacity-100', 'translate-y-0');
            if (icon) icon.style.transform = 'rotate(180deg)';
        });
    } else {
        closeCustomDropdown();
    }
}

function closeCustomDropdown() {
    const menu = document.getElementById('customDropdownMenu');
    const icon = document.getElementById('customDropdownIcon');

    if (!menu) return;

    // Animate close
    menu.classList.remove('opacity-100', 'translate-y-0');
    menu.classList.add('opacity-0', '-translate-y-2');
    if (icon) icon.style.transform = 'rotate(0deg)';

    setTimeout(() => {
        menu.classList.add('hidden');
    }, 200);
}

function selectCustomOption(ids, name, event) {
    if (event) event.stopPropagation();

    if (!ids) {
        clearBodyFilter();
    } else {
        selectBodyPoint(ids);
    }

    closeCustomDropdown();
    clearBodyPointPreview();
}

function clearBodyFilter() {
    STATE.selectedBodyPoint = null;
    const label = document.getElementById('selectedPointLabel');
    if (label) label.classList.add('hidden');

    // Update Button Label
    const btnLabel = document.getElementById('customDropdownLabel');
    if (btnLabel) btnLabel.textContent = 'Filtrar por Região';

    applyFilters();
    updateUIForTab('mapa');
}

// Close custom dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('customBodyPointDropdown');
    const menu = document.getElementById('customDropdownMenu');
    if (dropdown && menu && !menu.classList.contains('hidden')) {
        if (!dropdown.contains(e.target)) {
            closeCustomDropdown();
        }
    }
});

// Polyfill for matchBodyPoint provided for safety
function matchBodyPoint(item, pointId) {
    // This is a safety fallback if main.js calls it.
    // However, our primary filtering is done via filterByBodyPoint in this file.
    const keywords = BODY_DATA.keywords[pointId] || [];
    if (keywords.length === 0) return true; // Loose matching if no keywords?

    // Strict matching
    const searchText = removeAccents((item.title + ' ' + item.content).toLowerCase());
    return keywords.some(keyword => searchText.includes(removeAccents(keyword.toLowerCase())));
}
