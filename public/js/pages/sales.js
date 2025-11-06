import { wrapWithLayout } from '../components/layout.js';
import { api } from '../api.js';
import { formatCurrency, formatDateTime, showToast } from '../utils.js';

let sales = [];
let filteredSales = [];

export function render(app) {
  return wrapWithLayout(`
    <div class="page-header">
      <h1 class="page-title">Sales History</h1>
      <p class="page-subtitle">View and manage sales transactions</p>
    </div>
    
    <!-- Filters -->
    <div class="card mb-6">
      <div class="grid grid-cols-3 gap-4">
        <div class="form-group">
          <label for="startDate" class="form-label">From Date</label>
          <input 
            type="date" 
            id="startDate" 
            class="form-input"
            onchange="filterSales()"
            data-testid="input-start-date"
          />
        </div>
        
        <div class="form-group">
          <label for="endDate" class="form-label">To Date</label>
          <input 
            type="date" 
            id="endDate" 
            class="form-input"
            onchange="filterSales()"
            data-testid="input-end-date"
          />
        </div>
        
        <div class="form-group">
          <label for="paymentFilter" class="form-label">Payment Method</label>
          <select 
            id="paymentFilter" 
            class="form-select"
            onchange="filterSales()"
            data-testid="select-payment-filter"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="emi">EMI</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Summary Cards -->
    <div class="grid grid-cols-3 gap-4 mb-6" id="salesSummary">
      ${renderSummaryCards()}
    </div>
    
    <!-- Sales Table -->
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Date & Time</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Subtotal</th>
            <th>Tax</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="salesTableBody">
          ${renderSalesRows()}
        </tbody>
      </table>
    </div>
    
    <!-- Sale Detail Modal -->
    <div id="saleDetailModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Sale Details</h3>
          <button class="modal-close" onclick="closeSaleDetailModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body" id="saleDetailContent">
          <!-- Content loaded dynamically -->
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="printInvoice()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print Invoice
          </button>
          <button class="btn btn-primary" onclick="closeSaleDetailModal()">Close</button>
        </div>
      </div>
    </div>
  `, 'sales', app.user);
}

function renderSummaryCards() {
  const totalSales = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
  const totalProfit = filteredSales.reduce((sum, sale) => {
    const saleProfit = parseFloat(sale.totalAmount) - parseFloat(sale.subtotal) * 0.7; // Estimated profit
    return sum + saleProfit;
  }, 0);
  
  return `
    <div class="stat-card">
      <div class="stat-card-value" data-testid="stat-total-sales">${filteredSales.length}</div>
      <div class="stat-card-label">Total Sales</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-value" data-testid="stat-revenue">${formatCurrency(totalSales)}</div>
      <div class="stat-card-label">Total Revenue</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-value" data-testid="stat-profit">${formatCurrency(totalProfit)}</div>
      <div class="stat-card-label">Estimated Profit</div>
    </div>
  `;
}

