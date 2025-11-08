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
          <div style="text-align: center; padding: 48px; color: var(--text-secondary);">
            <p>All form fields have been removed.</p>
            <p style="margin-top: 8px; font-size: 0.875rem;">Ready for new form design.</p>
          </div>
          <form id="productForm" style="display: none;">
            <input type="hidden" id="productId" />
              

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
  window.updateModelOptions = updateModelOptions;
  window.calculateMarginFromPrice = calculateMarginFromPrice;
  window.handleMarginChange = handleMarginChange;
  window.recalculateAllPrices = recalculateAllPrices;
  window.calculateGSTComponents = calculateGSTComponents;
  window.incrementPriceQty = incrementPriceQty;
  window.syncPriceInfoQty = syncPriceInfoQty;
  window.updateProductAction = updateProductAction;
  window.deleteProductAction = deleteProductAction;
  window.getProductData = getProductData;
  window.generateBarcode = generateBarcode;
  window.handleProductImageSelect = handleProductImageSelect;
  window.clearProductImage = clearProductImage;
  window.showImageLibrary = showImageLibrary;
  // window.handleImageSelect = handleImageSelect; // Removed
  // window.updateImagePreview = updateImagePreview; // Removed
}

function updateProductAction() {
  const productId = document.getElementById('productId').value;
  if (!productId) {
    showToast('Please select a product to update', 'error');
    return;
  }
  saveProduct();
}

function deleteProductAction() {
  const productId = document.getElementById('productId').value;
  if (!productId) {
    showToast('Please select a product to delete', 'error');
    return;
  }
  deleteProduct(productId);
}

function getProductData() {
  const imei = document.getElementById('productIMEI').value;
  const barcode = document.getElementById('productBarcode').value;
  
  if (!imei && !barcode) {
    showToast('Please enter IMEI or Barcode to fetch data', 'info');
    return;
  }
  
  showToast('Fetching product data...', 'info');
  // Add your data fetching logic here
}

function generateBarcode() {
  const productCode = document.getElementById('productCode').value || `PRD${Date.now()}`;
  document.getElementById('productBarcode').value = productCode;
  showToast('Barcode generated', 'success');
}

function handleProductImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('productImagePreview');
      const placeholder = document.getElementById('noImagePlaceholder');
      preview.src = e.target.result;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      document.getElementById('productImageUrl').value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function clearProductImage() {
  const preview = document.getElementById('productImagePreview');
  const placeholder = document.getElementById('noImagePlaceholder');
  const input = document.getElementById('productImageInput');
  
  preview.src = '';
  preview.style.display = 'none';
  placeholder.style.display = 'block';
  input.value = '';
  document.getElementById('productImageUrl').value = '';
  
  showToast('Image cleared', 'info');
}

function showImageLibrary() {
  showToast('Online image library feature coming soon', 'info');
}

let isCalculating = false;

function calculateMarginFromPrice(priceType) {
  if (isCalculating) return;
  isCalculating = true;
  
  const costPrice = parseFloat(document.getElementById('productCostPrice').value) || 0;
  
  let priceField = null;
  let marginField = null;
  let hiddenField = null;
  
  if (priceType === 'mrp') {
    priceField = document.getElementById('priceMRP');
    marginField = document.getElementById('marginMRP');
    hiddenField = document.getElementById('productMRP');
  } else if (priceType === 'retail') {
    priceField = document.getElementById('priceRetail');
    marginField = document.getElementById('marginRetail');
    hiddenField = document.getElementById('productPrice');
  } else if (priceType === 'wholesale') {
    priceField = document.getElementById('priceWholesale');
    marginField = document.getElementById('marginWholesale');
    hiddenField = document.getElementById('productWholesalePrice');
  }
  
  if (priceField && marginField && hiddenField) {
    const price = parseFloat(priceField.value) || 0;
    hiddenField.value = price.toFixed(2);
    
    if (costPrice > 0 && price > 0) {
      const marginPercent = ((price - costPrice) / costPrice) * 100;
      marginField.value = marginPercent.toFixed(2);
    } else {
      marginField.value = '0.00';
    }
  }
  
  isCalculating = false;
}

