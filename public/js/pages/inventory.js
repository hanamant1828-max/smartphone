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
                <div style="display: grid; grid-template-columns: auto 1fr 1fr; gap: 16px; align-items: center; margin-bottom: 16px;">
                  <label class="form-label" style="margin: 0; white-space: nowrap;"></label>
                  <div style="text-align: center; font-weight: 500; color: var(--text-secondary); font-size: 0.9rem;">Margin %:</div>
                  <div></div>
                </div>

                <div style="display: grid; grid-template-columns: auto 1fr 1fr; gap: 16px; align-items: center; margin-bottom: 16px;">
                  <label for="productMRP" class="form-label" style="margin: 0; white-space: nowrap;">MRP:</label>
                  <input type="number" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" data-testid="input-margin-mrp-1" />
                  <input type="number" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" data-testid="input-margin-mrp-2" />
                </div>

                <div style="display: grid; grid-template-columns: auto 1fr 1fr; gap: 16px; align-items: center; margin-bottom: 16px;">
                  <label for="productPrice" class="form-label" style="margin: 0; white-space: nowrap;">Retail Sale Price*:</label>
                  <input type="number" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" data-testid="input-margin-retail-1" />
                  <input type="number" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" data-testid="input-margin-retail-2" />
                </div>

                <div style="display: grid; grid-template-columns: auto 1fr 1fr; gap: 16px; align-items: center; margin-bottom: 16px;">
                  <label for="productWholesalePrice" class="form-label" style="margin: 0; white-space: nowrap;">Wholesale Price:</label>
                  <input type="number" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" data-testid="input-margin-wholesale-1" />
                  <input type="number" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" data-testid="input-margin-wholesale-2" />
                </div>

                <div style="margin-top: 24px; margin-bottom: 16px;">
                  <input type="number" id="productMRP" class="form-input" step="0.01" value="0.00" data-testid="input-product-mrp" style="display: none;" />
                  <input type="number" id="productPrice" class="form-input" step="0.01" required data-testid="input-product-price" style="display: none;" />
                  <input type="number" id="productWholesalePrice" class="form-input" step="0.01" value="0.00" data-testid="input-product-wholesale-price" style="display: none;" />
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

              <!-- Row 12: Opening Stock section header -->
              <div style="grid-column: span 3; margin-top: 8px; margin-bottom: 4px;">
                <label class="form-label" style="font-weight: 500;">Opening Stock (Optional Except Barcode):</label>
              </div>

              <!-- Row 13: Quantity and Barcode fields -->
              <div class="form-group">
                <label for="productDefaultQty" class="form-label">Quantity:</label>
                <input type="number" id="productDefaultQty" class="form-input" value="10" data-testid="input-product-default-qty" style="background-color: #ffffcc;" />
              </div>

              <div class="form-group">
                <label for="productBarcode" class="form-label">Barcode:</label>
                <input type="text" id="productBarcode" class="form-input" data-testid="input-product-barcode" style="background-color: #ffffcc;" />
              </div>

              <div class="form-group"></div>

              <!-- Row 13a: Batch/Serial No., Mfg Date, Expiry Date -->
              <div class="form-group">
                <label for="productBatchSerialNo" class="form-label">Batch/Serial No.:</label>
                <input type="text" id="productBatchSerialNo" class="form-input" data-testid="input-product-batch-serial" />
              </div>

              <div class="form-group">
                <label for="productMfgDate" class="form-label">Mfg. Date:</label>
                <input type="date" id="productMfgDate" class="form-input" data-testid="input-product-mfg-date" />
              </div>

              <div class="form-group">
                <label for="productExpiryDate" class="form-label">Expiry Date:</label>
                <input type="date" id="productExpiryDate" class="form-input" data-testid="input-product-expiry-date" />
              </div>

              <!-- Hidden stock field for backward compatibility -->
              <input type="number" id="productStock" value="0" data-testid="input-product-stock" style="display: none;" />

              <!-- Row 14: Storage/Godown, Rack/Location, (empty) -->
              <div class="form-group">
                <label for="productStorage" class="form-label">Storage / Godown:</label>
                <select id="productStorage" class="form-select" data-testid="select-product-storage" style="background-color: #ffffcc;">
                  <option value="">Select Storage/Godown</option>
                  <option value="main_warehouse">Main Warehouse</option>
                  <option value="godown_a">Godown A</option>
                  <option value="godown_b">Godown B</option>
                  <option value="shop_floor">Shop Floor</option>
                  <option value="back_store">Back Store</option>
                </select>
              </div>

              <div class="form-group">
                <label for="productRack" class="form-label">Rack / Location:</label>
                <select id="productRack" class="form-select" data-testid="select-product-rack" style="background-color: #ffffcc;">
                  <option value="">Select Rack/Location</option>
                  <option value="rack_a1">Rack A1</option>
                  <option value="rack_a2">Rack A2</option>
                  <option value="rack_b1">Rack B1</option>
                  <option value="rack_b2">Rack B2</option>
                  <option value="rack_c1">Rack C1</option>
                  <option value="shelf_1">Shelf 1</option>
                  <option value="shelf_2">Shelf 2</option>
                </select>
              </div>

              <div class="form-group"></div>

              <!-- Row 15: Tax Type on Sale, Tax Type on Purchase, Default Sale Qty -->
              <div class="form-group">
                <label for="productTaxTypeSale" class="form-label">Tax Type on Sale:</label>
                <select id="productTaxTypeSale" class="form-select" data-testid="select-product-tax-type-sale">
                  <option value="inclusive">Inclusive</option>
                  <option value="exclusive">Exclusive</option>
                </select>
              </div>

              <div class="form-group">
                <label for="productTaxTypePurchase" class="form-label">Tax Type on Purchase:</label>
                <select id="productTaxTypePurchase" class="form-select" data-testid="select-product-tax-type-purchase">
                  <option value="inclusive">Inclusive</option>
                  <option value="exclusive">Exclusive</option>
                </select>
              </div>

              <div class="form-group">
                <label for="productDefaultSaleQty" class="form-label">Default Sale Qty:</label>
                <input type="number" id="productDefaultSaleQty" class="form-input" value="1" data-testid="input-product-default-sale-qty" style="background-color: #ffffcc;" />
              </div>

              <!-- Row 16: Order Print Section (span 2), (empty) -->
              <div class="form-group" style="grid-column: span 2;">
                <label for="productOrderPrintSection" class="form-label">Order Print Section (Optional):</label>
                <select id="productOrderPrintSection" class="form-select" data-testid="select-product-order-print-section">
                  <option value="">Select Print Section</option>
                  <option value="header">Header Section</option>
                  <option value="body">Body Section</option>
                  <option value="footer">Footer Section</option>
                  <option value="terms">Terms & Conditions</option>
                  <option value="custom">Custom Section</option>
                </select>
              </div>

              <div class="form-group"></div>

              <!-- Row 17: Color, RAM, IMEI Number -->
              <div class="form-group">
                <label for="productColor" class="form-label">Color:</label>
                <input type="text" id="productColor" class="form-input" data-testid="input-product-color" />
              </div>

              <div class="form-group">
                <label for="productRAM" class="form-label">RAM:</label>
                <input type="text" id="productRAM" class="form-input" data-testid="input-product-ram" />
              </div>

              <div class="form-group">
                <label for="productIMEI" class="form-label">IMEI Number:</label>
                <input type="text" id="productIMEI" class="form-input" maxlength="15" data-testid="input-product-imei" />
              </div>
              </div>

              <!-- Right side: Image upload section -->
              <!-- This section has been removed as per the request -->
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
  // window.handleImageSelect = handleImageSelect; // Removed
  // window.updateImagePreview = updateImagePreview; // Removed
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
    brand: null, // This field is not present in the form, so it's null
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
    imageUrl: document.getElementById('productImageUrl').value || null, // This will be null if not explicitly set, but the UI elements for it are gone.
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
    defaultSaleQty: parseInt(document.getElementById('productDefaultSaleQty').value) || 1,
    orderPrintSection: document.getElementById('productOrderPrintSection').value || null,
    batchSerialNo: document.getElementById('productBatchSerialNo').value || null,
    mfgDate: document.getElementById('productMfgDate').value ? new Date(document.getElementById('productMfgDate').value).getTime() : null,
    expiryDate: document.getElementById('productExpiryDate').value ? new Date(document.getElementById('productExpiryDate').value).getTime() : null,
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
    document.getElementById('productDefaultSaleQty').value = product.defaultSaleQty || 1;
    document.getElementById('productOrderPrintSection').value = product.orderPrintSection || '';
    document.getElementById('productBatchSerialNo').value = product.batchSerialNo || '';
    document.getElementById('productMfgDate').value = product.mfgDate ? new Date(product.mfgDate).toISOString().split('T')[0] : '';
    document.getElementById('productExpiryDate').value = product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '';

    // Image preview update logic removed as the feature is removed.
    // if (product.imageUrl) {
    //   updateImagePreview(); // This function is no longer available
    // }

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

// Removed handleImageSelect and updateImagePreview functions as per instructions.