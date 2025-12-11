// Qidiruv va filter funksiyalari
class SearchFilter {
    constructor(tableId, searchInputId) {
        this.table = document.getElementById(tableId);
        this.searchInput = document.getElementById(searchInputId);
        this.originalRows = [];
        this.currentPage = 1;
        this.rowsPerPage = 10;
        
        this.init();
    }
    
    init() {
        if (this.table && this.searchInput) {
            this.originalRows = Array.from(this.table.querySelectorAll('tbody tr'));
            this.setupSearch();
            this.setupPagination();
        }
    }
    
    setupSearch() {
        this.searchInput.addEventListener('input', (e) => {
            this.filterRows(e.target.value);
            this.currentPage = 1;
            this.updatePagination();
        });
    }
    
    filterRows(searchTerm) {
        const filteredRows = this.originalRows.filter(row => {
            const cells = row.querySelectorAll('td');
            const searchLower = searchTerm.toLowerCase();
            
            for (let cell of cells) {
                if (cell.textContent.toLowerCase().includes(searchLower)) {
                    return true;
                }
            }
            return false;
        });
        
        this.displayRows(filteredRows);
        return filteredRows;
    }
    
    displayRows(rows) {
        // Barcha qatorlarni yashirish
        this.originalRows.forEach(row => row.style.display = 'none');
        
        // Faqat kerakli qatorlarni ko'rsatish
        const startIndex = (this.currentPage - 1) * this.rowsPerPage;
        const endIndex = startIndex + this.rowsPerPage;
        const pageRows = rows.slice(startIndex, endIndex);
        
        pageRows.forEach(row => row.style.display = '');
        
        return pageRows;
    }
    
    setupPagination() {
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination';
        paginationContainer.id = 'pagination';
        
        this.table.parentNode.appendChild(paginationContainer);
        this.updatePagination();
    }
    
    updatePagination() {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;
        
        const searchTerm = this.searchInput.value;
        const filteredRows = this.filterRows(searchTerm);
        const totalPages = Math.ceil(filteredRows.length / this.rowsPerPage);
        
        paginationContainer.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Oldingi tugma
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '‹';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.onclick = () => this.goToPage(this.currentPage - 1);
        paginationContainer.appendChild(prevBtn);
        
        // Sahifa raqamlari
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === this.currentPage ? 'active' : '';
            pageBtn.onclick = () => this.goToPage(i);
            paginationContainer.appendChild(pageBtn);
        }
        
        // Keyingi tugma
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '›';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.onclick = () => this.goToPage(this.currentPage + 1);
        paginationContainer.appendChild(nextBtn);
        
        // Sahifa ma'lumoti
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `${this.currentPage} / ${totalPages}`;
        pageInfo.style.marginLeft = '15px';
        pageInfo.style.color = '#7f8c8d';
        paginationContainer.appendChild(pageInfo);
    }
    
    goToPage(page) {
        this.currentPage = page;
        const searchTerm = this.searchInput.value;
        const filteredRows = this.filterRows(searchTerm);
        this.displayRows(filteredRows);
        this.updatePagination();
    }
    
    exportToExcel(filename = 'tovarlar.xlsx') {
        const wb = XLSX.utils.book_new();
        const wsData = [];
        
        // Header
        const headers = Array.from(this.table.querySelectorAll('thead th')).map(th => th.textContent.trim());
        wsData.push(headers);
        
        // Data rows
        const visibleRows = this.originalRows.filter(row => row.style.display !== 'none');
        visibleRows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            const rowData = cells.map(cell => {
                const text = cell.textContent.trim();
                // Remove 'so\'m' and convert to number if possible
                const num = text.replace(/[^0-9.-]/g, '');
                return isNaN(num) || num === '' ? text : parseFloat(num);
            });
            wsData.push(rowData);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Tovarlar');
        XLSX.writeFile(wb, filename);
        
        Utils.showToast('Excel fayl yuklab olindi!', 'success');
    }
}

// Sahifa yuklanganda qidiruv funksiyasini ishga tushirish
document.addEventListener('DOMContentLoaded', function() {
    // Qidiruv inputini qo'shish
    const tables = document.querySelectorAll('table');
    tables.forEach((table, index) => {
        if (table.querySelector('tbody')) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'search-container';
            
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.className = 'search-input';
            searchInput.placeholder = 'Qidirish...';
            searchInput.id = `search-${index}`;
            
            const exportBtn = document.createElement('button');
            exportBtn.textContent = 'Excel ga export';
            exportBtn.className = 'confirm-btn';
            exportBtn.style.marginLeft = '10px';
            
            searchContainer.appendChild(searchInput);
            searchContainer.appendChild(exportBtn);
            
            table.parentNode.insertBefore(searchContainer, table);
            
            const searchFilter = new SearchFilter(table.id || `table-${index}`, searchInput.id);
            if (!table.id) table.id = `table-${index}`;
            
            exportBtn.onclick = () => {
                if (typeof XLSX === 'undefined') {
                    Utils.showToast('Excel kutubxonasi yuklanmagan!', 'error');
                    return;
                }
                searchFilter.exportToExcel('tovarlar.xlsx');
            };
        }
    });
});