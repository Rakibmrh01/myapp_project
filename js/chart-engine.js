// Daily Account - Chart Engine with Chart.js

const ChartEngine = {
    charts: {},
    
    // Initialize all charts
    init() {
        this.createPieChart();
        this.createBarChart();
        this.createDoughnutChart();
        this.createLineChart();
        this.createSavingsChart();
    },
    
    // Chart 1: Pie Chart - Income vs Expense
    createPieChart() {
        const income = DB.sum('income', 'amount');
        const expense = DB.sum('expense', 'amount');
        
        const ctx = document.getElementById('pieChart');
        if (!ctx) return;
        
        if (this.charts.pie) this.charts.pie.destroy();
        
        this.charts.pie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['আয়', 'ব্যয়'],
                datasets: [{
                    data: [income, expense],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 14, weight: 'bold' },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.label}: ৳ ${context.parsed}`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    // Chart 2: Bar Chart - Monthly Comparison
    createBarChart() {
        const incomes = DB.get('income') || [];
        const expenses = DB.get('expense') || [];
        
        // Group by month
        const months = {};
        
        incomes.forEach(item => {
            if (!item.date) return;
            const month = item.date.substring(0, 7);
            if (!months[month]) months[month] = { income: 0, expense: 0 };
            months[month].income += (Number(item.amount) || 0);
        });
        
        expenses.forEach(item => {
            if (!item.date) return;
            const month = item.date.substring(0, 7);
            if (!months[month]) months[month] = { income: 0, expense: 0 };
            months[month].expense += (Number(item.amount) || 0);
        });
        
        const labels = Object.keys(months).sort().slice(-6);
        const incomeData = labels.map(m => months[m].income);
        const expenseData = labels.map(m => months[m].expense);
        
        const ctx = document.getElementById('barChart');
        if (!ctx) return;
        
        if (this.charts.bar) this.charts.bar.destroy();
        
        this.charts.bar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(l => this.formatMonth(l)),
                datasets: [
                    {
                        label: 'আয়',
                        data: incomeData,
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'ব্যয়',
                        data: expenseData,
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 14, weight: 'bold' },
                            padding: 15
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => '৳ ' + value
                        }
                    }
                }
            }
        });
    },
    
    // Chart 3: Doughnut - Category Breakdown
    createDoughnutChart() {
        const expenses = DB.get('expense') || [];
        
        const categories = {};
        expenses.forEach(exp => {
            var cat = exp.category || exp.source || 'অন্যান্য';
            categories[cat] = (categories[cat] || 0) + (Number(exp.amount) || 0);
        });
        
        const labels = Object.keys(categories);
        const data = Object.values(categories);
        const colors = this.generateColors(labels.length);
        
        const ctx = document.getElementById('doughnutChart');
        if (!ctx) return;
        
        if (this.charts.doughnut) this.charts.doughnut.destroy();
        
        this.charts.doughnut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 12, weight: 'bold' },
                            padding: 10
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = Math.round((context.parsed / total) * 100);
                                return `${context.label}: ৳ ${context.parsed} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    // Chart 4: Line Chart - Trend
    createLineChart() {
        const incomes = DB.get('income') || [];
        const expenses = DB.get('expense') || [];
        
        // Get last 30 days
        const days = {};
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            days[dateStr] = { income: 0, expense: 0 };
        }
        
        incomes.forEach(item => {
            if (days[item.date] !== undefined) {
                days[item.date].income += item.amount;
            }
        });
        
        expenses.forEach(item => {
            if (days[item.date] !== undefined) {
                days[item.date].expense += item.amount;
            }
        });
        
        const labels = Object.keys(days);
        const incomeData = labels.map(d => days[d].income);
        const expenseData = labels.map(d => days[d].expense);
        
        const ctx = document.getElementById('lineChart');
        if (!ctx) return;
        
        if (this.charts.line) this.charts.line.destroy();
        
        this.charts.line = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.map(l => this.formatDay(l)),
                datasets: [
                    {
                        label: 'আয়',
                        data: incomeData,
                        borderColor: 'rgba(34, 197, 94, 1)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 3
                    },
                    {
                        label: 'ব্যয়',
                        data: expenseData,
                        borderColor: 'rgba(239, 68, 68, 1)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 14, weight: 'bold' },
                            padding: 15
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => '৳ ' + value
                        }
                    }
                }
            }
        });
    },
    
    // Chart 5: Savings Growth
    createSavingsChart() {
        const savings = DB.get('savings') || [];
        
        // Sort by date
        savings.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let cumulative = 0;
        const labels = [];
        const data = [];
        
        savings.forEach(item => {
            cumulative += item.amount;
            labels.push(item.date);
            data.push(cumulative);
        });
        
        // If no savings data, show sample
        if (labels.length === 0) {
            labels.push('শুরু');
            data.push(0);
        }
        
        const ctx = document.getElementById('savingsChart');
        if (!ctx) return;
        
        if (this.charts.savings) this.charts.savings.destroy();
        
        this.charts.savings = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.map(l => this.formatDay(l)),
                datasets: [{
                    label: 'সঞ্চয়',
                    data: data,
                    borderColor: 'rgba(147, 51, 234, 1)',
                    backgroundColor: 'rgba(147, 51, 234, 0.2)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(147, 51, 234, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 14, weight: 'bold' },
                            padding: 15
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => '৳ ' + value
                        }
                    }
                }
            }
        });
    },
    
    // Helper: Format month (2024-12 -> Dec 2024)
    formatMonth(dateStr) {
        const [year, month] = dateStr.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[parseInt(month) - 1]} ${year}`;
    },
    
    // Helper: Format day (2024-12-25 -> 25 Dec)
    formatDay(dateStr) {
        if (dateStr === 'শুরু') return dateStr;
        const [year, month, day] = dateStr.split('-');
        return `${parseInt(day)}/${parseInt(month)}`;
    },
    
    // Helper: Generate colors
    generateColors(count) {
        const colors = [
            'rgba(239, 68, 68, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(147, 51, 234, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(20, 184, 166, 0.8)',
            'rgba(249, 115, 22, 0.8)'
        ];
        
        const bg = [];
        const border = [];
        
        for (let i = 0; i < count; i++) {
            const color = colors[i % colors.length];
            bg.push(color);
            border.push(color.replace('0.8', '1'));
        }
        
        return { bg, border };
    },
    
    // Destroy all charts
    destroyAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
};