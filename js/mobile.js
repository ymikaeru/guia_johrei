
// --- PULL TO REFRESH LOGIC ---
(function initPullToRefresh() {
    let ptrStart = 0;
    let ptrCurrent = 0;
    let ptrDistance = 0;
    const ptrThreshold = 80;

    // Check DOMContentLoaded to ensure spinner exists
    document.addEventListener('DOMContentLoaded', () => {
        const spinner = document.getElementById('ptr-spinner');
        if (!spinner) return;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                ptrStart = e.touches[0].screenY;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && ptrStart > 0) {
                ptrCurrent = e.touches[0].screenY;
                ptrDistance = ptrCurrent - ptrStart;

                if (ptrDistance > 0) {
                    // Resistance
                    const translateY = Math.min(ptrDistance * 0.4, 100);
                    const opacity = Math.min(ptrDistance / ptrThreshold, 1);

                    spinner.style.transform = `translateY(${translateY}px)`;
                    spinner.style.opacity = opacity;

                    // Only prevent default if we are purely pulling down at top
                    if (ptrDistance > 10 && e.cancelable) {
                        e.preventDefault();
                    }
                }
            }
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (window.scrollY === 0 && ptrStart > 0) {
                if (ptrDistance > ptrThreshold) {
                    // RELOAD ACTION
                    spinner.style.transform = `translateY(60px)`;
                    spinner.style.opacity = '1';
                    // Optional: Vibrate if supported
                    if (navigator.vibrate) navigator.vibrate(50);

                    setTimeout(() => {
                        location.reload();
                    }, 500);
                } else {
                    // Reset
                    spinner.style.transform = 'translateY(0)';
                    spinner.style.opacity = '0';
                }
            }
            ptrStart = 0;
            ptrDistance = 0;
        });
    });
})();

// --- CUSTOM DROPDOWN LOGIC ---
function toggleMobileDropdown() {
    const menu = document.getElementById('mobileDropdownMenu');
    const icon = document.getElementById('mobileDropdownIcon');

    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        requestAnimationFrame(() => {
            menu.classList.remove('-translate-y-4', 'opacity-0', 'duration-150', 'ease-in');
            menu.classList.add('translate-y-0', 'opacity-100', 'duration-300', 'ease-out');
            icon.style.transform = 'rotate(180deg)';
        });
    } else {
        closeMobileDropdown();
    }
}

function closeMobileDropdown() {
    const menu = document.getElementById('mobileDropdownMenu');
    const icon = document.getElementById('mobileDropdownIcon');

    menu.classList.remove('translate-y-0', 'opacity-100', 'duration-300', 'ease-out');
    menu.classList.add('-translate-y-4', 'opacity-0', 'duration-150', 'ease-in');
    icon.style.transform = 'rotate(0deg)';

    setTimeout(() => {
        menu.classList.add('hidden');
    }, 150);
}

function selectMobileOption(id) {
    setTab(id);
    closeMobileDropdown();
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('mobileDropdownMenu');
    const btn = document.getElementById('mobileDropdownBtn');
    if (dropdown && !dropdown.classList.contains('hidden') && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        closeMobileDropdown();
    }
});

// --- MOBILE MAP NAVIGATION ---
window.switchMobileView = function (targetId) {
    const views = ['front', 'detail', 'back'];
    STATE.currentMobileView = targetId;

    views.forEach(id => {
        const el = document.getElementById(`view-${id}`); // Fixed spacing from original snippet
        const tab = document.getElementById(`tab-${id}`); // Fixed spacing from original snippet

        if (el && tab) {
            if (id === targetId) {
                el.classList.remove('hidden');
                // Active Styling
                tab.classList.remove('bg-white', 'dark:bg-black', 'text-gray-400', 'border-gray-200', 'dark:border-gray-800');
                tab.classList.add('bg-black', 'text-white', 'border-black', 'dark:bg-white', 'dark:text-black');
            } else {
                el.classList.add('hidden');
                // Inactive Styling
                tab.classList.remove('bg-black', 'text-white', 'border-black', 'dark:bg-white', 'dark:text-black');
                tab.classList.add('bg-white', 'dark:bg-black', 'text-gray-400', 'border-gray-200', 'dark:border-gray-800');
            }
        }
    });
};

// Global helper to switch view based on point
window.autoSwitchMapToPoint = function (pointId) {
    if (window.innerWidth >= 768) return; // Desktop doesn't need switching

    // Find which map contains the point
    let targetView = 'front'; // Default
    if (BODY_DATA.points.back.some(p => p.id === pointId)) targetView = 'back';
    else if (BODY_DATA.points.detail.some(p => p.id === pointId)) targetView = 'detail';

    // Only switch if different (and exists)
    if (targetView) {
        window.switchMobileView(targetView);
    }
};

// Mobile FAB Action
function scrollToResults() {
    const list = document.getElementById('contentList');
    list.classList.remove('hidden');
    list.scrollIntoView({ behavior: 'smooth' });
    // Hide FAB after interaction? or keep it? Keep it until deselected.
    document.getElementById('mobileFab').classList.add('hidden');
}
