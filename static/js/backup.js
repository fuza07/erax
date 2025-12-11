// Backup va export funksiyalari
class BackupManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.createBackupButton();
    }
    
    createBackupButton() {
        // Faqat manage sahifasida ko'rsatish
        if (window.location.pathname === '/manage') {
            const backupSection = document.createElement('div');
            backupSection.className = 'manage-section';
            backupSection.innerHTML = `
                <h2>Ma'lumotlar boshqaruvi</h2>
                <div style="display: flex; gap: 15px; margin-top: 20px;">
                    <button id="backup-btn" class="confirm-btn">Backup yaratish</button>
                    <button id="export-btn" class="confirm-btn">Excel ga export</button>
                    <input type="file" id="import-file" accept=".json,.csv" style="display: none;">
                    <button id="import-btn" class="confirm-btn">Import qilish</button>
                </div>
                <div class="warning">
                    <strong>Diqqat:</strong> Backup faylini xavfsiz joyda saqlang. Import qilishdan oldin mavjud ma'lumotlar zaxiralanadi.
                </div>
            `;
            
            const mainContent = document.querySelector('.main-content');
            mainContent.appendChild(backupSection);
            
            this.setupEventListeners();
        }
    }
    
    setupEventListeners() {
        document.getElementById('backup-btn').onclick = () => this.createBackup();
        document.getElementById('export-btn').onclick = () => this.exportToExcel();
        document.getElementById('import-btn').onclick = () => document.getElementById('import-file').click();
        document.getElementById('import-file').onchange = (e) => this.importData(e);
    }
    
    async createBackup() {
        try {
            Utils.showLoading(document.getElementById('backup-btn'));
            
            const response = await fetch('/api/backup', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const backup = {
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    data: data
                };
                
                const blob = new Blob([JSON.stringify(backup, null, 2)], { 
                    type: 'application/json' 
                });
                
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `erax_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
                
                Utils.showToast('Backup muvaffaqiyatli yaratildi!', 'success');
            } else {
                throw new Error('Backup yaratishda xatolik');
            }
        } catch (error) {
            Utils.showToast('Backup yaratishda xatolik: ' + error.message, 'error');
        } finally {
            Utils.hideLoading(document.getElementById('backup-btn'));
        }
    }
    
    async exportToExcel() {
        try {
            Utils.showLoading(document.getElementById('export-btn'));
            
            const response = await fetch('/api/export', {
                method: 'GET'
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `erax_export_${new Date().toISOString().split('T')[0]}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
                
                Utils.showToast('Excel fayl yuklab olindi!', 'success');
            } else {
                throw new Error('Export qilishda xatolik');
            }
        } catch (error) {
            Utils.showToast('Export qilishda xatolik: ' + error.message, 'error');
        } finally {
            Utils.hideLoading(document.getElementById('export-btn'));
        }
    }
    
    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            let data;
            
            if (file.name.endsWith('.json')) {
                data = JSON.parse(text);
            } else if (file.name.endsWith('.csv')) {
                data = this.parseCSV(text);
            } else {
                throw new Error('Noto\\'g\\'ri fayl formati');
            }
            
            const response = await fetch('/api/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                Utils.showToast('Ma\\'lumotlar muvaffaqiyatli import qilindi!', 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                throw new Error('Import qilishda xatolik');
            }
        } catch (error) {
            Utils.showToast('Import qilishda xatolik: ' + error.message, 'error');
        }
    }
    
    parseCSV(text) {
        const lines = text.split('\\n');
        const headers = lines[0].split(',');
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',');
                const row = {};
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index]?.trim() || '';
                });
                data.push(row);
            }
        }
        
        return data;
    }
}

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', function() {
    new BackupManager();
});