function handleMarginChange(priceType) {
  if (isCalculating) return;
  isCalculating = true;
  
  const costPrice = parseFloat(document.getElementById('productCostPrice').value) || 0;
  
  let priceField = null;
  let marginField = null;
  let hiddenField = null;
  
  if (priceType === 'mrp') {
    priceField = document.getElementById('priceMRP');
    marginField = document.getElementById('marginMRP');
    hiddenField = document.getElementById('productMRP');
  } else if (priceType === 'retail') {
    priceField = document.getElementById('priceRetail');
    marginField = document.getElementById('marginRetail');
    hiddenField = document.getElementById('productPrice');
  } else if (priceType === 'wholesale') {
    priceField = document.getElementById('priceWholesale');
    marginField = document.getElementById('marginWholesale');
    hiddenField = document.getElementById('productWholesalePrice');
  }
  
  if (priceField && marginField && hiddenField) {
    const marginPercent = parseFloat(marginField.value) || 0;
    
    if (costPrice > 0) {
      const calculatedPrice = costPrice * (1 + marginPercent / 100);
      priceField.value = calculatedPrice.toFixed(2);
      hiddenField.value = calculatedPrice.toFixed(2);
    } else {
      priceField.value = '0.00';
      hiddenField.value = '0.00';
    }
  }
  
  isCalculating = false;
}

function recalculateAllPrices() {
  if (isCalculating) return;
  isCalculating = true;
  
  const costPrice = parseFloat(document.getElementById('productCostPrice').value) || 0;
  
  // Auto-calculate MRP from Purchase Price + MRP Margin %
  const marginMRPField = document.getElementById('marginMRP');
  const priceMRPField = document.getElementById('priceMRP');
  const hiddenMRPField = document.getElementById('productMRP');
  
  if (costPrice > 0 && marginMRPField && priceMRPField && hiddenMRPField) {
    const marginPercent = parseFloat(marginMRPField.value) || 0;
    if (marginPercent > 0) {
      const calculatedMRP = costPrice * (1 + marginPercent / 100);
      priceMRPField.value = calculatedMRP.toFixed(2);
      hiddenMRPField.value = calculatedMRP.toFixed(2);
    }
  }
  
  isCalculating = false;
  
  // Recalculate margins for all price types
  calculateMarginFromPrice('mrp');
  calculateMarginFromPrice('retail');
  calculateMarginFromPrice('wholesale');
}

function calculateGSTComponents() {
  const gstValue = parseFloat(document.getElementById('productGST').value) || 0;
  
  const cgst = gstValue / 2;
  const sgst = gstValue / 2;
  const igst = gstValue;
  
  document.getElementById('productCGST').value = cgst.toFixed(2);
  document.getElementById('productSGST').value = sgst.toFixed(2);
  document.getElementById('productIGST').value = igst.toFixed(2);
}

function incrementPriceQty() {
  const displayField = document.getElementById('priceInfoQtyDisplay');
  const actualField = document.getElementById('productDefaultQty');
  const currentValue = parseInt(displayField.value) || 1;
  const newValue = currentValue + 1;
  displayField.value = newValue;
  if (actualField) {
    actualField.value = newValue;
  }
}

function syncPriceInfoQty() {
  const actualField = document.getElementById('productDefaultQty');
  const displayField = document.getElementById('priceInfoQtyDisplay');
  if (actualField && displayField) {
    displayField.value = actualField.value || '1';
  }
}

