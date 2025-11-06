import { wrapWithLayout } from '../components/layout.js';
import { api } from '../api.js';
import { formatCurrency, showToast, generateInvoiceNumber } from '../utils.js';

let products = [];
let cart = [];
let selectedCustomer = null;

export function render(app) {
  return wrapWithLayout(`
    <div class="page-header">
      <h1 class="page-title">Point of Sale</h1>
      <p class="page-subtitle">Process sales and generate invoices</p>
    </div>
    
    <div class="grid grid-cols-2" style="gap: 24px; align-items: start;">
      <!-- Left Panel - Product Search -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Products</h3>
        </div>
        
        <input 
          type="search" 
          class="form-input mb-4" 
          placeholder="Search products..." 
          id="posSearchInput"
          oninput="searchProducts()"
          data-testid="input-pos-search"
        />
        
        <div id="productsGrid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-height: 500px; overflow-y: auto;">
          ${renderProductCards()}
        </div>
      </div>
      
      <!-- Right Panel - Cart & Checkout -->
      <div class="card" style="position: sticky; top: 88px;">
        <div class="card-header">
          <h3 class="card-title">Cart</h3>
          <button 
            class="btn btn-outline btn-sm" 
            onclick="clearCart()"
            data-testid="button-clear-cart"
          >
            Clear
          </button>
        </div>
        
        <!-- Customer Selection -->
        <div class="mb-4">
          <label class="form-label">Customer (Optional)</label>
          <div class="flex gap-2">
            <input 
              type="text" 
              class="form-input" 
              placeholder="Search customer by phone..." 
              id="customerSearch"
              data-testid="input-customer-search"
            />
            <button 
              class="btn btn-outline" 
              onclick="searchCustomer()"
              data-testid="button-search-customer"
            >
              Search
            </button>
          </div>
          <div id="selectedCustomer" class="mt-2"></div>
        </div>
        
        <!-- Cart Items -->
        <div id="cartItems" style="min-height: 200px; max-height: 300px; overflow-y: auto; margin-bottom: 16px;">
          ${renderCartItems()}
        </div>
        
        <!-- Cart Summary -->
        <div style="border-top: 2px solid var(--border-color); padding-top: 16px; margin-top: 16px;">
          <div class="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span class="font-mono" id="subtotal" data-testid="text-subtotal">${formatCurrency(calculateSubtotal())}</span>
          </div>
          
          <div class="flex justify-between mb-2">
            <span>Tax (18%):</span>
            <span class="font-mono" id="tax" data-testid="text-tax">${formatCurrency(calculateTax())}</span>
          </div>
          
          <div class="flex justify-between mb-4" style="font-size: 1.25rem; font-weight: 500;">
            <span>Total:</span>
            <span class="font-mono" id="total" data-testid="text-total">${formatCurrency(calculateTotal())}</span>
          </div>
          
          <!-- Payment Method -->
          <div class="form-group">
            <label class="form-label">Payment Method</label>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
              <button 
                class="btn btn-outline payment-method active" 
                data-method="cash"
                onclick="selectPaymentMethod('cash')"
                data-testid="button-payment-cash"
              >
                💵 Cash
              </button>
              <button 
                class="btn btn-outline payment-method" 
                data-method="card"
                onclick="selectPaymentMethod('card')"
                data-testid="button-payment-card"
              >
                💳 Card
              </button>
              <button 
                class="btn btn-outline payment-method" 
                data-method="upi"
                onclick="selectPaymentMethod('upi')"
                data-testid="button-payment-upi"
              >
                📱 UPI
              </button>
              <button 
                class="btn btn-outline payment-method" 
                data-method="emi"
                onclick="selectPaymentMethod('emi')"
                data-testid="button-payment-emi"
              >
                📅 EMI
              </button>
            </div>
          </div>
          
          <button 
            class="btn btn-success btn-lg" 
            style="width: 100%; margin-top: 16px;"
            onclick="completeSale()"
            id="checkoutBtn"
            data-testid="button-complete-sale"
            ${cart.length === 0 ? 'disabled' : ''}
          >
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  `, 'pos', app.user);
}

