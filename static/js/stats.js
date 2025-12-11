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

loadStats();
