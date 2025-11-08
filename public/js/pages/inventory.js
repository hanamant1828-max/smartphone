import { wrapWithLayout } from '../components/layout.js';
import { api } from '../api.js';
import { formatCurrency, formatNumber, showToast } from '../utils.js';

let products = [];
let filteredProducts = [];
let currentFilter = 'all';
let currentTab = 'products';
let categories = [];
let brands = [];
let models = [];

export function render(app) {
  return wrapWithLayout(`
    <div class="page-header">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="page-title">Inventory Management</h1>
          <p class="page-subtitle">Manage products, categories, brands, and models</p>
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

    <!-- Tabs -->
    <div class="card mb-6">
      <div style="display: flex; border-bottom: 1px solid var(--border); gap: 0;">
        <button 
          class="tab-button ${currentTab === 'products' ? 'active' : ''}" 
          onclick="switchTab('products')"
          data-testid="tab-products"
        >
          Products
        </button>
        <button 
          class="tab-button ${currentTab === 'categories' ? 'active' : ''}" 
          onclick="switchTab('categories')"
          data-testid="tab-categories"
        >
          Categories
        </button>
        <button 
          class="tab-button ${currentTab === 'brands' ? 'active' : ''}" 
          onclick="switchTab('brands')"
          data-testid="tab-brands"
        >
          Brands
        </button>
        <button 
          class="tab-button ${currentTab === 'models' ? 'active' : ''}" 
          onclick="switchTab('models')"
          data-testid="tab-models"
        >
          Models
        </button>
      </div>
    </div>

    <div id="tabContent">
      ${renderTabContent()}
    </div>

    

    <!-- Category Modal -->
    <div id="categoryModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="categoryModalTitle">Add Category</h3>
          <button class="modal-close" onclick="closeCategoryModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <form id="categoryForm">
            <input type="hidden" id="categoryId" />
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Category Name *</label>
                <input type="text" id="categoryName" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Parent Category</label>
                <select id="categoryParent" class="form-input">
                  <option value="">None (Top Level)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Category Code</label>
                <input type="text" id="categoryCode" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Display Order</label>
                <input type="number" id="categoryOrder" class="form-input" value="0" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea id="categoryDescription" class="form-input" rows="3"></textarea>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="form-group">
                <label class="flex items-center gap-2">
                  <input type="checkbox" id="categoryActive" checked />
                  <span>Active</span>
                </label>
              </div>
              <div class="form-group">
                <label class="flex items-center gap-2">
                  <input type="checkbox" id="categoryShowMenu" checked />
                  <span>Show in Menu</span>
                </label>
              </div>
              <div class="form-group">
                <label class="flex items-center gap-2">
                  <input type="checkbox" id="categoryShowPOS" checked />
                  <span>Show in POS</span>
                </label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeCategoryModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveCategory()">Save Category</button>
        </div>
      </div>
    </div>

    <!-- Brand Modal -->
    <div id="brandModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="brandModalTitle">Add Brand</h3>
          <button class="modal-close" onclick="closeBrandModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <form id="brandForm">
            <input type="hidden" id="brandId" />
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Brand Name *</label>
                <input type="text" id="brandName" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Brand Code</label>
                <input type="text" id="brandCode" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Website URL</label>
                <input type="url" id="brandWebsite" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Contact Email</label>
                <input type="email" id="brandEmail" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Contact Phone</label>
                <input type="tel" id="brandPhone" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Country of Origin</label>
                <input type="text" id="brandCountry" class="form-input" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea id="brandDescription" class="form-input" rows="3"></textarea>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="form-group">
                <label class="flex items-center gap-2">
                  <input type="checkbox" id="brandActive" checked />
                  <span>Active</span>
                </label>
              </div>
              <div class="form-group">
                <label class="flex items-center gap-2">
                  <input type="checkbox" id="brandFeatured" />
                  <span>Featured Brand</span>
                </label>
              </div>
              <div class="form-group">
                <label class="flex items-center gap-2">
                  <input type="checkbox" id="brandShowMenu" />
                  <span>Show in Menu</span>
                </label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeBrandModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveBrand()">Save Brand</button>
        </div>
      </div>
    </div>

    <!-- Model Modal -->
    <div id="modelModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="modelModalTitle">Add Model</h3>
          <button class="modal-close" onclick="closeModelModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <form id="modelForm">
            <input type="hidden" id="modelId" />
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Brand *</label>
                <select id="modelBrand" class="form-input" required>
                  <option value="">Select Brand</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Model Name *</label>
                <input type="text" id="modelName" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Model Number</label>
                <input type="text" id="modelNumber" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Model Code</label>
                <input type="text" id="modelCode" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Launch Date</label>
                <input type="date" id="modelLaunchDate" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Warranty (months)</label>
                <input type="number" id="modelWarranty" class="form-input" value="12" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea id="modelDescription" class="form-input" rows="3"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="flex items-center gap-2">
                  <input type="checkbox" id="modelActive" checked />
                  <span>Active</span>
                </label>
              </div>
              <div class="form-group">
                <label class="flex items-center gap-2">
                  <input type="checkbox" id="modelDiscontinued" />
                  <span>Discontinued</span>
                </label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModelModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveModel()">Save Model</button>
        </div>
      </div>
    </div>
  `, 'inventory', app.user);
}

