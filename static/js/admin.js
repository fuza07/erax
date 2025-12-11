// Admin panel funksiyalari
let currentUser = null;

// Bo'limlarni almashtirish
function showSection(section) {
    // Barcha bo'limlarni yashirish
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Barcha nav linklar active classini olib tashlash
    document.querySelectorAll('.sidebar nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Tanlangan bo'limni ko'rsatish
    document.getElementById('section-' + section).style.display = 'block';
    document.getElementById('nav-' + section).classList.add('active');
    
    // Sarlavhani o'zgartirish
    const titles = {
        'stats': 'Admin Dashboard',
        'users': 'Foydalanuvchilar',
        'warehouses': 'Skladlar',
        'subscriptions': 'Obunalar',
        'messages': 'Xabarlar'
    };
    document.getElementById('page-title').textContent = titles[section];
    
    // Har bir bo'limda ma'lumotlarni yuklash
    if (section === 'stats') {
        loadStats();
    } else if (section === 'users') {
        loadAllUsers();
    } else if (section === 'warehouses') {
        loadAllWarehouses();
    } else if (section === 'subscriptions') {
        loadSubscriptions();
    }
}

function loadAllUsers() {
    fetch('/api/admin/all-users')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const tbody = document.getElementById('all-users-table');
            tbody.innerHTML = '';
            if (data.users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Foydalanuvchilar topilmadi</td></tr>';
            } else {
                data.users.forEach(user => {
                    const row = `<tr>
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>${user.phone || '-'}</td>
                        <td>${user.warehouse_id}</td>
                        <td>${getSubscriptionName(user.subscription_type)}</td>
                        <td>${user.subscription_expiry || '-'}</td>
                    </tr>`;
                    tbody.innerHTML += row;
                });
            }
        }
    })
    .catch(error => {
        document.getElementById('all-users-table').innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Xatolik: ' + error.message + '</td></tr>';
    });
}

function loadAllWarehouses() {
    fetch('/api/admin/all-warehouses')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const tbody = document.getElementById('all-warehouses-table');
            tbody.innerHTML = '';
            if (data.warehouses.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Skladlar topilmadi</td></tr>';
            } else {
                data.warehouses.forEach(wh => {
                    const row = `<tr>
                        <td>${wh.id}</td>
                        <td>${wh.name}</td>
                        <td>${wh.created_date}</td>
                        <td>${getSubscriptionName(wh.subscription_type)}</td>
                        <td>${wh.user_count}</td>
                    </tr>`;
                    tbody.innerHTML += row;
                });
            }
        }
    })
    .catch(error => {
        document.getElementById('all-warehouses-table').innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Xatolik: ' + error.message + '</td></tr>';
    });
}

function loadSubscriptions() {
    fetch('/api/admin/subscriptions')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('trial-count').textContent = data.subscriptions.trial;
            document.getElementById('basic-count').textContent = data.subscriptions.basic;
            document.getElementById('pro-count').textContent = data.subscriptions.pro;
            document.getElementById('premium-count').textContent = data.subscriptions.premium;
        }
    })
    .catch(error => {
        Utils.showToast('Obunalar yuklanmadi: ' + error.message, 'error');
    });
}

// Sahifa yuklanganda statistikalarni olish
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
});

function loadStats() {
    fetch('/api/admin/stats')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('total-warehouses').textContent = data.stats.warehouses;
            document.getElementById('total-users').textContent = data.stats.users;
            document.getElementById('active-subscriptions').textContent = data.stats.subscriptions;
            document.getElementById('monthly-revenue').textContent = Utils.formatNumber(data.stats.revenue) + ' so\'m';
        }
    })
    .catch(error => {
        Utils.showToast('Statistika yuklanmadi: ' + error.message, 'error');
    });
}

function searchUser() {
    const phone = document.getElementById('search-phone').value.trim();
    
    if (!phone) {
        Utils.showToast('Telefon raqamni kiriting!', 'error');
        return;
    }
    
    fetch('/api/admin/search-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: phone })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = data.user;
            displayUser(data.user);
        } else {
            Utils.showToast('Foydalanuvchi topilmadi!', 'error');
            document.getElementById('user-result').style.display = 'none';
        }
    })
    .catch(error => {
        Utils.showToast('Qidirishda xatolik: ' + error.message, 'error');
    });
}

function displayUser(user) {
    document.getElementById('user-name').textContent = user.username;
    document.getElementById('user-phone').textContent = user.phone || '-';
    document.getElementById('user-warehouse').textContent = user.warehouse_id;
    document.getElementById('user-subscription').textContent = getSubscriptionName(user.subscription_type);
    document.getElementById('user-expiry').textContent = user.subscription_expiry || '-';
    
    // Select ni to'ldirish
    document.getElementById('subscription-type').value = user.subscription_type || 'trial';
    
    document.getElementById('user-result').style.display = 'block';
}

function getSubscriptionName(type) {
    const names = {
        'trial': 'Sinov (Bepul)',
        'basic': 'Oddiy (20,000)',
        'pro': 'Pro (50,000)',
        'premium': 'Premium (100,000)'
    };
    return names[type] || 'Sinov';
}

function updateSubscription() {
    if (!currentUser) {
        Utils.showToast('Avval foydalanuvchini qidiring!', 'error');
        return;
    }
    
    const subscriptionType = document.getElementById('subscription-type').value;
    const period = parseInt(document.getElementById('subscription-period').value);
    
    // Muddat sanasini hisoblash
    const today = new Date();
    const expiryDate = new Date(today.setMonth(today.getMonth() + period));
    const expiryDateStr = expiryDate.toISOString().split('T')[0];
    
    fetch('/api/admin/update-subscription', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: currentUser.id,
            subscription_type: subscriptionType,
            expiry_date: expiryDateStr
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Utils.showToast('Obuna muvaffaqiyatli yangilandi!', 'success');
            // Ma'lumotlarni yangilash
            currentUser.subscription_type = subscriptionType;
            currentUser.subscription_expiry = expiryDateStr;
            displayUser(currentUser);
            loadStats();
        } else {
            Utils.showToast('Yangilashda xatolik: ' + data.message, 'error');
        }
    })
    .catch(error => {
        Utils.showToast('Xatolik: ' + error.message, 'error');
    });
}

function toggleWarehouseInput() {
    const type = document.getElementById('message-type').value;
    document.getElementById('warehouse-select-div').style.display = type === 'single' ? 'block' : 'none';
}

function sendAdminMessage() {
    const type = document.getElementById('message-type').value;
    const message = document.getElementById('message-text').value.trim();
    const warehouseId = document.getElementById('target-warehouse-id').value.trim();
    
    if (!message) {
        Utils.showToast('Xabar matnini kiriting!', 'error');
        return;
    }
    
    if (type === 'single' && !warehouseId) {
        Utils.showToast('Sklad ID ni kiriting!', 'error');
        return;
    }
    
    fetch('/api/admin/send-message', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            type: type,
            warehouse_id: warehouseId,
            message: message
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            Utils.showToast('Xabar yuborildi!', 'success');
            document.getElementById('message-text').value = '';
            document.getElementById('target-warehouse-id').value = '';
        } else {
            Utils.showToast(data.message || 'Xatolik!', 'error');
        }
    });
}