function renderSalesRows() {
  if (!filteredSales || filteredSales.length === 0) {
    return `
      <tr>
        <td colspan="9" class="text-center" style="padding: 48px;">
          <div style="color: var(--text-secondary);">
            <p>No sales found</p>
          </div>
        </td>
      </tr>
    `;
  }
  
  return filteredSales.map(sale => `
    <tr data-sale-id="${sale.id}" data-testid="row-sale-${sale.id}">
      <td class="font-mono"><strong>${sale.invoiceNumber}</strong></td>
      <td>${formatDateTime(sale.createdAt)}</td>
      <td>${sale.customerName || 'Walk-in'}</td>
      <td>${sale.itemCount || 0} items</td>
      <td class="font-mono">${formatCurrency(sale.subtotal)}</td>
      <td class="font-mono">${formatCurrency(sale.taxAmount)}</td>
      <td class="font-mono"><strong>${formatCurrency(sale.totalAmount)}</strong></td>
      <td>
        <span class="badge badge-${getPaymentMethodBadge(sale.paymentMethod)}" data-testid="badge-payment-${sale.id}">
          ${sale.paymentMethod.toUpperCase()}
        </span>
      </td>
      <td>
        <button 
          class="btn btn-outline btn-sm btn-icon" 
          onclick="viewSaleDetails(${sale.id})"
          data-testid="button-view-${sale.id}"
          title="View Details"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

function getPaymentMethodBadge(method) {
  const badges = {
    cash: 'success',
    card: 'primary',
    upi: 'info',
    emi: 'warning',
  };
  return badges[method] || 'primary';
}

export async function init(app) {
  try {
    sales = await api.getSales();
    filteredSales = sales;
    updateSalesDisplay();
    
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('endDate').valueAsDate = endDate;
    document.getElementById('startDate').valueAsDate = startDate;
  } catch (error) {
    console.error('Failed to load sales:', error);
    showToast('Failed to load sales', 'error');
  }
  
  // Expose functions globally
  window.filterSales = filterSales;
  window.viewSaleDetails = viewSaleDetails;
  window.closeSaleDetailModal = closeSaleDetailModal;
  window.printInvoice = printInvoice;
}

function filterSales() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const paymentMethod = document.getElementById('paymentFilter').value;
  
  filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt);
    
    const matchesDate = (!startDate || saleDate >= new Date(startDate)) &&
                        (!endDate || saleDate <= new Date(endDate));
    const matchesPayment = paymentMethod === 'all' || sale.paymentMethod === paymentMethod;
    
    return matchesDate && matchesPayment;
  });
  
  updateSalesDisplay();
}

function updateSalesDisplay() {
  const summaryEl = document.getElementById('salesSummary');
  const tbody = document.getElementById('salesTableBody');
  
  if (summaryEl) summaryEl.innerHTML = renderSummaryCards();
  if (tbody) tbody.innerHTML = renderSalesRows();
}

async function viewSaleDetails(id) {
  try {
    const sale = await api.getSale(id);
    
    const content = `
      <div class="mb-6" style="padding: 24px; background: var(--bg-secondary); border-radius: 8px;">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 4px;">Invoice Number</div>
            <div class="font-mono" style="font-size: 1.125rem; font-weight: 500;">${sale.invoiceNumber}</div>
          </div>
          <div>
            <div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 4px;">Date & Time</div>
            <div>${formatDateTime(sale.createdAt)}</div>
          </div>
          <div>
            <div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 4px;">Customer</div>
            <div>${sale.customerName || 'Walk-in Customer'}</div>
          </div>
          <div>
            <div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 4px;">Payment Method</div>
            <div><span class="badge badge-${getPaymentMethodBadge(sale.paymentMethod)}">${sale.paymentMethod.toUpperCase()}</span></div>
          </div>
        </div>
      </div>
      
      <div class="mb-6">
        <h4 style="font-size: 1rem; font-weight: 500; margin-bottom: 16px;">Items</h4>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items && sale.items.map(item => `
                <tr>
                  <td><strong>${item.productName}</strong></td>
                  <td>${item.quantity}</td>
                  <td class="font-mono">${formatCurrency(item.price)}</td>
                  <td class="font-mono"><strong>${formatCurrency(item.price * item.quantity)}</strong></td>
                </tr>
              `).join('') || '<tr><td colspan="4" class="text-center">No items</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style="border-top: 2px solid var(--border-color); padding-top: 16px;">
        <div class="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span class="font-mono">${formatCurrency(sale.subtotal)}</span>
        </div>
        <div class="flex justify-between mb-2">
          <span>Discount:</span>
          <span class="font-mono">${formatCurrency(sale.discount)}</span>
        </div>
        <div class="flex justify-between mb-2">
          <span>Tax (18%):</span>
          <span class="font-mono">${formatCurrency(sale.taxAmount)}</span>
        </div>
        <div class="flex justify-between" style="font-size: 1.25rem; font-weight: 500; margin-top: 16px;">
          <span>Total:</span>
          <span class="font-mono">${formatCurrency(sale.totalAmount)}</span>
        </div>
      </div>
    `;
    
    document.getElementById('saleDetailContent').innerHTML = content;
    document.getElementById('saleDetailModal').classList.remove('hidden');
  } catch (error) {
    showToast('Failed to load sale details', 'error');
  }
}

function closeSaleDetailModal() {
  document.getElementById('saleDetailModal').classList.add('hidden');
}

function printInvoice() {
  window.print();
}
