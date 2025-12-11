let currentLang = localStorage.getItem('lang') || 'uz';
let currentUserRole = '';

const roleNames = {
    uz: { boss: 'Boshliq', manager: 'Ish boshqaruvchi', worker: 'Ishchi' },
    ru: { boss: 'Начальник', manager: 'Управляющий', worker: 'Работник' }
};

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    fetch(`/set_lang/${lang}`);
    updateTexts();
    loadUsers();
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
            currentUserRole = data.role;
            if (data.role === 'boss' || data.role === 'manager') {
                document.getElementById('manage-link').style.display = 'block';
            }
        });
}

function loadUsers() {
    fetch('/api/users')
        .then(r => r.json())
        .then(users => {
            const tbody = document.getElementById('users-body');
            tbody.innerHTML = users.map(u => {
                const roleSelect = currentUserRole === 'boss' && u.role !== 'boss' ? 
                    `<select onchange="changeRole(${u.id}, this.value)">
                        <option value="worker" ${u.role === 'worker' ? 'selected' : ''}>${roleNames[currentLang].worker}</option>
                        <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>${roleNames[currentLang].manager}</option>
                    </select>` : 
                    roleNames[currentLang][u.role];
                
                const deleteBtn = u.role !== 'boss' ? 
                    `<button class="delete-btn" onclick="deleteUser(${u.id})">${currentLang === 'uz' ? 'O\'chirish' : 'Удалить'}</button>` : 
                    '-';
                
                return `
                    <tr>
                        <td>${u.username}</td>
                        <td>${roleSelect}</td>
                        <td>${u.joined_date}</td>
                        <td>${deleteBtn}</td>
                    </tr>
                `;
            }).join('');
        });
}

function changeRole(userId, newRole) {
    fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
    })
    .then(r => r.json())
    .then(() => {
        alert(currentLang === 'uz' ? 'Maqom o\'zgartirildi!' : 'Должность изменена!');
        loadUsers();
    });
}

function deleteUser(userId) {
    if (confirm(currentLang === 'uz' ? 'Ishchini o\'chirishni tasdiqlaysizmi?' : 'Подтвердить удаление сотрудника?')) {
        fetch(`/api/users/${userId}`, { method: 'DELETE' })
            .then(r => r.json())
            .then(() => {
                alert(currentLang === 'uz' ? 'Ishchi o\'chirildi!' : 'Сотрудник удален!');
                loadUsers();
            });
    }
}

updateTexts();
loadUserInfo();
loadUsers();
