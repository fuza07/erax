// Yangi register sahifasi funksiyalari
let currentLang = 'uz';
let verificationStep = 'phone';

function setLang(lang) {
    currentLang = lang;
    const elements = document.querySelectorAll('[data-uz], [data-ru]');
    elements.forEach(el => {
        if (el.hasAttribute('data-' + lang)) {
            if (el.tagName === 'INPUT') {
                el.placeholder = el.getAttribute('data-' + lang + '-placeholder') || el.getAttribute('data-' + lang);
            } else {
                el.textContent = el.getAttribute('data-' + lang);
            }
        }
    });
}

function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tab + '-tab').classList.add('active');
}

function joinWarehouse() {
    const warehouseId = document.getElementById('join-warehouse-id').value;
    const username = document.getElementById('join-username').value;
    const phone = document.getElementById('join-phone').value;
    
    if (!warehouseId || !username || !phone) {
        Utils.showToast('Barcha maydonlarni to\'ldiring!', 'error');
        return;
    }
    
    if (!validatePhone(phone)) {
        Utils.showToast('Telefon raqam noto\'g\'ri formatda!', 'error');
        return;
    }
    
    const btn = event.target;
    Utils.showLoading(btn);
    
    fetch('/api/join-warehouse', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            warehouse_id: warehouseId,
            username: username,
            phone: phone
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Utils.showToast('Muvaffaqiyatli qo\'shildingiz!', 'success');
            setTimeout(() => window.location.href = '/login', 1500);
        } else {
            Utils.showToast(data.message || 'Xatolik yuz berdi!', 'error');
        }
    })
    .catch(error => {
        Utils.showToast('Xatolik: ' + error.message, 'error');
    })
    .finally(() => {
        Utils.hideLoading(btn);
    });
}

function createWarehouse() {
    if (verificationStep === 'phone') {
        sendToTelegram();
    } else {
        verifyAndCreate();
    }
}

function sendToTelegram() {
    const warehouseName = document.getElementById('create-warehouse-name').value;
    const username = document.getElementById('create-username').value;
    const phone = document.getElementById('create-phone').value;
    
    if (!warehouseName || !username || !phone) {
        Utils.showToast('Barcha maydonlarni to\'ldiring!', 'error');
        return;
    }
    
    if (!validatePhone(phone)) {
        Utils.showToast('Telefon raqam noto\'g\'ri formatda!', 'error');
        return;
    }
    
    const btn = event.target;
    Utils.showLoading(btn);
    
    // Telegram botga yo'naltirish
    const telegramUrl = `https://t.me/EraxSkladBot?start=verify_${phone.replace('+', '')}`;
    window.open(telegramUrl, '_blank');
    
    // UI ni yangilash
    setTimeout(() => {
        Utils.hideLoading(btn);
        showVerificationStep();
    }, 2000);
}

function showVerificationStep() {
    verificationStep = 'code';
    const btn = document.querySelector('#create-tab button');
    btn.textContent = currentLang === 'uz' ? '✅ Tasdiqlash va yaratish' : '✅ Подтвердить и создать';
    btn.className = 'action-btn create-btn';
    
    // Kod input guruhini ko'rsatish
    document.getElementById('code-group').style.display = 'block';
    document.getElementById('verification-code').focus();
    
    // Telegram steps ni yangilash
    const steps = document.querySelectorAll('.step-item');
    if (steps.length >= 3) {
        steps[2].style.background = 'linear-gradient(135deg, #e8f5e8, #f0fff0)';
        steps[2].style.borderLeft = '4px solid #27ae60';
    }
}

function verifyAndCreate() {
    const warehouseName = document.getElementById('create-warehouse-name').value;
    const username = document.getElementById('create-username').value;
    const phone = document.getElementById('create-phone').value;
    const code = document.getElementById('verification-code').value;
    
    if (!code) {
        Utils.showToast('Tasdiqlash kodini kiriting!', 'error');
        return;
    }
    
    const btn = event.target;
    Utils.showLoading(btn);
    
    fetch('/api/create-warehouse', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            warehouse_name: warehouseName,
            username: username,
            phone: phone,
            verification_code: code
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Utils.showToast('Sklad muvaffaqiyatli yaratildi!', 'success');
            
            // Sklad ID ni ko'rsatish
            const modal = createSuccessModal(data.warehouse_id);
            document.body.appendChild(modal);
            modal.style.display = 'flex';
        } else {
            Utils.showToast(data.message || 'Xatolik yuz berdi!', 'error');
        }
    })
    .catch(error => {
        Utils.showToast('Xatolik: ' + error.message, 'error');
    })
    .finally(() => {
        Utils.hideLoading(btn);
    });
}

function createSuccessModal(warehouseId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>🎉 Sklad muvaffaqiyatli yaratildi!</h3>
            <p><strong>Sklad ID:</strong></p>
            <div class="id-display">
                <input type="text" value="${warehouseId}" readonly style="flex: 1; margin-right: 10px;">
                <button class="copy-btn" onclick="Utils.copyToClipboard('${warehouseId}')">Nusxalash</button>
            </div>
            <div class="warning">
                <strong>Muhim:</strong> Bu ID ni yodlab qoying yoki nusxalab oling. Boshqa foydalanuvchilar bu ID orqali sizning skladingizga qo'shilishlari mumkin.
            </div>
            <div class="modal-actions">
                <button class="confirm-btn" onclick="window.location.href='/login'">Kirish sahifasiga o'tish</button>
            </div>
        </div>
    `;
    return modal;
}

function validatePhone(phone) {
    const phoneRegex = /^\+998[0-9]{9}$/;
    return phoneRegex.test(phone);
}

// Telefon input uchun format
function formatPhoneInput(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.startsWith('998')) {
        value = '+' + value;
    } else if (value.length > 0 && !value.startsWith('998')) {
        value = '+998' + value;
    }
    input.value = value;
}

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', function() {
    setLang('uz');
    
    // Telefon inputlariga format qo'shish
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', () => formatPhoneInput(input));
        input.addEventListener('focus', function() {
            if (!this.value) {
                this.value = '+998';
            }
        });
    });
    
    // Kod input guruhini yashirish
    document.getElementById('code-group').style.display = 'none';
});