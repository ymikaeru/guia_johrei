// Search Enhancement Module
// Handles advanced search features: ranking, fuzzy matching, synonyms, operators

const SearchEngine = {
    // Synonym dictionary for Portuguese medical/spiritual terms
    synonyms: {
        'cabeça': ['crânio', 'cérebro', 'encefalo'],
        'dor': ['doença', 'enfermidade', 'mal', 'algias', 'problema', 'sintoma'],
        'coração': ['cardíaco', 'cardio', 'peito', 'tórax'],
        'pulmão': ['pulmonar', 'respiratório', 'ar'],
        'estômago': ['gástrico', 'digestivo', 'barriga', 'abdômen', 'ventre'],
        'fígado': ['hepático', 'vesícula', 'bile'],
        'rim': ['renal', 'urina', 'urinário'],
        'sangue': ['sanguíneo', 'hemático', 'circulação'],
        'olhos': ['olho', 'ocular', 'visão', 'vista'],
        'ouvido': ['auditivo', 'audição', 'orelha', 'zumbido'],
        'garganta': ['faríngeo', 'laringe', 'faringe', 'amígdalas', 'rouquidão'],
        'intestino': ['intestinal', 'entérico', 'evacuação', 'prisão de ventre', 'diarreia'],
        'espírito': ['espiritual', 'alma', 'mental', 'emocional'],
        'toxina': ['toxinas', 'impureza', 'impurezas', 'veneno', 'medicamento'],
        'johrei': ['luz divina', 'luz', 'energia'],
        'cura': ['curar', 'tratamento', 'sarar', 'recuperação', 'milagre'],
        'quadril': ['quadris', 'bacia', 'pélvis', 'cintura'],
        'perna': ['pernas', 'membros inferiores', 'coxa', 'joelho', 'tornozelo', 'pé'],
        'braço': ['braços', 'membros superiores', 'cotovelo', 'pulso', 'mão'],
        'febre': ['temperatura', 'quente', 'calor'],
        'resfriado': ['gripe', 'coriza', 'tosse', 'catarro'],
        'mulher': ['feminino', 'utero', 'ovario', 'menstruação'],
        'homem': ['masculino', 'próstata'],
        'pele': ['cutâneo', 'derme', 'coceira', 'alergia', 'erupção'],
        'boca': ['dentes', 'gengiva', 'lingua', 'oral']
    },

    // Get all related terms for a word (including synonyms)
    getRelatedTerms(word) {
        const normalized = removeAccents(word.toLowerCase());
        const related = [word, normalized];

        // Check if word is a key
        if (this.synonyms[normalized]) {
            related.push(...this.synonyms[normalized]);
        }

        // Check if word is a synonym of any key
        for (const [key, syns] of Object.entries(this.synonyms)) {
            if (syns.some(syn => removeAccents(syn) === normalized)) {
                related.push(key, ...syns);
            }
        }

        return [...new Set(related)];
    },

    // Simple fuzzy matching using Levenshtein-like distance
    fuzzyMatch(query, target, threshold = 0.7) {
        const q = removeAccents(query.toLowerCase());
        const t = removeAccents(target.toLowerCase());

        // Exact match
        if (t.includes(q)) return 1.0;

        // Calculate similarity based on common characters
        const qChars = new Set(q.split(''));
        const tChars = new Set(t.split(''));
        const intersection = new Set([...qChars].filter(x => tChars.has(x)));
        const similarity = (intersection.size * 2) / (qChars.size + tChars.size);

        return similarity >= threshold ? similarity : 0;
    },

    // Parse search query for operators (AND, OR, NOT)
    parseQuery(query) {
        const tokens = [];
        let current = '';
        let operator = 'AND'; // Default operator

        const words = query.split(/\s+/);

        for (const word of words) {
            const upper = word.toUpperCase();

            if (upper === 'E' || upper === 'AND' || upper === '&&') {
                if (current) tokens.push({ term: current, operator: 'AND' });
                current = '';
                operator = 'AND';
            } else if (upper === 'OU' || upper === 'OR' || upper === '||') {
                if (current) tokens.push({ term: current, operator });
                current = '';
                operator = 'OR';
            } else if (upper === 'NAO' || upper === 'NÃO' || upper === 'NOT' || upper === '-') {
                if (current) tokens.push({ term: current, operator });
                current = '';
                operator = 'NOT';
            } else {
                if (current) current += ' ';
                current += word;
                if (!current.trim()) continue;
            }
        }

        if (current) tokens.push({ term: current, operator });

        return tokens.length > 0 ? tokens : [{ term: query, operator: 'AND' }];
    },

    // Score an item based on search relevance
    scoreItem(item, query, useOperators = false) {
        let score = 0;
        const q = removeAccents(query.toLowerCase());

        // Get all related search terms
        const searchTerms = this.getRelatedTerms(query);

        // Title matches (highest weight)
        const title = removeAccents(item.title || '').toLowerCase();
        if (title === q) score += 100; // Exact match
        else if (title.startsWith(q)) score += 80; // Starts with
        else if (title.includes(q)) score += 60; // Contains
        else {
            // Check synonyms
            for (const term of searchTerms) {
                const termNorm = removeAccents(term.toLowerCase());
                if (title.includes(termNorm)) {
                    score += 40;
                    break;
                }
            }
            // Fuzzy match
            const fuzzy = this.fuzzyMatch(q, title);
            if (fuzzy > 0) score += fuzzy * 30;
        }

        // Tag matches (medium-high weight)
        if (item.tags && Array.isArray(item.tags)) {
            for (const tag of item.tags) {
                const tagNorm = removeAccents(tag.toLowerCase());
                if (tagNorm === q) score += 50;
                else if (tagNorm.includes(q)) score += 35;
                else {
                    for (const term of searchTerms) {
                        if (tagNorm.includes(removeAccents(term.toLowerCase()))) {
                            score += 25;
                            break;
                        }
                    }
                }
            }
        }

        // Focus points (medium weight)
        if (item.focusPoints && Array.isArray(item.focusPoints)) {
            for (const fp of item.focusPoints) {
                const fpNorm = removeAccents(fp.toLowerCase());
                if (fpNorm === q) score += 40;
                else if (fpNorm.includes(q)) score += 28;
                else {
                    for (const term of searchTerms) {
                        if (fpNorm.includes(removeAccents(term.toLowerCase()))) {
                            score += 20;
                            break;
                        }
                    }
                }
            }
        }

        // Content matches (lower weight, but still valuable)
        if (item.content) {
            const content = removeAccents(item.content.toLowerCase());
            const matches = content.split(q).length - 1;
            score += Math.min(matches * 5, 25); // Cap at 25 points

            // Bonus if query appears in first 100 chars
            if (content.substring(0, 100).includes(q)) score += 10;
        }

        return score;
    },

    // Enhanced search with all features
    search(items, query, options = {}) {
        const {
            minScore = 10,
            maxResults = 100,
            useOperators = true,
            useFuzzy = true,
            useSynonyms = true
        } = options;

        if (!query || query.length < 1) return [];

        const results = [];
        const tokens = useOperators ? this.parseQuery(query) : [{ term: query, operator: 'AND' }];

        for (const item of items) {
            let totalScore = 0;
            let matches = 0;
            let excludes = 0;

            for (const token of tokens) {
                const score = this.scoreItem(item, token.term);

                if (token.operator === 'NOT') {
                    if (score > 0) excludes++;
                } else if (token.operator === 'OR') {
                    if (score > 0) {
                        matches++;
                        totalScore = Math.max(totalScore, score);
                    }
                } else { // AND
                    if (score > 0) {
                        matches++;
                        totalScore += score;
                    }
                }
            }

            // Skip if excluded
            if (excludes > 0) continue;

            // For AND operations, all terms must match
            const andTokens = tokens.filter(t => t.operator === 'AND').length;
            if (andTokens > 0 && matches < andTokens) continue;

            // Must meet minimum score
            if (totalScore >= minScore) {
                results.push({
                    item,
                    score: totalScore,
                    query
                });
            }
        }

        // Sort by score (highest first) and limit results
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
            .map(r => r.item);
    },

    // Spell correction using Levenshtein distance
    suggestCorrection(query, candidates) {
        const q = removeAccents(query.toLowerCase());
        if (q.length < 3) return null; // Too short to correct

        let bestMatch = null;
        let minDistance = Infinity;

        candidates.forEach(candidate => {
            const term = removeAccents(candidate.toLowerCase());
            const dist = this.levenshtein(q, term);

            // Dynamic threshold: Allow 1 error for short words, 2 for longer
            const threshold = q.length <= 4 ? 1 : 2;

            if (dist <= threshold && dist < minDistance) {
                minDistance = dist;
                bestMatch = candidate; // Return original casing
            }
        });

        // Only suggest if distance is small and it's not the query itself
        if (bestMatch && minDistance > 0) {
            return bestMatch;
        }
        return null;
    },

    // Levenshtein Distance Algorithm
    levenshtein(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];

        // Initialize first column
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        // Initialize first row
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }
};

