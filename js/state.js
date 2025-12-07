// --- ESTADO GLOBAL ---
let STATE = {
    activeTab: 'fundamentos', // ou 'curas', 'pontos_focais', 'mapa'
    activeLetter: '',
    activeTags: [], // Changed from activeTag to activeTags array
    activeCategories: [], // Filter by categories (combined)
    activeSources: [], // Filter by sources
    activeFocusPoints: [], // Multi-select for focus points
    bodyFilter: null, // Agora suporta array ou null, mas vamos manter simples por enquanto
    mode: 'ensinamentos', // 'ensinamentos' ou 'explicacoes'
    list: [],
    idx: -1,
    isCrossTabMode: false, // True when showing results from multiple tabs
    selectedBodyPoint: null // Selected body point for filtering
};

// Helper to remove accents
function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
