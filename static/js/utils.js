// Umumiy funksiyalar
class Utils {
    // Toast xabarlarini ko'rsatish
    static showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, duration);
    }
    
    // Loading animatsiyasini ko'rsatish
    static showLoading(element) {
        const loading = document.createElement('span');
        loading.className = 'loading';
        element.appendChild(loading);
        element.disabled = true;
    }
    
    // Loading animatsiyasini yashirish
    static hideLoading(element) {
        const loading = element.querySelector('.loading');
        if (loading) {
            element.removeChild(loading);
        }
        element.disabled = false;
    }
    
    // Raqamlarni formatlash
    static formatNumber(num) {
        return new Intl.NumberFormat('uz-UZ').format(num);
    }
    
    // Sanani formatlash
    static formatDate(date) {
        return new Intl.DateTimeFormat('uz-UZ').format(new Date(date));
    }
    
    // Local storage bilan ishlash
    static setStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
    
    static getStorage(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }
    
    // Til o'zgartirish
    static setLang(lang) {
        localStorage.setItem('lang', lang);
        location.reload();
    }
    
    static getLang() {
        return localStorage.getItem('lang') || 'uz';
    }
    
    // Dark mode
    static toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
    }
    
    static initDarkMode() {
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }
    }
    
    // Qidiruv funksiyasi
    static filterTable(searchTerm, tableId) {
        const table = document.getElementById(tableId);
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(searchTerm.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    }
    
    // Clipboard ga nusxalash
    static copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Nusxalandi!', 'success', 1500);
        }).catch(() => {
            this.showToast('Nusxalashda xatolik!', 'error');
        });
    }
    
    // Form validatsiyasi
    static validateForm(formId) {
        const form = document.getElementById(formId);
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = '#e74c3c';
                isValid = false;
            } else {
                input.style.borderColor = '#ddd';
            }
        });
        
        return isValid;
    }
}

// Sahifa yuklanganda
window.addEventListener('load', function() {
    // Theme toggle tugmasini qo'shish
    if (!document.querySelector('.theme-toggle')) {
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = localStorage.getItem('darkMode') === 'true' ? '☀️' : '🌙';
        themeToggle.title = 'Tungi rejim';
        themeToggle.onclick = () => {
            Utils.toggleDarkMode();
            themeToggle.innerHTML = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
        };
        document.body.appendChild(themeToggle);
    }
});

// Export qilish
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}