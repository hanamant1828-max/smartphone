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

    <!-- Product Modal -->
    <div id="productModal" class="modal-backdrop hidden">
      <div class="modal" style="max-width: 1200px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3 class="modal-title" id="productModalTitle">Add New Product</h3>
          <button class="modal-close" onclick="closeProductModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <!-- Step Indicators -->
        <div style="display: flex; justify-content: space-between; padding: 24px 24px 0; gap: 8px;">
          <div id="stepIndicator1" class="step-indicator active" onclick="jumpToProductStep(1)">
            <div class="step-number">1</div>
            <div class="step-label">Basic Info</div>
          </div>
          <div id="stepIndicator2" class="step-indicator" onclick="jumpToProductStep(2)">
            <div class="step-number">2</div>
            <div class="step-label">Pricing</div>
          </div>
          <div id="stepIndicator3" class="step-indicator" onclick="jumpToProductStep(3)">
            <div class="step-number">3</div>
            <div class="step-label">Stock</div>
          </div>
          <div id="stepIndicator4" class="step-indicator" onclick="jumpToProductStep(4)">
            <div class="step-number">4</div>
            <div class="step-label">Details</div>
          </div>
          <div id="stepIndicator5" class="step-indicator" onclick="jumpToProductStep(5)">
            <div class="step-number">5</div>
            <div class="step-label">Images</div>
          </div>
        </div>
        
        <div class="modal-body">
          <form id="productForm">
            <!-- Step 1: Basic Information -->
            <div id="productStep1" class="product-step">
              <h4 style="margin-bottom: 16px; font-size: 1.125rem; font-weight: 600;">Basic Information</h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="form-label">Product Name *</label>
                  <input type="text" id="productName" class="form-input" placeholder="e.g., Samsung Galaxy S24 Ultra" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Category *</label>
                  <select id="productCategory" class="form-input" required>
                    <option value="">Select Category</option>
                    ${categories.filter(c => c.active).map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Brand *</label>
                  <select id="productBrand" class="form-input" required onchange="loadBrandModels()">
                    <option value="">Select Brand</option>
                    ${brands.filter(b => b.active).map(b => `<option value="${b.name}">${b.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Model</label>
                  <select id="productModel" class="form-input">
                    <option value="">Select Model</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Variant</label>
                  <input type="text" id="productVariant" class="form-input" placeholder="e.g., 256GB, Black" />
                </div>
                <div class="form-group">
                  <label class="form-label">SKU/Product Code</label>
                  <div style="display: flex; gap: 8px;">
                    <input type="text" id="productSKU" class="form-input" placeholder="Auto-generated" />
                    <button type="button" class="btn btn-outline" onclick="generateSKU()">Generate</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Barcode</label>
                  <div style="display: flex; gap: 8px;">
                    <input type="text" id="productBarcode" class="form-input" placeholder="Scan or generate" />
                    <button type="button" class="btn btn-outline" onclick="generateBarcode()">Generate</button>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Short Description (500 characters max)</label>
                <textarea id="productShortDesc" class="form-input" rows="3" maxlength="500" placeholder="Brief product description"></textarea>
              </div>
            </div>
            
            <!-- Step 2: Pricing -->
            <div id="productStep2" class="product-step" style="display: none;">
              <h4 style="margin-bottom: 16px; font-size: 1.125rem; font-weight: 600;">Pricing Information</h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="form-label">Purchase Price *</label>
                  <input type="number" id="productPurchasePrice" class="form-input" placeholder="0.00" step="0.01" min="0" required oninput="calculateProfitMargin()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Selling Price *</label>
                  <input type="number" id="productSellingPrice" class="form-input" placeholder="0.00" step="0.01" min="0" required oninput="calculateProfitMargin()" />
                </div>
                <div class="form-group">
                  <label class="form-label">MRP (Optional)</label>
                  <input type="number" id="productMRP" class="form-input" placeholder="0.00" step="0.01" min="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Profit Margin</label>
                  <div style="padding: 12px; background: var(--surface); border-radius: 8px;">
                    <span id="profitMargin" style="font-size: 1.5rem; font-weight: 600;">0%</span>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Tax Type</label>
                  <select id="productTaxType" class="form-input">
                    <option value="inclusive">Inclusive</option>
                    <option value="exclusive">Exclusive</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">GST Rate</label>
                  <select id="productGST" class="form-input">
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18" selected>18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">HSN Code</label>
                  <input type="text" id="productHSN" class="form-input" placeholder="e.g., 8517" />
                </div>
                <div class="form-group">
                  <label class="form-label">Discount Type</label>
                  <select id="productDiscountType" class="form-input">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Discount Amount</label>
                  <input type="number" id="productDiscount" class="form-input" placeholder="0" step="0.01" min="0" />
                </div>
              </div>
            </div>
            
            <!-- Step 3: Stock Management -->
            <div id="productStep3" class="product-step" style="display: none;">
              <h4 style="margin-bottom: 16px; font-size: 1.125rem; font-weight: 600;">Stock Management</h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="form-label">Opening Stock *</label>
                  <input type="number" id="productOpeningStock" class="form-input" placeholder="0" min="0" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Unit of Measurement</label>
                  <select id="productUOM" class="form-input">
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="box">Box</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="ltr">Liter (ltr)</option>
                    <option value="meter">Meter</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Minimum Stock Level</label>
                  <input type="number" id="productMinStock" class="form-input" placeholder="0" min="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Maximum Stock Level</label>
                  <input type="number" id="productMaxStock" class="form-input" placeholder="0" min="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Reorder Point</label>
                  <input type="number" id="productReorderPoint" class="form-input" placeholder="0" min="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Reorder Quantity</label>
                  <input type="number" id="productReorderQty" class="form-input" placeholder="0" min="0" />
                </div>
              </div>
              <div class="grid grid-cols-3 gap-4 mt-4">
                <div class="form-group">
                  <label class="flex items-center gap-2">
                    <input type="checkbox" id="productTrackStock" checked />
                    <span>Track Stock</span>
                  </label>
                </div>
                <div class="form-group">
                  <label class="flex items-center gap-2">
                    <input type="checkbox" id="productAutoManage" />
                    <span>Auto Manage Stock</span>
                  </label>
                </div>
                <div class="form-group">
                  <label class="flex items-center gap-2">
                    <input type="checkbox" id="productAllowBackorder" />
                    <span>Allow Backorders</span>
                  </label>
                </div>
              </div>
            </div>
            
            <!-- Step 4: Additional Details -->
            <div id="productStep4" class="product-step" style="display: none;">
              <h4 style="margin-bottom: 16px; font-size: 1.125rem; font-weight: 600;">Additional Details</h4>
              
              <h5 style="margin: 24px 0 12px; font-weight: 600;">Supplier Information</h5>
              <div class="grid grid-cols-3 gap-4">
                <div class="form-group">
                  <label class="form-label">Primary Supplier</label>
                  <select id="productSupplier" class="form-input">
                    <option value="">Select Supplier</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Supplier Product Code</label>
                  <input type="text" id="productSupplierCode" class="form-input" placeholder="Supplier SKU" />
                </div>
                <div class="form-group">
                  <label class="form-label">Lead Time (days)</label>
                  <input type="number" id="productLeadTime" class="form-input" placeholder="0" min="0" />
                </div>
              </div>
              
              <h5 style="margin: 24px 0 12px; font-weight: 600;">Warranty Information</h5>
              <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="form-label">Warranty Period</label>
                  <input type="text" id="productWarrantyPeriod" class="form-input" placeholder="e.g., 1 year" />
                </div>
                <div class="form-group">
                  <label class="form-label">Warranty Type</label>
                  <select id="productWarrantyType" class="form-input">
                    <option value="none">None</option>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="seller">Seller</option>
                    <option value="extended">Extended</option>
                  </select>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Warranty Description</label>
                  <textarea id="productWarrantyDesc" class="form-input" rows="2" placeholder="Warranty terms and conditions"></textarea>
                </div>
              </div>
              
              <h5 style="margin: 24px 0 12px; font-weight: 600;">Product Configuration</h5>
              <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="form-label">Product Type</label>
                  <select id="productType" class="form-input">
                    <option value="simple">Simple Product</option>
                    <option value="variable">Variable Product</option>
                    <option value="bundle">Bundle</option>
                    <option value="serial">Serial Tracked (IMEI)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select id="productStatus" class="form-input">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              
              <div class="grid grid-cols-3 gap-4 mt-4">
                <div class="form-group">
                  <label class="flex items-center gap-2">
                    <input type="checkbox" id="productShowPOS" checked />
                    <span>Show in POS</span>
                  </label>
                </div>
                <div class="form-group">
                  <label class="flex items-center gap-2">
                    <input type="checkbox" id="productOnlineSale" />
                    <span>Available for Online Sale</span>
                  </label>
                </div>
                <div class="form-group">
                  <label class="flex items-center gap-2">
                    <input type="checkbox" id="productFeatured" />
                    <span>Featured Product</span>
                  </label>
                </div>
              </div>
              
              <div class="form-group mt-4">
                <label class="form-label">Detailed Description</label>
                <textarea id="productDetailedDesc" class="form-input" rows="4" placeholder="Detailed product description"></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">Internal Notes (Not visible to customers)</label>
                <textarea id="productInternalNotes" class="form-input" rows="3" placeholder="Internal notes for staff"></textarea>
              </div>
            </div>
            
            <!-- Step 5: Images -->
            <div id="productStep5" class="product-step" style="display: none;">
              <h4 style="margin-bottom: 16px; font-size: 1.125rem; font-weight: 600;">Product Images</h4>
              <div class="form-group">
                <label class="form-label">Upload Images (Max 10, 5MB each - JPG, PNG, WebP)</label>
                <div style="border: 2px dashed var(--border); border-radius: 8px; padding: 40px; text-align: center; background: var(--surface);" 
                     ondrop="event.preventDefault(); handleImageUpload(event.dataTransfer.files);" 
                     ondragover="event.preventDefault();">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 16px; color: var(--text-secondary);">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p style="margin-bottom: 12px; color: var(--text-secondary);">Drag & drop images here or</p>
                  <label class="btn btn-outline" style="cursor: pointer;">
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple onchange="handleImageUpload(this.files)" style="display: none;" />
                    Browse Files
                  </label>
                </div>
              </div>
              <div id="productImagesContainer" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; margin-top: 24px;">
                <!-- Images will be rendered here -->
              </div>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeProductModal()">Cancel</button>
          <button class="btn btn-outline" onclick="saveDraft()">Save Draft</button>
          <button id="productPrevBtn" class="btn btn-outline" onclick="prevProductStep()" style="display: none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Previous
          </button>
          <button id="productNextBtn" class="btn btn-primary" onclick="nextProductStep()">
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <button id="productSaveBtn" class="btn btn-primary" onclick="saveProduct()" style="display: none;">Save Product</button>
          <button class="btn btn-success" onclick="saveProduct(true)" style="display: none;" id="productSaveAddBtn">Save & Add Another</button>
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
  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0);
  const lowStockCount = products.filter(p => p.stockQuantity <= p.minStockLevel).length;
  const outOfStockCount = products.filter(p => p.stockQuantity === 0).length;

  return `
    <!-- Breadcrumb Navigation -->
    <nav style="margin-bottom: 24px; color: var(--text-secondary); font-size: 0.875rem;">
      <span>Home</span>
      <span style="margin: 0 8px;">/</span>
      <span style="color: var(--text-primary); font-weight: 500;">Inventory Management</span>
    </nav>

    <!-- Summary Cards -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="stat-card">
        <div class="stat-card-icon" style="background: var(--primary);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        </div>
        <div class="stat-card-value" data-testid="stat-total-products">${formatNumber(totalProducts)}</div>
        <div class="stat-card-label">Total Products</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-icon" style="background: var(--success);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="stat-card-value" data-testid="stat-stock-value">${formatCurrency(totalStockValue)}</div>
        <div class="stat-card-label">Total Stock Value</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-icon" style="background: var(--warning);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="stat-card-value" style="color: var(--warning);" data-testid="stat-low-stock">${formatNumber(lowStockCount)}</div>
        <div class="stat-card-label">Low Stock Alert</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-icon" style="background: var(--error);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div class="stat-card-value" style="color: var(--error);" data-testid="stat-out-stock">${formatNumber(outOfStockCount)}</div>
        <div class="stat-card-label">Out of Stock</div>
      </div>
    </div>

    <!-- Action Buttons Bar -->
    <div class="card mb-6">
      <div class="flex gap-4 items-center justify-between">
        <div class="flex gap-3">
          <button class="btn btn-primary" onclick="openAddProductModal()" data-testid="button-add-new-product">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add New Product
          </button>
          
          <div style="position: relative;">
            <button class="btn btn-outline" onclick="toggleExportMenu()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export Inventory
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div id="exportMenu" class="hidden" style="position: absolute; top: 100%; left: 0; margin-top: 4px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: var(--shadow-md); min-width: 180px; z-index: 100;">
              <button onclick="exportInventory('excel')" style="width: 100%; padding: 12px 16px; text-align: left; border: none; background: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='none'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Export to Excel
              </button>
              <button onclick="exportInventory('csv')" style="width: 100%; padding: 12px 16px; text-align: left; border: none; background: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='none'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Export to CSV
              </button>
              <button onclick="exportInventory('pdf')" style="width: 100%; padding: 12px 16px; text-align: left; border: none; background: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='none'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Export to PDF
              </button>
            </div>
          </div>
          
          <button class="btn btn-outline" onclick="showImportModal('products')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import Products
          </button>
          
          <button class="btn btn-outline" onclick="toggleViewSettings()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m5.196-11.196l-4.242 4.242m0 4.242l-4.242 4.242m11.196-5.196l-6 .001m-6 0l-6-.001m11.196 5.195l-4.242-4.242m0-4.242l-4.242-4.242"/>
            </svg>
            View Settings
          </button>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="card mb-6">
      <div class="flex gap-4 items-center">
        <div class="flex-1" style="position: relative; max-width: 600px;">
          <input 
            type="search" 
            class="form-input" 
            placeholder="Search by product name, SKU, barcode..." 
            id="searchInput"
            data-testid="input-search-products"
            oninput="filterProducts()"
            style="padding-right: 40px;"
          />
          <button 
            onclick="clearSearch()" 
            style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-secondary); display: none;"
            id="clearSearchBtn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
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
            <th style="width: 40px;">
              <input type="checkbox" onchange="toggleSelectAllProducts(this.checked)" id="selectAllCheckbox" />
            </th>
            <th style="width: 80px;">Image</th>
            <th onclick="sortProducts('name')" style="cursor: pointer;">
              Product Name
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle;">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </th>
            <th onclick="sortProducts('category')" style="cursor: pointer;">Category</th>
            <th onclick="sortProducts('brand')" style="cursor: pointer;">Brand</th>
            <th onclick="sortProducts('model')" style="cursor: pointer;">Model</th>
            <th>SKU</th>
            <th>Barcode</th>
            <th onclick="sortProducts('costPrice')" style="cursor: pointer; text-align: right;">Purchase Price</th>
            <th onclick="sortProducts('price')" style="cursor: pointer; text-align: right;">Selling Price</th>
            <th onclick="sortProducts('stockQuantity')" style="cursor: pointer; text-align: center;">Stock</th>
            <th style="text-align: center;">Status</th>
            <th style="width: 140px; text-align: center;">Actions</th>
          </tr>
        </thead>
        <tbody id="productsTableBody">
          ${renderProductRows()}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div style="margin-top: 24px; display: flex; justify-content: between; align-items: center;">
      <div style="color: var(--text-secondary); font-size: 0.875rem;">
        Showing ${filteredProducts.length} of ${totalProducts} products
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <span style="font-size: 0.875rem; color: var(--text-secondary);">Items per page:</span>
        <select class="form-input" style="width: 80px; height: 36px; padding: 0 8px;" onchange="changePageSize(this.value)">
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
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
    const message = document.getElementById('searchInput')?.value ? 
      `<p style="margin-bottom: 16px;">No products found matching your search</p>
       <button class="btn btn-outline" onclick="clearSearch()">Clear Search</button>` :
      `<p style="margin-bottom: 16px;">No products in inventory</p>
       <button class="btn btn-primary" onclick="openAddProductModal()">Add New Product</button>`;
    
    return `
      <tr>
        <td colspan="13" class="text-center" style="padding: 48px;">
          <div style="color: var(--text-secondary);">
            ${message}
          </div>
        </td>
      </tr>
    `;
  }

  return filteredProducts.map((product, index) => {
    const stockStatus = product.stockQuantity === 0 ? 'Out of Stock' : 
                       product.stockQuantity <= product.minStockLevel ? 'Low Stock' : 'In Stock';
    const statusClass = product.stockQuantity === 0 ? 'badge-error' : 
                       product.stockQuantity <= product.minStockLevel ? 'badge-warning' : 'badge-success';
    
    return `
      <tr data-product-id="${product.id}" style="background: ${index % 2 === 1 ? 'var(--bg-secondary)' : 'transparent'};" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='${index % 2 === 1 ? 'var(--bg-secondary)' : 'transparent'}'">
        <td>
          <input type="checkbox" class="product-checkbox" data-product-id="${product.id}" onchange="updateBulkActions()" />
        </td>
        <td>
          ${product.imageUrl ? 
            `<img src="${product.imageUrl}" alt="${product.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);" />` :
            `<div style="width: 60px; height: 60px; background: var(--surface); border-radius: 4px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); font-weight: 500; color: var(--text-secondary);">${product.name.substring(0, 2).toUpperCase()}</div>`
          }
        </td>
        <td>
          <strong>${product.name}</strong>
          ${product.color || product.storage || product.ram ? `<br><small style="color: var(--text-secondary);">${[product.color, product.storage, product.ram].filter(Boolean).join(' • ')}</small>` : ''}
          ${product.productCode ? `<br><code style="font-size: 0.75rem; color: var(--text-secondary);">${product.productCode}</code>` : ''}
        </td>
        <td>
          <span class="badge badge-primary" style="font-size: 0.75rem;">
            ${product.category || '-'}
          </span>
        </td>
        <td>${product.brand || '-'}</td>
        <td>${product.model || '-'}</td>
        <td class="font-mono" style="font-size: 0.8125rem;">${product.productCode || '-'}</td>
        <td class="font-mono" style="font-size: 0.8125rem;">${product.barcode || '-'}</td>
        <td class="font-mono" style="text-align: right;">${formatCurrency(product.costPrice || 0)}</td>
        <td class="font-mono" style="text-align: right;"><strong>${formatCurrency(product.price)}</strong></td>
        <td style="text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <button class="btn btn-outline btn-sm" onclick="adjustStock(${product.id}, -1)" style="width: 28px; height: 28px; padding: 0;" title="Decrease stock">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <strong style="min-width: 40px; text-align: center;">${product.stockQuantity}</strong>
            <button class="btn btn-outline btn-sm" onclick="adjustStock(${product.id}, 1)" style="width: 28px; height: 28px; padding: 0;" title="Increase stock">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </td>
        <td style="text-align: center;">
          <span class="badge ${statusClass}">
            ${stockStatus}
          </span>
        </td>
        <td style="text-align: center;">
          <div class="flex gap-2" style="justify-content: center;">
            <button class="btn btn-outline btn-sm" onclick="viewProduct(${product.id})" title="View Details">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button class="btn btn-outline btn-sm" onclick="editProduct(${product.id})" title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn btn-error btn-sm" onclick="deleteProduct(${product.id})" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
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

// Product Modal State
let currentProductStep = 1;
let editingProductId = null;
let productFormData = {};
let productImages = [];
let autoSaveInterval = null;

// Product Functions
function openAddProductModal() {
  editingProductId = null;
  currentProductStep = 1;
  productFormData = {};
  productImages = [];
  
  // Clear form
  document.getElementById('productForm').reset();
  document.getElementById('productModalTitle').textContent = 'Add New Product';
  document.getElementById('productModal').classList.remove('hidden');
  
  updateProductStepIndicators();
  showProductStep(1);
  
  // Start auto-save
  startAutoSave();
}

function closeProductModal() {
  if (hasUnsavedChanges()) {
    if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
  }
  
  stopAutoSave();
  document.getElementById('productModal').classList.add('hidden');
  editingProductId = null;
  currentProductStep = 1;
  productFormData = {};
  productImages = [];
}

async function editProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  
  editingProductId = id;
  currentProductStep = 1;
  productFormData = { ...product };
  productImages = product.images || [];
  
  // Populate form
  document.getElementById('productModalTitle').textContent = 'Edit Product';
  populateProductForm(product);
  
  document.getElementById('productModal').classList.remove('hidden');
  updateProductStepIndicators();
  showProductStep(1);
  
  startAutoSave();
}

function populateProductForm(product) {
  // Step 1: Basic Information
  document.getElementById('productName').value = product.name || '';
  document.getElementById('productCategory').value = product.category || '';
  document.getElementById('productBrand').value = product.brand || '';
  document.getElementById('productModel').value = product.model || '';
  document.getElementById('productVariant').value = product.variant || '';
  document.getElementById('productSKU').value = product.productCode || '';
  document.getElementById('productBarcode').value = product.barcode || '';
  document.getElementById('productShortDesc').value = product.shortDescription || '';
  
  // Step 2: Pricing
  document.getElementById('productPurchasePrice').value = product.costPrice || '';
  document.getElementById('productSellingPrice').value = product.price || '';
  document.getElementById('productMRP').value = product.mrp || '';
  document.getElementById('productTaxType').value = product.taxType || 'inclusive';
  document.getElementById('productGST').value = product.gstRate || '18';
  document.getElementById('productHSN').value = product.hsnCode || '';
  document.getElementById('productDiscountType').value = product.discountType || 'percentage';
  document.getElementById('productDiscount').value = product.discount || '0';
  
  // Step 3: Stock
  document.getElementById('productOpeningStock').value = product.stockQuantity || '';
  document.getElementById('productUOM').value = product.uom || 'pcs';
  document.getElementById('productMinStock').value = product.minStockLevel || '';
  document.getElementById('productMaxStock').value = product.maxStockLevel || '';
  document.getElementById('productReorderPoint').value = product.reorderPoint || '';
  document.getElementById('productReorderQty').value = product.reorderQty || '';
  document.getElementById('productTrackStock').checked = product.trackStock !== false;
  document.getElementById('productAutoManage').checked = product.autoManage || false;
  document.getElementById('productAllowBackorder').checked = product.allowBackorder || false;
  
  // Step 4: Additional Details
  document.getElementById('productSupplier').value = product.supplierId || '';
  document.getElementById('productSupplierCode').value = product.supplierCode || '';
  document.getElementById('productLeadTime').value = product.leadTime || '';
  document.getElementById('productWarrantyPeriod').value = product.warrantyPeriod || '';
  document.getElementById('productWarrantyType').value = product.warrantyType || 'none';
  document.getElementById('productWarrantyDesc').value = product.warrantyDesc || '';
  document.getElementById('productType').value = product.productType || 'simple';
  document.getElementById('productStatus').value = product.status || 'active';
  document.getElementById('productShowPOS').checked = product.showInPOS !== false;
  document.getElementById('productOnlineSale').checked = product.availableOnline || false;
  document.getElementById('productFeatured').checked = product.featured || false;
  document.getElementById('productDetailedDesc').value = product.description || '';
  document.getElementById('productInternalNotes').value = product.internalNotes || '';
  
  calculateProfitMargin();
}

function showProductStep(step) {
  currentProductStep = step;
  
  // Hide all steps
  for (let i = 1; i <= 5; i++) {
    const stepEl = document.getElementById(`productStep${i}`);
    if (stepEl) {
      stepEl.style.display = i === step ? 'block' : 'none';
    }
  }
  
  updateProductStepIndicators();
  updateProductNavigationButtons();
}

function updateProductStepIndicators() {
  for (let i = 1; i <= 5; i++) {
    const indicator = document.getElementById(`stepIndicator${i}`);
    if (indicator) {
      if (i < currentProductStep) {
        indicator.className = 'step-indicator completed';
      } else if (i === currentProductStep) {
        indicator.className = 'step-indicator active';
      } else {
        indicator.className = 'step-indicator';
      }
    }
  }
}

function updateProductNavigationButtons() {
  const prevBtn = document.getElementById('productPrevBtn');
  const nextBtn = document.getElementById('productNextBtn');
  const saveBtn = document.getElementById('productSaveBtn');
  
  if (prevBtn) {
    prevBtn.style.display = currentProductStep === 1 ? 'none' : 'inline-flex';
  }
  
  if (nextBtn) {
    nextBtn.style.display = currentProductStep === 5 ? 'none' : 'inline-flex';
  }
  
  if (saveBtn) {
    saveBtn.style.display = currentProductStep === 5 ? 'inline-flex' : 'none';
  }
}

function nextProductStep() {
  if (validateProductStep(currentProductStep)) {
    saveStepData(currentProductStep);
    if (currentProductStep < 5) {
      showProductStep(currentProductStep + 1);
    }
  }
}

function prevProductStep() {
  if (currentProductStep > 1) {
    saveStepData(currentProductStep);
    showProductStep(currentProductStep - 1);
  }
}

function jumpToProductStep(step) {
  saveStepData(currentProductStep);
  showProductStep(step);
}

function validateProductStep(step) {
  const errors = [];
  
  if (step === 1) {
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value;
    const brand = document.getElementById('productBrand').value;
    
    if (!name) errors.push('Product name is required');
    if (!category) errors.push('Category is required');
    if (!brand) errors.push('Brand is required');
  }
  
  if (step === 2) {
    const purchasePrice = parseFloat(document.getElementById('productPurchasePrice').value);
    const sellingPrice = parseFloat(document.getElementById('productSellingPrice').value);
    
    if (!purchasePrice || purchasePrice <= 0) errors.push('Purchase price is required');
    if (!sellingPrice || sellingPrice <= 0) errors.push('Selling price is required');
    if (sellingPrice < purchasePrice) errors.push('Selling price cannot be less than purchase price');
  }
  
  if (step === 3) {
    const stock = document.getElementById('productOpeningStock').value;
    if (!stock || stock < 0) errors.push('Opening stock is required');
  }
  
  if (errors.length > 0) {
    showToast(errors.join(', '), 'error');
    return false;
  }
  
  return true;
}

function saveStepData(step) {
  if (step === 1) {
    productFormData.name = document.getElementById('productName').value.trim();
    productFormData.category = document.getElementById('productCategory').value;
    productFormData.brand = document.getElementById('productBrand').value;
    productFormData.model = document.getElementById('productModel').value;
    productFormData.variant = document.getElementById('productVariant').value;
    productFormData.productCode = document.getElementById('productSKU').value;
    productFormData.barcode = document.getElementById('productBarcode').value;
    productFormData.shortDescription = document.getElementById('productShortDesc').value;
  } else if (step === 2) {
    productFormData.costPrice = parseFloat(document.getElementById('productPurchasePrice').value) || 0;
    productFormData.price = parseFloat(document.getElementById('productSellingPrice').value) || 0;
    productFormData.mrp = parseFloat(document.getElementById('productMRP').value) || 0;
    productFormData.taxType = document.getElementById('productTaxType').value;
    productFormData.gstRate = document.getElementById('productGST').value;
    productFormData.hsnCode = document.getElementById('productHSN').value;
    productFormData.discountType = document.getElementById('productDiscountType').value;
    productFormData.discount = parseFloat(document.getElementById('productDiscount').value) || 0;
  } else if (step === 3) {
    productFormData.stockQuantity = parseInt(document.getElementById('productOpeningStock').value) || 0;
    productFormData.uom = document.getElementById('productUOM').value;
    productFormData.minStockLevel = parseInt(document.getElementById('productMinStock').value) || 0;
    productFormData.maxStockLevel = parseInt(document.getElementById('productMaxStock').value) || 0;
    productFormData.reorderPoint = parseInt(document.getElementById('productReorderPoint').value) || 0;
    productFormData.reorderQty = parseInt(document.getElementById('productReorderQty').value) || 0;
    productFormData.trackStock = document.getElementById('productTrackStock').checked;
    productFormData.autoManage = document.getElementById('productAutoManage').checked;
    productFormData.allowBackorder = document.getElementById('productAllowBackorder').checked;
  } else if (step === 4) {
    productFormData.supplierId = document.getElementById('productSupplier').value;
    productFormData.supplierCode = document.getElementById('productSupplierCode').value;
    productFormData.leadTime = parseInt(document.getElementById('productLeadTime').value) || 0;
    productFormData.warrantyPeriod = document.getElementById('productWarrantyPeriod').value;
    productFormData.warrantyType = document.getElementById('productWarrantyType').value;
    productFormData.warrantyDesc = document.getElementById('productWarrantyDesc').value;
    productFormData.productType = document.getElementById('productType').value;
    productFormData.status = document.getElementById('productStatus').value;
    productFormData.showInPOS = document.getElementById('productShowPOS').checked;
    productFormData.availableOnline = document.getElementById('productOnlineSale').checked;
    productFormData.featured = document.getElementById('productFeatured').checked;
    productFormData.description = document.getElementById('productDetailedDesc').value;
    productFormData.internalNotes = document.getElementById('productInternalNotes').value;
  } else if (step === 5) {
    productFormData.images = productImages;
  }
}

async function saveProduct(saveAndAddAnother = false) {
  // Validate all steps
  for (let i = 1; i <= 5; i++) {
    if (!validateProductStep(i)) {
      showProductStep(i);
      return;
    }
    saveStepData(i);
  }
  
  try {
    const productData = {
      id: editingProductId || Date.now(),
      ...productFormData,
      images: productImages,
      createdAt: editingProductId ? products.find(p => p.id === editingProductId)?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (editingProductId) {
      const index = products.findIndex(p => p.id === editingProductId);
      if (index !== -1) {
        products[index] = productData;
        showToast('Product updated successfully', 'success');
      }
    } else {
      products.push(productData);
      showToast('Product added successfully', 'success');
    }
    
    filteredProducts = [...products];
    updateTabContent();
    
    if (saveAndAddAnother) {
      openAddProductModal();
    } else {
      closeProductModal();
    }
  } catch (error) {
    showToast('Failed to save product', 'error');
    console.error(error);
  }
}

function saveDraft() {
  saveStepData(currentProductStep);
  localStorage.setItem('productDraft', JSON.stringify({
    data: productFormData,
    images: productImages,
    step: currentProductStep,
    timestamp: new Date().toISOString()
  }));
  showToast('Draft saved', 'info');
}

function loadDraft() {
  const draft = localStorage.getItem('productDraft');
  if (draft) {
    const { data, images, step } = JSON.parse(draft);
    productFormData = data;
    productImages = images;
    populateProductForm(data);
    showProductStep(step);
    showToast('Draft loaded', 'success');
  }
}

function startAutoSave() {
  stopAutoSave();
  autoSaveInterval = setInterval(() => {
    saveDraft();
  }, 120000); // 2 minutes
}

function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

function hasUnsavedChanges() {
  return Object.keys(productFormData).length > 0 || productImages.length > 0;
}

function generateSKU() {
  const brand = document.getElementById('productBrand').value;
  const category = document.getElementById('productCategory').value;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const sku = `${brand.substring(0, 3).toUpperCase()}-${category.substring(0, 3).toUpperCase()}-${random}`;
  document.getElementById('productSKU').value = sku;
}

function generateBarcode() {
  const barcode = Math.floor(Math.random() * 10000000000000).toString();
  document.getElementById('productBarcode').value = barcode;
}

function calculateProfitMargin() {
  const purchasePrice = parseFloat(document.getElementById('productPurchasePrice').value) || 0;
  const sellingPrice = parseFloat(document.getElementById('productSellingPrice').value) || 0;
  
  if (purchasePrice > 0 && sellingPrice > 0) {
    const margin = ((sellingPrice - purchasePrice) / sellingPrice * 100).toFixed(2);
    const marginEl = document.getElementById('profitMargin');
    if (marginEl) {
      marginEl.textContent = `${margin}%`;
      marginEl.style.color = margin >= 20 ? 'var(--success)' : margin >= 10 ? 'var(--warning)' : 'var(--error)';
    }
  }
}

function handleImageUpload(files) {
  if (productImages.length + files.length > 10) {
    showToast('Maximum 10 images allowed', 'error');
    return;
  }
  
  Array.from(files).forEach(file => {
    if (file.size > 5 * 1024 * 1024) {
      showToast(`${file.name} is too large (max 5MB)`, 'error');
      return;
    }
    
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast(`${file.name} has invalid format`, 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      productImages.push({
        id: Date.now() + Math.random(),
        url: e.target.result,
        name: file.name,
        isPrimary: productImages.length === 0,
        altText: ''
      });
      renderProductImages();
    };
    reader.readAsDataURL(file);
  });
}

function renderProductImages() {
  const container = document.getElementById('productImagesContainer');
  if (!container) return;
  
  container.innerHTML = productImages.map((img, index) => `
    <div class="image-preview" data-image-id="${img.id}" draggable="true" ondragstart="handleImageDragStart(event, ${index})" ondragover="handleImageDragOver(event)" ondrop="handleImageDrop(event, ${index})">
      <img src="${img.url}" alt="${img.name}" />
      ${img.isPrimary ? '<span class="primary-badge">Primary</span>' : ''}
      <div class="image-actions">
        <button type="button" class="btn btn-sm btn-outline" onclick="setPrimaryImage(${index})" title="Set as primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${img.isPrimary ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
        <button type="button" class="btn btn-sm btn-error" onclick="removeImage(${index})" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

function setPrimaryImage(index) {
  productImages.forEach((img, i) => {
    img.isPrimary = i === index;
  });
  renderProductImages();
}

function removeImage(index) {
  productImages.splice(index, 1);
  if (productImages.length > 0 && !productImages.some(img => img.isPrimary)) {
    productImages[0].isPrimary = true;
  }
  renderProductImages();
}

let draggedImageIndex = null;

function handleImageDragStart(event, index) {
  draggedImageIndex = index;
  event.dataTransfer.effectAllowed = 'move';
}

function handleImageDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function handleImageDrop(event, targetIndex) {
  event.preventDefault();
  if (draggedImageIndex !== null && draggedImageIndex !== targetIndex) {
    const draggedImage = productImages[draggedImageIndex];
    productImages.splice(draggedImageIndex, 1);
    productImages.splice(targetIndex, 0, draggedImage);
    renderProductImages();
  }
  draggedImageIndex = null;
}

function loadBrandModels() {
  const brandSelect = document.getElementById('productBrand');
  const modelSelect = document.getElementById('productModel');
  
  if (!brandSelect || !modelSelect) return;
  
  const selectedBrand = brands.find(b => b.name === brandSelect.value);
  
  modelSelect.innerHTML = '<option value="">Select Model</option>';
  
  if (selectedBrand) {
    const brandModels = models.filter(m => m.brandId === selectedBrand.id && m.active);
    brandModels.forEach(model => {
      modelSelect.innerHTML += `<option value="${model.name}">${model.name}</option>`;
    });
  }
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
  const clearBtn = document.getElementById('clearSearchBtn');
  
  if (clearBtn) {
    clearBtn.style.display = searchTerm ? 'block' : 'none';
  }
  
  filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm) ||
      (product.brand && product.brand.toLowerCase().includes(searchTerm)) ||
      (product.model && product.model.toLowerCase().includes(searchTerm)) ||
      (product.imeiNumber && product.imeiNumber.includes(searchTerm)) ||
      (product.productCode && product.productCode.toLowerCase().includes(searchTerm)) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm));

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

// Additional utility functions
let currentSort = { column: 'name', direction: 'asc' };

function toggleSelectAllProducts(checked) {
  const checkboxes = document.querySelectorAll('.product-checkbox');
  checkboxes.forEach(cb => cb.checked = checked);
  updateBulkActions();
}

function updateBulkActions() {
  const selectedCount = document.querySelectorAll('.product-checkbox:checked').length;
  // Future: show bulk action bar when items are selected
}

function sortProducts(column) {
  if (currentSort.column === column) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.column = column;
    currentSort.direction = 'asc';
  }
  
  filteredProducts.sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (currentSort.direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
  
  updateTabContent();
}

function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
    filterProducts();
  }
}

