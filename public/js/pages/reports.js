import { wrapWithLayout } from '../components/layout.js';
import { api } from '../api.js';
import { formatCurrency, formatNumber, formatDate, showToast } from '../utils.js';

let reportData = null;

export function render(app) {
  return wrapWithLayout(`
    <div class="page-header">
      <h1 class="page-title">Reports & Analytics</h1>
      <p class="page-subtitle">Business insights and performance metrics</p>
    </div>
    
    <!-- Report Type Selection -->
    <div class="card mb-6">
      <div class="flex gap-4 items-center">
        <div class="form-group flex-1" style="margin-bottom: 0;">
          <label for="reportType" class="form-label">Report Type</label>
          <select 
            id="reportType" 
            class="form-select"
            onchange="changeReportType()"
            data-testid="select-report-type"
          >
            <option value="sales">Sales Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="customer">Customer Report</option>
            <option value="financial">Financial Summary</option>
          </select>
        </div>
        
        <div class="form-group" style="margin-bottom: 0;">
          <label for="reportStartDate" class="form-label">From Date</label>
          <input 
            type="date" 
            id="reportStartDate" 
            class="form-input"
            onchange="loadReport()"
            data-testid="input-report-start-date"
          />
        </div>
        
        <div class="form-group" style="margin-bottom: 0;">
          <label for="reportEndDate" class="form-label">To Date</label>
          <input 
            type="date" 
            id="reportEndDate" 
            class="form-input"
            onchange="loadReport()"
            data-testid="input-report-end-date"
          />
        </div>
        
        <div style="align-self: flex-end;">
          <button 
            class="btn btn-outline" 
            onclick="exportReport()"
            data-testid="button-export-report"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </div>
      </div>
    </div>
    
    <!-- Report Content -->
    <div id="reportContent">
      ${renderReportContent()}
    </div>
  `, 'reports', app.user);
}

function renderReportContent() {
  if (!reportData) {
    return `
      <div class="card" style="padding: 48px; text-align: center;">
        <div class="spinner" style="margin: 0 auto 16px;"></div>
        <p style="color: var(--text-secondary);">Loading report...</p>
      </div>
    `;
  }
  
  const reportType = document.getElementById('reportType')?.value || 'sales';
  
  switch (reportType) {
    case 'sales':
      return renderSalesReport();
    case 'inventory':
      return renderInventoryReport();
    case 'customer':
      return renderCustomerReport();
    case 'financial':
      return renderFinancialReport();
    default:
      return '<div class="card">Select a report type</div>';
  }
}

