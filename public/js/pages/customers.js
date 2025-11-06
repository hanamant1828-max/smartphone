import { wrapWithLayout } from '../components/layout.js';
import { api } from '../api.js';
import { formatCurrency, formatDate, showToast, validatePhone, validateEmail } from '../utils.js';

let customers = [];
let filteredCustomers = [];

export function render(app) {
  return wrapWithLayout(`
    <div class="page-header">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="page-title">Customer Management</h1>
          <p class="page-subtitle">Manage your customer database</p>
        </div>
        <button 
          class="btn btn-primary" 
          onclick="openAddCustomerModal()"
          data-testid="button-add-customer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Customer
        </button>
      </div>
    </div>
    
    <!-- Search -->
    <div class="card mb-6">
      <input 
        type="search" 
        class="form-input" 
        placeholder="Search by name, phone, or email..." 
        id="customerSearchInput"
        oninput="searchCustomers()"
        data-testid="input-search-customers"
      />
    </div>
    
    <!-- Customers Table -->
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Location</th>
            <th>Total Purchases</th>
            <th>Loyalty Points</th>
            <th>Since</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="customersTableBody">
          ${renderCustomerRows()}
        </tbody>
      </table>
    </div>
    
    <!-- Add/Edit Customer Modal -->
    <div id="customerModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="modalTitle">Add New Customer</h3>
          <button class="modal-close" onclick="closeCustomerModal()" data-testid="button-close-modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <form id="customerForm">
            <input type="hidden" id="customerId" />
            
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label for="customerName" class="form-label">Full Name*</label>
                <input type="text" id="customerName" class="form-input" required data-testid="input-customer-name" />
              </div>
              
              <div class="form-group">
                <label for="customerPhone" class="form-label">Phone Number*</label>
                <input type="tel" id="customerPhone" class="form-input" required maxlength="10" data-testid="input-customer-phone" />
                <div class="form-helper">10-digit mobile number</div>
              </div>
              
              <div class="form-group">
                <label for="customerEmail" class="form-label">Email</label>
                <input type="email" id="customerEmail" class="form-input" data-testid="input-customer-email" />
              </div>
              
              <div class="form-group">
                <label for="customerCity" class="form-label">City</label>
                <input type="text" id="customerCity" class="form-input" data-testid="input-customer-city" />
              </div>
              
              <div class="form-group">
                <label for="customerPincode" class="form-label">Pincode</label>
                <input type="text" id="customerPincode" class="form-input" maxlength="6" data-testid="input-customer-pincode" />
              </div>
              
              <div class="form-group">
                <label for="customerLoyaltyPoints" class="form-label">Loyalty Points</label>
                <input type="number" id="customerLoyaltyPoints" class="form-input" value="0" min="0" data-testid="input-customer-loyalty" />
              </div>
            </div>
            
            <div class="form-group">
              <label for="customerAddress" class="form-label">Address</label>
              <textarea id="customerAddress" class="form-textarea" rows="2" data-testid="textarea-customer-address"></textarea>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeCustomerModal()" data-testid="button-cancel">Cancel</button>
          <button class="btn btn-primary" onclick="saveCustomer()" data-testid="button-save-customer">Save Customer</button>
        </div>
      </div>
    </div>
    
    <!-- Customer Detail Modal -->
    <div id="customerDetailModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Customer Details</h3>
          <button class="modal-close" onclick="closeCustomerDetailModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body" id="customerDetailContent">
          <!-- Content loaded dynamically -->
        </div>
      </div>
    </div>
  `, 'customers', app.user);
}

