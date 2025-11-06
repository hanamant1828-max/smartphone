import { wrapWithLayout } from '../components/layout.js';
import { api } from '../api.js';
import { formatCurrency, formatNumber } from '../utils.js';

let stats = null;
let salesChart = null;

export function render(app) {
  return wrapWithLayout(`
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Overview of your mobile shop performance</p>
    </div>
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-4 mb-6" id="statsCards">
      ${renderStatsCards()}
    </div>
    
    <!-- Charts Row -->
    <div class="grid grid-cols-2 mb-6">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Sales Overview</h3>
        </div>
        <canvas id="salesChart" style="max-height: 300px;"></canvas>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Top Selling Products</h3>
        </div>
        <canvas id="productsChart" style="max-height: 300px;"></canvas>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Quick Actions</h3>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <button 
          class="btn btn-primary btn-lg" 
          onclick="window.app.navigate('pos')"
          data-testid="button-new-sale"
          style="justify-content: center;"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          New Sale
        </button>
        
        <button 
          class="btn btn-success btn-lg" 
          onclick="window.app.navigate('inventory')"
          data-testid="button-add-product"
          style="justify-content: center;"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Product
        </button>
        
        <button 
          class="btn btn-secondary btn-lg" 
          onclick="window.app.navigate('reports')"
          data-testid="button-view-reports"
          style="justify-content: center;"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          View Reports
        </button>
      </div>
    </div>
    
    <!-- Low Stock Alert -->
    <div id="lowStockAlert" class="mt-6"></div>
  `, 'dashboard', app.user);
}

function renderStatsCards() {
  if (!stats) {
    return `
      <div class="stat-card">
        <div class="stat-card-value">---</div>
        <div class="stat-card-label">Today's Sales</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-value">---</div>
        <div class="stat-card-label">Total Revenue</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-value">---</div>
        <div class="stat-card-label">Total Products</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-value">---</div>
        <div class="stat-card-label">Customers</div>
      </div>
    `;
  }
  
  return `
    <div class="stat-card">
      <div class="stat-card-icon" style="background: var(--primary);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
        </svg>
      </div>
      <div class="stat-card-value" data-testid="stat-today-sales">${formatCurrency(stats.todaySales)}</div>
      <div class="stat-card-label">Today's Sales</div>
      <div class="stat-card-trend positive">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 14l5-5 5 5z"/>
        </svg>
        ${stats.salesGrowth}%
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-icon" style="background: var(--success);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-1c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-6v11c0 1.1-.9 2-2 2H4v-2h17V7h2z"/>
        </svg>
      </div>
      <div class="stat-card-value" data-testid="stat-total-revenue">${formatCurrency(stats.totalRevenue)}</div>
      <div class="stat-card-label">Monthly Revenue</div>
      <div class="stat-card-trend positive">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 14l5-5 5 5z"/>
        </svg>
        ${stats.revenueGrowth}%
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-icon" style="background: var(--warning);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
        </svg>
      </div>
      <div class="stat-card-value" data-testid="stat-total-products">${formatNumber(stats.totalProducts)}</div>
      <div class="stat-card-label">Total Products</div>
      <div class="stat-card-trend">
        ${stats.lowStockCount} low stock
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-icon" style="background: var(--info);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      </div>
      <div class="stat-card-value" data-testid="stat-total-customers">${formatNumber(stats.totalCustomers)}</div>
      <div class="stat-card-label">Total Customers</div>
      <div class="stat-card-trend">
        ${stats.newCustomers} this month
      </div>
    </div>
  `;
}

export async function init(app) {
  try {
    stats = await api.getDashboardStats();
    
    // Update stats cards
    const statsCardsEl = document.getElementById('statsCards');
    if (statsCardsEl) {
      statsCardsEl.innerHTML = renderStatsCards();
    }
    
    // Initialize charts
    initSalesChart(stats.salesData);
    initProductsChart(stats.topProducts);
    
    // Show low stock alert if needed
    if (stats.lowStockProducts && stats.lowStockProducts.length > 0) {
      showLowStockAlert(stats.lowStockProducts);
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
}

function initSalesChart(data) {
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  if (salesChart) {
    salesChart.destroy();
  }
  
  salesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Sales',
        data: data?.values || [12000, 15000, 13000, 18000, 22000, 25000, 28000],
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + (value / 1000) + 'k';
            }
          }
        }
      }
    }
  });
}

function initProductsChart(data) {
  const canvas = document.getElementById('productsChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data?.labels || ['iPhone 14', 'Samsung S23', 'OnePlus 11', 'Redmi Note 12', 'Realme 10'],
      datasets: [{
        label: 'Units Sold',
        data: data?.values || [45, 38, 32, 28, 24],
        backgroundColor: [
          'rgba(25, 118, 210, 0.8)',
          'rgba(56, 142, 60, 0.8)',
          'rgba(245, 124, 0, 0.8)',
          'rgba(211, 47, 47, 0.8)',
          'rgba(2, 136, 209, 0.8)',
        ],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });
}

function showLowStockAlert(products) {
  const alertEl = document.getElementById('lowStockAlert');
  if (!alertEl) return;
  
  alertEl.innerHTML = `
    <div class="alert alert-warning">
      <strong>Low Stock Alert!</strong> ${products.length} products are running low on stock.
      <a href="#inventory" onclick="window.app.navigate('inventory'); return false;" style="text-decoration: underline; margin-left: 8px;">
        View Inventory
      </a>
    </div>
  `;
}
