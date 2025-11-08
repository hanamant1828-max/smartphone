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
let expandedCategories = new Set();
let categoryFilter = '';
let categoryStatusFilter = 'all';
let categoryToDelete = null;
let draggedCategory = null;

// Initialize with default categories if empty
if (categories.length === 0) {
  categories = [
    { id: 1, name: 'Mobiles', code: 'MOB', parentId: null, description: 'Mobile phones', active: true, showInMenu: true, showInPOS: true, displayOrder: 1, productCount: 234, selected: false },
    { id: 2, name: 'Smartphones', code: 'MOB-SMART', parentId: 1, description: 'Smart mobile phones', active: true, showInMenu: true, showInPOS: true, displayOrder: 1, productCount: 180, selected: false },
    { id: 3, name: 'Feature Phones', code: 'MOB-FEAT', parentId: 1, description: 'Basic feature phones', active: true, showInMenu: true, showInPOS: true, displayOrder: 2, productCount: 54, selected: false },
    { id: 4, name: 'Accessories', code: 'ACC', parentId: null, description: 'Mobile accessories', active: true, showInMenu: true, showInPOS: true, displayOrder: 2, productCount: 567, selected: false },
    { id: 5, name: 'Cases & Covers', code: 'ACC-CASE', parentId: 4, description: 'Protective cases', active: true, showInMenu: true, showInPOS: true, displayOrder: 1, productCount: 234, selected: false },
    { id: 6, name: 'Screen Protectors', code: 'ACC-SCREEN', parentId: 4, description: 'Screen protection', active: true, showInMenu: true, showInPOS: true, displayOrder: 2, productCount: 123, selected: false },
    { id: 7, name: 'Chargers', code: 'ACC-CHARGE', parentId: 4, description: 'Charging accessories', active: true, showInMenu: true, showInPOS: true, displayOrder: 3, productCount: 210, selected: false },
  ];
  localStorage.setItem('categories', JSON.stringify(categories));
}


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
      <div class="modal" style="max-width: 800px;">
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
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Category Name *</label>
                <input type="text" id="categoryName" class="form-input" placeholder="e.g., Smartphones" required />
              </div>
              <div class="form-group">
                <label class="form-label">Parent Category</label>
                <select id="categoryParent" class="form-input">
                  <option value="">-- Top Level --</option>
                  ${renderCategoryOptions()}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Category Code</label>
                <input type="text" id="categoryCode" class="form-input" placeholder="e.g., MOB-SMART" />
              </div>
              <div class="form-group">
                <label class="form-label">Display Order</label>
                <input type="number" id="categoryDisplayOrder" class="form-input" value="1" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea id="categoryDescription" class="form-input" rows="3" placeholder="Category description"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Category Image URL (Optional)</label>
              <input type="text" id="categoryImage" class="form-input" placeholder="https://example.com/image.jpg" />
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
            <h4 style="font-size: 1rem; font-weight: 500; margin: 24px 0 16px 0; color: var(--text-primary);">SEO Settings (Optional)</h4>
            <div class="form-group">
              <label class="form-label">Meta Title</label>
              <input type="text" id="categoryMetaTitle" class="form-input" placeholder="SEO meta title" />
            </div>
            <div class="form-group">
              <label class="form-label">Meta Description</label>
              <textarea id="categoryMetaDescription" class="form-input" rows="2" placeholder="SEO meta description"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeCategoryModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveCategory()">Save Category</button>
        </div>
      </div>
    </div>
    
    <!-- Import Modal -->
    <div id="importModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Import Categories</h3>
          <button class="modal-close" onclick="closeImportModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Select CSV/Excel File</label>
            <input type="file" id="importFile" accept=".csv,.xlsx,.xls" class="form-input" />
            <p class="form-helper">File should contain columns: Name, Code, ParentCode, Description, Active, ShowInMenu, ShowInPOS</p>
          </div>
          <div class="alert alert-info">
            <strong>Import Format:</strong> The file should have these columns:<br/>
            - Name (required)<br/>
            - Code (optional)<br/>
            - ParentCode (optional - code of parent category)<br/>
            - Description (optional)<br/>
            - Active (optional - true/false)<br/>
            - ShowInMenu (optional - true/false)<br/>
            - ShowInPOS (optional - true/false)
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeImportModal()">Cancel</button>
          <button class="btn btn-primary" onclick="importCategories()">Import</button>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div id="deleteCategoryModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Delete Category</h3>
          <button class="modal-close" onclick="closeDeleteCategoryModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div id="deleteCategoryContent"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeDeleteCategoryModal()">Cancel</button>
          <button class="btn btn-error" id="confirmDeleteBtn">Delete</button>
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
                  ${brands.filter(b => b.active).map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
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
  const selectedCount = categories.filter(c => c.selected).length;
  return `
    <div class="flex justify-between items-center mb-6">
      <div class="flex gap-4 items-center">
        <input 
          type="search" 
          class="form-input" 
          placeholder="Search categories..." 
          style="max-width: 400px;"
          id="categorySearchInput"
          oninput="filterCategories(this.value)"
        />
        <select class="form-input" style="max-width: 200px;" onchange="filterCategoriesByStatus(this.value)">
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>
      <div class="flex gap-2">
        ${selectedCount > 0 ? `
          <button class="btn btn-outline" onclick="bulkActivateCategories()">
            Activate Selected (${selectedCount})
          </button>
          <button class="btn btn-outline" onclick="bulkDeactivateCategories()">
            Deactivate Selected (${selectedCount})
          </button>
          <button class="btn btn-error" onclick="bulkDeleteCategories()">
            Delete Selected (${selectedCount})
          </button>
        ` : ''}
        <button class="btn btn-outline" onclick="exportCategories()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
        <button class="btn btn-outline" onclick="showImportModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Import
        </button>
        <button class="btn btn-primary" onclick="openCategoryModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Category
        </button>
      </div>
    </div>
    <div class="card" style="padding: 0;">
      <div id="categoryTreeContainer" style="padding: 24px;">
        ${renderCategoryTree()}
      </div>
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

function renderCategoryTree() {
  const rootCategories = categories.filter(c => !c.parentId && (!categoryFilter || matchesFilter(c)));
  
  if (rootCategories.length === 0) {
    return '<div style="text-align: center; padding: 48px; color: var(--text-secondary);">No categories found</div>';
  }
  
  return `
    <div class="category-tree">
      ${rootCategories.map(cat => renderCategoryNode(cat, 0)).join('')}
    </div>
  `;
}

function renderCategoryNode(category, level) {
  const children = categories.filter(c => c.parentId === category.id && (!categoryFilter || matchesFilter(c)));
  const hasChildren = children.length > 0;
  const isExpanded = expandedCategories.has(category.id);
  
  if (categoryStatusFilter !== 'all') {
    if (categoryStatusFilter === 'active' && !category.active) return '';
    if (categoryStatusFilter === 'inactive' && category.active) return '';
  }
  
  return `
    <div class="category-node" data-category-id="${category.id}" data-level="${level}" draggable="true" ondragstart="handleCategoryDragStart(event, ${category.id})" ondragover="handleCategoryDragOver(event)" ondrop="handleCategoryDrop(event, ${category.id})" ondragend="handleCategoryDragEnd(event)">
      <div class="category-node-content" style="padding-left: ${level * 24}px;">
        <div class="flex items-center gap-2" style="flex: 1;">
          <input type="checkbox" ${category.selected ? 'checked' : ''} onchange="toggleCategorySelection(${category.id})" onclick="event.stopPropagation();" />
          ${hasChildren ? `
            <button class="btn btn-icon btn-sm" onclick="toggleCategoryExpand(${category.id})" style="width: 24px; height: 24px; padding: 0;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: rotate(${isExpanded ? '90deg' : '0deg'}); transition: transform 0.2s;">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ` : '<span style="width: 24px;"></span>'}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <strong>${category.name}</strong>
          ${category.code ? `<span class="badge badge-secondary" style="font-size: 0.7rem;">${category.code}</span>` : ''}
          <span class="badge badge-primary" style="font-size: 0.7rem; margin-left: 8px;">${category.productCount || 0} products</span>
          <span class="badge ${category.active ? 'badge-success' : 'badge-secondary'}" style="font-size: 0.7rem;">${category.active ? 'Active' : 'Inactive'}</span>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-outline btn-sm" onclick="openCategoryModal(${category.id})" title="Add Subcategory">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Sub
          </button>
          <button class="btn btn-outline btn-sm" onclick="editCategory(${category.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn btn-error btn-sm" onclick="deleteCategory(${category.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
      ${hasChildren && isExpanded ? `
        <div class="category-children">
          ${children.map(child => renderCategoryNode(child, level + 1)).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function matchesFilter(category) {
  if (!categoryFilter) return true;
  return category.name.toLowerCase().includes(categoryFilter.toLowerCase()) ||
         (category.code && category.code.toLowerCase().includes(categoryFilter.toLowerCase())) ||
         (category.description && category.description.toLowerCase().includes(categoryFilter.toLowerCase()));
}

function renderCategoryModal() {
  return `
    <div id="categoryModal" class="modal-backdrop hidden">
      <div class="modal" style="max-width: 800px;">
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
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Category Name *</label>
                <input type="text" id="categoryName" class="form-input" placeholder="e.g., Smartphones" required />
              </div>
              <div class="form-group">
                <label class="form-label">Parent Category</label>
                <select id="categoryParent" class="form-input">
                  <option value="">-- Top Level --</option>
                  ${renderCategoryOptions()}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Category Code</label>
                <input type="text" id="categoryCode" class="form-input" placeholder="e.g., MOB-SMART" />
              </div>
              <div class="form-group">
                <label class="form-label">Display Order</label>
                <input type="number" id="categoryDisplayOrder" class="form-input" value="1" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea id="categoryDescription" class="form-input" rows="3" placeholder="Category description"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Category Image URL (Optional)</label>
              <input type="text" id="categoryImage" class="form-input" placeholder="https://example.com/image.jpg" />
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
            <h4 style="font-size: 1rem; font-weight: 500; margin: 24px 0 16px 0; color: var(--text-primary);">SEO Settings (Optional)</h4>
            <div class="form-group">
              <label class="form-label">Meta Title</label>
              <input type="text" id="categoryMetaTitle" class="form-input" placeholder="SEO meta title" />
            </div>
            <div class="form-group">
              <label class="form-label">Meta Description</label>
              <textarea id="categoryMetaDescription" class="form-input" rows="2" placeholder="SEO meta description"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeCategoryModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveCategory()">Save Category</button>
        </div>
      </div>
    </div>
  `;
}

function renderImportModal() {
  return `
    <div id="importModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Import Categories</h3>
          <button class="modal-close" onclick="closeImportModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Select CSV/Excel File</label>
            <input type="file" id="importFile" accept=".csv,.xlsx,.xls" class="form-input" />
            <p class="form-helper">File should contain columns: Name, Code, ParentCode, Description, Active, ShowInMenu, ShowInPOS</p>
          </div>
          <div class="alert alert-info">
            <strong>Import Format:</strong> The file should have these columns:<br/>
            - Name (required)<br/>
            - Code (optional)<br/>
            - ParentCode (optional - code of parent category)<br/>
            - Description (optional)<br/>
            - Active (optional - true/false)<br/>
            - ShowInMenu (optional - true/false)<br/>
            - ShowInPOS (optional - true/false)
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeImportModal()">Cancel</button>
          <button class="btn btn-primary" onclick="importCategories()">Import</button>
        </div>
      </div>
    </div>
  `;
}

function renderDeleteCategoryModal() {
  return `
    <div id="deleteCategoryModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Delete Category</h3>
          <button class="modal-close" onclick="closeDeleteCategoryModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div id="deleteCategoryContent"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeDeleteCategoryModal()">Cancel</button>
          <button class="btn btn-error" id="confirmDeleteBtn">Delete</button>
        </div>
      </div>
    </div>
  `;
}

function renderCategoryOptions(excludeId = null) {
  return categories
    .filter(c => c.id !== excludeId)
    .map(c => {
      const indent = getCategoryDepth(c.id) * 2;
      return `<option value="${c.id}">${'&nbsp;'.repeat(indent)}${c.name}</option>`;
    })
    .join('');
}

function getCategoryDepth(categoryId, depth = 0) {
  const category = categories.find(c => c.id === categoryId);
  if (!category || !category.parentId) return depth;
  return getCategoryDepth(category.parentId, depth + 1);
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
  document.getElementById('categoryModalTitle').textContent = parentId ? 'Add Subcategory' : 'Add Category';
  document.getElementById('categoryName').value = '';
  document.getElementById('categoryCode').value = '';
  document.getElementById('categoryDescription').value = '';
  document.getElementById('categoryDisplayOrder').value = '1';
  document.getElementById('categoryActive').checked = true;
  document.getElementById('categoryShowMenu').checked = true;
  document.getElementById('categoryShowPOS').checked = true;
  document.getElementById('categoryMetaTitle').value = '';
  document.getElementById('categoryMetaDescription').value = '';
  document.getElementById('categoryImage').value = '';

  const parentSelect = document.getElementById('categoryParent');
  parentSelect.innerHTML = '<option value="">-- Top Level --</option>' + renderCategoryOptions();
  if (parentId) {
    parentSelect.value = parentId;
  }
  
  document.getElementById('categoryModal').classList.remove('hidden');
}


function closeCategoryModal() {
  document.getElementById('categoryModal').classList.add('hidden');
}

function handleCategoryImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('categoryImage').value = e.target.result; // Store data URL
      // In a real app, you would likely upload this to a server and store the URL
      showToast('Image selected. URL stored in hidden field.', 'info'); 
    };
    reader.readAsDataURL(file);
  }
}

function clearCategoryImage() {
  document.getElementById('categoryImage').value = '';
  showToast('Image cleared', 'info');
}

let editingCategoryId = null;

function saveCategory() {
  const name = document.getElementById('categoryName').value.trim();
  if (!name) {
    showToast('Category name is required', 'error');
    return;
  }

  const categoryData = {
    id: editingCategoryId || Date.now(),
    name: name,
    code: document.getElementById('categoryCode').value.trim(),
    parentId: document.getElementById('categoryParent').value ? parseInt(document.getElementById('categoryParent').value) : null,
    description: document.getElementById('categoryDescription').value.trim(),
    imageUrl: document.getElementById('categoryImage').value.trim(),
    displayOrder: parseInt(document.getElementById('categoryDisplayOrder').value) || 1,
    active: document.getElementById('categoryActive').checked,
    showInMenu: document.getElementById('categoryShowMenu').checked,
    showInPOS: document.getElementById('categoryShowPOS').checked,
    metaTitle: document.getElementById('categoryMetaTitle').value.trim(),
    metaDescription: document.getElementById('categoryMetaDescription').value.trim(),
    productCount: 0,
    selected: false
  };

  const existingIndex = categories.findIndex(c => c.id === categoryData.id);

  if (existingIndex !== -1) {
    categoryData.productCount = categories[existingIndex].productCount;
    categories[existingIndex] = { ...categories[existingIndex], ...categoryData };
    showToast('Category updated successfully', 'success');
  } else {
    categories.push(categoryData);
    showToast('Category added successfully', 'success');
  }
  
  editingCategoryId = null;
  localStorage.setItem('categories', JSON.stringify(categories));
  closeCategoryModal();
  updateTabContent();
}

function editCategory(id) {
  const category = categories.find(c => c.id === id);
  if (!category) return;
  
  editingCategoryId = id;
  document.getElementById('categoryModalTitle').textContent = 'Edit Category';
  document.getElementById('categoryName').value = category.name;
  document.getElementById('categoryCode').value = category.code || '';
  document.getElementById('categoryDescription').value = category.description || '';
  document.getElementById('categoryImage').value = category.imageUrl || '';
  document.getElementById('categoryDisplayOrder').value = category.displayOrder || 1;
  document.getElementById('categoryActive').checked = category.active;
  document.getElementById('categoryShowMenu').checked = category.showInMenu;
  document.getElementById('categoryShowPOS').checked = category.showInPOS;
  document.getElementById('categoryMetaTitle').value = category.metaTitle || '';
  document.getElementById('categoryMetaDescription').value = category.metaDescription || '';
  
  const parentSelect = document.getElementById('categoryParent');
  parentSelect.innerHTML = '<option value="">-- Top Level --</option>' + renderCategoryOptions(id);
  parentSelect.value = category.parentId || '';
  
  document.getElementById('categoryModal').classList.remove('hidden');
}

function deleteCategory(id) {
  const category = categories.find(c => c.id === id);
  if (!category) return;
  
  categoryToDelete = id;
  const productCount = category.productCount || 0;
  const hasChildren = categories.some(c => c.parentId === id);

  let content = `<p>Are you sure you want to delete "<strong>${category.name}</strong>"?</p>`;

  if (productCount > 0 || hasChildren) {
    content += '<div class="alert alert-warning" style="margin-top: 16px;">';
    if (productCount > 0) {
      content += `<p><strong>Warning:</strong> This category has ${productCount} product(s).</p>`;
    }
    if (hasChildren) {
      content += '<p><strong>Warning:</strong> This category has subcategories. Deleting this will also delete its subcategories.</p>';
    }
    content += '</div>';
    content += '<div class="form-group" style="margin-top: 16px;">';
    content += '<label class="form-label">What would you like to do?</label>';
    content += '<select id="deleteAction" class="form-input">';
    if (category.parentId) {
      content += '<option value="move-parent">Move products to parent category</option>';
    }
    content += '<option value="move-other">Move products to another category</option>';
    content += '<option value="delete-all">Delete category and its products</option>';
    content += '</select>';
    content += '</div>';
    content += '<div id="moveToContainer" class="form-group hidden" style="margin-top: 16px;">';
    content += '<label class="form-label">Select target category</label>';
    content += '<select id="moveToCategory" class="form-input">';
    content += renderCategoryOptions(id); // Exclude the category being deleted from target options
    content += '</select>';
    content += '</div>';
  }

  document.getElementById('deleteCategoryContent').innerHTML = content;
  document.getElementById('deleteCategoryModal').classList.remove('hidden');

  const deleteActionSelect = document.getElementById('deleteAction');
  if (deleteActionSelect) {
    deleteActionSelect.addEventListener('change', function() {
      const moveToContainer = document.getElementById('moveToContainer');
      if (this.value === 'move-other') {
        moveToContainer.classList.remove('hidden');
      } else {
        moveToContainer.classList.add('hidden');
      }
    });
  }

  document.getElementById('confirmDeleteBtn').onclick = () => confirmDeleteCategory(id);
}

function closeDeleteCategoryModal() {
  document.getElementById('deleteCategoryModal').classList.add('hidden');
  categoryToDelete = null;
}

function confirmDeleteCategory(categoryId) {
  const category = categories.find(c => c.id === categoryId);
  if (!category) return;
  
  const deleteActionSelect = document.getElementById('deleteAction');
  let action = 'delete-all'; // Default action

  if (deleteActionSelect) {
    action = deleteActionSelect.value;
    
    if (action === 'move-other') {
      const targetCategoryId = parseInt(document.getElementById('moveToCategory').value);
      if (!targetCategoryId) {
        showToast('Please select a target category', 'error');
        return;
      }
      // In a real app, you would reassign products here
      showToast(`Products will be moved to target category ${targetCategoryId}.`, 'info');
    } else if (action === 'move-parent' && category.parentId) {
      // In a real app, you would reassign products to parent category
      showToast(`Products will be moved to parent category ${category.parentId}.`, 'info');
    }
  }

  // Delete child categories recursively
  deleteChildCategories(categoryId);
  
  // Delete the category itself
  categories = categories.filter(c => c.id !== categoryId);
  
  localStorage.setItem('categories', JSON.stringify(categories));
  showToast('Category deleted successfully', 'success');
  closeDeleteCategoryModal();
  updateTabContent();
}

function deleteChildCategories(parentId) {
  const children = categories.filter(c => c.parentId === parentId);
  children.forEach(child => {
    deleteChildCategories(child.id); // Recurse
    categories = categories.filter(c => c.id !== child.id); // Remove child
  });
}

function filterCategories(query) {
  categoryFilter = query;
  updateTabContent();
}

function filterCategoriesByStatus(status) {
  categoryStatusFilter = status;
  updateTabContent();
}

function toggleCategoryExpand(id) {
  if (expandedCategories.has(id)) {
    expandedCategories.delete(id);
  } else {
    expandedCategories.add(id);
  }
  updateTabContent();
}

function toggleCategorySelection(id) {
  const category = categories.find(c => c.id === id);
  if (category) {
    category.selected = !category.selected;
    localStorage.setItem('categories', JSON.stringify(categories));
    updateTabContent();
  }
}

function bulkActivateCategories() {
  const selectedIds = categories.filter(c => c.selected).map(c => c.id);
  if (selectedIds.length === 0) {
    showToast('No categories selected', 'warning');
    return;
  }
  
  selectedIds.forEach(id => {
    const category = categories.find(c => c.id === id);
    if (category) {
      category.active = true;
      category.selected = false; // Deselect after action
    }
  });
  
  localStorage.setItem('categories', JSON.stringify(categories));
  showToast(`${selectedIds.length} categories activated`, 'success');
  updateTabContent();
}

function bulkDeactivateCategories() {
  const selectedIds = categories.filter(c => c.selected).map(c => c.id);
  if (selectedIds.length === 0) {
    showToast('No categories selected', 'warning');
    return;
  }
  
  selectedIds.forEach(id => {
    const category = categories.find(c => c.id === id);
    if (category) {
      category.active = false;
      category.selected = false; // Deselect after action
    }
  });
  
  localStorage.setItem('categories', JSON.stringify(categories));
  showToast(`${selectedIds.length} categories deactivated`, 'success');
  updateTabContent();
}

function bulkDeleteCategories() {
  const selectedIds = categories.filter(c => c.selected).map(c => c.id);
  if (selectedIds.length === 0) {
    showToast('No categories selected', 'warning');
    return;
  }
  
  if (!confirm(`Are you sure you want to delete ${selectedIds.length} categories?`)) {
    return;
  }
  
  selectedIds.forEach(id => {
    deleteChildCategories(id); // Delete children first
    categories = categories.filter(c => c.id !== id); // Then remove the category
  });
  
  localStorage.setItem('categories', JSON.stringify(categories));
  showToast(`${selectedIds.length} categories deleted`, 'success');
  updateTabContent();
}

function exportCategories() {
  const csvData = [
    ['Name', 'Code', 'Parent Code', 'Description', 'Active', 'Show In Menu', 'Show In POS', 'Display Order']
  ];
  
  categories.forEach(cat => {
    const parent = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
    csvData.push([
      cat.name,
      cat.code || '',
      parent?.code || '',
      cat.description || '',
      cat.active ? 'true' : 'false',
      cat.showInMenu ? 'true' : 'false',
      cat.showInPOS ? 'true' : 'false',
      cat.displayOrder || 0
    ]);
  });
  
  const csv = csvData.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n'); // Escape quotes
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `categories_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('Categories exported successfully', 'success');
}

function showImportModal() {
  document.getElementById('importModal').classList.remove('hidden');
}

function closeImportModal() {
  document.getElementById('importModal').classList.add('hidden');
  document.getElementById('importFile').value = ''; // Clear the file input
}

function importCategories() {
  const fileInput = document.getElementById('importFile');
  const file = fileInput.files[0];
  
  if (!file) {
    showToast('Please select a file', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const categoryData = {
          id: Date.now() + i, // Simple unique ID generation
          name: values[0],
          code: values[1] || '',
          description: values[3] || '',
          active: values[4]?.toLowerCase() === 'true',
          showInMenu: values[5]?.toLowerCase() === 'true',
          showInPOS: values[6]?.toLowerCase() === 'true',
          displayOrder: parseInt(values[7]) || 0,
          productCount: 0, // New categories start with 0 products
          selected: false,
          parentId: null
        };
        
        // Find parent by code
        if (values[2]) {
          const parent = categories.find(c => c.code === values[2]);
          if (parent) {
            categoryData.parentId = parent.id;
          } else {
            showToast(`Parent category with code "${values[2]}" not found for category "${categoryData.name}". Setting as top-level.`, 'warning');
          }
        }
        
        categories.push(categoryData);
        importedCount++;
      }
      
      localStorage.setItem('categories', JSON.stringify(categories));
      closeImportModal();
      showToast(`${importedCount} categories imported successfully`, 'success');
      updateTabContent();
    } catch (error) {
      console.error("Import error:", error);
      showToast('Failed to import categories: ' + error.message, 'error');
    }
  };
  
  reader.onerror = () => {
    showToast('File reading error', 'error');
  };
  
  reader.readAsText(file);
}

