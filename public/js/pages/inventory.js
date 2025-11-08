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
let editingCategoryId = null;
let editingBrandId = null;
let brandFilter = '';
let brandStatusFilter = 'all';
let brandViewMode = 'table'; // 'table' or 'grid'
let brandSortBy = 'name'; // 'name', 'productCount', 'recent'
let modelFilter = '';
let modelBrandFilter = '';
let modelStatusFilter = 'all';
let editingModelId = null;

// Initialize with default categories if empty
const storedCategories = localStorage.getItem('categories');
if (!storedCategories) {
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
} else {
  categories = JSON.parse(storedCategories);
}

// Initialize brands if empty
const storedBrands = localStorage.getItem('brands');
if (!storedBrands) {
  brands = [
    { id: 1, name: 'Samsung', code: 'SAMS', description: 'Leading electronics brand', logoUrl: '', website: 'https://www.samsung.com', email: 'contact@samsung.com', phone: '+1-800-SAMSUNG', country: 'South Korea', displayOrder: 1, active: true, showInMenu: true, featured: true, productCount: 234, stockValue: 2500000, selected: false },
    { id: 2, name: 'Apple', code: 'APPL', description: 'Premium technology brand', logoUrl: '', website: 'https://www.apple.com', email: 'support@apple.com', phone: '+1-800-MY-APPLE', country: 'USA', displayOrder: 2, active: true, showInMenu: true, featured: true, productCount: 189, stockValue: 4500000, selected: false },
    { id: 3, name: 'Xiaomi', code: 'XIAO', description: 'Value for money smartphones', logoUrl: '', website: 'https://www.mi.com', email: 'support@xiaomi.com', phone: '+86-400-100-5678', country: 'China', displayOrder: 3, active: true, showInMenu: true, featured: false, productCount: 156, stockValue: 1200000, selected: false },
    { id: 4, name: 'Oppo', code: 'OPPO', description: 'Camera focused smartphones', logoUrl: '', website: 'https://www.oppo.com', email: 'service@oppo.com', phone: '+86-400-666-6888', country: 'China', displayOrder: 4, active: true, showInMenu: true, featured: false, productCount: 123, stockValue: 980000, selected: false },
    { id: 5, name: 'Vivo', code: 'VIVO', description: 'Innovative smartphone technology', logoUrl: '', website: 'https://www.vivo.com', email: 'care@vivo.com', phone: '+91-1800-572-4000', country: 'China', displayOrder: 5, active: false, showInMenu: false, featured: false, productCount: 112, stockValue: 750000, selected: false },
  ];
  localStorage.setItem('brands', JSON.stringify(brands));
} else {
  brands = JSON.parse(storedBrands);
}

