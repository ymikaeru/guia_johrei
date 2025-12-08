// --- ESTADO GLOBAL ---
let STATE = {
    activeTab: 'fundamentos', // Default tab
    activeLetter: '',
    activeTags: [], // Changed from activeTag to activeTags array
    activeCategories: [], // Filter by categories (combined)
    activeSources: [], // Add generic support for sources even if not used initially
    activeFocusPoints: [], // Multi-select for focus points
    bodyFilter: null, // Agora suporta array ou null, mas vamos manter simples por enquanto
    apostilas: {
        ensinamentos: { items: [], title: "Minha Apostila" },
        explicacoes: { items: [], title: "Meus Estudos" }
    },
    mode: 'ensinamentos', // 'ensinamentos' ou 'explicacoes'
    list: [],
    idx: -1,
    isCrossTabMode: false, // True when showing results from multiple tabs
    selectedBodyPoint: null, // Selected body point for filtering
    globalData: {}, // Cache for all loaded data (persists across modes)
    data: {} // Holds loaded content
};

// Helper to remove accents
function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
