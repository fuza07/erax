// Load sidebar
fetch('/static/sidebar.html')
    .then(r => r.text())
    .then(html => {
        const placeholder = document.getElementById('sidebar-placeholder');
        if (placeholder) {
            placeholder.outerHTML = html;
            updateTexts();
            initSidebar();
            setActivePage();
        }
    })
    .catch(err => {
        console.error('Sidebar load error:', err);
    })
    .finally(() => {
        document.body.classList.add('loaded');
    });

function setActivePage() {
    const path = window.location.pathname;
    document.querySelectorAll('.sidebar nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        }
    });
}

// Sidebar va til boshqaruvi
window.currentLang = localStorage.getItem('lang') || 'uz';

function setLang(lang) {
    window.currentLang = lang;
    localStorage.setItem('lang', lang);
    fetch(`/set_lang/${lang}`);
    updateTexts();
}

function updateTexts() {
    document.querySelectorAll('[data-uz]').forEach(el => {
        const text = el.getAttribute(`data-${window.currentLang}`);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            const placeholder = el.getAttribute(`data-${window.currentLang}-placeholder`);
            if (placeholder) {
                el.placeholder = placeholder;
            } else {
                el.placeholder = text;
            }
        } else if (el.tagName === 'OPTION') {
            el.textContent = text;
        } else {
            el.textContent = text;
        }
    });
}

// Sidebar linklar ko'rinishini boshqarish
function initSidebar() {
    fetch('/api/user/info')
        .then(r => r.json())
        .then(data => {
            // Manage link - boss va manager uchun
            if (data.role === 'boss' || data.role === 'manager') {
                const manageLink = document.getElementById('manage-link');
                if (manageLink) manageLink.style.display = 'block';
            }
            
            // Settings link - faqat boss uchun
            if (data.role === 'boss') {
                const settingsLink = document.getElementById('settings-link');
                if (settingsLink) settingsLink.style.display = 'block';
                
                // Orders link - settings orqali
                fetch('/api/settings-public')
                    .then(r => r.json())
                    .then(settings => {
                        if (settings.enable_orders) {
                            const ordersLink = document.getElementById('orders-link');
                            const divider = document.getElementById('features-divider');
                            if (ordersLink) ordersLink.style.display = 'block';
                            if (divider) divider.style.display = 'block';
                        }
                    })
                    .catch(() => {});
            }
        })
        .catch(() => {});
}

// Hide loader after timeout
setTimeout(() => {
    document.body.classList.add('loaded');
}, 500);

// Mobile menu toggle
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

window.toggleMobileMenu = toggleMobileMenu;
