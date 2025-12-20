function toSlug(str) {
    if (!str) return '';
    return str
        .toString()
        .toLowerCase()
        .normalize('NFD') // Decompose combined characters (e.g., 'é' -> 'e' + '´')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start
        .replace(/-+$/, ''); // Trim - from end
}

function cleanTitle(title) {
    if (!title) return '';
    return title
        .replace(/^\s*#+\s*/, '') // Remove markdown headers (###)
        .replace(/^\s*\*+\s*/, '') // Remove bold markers at start if any
        .replace(/\s*\*+\s*$/, '') // Remove bold markers at end
        .replace(/^\s*(?:[IVX]+\.|[0-9]+\.)\s*/, '') // Remove Roman (I.) or Decimal (1.) prefixes
        .trim();
}
