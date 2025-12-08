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
