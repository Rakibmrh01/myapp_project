// Daily Account - Enhanced Backup & Export System
// HopWeb Compatible + PDF Export

// ===== HELPER FUNCTIONS =====
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}${minutes}`;
}

// ===== EXPORT BACKUP (JSON) - HopWeb Optimized =====
function exportBackup() {
    try {
        const data = {
            app: 'Daily Account',
            version: '1.0.0',
            exportDate: getCurrentDate(),
            exportTime: getCurrentTime(),
            incomes: DB.get('incomes') || [],
            expenses: DB.get('expenses') || [],
            ledgers: DB.get('ledgers') || [],
            savings: DB.get('savings') || [],
            notes: DB.get('notes') || [],
            goals: DB.get('goals') || [],
            budgets: DB.get('budgets') || [],
            settings: DB.get('settings') || {},
            cssConfig: DB.get('cssConfig') || {}
        };
        
        const json = JSON.stringify(data, null, 2);
        const filename = `backup-${getCurrentDate()}.json`;
        
        // Method 1: HopWeb Android Bridge (Primary)
        if (window.Android && typeof window.Android.saveFile === 'function') {
            try {
                window.Android.saveFile(filename, json);
                showToast('✅ ব্যাকআপ সেভ হয়েছে (ডাউনলোড ফোল্ডারে)');
                return;
            } catch (androidError) {
                console.error('Android save failed:', androidError);
            }
        }
        
        // Method 2: Standard Download (Fallback)
        try {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            showToast('✅ ব্যাকআপ ডাউনলোড সফল!');
        } catch (downloadError) {
            console.error('Download failed:', downloadError);
            throw downloadError;
        }
        
    } catch (error) {
        console.error('Backup Error:', error);
        alert('❌ ব্যাকআপ তৈরিতে সমস্যা হয়েছে!');
    }
}

// ===== IMPORT BACKUP (RESTORE) =====
function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    event.target.value = '';
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.app || data.app !== 'Daily Account') {
                alert('❌ ভুল ব্যাকআপ ফাইল! শুধুমাত্র Daily Account ব্যাকআপ ফাইল গ্রহণযোগ্য।');
                return;
            }
            
            if (!confirm('⚠️ সব পুরনো ডাটা মুছে নতুন ডাটা রিস্টোর হবে। নিশ্চিত?')) {
                return;
            }
            
            // Restore all data
            DB.set('incomes', data.incomes || []);
            DB.set('expenses', data.expenses || []);
            DB.set('ledgers', data.ledgers || []);
            DB.set('savings', data.savings || []);
            DB.set('notes', data.notes || []);
            DB.set('goals', data.goals || []);
            DB.set('budgets', data.budgets || []);
            DB.set('settings', data.settings || {});
            DB.set('cssConfig', data.cssConfig || {});
            
            showToast('✅ ব্যাকআপ রিস্টোর সফল!');
            
            setTimeout(() => {
                location.href = '../index.html';
            }, 1500);
            
        } catch (error) {
            console.error('Import Error:', error);
            alert('❌ ভুল ফাইল! সঠিক JSON ব্যাকআপ ফাইল নির্বাচন করুন।');
        }
    };
    
    reader.onerror = function() {
        alert('❌ ফাইল পড়তে সমস্যা হয়েছে!');
    };
    
    reader.readAsText(file);
}

// ===== EXPORT CSV - HopWeb Optimized =====
function exportCSV() {
    try {
        const incomes = DB.get('incomes') || [];
        const expenses = DB.get('expenses') || [];
        
        // CSV Header with BOM for Excel compatibility
        let csv = '\uFEFF';
        csv += 'ধরন,উৎস/ক্যাটাগরি,পরিমাণ,তারিখ,সময়,নোট\n';
        
        // Add income data
        incomes.forEach(item => {
            const note = (item.note || '').replace(/"/g, '""');
            csv += `আয়,"${item.source || 'N/A'}",${item.amount || 0},"${item.date || ''}","${item.time || ''}","${note}"\n`;
        });
        
        // Add expense data
        expenses.forEach(item => {
            const note = (item.note || '').replace(/"/g, '""');
            csv += `ব্যয়,"${item.category || 'N/A'}",${item.amount || 0},"${item.date || ''}","${item.time || ''}","${note}"\n`;
        });
        
        const filename = `report-${getCurrentDate()}.csv`;
        
        // Method 1: HopWeb Android Bridge
        if (window.Android && typeof window.Android.saveFile === 'function') {
            try {
                window.Android.saveFile(filename, csv);
                showToast('✅ CSV সেভ হয়েছে (ডাউনলোড ফোল্ডারে)');
                return;
            } catch (androidError) {
                console.error('Android save failed:', androidError);
            }
        }
        
        // Method 2: Standard Download
        try {
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            showToast('✅ CSV ডাউনলোড সফল!');
        } catch (downloadError) {
            console.error('Download failed:', downloadError);
            throw downloadError;
        }
        
    } catch (error) {
        console.error('CSV Export Error:', error);
        alert('❌ CSV এক্সপোর্টে সমস্যা হয়েছে!');
    }
}

// ===== EXPORT PDF - NEW FEATURE =====
function exportPDF() {
    try {
        const incomes = DB.get('incomes') || [];
        const expenses = DB.get('expenses') || [];
        const ledgers = DB.get('ledgers') || [];
        const savings = DB.get('savings') || [];
        
        // Calculate totals
        const totalIncome = incomes.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        const totalExpense = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        const totalSavings = savings.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        const balance = totalIncome - totalExpense;
        
        // Create HTML for PDF
        let html = `
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Account রিপোর্ট</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', 'Kalpurush', sans-serif;
            padding: 30px;
            background: white;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #667eea;
            font-size: 32px;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
            font-size: 14px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .summary-card {
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .summary-card.income {
            background: linear-gradient(135deg, #d1fae5, #a7f3d0);
            border-left: 5px solid #10b981;
        }
        .summary-card.expense {
            background: linear-gradient(135deg, #fee2e2, #fecaca);
            border-left: 5px solid #ef4444;
        }
        .summary-card.balance {
            background: linear-gradient(135deg, #dbeafe, #bfdbfe);
            border-left: 5px solid #3b82f6;
        }
        .summary-card.savings {
            background: linear-gradient(135deg, #e9d5ff, #d8b4fe);
            border-left: 5px solid #a855f7;
        }
        .summary-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
            font-weight: 600;
        }
        .summary-value {
            font-size: 24px;
            font-weight: 900;
            color: #333;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 20px;
            font-weight: 800;
            margin-bottom: 15px;
            padding: 10px 15px;
            border-radius: 8px;
            color: white;
        }
        .section-title.income-title {
            background: linear-gradient(135deg, #10b981, #059669);
        }
        .section-title.expense-title {
            background: linear-gradient(135deg, #ef4444, #dc2626);
        }
        .section-title.ledger-title {
            background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        .section-title.savings-title {
            background: linear-gradient(135deg, #a855f7, #9333ea);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        table thead {
            background: #f3f4f6;
        }
        table th {
            padding: 12px;
            text-align: left;
            font-weight: 800;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
        }
        table td {
            padding: 10px 12px;
            border-bottom: 1px solid #f3f4f6;
            font-weight: 600;
        }
        table tbody tr:nth-child(even) {
            background: #f9fafb;
        }
        table tbody tr:hover {
            background: #f3f4f6;
        }
        .amount {
            font-weight: 900;
            font-family: 'Arial Black', Arial, sans-serif;
        }
        .amount.income { color: #10b981; }
        .amount.expense { color: #ef4444; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>💰 Daily Account</h1>
        <p>আর্থিক রিপোর্ট | ${getCurrentDate()}</p>
    </div>

    <div class="summary">
        <div class="summary-card income">
            <div class="summary-label">💚 মোট আয়</div>
            <div class="summary-value">৳ ${totalIncome.toFixed(2)}</div>
        </div>
        <div class="summary-card expense">
            <div class="summary-label">💔 মোট ব্যয়</div>
            <div class="summary-value">৳ ${totalExpense.toFixed(2)}</div>
        </div>
        <div class="summary-card balance">
            <div class="summary-label">💙 ব্যালেন্স</div>
            <div class="summary-value">৳ ${balance.toFixed(2)}</div>
        </div>
        <div class="summary-card savings">
            <div class="summary-label">💜 সঞ্চয়</div>
            <div class="summary-value">৳ ${totalSavings.toFixed(2)}</div>
        </div>
    </div>
`;

        // Add Income Section
        if (incomes.length > 0) {
            html += `
    <div class="section">
        <div class="section-title income-title">💰 আয়ের তালিকা (${incomes.length} টি)</div>
        <table>
            <thead>
                <tr>
                    <th>উৎস</th>
                    <th>পরিমাণ</th>
                    <th>তারিখ</th>
                    <th>নোট</th>
                </tr>
            </thead>
            <tbody>
`;
            incomes.forEach(item => {
                html += `
                <tr>
                    <td>${item.source || 'N/A'}</td>
                    <td class="amount income">৳ ${parseFloat(item.amount || 0).toFixed(2)}</td>
                    <td>${item.date || 'N/A'}</td>
                    <td>${item.note || '-'}</td>
                </tr>
`;
            });
            html += `
            </tbody>
        </table>
    </div>
`;
        }

        // Add Expense Section
        if (expenses.length > 0) {
            html += `
    <div class="section">
        <div class="section-title expense-title">💸 ব্যয়ের তালিকা (${expenses.length} টি)</div>
        <table>
            <thead>
                <tr>
                    <th>ক্যাটাগরি</th>
                    <th>পরিমাণ</th>
                    <th>তারিখ</th>
                    <th>নোট</th>
                </tr>
            </thead>
            <tbody>
`;
            expenses.forEach(item => {
                html += `
                <tr>
                    <td>${item.category || 'N/A'}</td>
                    <td class="amount expense">৳ ${parseFloat(item.amount || 0).toFixed(2)}</td>
                    <td>${item.date || 'N/A'}</td>
                    <td>${item.note || '-'}</td>
                </tr>
`;
            });
            html += `
            </tbody>
        </table>
    </div>
`;
        }

        // Add Savings Section
        if (savings.length > 0) {
            html += `
    <div class="section">
        <div class="section-title savings-title">🏦 সঞ্চয়ের তালিকা (${savings.length} টি)</div>
        <table>
            <thead>
                <tr>
                    <th>ক্যাটাগরি</th>
                    <th>পরিমাণ</th>
                    <th>লক্ষ্য</th>
                    <th>তারিখ</th>
                </tr>
            </thead>
            <tbody>
`;
            savings.forEach(item => {
                html += `
                <tr>
                    <td>${item.category || 'N/A'}</td>
                    <td class="amount">৳ ${parseFloat(item.amount || 0).toFixed(2)}</td>
                    <td>${item.goal ? '৳ ' + parseFloat(item.goal).toFixed(2) : '-'}</td>
                    <td>${item.date || 'N/A'}</td>
                </tr>
`;
            });
            html += `
            </tbody>
        </table>
    </div>
`;
        }

        html += `
    <div class="footer">
        <p>তৈরি করেছেন: Daily Account App | সংস্করণ: 1.0.0</p>
        <p>Developer: @jakiraljihad</p>
    </div>
</body>
</html>
`;

        const filename = `report-${getCurrentDate()}.html`;
        
        // Method 1: HopWeb Android Bridge
        if (window.Android && typeof window.Android.saveFile === 'function') {
            try {
                window.Android.saveFile(filename, html);
                showToast('✅ PDF রিপোর্ট সেভ হয়েছে (HTML ফরম্যাটে)');
                return;
            } catch (androidError) {
                console.error('Android save failed:', androidError);
            }
        }
        
        // Method 2: Standard Download
        try {
            const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            showToast('✅ রিপোর্ট ডাউনলোড সফল! (HTML ফাইল ব্রাউজারে খুলে PDF সেভ করুন)');
        } catch (downloadError) {
            console.error('Download failed:', downloadError);
            throw downloadError;
        }
        
    } catch (error) {
        console.error('PDF Export Error:', error);
        alert('❌ রিপোর্ট তৈরিতে সমস্যা হয়েছে!');
    }
}

// ===== RESET ALL DATA =====
function resetAllData() {
    if (confirm('⚠️ সব ডাটা মুছে ফেলা হবে। এই কাজ ফিরিয়ে আনা যাবে না। নিশ্চিত?')) {
        if (confirm('❗ সত্যিই মুছবেন? শেষ সতর্কতা!')) {
            try {
                DB.clearAll();
                showToast('✅ সব ডাটা মুছে ফেলা হয়েছে');
                setTimeout(() => {
                    location.href = '../index.html';
                }, 1500);
            } catch (error) {
                console.error('Reset Error:', error);
                alert('❌ ডাটা মুছতে সমস্যা হয়েছে!');
            }
        }
    }
}

// ===== SETTINGS FUNCTIONS =====
function loadSettings() {
    const settings = DB.get('settings') || {};
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    const languageSelect = document.getElementById('languageSelect');
    const budgetWarning = document.getElementById('budgetWarning');
    
    if (darkModeToggle) darkModeToggle.checked = settings.darkMode || false;
    if (languageSelect) languageSelect.value = settings.language || 'bn';
    if (budgetWarning) budgetWarning.checked = settings.budgetWarning !== false;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            toggleDarkMode();
        });
    }
    
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            const settings = DB.get('settings') || {};
            settings.language = this.value;
            DB.set('settings', settings);
            showToast('✅ ভাষা পরিবর্তন হয়েছে');
        });
    }
    
    const budgetWarning = document.getElementById('budgetWarning');
    if (budgetWarning) {
        budgetWarning.addEventListener('change', function() {
            const settings = DB.get('settings') || {};
            settings.budgetWarning = this.checked;
            DB.set('settings', settings);
            showToast(this.checked ? '✅ সতর্কতা চালু' : '❌ সতর্কতা বন্ধ');
        });
    }
    
    console.log('✅ Backup system initialized');
});

// ===== SOCIAL LINKS =====
function openSocial(platform) {
    const links = {
        youtube: 'https://youtube.com/@jakiraljihad',
        facebook: 'https://facebook.com/jakiraljihad',
        instagram: 'https://instagram.com/jakiraljihad',
        tiktok: 'https://tiktok.com/@jakiraljihad',
        telegram: 'https://t.me/jakiraljihad01'
    };
    
    const url = links[platform];
    if (url) {
        window.open(url, '_blank');
    }
}