function renderTabContent() {
  switch (currentTab) {
    case 'products':
      return renderProductsTab();
    case 'categories':
      return renderCategoriesTab();
    case 'brands':
      return renderBrandsTab();
    case 'models':
      return renderModelsTab();
    default:
      return renderProductsTab();
  }
}

function renderProductsTab() {
  return `
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
  `;
}

function renderCategoriesTab() {
  return `
    <div class="flex justify-between items-center mb-6">
      <input 
        type="search" 
        class="form-input" 
        placeholder="Search categories..." 
        style="max-width: 400px;"
        oninput="filterCategories(this.value)"
      />
      <button class="btn btn-primary" onclick="openCategoryModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Category
      </button>
    </div>
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Category Name</th>
            <th>Code</th>
            <th>Parent</th>
            <th>Products</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="categoriesTableBody">
          ${renderCategoryRows()}
        </tbody>
      </table>
    </div>
  `;
}

function renderBrandsTab() {
  return `
    <div class="flex justify-between items-center mb-6">
      <input 
        type="search" 
        class="form-input" 
        placeholder="Search brands..." 
        style="max-width: 400px;"
        oninput="filterBrands(this.value)"
      />
      <button class="btn btn-primary" onclick="openBrandModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Brand
      </button>
    </div>
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Brand Name</th>
            <th>Code</th>
            <th>Country</th>
            <th>Products</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="brandsTableBody">
          ${renderBrandRows()}
        </tbody>
      </table>
    </div>
  `;
}

function renderModelsTab() {
  return `
    <div class="flex justify-between items-center mb-6">
      <div class="flex gap-4" style="flex: 1;">
        <select class="form-input" style="max-width: 200px;" onchange="filterModelsByBrand(this.value)">
          <option value="">All Brands</option>
          ${brands.filter(b => b.active).map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
        </select>
        <input 
          type="search" 
          class="form-input" 
          placeholder="Search models..." 
          style="max-width: 400px;"
          oninput="filterModels(this.value)"
        />
      </div>
      <button class="btn btn-primary" onclick="openModelModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Model
      </button>
    </div>
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Brand</th>
            <th>Model Name</th>
            <th>Model Number</th>
            <th>Launch Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="modelsTableBody">
          ${renderModelRows()}
        </tbody>
      </table>
    </div>
  `;
}