function renderProductCards() {
  if (!products || products.length === 0) {
    return '<div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-secondary);">No products available</div>';
  }
  
  return products.map(product => `
    <div 
      class="card" 
      style="padding: 12px; cursor: pointer; transition: all 150ms ease;"
      onclick="addToCart(${product.id})"
      onmouseover="this.style.boxShadow='var(--shadow)'"
      onmouseout="this.style.boxShadow='var(--shadow-sm)'"
      data-testid="card-product-${product.id}"
    >
      <div style="font-weight: 500; margin-bottom: 4px; font-size: 0.875rem;">${product.name}</div>
      <div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 8px;">${product.brand || ''} ${product.model || ''}</div>
      <div class="flex justify-between items-center">
        <span class="font-mono" style="font-weight: 500;">${formatCurrency(product.price)}</span>
        <span class="badge ${product.stockQuantity > product.minStockLevel ? 'badge-success' : 'badge-warning'}" style="font-size: 0.625rem;">
          ${product.stockQuantity} in stock
        </span>
      </div>
    </div>
  `).join('');
}

function renderCartItems() {
  if (cart.length === 0) {
    return `
      <div style="text-align: center; padding: 48px; color: var(--text-secondary);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; opacity: 0.3;">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <p>Cart is empty</p>
      </div>
    `;
  }
  
  return cart.map((item, index) => `
    <div class="flex gap-3 items-center" style="padding: 12px; border-bottom: 1px solid var(--border-color-light);" data-testid="cart-item-${index}">
      <div class="flex-1">
        <div style="font-weight: 500; font-size: 0.875rem;">${item.product.name}</div>
        <div class="font-mono" style="color: var(--text-secondary); font-size: 0.75rem;">${formatCurrency(item.product.price)} × ${item.quantity}</div>
      </div>
      
      <div class="flex gap-2 items-center">
        <button 
          class="btn btn-outline btn-sm btn-icon" 
          onclick="updateQuantity(${index}, ${item.quantity - 1})"
          style="width: 32px; height: 32px;"
          data-testid="button-decrease-qty-${index}"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        
        <span class="font-mono" style="min-width: 32px; text-align: center;" data-testid="text-qty-${index}">${item.quantity}</span>
        
        <button 
          class="btn btn-outline btn-sm btn-icon" 
          onclick="updateQuantity(${index}, ${item.quantity + 1})"
          style="width: 32px; height: 32px;"
          data-testid="button-increase-qty-${index}"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        
        <button 
          class="btn btn-error btn-sm btn-icon" 
          onclick="removeFromCart(${index})"
          style="width: 32px; height: 32px; margin-left: 8px;"
          data-testid="button-remove-${index}"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      
      <div class="font-mono" style="font-weight: 500; min-width: 80px; text-align: right;" data-testid="text-item-total-${index}">
        ${formatCurrency(item.product.price * item.quantity)}
      </div>
    </div>
  `).join('');
}

function calculateSubtotal() {
  return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
}

function calculateTax() {
  return calculateSubtotal() * 0.18;
}

function calculateTotal() {
  return calculateSubtotal() + calculateTax();
}

function updateCartDisplay() {
  const cartItemsEl = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('subtotal');
  const taxEl = document.getElementById('tax');
  const totalEl = document.getElementById('total');
  const checkoutBtn = document.getElementById('checkoutBtn');
  
  if (cartItemsEl) cartItemsEl.innerHTML = renderCartItems();
  if (subtotalEl) subtotalEl.textContent = formatCurrency(calculateSubtotal());
  if (taxEl) taxEl.textContent = formatCurrency(calculateTax());
  if (totalEl) totalEl.textContent = formatCurrency(calculateTotal());
  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
}

export async function init(app) {
  try {
    products = await api.getProducts({ isActive: true });
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
      productsGrid.innerHTML = renderProductCards();
    }
  } catch (error) {
    console.error('Failed to load products:', error);
    showToast('Failed to load products', 'error');
  }
  
  // Expose functions globally
  window.addToCart = addToCart;
  window.removeFromCart = removeFromCart;
  window.updateQuantity = updateQuantity;
  window.clearCart = clearCart;
  window.searchProducts = searchProducts;
  window.searchCustomer = searchCustomer;
  window.selectPaymentMethod = selectPaymentMethod;
  window.completeSale = completeSale;
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const existingItem = cart.find(item => item.product.id === productId);
  
  if (existingItem) {
    if (existingItem.quantity < product.stockQuantity) {
      existingItem.quantity++;
    } else {
      showToast('Not enough stock available', 'warning');
      return;
    }
  } else {
    if (product.stockQuantity > 0) {
      cart.push({ product, quantity: 1 });
    } else {
      showToast('Product out of stock', 'warning');
      return;
    }
  }
  
  updateCartDisplay();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartDisplay();
}

