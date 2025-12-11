// Load dark mode
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// Cache theme and background
const cachedTheme = localStorage.getItem('cachedTheme');
const cachedBg = localStorage.getItem('cachedBg');

if (cachedTheme) {
    let classes = 'theme-' + cachedTheme;
    if (localStorage.getItem('darkMode') === 'true') classes += ' dark-mode';
    document.body.className = classes;
    if (cachedBg && cachedBg !== 'null') {
        document.body.style.backgroundImage = `url(${cachedBg})`;
        document.body.style.backgroundColor = 'transparent';
    }
}

Promise.all([
    fetch('/api/theme').then(r => r.json()),
    fetch('/api/background').then(r => r.json())
]).then(([theme, bg]) => {
    localStorage.setItem('cachedTheme', theme.theme);
    localStorage.setItem('cachedBg', bg.background || 'null');
    
    let classes = 'theme-' + theme.theme;
    if (localStorage.getItem('darkMode') === 'true') classes += ' dark-mode';
    document.body.className = classes;
    if (bg.background) {
        document.body.style.backgroundImage = `url(${bg.background})`;
        document.body.style.backgroundColor = 'transparent';
    }
    
    if (theme.theme === 'newyear') {
        setInterval(() => {
            const s = document.createElement('div');
            s.className = 'snowflake';
            s.textContent = '❄️';
            s.style.left = Math.random() * 100 + '%';
            s.style.animationDuration = (Math.random() * 3 + 2) + 's';
            document.body.appendChild(s);
            setTimeout(() => s.remove(), 5000);
        }, 200);
        const sb = document.querySelector('.sidebar');
        if (sb) setInterval(() => {
            const s = document.createElement('div');
            s.className = 'snowflake-sidebar';
            s.textContent = '❄️';
            s.style.left = Math.random() * 100 + '%';
            s.style.animationDuration = (Math.random() * 2 + 2) + 's';
            sb.appendChild(s);
            setTimeout(() => s.remove(), 4000);
        }, 300);
    }
}).catch(() => {});
