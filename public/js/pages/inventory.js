import { wrapWithLayout } from '../components/layout.js';
import { api } from '../api.js';
import { formatCurrency, formatNumber, showToast } from '../utils.js';

let products = [];
let filteredProducts = [];
let currentFilter = 'all';

export function render(app) {
  return wrapWithLayout(`
    <div class="page-header">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="page-title">Inventory Management</h1>
          <p class="page-subtitle">Manage your product inventory</p>
        </div>
        <button 
          class="btn btn-primary" 
          onclick="openAddProductModal()"
          data-testid="button-add-new-product"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Product
        </button>
      </div>
    </div>
    
    <!-- Filters -->
    <div class="card mb-6">
      <div class="flex gap-4 items-center">
        <div class="flex-1">
          <input 
            type="search" 
            class="form-input" 
            placeholder="Search by name, brand, model, or IMEI..." 
            id="searchInput"
            data-testid="input-search-products"
            oninput="filterProducts()"
          />
        </div>
        
        <div style="display: flex; gap: 8px;">
          <button 
            class="btn ${currentFilter === 'all' ? 'btn-primary' : 'btn-outline'} btn-sm"
            onclick="setFilter('all')"
            data-testid="filter-all"
          >
            All
          </button>
          <button 
            class="btn ${currentFilter === 'smartphone' ? 'btn-primary' : 'btn-outline'} btn-sm"
            onclick="setFilter('smartphone')"
            data-testid="filter-smartphone"
          >
            Smartphones
          </button>
          <button 
            class="btn ${currentFilter === 'accessory' ? 'btn-primary' : 'btn-outline'} btn-sm"
            onclick="setFilter('accessory')"
            data-testid="filter-accessory"
          >
            Accessories
          </button>
          <button 
            class="btn ${currentFilter === 'low-stock' ? 'btn-primary' : 'btn-outline'} btn-sm"
            onclick="setFilter('low-stock')"
            data-testid="filter-low-stock"
          >
            Low Stock
          </button>
        </div>
      </div>
    </div>
    
    <!-- Products Table -->
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Brand</th>
            <th>Model</th>
            <th>Category</th>
            <th>IMEI</th>
            <th>Stock</th>
            <th>Cost Price</th>
            <th>Selling Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="productsTableBody">
          ${renderProductRows()}
        </tbody>
      </table>
    </div>
    
    <!-- Add/Edit Product Modal -->
    <div id="productModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="modalTitle">Add New Product</h3>
          <button class="modal-close" onclick="closeProductModal()" data-testid="button-close-modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <form id="productForm">
            <input type="hidden" id="productId" />
            
            <div style="display: grid; grid-template-columns: 1fr 250px; gap: 24px;">
              <!-- Left side: Form fields -->
              <div class="grid grid-cols-3 gap-4">
              <!-- Row 1: Product Code, Product Name (span 2) -->
              <div class="form-group">
                <label for="productCode" class="form-label">Product Code</label>
                <input type="text" id="productCode" class="form-input" data-testid="input-product-code" />
              </div>
              
              <div class="form-group" style="grid-column: span 2;">
                <label for="productName" class="form-label">Product Name*</label>
                <input type="text" id="productName" class="form-input" required data-testid="input-product-name" />
              </div>
              
              <!-- Row 2: Category (span 3) -->
              <div class="form-group" style="grid-column: span 3;">
                <label for="productCategory" class="form-label">Category*</label>
                <select id="productCategory" class="form-select" required data-testid="select-product-category">
                  <option value="">Select category</option>
                  <option value="smartphone">Smartphone</option>
                  <option value="feature_phone">Feature Phone</option>
                  <option value="accessory">Accessory</option>
                  <option value="spare_part">Spare Part</option>
                </select>
              </div>
              
              <!-- Row 4: HSN Code, Part/Group, (empty) -->
              <div class="form-group">
                <label for="productHSN" class="form-label">HSN Code</label>
                <input type="text" id="productHSN" class="form-input" data-testid="input-product-hsn" />
              </div>
              
              <div class="form-group">
                <label for="productPart" class="form-label">Part/Group</label>
                <input type="text" id="productPart" class="form-input" data-testid="input-product-part" />
              </div>
              
              <div class="form-group"></div>
              
              <!-- Price Info Section (2-column layout) -->
              <div style="grid-column: span 3; margin-top: 16px; margin-bottom: 8px;">
                <h4 style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">Price Info (Fill Compulsory):</h4>
              </div>
              
              <!-- Left Column -->
              <div style="grid-column: span 1;">
                <div class="form-group">
                  <label for="productCostPrice" class="form-label">Purchase Price*</label>
                  <input type="number" id="productCostPrice" class="form-input" step="0.01" required data-testid="input-product-cost-price" />
                </div>
                
                <div class="form-group">
                  <label for="productMinStock" class="form-label">Min Stock</label>
                  <input type="number" id="productMinStock" class="form-input" value="0" data-testid="input-product-min-stock" />
                </div>
                
                <div class="form-group">
                  <label for="productSalesDiscount" class="form-label">Sales Discount %</label>
                  <input type="number" id="productSalesDiscount" class="form-input" step="0.01" value="0.00" data-testid="input-product-sales-discount" />
                </div>
                
                <div class="form-group">
                  <label for="productPurchaseUnit" class="form-label">Purchase Main Unit</label>
                  <input type="text" id="productPurchaseUnit" class="form-input" placeholder="GST %" data-testid="input-product-purchase-unit" />
                </div>
                
                <div class="form-group">
                  <label for="productSalesUnit" class="form-label">Sales Main Unit</label>
                  <input type="text" id="productSalesUnit" class="form-input" placeholder="LOT NO" data-testid="input-product-sales-unit" />
                </div>
                
                <div class="form-group">
                  <label for="productAlterUnit" class="form-label">Alter Unit</label>
                  <input type="text" id="productAlterUnit" class="form-input" data-testid="input-product-alter-unit" />
                </div>
              </div>
              
              <!-- Right Column -->
              <div style="grid-column: span 2;">
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: start; margin-bottom: 16px;">
                  <div style="padding-top: 32px;">
                    <label class="form-label" style="margin-bottom: 0; white-space: nowrap;">Margin %:</label>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                      <input type="number" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" />
                      <input type="number" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" />
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                      <input type="number" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" />
                      <input type="number" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" />
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                      <input type="number" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" />
                      <input type="number" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" />
                    </div>
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: center; margin-bottom: 16px;">
                  <label for="productMRP" class="form-label" style="margin: 0;">MRP:</label>
                  <input type="number" id="productMRP" class="form-input" step="0.01" value="0.00" data-testid="input-product-mrp" style="margin: 0;" />
                </div>
                
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: center; margin-bottom: 16px;">
                  <label for="productPrice" class="form-label" style="margin: 0;">Retail Sale Price*:</label>
                  <input type="number" id="productPrice" class="form-input" step="0.01" required data-testid="input-product-price" style="margin: 0;" />
                </div>
                
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: center; margin-bottom: 16px;">
                  <label for="productWholesalePrice" class="form-label" style="margin: 0;">Wholesale Price:</label>
                  <input type="number" id="productWholesalePrice" class="form-input" step="0.01" value="0.00" data-testid="input-product-wholesale-price" style="margin: 0;" />
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                  <div class="form-group" style="margin: 0;">
                    <label for="productGST" class="form-label">GST %</label>
                    <input type="number" id="productGST" class="form-input" step="0.01" value="0.00" data-testid="input-product-gst" />
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                    <div style="text-align: center;">
                      <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">CGST %:</label>
                      <input type="number" class="form-input" step="0.01" value="0.00" style="text-align: center;" readonly />
                    </div>
                    <div style="text-align: center;">
                      <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">SGST/UTGST %:</label>
                      <input type="number" id="productSGST" class="form-input" step="0.01" value="0.00" data-testid="input-product-sgst" style="text-align: center;" readonly />
                    </div>
                    <div style="text-align: center;">
                      <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">IGST %:</label>
                      <input type="number" class="form-input" step="0.01" value="0.00" style="text-align: center;" readonly />
                    </div>
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div></div>
                  <div class="form-group" style="margin: 0;">
                    <label for="productCESS" class="form-label">CESS %</label>
                    <input type="number" id="productCESS" class="form-input" step="0.01" value="0.00" data-testid="input-product-cess" />
                  </div>
                </div>
              </div>
              
              <!-- Row 11: (empty row for spacing) -->
              <div class="form-group"></div>
              <div class="form-group"></div>
              <div class="form-group"></div>
              
              <!-- Row 12: Opening Stock (Optional Exceed Barcode), Quantity, Barcode -->
              <div class="form-group">
                <label for="productStock" class="form-label">Opening Stock (Optional Exceed Barcode)*</label>
                <input type="number" id="productStock" class="form-input" required value="0" data-testid="input-product-stock" />
              </div>
              
              <div class="form-group">
                <label for="productDefaultQty" class="form-label">Quantity</label>
                <input type="number" id="productDefaultQty" class="form-input" value="1" data-testid="input-product-default-qty" />
              </div>
              
              <div class="form-group">
                <label for="productBarcode" class="form-label">Barcode</label>
                <input type="text" id="productBarcode" class="form-input" data-testid="input-product-barcode" />
              </div>
              
              <!-- Row 13: Storage/Godown, Rack/Location, (empty) -->
              <div class="form-group">
                <label for="productStorage" class="form-label">Storage / Godown</label>
                <input type="text" id="productStorage" class="form-input" data-testid="input-product-storage" />
              </div>
              
              <div class="form-group">
                <label for="productRack" class="form-label">Rack / Location</label>
                <input type="text" id="productRack" class="form-input" data-testid="input-product-rack" />
              </div>
              
              <div class="form-group"></div>
              
              <!-- Row 14: Tax Type on Sale, Tax Type on Purchase, Default Sale Qty -->
              <div class="form-group">
                <label for="productTaxTypeSale" class="form-label">Tax Type on Sale</label>
                <select id="productTaxTypeSale" class="form-select" data-testid="select-product-tax-type-sale">
                  <option value="inclusive">Inclusive</option>
                  <option value="exclusive">Exclusive</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="productTaxTypePurchase" class="form-label">Tax Type on Purchase</label>
                <select id="productTaxTypePurchase" class="form-select" data-testid="select-product-tax-type-purchase">
                  <option value="inclusive">Inclusive</option>
                  <option value="exclusive">Exclusive</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="productModel" class="form-label">Default Sale Qty</label>
                <input type="text" id="productModel" class="form-input" data-testid="input-product-model" />
              </div>
              
              <!-- Row 15: Order Print Heading (span 2), (empty) -->
              <div class="form-group" style="grid-column: span 2;">
                <label for="productOrderPrintHeading" class="form-label">Order Print Heading (Optional)</label>
                <input type="text" id="productOrderPrintHeading" class="form-input" data-testid="input-product-order-print-heading" />
              </div>
              
              <div class="form-group"></div>
              
              <!-- Row 16: Color, RAM, IMEI Number -->
              <div class="form-group">
                <label for="productColor" class="form-label">Color</label>
                <input type="text" id="productColor" class="form-input" data-testid="input-product-color" />
              </div>
              
              <div class="form-group">
                <label for="productRAM" class="form-label">RAM</label>
                <input type="text" id="productRAM" class="form-input" data-testid="input-product-ram" />
              </div>
              
              <div class="form-group">
                <label for="productIMEI" class="form-label">IMEI Number</label>
                <input type="text" id="productIMEI" class="form-input" maxlength="15" data-testid="input-product-imei" />
              </div>
              </div>
              
              <!-- Right side: Image upload section -->
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="border: 2px dashed var(--border); border-radius: 8px; padding: 16px; text-align: center; background: var(--bg-secondary); min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                  <input type="file" id="productImageInput" accept="image/*" style="display: none;" onchange="handleImageSelect(event)" data-testid="input-product-image" />
                  <div id="imagePreview" style="width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                    <div style="text-align: center; color: var(--text-secondary);">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin: 0 auto 8px; opacity: 0.5;">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <div style="font-size: 0.875rem; font-weight: 600;">NO IMAGE AVAILABLE</div>
                    </div>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('productImageInput').click()" data-testid="button-upload-image">
                    Upload Image
                  </button>
                  <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;">Image Limit: 10</p>
                </div>
                
                <div style="padding: 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-tertiary);">
                  <label for="productImageUrl" class="form-label" style="margin-bottom: 4px;">Photo URL</label>
                  <input 
                    type="text" 
                    id="productImageUrl" 
                    class="form-input" 
                    placeholder="Or paste image URL" 
                    oninput="updateImagePreview()"
                    data-testid="input-product-image-url"
                    style="margin: 0;"
                  />
                </div>
              </div>
            </div>
            
            <div class="form-group" style="margin-top: 16px;">
              <label for="productDescription" class="form-label">Description</label>
              <textarea id="productDescription" class="form-textarea" rows="3" data-testid="textarea-product-description"></textarea>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeProductModal()" data-testid="button-cancel">Cancel</button>
          <button class="btn btn-primary" onclick="saveProduct()" data-testid="button-save-product">Save Product</button>
        </div>
      </div>
    </div>
  `, 'inventory', app.user);
}

