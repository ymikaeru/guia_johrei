// Global Keyboard Shortcuts

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const modal = document.getElementById('modal');

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Check if user is typing in an input/textarea
        const isTyping = e.target.tagName === 'INPUT' ||
            e.target.tagName === 'TEXTAREA' ||
            e.target.isContentEditable;

        // "/" key - Focus search (unless already typing)
        if (e.key === '/' && !isTyping) {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }

        // Ctrl+K or Cmd+K - Focus search (works even when typing)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }

        // Modal Shortcuts (Escape, Left, Right)
        const readModal = document.getElementById('readModal');
        const isModalOpen = readModal && !readModal.classList.contains('hidden');

        if (isModalOpen) {
            // Escape - Close modal
            if (e.key === 'Escape') {
                if (typeof closeModal === 'function') {
                    closeModal();
                }
            }

            // ArrowLeft - Prev Item
            if (e.key === 'ArrowLeft') {
                if (typeof navModal === 'function') {
                    navModal(-1);
                }
            }

            // ArrowRight - Next Item
            if (e.key === 'ArrowRight') {
                if (typeof navModal === 'function') {
                    navModal(1);
                }
            }
        }
    });

    // Prevent "/" from being typed when focusing search
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            // If "/" was used to focus and it's the first key, prevent it
            if (e.key === '/' && searchInput.value === '') {
                const timeSinceFocus = Date.now() - (searchInput._focusTime || 0);
                if (timeSinceFocus < 100) {
                    e.preventDefault();
                }
            }
        });

        searchInput.addEventListener('focus', () => {
            searchInput._focusTime = Date.now();
        });
    }
});
