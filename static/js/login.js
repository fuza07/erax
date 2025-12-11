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

function login() {
    const warehouseId = document.getElementById('warehouse-id-input').value.trim();
    const username = document.getElementById('username-login').value.trim();
    
    if (!warehouseId || !username) {
        alert(currentLang === 'uz' ? 'Barcha maydonlarni to\'ldiring!' : 'Заполните все поля!');
        return;
    }
    
    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouse_id: warehouseId, username: username })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/';
        } else {
            alert(data.error || (currentLang === 'uz' ? 'Xato!' : 'Ошибка!'));
        }
    });
}

// Telegram botni ochish
function openTelegramBot() {
    const telegramUrl = 'https://t.me/eraxsklad_bot';
    window.open(telegramUrl, '_blank');
    
    if (typeof Utils !== 'undefined') {
        Utils.showToast('Telegram botga o\'ting va "🆔 Sklad ID olish" tugmasini bosing', 'info', 5000);
    } else {
        alert('Telegram botga o\'ting va "🆔 Sklad ID olish" tugmasini bosing');
    }
}

setLang(currentLang);
