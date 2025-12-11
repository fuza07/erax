let currentLang = localStorage.getItem('lang') || 'uz';

const roleNames = {
    uz: { boss: 'Boshliq', manager: 'Ish boshqaruvchi', worker: 'Ishchi' },
    ru: { boss: 'Начальник', manager: 'Управляющий', worker: 'Работник' }
};

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    fetch(`/set_lang/${lang}`);
    updateTexts();
    loadUserInfo();
}

function updateTexts() {
    document.querySelectorAll('[data-uz]').forEach(el => {
        el.textContent = el.getAttribute(`data-${currentLang}`);
    });
}

function loadUserInfo() {
    fetch('/api/user/info')
        .then(r => r.json())
        .then(data => {
            document.getElementById('username').textContent = data.username;
            document.getElementById('phone').textContent = data.phone || '-';
            document.getElementById('role').textContent = roleNames[currentLang][data.role];
            document.getElementById('warehouse-name').textContent = data.warehouse_name;
            document.getElementById('warehouse-id').textContent = data.warehouse_id;
            if (data.role === 'boss' || data.role === 'manager') {
                document.getElementById('manage-link').style.display = 'block';
            }
            if (data.role === 'boss') {
                document.getElementById('settings-link').style.display = 'block';
                loadSettings();
            }
        });
}

function loadSettings() {
    fetch('/api/settings')
        .then(r => r.json())
        .then(settings => {
            if (settings.enable_orders) {
                document.getElementById('orders-link').style.display = 'block';
                document.getElementById('features-divider').style.display = 'block';
            }
        })
        .catch(err => console.log('Settings not available'));
}

function copyId() {
    const id = document.getElementById('warehouse-id').textContent;
    navigator.clipboard.writeText(id).then(() => {
        alert(currentLang === 'uz' ? 'ID nusxalandi!' : 'ID скопирован!');
    });
}

updateTexts();
loadUserInfo();