// Search History Manager
const SearchHistory = {
    maxHistory: 10,
    storageKey: 'johrei_search_history',

    getHistory() {
        try {
            const history = localStorage.getItem(this.storageKey);
            return history ? JSON.parse(history) : [];
        } catch (e) {
            return [];
        }
    },

    addSearch(query) {
        if (!query || query.trim().length < 2) return;

        let history = this.getHistory();

        // Remove duplicates
        history = history.filter(h => h !== query);

        // Add to front
        history.unshift(query);

        // Limit size
        history = history.slice(0, this.maxHistory);

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save search history:', e);
        }
    },

    clearHistory() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            console.error('Failed to clear search history:', e);
        }
    },

    getRelatedSearches(currentQuery) {
        const history = this.getHistory();
        const q = removeAccents(currentQuery.toLowerCase());

        return history.filter(h => {
            const hNorm = removeAccents(h.toLowerCase());
            return hNorm.includes(q) || q.includes(hNorm);
        }).slice(0, 5);
    },

    removeHistoryItem(query) {
        try {
            let history = this.getHistory();
            history = history.filter(h => h !== query);
            localStorage.setItem(this.storageKey, JSON.stringify(history));
            return true;
        } catch (e) {
            console.error('Failed to remove search history item:', e);
            return false;
        }
    }
};