// Drag and drop handlers
function handleCategoryDragStart(event, categoryId) {
  draggedCategory = categoryId;
  event.target.style.opacity = '0.5';
}

function handleCategoryDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function handleCategoryDrop(event, targetId) {
  event.preventDefault();
  
  if (draggedCategory === targetId) return; // Cannot drop on itself
  
  const draggedCat = categories.find(c => c.id === draggedCategory);
  const targetCat = categories.find(c => c.id === targetId);
  
  if (!draggedCat || !targetCat) return;
  
  // Check if target is a child of dragged (prevent circular reference)
  if (isChildOf(targetId, draggedCategory)) {
    showToast('Cannot move a category into its own child', 'error');
    return;
  }
  
  // Move dragged category to be child of target
  draggedCat.parentId = targetId;
  
  localStorage.setItem('categories', JSON.stringify(categories));
  showToast('Category moved successfully', 'success');
  updateTabContent(); // Re-render the tree
}

function handleCategoryDragEnd(event) {
  event.target.style.opacity = '1';
  draggedCategory = null;
}

function isChildOf(categoryId, potentialParentId) {
  let current = categories.find(c => c.id === categoryId);
  while (current && current.parentId) {
    if (current.parentId === potentialParentId) return true;
    current = categories.find(c => c.id === current.parentId);
  }
  return false;
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
    name: document.getElementById('brandName').value.trim(),
    code: document.getElementById('brandCode').value.trim() || document.getElementById('brandName').value.substring(0, 4).toUpperCase(), // Auto-generate code if empty
    website: document.getElementById('brandWebsite').value.trim(),
    email: document.getElementById('brandEmail').value.trim(),
    phone: document.getElementById('brandPhone').value.trim(),
    country: document.getElementById('brandCountry').value.trim(),
    description: document.getElementById('brandDescription').value.trim(),
    active: document.getElementById('brandActive').checked,
    featured: document.getElementById('brandFeatured').checked,
    showInMenu: document.getElementById('brandShowMenu').checked,
    productCount: 0 // Initialize product count
  };
  
  if (!brandData.name) {
    showToast('Brand name is required', 'error');
    return;
  }
  
  const existingIndex = brands.findIndex(b => b.id === brandData.id);
  
  if (existingIndex !== -1) {
    // Update existing brand
    brandData.productCount = brands[existingIndex].productCount; // Preserve product count
    brands[existingIndex] = brandData;
  } else {
    // Add new brand
    brands.push(brandData);
  }
  
  localStorage.setItem('brands', JSON.stringify(brands));
  closeBrandModal();
  showToast('Brand saved successfully', 'success');
  updateTabContent(); // Refresh the tab content
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
  // Implement brand filtering logic - for now, just re-render
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
    name: document.getElementById('modelName').value.trim(),
    modelNumber: document.getElementById('modelNumber').value.trim(),
    code: document.getElementById('modelCode').value.trim(),
    launchDate: document.getElementById('modelLaunchDate').value,
    warrantyMonths: parseInt(document.getElementById('modelWarranty').value) || 12,
    description: document.getElementById('modelDescription').value.trim(),
    active: document.getElementById('modelActive').checked,
    discontinued: document.getElementById('modelDiscontinued').checked
  };
  
  if (!modelData.name || !modelData.brandId) {
    showToast('Model name and brand are required', 'error');
    return;
  }
  
  const existingIndex = models.findIndex(m => m.id === modelData.id);
  
  if (existingIndex !== -1) {
    // Update existing model
    models[existingIndex] = modelData;
  } else {
    // Add new model
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
  // Implement model filtering logic - for now, just re-render
  updateTabContent();
}

