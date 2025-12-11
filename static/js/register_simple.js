// Sodda register sahifasi funksiyalari
let currentLang = 'uz';
let warehouseData = {};

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
    
    if (!warehouseId || !username) {
        Utils.showToast('Barcha maydonlarni to\'ldiring!', 'error');
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
            username: username
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Utils.showToast('Muvaffaqiyatli qo\'shildingiz!', 'success');
            setTimeout(() => window.location.href = '/', 1500);
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
    
    // Ma'lumotlarni saqlash
    warehouseData = {
        warehouse_name: warehouseName,
        username: username,
        phone: phone
    };
    
    const btn = event.target;
    Utils.showLoading(btn);
    
    // Telegram botga yo'naltirish
    const telegramUrl = `https://t.me/eraxsklad_bot?start=verify_${phone.replace('+', '')}`;
    window.open(telegramUrl, '_blank');
    
    setTimeout(() => {
        Utils.hideLoading(btn);
        showVerificationTab();
    }, 2000);
}

function showVerificationTab() {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById('verification-tab').classList.add('active');
    
    // Birinchi inputga focus
    document.getElementById('code1').focus();
}

function verifyCode() {
    const code1 = document.getElementById('code1').value;
    const code2 = document.getElementById('code2').value;
    const code3 = document.getElementById('code3').value;
    const code4 = document.getElementById('code4').value;
    
    const code = code1 + code2 + code3 + code4;
    
    if (code.length !== 4) {
        Utils.showToast('4 raqamli kodni to\'liq kiriting!', 'error');
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
            ...warehouseData,
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
                <button class="confirm-btn" onclick="window.location.href='/'">Asosiy sahifaga o'tish</button>
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

// Kod inputlari uchun avtomatik o'tish
function setupCodeInputs() {
    const inputs = document.querySelectorAll('.code-input');
    
    inputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            if (this.value.length === 1) {
                this.classList.add('filled');
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            } else {
                this.classList.remove('filled');
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value === '' && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
}

// Telefon kiritilganda tasdiqlash tugmasini ko'rsatish
function checkPhoneInput() {
    const phone = document.getElementById('create-phone').value;
    const verifyBtn = document.getElementById('verify-btn');
    
    if (validatePhone(phone)) {
        verifyBtn.style.display = 'block';
    } else {
        verifyBtn.style.display = 'none';
    }
}

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', function() {
    setLang('uz');
    
    // Telefon inputlariga format qo'shish
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', () => {
            formatPhoneInput(input);
            if (input.id === 'create-phone') {
                checkPhoneInput();
            }
        });
        input.addEventListener('focus', function() {
            if (!this.value) {
                this.value = '+998';
            }
        });
    });
    
    // Kod inputlarini sozlash
    setupCodeInputs();
});