// Load existing products for autocomplete
fetch('/api/products')
    .then(r => r.json())
    .then(products => {
        const names = [...new Set(products.map(p => p.name))];
        const models = [...new Set(products.map(p => p.model).filter(m => m))];
        
        document.getElementById('product-names').innerHTML = names.map(n => `<option value="${n}">`).join('');
        document.getElementById('product-models').innerHTML = models.map(m => `<option value="${m}">`).join('');
    });

fetch('/api/settings-public')
    .then(r => r.json())
    .then(settings => {
        if (settings.enable_images) {
            const img = document.getElementById('image-group');
            if (img) img.style.display = 'block';
        }
    })
    .catch(() => {});

document.getElementById('add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('product-name').value);
    formData.append('model', document.getElementById('product-model').value || '');
    formData.append('box_quantity', parseInt(document.getElementById('product-quantity').value));
    formData.append('items_per_box', parseInt(document.getElementById('items-per-box').value));
    formData.append('buy_price', parseFloat(document.getElementById('product-buy-price').value));
    
    const imageFile = document.getElementById('product-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    fetch('/api/products', {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(() => {
        Utils.showToast('Tovar qo\'shildi!', 'success');
        e.target.reset();
    });
});