function renderSalesReport() {
  return `
    <!-- Summary Cards -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="stat-card">
        <div class="stat-card-value" data-testid="stat-report-sales">${formatNumber(reportData.totalSales || 0)}</div>
        <div class="stat-card-label">Total Sales</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-value" data-testid="stat-report-revenue">${formatCurrency(reportData.totalRevenue || 0)}</div>
        <div class="stat-card-label">Revenue</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-value" data-testid="stat-report-profit">${formatCurrency(reportData.totalProfit || 0)}</div>
        <div class="stat-card-label">Gross Profit</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-value" data-testid="stat-report-avg">${formatCurrency(reportData.avgOrderValue || 0)}</div>
        <div class="stat-card-label">Avg Order Value</div>
      </div>
    </div>
    
    <!-- Charts -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Sales by Payment Method</h3>
        </div>
        <canvas id="paymentMethodChart" style="max-height: 300px;"></canvas>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Daily Sales Trend</h3>
        </div>
        <canvas id="salesTrendChart" style="max-height: 300px;"></canvas>
      </div>
    </div>
    
    <!-- Top Products -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Top Selling Products</h3>
      </div>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Units Sold</th>
              <th>Revenue</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.topProducts && reportData.topProducts.length > 0 ? 
              reportData.topProducts.map(product => `
                <tr data-testid="row-top-product-${product.id}">
                  <td><strong>${product.name}</strong></td>
                  <td class="font-mono">${product.unitsSold}</td>
                  <td class="font-mono">${formatCurrency(product.revenue)}</td>
                  <td class="font-mono"><strong>${formatCurrency(product.profit)}</strong></td>
                </tr>
              `).join('')
              : '<tr><td colspan="4" class="text-center">No data available</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderInventoryReport() {
  return `
    <!-- Summary Cards -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="stat-card">
        <div class="stat-card-value" data-testid="stat-total-products">${formatNumber(reportData.totalProducts || 0)}</div>
        <div class="stat-card-label">Total Products</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-value" data-testid="stat-total-stock">${formatNumber(reportData.totalStock || 0)}</div>
        <div class="stat-card-label">Total Stock</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-value" data-testid="stat-stock-value">${formatCurrency(reportData.stockValue || 0)}</div>
        <div class="stat-card-label">Stock Value</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-value" style="color: var(--error);" data-testid="stat-low-stock">${formatNumber(reportData.lowStockCount || 0)}</div>
        <div class="stat-card-label">Low Stock Items</div>
      </div>
    </div>
    
    <!-- Categories & Low Stock -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Stock by Category</h3>
        </div>
        <canvas id="categoryChart" style="max-height: 300px;"></canvas>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Low Stock Products</h3>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
                <th>Min Level</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.lowStockProducts && reportData.lowStockProducts.length > 0 ?
                reportData.lowStockProducts.map(product => `
                  <tr data-testid="row-low-stock-${product.id}">
                    <td><strong>${product.name}</strong></td>
                    <td><span class="badge badge-error">${product.stockQuantity}</span></td>
                    <td>${product.minStockLevel}</td>
                  </tr>
                `).join('')
                : '<tr><td colspan="3" class="text-center">No low stock items</td></tr>'
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderCustomerReport() {
  return `
    <!-- Summary Cards -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="stat-card">
        <div class="stat-card-value" data-testid="stat-total-customers">${formatNumber(reportData.totalCustomers || 0)}</div>
        <div class="stat-card-label">Total Customers</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-value" data-testid="stat-new-customers">${formatNumber(reportData.newCustomers || 0)}</div>
        <div class="stat-card-label">New This Period</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-value" data-testid="stat-customer-value">${formatCurrency(reportData.avgCustomerValue || 0)}</div>
        <div class="stat-card-label">Avg Customer Value</div>
      </div>
    </div>
    
    <!-- Top Customers -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Top Customers</h3>
      </div>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Total Purchases</th>
              <th>Loyalty Points</th>
              <th>Last Purchase</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.topCustomers && reportData.topCustomers.length > 0 ?
              reportData.topCustomers.map(customer => `
                <tr data-testid="row-top-customer-${customer.id}">
                  <td><strong>${customer.name}</strong></td>
                  <td class="font-mono">${customer.phone}</td>
                  <td class="font-mono"><strong>${formatCurrency(customer.totalPurchases)}</strong></td>
                  <td><span class="badge badge-primary">${customer.loyaltyPoints} pts</span></td>
                  <td>${formatDate(customer.lastPurchase)}</td>
                </tr>
              `).join('')
              : '<tr><td colspan="5" class="text-center">No data available</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderFinancialReport() {
  return `
    <!-- Summary Cards -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="stat-card">
        <div class="stat-card-value" data-testid="stat-total-revenue">${formatCurrency(reportData.totalRevenue || 0)}</div>
        <div class="stat-card-label">Total Revenue</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-value" data-testid="stat-total-profit">${formatCurrency(reportData.totalProfit || 0)}</div>
        <div class="stat-card-label">Gross Profit</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-value" data-testid="stat-profit-margin">${(reportData.profitMargin || 0).toFixed(1)}%</div>
        <div class="stat-card-label">Profit Margin</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-value" data-testid="stat-tax-collected">${formatCurrency(reportData.taxCollected || 0)}</div>
        <div class="stat-card-label">Tax Collected</div>
      </div>
    </div>
    
    <!-- Detailed Breakdown -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Financial Breakdown</h3>
      </div>
      <div style="padding: 24px;">
        <div class="flex justify-between mb-4" style="padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
          <span style="font-weight: 500;">Revenue</span>
          <span class="font-mono" style="font-weight: 500;">${formatCurrency(reportData.totalRevenue || 0)}</span>
        </div>
        
        <div class="flex justify-between mb-2">
          <span style="color: var(--text-secondary);">Cost of Goods Sold (Estimated)</span>
          <span class="font-mono" style="color: var(--text-secondary);">- ${formatCurrency((reportData.totalRevenue || 0) * 0.7)}</span>
        </div>
        
        <div class="flex justify-between mb-4" style="padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
          <span style="font-weight: 500;">Gross Profit</span>
          <span class="font-mono" style="font-weight: 500; color: var(--success);">${formatCurrency(reportData.totalProfit || 0)}</span>
        </div>
        
        <div class="flex justify-between mb-2">
          <span style="color: var(--text-secondary);">Tax (18% GST)</span>
          <span class="font-mono" style="color: var(--text-secondary);">${formatCurrency(reportData.taxCollected || 0)}</span>
        </div>
        
        <div class="flex justify-between mb-2">
          <span style="color: var(--text-secondary);">Number of Transactions</span>
          <span class="font-mono" style="color: var(--text-secondary);">${formatNumber(reportData.totalTransactions || 0)}</span>
        </div>
        
        <div class="flex justify-between mt-4" style="padding-top: 16px; border-top: 2px solid var(--border-color); font-size: 1.125rem;">
          <span style="font-weight: 500;">Net Profit (After Tax)</span>
          <span class="font-mono" style="font-weight: 500; color: var(--success);">${formatCurrency((reportData.totalProfit || 0) - (reportData.taxCollected || 0))}</span>
        </div>
      </div>
    </div>
  `;
}

export async function init(app) {
  // Set default date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  document.getElementById('reportEndDate').valueAsDate = endDate;
  document.getElementById('reportStartDate').valueAsDate = startDate;
  
  // Load initial report
  await loadReport();
  
  // Expose functions globally
  window.changeReportType = changeReportType;
  window.loadReport = loadReport;
  window.exportReport = exportReport;
}

async function changeReportType() {
  await loadReport();
}

async function loadReport() {
  const reportType = document.getElementById('reportType').value;
  const startDate = document.getElementById('reportStartDate').value;
  const endDate = document.getElementById('reportEndDate').value;
  
  try {
    // Simulate loading different report types
    switch (reportType) {
      case 'sales':
        reportData = await api.getSalesReport(startDate, endDate);
        break;
      case 'inventory':
        reportData = await api.getInventoryReport();
        break;
      case 'customer':
        reportData = await api.getCustomerReport();
        break;
      case 'financial':
        reportData = await api.getSalesReport(startDate, endDate);
        break;
    }
    
    updateReportDisplay();
    initializeCharts();
  } catch (error) {
    console.error('Failed to load report:', error);
    showToast('Failed to load report', 'error');
  }
}

function updateReportDisplay() {
  const reportContent = document.getElementById('reportContent');
  if (reportContent) {
    reportContent.innerHTML = renderReportContent();
  }
}

function initializeCharts() {
  const reportType = document.getElementById('reportType').value;
  
  // Wait for next tick to ensure canvases are in DOM
  setTimeout(() => {
    if (reportType === 'sales') {
      initSalesCharts();
    } else if (reportType === 'inventory') {
      initInventoryCharts();
    }
  }, 100);
}

function initSalesCharts() {
  // Payment Method Chart
  const paymentCanvas = document.getElementById('paymentMethodChart');
  if (paymentCanvas) {
    new Chart(paymentCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Cash', 'Card', 'UPI', 'EMI'],
        datasets: [{
          data: [45, 25, 20, 10],
          backgroundColor: [
            'rgba(56, 142, 60, 0.8)',
            'rgba(25, 118, 210, 0.8)',
            'rgba(2, 136, 209, 0.8)',
            'rgba(245, 124, 0, 0.8)',
          ],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
      }
    });
  }
  
  // Sales Trend Chart
  const trendCanvas = document.getElementById('salesTrendChart');
  if (trendCanvas) {
    new Chart(trendCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Sales',
          data: [12000, 15000, 13000, 18000, 22000, 25000, 28000],
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } }
      }
    });
  }
}

function initInventoryCharts() {
  const categoryCanvas = document.getElementById('categoryChart');
  if (categoryCanvas) {
    new Chart(categoryCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Smartphones', 'Feature Phones', 'Accessories', 'Spare Parts'],
        datasets: [{
          label: 'Stock Count',
          data: [120, 45, 230, 85],
          backgroundColor: 'rgba(25, 118, 210, 0.8)',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

function exportReport() {
  showToast('Export functionality will be available in the full version', 'info');
}
