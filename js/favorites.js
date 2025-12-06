const FAV_KEY = 'johrei_favorites';

const Favorites = {
    trays: {
        'Principal': []
    },
    activeTray: 'Principal',

    init() {
        try {
            const stored = localStorage.getItem(FAV_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Migration V1 (Array) -> V2 (Objects)
                if (Array.isArray(parsed)) {
                    this.trays = { 'Principal': parsed };
                    this.activeTray = 'Principal';
                    this.save();
                } else {
                    // V2
                    this.trays = parsed.trays || { 'Principal': [] };
                    this.activeTray = parsed.activeTray || 'Principal';
                    if (!this.trays[this.activeTray]) {
                        this.activeTray = Object.keys(this.trays)[0] || 'Principal';
                    }
                }
            } else {
                this.trays = { 'Principal': [] };
                this.activeTray = 'Principal';
            }
        } catch (e) {
            console.error('Error loading favorites', e);
            this.trays = { 'Principal': [] };
            this.activeTray = 'Principal';
        }
    },

    save() {
        const data = {
            trays: this.trays,
            activeTray: this.activeTray
        };
        localStorage.setItem(FAV_KEY, JSON.stringify(data));
    },

    // Getter/Setter for backward compatibility & easy access
    get list() {
        return this.trays[this.activeTray] || [];
    },

    set list(val) {
        if (this.trays[this.activeTray]) {
            this.trays[this.activeTray] = val;
            this.save();
        }
    },

    is(id) {
        return this.list.includes(id);
    },

    toggle(id) {
        // Must use 'this.list' getter to get the array reference, but we need to modify the array in place.
        // getter returns reference, so push/splice works.
        // CHECK: Does getter value copy or ref? JS arrays are refs.
        let currentList = this.trays[this.activeTray];

        const idx = currentList.indexOf(id);
        if (idx === -1) {
            // Adding item
            // Feature: Prompt for Apostila Name on first add to Principal
            if (this.activeTray === 'Principal' && currentList.length === 0) {
                const newName = prompt("Você está criando uma nova Apostila. Digite um nome para ela (ou OK para manter na 'Principal'):");
                if (newName && newName.trim()) {
                    const clean = newName.trim();
                    if (this.trays[clean]) {
                        alert(`Apostila "${clean}" já existe. Adicionando item a ela.`);
                        this.switchTray(clean);
                    } else {
                        this.createTray(clean);
                        this.switchTray(clean);
                    }
                    // Update reference to the NEW active tray list
                    currentList = this.trays[this.activeTray];
                }
            }
            currentList.push(id);
        } else {
            currentList.splice(idx, 1);
        }

        this.save();
        this.triggerUpdates(id);
    },

    // --- TRAY MANAGEMENT ---

    createTray(name) {
        const cleanName = name.trim();
        if (!cleanName) return false;
        if (this.trays[cleanName]) return false; // Exists

        this.trays[cleanName] = [];
        this.activeTray = cleanName;
        this.save();
        this.triggerUpdates();
        return true;
    },

    deleteTray(name) {
        if (name === 'Principal') return false; // Prevent deletion of default
        if (!this.trays[name]) return false;

        delete this.trays[name];

        // If we deleted the active tray, switch to Principal
        if (this.activeTray === name) {
            this.activeTray = 'Principal';
        }

        this.save();
        this.triggerUpdates();
        return true;
    },

    addAll(ids) {
        if (!ids || ids.length === 0) return false;

        let currentList = this.trays[this.activeTray];
        let addedCount = 0;

        // Special check for first add to empty Principal
        if (this.activeTray === 'Principal' && currentList.length === 0) {
            const newName = prompt("Você está criando uma nova Apostila. Digite um nome para ela (ou OK para manter na 'Principal'):");
            if (newName && newName.trim()) {
                const clean = newName.trim();
                if (!this.trays[clean]) {
                    this.createTray(clean);
                }
                this.switchTray(clean);
                // Update ref
                currentList = this.trays[this.activeTray];
            }
        }

        ids.forEach(id => {
            if (!currentList.includes(id)) {
                currentList.push(id);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            this.save();
            this.triggerUpdates();
            return true;
        }
        return false;
    },

    removeAll(ids) {
        if (!ids || ids.length === 0) return false;

        let currentList = this.trays[this.activeTray];
        let removedCount = 0;

        ids.forEach(id => {
            const idx = currentList.indexOf(id);
            if (idx > -1) {
                currentList.splice(idx, 1);
                removedCount++;
            }
        });

        if (removedCount > 0) {
            this.save();
            this.triggerUpdates();
            return true;
        }
        return false;
    },

    renameTray(oldName, newName) {
        const cleanNew = newName.trim();
        if (!cleanNew) return false;
        if (oldName === 'Principal') return false;
        if (!this.trays[oldName]) return false;
        if (this.trays[cleanNew]) return false; // Target name exists

        // Move data
        this.trays[cleanNew] = this.trays[oldName];
        delete this.trays[oldName];

        if (this.activeTray === oldName) {
            this.activeTray = cleanNew;
        }

        this.save();
        this.triggerUpdates();
        return true;
    },

    switchTray(name) {
        if (!this.trays[name]) return false;
        this.activeTray = name;
        this.save();
        this.triggerUpdates();
        return true;
    },

    clearCurrentTray() {
        if (this.trays[this.activeTray]) {
            this.trays[this.activeTray] = [];
            this.save();
            this.triggerUpdates();
        }
    },

    // --- UI UPDATES ---

    triggerUpdates(itemId = null) {
        // Update Tab Counter
        if (typeof renderTabs === 'function') renderTabs();

        // If we are currently viewing the Favorites tab, we must re-render the list
        // because the source data (active tray or its content) has changed.
        if (typeof STATE !== 'undefined' && STATE.activeTab === 'favoritos') {
            // Re-run filter logic to update STATE.list and then render
            if (typeof applyFilters === 'function') applyFilters();
        }

        // Update individual item buttons (stars/bookmarks)
        if (itemId) {
            this.updateButtons(itemId);
        } else {
            // Update all buttons if we switched trays or cleared all
            this.updateAllButtons();
        }
    },

    updateButtons(id) {
        const isFav = this.is(id);
        // Define paths centrally or duplicated? Duplicated for now to ensure self-contained fix without global vars import issues.
        // Empty: Thin elegant circle
        const emptyIconHtml = `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" stroke-width="1" />`;
        // Filled: Thin circle with check mark
        const filledIconHtml = `<path fill="currentColor" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />`;

        document.querySelectorAll(`.fav-btn[data-id="${id}"]`).forEach(btn => {
            const svg = btn.querySelector('svg');
            if (svg) {
                // Update SVG Content
                svg.innerHTML = isFav ? filledIconHtml : emptyIconHtml;

                // Update Colors
                if (isFav) {
                    svg.classList.remove('text-gray-300', 'hover:text-blue-400', 'dark:text-gray-600', 'dark:hover:text-blue-400', 'hover:text-gray-500', 'dark:hover:text-gray-400'); // Clean old
                    svg.classList.add('text-blue-600', 'fill-blue-600');
                } else {
                    svg.classList.remove('text-blue-600', 'fill-blue-600');
                    svg.classList.add('text-gray-300', 'dark:text-gray-600');
                    // Note: Hover classes might be lost if we mess too much with classList. 
                    // Simpler to just toggle the 'active' state classes.
                    // Let's reset to base state
                    svg.setAttribute('class', `w-6 h-6 transition-all duration-300 ${isFav ? 'text-blue-600 fill-blue-600' : 'text-gray-300 hover:text-blue-400 dark:text-gray-600 dark:hover:text-blue-400'}`);
                    // Modal uses w-8 h-8... we need to preserve size.
                    if (btn.parentElement.id === 'modalCard' || btn.classList.contains('ml-auto')) {
                        svg.setAttribute('class', `w-8 h-8 transition-all duration-300 ${isFav ? 'text-blue-600 fill-blue-600' : 'text-gray-300 hover:text-blue-400 dark:text-gray-600 dark:hover:text-blue-400'}`);
                    }
                }

                // Update Title
                btn.title = isFav ? 'Remover da Apostila' : 'Adicionar à Apostila';
            }
        });
    },

    updateAllButtons() {
        if (typeof applyFilters === 'function') applyFilters(); // Re-renders list

        // Also update Modal button if open
        const modalBtn = document.querySelector('#modalCard .fav-btn');
        if (modalBtn) {
            this.updateButtons(modalBtn.dataset.id);
        }
    }
};

Favorites.init();

// --- GLOBAL UI HELPERS ---
window.createNewTray = function () {
    const name = prompt("Nome da nova apostila:");
    if (name) {
        if (!Favorites.createTray(name)) {
            alert('Erro: Nome inválido, já existente ou "Principal".');
            Favorites.triggerUpdates(); // Reset select
        }
    } else {
        Favorites.triggerUpdates(); // Reset Select if cancelled
    }
};

window.renameCurrentTray = function () {
    if (!Favorites.activeTray || Favorites.activeTray === 'Principal') return;

    const currentName = Favorites.activeTray;
    const newName = prompt(`Renomear "${currentName}" para:`, currentName);

    if (newName && newName !== currentName) {
        if (Favorites.renameTray(currentName, newName)) {
            // Success
        } else {
            alert('Nome inválido ou já existente.');
        }
    }
}

window.confirmClearTray = function (event) {
    if (event) event.preventDefault();
    // Use timeout to ensure no UI race condition
    setTimeout(() => {
        if (confirm('Tem certeza que deseja limpar esta apostila?')) {
            Favorites.clearCurrentTray();
        }
    }, 10);
};
