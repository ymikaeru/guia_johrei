
const FAV_KEY = 'johrei_favorites';

const Favorites = {
    list: [],

    init() {
        try {
            const stored = localStorage.getItem(FAV_KEY);
            if (stored) this.list = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading favorites', e);
            this.list = [];
        }
    },

    toggle(id) {
        const idx = this.list.indexOf(id);
        if (idx === -1) {
            this.list.push(id);
        } else {
            this.list.splice(idx, 1);
        }
        this.save();

        // Trigger UI updates
        if (typeof renderTabs === 'function') renderTabs();

        // If currently viewing favorites, re-render
        if (STATE.activeTab === 'favoritos') {
            renderFavorites();
        }

        // Update specific button states
        this.updateButtons(id);
    },

    save() {
        localStorage.setItem(FAV_KEY, JSON.stringify(this.list));
    },

    is(id) {
        return this.list.includes(id);
    },

    updateButtons(id) {
        // Find all buttons for this ID
        const btns = document.querySelectorAll(`.fav-btn[data-id="${id}"]`);
        btns.forEach(btn => {
            const isFav = this.is(id);
            // Update Icon
            // Empty Star path
            const emptyStar = `<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />`;
            // Filled Star path
            const filledStar = `<path fill="currentColor" fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />`;

            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 transition-colors ${isFav ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-500'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">${isFav ? filledStar : emptyStar}</svg>`;
        });
    }
};

function renderFavorites() {
    const container = document.getElementById('results');
    const favs = Favorites.list;

    if (favs.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-gray-500">Sua bandeja de impressão está vazia. Adicione itens clicando na estrela. ⭐</div>`;
        return;
    }

    // Need to find items by ID across all data
    // Assuming STATE.data is populated
    let items = [];
    // Helper to find item
    const findItem = (id) => {
        for (const tab in STATE.data) {
            const found = STATE.data[tab].find(i => i.id === id);
            if (found) return found;
        }
        return null;
    };

    favs.forEach(id => {
        const item = findItem(id);
        if (item) items.push(item);
    });

    // Reuse render logic?
    // We can manually build the HTML using `renderCard` style logic or call a reusable function if one existed.
    // The current render logic is inside `renderList` in main.js
    // I'll quickly reimplement a cleaner version for favorites or refactor `renderList`.
    // Since `renderList` is complex (handling 'mapa' etc), I'll write specific render logical for Favorites.

    let html = `<div class="mb-4 flex justify-between items-center no-print px-4">
        <h2 class="text-xl font-bold font-serif text-johrei-murasaki">Bandeja de Impressão (${items.length})</h2>
        <button onclick="window.print()" class="bg-johrei-murasaki text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-purple-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd" /></svg>
            Imprimir Todos
        </button>
    </div>`;

    html += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 print:block print:gap-0 print:pb-0">`; // Print: block to allow page breaks naturally

    items.forEach((item) => {
        // Find index for modal? opening modal from favorites might be tricky if not in STATE.list context.
        // We can open modal by PASSING THE ITEM directly or finding its index in the GLOBAL list?
        // openModal(i) takes an index from STATE.list.
        // If we are in 'favoritos' mode, STATE.list should probably BE the favorites list?
        // Yes! When switching tab, we should set STATE.list = favoritesItems.
        // But here I am rendering manually. 
        // Best approach: In `filterByTab`, if tab === 'favoritos', set STATE.list = mappedItems.
        // Then `renderList` handles it?
        // `renderList` expects STATE.list.
        // So I don't need this `renderFavorites` function to generate HTML! 
        // I just need `filterByTab` to handle 'favoritos' case!
    });
    // Abort writing specialized HTML here. Move logic to main.js:filterByTab.
}