function toggleExportMenu() {
  const menu = document.getElementById('exportMenu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

function exportInventory(format) {
  toggleExportMenu();
  showToast(`Exporting inventory to ${format.toUpperCase()}...`, 'info');
  
  const headers = ['Product Name', 'SKU', 'Brand', 'Model', 'Category', 'Stock', 'Purchase Price', 'Selling Price', 'Status'];
  const data = filteredProducts.map(p => [
    p.name,
    p.productCode || '',
    p.brand || '',
    p.model || '',
    p.category || '',
    p.stockQuantity,
    p.costPrice,
    p.price,
    p.stockQuantity === 0 ? 'Out of Stock' : p.stockQuantity <= p.minStockLevel ? 'Low Stock' : 'In Stock'
  ]);
  
  const csv = [headers, ...data].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory_${new Date().toISOString().split('T')[0]}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('Inventory exported successfully', 'success');
}

function toggleViewSettings() {
  showToast('View settings customization coming soon', 'info');
}

function changePageSize(size) {
  showToast(`Page size changed to ${size} items`, 'info');
}

function adjustStock(productId, delta) {
  const product = products.find(p => p.id === productId);
  if (product) {
    const newStock = Math.max(0, product.stockQuantity + delta);
    product.stockQuantity = newStock;
    filterProducts();
    showToast(`Stock adjusted to ${newStock}`, 'success');
  }
}

function viewProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (product) {
    showToast('Product details view coming soon', 'info');
  }
}

export async function init(app) {
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const modal = document.getElementById('productModal');
      if (modal && !modal.classList.contains('hidden')) {
        if (currentProductStep === 5) {
          saveProduct();
        } else {
          saveDraft();
        }
      }
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
      const productModal = document.getElementById('productModal');
      if (productModal && !productModal.classList.contains('hidden')) {
        closeProductModal();
      }
    }
  });

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
  window.toggleSelectAllProducts = toggleSelectAllProducts;
  window.updateBulkActions = updateBulkActions;
  window.sortProducts = sortProducts;
  window.clearSearch = clearSearch;
  window.toggleExportMenu = toggleExportMenu;
  window.exportInventory = exportInventory;
  window.toggleViewSettings = toggleViewSettings;
  window.changePageSize = changePageSize;
  window.adjustStock = adjustStock;
  window.viewProduct = viewProduct;
  window.nextProductStep = nextProductStep;
  window.prevProductStep = prevProductStep;
  window.jumpToProductStep = jumpToProductStep;
  window.saveProduct = saveProduct;
  window.saveDraft = saveDraft;
  window.generateSKU = generateSKU;
  window.generateBarcode = generateBarcode;
  window.calculateProfitMargin = calculateProfitMargin;
  window.handleImageUpload = handleImageUpload;
  window.setPrimaryImage = setPrimaryImage;
  window.removeImage = removeImage;
  window.handleImageDragStart = handleImageDragStart;
  window.handleImageDragOver = handleImageDragOver;
  window.handleImageDrop = handleImageDrop;
  window.loadBrandModels = loadBrandModels;

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
  
  // Close export menu when clicking outside
  document.addEventListener('click', (e) => {
    const exportMenu = document.getElementById('exportMenu');
    if (exportMenu && !exportMenu.classList.contains('hidden')) {
      const target = e.target;
      if (!target.closest('#exportMenu') && !target.closest('button[onclick="toggleExportMenu()"]')) {
        exportMenu.classList.add('hidden');
      }
    }
  });
}