function updateQuantity(index, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(index);
    return;
  }
  
  const item = cart[index];
  if (newQuantity > item.product.stockQuantity) {
    showToast('Not enough stock available', 'warning');
    return;
  }
  
  item.quantity = newQuantity;
  updateCartDisplay();
}

function clearCart() {
  if (cart.length === 0) return;
  
  if (confirm('Clear all items from cart?')) {
    cart = [];
    selectedCustomer = null;
    document.getElementById('selectedCustomer').innerHTML = '';
    updateCartDisplay();
  }
}

function searchProducts() {
  const searchTerm = document.getElementById('posSearchInput').value.toLowerCase();
  const productsGrid = document.getElementById('productsGrid');
  
  const filtered = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    (product.brand && product.brand.toLowerCase().includes(searchTerm)) ||
    (product.model && product.model.toLowerCase().includes(searchTerm))
  );
  
  if (productsGrid) {
    productsGrid.innerHTML = filtered.map(product => `
      <div 
        class="card" 
        style="padding: 12px; cursor: pointer; transition: all 150ms ease;"
        onclick="addToCart(${product.id})"
        onmouseover="this.style.boxShadow='var(--shadow)'"
        onmouseout="this.style.boxShadow='var(--shadow-sm)'"
        data-testid="card-product-${product.id}"
      >
        <div style="font-weight: 500; margin-bottom: 4px; font-size: 0.875rem;">${product.name}</div>
        <div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 8px;">${product.brand || ''} ${product.model || ''}</div>
        <div class="flex justify-between items-center">
          <span class="font-mono" style="font-weight: 500;">${formatCurrency(product.price)}</span>
          <span class="badge ${product.stockQuantity > product.minStockLevel ? 'badge-success' : 'badge-warning'}" style="font-size: 0.625rem;">
            ${product.stockQuantity} in stock
          </span>
        </div>
      </div>
    `).join('');
  }
}

async function searchCustomer() {
  const phone = document.getElementById('customerSearch').value.trim();
  if (!phone) {
    showToast('Please enter a phone number', 'warning');
    return;
  }
  
  try {
    const customers = await api.getCustomers({ phone });
    if (customers && customers.length > 0) {
      selectedCustomer = customers[0];
      document.getElementById('selectedCustomer').innerHTML = `
        <div class="alert alert-success" data-testid="selected-customer">
          <strong>${selectedCustomer.name}</strong> (${selectedCustomer.phone})
        </div>
      `;
    } else {
      showToast('Customer not found', 'info');
      selectedCustomer = null;
      document.getElementById('selectedCustomer').innerHTML = '';
    }
  } catch (error) {
    showToast('Failed to search customer', 'error');
  }
}

function selectPaymentMethod(method) {
  document.querySelectorAll('.payment-method').forEach(btn => {
    btn.classList.remove('active', 'btn-primary');
    btn.classList.add('btn-outline');
  });
  
  const selectedBtn = document.querySelector(`[data-method="${method}"]`);
  if (selectedBtn) {
    selectedBtn.classList.remove('btn-outline');
    selectedBtn.classList.add('btn-primary', 'active');
  }
}

async function completeSale() {
  if (cart.length === 0) {
    showToast('Cart is empty', 'warning');
    return;
  }
  
  const paymentMethodBtn = document.querySelector('.payment-method.active');
  const paymentMethod = paymentMethodBtn ? paymentMethodBtn.dataset.method : 'cash';
  
  const saleData = {
    invoiceNumber: generateInvoiceNumber(),
    customerId: selectedCustomer ? selectedCustomer.id : null,
    subtotal: calculateSubtotal(),
    discount: 0,
    taxAmount: calculateTax(),
    totalAmount: calculateTotal(),
    paymentMethod,
    paymentStatus: 'completed',
    items: cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
      costPrice: item.product.costPrice || item.product.price * 0.7,
    })),
  };
  
  const checkoutBtn = document.getElementById('checkoutBtn');
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = 'Processing...';
  
  try {
    const result = await api.createSale(saleData);
    showToast('Sale completed successfully!', 'success');
    
    // Clear cart
    cart = [];
    selectedCustomer = null;
    document.getElementById('customerSearch').value = '';
    document.getElementById('selectedCustomer').innerHTML = '';
    updateCartDisplay();
    
    // Ask if user wants to print invoice
    if (confirm('Sale completed! Do you want to view the invoice?')) {
      window.app.navigate('sales');
    }
  } catch (error) {
    showToast(error.message || 'Failed to complete sale', 'error');
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Complete Sale';
  }
}