function renderCustomerRows() {
  if (!filteredCustomers || filteredCustomers.length === 0) {
    return `
      <tr>
        <td colspan="8" class="text-center" style="padding: 48px;">
          <div style="color: var(--text-secondary);">
            <p>No customers found</p>
            <button class="btn btn-primary btn-sm mt-4" onclick="openAddCustomerModal()">Add Your First Customer</button>
          </div>
        </td>
      </tr>
    `;
  }
  
  return filteredCustomers.map(customer => `
    <tr data-customer-id="${customer.id}" data-testid="row-customer-${customer.id}">
      <td>
        <strong>${customer.name}</strong>
      </td>
      <td class="font-mono">${customer.phone}</td>
      <td>${customer.email || '-'}</td>
      <td>${customer.city || '-'}${customer.pincode ? ` (${customer.pincode})` : ''}</td>
      <td class="font-mono"><strong>${formatCurrency(customer.totalPurchases)}</strong></td>
      <td>
        <span class="badge badge-primary" data-testid="badge-loyalty-${customer.id}">${customer.loyaltyPoints} pts</span>
      </td>
      <td>${formatDate(customer.createdAt)}</td>
      <td>
        <div class="flex gap-2">
          <button 
            class="btn btn-outline btn-sm btn-icon" 
            onclick="viewCustomerDetails(${customer.id})"
            data-testid="button-view-${customer.id}"
            title="View Details"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button 
            class="btn btn-outline btn-sm btn-icon" 
            onclick="editCustomer(${customer.id})"
            data-testid="button-edit-${customer.id}"
            title="Edit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

export async function init(app) {
  try {
    customers = await api.getCustomers();
    filteredCustomers = customers;
    updateCustomersTable();
  } catch (error) {
    console.error('Failed to load customers:', error);
    showToast('Failed to load customers', 'error');
  }
  
  // Expose functions globally
  window.openAddCustomerModal = openAddCustomerModal;
  window.closeCustomerModal = closeCustomerModal;
  window.saveCustomer = saveCustomer;
  window.editCustomer = editCustomer;
  window.viewCustomerDetails = viewCustomerDetails;
  window.closeCustomerDetailModal = closeCustomerDetailModal;
  window.searchCustomers = searchCustomers;
}

function openAddCustomerModal() {
  document.getElementById('modalTitle').textContent = 'Add New Customer';
  document.getElementById('customerForm').reset();
  document.getElementById('customerId').value = '';
  document.getElementById('customerModal').classList.remove('hidden');
}

function closeCustomerModal() {
  document.getElementById('customerModal').classList.add('hidden');
}

async function saveCustomer() {
  const form = document.getElementById('customerForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const phone = document.getElementById('customerPhone').value;
  if (!validatePhone(phone)) {
    showToast('Please enter a valid 10-digit phone number', 'error');
    return;
  }
  
  const email = document.getElementById('customerEmail').value;
  if (email && !validateEmail(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }
  
  const customerId = document.getElementById('customerId').value;
  const customerData = {
    name: document.getElementById('customerName').value,
    phone: phone,
    email: email || null,
    address: document.getElementById('customerAddress').value || null,
    city: document.getElementById('customerCity').value || null,
    pincode: document.getElementById('customerPincode').value || null,
    loyaltyPoints: parseInt(document.getElementById('customerLoyaltyPoints').value) || 0,
  };
  
  try {
    if (customerId) {
      await api.updateCustomer(customerId, customerData);
      showToast('Customer updated successfully', 'success');
    } else {
      await api.createCustomer(customerData);
      showToast('Customer added successfully', 'success');
    }
    
    closeCustomerModal();
    customers = await api.getCustomers();
    filteredCustomers = customers;
    updateCustomersTable();
  } catch (error) {
    showToast(error.message || 'Failed to save customer', 'error');
  }
}

async function editCustomer(id) {
  try {
    const customer = await api.getCustomer(id);
    
    document.getElementById('modalTitle').textContent = 'Edit Customer';
    document.getElementById('customerId').value = customer.id;
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerPhone').value = customer.phone;
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerAddress').value = customer.address || '';
    document.getElementById('customerCity').value = customer.city || '';
    document.getElementById('customerPincode').value = customer.pincode || '';
    document.getElementById('customerLoyaltyPoints').value = customer.loyaltyPoints || 0;
    
    document.getElementById('customerModal').classList.remove('hidden');
  } catch (error) {
    showToast('Failed to load customer details', 'error');
  }
}

async function viewCustomerDetails(id) {
  try {
    const customer = await api.getCustomer(id);
    const purchases = await api.getCustomerPurchaseHistory(id);
    
    const content = `
      <div class="mb-6">
        <h4 style="font-size: 1.25rem; font-weight: 500; margin-bottom: 16px;">${customer.name}</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 4px;">Phone</div>
            <div class="font-mono">${customer.phone}</div>
          </div>
          <div>
            <div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 4px;">Email</div>
            <div>${customer.email || '-'}</div>
          </div>
          <div>
            <div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 4px;">Total Purchases</div>
            <div class="font-mono"><strong>${formatCurrency(customer.totalPurchases)}</strong></div>
          </div>
          <div>
            <div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 4px;">Loyalty Points</div>
            <div><span class="badge badge-primary">${customer.loyaltyPoints} points</span></div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 style="font-size: 1rem; font-weight: 500; margin-bottom: 16px;">Purchase History</h4>
        ${purchases && purchases.length > 0 ? `
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                ${purchases.map(purchase => `
                  <tr>
                    <td class="font-mono">${purchase.invoiceNumber}</td>
                    <td>${formatDate(purchase.createdAt)}</td>
                    <td class="font-mono"><strong>${formatCurrency(purchase.totalAmount)}</strong></td>
                    <td><span class="badge badge-success">${purchase.paymentMethod.toUpperCase()}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p style="color: var(--text-secondary); text-align: center; padding: 24px;">No purchase history</p>'}
      </div>
    `;
    
    document.getElementById('customerDetailContent').innerHTML = content;
    document.getElementById('customerDetailModal').classList.remove('hidden');
  } catch (error) {
    showToast('Failed to load customer details', 'error');
  }
}

function closeCustomerDetailModal() {
  document.getElementById('customerDetailModal').classList.add('hidden');
}

function searchCustomers() {
  const searchTerm = document.getElementById('customerSearchInput').value.toLowerCase();
  
  filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm))
  );
  
  updateCustomersTable();
}

function updateCustomersTable() {
  const tbody = document.getElementById('customersTableBody');
  if (tbody) {
    tbody.innerHTML = renderCustomerRows();
  }
}