function renderProductRows() {
  if (!filteredProducts || filteredProducts.length === 0) {
    return `
      <tr>
        <td colspan="9" class="text-center" style="padding: 48px;">
          <div style="color: var(--text-secondary);">
            <p>No products found</p>
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

function renderCategoryRows() {
  if (!categories || categories.length === 0) {
    return '<tr><td colspan="6" class="text-center" style="padding: 48px;">No categories found</td></tr>';
  }
  return categories.map(cat => `
    <tr>
      <td><strong>${cat.name}</strong></td>
      <td>${cat.code || '-'}</td>
      <td>${cat.parentId ? (categories.find(c => c.id === cat.parentId)?.name || '-') : 'Top Level'}</td>
      <td>${cat.productCount || 0}</td>
      <td><span class="badge ${cat.active ? 'badge-success' : 'badge-secondary'}">${cat.active ? 'Active' : 'Inactive'}</span></td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-outline btn-sm" onclick="editCategory(${cat.id})">Edit</button>
          <button class="btn btn-error btn-sm" onclick="deleteCategory(${cat.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderBrandRows() {
  if (!brands || brands.length === 0) {
    return '<tr><td colspan="6" class="text-center" style="padding: 48px;">No brands found</td></tr>';
  }
  return brands.map(brand => `
    <tr>
      <td><strong>${brand.name}</strong></td>
      <td>${brand.code || '-'}</td>
      <td>${brand.country || '-'}</td>
      <td>${brand.productCount || 0}</td>
      <td><span class="badge ${brand.active ? 'badge-success' : 'badge-secondary'}">${brand.active ? 'Active' : 'Inactive'}</span></td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-outline btn-sm" onclick="editBrand(${brand.id})">Edit</button>
          <button class="btn btn-error btn-sm" onclick="deleteBrand(${brand.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderModelRows() {


function switchTab(tab) {
  currentTab = tab;
  updateTabContent();
}

function updateTabContent() {
  const contentDiv = document.getElementById('tabContent');
  if (contentDiv) {
    contentDiv.innerHTML = renderTabContent();
  }
}

// Category Management Functions
function openCategoryModal(parentId = null) {
  document.getElementById('categoryModalTitle').textContent = 'Add Category';
  document.getElementById('categoryId').value = '';
  document.getElementById('categoryName').value = '';
  document.getElementById('categoryCode').value = '';
  document.getElementById('categoryDescription').value = '';
  document.getElementById('categoryOrder').value = '0';
  document.getElementById('categoryActive').checked = true;
  document.getElementById('categoryShowMenu').checked = true;
  document.getElementById('categoryShowPOS').checked = true;
  
  // Populate parent category dropdown
  const parentSelect = document.getElementById('categoryParent');
  parentSelect.innerHTML = '<option value="">None (Top Level)</option>';
  categories.filter(c => c.active).forEach(cat => {
    parentSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
  });
  
  if (parentId) {
    parentSelect.value = parentId;
  }
  
  document.getElementById('categoryModal').classList.remove('hidden');
}

function closeCategoryModal() {
  document.getElementById('categoryModal').classList.add('hidden');
}

function saveCategory() {
  const id = document.getElementById('categoryId').value;
  const categoryData = {
    id: id ? parseInt(id) : Date.now(),
    name: document.getElementById('categoryName').value,
    code: document.getElementById('categoryCode').value,
    description: document.getElementById('categoryDescription').value,
    parentId: document.getElementById('categoryParent').value ? parseInt(document.getElementById('categoryParent').value) : null,
    displayOrder: parseInt(document.getElementById('categoryOrder').value) || 0,
    active: document.getElementById('categoryActive').checked,
    showInMenu: document.getElementById('categoryShowMenu').checked,
    showInPOS: document.getElementById('categoryShowPOS').checked,
    productCount: 0
  };
  
  if (!categoryData.name) {
    showToast('Category name is required', 'error');
    return;
  }
  
  if (id) {
    const index = categories.findIndex(c => c.id === parseInt(id));
    if (index !== -1) {
      categories[index] = { ...categories[index], ...categoryData };
    }
  } else {
    categories.push(categoryData);
  }
  
  localStorage.setItem('categories', JSON.stringify(categories));
  closeCategoryModal();
  showToast('Category saved successfully', 'success');
  updateTabContent();
}

function editCategory(id) {
  const category = categories.find(c => c.id === id);
  if (!category) return;
  
  document.getElementById('categoryModalTitle').textContent = 'Edit Category';
  document.getElementById('categoryId').value = category.id;
  document.getElementById('categoryName').value = category.name;
  document.getElementById('categoryCode').value = category.code || '';
  document.getElementById('categoryDescription').value = category.description || '';
  document.getElementById('categoryOrder').value = category.displayOrder || 0;
  document.getElementById('categoryActive').checked = category.active;
  document.getElementById('categoryShowMenu').checked = category.showInMenu;
  document.getElementById('categoryShowPOS').checked = category.showInPOS;
  
  const parentSelect = document.getElementById('categoryParent');
  parentSelect.innerHTML = '<option value="">None (Top Level)</option>';
  categories.filter(c => c.active && c.id !== id).forEach(cat => {
    parentSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
  });
  parentSelect.value = category.parentId || '';
  
  document.getElementById('categoryModal').classList.remove('hidden');
}

function deleteCategory(id) {
  const category = categories.find(c => c.id === id);
  if (!category) return;
  
  if (category.productCount > 0) {
    if (!confirm(`This category has ${category.productCount} products. Are you sure you want to delete it?`)) {
      return;
    }
  }
  
  categories = categories.filter(c => c.id !== id);
  localStorage.setItem('categories', JSON.stringify(categories));
  showToast('Category deleted successfully', 'success');
  updateTabContent();
}

function filterCategories(searchTerm) {
  // Implement category filtering logic
  updateTabContent();
}

// Brand Management Functions
function openBrandModal() {
  document.getElementById('brandModalTitle').textContent = 'Add Brand';
  document.getElementById('brandId').value = '';
  document.getElementById('brandName').value = '';
  document.getElementById('brandCode').value = '';
  document.getElementById('brandWebsite').value = '';
  document.getElementById('brandEmail').value = '';
  document.getElementById('brandPhone').value = '';
  document.getElementById('brandCountry').value = '';
  document.getElementById('brandDescription').value = '';
  document.getElementById('brandActive').checked = true;
  document.getElementById('brandFeatured').checked = false;
  document.getElementById('brandShowMenu').checked = false;
  
  document.getElementById('brandModal').classList.remove('hidden');
}

function closeBrandModal() {
  document.getElementById('brandModal').classList.add('hidden');
}

function saveBrand() {
  const id = document.getElementById('brandId').value;
  const brandData = {
    id: id ? parseInt(id) : Date.now(),
    name: document.getElementById('brandName').value,
    code: document.getElementById('brandCode').value || document.getElementById('brandName').value.substring(0, 4).toUpperCase(),
    website: document.getElementById('brandWebsite').value,
    email: document.getElementById('brandEmail').value,
    phone: document.getElementById('brandPhone').value,
    country: document.getElementById('brandCountry').value,
    description: document.getElementById('brandDescription').value,
    active: document.getElementById('brandActive').checked,
    featured: document.getElementById('brandFeatured').checked,
    showInMenu: document.getElementById('brandShowMenu').checked,
    productCount: 0
  };
  
  if (!brandData.name) {
    showToast('Brand name is required', 'error');
    return;
  }
  
  if (id) {
    const index = brands.findIndex(b => b.id === parseInt(id));
    if (index !== -1) {
      brands[index] = { ...brands[index], ...brandData };
    }
  } else {
    brands.push(brandData);
  }
  
  localStorage.setItem('brands', JSON.stringify(brands));
  closeBrandModal();
  showToast('Brand saved successfully', 'success');
  updateTabContent();
}

function editBrand(id) {
  const brand = brands.find(b => b.id === id);
  if (!brand) return;
  
  document.getElementById('brandModalTitle').textContent = 'Edit Brand';
  document.getElementById('brandId').value = brand.id;
  document.getElementById('brandName').value = brand.name;
  document.getElementById('brandCode').value = brand.code || '';
  document.getElementById('brandWebsite').value = brand.website || '';
  document.getElementById('brandEmail').value = brand.email || '';
  document.getElementById('brandPhone').value = brand.phone || '';
  document.getElementById('brandCountry').value = brand.country || '';
  document.getElementById('brandDescription').value = brand.description || '';
  document.getElementById('brandActive').checked = brand.active;
  document.getElementById('brandFeatured').checked = brand.featured || false;
  document.getElementById('brandShowMenu').checked = brand.showInMenu || false;
  
  document.getElementById('brandModal').classList.remove('hidden');
}

function deleteBrand(id) {
  const brand = brands.find(b => b.id === id);
  if (!brand) return;
  
  if (brand.productCount > 0) {
    if (!confirm(`This brand has ${brand.productCount} products. Are you sure you want to delete it?`)) {
      return;
    }
  }
  
  brands = brands.filter(b => b.id !== id);
  localStorage.setItem('brands', JSON.stringify(brands));
  showToast('Brand deleted successfully', 'success');
  updateTabContent();
}

function filterBrands(searchTerm) {
  // Implement brand filtering logic
  updateTabContent();
}

// Model Management Functions
function openModelModal() {
  document.getElementById('modelModalTitle').textContent = 'Add Model';
  document.getElementById('modelId').value = '';
  document.getElementById('modelName').value = '';
  document.getElementById('modelNumber').value = '';
  document.getElementById('modelCode').value = '';
  document.getElementById('modelLaunchDate').value = '';
  document.getElementById('modelWarranty').value = '12';
  document.getElementById('modelDescription').value = '';
  document.getElementById('modelActive').checked = true;
  document.getElementById('modelDiscontinued').checked = false;
  
  // Populate brand dropdown
  const brandSelect = document.getElementById('modelBrand');
  brandSelect.innerHTML = '<option value="">Select Brand</option>';
  brands.filter(b => b.active).forEach(brand => {
    brandSelect.innerHTML += `<option value="${brand.id}">${brand.name}</option>`;
  });
  
  document.getElementById('modelModal').classList.remove('hidden');
}

function closeModelModal() {
  document.getElementById('modelModal').classList.add('hidden');
}

function saveModel() {
  const id = document.getElementById('modelId').value;
  const modelData = {
    id: id ? parseInt(id) : Date.now(),
    brandId: parseInt(document.getElementById('modelBrand').value),
    name: document.getElementById('modelName').value,
    modelNumber: document.getElementById('modelNumber').value,
    code: document.getElementById('modelCode').value,
    launchDate: document.getElementById('modelLaunchDate').value,
    warrantyMonths: parseInt(document.getElementById('modelWarranty').value) || 12,
    description: document.getElementById('modelDescription').value,
    active: document.getElementById('modelActive').checked,
    discontinued: document.getElementById('modelDiscontinued').checked
  };
  
  if (!modelData.name || !modelData.brandId) {
    showToast('Model name and brand are required', 'error');
    return;
  }
  
  if (id) {
    const index = models.findIndex(m => m.id === parseInt(id));
    if (index !== -1) {
      models[index] = { ...models[index], ...modelData };
    }
  } else {
    models.push(modelData);
  }
  
  localStorage.setItem('brandModels', JSON.stringify(models));
  closeModelModal();
  showToast('Model saved successfully', 'success');
  updateTabContent();
}

function editModel(id) {
  const model = models.find(m => m.id === id);
  if (!model) return;
  
  document.getElementById('modelModalTitle').textContent = 'Edit Model';
  document.getElementById('modelId').value = model.id;
  document.getElementById('modelName').value = model.name;
  document.getElementById('modelNumber').value = model.modelNumber || '';
  document.getElementById('modelCode').value = model.code || '';
  document.getElementById('modelLaunchDate').value = model.launchDate || '';
  document.getElementById('modelWarranty').value = model.warrantyMonths || 12;
  document.getElementById('modelDescription').value = model.description || '';
  document.getElementById('modelActive').checked = model.active;
  document.getElementById('modelDiscontinued').checked = model.discontinued || false;
  
  const brandSelect = document.getElementById('modelBrand');
  brandSelect.innerHTML = '<option value="">Select Brand</option>';
  brands.filter(b => b.active).forEach(brand => {
    brandSelect.innerHTML += `<option value="${brand.id}">${brand.name}</option>`;
  });
  brandSelect.value = model.brandId;
  
  document.getElementById('modelModal').classList.remove('hidden');
}

function deleteModel(id) {
  if (!confirm('Are you sure you want to delete this model?')) {
    return;
  }
  
  models = models.filter(m => m.id !== id);
  localStorage.setItem('brandModels', JSON.stringify(models));
  showToast('Model deleted successfully', 'success');
  updateTabContent();
}

function filterModels(searchTerm) {
  // Implement model filtering logic
  updateTabContent();
}

function filterModelsByBrand(brandId) {
  // Implement brand-based filtering
  updateTabContent();
}

function openAddProductModal() {
  showToast('Product form needs to be redesigned. Use the Add Product page instead.', 'info');
}

  if (!models || models.length === 0) {
    return '<tr><td colspan="6" class="text-center" style="padding: 48px;">No models found</td></tr>';
  }
  return models.map(model => {
    const brand = brands.find(b => b.id === model.brandId);
    return `
      <tr>
        <td>${brand?.name || '-'}</td>
        <td><strong>${model.name}</strong></td>
        <td class="font-mono">${model.modelNumber || '-'}</td>
        <td>${model.launchDate || '-'}</td>
        <td><span class="badge ${model.active ? 'badge-success' : 'badge-secondary'}">${model.active ? 'Active' : 'Inactive'}</span></td>
        <td>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" onclick="editModel(${model.id})">Edit</button>
            <button class="btn btn-error btn-sm" onclick="deleteModel(${model.id})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
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
    
    // Load categories, brands, and models from localStorage
    categories = JSON.parse(localStorage.getItem('categories') || '[]');
    brands = JSON.parse(localStorage.getItem('brands') || '[]');
    models = JSON.parse(localStorage.getItem('brandModels') || '[]');
    
    updateTabContent();
  } catch (error) {
    console.error('Failed to load products:', error);
    showToast('Failed to load products', 'error');
  }

  // Expose functions globally for onclick handlers
  window.switchTab = switchTab;
  window.openAddProductModal = openAddProductModal;
  window.saveProduct = saveProduct;
  window.editProduct = editProduct;
  window.deleteProduct = deleteProduct;
  window.filterProducts = filterProducts;
  window.setFilter = setFilter;
  
  // Category functions
  window.openCategoryModal = openCategoryModal;
  window.closeCategoryModal = closeCategoryModal;
  window.saveCategory = saveCategory;
  window.editCategory = editCategory;
  window.deleteCategory = deleteCategory;
  window.filterCategories = filterCategories;
  
  // Brand functions
  window.openBrandModal = openBrandModal;
  window.closeBrandModal = closeBrandModal;
  window.saveBrand = saveBrand;
  window.editBrand = editBrand;
  window.deleteBrand = deleteBrand;
  window.filterBrands = filterBrands;
  
  // Model functions
  window.openModelModal = openModelModal;
  window.closeModelModal = closeModelModal;
  window.saveModel = saveModel;
  window.editModel = editModel;
  window.deleteModel = deleteModel;
  window.filterModels = filterModels;
  window.filterModelsByBrand = filterModelsByBrand;
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
  const productIdInput = document.getElementById('productId');
  if (productIdInput) {
    productIdInput.value = '';
  }
  
  document.getElementById('productModal').classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden');
}

async function saveProduct() {
  // Form validation removed since form fields don't exist
  showToast('Product form is empty. Please implement the new form design.', 'info');
  return;
}

async function editProduct(id) {
  try {
    const product = await api.getProduct(id);
    
    document.getElementById('modalTitle').textContent = 'Edit Product';
    const productIdInput = document.getElementById('productId');
    if (productIdInput) {
      productIdInput.value = product.id;
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