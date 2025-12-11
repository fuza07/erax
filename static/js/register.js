let currentLang = localStorage.getItem('lang') || 'uz';

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    fetch(`/set_lang/${lang}`);
    document.querySelectorAll('[data-uz]').forEach(el => {
        el.textContent = el.getAttribute(`data-${lang}`);
    });
    document.querySelectorAll('[data-uz-placeholder]').forEach(el => {
        el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
    });
}

function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'join') {
        document.getElementById('tab-join').classList.add('active');
        document.getElementById('join-tab').classList.add('active');
    } else {
        document.getElementById('tab-create').classList.add('active');
        document.getElementById('create-tab').classList.add('active');
    }
}

function joinWarehouse() {
    const warehouseId = document.getElementById('join-warehouse-id').value.trim();
    const username = document.getElementById('join-username').value.trim();
    const phone = document.getElementById('join-phone').value.trim();
    
    if (!warehouseId || !username || !phone) {
        alert(currentLang === 'uz' ? 'Barcha maydonlarni to\'ldiring!' : 'Заполните все поля!');
        return;
    }
    
    fetch('/api/warehouse/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouse_id: warehouseId, username: username, phone: phone })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            alert(currentLang === 'uz' ? 'Muvaffaqiyatli qo\'shildingiz!' : 'Успешно присоединились!');
            window.location.href = '/';
        } else {
            alert(data.error);
        }
    });
}

function createWarehouse() {
    const warehouseName = document.getElementById('create-warehouse-name').value.trim();
    const username = document.getElementById('create-username').value.trim();
    const phone = document.getElementById('create-phone').value.trim();
    const code = document.getElementById('verification-code').value.trim();
    
    if (!warehouseName || !username || !phone || !code) {
        alert(currentLang === 'uz' ? 'Barcha maydonlarni to\'ldiring!' : 'Заполните все поля!');
        return;
    }
    
    fetch('/api/warehouse/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            warehouse_name: warehouseName, 
            username: username, 
            phone: phone,
            code: code
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            alert((currentLang === 'uz' ? 'Sklad yaratildi! ID: ' : 'Склад создан! ID: ') + data.warehouse_id);
            window.location.href = '/';
        } else {
            alert(data.error);
        }
    });
}

setLang(currentLang);
