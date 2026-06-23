/* ==========================================================
   charts.js — Shared Chart Configurations (Chart.js)
   Smart Spend | Used on: dashboard.html, reports.html
   ========================================================== */

/**
 * Initializes the Spending Trend line chart.
 * @param {string} canvasId - The ID of the <canvas> element.
 */
let trendChartInstance = null;
let categoryChartInstance = null;

function initSpendingTrendChart(canvasId, initialData = [0,0,0,0,0,0,0,0,0]) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (trendChartInstance) trendChartInstance.destroy();

    trendChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP'],
            datasets: [{
                label: 'Spending',
                data: initialData,
                borderColor: '#125e3a',
                backgroundColor: '#125e3a',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#125e3a',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => value.toLocaleString(),
                        font: { size: 10 }
                    },
                    grid: { display: false }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 10, weight: 'bold' } }
                }
            }
        }
    });
}

function initCategoryBreakdownChart(canvasId, initialData = [1,1,1,1,1,1,1]) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Food', 'Drink', 'Shopping', 'Transportation', 'Bills', 'Health', 'Entertainment', 'Others'],
            datasets: [{
                data: initialData,
                backgroundColor: [
                    '#125e3a', // Dining
                    '#fbbf24', // Groceries
                    '#6b7280', // Others
                    '#f59e0b', // Shopping
                    '#8b5cf6', // Entertainment
                    '#10b981', // Health
                    '#3b82f6'  // Transport
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '50%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 11 },
                        padding: 15
                    }
                }
            }
        }
    });
}

// Global update helpers
window.updateChartsWithData = (trendData, categoryData) => {
    if (trendChartInstance && trendData) {
        trendChartInstance.data.datasets[0].data = trendData;
        trendChartInstance.update();
    }
    if (categoryChartInstance && categoryData) {
        categoryChartInstance.data.datasets[0].data = categoryData;
        categoryChartInstance.update();
    }
};