function loadBrandsAndModels() {
  const brands = JSON.parse(localStorage.getItem('brands') || '[]');
  const brandModels = JSON.parse(localStorage.getItem('brandModels') || '[]');
  
  const brandSelect = document.getElementById('productBrand');
  brandSelect.innerHTML = '<option value="">Select brand</option>';
  
  // Default models for each brand
  const defaultBrandModels = {
    'Apple': ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13', 'iPhone SE'],
    'Samsung': ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy A54', 'Galaxy A34', 'Galaxy M34', 'Galaxy F54', 'Galaxy Z Fold 5', 'Galaxy Z Flip 5'],
    'OnePlus': ['OnePlus 12', 'OnePlus 11', 'OnePlus Nord 3', 'OnePlus Nord CE 3', 'OnePlus 11R', 'OnePlus 10 Pro', 'OnePlus 10T'],
    'Xiaomi': ['Xiaomi 14 Pro', 'Xiaomi 14', 'Xiaomi 13 Pro', 'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13', 'Redmi 13C', 'Redmi A3'],
    'Realme': ['Realme 12 Pro+', 'Realme 12 Pro', 'Realme 12', 'Realme 11 Pro+', 'Realme 11 Pro', 'Realme Narzo 60 Pro', 'Realme C67'],
    'Oppo': ['Oppo Reno 11 Pro', 'Oppo Reno 11', 'Oppo F25 Pro', 'Oppo A79', 'Oppo A59', 'Oppo Find N3'],
    'Vivo': ['Vivo V30 Pro', 'Vivo V30', 'Vivo V29 Pro', 'Vivo Y100', 'Vivo Y56', 'Vivo Y27', 'Vivo T2 Pro'],
    'Motorola': ['Moto Edge 50 Pro', 'Moto Edge 40 Neo', 'Moto G84', 'Moto G54', 'Moto G34', 'Moto E13'],
    'Nokia': ['Nokia G42', 'Nokia G22', 'Nokia C32', 'Nokia C22', 'Nokia 105', 'Nokia 110'],
    'Google': ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7a', 'Pixel 7 Pro', 'Pixel 7', 'Pixel Fold'],
    'Asus': ['ROG Phone 8 Pro', 'ROG Phone 7', 'Zenfone 10', 'Zenfone 11 Ultra'],
    'Nothing': ['Nothing Phone 2', 'Nothing Phone 2a', 'Nothing Phone 1'],
    'Poco': ['Poco X6 Pro', 'Poco X6', 'Poco M6 Pro', 'Poco C65', 'Poco F5'],
    'Infinix': ['Infinix Note 30 Pro', 'Infinix Note 30', 'Infinix Hot 40 Pro', 'Infinix Smart 8'],
    'Tecno': ['Tecno Phantom X2 Pro', 'Tecno Camon 20 Pro', 'Tecno Spark 10 Pro', 'Tecno Pop 8']
  };
  
  // If brands exist in localStorage, use them
  if (brands.length > 0) {
    brands.filter(b => b.active).forEach(brand => {
      const option = document.createElement('option');
      option.value = brand.name;
      option.textContent = brand.name;
      brandSelect.appendChild(option);
    });
  } else {
    // If no brands in localStorage, show some default popular brands
    const defaultBrands = Object.keys(defaultBrandModels);
    
    defaultBrands.forEach(brandName => {
      const option = document.createElement('option');
      option.value = brandName;
      option.textContent = brandName;
      brandSelect.appendChild(option);
    });
  }
  
  return { brands, brandModels, defaultBrandModels };
}

function updateModelOptions() {
  const selectedBrandName = document.getElementById('productBrand').value;
  const brands = JSON.parse(localStorage.getItem('brands') || '[]');
  const brandModels = JSON.parse(localStorage.getItem('brandModels') || '[]');
  
  const defaultBrandModels = {
    'Apple': ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13', 'iPhone SE'],
    'Samsung': ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy A54', 'Galaxy A34', 'Galaxy M34', 'Galaxy F54', 'Galaxy Z Fold 5', 'Galaxy Z Flip 5'],
    'OnePlus': ['OnePlus 12', 'OnePlus 11', 'OnePlus Nord 3', 'OnePlus Nord CE 3', 'OnePlus 11R', 'OnePlus 10 Pro', 'OnePlus 10T'],
    'Xiaomi': ['Xiaomi 14 Pro', 'Xiaomi 14', 'Xiaomi 13 Pro', 'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13', 'Redmi 13C', 'Redmi A3'],
    'Realme': ['Realme 12 Pro+', 'Realme 12 Pro', 'Realme 12', 'Realme 11 Pro+', 'Realme 11 Pro', 'Realme Narzo 60 Pro', 'Realme C67'],
    'Oppo': ['Oppo Reno 11 Pro', 'Oppo Reno 11', 'Oppo F25 Pro', 'Oppo A79', 'Oppo A59', 'Oppo Find N3'],
    'Vivo': ['Vivo V30 Pro', 'Vivo V30', 'Vivo V29 Pro', 'Vivo Y100', 'Vivo Y56', 'Vivo Y27', 'Vivo T2 Pro'],
    'Motorola': ['Moto Edge 50 Pro', 'Moto Edge 40 Neo', 'Moto G84', 'Moto G54', 'Moto G34', 'Moto E13'],
    'Nokia': ['Nokia G42', 'Nokia G22', 'Nokia C32', 'Nokia C22', 'Nokia 105', 'Nokia 110'],
    'Google': ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7a', 'Pixel 7 Pro', 'Pixel 7', 'Pixel Fold'],
    'Asus': ['ROG Phone 8 Pro', 'ROG Phone 7', 'Zenfone 10', 'Zenfone 11 Ultra'],
    'Nothing': ['Nothing Phone 2', 'Nothing Phone 2a', 'Nothing Phone 1'],
    'Poco': ['Poco X6 Pro', 'Poco X6', 'Poco M6 Pro', 'Poco C65', 'Poco F5'],
    'Infinix': ['Infinix Note 30 Pro', 'Infinix Note 30', 'Infinix Hot 40 Pro', 'Infinix Smart 8'],
    'Tecno': ['Tecno Phantom X2 Pro', 'Tecno Camon 20 Pro', 'Tecno Spark 10 Pro', 'Tecno Pop 8']
  };
  
  const modelSelect = document.getElementById('productModel');
  modelSelect.innerHTML = '<option value="">Select model</option>';
  
  if (!selectedBrandName) return;
  
  // First, try to find brand in localStorage
  const selectedBrand = brands.find(b => b.name === selectedBrandName);
  
  if (selectedBrand) {
    // Use models from localStorage
    const models = brandModels.filter(m => m.brandId === selectedBrand.id && m.active);
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.name;
      option.textContent = model.name;
      modelSelect.appendChild(option);
    });
  } else if (defaultBrandModels[selectedBrandName]) {
    // Use default models for the brand
    defaultBrandModels[selectedBrandName].forEach(modelName => {
      const option = document.createElement('option');
      option.value = modelName;
      option.textContent = modelName;
      modelSelect.appendChild(option);
    });
  }
}