function filterModelsByBrand(brandId) {
  // Implement brand-based filtering - for now, just re-render
  updateTabContent();
}

function filterModelsByStatus(status) {
  // Implement status-based filtering - for now, just re-render
  updateTabContent();
}

function filterBrandsByStatus(status) {
  // Implement status-based filtering for brands - for now, just re-render
  updateTabContent();
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
  if (!category) return '';
  return category.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Product Management Functions (kept from original, but might need updates if product form is changed)
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
    products = await api.getProducts(); // Re-fetch products
    filteredProducts = products; // Reset filtered products
    updateProductsTable(); // Update the table view
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
      // Assuming category is a direct match for filters like 'smartphone'
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

// Initialize global functions for onclick handlers
export async function init(app) {
  // Product functions
  window.openAddProductModal = openAddProductModal;
  window.closeProductModal = closeProductModal;
  window.saveProduct = saveProduct;
  window.editProduct = editProduct;
  window.deleteProduct = deleteProduct;
  window.filterProducts = filterProducts;
  window.setFilter = setFilter;
  window.updateProductsTable = updateProductsTable; // Added for potential external use

  // Tab functions
  window.switchTab = switchTab;
  window.updateTabContent = updateTabContent;

  // Category functions
  window.openCategoryModal = openCategoryModal;
  window.closeCategoryModal = closeCategoryModal;
  window.saveCategory = saveCategory;
  window.editCategory = editCategory;
  window.deleteCategory = deleteCategory;
  window.confirmDeleteCategory = confirmDeleteCategory; // For the delete modal confirm button
  window.closeDeleteCategoryModal = closeDeleteCategoryModal;
  window.filterCategories = filterCategories;
  window.filterCategoriesByStatus = filterCategoriesByStatus;
  window.toggleCategoryExpand = toggleCategoryExpand;
  window.toggleCategorySelection = toggleCategorySelection;
  window.bulkActivateCategories = bulkActivateCategories;
  window.bulkDeactivateCategories = bulkDeactivateCategories;
  window.bulkDeleteCategories = bulkDeleteCategories;
  window.exportCategories = exportCategories;
  window.showImportModal = showImportModal;
  window.closeImportModal = closeImportModal;
  window.importCategories = importCategories;
  window.handleCategoryDragStart = handleCategoryDragStart;
  window.handleCategoryDragOver = handleCategoryDragOver;
  window.handleCategoryDrop = handleCategoryDrop;
  window.handleCategoryDragEnd = handleCategoryDragEnd;
  window.renderCategoryOptions = renderCategoryOptions; // Needed for modal select

  // Brand functions
  window.openBrandModal = openBrandModal;
  window.closeBrandModal = closeBrandModal;
  window.saveBrand = saveBrand;
  window.editBrand = editBrand;
  window.deleteBrand = deleteBrand;
  window.filterBrands = filterBrands;
  // window.filterBrandsByStatus = filterBrandsByStatus; // Not implemented in edited code snippet

  // Model functions
  window.openModelModal = openModelModal;
  window.closeModelModal = closeModelModal;
  window.saveModel = saveModel;
  window.editModel = editModel;
  window.deleteModel = deleteModel;
  window.filterModels = filterModels;
  window.filterModelsByBrand = filterModelsByBrand;
  // window.filterModelsByStatus = filterModelsByStatus; // Not implemented in edited code snippet

  // Utility functions
  window.getCategoryColor = getCategoryColor;
  window.formatCategory = formatCategory;

  // Initial data loading
  try {
    const productsData = await api.getProducts();
    products = productsData;
    filteredProducts = products;
    
    // Load categories, brands, and models from localStorage if they exist
    // If localStorage is empty, the default values from the top of the file will be used.
    const storedCategories = localStorage.getItem('categories');
    categories = storedCategories ? JSON.parse(storedCategories) : categories;
    brands = JSON.parse(localStorage.getItem('brands') || '[]');
    models = JSON.parse(localStorage.getItem('brandModels') || '[]');
    
    updateTabContent(); // Render the initial tab content
  } catch (error) {
    console.error('Failed to load initial data:', error);
    showToast('Failed to load initial data', 'error');
  }
}