function renderProductRows() {
  if (!filteredProducts || filteredProducts.length === 0) {
    return `
      <tr>
        <td colspan="9" class="text-center" style="padding: 48px;">
          <div style="color: var(--text-secondary);">
            <p>No products found</p>
            <button class="btn btn-primary btn-sm mt-4" onclick="openAddProductModal()">Add Your First Product</button>
          </div>
        </td>
      </tr>
    `;
  }
  
  return filteredProducts.map(product => `
    <tr data-product-id="${product.id}" data-testid="row-product-${product.id}">
      <td><strong>${product.name}</strong></td>
      <td>${product.brand || '-'}</td>
      <td>${product.model || '-'}</td>
      <td>
        <span class="badge badge-${getCategoryColor(product.category)}">
          ${formatCategory(product.category)}
        </span>
      </td>
      <td class="font-mono">${product.imeiNumber || '-'}</td>
      <td>
        <span class="badge ${product.stockQuantity <= product.minStockLevel ? 'badge-error' : 'badge-success'}" data-testid="badge-stock-${product.id}">
          ${product.stockQuantity} ${product.stockQuantity <= product.minStockLevel ? '⚠' : ''}
        </span>
      </td>
      <td class="font-mono">${formatCurrency(product.costPrice)}</td>
      <td class="font-mono"><strong>${formatCurrency(product.price)}</strong></td>
      <td>
        <div class="flex gap-2">
          <button 
            class="btn btn-outline btn-sm btn-icon" 
            onclick="editProduct(${product.id})"
            data-testid="button-edit-${product.id}"
            title="Edit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button 
            class="btn btn-error btn-sm btn-icon" 
            onclick="deleteProduct(${product.id})"
            data-testid="button-delete-${product.id}"
            title="Delete"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getCategoryColor(category) {
  const colors = {
    smartphone: 'primary',
    feature_phone: 'info',
    accessory: 'warning',
    spare_part: 'secondary',
  };
  return colors[category] || 'primary';
}

function formatCategory(category) {
  return category.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export async function init(app) {
  try {
    products = await api.getProducts();
    filteredProducts = products;
    updateProductsTable();
  } catch (error) {
    console.error('Failed to load products:', error);
    showToast('Failed to load products', 'error');
  }
  
  // Expose functions globally for onclick handlers
  window.openAddProductModal = openAddProductModal;
  window.closeProductModal = closeProductModal;
  window.saveProduct = saveProduct;
  window.editProduct = editProduct;
  window.deleteProduct = deleteProduct;
  window.filterProducts = filterProducts;
  window.setFilter = setFilter;
  window.handleImageSelect = handleImageSelect;
  window.updateImagePreview = updateImagePreview;
}

function openAddProductModal() {
  document.getElementById('modalTitle').textContent = 'Add New Product';
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('productModal').classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden');
}

async function saveProduct() {
  const form = document.getElementById('productForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const productId = document.getElementById('productId').value;
  const productData = {
    name: document.getElementById('productName').value,
    nameHindi: null,
    nameConvertLatin: null,
    brand: null,
    sizeBrand: null,
    model: document.getElementById('productModel').value || null,
    category: document.getElementById('productCategory').value,
    imeiNumber: document.getElementById('productIMEI').value || null,
    color: document.getElementById('productColor').value || null,
    storage: document.getElementById('productStorage').value || null,
    ram: document.getElementById('productRAM').value || null,
    costPrice: parseFloat(document.getElementById('productCostPrice').value) || 0,
    price: parseFloat(document.getElementById('productPrice').value) || 0,
    stockQuantity: parseInt(document.getElementById('productStock').value) || 0,
    minStockLevel: parseInt(document.getElementById('productMinStock').value) || 0,
    description: document.getElementById('productDescription').value || null,
    imageUrl: document.getElementById('productImageUrl').value || null,
    isActive: true,
    // Extended fields
    productCode: document.getElementById('productCode').value || `PRD${Date.now()}`,
    hsnCode: document.getElementById('productHSN').value || null,
    partGroup: document.getElementById('productPart').value || null,
    unitCategory: document.getElementById('productUnitCategory').value || null,
    salesDiscount: parseFloat(document.getElementById('productSalesDiscount').value) || 0,
    purchaseUnit: document.getElementById('productPurchaseUnit').value || null,
    salesUnit: document.getElementById('productSalesUnit').value || null,
    alterUnit: document.getElementById('productAlterUnit').value || null,
    mrp: parseFloat(document.getElementById('productMRP').value) || 0,
    wholesalePrice: parseFloat(document.getElementById('productWholesalePrice').value) || 0,
    gst: parseFloat(document.getElementById('productGST').value) || 0,
    sgst: parseFloat(document.getElementById('productSGST').value) || 0,
    cess: parseFloat(document.getElementById('productCESS').value) || 0,
    barcode: document.getElementById('productBarcode').value || null,
    rack: document.getElementById('productRack').value || null,
    defaultQty: parseInt(document.getElementById('productDefaultQty').value) || 1,
    taxTypeSale: document.getElementById('productTaxTypeSale').value || 'inclusive',
    taxTypePurchase: document.getElementById('productTaxTypePurchase').value || 'inclusive',
    orderPrintHeading: document.getElementById('productOrderPrintHeading').value || null,
  };
  
  try {
    if (productId) {
      await api.updateProduct(productId, productData);
      showToast('Product updated successfully', 'success');
    } else {
      await api.createProduct(productData);
      showToast('Product added successfully', 'success');
    }
    
    closeProductModal();
    products = await api.getProducts();
    filteredProducts = products;
    updateProductsTable();
  } catch (error) {
    showToast(error.message || 'Failed to save product', 'error');
  }
}

async function editProduct(id) {
  try {
    const product = await api.getProduct(id);
    
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product.id;
    document.getElementById('productCode').value = product.productCode || '';
    document.getElementById('productName').value = product.name;
    document.getElementById('productModel').value = product.model || '';
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productIMEI').value = product.imeiNumber || '';
    document.getElementById('productColor').value = product.color || '';
    document.getElementById('productStorage').value = product.storage || '';
    document.getElementById('productRAM').value = product.ram || '';
    document.getElementById('productCostPrice').value = product.costPrice;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stockQuantity;
    document.getElementById('productMinStock').value = product.minStockLevel || 0;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productImageUrl').value = product.imageUrl || '';
    
    // Extended fields
    document.getElementById('productHSN').value = product.hsnCode || '';
    document.getElementById('productPart').value = product.partGroup || '';
    document.getElementById('productUnitCategory').value = product.unitCategory || '';
    document.getElementById('productSalesDiscount').value = product.salesDiscount || 0;
    document.getElementById('productPurchaseUnit').value = product.purchaseUnit || '';
    document.getElementById('productSalesUnit').value = product.salesUnit || '';
    document.getElementById('productAlterUnit').value = product.alterUnit || '';
    document.getElementById('productMRP').value = product.mrp || 0;
    document.getElementById('productWholesalePrice').value = product.wholesalePrice || 0;
    document.getElementById('productGST').value = product.gst || 0;
    document.getElementById('productSGST').value = product.sgst || 0;
    document.getElementById('productCESS').value = product.cess || 0;
    document.getElementById('productBarcode').value = product.barcode || '';
    document.getElementById('productRack').value = product.rack || '';
    document.getElementById('productDefaultQty').value = product.defaultQty || 1;
    document.getElementById('productTaxTypeSale').value = product.taxTypeSale || 'inclusive';
    document.getElementById('productTaxTypePurchase').value = product.taxTypePurchase || 'inclusive';
    document.getElementById('productOrderPrintHeading').value = product.orderPrintHeading || '';
    
    // Update image preview
    if (product.imageUrl) {
      updateImagePreview();
    }
    
    document.getElementById('productModal').classList.remove('hidden');
  } catch (error) {
    showToast('Failed to load product details', 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }
  
  try {
    await api.deleteProduct(id);
    showToast('Product deleted successfully', 'success');
    products = await api.getProducts();
    filteredProducts = products;
    updateProductsTable();
  } catch (error) {
    showToast(error.message || 'Failed to delete product', 'error');
  }
}

function filterProducts() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm) ||
      (product.brand && product.brand.toLowerCase().includes(searchTerm)) ||
      (product.model && product.model.toLowerCase().includes(searchTerm)) ||
      (product.imeiNumber && product.imeiNumber.includes(searchTerm));
    
    if (currentFilter === 'all') {
      return matchesSearch;
    } else if (currentFilter === 'low-stock') {
      return matchesSearch && product.stockQuantity <= product.minStockLevel;
    } else {
      return matchesSearch && product.category === currentFilter;
    }
  });
  
  updateProductsTable();
}

function setFilter(filter) {
  currentFilter = filter;
  filterProducts();
}

function updateProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (tbody) {
    tbody.innerHTML = renderProductRows();
  }
}

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const imagePreview = document.getElementById('imagePreview');
      imagePreview.innerHTML = `
        <img src="${e.target.result}" alt="Product preview" style="max-width: 100%; max-height: 200px; border-radius: 4px;" />
      `;
      document.getElementById('productImageUrl').value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function updateImagePreview() {
  const imageUrl = document.getElementById('productImageUrl').value;
  const imagePreview = document.getElementById('imagePreview');
  
  if (imageUrl) {
    imagePreview.innerHTML = `
      <img src="${imageUrl}" alt="Product preview" style="max-width: 100%; max-height: 200px; border-radius: 4px;" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'text-align: center; color: var(--text-secondary);\\'>Invalid image URL</div>';" />
    `;
  } else {
    imagePreview.innerHTML = `
      <div style="text-align: center; color: var(--text-secondary);">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin: 0 auto 8px; opacity: 0.5;">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <div style="font-size: 0.875rem; font-weight: 600;">NO IMAGE AVAILABLE</div>
      </div>
    `;
  }
}
