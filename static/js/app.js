let currentLang = 'uz';

const translations = {
    uz: {
        'Tovar nomi / Название товара': 'Tovar nomi',
        'Miqdori / Количество': 'Miqdori',
        'Narxi / Цена': 'Narxi'
    },
    ru: {
        'Tovar nomi / Название товара': 'Название товара',
        'Miqdori / Количество': 'Количество',
        'Narxi / Цена': 'Цена'
    }
};

function setLang(lang) {
    currentLang = lang;
    fetch(`/set_lang/${lang}`);
    document.querySelectorAll('[data-uz]').forEach(el => {
        el.textContent = el.getAttribute(`data-${lang}`);
    });
    updatePlaceholders();
}

function updatePlaceholders() {
    document.getElementById('product-name').placeholder = translations[currentLang]['Tovar nomi / Название товара'];
    document.getElementById('product-quantity').placeholder = translations[currentLang]['Miqdori / Количество'];
    document.getElementById('product-price').placeholder = translations[currentLang]['Narxi / Цена'];
}

function loadProducts() {
    fetch('/api/products')
        .then(r => r.json())
        .then(products => {
            const tbody = document.getElementById('products-body');
            tbody.innerHTML = products.map(p => `
                <tr>
                    <td>${p.name}</td>
                    <td>${p.quantity}</td>
                    <td>${p.price} so'm</td>
                    <td>${(p.quantity * p.price).toFixed(2)} so'm</td>
                    <td>${p.date}</td>
                    <td><button class="delete-btn" onclick="deleteProduct(${p.id})">${currentLang === 'uz' ? "O'chirish" : 'Удалить'}</button></td>
                </tr>
            `).join('');
        });
}

function loadStats() {
    fetch('/api/stats')
        .then(r => r.json())
        .then(stats => {
            document.getElementById('total-quantity').textContent = stats.total_quantity;
            document.getElementById('total-value').textContent = stats.total_value + ' so\'m';
            document.getElementById('monthly-in').textContent = stats.monthly_in + ' so\'m';
            document.getElementById('monthly-out').textContent = stats.monthly_out + ' so\'m';
        });
}

function deleteProduct(id) {
    if (confirm(currentLang === 'uz' ? "O'chirishni tasdiqlaysizmi?" : 'Подтвердить удаление?')) {
        fetch(`/api/products/${id}`, { method: 'DELETE' })
            .then(() => {
                loadProducts();
                loadStats();
            });
    }
}

document.getElementById('product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('product-name').value,
        quantity: parseInt(document.getElementById('product-quantity').value),
        price: parseFloat(document.getElementById('product-price').value)
    };
    fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(() => {
        loadProducts();
        loadStats();
        e.target.reset();
    });
});

loadProducts();
loadStats();
setInterval(() => { loadStats(); }, 30000);