function openAddProductModal() {
  document.getElementById('modalTitle').textContent = 'Add New Product';
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  
  // Reset margin fields
  document.getElementById('marginMRP').value = '0.00';
  document.getElementById('marginRetail').value = '0.00';
  document.getElementById('marginWholesale').value = '0.00';
  document.getElementById('priceMRP').value = '0.00';
  document.getElementById('priceRetail').value = '0.00';
  document.getElementById('priceWholesale').value = '0.00';
  
  // Reset GST fields
  document.getElementById('productGST').value = '0';
  document.getElementById('productCGST').value = '0.00';
  document.getElementById('productSGST').value = '0.00';
  document.getElementById('productIGST').value = '0.00';
  document.getElementById('productCESS').value = '0.00';
  
  // Reset price info quantity display
  document.getElementById('priceInfoQtyDisplay').value = '1';
  
  // Reset image preview
  clearProductImage();
  
  loadBrandsAndModels();
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
    brand: document.getElementById('productBrand').value || null,
    sizeBrand: document.getElementById('productType').value || null,
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
    
    // Populate brand and model dropdowns first
    await loadBrandsAndModels();
    document.getElementById('productBrand').value = product.brand || '';
    updateModelOptions();
    document.getElementById('productModel').value = product.model || '';
    document.getElementById('productType').value = product.sizeBrand || '';
    
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
    
    // Calculate and populate margin percentages
    const costPrice = product.costPrice || 0;
    if (costPrice > 0) {
      const mrpMargin = ((product.mrp || 0) - costPrice) / costPrice * 100;
      const retailMargin = ((product.price || 0) - costPrice) / costPrice * 100;
      const wholesaleMargin = ((product.wholesalePrice || 0) - costPrice) / costPrice * 100;
      
      document.getElementById('marginMRP').value = mrpMargin.toFixed(2);
      document.getElementById('marginRetail').value = retailMargin.toFixed(2);
      document.getElementById('marginWholesale').value = wholesaleMargin.toFixed(2);
      
      document.getElementById('priceMRP').value = (product.mrp || 0).toFixed(2);
      document.getElementById('priceRetail').value = (product.price || 0).toFixed(2);
      document.getElementById('priceWholesale').value = (product.wholesalePrice || 0).toFixed(2);
    }
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

    // Update image preview if product has an image
    if (product.imageUrl) {
      const preview = document.getElementById('productImagePreview');
      const placeholder = document.getElementById('noImagePlaceholder');
      preview.src = product.imageUrl;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      document.getElementById('productImageUrl').value = product.imageUrl;
    } else {
      clearProductImage();
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

// Removed handleImageSelect and updateImagePreview functions as per instructions.