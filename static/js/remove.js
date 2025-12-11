let currentProductId = null;
let currentItemsPerBox = 1;

function loadProducts() {
    fetch('/api/products')
        .then(r => r.json())
        .then(products => {
            const tbody = document.getElementById('products-body');
            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Tovarlar yo\'q</td></tr>';
            } else {
                tbody.innerHTML = products.map(p => {
                    const boxes = Math.floor(p.quantity / p.items_per_box);
                    const remainingItems = p.quantity % p.items_per_box;
                    return `
                    <tr>
                        <td>${p.name}${p.model ? ' (' + p.model + ')' : ''}</td>
                        <td>${boxes}</td>
                        <td>${remainingItems}</td>
                        <td>${p.price} so'm</td>
                        <td><button class="remove-btn" onclick="openModal(${p.id}, '${p.name.replace(/'/g, "\\'")}, ${boxes}, ${remainingItems}, ${p.items_per_box})">Chiqarish</button></td>
                    </tr>
                `;
                }).join('');
            }
        });
}

function openModal(id, name, boxes, items, itemsPerBox) {
    currentProductId = id;
    currentItemsPerBox = itemsPerBox;
    const lang = window.currentLang || 'uz';
    const boxText = lang === 'uz' ? 'quti' : 'коробок';
    const itemText = lang === 'uz' ? 'dona' : 'штук';
    
    document.getElementById('modal-product-name').textContent = name;
    document.getElementById('modal-product-qty').textContent = `${boxes} ${boxText}, ${items} ${itemText}`;
    document.getElementById('remove-boxes').value = '';
    document.getElementById('remove-boxes').max = boxes;
    document.getElementById('remove-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('remove-modal').style.display = 'none';
    currentProductId = null;
}

function confirmRemove() {
    const boxes = parseInt(document.getElementById('remove-boxes').value) || 0;
    const sellPrice = parseFloat(document.getElementById('remove-sell-price').value);
    const lang = window.currentLang || 'uz';
    
    if (boxes <= 0) {
        Utils.showToast(lang === 'uz' ? 'Quti sonini kiriting!' : 'Введите количество коробок!', 'error');
        return;
    }
    
    if (!sellPrice || sellPrice <= 0) {
        Utils.showToast(lang === 'uz' ? 'Sotish narxini kiriting!' : 'Введите цену продажи!', 'error');
        return;
    }
    
    const totalItems = boxes * currentItemsPerBox;
    
    fetch('/api/products/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            product_id: currentProductId, 
            quantity: totalItems,
            sell_price: sellPrice
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            Utils.showToast(lang === 'uz' ? 'Tovar sotildi!' : 'Товар продан!', 'success');
            closeModal();
            loadProducts();
        } else {
            Utils.showToast(data.error, 'error');
        }
    });
}

loadProducts();