// Initialize models if empty
const storedModels = localStorage.getItem('models');
if (!storedModels) {
  models = [
    {
      id: 1,
      brandId: 1,
      name: 'Galaxy S24 Ultra',
      modelNumber: 'SM-S928B',
      modelCode: 'SAMS-GS24U',
      description: 'Premium flagship smartphone with AI features',
      imageUrl: '',
      launchDate: '2024-01-17',
      discontinued: false,
      baseSpecs: {
        display: '6.8" Dynamic AMOLED 2X',
        processor: 'Snapdragon 8 Gen 3',
        camera: '200MP + 50MP + 12MP + 10MP',
        battery: '5000mAh',
        os: 'Android 14'
      },
      warrantyMonths: 12,
      active: true,
      displayOrder: 1,
      variants: [
        { ram: '12GB', storage: '256GB', color: 'Titanium Gray', sku: 'SAMS-GS24U-12-256-GRAY' },
        { ram: '12GB', storage: '256GB', color: 'Titanium Black', sku: 'SAMS-GS24U-12-256-BLK' },
        { ram: '12GB', storage: '512GB', color: 'Titanium Gray', sku: 'SAMS-GS24U-12-512-GRAY' },
        { ram: '16GB', storage: '1TB', color: 'Titanium Gray', sku: 'SAMS-GS24U-16-1TB-GRAY' }
      ],
      selected: false
    },
    {
      id: 2,
      brandId: 1,
      name: 'Galaxy S24+',
      modelNumber: 'SM-S926B',
      modelCode: 'SAMS-GS24P',
      description: 'Premium smartphone with larger display',
      imageUrl: '',
      launchDate: '2024-01-17',
      discontinued: false,
      baseSpecs: {
        display: '6.7" Dynamic AMOLED 2X',
        processor: 'Snapdragon 8 Gen 3',
        camera: '50MP + 12MP + 10MP',
        battery: '4900mAh',
        os: 'Android 14'
      },
      warrantyMonths: 12,
      active: true,
      displayOrder: 2,
      variants: [
        { ram: '8GB', storage: '256GB', color: 'Onyx Black', sku: 'SAMS-GS24P-8-256-BLK' },
        { ram: '12GB', storage: '512GB', color: 'Onyx Black', sku: 'SAMS-GS24P-12-512-BLK' }
      ],
      selected: false
    },
    {
      id: 3,
      brandId: 2,
      name: 'iPhone 15 Pro Max',
      modelNumber: 'A2849',
      modelCode: 'APPL-IP15PM',
      description: 'Premium iPhone with titanium design',
      imageUrl: '',
      launchDate: '2023-09-22',
      discontinued: false,
      baseSpecs: {
        display: '6.7" Super Retina XDR',
        processor: 'A17 Pro',
        camera: '48MP + 12MP + 12MP',
        battery: '4441mAh',
        os: 'iOS 17'
      },
      warrantyMonths: 12,
      active: true,
      displayOrder: 3,
      variants: [
        { ram: '8GB', storage: '256GB', color: 'Natural Titanium', sku: 'APPL-IP15PM-8-256-NAT' },
        { ram: '8GB', storage: '256GB', color: 'Blue Titanium', sku: 'APPL-IP15PM-8-256-BLU' },
        { ram: '8GB', storage: '512GB', color: 'Natural Titanium', sku: 'APPL-IP15PM-8-512-NAT' },
        { ram: '8GB', storage: '1TB', color: 'Natural Titanium', sku: 'APPL-IP15PM-8-1TB-NAT' }
      ],
      selected: false
    }
  ];
  localStorage.setItem('models', JSON.stringify(models));
} else {
  models = JSON.parse(storedModels);
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
      <div class="modal" style="max-width: 900px;">
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
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Brand Name *</label>
                <input type="text" id="brandName" class="form-input" placeholder="e.g., Samsung" required />
              </div>
              <div class="form-group">
                <label class="form-label">Brand Code</label>
                <input type="text" id="brandCode" class="form-input" placeholder="Auto-generated from name" readonly style="background-color: var(--surface);" />
              </div>
              <div class="form-group">
                <label class="form-label">Website URL</label>
                <input type="url" id="brandWebsite" class="form-input" placeholder="https://example.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Contact Email</label>
                <input type="email" id="brandEmail" class="form-input" placeholder="contact@brand.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Contact Phone</label>
                <input type="tel" id="brandPhone" class="form-input" placeholder="+1-234-567-8900" />
              </div>
              <div class="form-group">
                <label class="form-label">Country of Origin</label>
                <input type="text" id="brandCountry" class="form-input" placeholder="e.g., USA" />
              </div>
              <div class="form-group">
                <label class="form-label">Display Order</label>
                <input type="number" id="brandDisplayOrder" class="form-input" value="1" min="0" />
              </div>
              <div class="form-group">
                <label class="form-label">Brand Logo URL</label>
                <input type="text" id="brandLogo" class="form-input" placeholder="https://example.com/logo.png" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea id="brandDescription" class="form-input" rows="3" placeholder="Brand description"></textarea>
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
                  <input type="checkbox" id="brandShowMenu" />
                  <span>Show in Menu</span>
                </label>
              </div>
              <div class="form-group">
                <label class="flex items-center gap-2">
                  <input type="checkbox" id="brandFeatured" />
                  <span>Featured Brand</span>
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

    <!-- Delete Category Modal -->
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

    <!-- Model Modal -->
    <div id="modelModal" class="modal-backdrop hidden">
      <div class="modal" style="max-width: 1000px;">
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
                <input type="text" id="modelName" class="form-input" placeholder="e.g., Galaxy S24 Ultra" required />
              </div>
              <div class="form-group">
                <label class="form-label">Model Number</label>
                <input type="text" id="modelNumber" class="form-input" placeholder="e.g., SM-S928B" />
              </div>
              <div class="form-group">
                <label class="form-label">Model Code</label>
                <input type="text" id="modelCode" class="form-input" placeholder="Auto-generated" readonly style="background-color: var(--surface);" />
              </div>
              <div class="form-group">
                <label class="form-label">Launch Date</label>
                <input type="date" id="modelLaunchDate" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Warranty Period (months)</label>
                <input type="number" id="modelWarranty" class="form-input" value="12" min="0" />
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea id="modelDescription" class="form-input" rows="3" placeholder="Model description"></textarea>
            </div>
            
            <div class="form-group">
              <label class="form-label">Model Image URL</label>
              <input type="text" id="modelImage" class="form-input" placeholder="https://example.com/image.jpg" />
            </div>
            
            <div class="form-group">
              <label class="form-label">Base Specifications</label>
              <div class="grid grid-cols-2 gap-4">
                <input type="text" id="modelSpecDisplay" class="form-input" placeholder="Display" />
                <input type="text" id="modelSpecProcessor" class="form-input" placeholder="Processor" />
                <input type="text" id="modelSpecCamera" class="form-input" placeholder="Camera" />
                <input type="text" id="modelSpecBattery" class="form-input" placeholder="Battery" />
                <input type="text" id="modelSpecOS" class="form-input" placeholder="OS" />
                <input type="number" id="modelDisplayOrder" class="form-input" placeholder="Display Order" value="1" min="0" />
              </div>
            </div>
            
            <div class="grid grid-cols-3 gap-4">
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
            
            <div class="form-group mt-6">
              <div class="flex justify-between items-center mb-4">
                <h4 class="font-semibold">Model Variants</h4>
                <button type="button" class="btn btn-outline btn-sm" onclick="addVariantRow()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Variant
                </button>
              </div>
              <div id="variantsContainer">
                <!-- Variants will be added here -->
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

    <!-- Model Variants Modal -->
    <div id="modelVariantsModal" class="modal-backdrop hidden">
      <div class="modal" style="max-width: 900px;">
        <div class="modal-header">
          <h3 class="modal-title" id="modelVariantsModalTitle">Model Variants</h3>
          <button class="modal-close" onclick="closeModelVariantsModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" id="modelVariantsContent">
          <!-- Variants content will be loaded here -->
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeModelVariantsModal()">Close</button>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div id="importModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="importModalTitle">Import Data</h3>
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
          </div>
          <div class="alert alert-info" id="importFormatInfo"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeImportModal()">Cancel</button>
          <button class="btn btn-primary" onclick="confirmImport()">Import</button>
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
          oninput="handleFilterCategories(this.value)"
        />
        <select class="form-input" style="max-width: 200px;" onchange="handleFilterCategoriesByStatus(this.value)">
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>
      <div class="flex gap-2">
        ${selectedCount > 0 ? `
          <button class="btn btn-outline" onclick="bulkActivateCategories()">
            Activate (${selectedCount})
          </button>
          <button class="btn btn-outline" onclick="bulkDeactivateCategories()">
            Deactivate (${selectedCount})
          </button>
          <button class="btn btn-error" onclick="bulkDeleteCategories()">
            Delete (${selectedCount})
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
        <button class="btn btn-outline" onclick="showImportModal('categories')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Import
        </button>
        <button class="btn btn-primary" onclick="handleOpenCategoryModal()">
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
  const selectedCount = brands.filter(b => b.selected).length;
  const filteredBrands = getFilteredBrands();

  return `
    <div class="flex justify-between items-center mb-6">
      <div class="flex gap-4 items-center">
        <input 
          type="search" 
          class="form-input" 
          placeholder="Search brands..." 
          style="max-width: 400px;"
          value="${brandFilter}"
          oninput="handleFilterBrands(this.value)"
        />
        <select class="form-input" style="max-width: 200px;" value="${brandStatusFilter}" onchange="handleFilterBrandsByStatus(this.value)">
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
        <select class="form-input" style="max-width: 200px;" value="${brandSortBy}" onchange="handleSortBrands(this.value)">
          <option value="name">Sort: Name (A-Z)</option>
          <option value="productCount">Sort: Product Count</option>
          <option value="recent">Sort: Recently Added</option>
        </select>
      </div>
      <div class="flex gap-2">
        ${selectedCount > 0 ? `
          <button class="btn btn-outline" onclick="bulkActivateBrands()">
            Activate (${selectedCount})
          </button>
          <button class="btn btn-outline" onclick="bulkDeactivateBrands()">
            Deactivate (${selectedCount})
          </button>
          <button class="btn btn-outline" onclick="bulkSetFeaturedBrands()">
            Set Featured (${selectedCount})
          </button>
          <button class="btn btn-error" onclick="bulkDeleteBrands()">
            Delete (${selectedCount})
          </button>
        ` : ''}
        <button class="btn btn-outline" onclick="toggleBrandView()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${brandViewMode === 'table' ? 
              '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>' :
              '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'
            }
          </svg>
          ${brandViewMode === 'table' ? 'Grid' : 'Table'}
        </button>
        <button class="btn btn-outline" onclick="exportBrands()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
        <button class="btn btn-outline" onclick="showImportModal('brands')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Import
        </button>
        <button class="btn btn-primary" onclick="handleOpenBrandModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Brand
        </button>
      </div>
    </div>

    ${brandViewMode === 'table' ? renderBrandsTableView(filteredBrands) : renderBrandsGridView(filteredBrands)}
  `;
}

function renderBrandsTableView(filteredBrands) {
  return `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 40px;">
              <input type="checkbox" onchange="toggleSelectAllBrands(this.checked)" />
            </th>
            <th style="width: 80px;">Logo</th>
            <th>Brand Name</th>
            <th>Code</th>
            <th>Products</th>
            <th>Stock Value</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filteredBrands.length === 0 ? `
            <tr>
              <td colspan="8" class="text-center" style="padding: 48px;">
                <div style="color: var(--text-secondary);">
                  <p>No brands found</p>
                </div>
              </td>
            </tr>
          ` : filteredBrands.map(brand => `
            <tr data-brand-id="${brand.id}">
              <td>
                <input type="checkbox" ${brand.selected ? 'checked' : ''} onchange="toggleBrandSelection(${brand.id})" />
              </td>
              <td>
                ${brand.logoUrl ? 
                  `<img src="${brand.logoUrl}" alt="${brand.name}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px; border: 1px solid var(--border);" />` :
                  `<div style="width: 50px; height: 50px; background: var(--surface); border-radius: 4px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); font-weight: 500; color: var(--text-secondary);">${brand.name.substring(0, 2).toUpperCase()}</div>`
                }
              </td>
              <td>
                <strong>${brand.name}</strong>
                ${brand.featured ? '<span class="badge badge-warning ml-2">Featured</span>' : ''}
              </td>
              <td><code>${brand.code}</code></td>
              <td>${brand.productCount || 0}</td>
              <td>${formatCurrency(brand.stockValue || 0)}</td>
              <td>
                <span class="badge badge-${brand.active ? 'success' : 'secondary'}">
                  ${brand.active ? '🟢 Active' : '🔴 Inactive'}
                </span>
              </td>
              <td>
                <div class="flex gap-2">
                  <button class="btn btn-outline btn-sm" onclick="handleEditBrand(${brand.id})" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button class="btn btn-error btn-sm" onclick="handleDeleteBrand(${brand.id})" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderBrandsGridView(filteredBrands) {
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">
      ${filteredBrands.map(brand => `
        <div class="card" style="padding: 20px; position: relative;">
          <div style="position: absolute; top: 16px; right: 16px;">
            <input type="checkbox" ${brand.selected ? 'checked' : ''} onchange="toggleBrandSelection(${brand.id})" />
          </div>
          <div style="text-align: center; margin-bottom: 16px;">
            ${brand.logoUrl ? 
              `<img src="${brand.logoUrl}" alt="${brand.name}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 8px; border: 1px solid var(--border); margin: 0 auto;" />` :
              `<div style="width: 80px; height: 80px; background: var(--surface); border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); font-weight: 500; font-size: 1.5rem; color: var(--text-secondary); margin: 0 auto;">${brand.name.substring(0, 2).toUpperCase()}</div>`
            }
          </div>
          <div style="text-align: center; margin-bottom: 12px;">
            <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 4px;">${brand.name}</h3>
            <code style="font-size: 0.875rem; color: var(--text-secondary);">${brand.code}</code>
            ${brand.featured ? '<div class="mt-2"><span class="badge badge-warning">Featured</span></div>' : ''}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; padding: 12px; background: var(--surface); border-radius: 8px;">
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">Products</div>
              <div style="font-size: 1.25rem; font-weight: 600;">${brand.productCount || 0}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">Stock Value</div>
              <div style="font-size: 1rem; font-weight: 600;">${formatCurrency(brand.stockValue || 0)}</div>
            </div>
          </div>
          <div style="margin-bottom: 16px; text-align: center;">
            <span class="badge badge-${brand.active ? 'success' : 'secondary'}">
              ${brand.active ? '🟢 Active' : '🔴 Inactive'}
            </span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="handleEditBrand(${brand.id})">Edit</button>
            <button class="btn btn-error btn-sm" style="flex: 1;" onclick="handleDeleteBrand(${brand.id})">Delete</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderModelsTab() {
  const filteredModels = getFilteredModels();
  const selectedCount = models.filter(m => m.selected).length;

  return `
    <div class="flex justify-between items-center mb-6">
      <div class="flex gap-4 items-center">
        <select class="form-input" style="max-width: 200px;" value="${modelBrandFilter}" onchange="handleFilterModelsByBrand(this.value)">
          <option value="">All Brands</option>
          ${brands.filter(b => b.active).map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
        </select>
        <input 
          type="search" 
          class="form-input" 
          placeholder="Search models..." 
          style="max-width: 400px;"
          value="${modelFilter}"
          oninput="handleFilterModels(this.value)"
        />
        <select class="form-input" style="max-width: 200px;" value="${modelStatusFilter}" onchange="handleFilterModelsByStatus(this.value)">
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>
      <div class="flex gap-2">
        ${selectedCount > 0 ? `
          <button class="btn btn-outline" onclick="bulkActivateModels()">
            Activate (${selectedCount})
          </button>
          <button class="btn btn-outline" onclick="bulkDeactivateModels()">
            Deactivate (${selectedCount})
          </button>
          <button class="btn btn-error" onclick="bulkDeleteModels()">
            Delete (${selectedCount})
          </button>
        ` : ''}
        <button class="btn btn-outline" onclick="exportModels()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
        <button class="btn btn-outline" onclick="showImportModal('models')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Import
        </button>
        <button class="btn btn-primary" onclick="handleOpenModelModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Model
        </button>
      </div>
    </div>
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 40px;">
              <input type="checkbox" onchange="toggleSelectAllModels(this.checked)" />
            </th>
            <th>Brand</th>
            <th>Model Name</th>
            <th>Model Number</th>
            <th>Variants</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filteredModels.length === 0 ? `
            <tr>
              <td colspan="7" class="text-center" style="padding: 48px;">
                <div style="color: var(--text-secondary);">
                  <p>No models found</p>
                </div>
              </td>
            </tr>
          ` : filteredModels.map(model => {
            const brand = brands.find(b => b.id === model.brandId);
            const variantCount = model.variants ? model.variants.length : 0;
            return `
              <tr data-model-id="${model.id}">
                <td>
                  <input type="checkbox" ${model.selected ? 'checked' : ''} onchange="toggleModelSelection(${model.id})" />
                </td>
                <td><strong>${brand?.name || '-'}</strong></td>
                <td>
                  <strong>${model.name}</strong>
                  ${model.modelCode ? `<br><code style="font-size: 0.75rem;">${model.modelCode}</code>` : ''}
                </td>
                <td class="font-mono">${model.modelNumber || '-'}</td>
                <td>
                  <span class="badge badge-primary">${variantCount} variant${variantCount !== 1 ? 's' : ''}</span>
                  ${variantCount > 0 ? `<button class="btn btn-outline btn-sm ml-2" onclick="viewModelVariants(${model.id})">View</button>` : ''}
                </td>
                <td>
                  <span class="badge badge-${model.active ? 'success' : 'secondary'}">
                    ${model.active ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn btn-outline btn-sm" onclick="handleEditModel(${model.id})" title="Edit">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="btn btn-error btn-sm" onclick="handleDeleteModel(${model.id})" title="Delete">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
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
    <tr data-product-id="${product.id}">
      <td><strong>${product.name}</strong></td>
      <td>${product.brand || '-'}</td>
      <td>${product.model || '-'}</td>
      <td>
        <span class="badge badge-primary">
          ${product.category || '-'}
        </span>
      </td>
      <td class="font-mono">${product.imeiNumber || '-'}</td>
      <td>
        <span class="badge ${product.stockQuantity <= product.minStockLevel ? 'badge-error' : 'badge-success'}">
          ${product.stockQuantity} ${product.stockQuantity <= product.minStockLevel ? '⚠' : ''}
        </span>
      </td>
      <td class="font-mono">${formatCurrency(product.costPrice)}</td>
      <td class="font-mono"><strong>${formatCurrency(product.price)}</strong></td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-outline btn-sm btn-icon" onclick="editProduct(${product.id})" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn btn-error btn-sm btn-icon" onclick="deleteProduct(${product.id})" title="Delete">
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
  const rootCategories = categories.filter(c => !c.parentId && matchesFilter(c));

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
  const children = categories.filter(c => c.parentId === category.id && matchesFilter(c));
  const hasChildren = children.length > 0;
  const isExpanded = expandedCategories.has(category.id);

  if (categoryStatusFilter !== 'all') {
    if (categoryStatusFilter === 'active' && !category.active) return '';
    if (categoryStatusFilter === 'inactive' && category.active) return '';
  }

  return `
    <div class="category-node" data-category-id="${category.id}" draggable="true" ondragstart="handleCategoryDragStart(event, ${category.id})" ondragover="handleCategoryDragOver(event)" ondrop="handleCategoryDrop(event, ${category.id})" ondragend="handleCategoryDragEnd(event)">
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
          <span class="badge badge-primary" style="font-size: 0.7rem;">${category.productCount || 0}</span>
          <span class="badge badge-${category.active ? 'success' : 'secondary'}" style="font-size: 0.7rem;">${category.active ? 'Active' : 'Inactive'}</span>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-outline btn-sm" onclick="handleOpenCategoryModal(${category.id})" title="Add Subcategory">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Sub
          </button>
          <button class="btn btn-outline btn-sm" onclick="handleEditCategory(${category.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn btn-error btn-sm" onclick="handleDeleteCategory(${category.id})">
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
         (category.code && category.code.toLowerCase().includes(categoryFilter.toLowerCase()));
}

// Helper Functions
function getFilteredBrands() {
  let filtered = [...brands];

  // Apply search filter
  if (brandFilter) {
    filtered = filtered.filter(b => 
      b.name.toLowerCase().includes(brandFilter.toLowerCase()) ||
      b.code.toLowerCase().includes(brandFilter.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(brandFilter.toLowerCase()))
    );
  }

  // Apply status filter
  if (brandStatusFilter === 'active') {
    filtered = filtered.filter(b => b.active);
  } else if (brandStatusFilter === 'inactive') {
    filtered = filtered.filter(b => !b.active);
  }

  // Apply sorting
  filtered.sort((a, b) => {
    if (brandSortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (brandSortBy === 'productCount') {
      return (b.productCount || 0) - (a.productCount || 0);
    } else if (brandSortBy === 'recent') {
      return b.id - a.id;
    }
    return 0;
  });

  return filtered;
}

function autoGenerateBrandCode(name) {
  return name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
}

// Tab Management
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

// Category Functions
function handleOpenCategoryModal(parentId = null) {
  editingCategoryId = null;
  document.getElementById('categoryModalTitle').textContent = parentId ? 'Add Subcategory' : 'Add Category';
  document.getElementById('categoryName').value = '';
  document.getElementById('categoryCode').value = '';
  document.getElementById('categoryDescription').value = '';
  document.getElementById('categoryDisplayOrder').value = '1';
  document.getElementById('categoryActive').checked = true;
  document.getElementById('categoryShowMenu').checked = true;
  document.getElementById('categoryShowPOS').checked = true;
  document.getElementById('categoryImage').value = '';

  const parentSelect = document.getElementById('categoryParent');
  parentSelect.innerHTML = '<option value="">-- Top Level --</option>';
  categories.forEach(c => {
    const indent = getCategoryDepth(c.id) * 2;
    parentSelect.innerHTML += `<option value="${c.id}">${'&nbsp;'.repeat(indent)}${c.name}</option>`;
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

function handleEditCategory(id) {
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

  const parentSelect = document.getElementById('categoryParent');
  parentSelect.innerHTML = '<option value="">-- Top Level --</option>';
  categories.filter(c => c.id !== id).forEach(c => {
    const indent = getCategoryDepth(c.id) * 2;
    parentSelect.innerHTML += `<option value="${c.id}">${'&nbsp;'.repeat(indent)}${c.name}</option>`;
  });
  parentSelect.value = category.parentId || '';

  document.getElementById('categoryModal').classList.remove('hidden');
}

function handleDeleteCategory(id) {
  const category = categories.find(c => c.id === id);
  if (!category) return;

  if (category.productCount > 0) {
    if (!confirm(`This category has ${category.productCount} products. Are you sure you want to delete it?`)) {
      return;
    }
  }

  deleteChildCategories(id);
  categories = categories.filter(c => c.id !== id);

  localStorage.setItem('categories', JSON.stringify(categories));
  showToast('Category deleted successfully', 'success');
  updateTabContent();
}

function deleteChildCategories(parentId) {
  const children = categories.filter(c => c.parentId === parentId);
  children.forEach(child => {
    deleteChildCategories(child.id);
    categories = categories.filter(c => c.id !== child.id);
  });
}

function getCategoryDepth(categoryId, depth = 0) {
  const category = categories.find(c => c.id === categoryId);
  if (!category || !category.parentId) return depth;
  return getCategoryDepth(category.parentId, depth + 1);
}

function handleFilterCategories(query) {
  categoryFilter = query;
  updateTabContent();
}

function handleFilterCategoriesByStatus(status) {
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
  categories.forEach(c => {
    if (c.selected) {
      c.active = true;
      c.selected = false;
    }
  });
  localStorage.setItem('categories', JSON.stringify(categories));
  showToast('Categories activated', 'success');
  updateTabContent();
}

function bulkDeactivateCategories() {
  categories.forEach(c => {
    if (c.selected) {
      c.active = false;
      c.selected = false;
    }
  });
  localStorage.setItem('categories', JSON.stringify(categories));
  showToast('Categories deactivated', 'success');
  updateTabContent();
}

function bulkDeleteCategories() {
  const selectedIds = categories.filter(c => c.selected).map(c => c.id);
  if (!confirm(`Delete ${selectedIds.length} categories?`)) return;

  selectedIds.forEach(id => {
    deleteChildCategories(id);
    categories = categories.filter(c => c.id !== id);
  });

  localStorage.setItem('categories', JSON.stringify(categories));
  showToast('Categories deleted', 'success');
  updateTabContent();
}

function exportCategories() {
  const csv = [
    ['Name', 'Code', 'ParentCode', 'Description', 'Active', 'ShowInMenu', 'ShowInPOS']
  ];

  categories.forEach(cat => {
    const parent = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
    csv.push([
      cat.name,
      cat.code || '',
      parent?.code || '',
      cat.description || '',
      cat.active ? 'true' : 'false',
      cat.showInMenu ? 'true' : 'false',
      cat.showInPOS ? 'true' : 'false'
    ]);
  });

  const csvContent = csv.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `categories_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('Categories exported', 'success');
}

// Brand Functions
function handleOpenBrandModal() {
  editingBrandId = null;
  document.getElementById('brandModalTitle').textContent = 'Add Brand';
  document.getElementById('brandName').value = '';
  document.getElementById('brandCode').value = '';
  document.getElementById('brandWebsite').value = '';
  document.getElementById('brandEmail').value = '';
  document.getElementById('brandPhone').value = '';
  document.getElementById('brandCountry').value = '';
  document.getElementById('brandDisplayOrder').value = '1';
  document.getElementById('brandLogo').value = '';
  document.getElementById('brandDescription').value = '';
  document.getElementById('brandActive').checked = true;
  document.getElementById('brandShowMenu').checked = false;
  document.getElementById('brandFeatured').checked = false;

  // Add event listener for auto-generating brand code
  const brandNameInput = document.getElementById('brandName');
  const brandCodeInput = document.getElementById('brandCode');
  
  brandNameInput.oninput = function() {
    if (!editingBrandId) {
      brandCodeInput.value = autoGenerateBrandCode(this.value);
    }
  };

  document.getElementById('brandModal').classList.remove('hidden');
}

function closeBrandModal() {
  document.getElementById('brandModal').classList.add('hidden');
}

function saveBrand() {
  const name = document.getElementById('brandName').value.trim();
  if (!name) {
    showToast('Brand name is required', 'error');
    return;
  }

  let code = document.getElementById('brandCode').value.trim();
  if (!code) {
    code = autoGenerateBrandCode(name);
  }

  const brandData = {
    id: editingBrandId || Date.now(),
    name: name,
    code: code,
    description: document.getElementById('brandDescription').value.trim(),
    logoUrl: document.getElementById('brandLogo').value.trim(),
    website: document.getElementById('brandWebsite').value.trim(),
    email: document.getElementById('brandEmail').value.trim(),
    phone: document.getElementById('brandPhone').value.trim(),
    country: document.getElementById('brandCountry').value.trim(),
    displayOrder: parseInt(document.getElementById('brandDisplayOrder').value) || 1,
    active: document.getElementById('brandActive').checked,
    showInMenu: document.getElementById('brandShowMenu').checked,
    featured: document.getElementById('brandFeatured').checked,
    productCount: 0,
    stockValue: 0,
    selected: false
  };

  const existingIndex = brands.findIndex(b => b.id === brandData.id);

  if (existingIndex !== -1) {
    brandData.productCount = brands[existingIndex].productCount;
    brandData.stockValue = brands[existingIndex].stockValue;
    brands[existingIndex] = { ...brands[existingIndex], ...brandData };
    showToast('Brand updated successfully', 'success');
  } else {
    brands.push(brandData);
    showToast('Brand added successfully', 'success');
  }

  editingBrandId = null;
  localStorage.setItem('brands', JSON.stringify(brands));
  closeBrandModal();
  updateTabContent();
}

function handleEditBrand(id) {
  const brand = brands.find(b => b.id === id);
  if (!brand) return;

  editingBrandId = id;
  document.getElementById('brandModalTitle').textContent = 'Edit Brand';
  document.getElementById('brandName').value = brand.name;
  document.getElementById('brandCode').value = brand.code || '';
  document.getElementById('brandWebsite').value = brand.website || '';
  document.getElementById('brandEmail').value = brand.email || '';
  document.getElementById('brandPhone').value = brand.phone || '';
  document.getElementById('brandCountry').value = brand.country || '';
  document.getElementById('brandDisplayOrder').value = brand.displayOrder || 1;
  document.getElementById('brandLogo').value = brand.logoUrl || '';
  document.getElementById('brandDescription').value = brand.description || '';
  document.getElementById('brandActive').checked = brand.active;
  document.getElementById('brandShowMenu').checked = brand.showInMenu || false;
  document.getElementById('brandFeatured').checked = brand.featured || false;

  document.getElementById('brandModal').classList.remove('hidden');
}

function handleDeleteBrand(id) {
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

function handleFilterBrands(query) {
  brandFilter = query;
  updateTabContent();
}

function handleFilterBrandsByStatus(status) {
  brandStatusFilter = status;
  updateTabContent();
}

function handleSortBrands(sortBy) {
  brandSortBy = sortBy;
  updateTabContent();
}

function toggleBrandView() {
  brandViewMode = brandViewMode === 'table' ? 'grid' : 'table';
  updateTabContent();
}

function toggleBrandSelection(id) {
  const brand = brands.find(b => b.id === id);
  if (brand) {
    brand.selected = !brand.selected;
    localStorage.setItem('brands', JSON.stringify(brands));
    updateTabContent();
  }
}

function toggleSelectAllBrands(checked) {
  brands.forEach(b => b.selected = checked);
  localStorage.setItem('brands', JSON.stringify(brands));
  updateTabContent();
}

function bulkActivateBrands() {
  brands.forEach(b => {
    if (b.selected) {
      b.active = true;
      b.selected = false;
    }
  });
  localStorage.setItem('brands', JSON.stringify(brands));
  showToast('Brands activated', 'success');
  updateTabContent();
}

function bulkDeactivateBrands() {
  brands.forEach(b => {
    if (b.selected) {
      b.active = false;
      b.selected = false;
    }
  });
  localStorage.setItem('brands', JSON.stringify(brands));
  showToast('Brands deactivated', 'success');
  updateTabContent();
}

function bulkSetFeaturedBrands() {
  brands.forEach(b => {
    if (b.selected) {
      b.featured = true;
      b.selected = false;
    }
  });
  localStorage.setItem('brands', JSON.stringify(brands));
  showToast('Brands set as featured', 'success');
  updateTabContent();
}

function bulkDeleteBrands() {
  const selectedIds = brands.filter(b => b.selected).map(b => b.id);
  if (!confirm(`Delete ${selectedIds.length} brands?`)) return;

  brands = brands.filter(b => !b.selected);
  localStorage.setItem('brands', JSON.stringify(brands));
  showToast('Brands deleted', 'success');
  updateTabContent();
}

function exportBrands() {
  const csv = [
    ['Name', 'Code', 'Description', 'Website', 'Email', 'Phone', 'Country', 'Active', 'Featured', 'Products', 'StockValue']
  ];

  brands.forEach(brand => {
    csv.push([
      brand.name,
      brand.code || '',
      brand.description || '',
      brand.website || '',
      brand.email || '',
      brand.phone || '',
      brand.country || '',
      brand.active ? 'true' : 'false',
      brand.featured ? 'true' : 'false',
      brand.productCount || 0,
      brand.stockValue || 0
    ]);
  });

  const csvContent = csv.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `brands_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('Brands exported', 'success');
}

function showImportModal(type) {
  document.getElementById('importModalTitle').textContent = `Import ${type === 'categories' ? 'Categories' : 'Brands'}`;

  const formatInfo = type === 'categories' ? 
    'File should contain: Name, Code, ParentCode, Description, Active, ShowInMenu, ShowInPOS' :
    'File should contain: Name, Code, Description, Website, Email, Phone, Country, Active, Featured';

  document.getElementById('importFormatInfo').innerHTML = `<strong>Format:</strong> ${formatInfo}`;
  document.getElementById('importFile').value = '';
  document.getElementById('importFile').dataset.importType = type;

  document.getElementById('importModal').classList.remove('hidden');
}

function closeImportModal() {
  document.getElementById('importModal').classList.add('hidden');
}

function confirmImport() {
  const fileInput = document.getElementById('importFile');
  const file = fileInput.files[0];
  const importType = fileInput.dataset.importType;

  if (!file) {
    showToast('Please select a file', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());

      if (importType === 'brands') {
        importBrandsFromCSV(lines);
      } else {
        importCategoriesFromCSV(lines);
      }
    } catch (error) {
      showToast('Import failed: ' + error.message, 'error');
    }
  };

  reader.readAsText(file);
  closeImportModal();
}

function importBrandsFromCSV(lines) {
  let imported = 0;
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values[0]) {
      brands.push({
        id: Date.now() + i,
        name: values[0],
        code: values[1] || autoGenerateBrandCode(values[0]),
        description: values[2] || '',
        website: values[3] || '',
        email: values[4] || '',
        phone: values[5] || '',
        country: values[6] || '',
        active: values[7]?.toLowerCase() === 'true',
        featured: values[8]?.toLowerCase() === 'true',
        showInMenu: false,
        displayOrder: imported + 1,
        productCount: 0,
        stockValue: 0,
        selected: false
      });
      imported++;
    }
  }
  localStorage.setItem('brands', JSON.stringify(brands));
  showToast(`${imported} brands imported`, 'success');
  updateTabContent();
}

function importCategoriesFromCSV(lines) {
  let imported = 0;
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values[0]) {
      const parentCode = values[2];
      let parentId = null;
      if (parentCode) {
        const parent = categories.find(c => c.code === parentCode);
        if (parent) parentId = parent.id;
      }

      categories.push({
        id: Date.now() + i,
        name: values[0],
        code: values[1] || '',
        parentId: parentId,
        description: values[3] || '',
        active: values[4]?.toLowerCase() === 'true',
        showInMenu: values[5]?.toLowerCase() === 'true',
        showInPOS: values[6]?.toLowerCase() === 'true',
        displayOrder: imported + 1,
        productCount: 0,
        selected: false
      });
      imported++;
    }
  }
  localStorage.setItem('categories', JSON.stringify(categories));
  showToast(`${imported} categories imported`, 'success');
  updateTabContent();
}

// Drag and Drop
function handleCategoryDragStart(event, categoryId) {
  draggedCategory = categoryId;
  event.target.style.opacity = '0.5';
}

function handleCategoryDragOver(event) {
  event.preventDefault();
}

function handleCategoryDrop(event, targetId) {
  event.preventDefault();
  if (draggedCategory === targetId) return;

  const draggedCat = categories.find(c => c.id === draggedCategory);
  if (draggedCat) {
    draggedCat.parentId = targetId;
    localStorage.setItem('categories', JSON.stringify(categories));
    showToast('Category moved', 'success');
    updateTabContent();
  }
}

function handleCategoryDragEnd(event) {
  event.target.style.opacity = '1';
  draggedCategory = null;
}

// Product Functions
function openAddProductModal() {
  showToast('Product form coming soon', 'info');
}

function closeProductModal() {
  showToast('Product form coming soon', 'info');
}

async function editProduct(id) {
  showToast('Product edit coming soon', 'info');
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  try {
    await api.deleteProduct(id);
    showToast('Product deleted', 'success');
    products = await api.getProducts();
    filteredProducts = products;
    updateTabContent();
  } catch (error) {
    showToast('Failed to delete product', 'error');
  }
}

function filterProducts() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm) ||
      (product.brand && product.brand.toLowerCase().includes(searchTerm)) ||
      (product.model && product.model.toLowerCase().includes(searchTerm)) ||
      (product.imeiNumber && product.imeiNumber.includes(searchTerm));

    if (currentFilter === 'all') return matchesSearch;
    if (currentFilter === 'low-stock') return matchesSearch && product.stockQuantity <= product.minStockLevel;
    return matchesSearch && product.category === currentFilter;
  });
  updateTabContent();
}

function setFilter(filter) {
  currentFilter = filter;
  filterProducts();
}

// Model Functions
function getFilteredModels() {
  let filtered = [...models];

  // Apply brand filter
  if (modelBrandFilter) {
    filtered = filtered.filter(m => m.brandId === parseInt(modelBrandFilter));
  }

  // Apply search filter
  if (modelFilter) {
    filtered = filtered.filter(m => 
      m.name.toLowerCase().includes(modelFilter.toLowerCase()) ||
      (m.modelNumber && m.modelNumber.toLowerCase().includes(modelFilter.toLowerCase())) ||
      (m.modelCode && m.modelCode.toLowerCase().includes(modelFilter.toLowerCase()))
    );
  }

  // Apply status filter
  if (modelStatusFilter === 'active') {
    filtered = filtered.filter(m => m.active);
  } else if (modelStatusFilter === 'inactive') {
    filtered = filtered.filter(m => !m.active);
  }

  return filtered;
}

function autoGenerateModelCode(brandId, modelName) {
  const brand = brands.find(b => b.id === parseInt(brandId));
  if (!brand) return '';
  
  const brandCode = brand.code || brand.name.substring(0, 4).toUpperCase();
  const modelCode = modelName.split(' ').map(w => w.charAt(0)).join('').toUpperCase();
  return `${brandCode}-${modelCode}`;
}

function handleOpenModelModal() {
  editingModelId = null;
  document.getElementById('modelModalTitle').textContent = 'Add Model';
  document.getElementById('modelBrand').value = '';
  document.getElementById('modelName').value = '';
  document.getElementById('modelNumber').value = '';
  document.getElementById('modelCode').value = '';
  document.getElementById('modelLaunchDate').value = '';
  document.getElementById('modelWarranty').value = '12';
  document.getElementById('modelDescription').value = '';
  document.getElementById('modelImage').value = '';
  document.getElementById('modelSpecDisplay').value = '';
  document.getElementById('modelSpecProcessor').value = '';
  document.getElementById('modelSpecCamera').value = '';
  document.getElementById('modelSpecBattery').value = '';
  document.getElementById('modelSpecOS').value = '';
  document.getElementById('modelDisplayOrder').value = '1';
  document.getElementById('modelActive').checked = true;
  document.getElementById('modelDiscontinued').checked = false;
  document.getElementById('variantsContainer').innerHTML = '';

  // Add event listeners
  const modelBrandSelect = document.getElementById('modelBrand');
  const modelNameInput = document.getElementById('modelName');
  const modelCodeInput = document.getElementById('modelCode');
  
  const updateModelCode = () => {
    if (!editingModelId && modelBrandSelect.value && modelNameInput.value) {
      modelCodeInput.value = autoGenerateModelCode(modelBrandSelect.value, modelNameInput.value);
    }
  };
  
  modelBrandSelect.onchange = updateModelCode;
  modelNameInput.oninput = updateModelCode;

  document.getElementById('modelModal').classList.remove('hidden');
}

function closeModelModal() {
  document.getElementById('modelModal').classList.add('hidden');
}

function addVariantRow() {
  const container = document.getElementById('variantsContainer');
  const variantId = Date.now();
  
  const variantRow = document.createElement('div');
  variantRow.className = 'variant-row';
  variantRow.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 40px; gap: 8px; margin-bottom: 8px; padding: 12px; background: var(--surface); border-radius: 8px;';
  variantRow.innerHTML = `
    <input type="text" class="form-input variant-ram" placeholder="RAM (e.g., 8GB)" />
    <input type="text" class="form-input variant-storage" placeholder="Storage (e.g., 256GB)" />
    <input type="text" class="form-input variant-color" placeholder="Color" />
    <input type="text" class="form-input variant-sku" placeholder="SKU (optional)" />
    <button type="button" class="btn btn-error btn-sm" onclick="this.parentElement.remove()" style="padding: 8px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    </button>
  `;
  
  container.appendChild(variantRow);
}

function getVariantsFromForm() {
  const variants = [];
  const variantRows = document.querySelectorAll('.variant-row');
  
  variantRows.forEach(row => {
    const ram = row.querySelector('.variant-ram').value.trim();
    const storage = row.querySelector('.variant-storage').value.trim();
    const color = row.querySelector('.variant-color').value.trim();
    const sku = row.querySelector('.variant-sku').value.trim();
    
    if (ram || storage || color) {
      variants.push({ ram, storage, color, sku });
    }
  });
  
  return variants;
}

function saveModel() {
  const brandId = document.getElementById('modelBrand').value;
  const name = document.getElementById('modelName').value.trim();
  
  if (!brandId) {
    showToast('Please select a brand', 'error');
    return;
  }
  
  if (!name) {
    showToast('Model name is required', 'error');
    return;
  }

  const modelCode = document.getElementById('modelCode').value.trim() || 
                     autoGenerateModelCode(brandId, name);

  const modelData = {
    id: editingModelId || Date.now(),
    brandId: parseInt(brandId),
    name: name,
    modelNumber: document.getElementById('modelNumber').value.trim(),
    modelCode: modelCode,
    description: document.getElementById('modelDescription').value.trim(),
    imageUrl: document.getElementById('modelImage').value.trim(),
    launchDate: document.getElementById('modelLaunchDate').value,
    discontinued: document.getElementById('modelDiscontinued').checked,
    baseSpecs: {
      display: document.getElementById('modelSpecDisplay').value.trim(),
      processor: document.getElementById('modelSpecProcessor').value.trim(),
      camera: document.getElementById('modelSpecCamera').value.trim(),
      battery: document.getElementById('modelSpecBattery').value.trim(),
      os: document.getElementById('modelSpecOS').value.trim()
    },
    warrantyMonths: parseInt(document.getElementById('modelWarranty').value) || 12,
    active: document.getElementById('modelActive').checked,
    displayOrder: parseInt(document.getElementById('modelDisplayOrder').value) || 1,
    variants: getVariantsFromForm(),
    selected: false
  };

  const existingIndex = models.findIndex(m => m.id === modelData.id);

  if (existingIndex !== -1) {
    models[existingIndex] = { ...models[existingIndex], ...modelData };
    showToast('Model updated successfully', 'success');
  } else {
    models.push(modelData);
    showToast('Model added successfully', 'success');
  }

  editingModelId = null;
  localStorage.setItem('models', JSON.stringify(models));
  closeModelModal();
  updateTabContent();
}

function handleEditModel(id) {
  const model = models.find(m => m.id === id);
  if (!model) return;

  editingModelId = id;
  document.getElementById('modelModalTitle').textContent = 'Edit Model';
  document.getElementById('modelBrand').value = model.brandId;
  document.getElementById('modelName').value = model.name;
  document.getElementById('modelNumber').value = model.modelNumber || '';
  document.getElementById('modelCode').value = model.modelCode || '';
  document.getElementById('modelLaunchDate').value = model.launchDate || '';
  document.getElementById('modelWarranty').value = model.warrantyMonths || 12;
  document.getElementById('modelDescription').value = model.description || '';
  document.getElementById('modelImage').value = model.imageUrl || '';
  document.getElementById('modelSpecDisplay').value = model.baseSpecs?.display || '';
  document.getElementById('modelSpecProcessor').value = model.baseSpecs?.processor || '';
  document.getElementById('modelSpecCamera').value = model.baseSpecs?.camera || '';
  document.getElementById('modelSpecBattery').value = model.baseSpecs?.battery || '';
  document.getElementById('modelSpecOS').value = model.baseSpecs?.os || '';
  document.getElementById('modelDisplayOrder').value = model.displayOrder || 1;
  document.getElementById('modelActive').checked = model.active;
  document.getElementById('modelDiscontinued').checked = model.discontinued || false;

  // Load variants
  const container = document.getElementById('variantsContainer');
  container.innerHTML = '';
  if (model.variants && model.variants.length > 0) {
    model.variants.forEach(variant => {
      addVariantRow();
      const lastRow = container.lastElementChild;
      lastRow.querySelector('.variant-ram').value = variant.ram || '';
      lastRow.querySelector('.variant-storage').value = variant.storage || '';
      lastRow.querySelector('.variant-color').value = variant.color || '';
      lastRow.querySelector('.variant-sku').value = variant.sku || '';
    });
  }

  document.getElementById('modelModal').classList.remove('hidden');
}

function handleDeleteModel(id) {
  const model = models.find(m => m.id === id);
  if (!model) return;

  const variantCount = model.variants ? model.variants.length : 0;
  
  if (variantCount > 0) {
    if (!confirm(`This model has ${variantCount} variants. Are you sure you want to delete it?`)) {
      return;
    }
  }

  models = models.filter(m => m.id !== id);
  localStorage.setItem('models', JSON.stringify(models));
  showToast('Model deleted successfully', 'success');
  updateTabContent();
}

function handleFilterModels(query) {
  modelFilter = query;
  updateTabContent();
}

function handleFilterModelsByBrand(brandId) {
  modelBrandFilter = brandId;
  updateTabContent();
}

function handleFilterModelsByStatus(status) {
  modelStatusFilter = status;
  updateTabContent();
}

function toggleModelSelection(id) {
  const model = models.find(m => m.id === id);
  if (model) {
    model.selected = !model.selected;
    localStorage.setItem('models', JSON.stringify(models));
    updateTabContent();
  }
}

function toggleSelectAllModels(checked) {
  const filteredModels = getFilteredModels();
  models.forEach(m => {
    if (filteredModels.find(fm => fm.id === m.id)) {
      m.selected = checked;
    }
  });
  localStorage.setItem('models', JSON.stringify(models));
  updateTabContent();
}

function bulkActivateModels() {
  models.forEach(m => {
    if (m.selected) {
      m.active = true;
      m.selected = false;
    }
  });
  localStorage.setItem('models', JSON.stringify(models));
  showToast('Models activated', 'success');
  updateTabContent();
}

function bulkDeactivateModels() {
  models.forEach(m => {
    if (m.selected) {
      m.active = false;
      m.selected = false;
    }
  });
  localStorage.setItem('models', JSON.stringify(models));
  showToast('Models deactivated', 'success');
  updateTabContent();
}

function bulkDeleteModels() {
  const selectedIds = models.filter(m => m.selected).map(m => m.id);
  if (!confirm(`Delete ${selectedIds.length} models?`)) return;

  models = models.filter(m => !m.selected);
  localStorage.setItem('models', JSON.stringify(models));
  showToast('Models deleted', 'success');
  updateTabContent();
}

function exportModels() {
  const csv = [
    ['Brand', 'Model Name', 'Model Number', 'Model Code', 'Launch Date', 'Warranty (months)', 'Active', 'Variants']
  ];

  models.forEach(model => {
    const brand = brands.find(b => b.id === model.brandId);
    const variantCount = model.variants ? model.variants.length : 0;
    csv.push([
      brand?.name || '',
      model.name,
      model.modelNumber || '',
      model.modelCode || '',
      model.launchDate || '',
      model.warrantyMonths || 12,
      model.active ? 'true' : 'false',
      variantCount
    ]);
  });

  const csvContent = csv.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `models_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('Models exported', 'success');
}

function viewModelVariants(id) {
  const model = models.find(m => m.id === id);
  if (!model) return;

  const brand = brands.find(b => b.id === model.brandId);
  document.getElementById('modelVariantsModalTitle').textContent = `${brand?.name || ''} ${model.name} - Variants`;

  const content = document.getElementById('modelVariantsContent');
  
  if (!model.variants || model.variants.length === 0) {
    content.innerHTML = '<p class="text-center" style="padding: 48px; color: var(--text-secondary);">No variants defined for this model</p>';
  } else {
    content.innerHTML = `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>RAM</th>
              <th>Storage</th>
              <th>Color</th>
              <th>SKU</th>
            </tr>
          </thead>
          <tbody>
            ${model.variants.map(variant => `
              <tr>
                <td><strong>${variant.ram || '-'}</strong></td>
                <td>${variant.storage || '-'}</td>
                <td>${variant.color || '-'}</td>
                <td class="font-mono">${variant.sku || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  document.getElementById('modelVariantsModal').classList.remove('hidden');
}

function closeModelVariantsModal() {
  document.getElementById('modelVariantsModal').classList.add('hidden');
}

function closeDeleteCategoryModal() {
  document.getElementById('deleteCategoryModal').classList.add('hidden');
}

export async function init(app) {
  // Expose all functions to global scope
  window.switchTab = switchTab;
  window.updateTabContent = updateTabContent;
  window.handleOpenCategoryModal = handleOpenCategoryModal;
  window.closeCategoryModal = closeCategoryModal;
  window.saveCategory = saveCategory;
  window.handleEditCategory = handleEditCategory;
  window.handleDeleteCategory = handleDeleteCategory;
  window.closeDeleteCategoryModal = closeDeleteCategoryModal;
  window.handleFilterCategories = handleFilterCategories;
  window.handleFilterCategoriesByStatus = handleFilterCategoriesByStatus;
  window.toggleCategoryExpand = toggleCategoryExpand;
  window.toggleCategorySelection = toggleCategorySelection;
  window.bulkActivateCategories = bulkActivateCategories;
  window.bulkDeactivateCategories = bulkDeactivateCategories;
  window.bulkDeleteCategories = bulkDeleteCategories;
  window.exportCategories = exportCategories;
  window.handleOpenBrandModal = handleOpenBrandModal;
  window.closeBrandModal = closeBrandModal;
  window.saveBrand = saveBrand;
  window.handleEditBrand = handleEditBrand;
  window.handleDeleteBrand = handleDeleteBrand;
  window.handleFilterBrands = handleFilterBrands;
  window.handleFilterBrandsByStatus = handleFilterBrandsByStatus;
  window.handleSortBrands = handleSortBrands;
  window.toggleBrandView = toggleBrandView;
  window.toggleBrandSelection = toggleBrandSelection;
  window.toggleSelectAllBrands = toggleSelectAllBrands;
  window.bulkActivateBrands = bulkActivateBrands;
  window.bulkDeactivateBrands = bulkDeactivateBrands;
  window.bulkSetFeaturedBrands = bulkSetFeaturedBrands;
  window.bulkDeleteBrands = bulkDeleteBrands;
  window.exportBrands = exportBrands;
  window.showImportModal = showImportModal;
  window.closeImportModal = closeImportModal;
  window.confirmImport = confirmImport;
  window.handleCategoryDragStart = handleCategoryDragStart;
  window.handleCategoryDragOver = handleCategoryDragOver;
  window.handleCategoryDrop = handleCategoryDrop;
  window.handleCategoryDragEnd = handleCategoryDragEnd;
  window.openAddProductModal = openAddProductModal;
  window.closeProductModal = closeProductModal;
  window.editProduct = editProduct;
  window.deleteProduct = deleteProduct;
  window.filterProducts = filterProducts;
  window.setFilter = setFilter;
  window.handleOpenModelModal = handleOpenModelModal;
  window.closeModelModal = closeModelModal;
  window.saveModel = saveModel;
  window.handleEditModel = handleEditModel;
  window.handleDeleteModel = handleDeleteModel;
  window.handleFilterModels = handleFilterModels;
  window.handleFilterModelsByBrand = handleFilterModelsByBrand;
  window.handleFilterModelsByStatus = handleFilterModelsByStatus;
  window.toggleModelSelection = toggleModelSelection;
  window.toggleSelectAllModels = toggleSelectAllModels;
  window.bulkActivateModels = bulkActivateModels;
  window.bulkDeactivateModels = bulkDeactivateModels;
  window.bulkDeleteModels = bulkDeleteModels;
  window.exportModels = exportModels;
  window.addVariantRow = addVariantRow;
  window.viewModelVariants = viewModelVariants;
  window.closeModelVariantsModal = closeModelVariantsModal;

  // Load initial data
  try {
    const productsData = await api.getProducts();
    products = productsData;
    filteredProducts = products;
    updateTabContent();
  } catch (error) {
    console.error('Failed to load initial data:', error);
    showToast('Failed to load initial data', 'error');
  }
}