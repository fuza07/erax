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

function recoverID() {
    const phone = document.getElementById('phone-input').value.trim();
    
    if (!phone) {
        alert(currentLang === 'uz' ? 'Telefon raqamni kiriting!' : 'Введите номер телефона!');
        return;
    }
    
    fetch('/api/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            document.getElementById('recovered-id').textContent = data.warehouse_id;
            document.getElementById('result').style.display = 'block';
        } else {
            alert(currentLang === 'uz' ? 'Telefon raqam topilmadi!' : 'Номер телефона не найден!');
        }
    });
}

setLang(currentLang);
