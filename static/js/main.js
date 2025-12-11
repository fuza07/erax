function loadUserInfo() {
    fetch('/api/user/info')
        .then(r => r.json())
        .then(data => {
            document.getElementById('warehouse-name').textContent = data.warehouse_name;
        })
        .catch(() => {});
}

function quickRemove(id, name, boxes, items, itemsPerBox) {
    const lang = window.currentLang || 'uz';
    const texts = {
        uz: {
            available: 'mavjud',
            boxes: 'quti',
            items: 'dona',
            howManyBoxes: 'Necha quti chiqarasiz?',
            sellPrice: 'Sotish narxi (dona):'
        },
        ru: {
            available: 'доступно',
            boxes: 'коробок',
            items: 'штук',
            howManyBoxes: 'Сколько коробок убрать?',
            sellPrice: 'Цена продажи (шт):'
        }
    };
    const t = texts[lang];
    
    const boxAmount = prompt(`${name} - ${boxes} ${t.boxes}, ${items} ${t.items} ${t.available}.\n${t.howManyBoxes}`);
    if (!boxAmount || boxAmount <= 0) return;
    
    const totalItems = parseInt(boxAmount) * itemsPerBox;
    
    const price = prompt(t.sellPrice);
    if (!price || price <= 0) return;
    
    fetch('/api/products/remove', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({product_id: id, quantity: totalItems, sell_price: parseFloat(price)})
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            Utils.showToast(lang === 'uz' ? 'Tovar chiqarildi!' : 'Товар убран!', 'success');
            loadProducts();
        } else {
            Utils.showToast(data.error, 'error');
        }
    });
}

function quickAdd(id, name) {
    const amount = prompt(`${name}\nNecha dona qo'shasiz?`);
    if (!amount || amount <= 0) return;
    
    const price = prompt('Sotib olish narxi (dona):');
    if (!price || price < 0) return;
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('box_quantity', 1);
    formData.append('items_per_box', amount);
    formData.append('buy_price', price);
    
    fetch('/api/products', {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            Utils.showToast('Tovar qo\'shildi!', 'success');
            loadProducts();
        } else {
            Utils.showToast('Xatolik!', 'error');
        }
    });
}

function loadProducts() {
    fetch('/api/products')
        .then(r => r.json())
        .then(products => {
            const tbody = document.getElementById('products-body');
            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Tovarlar yo\'q</td></tr>';
            } else {
                tbody.innerHTML = products.map(p => {
                    const imageHtml = p.image 
                        ? `<img src="${p.image}" class="product-image" alt="${p.name}">`
                        : `<div class="product-image-placeholder">${p.name.charAt(0).toUpperCase()}</div>`;
                    
                    const nameHtml = `<div><strong>${p.name}</strong>${p.model ? '<br><small style="color:#7f8c8d">' + p.model + '</small>' : ''}</div>`;
                    
                    const boxes = Math.floor(p.quantity / p.items_per_box);
                    const remainingItems = p.quantity % p.items_per_box;
                    
                    return `
                    <tr>
                        <td style="text-align:center">${imageHtml}</td>
                        <td>${nameHtml}</td>
                        <td>${boxes}</td>
                        <td>${remainingItems}</td>
                        <td>${Utils.formatNumber(p.price)} so'm</td>
                        <td>${Utils.formatNumber(p.quantity * p.price)} so'm</td>
                        <td>
                            <button onclick="quickAdd(${p.id}, '${p.name.replace(/'/g, "\\'")}')">+</button>
                            <button onclick="quickRemove(${p.id}, '${p.name.replace(/'/g, "\\'")}, ${boxes}, ${remainingItems}, ${p.items_per_box})" class="remove-btn">-</button>
                        </td>
                    </tr>
                `;
                }).join('');
            }
        });
}

loadProducts();
