
import { wrapWithLayout } from '../components/layout.js';
import { api } from '../api.js';
import { showToast } from '../utils.js';

let categories = [
  { id: 1, name: 'Smartphone', description: 'Mobile smartphones with advanced features' },
  { id: 2, name: 'Feature Phone', description: 'Basic mobile phones' },
  { id: 3, name: 'Accessory', description: 'Mobile accessories and peripherals' },
  { id: 4, name: 'Spare Part', description: 'Replacement parts and components' }
];

let brands = [];
let brandModels = []; // Models/sub-sections under each brand
let paymentMethods = [
  { id: 1, name: 'Cash', enabled: true },
  { id: 2, name: 'Card', enabled: true },
  { id: 3, name: 'UPI', enabled: true },
  { id: 4, name: 'EMI', enabled: true }
];

let currentTab = 'categories';
let selectedBrandForModels = null;

export function render(app) {
  return wrapWithLayout(`
    <div class="page-header">
      <h1 class="page-title">Master Data Management</h1>
      <p class="page-subtitle">Manage categories, brands, and system configurations</p>
    </div>
    
    <!-- Tabs -->
    <div class="card mb-6">
      <div class="flex gap-2 border-b" style="border-color: var(--border-color);">
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
        <button 
          class="tab-button ${currentTab === 'payment' ? 'active' : ''}" 
          onclick="switchTab('payment')"
          data-testid="tab-payment"
        >
          Payment Methods
        </button>
        <button 
          class="tab-button ${currentTab === 'settings' ? 'active' : ''}" 
          onclick="switchTab('settings')"
          data-testid="tab-settings"
        >
          System Settings
        </button>
      </div>
    </div>
    
    <!-- Tab Content -->
    <div id="tabContent">
      ${renderTabContent()}
    </div>
    
    <!-- Category Modal -->
    <div id="categoryModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="categoryModalTitle">Add Category</h3>
          <button class="modal-close" onclick="closeCategoryModal()" data-testid="button-close-category-modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <form id="categoryForm">
            <input type="hidden" id="categoryId" />
            
            <div class="form-group">
              <label for="categoryName" class="form-label">Category Name*</label>
              <input type="text" id="categoryName" class="form-input" required data-testid="input-category-name" />
            </div>
            
            <div class="form-group">
              <label for="categoryDescription" class="form-label">Description</label>
              <textarea id="categoryDescription" class="form-textarea" rows="3" data-testid="textarea-category-description"></textarea>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeCategoryModal()" data-testid="button-cancel-category">Cancel</button>
          <button class="btn btn-primary" onclick="saveCategory()" data-testid="button-save-category">Save Category</button>
        </div>
      </div>
    </div>
    
    <!-- Brand Modal -->
    <div id="brandModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="brandModalTitle">Add Brand</h3>
          <button class="modal-close" onclick="closeBrandModal()" data-testid="button-close-brand-modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <form id="brandForm">
            <input type="hidden" id="brandId" />
            
            <div class="form-group">
              <label for="brandName" class="form-label">Brand Name*</label>
              <input type="text" id="brandName" class="form-input" required data-testid="input-brand-name" />
            </div>
            
            <div class="form-group">
              <label for="brandDescription" class="form-label">Description</label>
              <textarea id="brandDescription" class="form-textarea" rows="2" data-testid="textarea-brand-description"></textarea>
            </div>
            
            <div class="form-group">
              <label class="flex items-center gap-2">
                <input type="checkbox" id="brandActive" checked data-testid="checkbox-brand-active" />
                <span>Active</span>
              </label>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeBrandModal()" data-testid="button-cancel-brand">Cancel</button>
          <button class="btn btn-primary" onclick="saveBrand()" data-testid="button-save-brand">Save Brand</button>
        </div>
      </div>
    </div>
    
    <!-- Brand Model Modal -->
    <div id="brandModelModal" class="modal-backdrop hidden">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="brandModelModalTitle">Add Model</h3>
          <button class="modal-close" onclick="closeBrandModelModal()" data-testid="button-close-model-modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <form id="brandModelForm">
            <input type="hidden" id="modelId" />
            <input type="hidden" id="modelBrandId" />
            
            <div class="form-group">
              <label for="modelBrandSelect" class="form-label">Brand*</label>
              <select id="modelBrandSelect" class="form-input" required data-testid="select-model-brand">
                ${brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="modelName" class="form-label">Model Name*</label>
              <input type="text" id="modelName" class="form-input" required placeholder="e.g., 14 Pro Max" data-testid="input-model-name" />
            </div>
            
            <div class="form-group">
              <label for="modelDescription" class="form-label">Description</label>
              <textarea id="modelDescription" class="form-textarea" rows="2" data-testid="textarea-model-description"></textarea>
            </div>
            
            <div class="form-group">
              <label class="flex items-center gap-2">
                <input type="checkbox" id="modelActive" checked data-testid="checkbox-model-active" />
                <span>Active</span>
              </label>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeBrandModelModal()" data-testid="button-cancel-model">Cancel</button>
          <button class="btn btn-primary" onclick="saveBrandModel()" data-testid="button-save-model">Save Model</button>
        </div>
      </div>
    </div>
  `, 'master-data', app.user);
}

function renderTabContent() {
  switch (currentTab) {
    case 'categories':
      return renderCategoriesTab();
    case 'brands':
      return renderBrandsTab();
    case 'models':
      return renderModelsTab();
    case 'payment':
      return renderPaymentTab();
    case 'settings':
      return renderSettingsTab();
    default:
      return '';
  }
}

function renderCategoriesTab() {
  return `
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h3 style="font-size: 1.125rem; font-weight: 500;">Product Categories</h3>
        <button class="btn btn-primary" onclick="openAddCategoryModal()" data-testid="button-add-category">
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
              <th>Name</th>
              <th>Description</th>
              <th>Product Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${categories.map((cat, index) => `
              <tr data-testid="row-category-${cat.id}">
                <td><strong>${cat.name}</strong></td>
                <td>${cat.description || '-'}</td>
                <td><span class="badge badge-primary">0</span></td>
                <td>
                  <div class="flex gap-2">
                    <button 
                      class="btn btn-outline btn-sm btn-icon" 
                      onclick="editCategory(${index})"
                      data-testid="button-edit-category-${cat.id}"
                      title="Edit"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button 
                      class="btn btn-error btn-sm btn-icon" 
                      onclick="deleteCategory(${index})"
                      data-testid="button-delete-category-${cat.id}"
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
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderBrandsTab() {
  return `
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 style="font-size: 1.125rem; font-weight: 500; margin-bottom: 4px;">Mobile Brands</h3>
          <p style="color: var(--text-secondary); font-size: 0.875rem;">Manage your mobile phone brands</p>
        </div>
        <button class="btn btn-primary" onclick="openAddBrandModal()" data-testid="button-add-brand">
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
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${brands.length === 0 ? `
              <tr>
                <td colspan="4" class="text-center" style="padding: 48px;">
                  <div style="color: var(--text-secondary);">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin: 0 auto 16px; opacity: 0.3;">
                      <rect x="5" y="2" width="14" height="20" rx="2"/>
                      <path d="M12 18h.01"/>
                    </svg>
                    <h4 style="margin-bottom: 8px;">No brands added yet</h4>
                    <p style="margin-bottom: 16px;">Start by adding your first mobile brand</p>
                    <button class="btn btn-primary" onclick="openAddBrandModal()">Add Your First Brand</button>
                  </div>
                </td>
              </tr>
            ` : brands.map((brand, index) => `
              <tr data-testid="row-brand-${brand.id}">
                <td><strong>${brand.name}</strong></td>
                <td>${brand.description || '-'}</td>
                <td>
                  <span class="badge badge-${brand.active ? 'success' : 'secondary'}">
                    ${brand.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button 
                      class="btn btn-outline btn-sm btn-icon" 
                      onclick="editBrand(${index})"
                      data-testid="button-edit-brand-${brand.id}"
                      title="Edit"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button 
                      class="btn btn-error btn-sm btn-icon" 
                      onclick="deleteBrand(${index})"
                      data-testid="button-delete-brand-${brand.id}"
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
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderModelsTab() {
  return `
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 style="font-size: 1.125rem; font-weight: 500; margin-bottom: 4px;">Mobile Models</h3>
          <p style="color: var(--text-secondary); font-size: 0.875rem;">Manage models for each brand in an organized way</p>
        </div>
        <button class="btn btn-primary" onclick="openAddBrandModelModal()" data-testid="button-add-model">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Model
        </button>
      </div>
      
      ${brands.length === 0 ? `
        <div class="text-center" style="padding: 48px;">
          <div style="color: var(--text-secondary);">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin: 0 auto 16px; opacity: 0.3;">
              <rect x="5" y="2" width="14" height="20" rx="2"/>
              <path d="M12 18h.01"/>
            </svg>
            <h4 style="margin-bottom: 8px;">No brands available</h4>
            <p style="margin-bottom: 16px;">Please add brands first before creating models</p>
            <button class="btn btn-primary" onclick="switchTab('brands')">Go to Brands</button>
          </div>
        </div>
      ` : `
        <!-- Brand Tabs -->
        <div class="brand-tabs-container">
          <div class="brand-tabs-header">
            ${brands.map((brand, index) => {
              const modelCount = brandModels.filter(m => m.brandId === brand.id).length;
              const isActive = selectedBrandForModels === brand.id || (selectedBrandForModels === null && index === 0);
              
              return `
                <button 
                  class="brand-tab ${isActive ? 'active' : ''}" 
                  onclick="selectBrandTab(${brand.id})"
                  data-testid="brand-tab-${brand.id}"
                >
                  <div class="brand-tab-content">
                    <span class="brand-tab-name">${brand.name}</span>
                    <span class="badge badge-${brand.active ? 'success' : 'secondary'} ml-2">${modelCount}</span>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
          
          <div class="brand-tabs-body">
            ${renderBrandModelsContent()}
          </div>
        </div>
      `}
    </div>
  `;
}

function renderBrandModelsContent() {
  const activeBrandId = selectedBrandForModels || (brands.length > 0 ? brands[0].id : null);
  if (!activeBrandId) return '';
  
  const brand = brands.find(b => b.id === activeBrandId);
  const models = brandModels.filter(m => m.brandId === activeBrandId);
  
  return `
    <div class="brand-content-header">
      <div class="flex items-center gap-3">
        <h4 style="font-size: 1rem; font-weight: 500;">${brand.name} Models</h4>
        <span class="badge badge-${brand.active ? 'success' : 'secondary'}">
          ${brand.active ? 'Active' : 'Inactive'}
        </span>
      </div>
      ${brand.description ? `<p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 4px;">${brand.description}</p>` : ''}
      
      <div class="flex gap-2 mt-4">
        <button 
          class="btn btn-primary btn-sm" 
          onclick="openAddBrandModelModal(${brand.id})"
          data-testid="button-add-model-${brand.id}"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Model
        </button>
      </div>
    </div>
    
    <div class="table-container mt-6">
      ${models.length === 0 ? `
        <div class="text-center" style="padding: 48px;">
          <div style="color: var(--text-secondary);">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin: 0 auto 12px; opacity: 0.3;">
              <rect x="5" y="2" width="14" height="20" rx="2"/>
            </svg>
            <h4 style="margin-bottom: 8px;">No models added for ${brand.name}</h4>
            <p style="margin-bottom: 16px;">Start by adding your first model</p>
            <button class="btn btn-primary btn-sm" onclick="openAddBrandModelModal(${brand.id})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add First Model
            </button>
          </div>
        </div>
      ` : `
        <table class="table">
          <thead>
            <tr>
              <th>Model Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${models.map(model => `
              <tr data-testid="row-model-${model.id}">
                <td><strong>${model.name}</strong></td>
                <td>${model.description || '-'}</td>
                <td>
                  <span class="badge badge-${model.active ? 'success' : 'secondary'}">
                    ${model.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button 
                      class="btn btn-outline btn-sm btn-icon" 
                      onclick="editBrandModel(${model.id})"
                      data-testid="button-edit-model-${model.id}"
                      title="Edit"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button 
                      class="btn btn-error btn-sm btn-icon" 
                      onclick="deleteBrandModel(${model.id})"
                      data-testid="button-delete-model-${model.id}"
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
            `).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;
}

function renderBrandModelsPanel() {
  const brand = brands.find(b => b.id === selectedBrandForModels);
  if (!brand) return '';
  
  const models = brandModels.filter(m => m.brandId === selectedBrandForModels);
  
  return `
    <div class="card mt-4">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 style="font-size: 1.125rem; font-weight: 500;">${brand.name} Models</h3>
          <p style="color: var(--text-secondary); font-size: 0.875rem;">Manage models for ${brand.name}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-outline btn-sm" onclick="closeBrandModelsPanel()" data-testid="button-close-models">
            Close
          </button>
          <button class="btn btn-primary btn-sm" onclick="openAddBrandModelModal()" data-testid="button-add-model">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
              <th>Model Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${models.length === 0 ? `
              <tr>
                <td colspan="4" class="text-center" style="padding: 32px;">
                  <div style="color: var(--text-secondary);">
                    <p>No models added yet for ${brand.name}</p>
                    <button class="btn btn-primary btn-sm mt-4" onclick="openAddBrandModelModal()">Add First Model</button>
                  </div>
                </td>
              </tr>
            ` : models.map((model, index) => `
              <tr data-testid="row-model-${model.id}">
                <td><strong>${model.name}</strong></td>
                <td>${model.description || '-'}</td>
                <td>
                  <span class="badge badge-${model.active ? 'success' : 'secondary'}">
                    ${model.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button 
                      class="btn btn-outline btn-sm btn-icon" 
                      onclick="editBrandModel(${model.id})"
                      data-testid="button-edit-model-${model.id}"
                      title="Edit"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button 
                      class="btn btn-error btn-sm btn-icon" 
                      onclick="deleteBrandModel(${model.id})"
                      data-testid="button-delete-model-${model.id}"
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
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPaymentTab() {
  return `
    <div class="card">
      <h3 style="font-size: 1.125rem; font-weight: 500; margin-bottom: 16px;">Payment Methods Configuration</h3>
      
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Payment Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${paymentMethods.map((method, index) => `
              <tr data-testid="row-payment-${method.id}">
                <td><strong>${method.name}</strong></td>
                <td>
                  <span class="badge badge-${method.enabled ? 'success' : 'secondary'}">
                    ${method.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <button 
                    class="btn ${method.enabled ? 'btn-error' : 'btn-primary'} btn-sm"
                    onclick="togglePaymentMethod(${index})"
                    data-testid="button-toggle-payment-${method.id}"
                  >
                    ${method.enabled ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSettingsTab() {
  return `
    <div class="grid grid-cols-2 gap-6">
      <div class="card">
        <h3 style="font-size: 1.125rem; font-weight: 500; margin-bottom: 16px;">Tax Configuration</h3>
        
        <div class="form-group">
          <label for="taxRate" class="form-label">Default Tax Rate (%)</label>
          <input type="number" id="taxRate" class="form-input" value="18" step="0.01" data-testid="input-tax-rate" />
          <div class="form-helper">GST percentage applied to sales</div>
        </div>
        
        <button class="btn btn-primary" onclick="saveTaxSettings()" data-testid="button-save-tax">
          Save Tax Settings
        </button>
      </div>
      
      <div class="card">
        <h3 style="font-size: 1.125rem; font-weight: 500; margin-bottom: 16px;">Loyalty Points</h3>
        
        <div class="form-group">
          <label for="pointsPerRupee" class="form-label">Points per ₹100 spent</label>
          <input type="number" id="pointsPerRupee" class="form-input" value="1" data-testid="input-points-rate" />
        </div>
        
        <div class="form-group">
          <label for="pointValue" class="form-label">Point Value (₹)</label>
          <input type="number" id="pointValue" class="form-input" value="1" step="0.01" data-testid="input-point-value" />
          <div class="form-helper">Redemption value of 1 loyalty point</div>
        </div>
        
        <button class="btn btn-primary" onclick="saveLoyaltySettings()" data-testid="button-save-loyalty">
          Save Loyalty Settings
        </button>
      </div>
      
      <div class="card">
        <h3 style="font-size: 1.125rem; font-weight: 500; margin-bottom: 16px;">Invoice Settings</h3>
        
        <div class="form-group">
          <label for="invoicePrefix" class="form-label">Invoice Prefix</label>
          <input type="text" id="invoicePrefix" class="form-input" value="INV" data-testid="input-invoice-prefix" />
        </div>
        
        <div class="form-group">
          <label for="invoiceStartNumber" class="form-label">Starting Number</label>
          <input type="number" id="invoiceStartNumber" class="form-input" value="1000" data-testid="input-invoice-start" />
        </div>
        
        <button class="btn btn-primary" onclick="saveInvoiceSettings()" data-testid="button-save-invoice">
          Save Invoice Settings
        </button>
      </div>
      
      <div class="card">
        <h3 style="font-size: 1.125rem; font-weight: 500; margin-bottom: 16px;">Stock Alerts</h3>
        
        <div class="form-group">
          <label for="lowStockThreshold" class="form-label">Low Stock Alert Threshold</label>
          <input type="number" id="lowStockThreshold" class="form-input" value="5" data-testid="input-stock-threshold" />
          <div class="form-helper">Alert when stock falls below this number</div>
        </div>
        
        <div class="form-group">
          <label class="flex items-center gap-2">
            <input type="checkbox" id="emailAlerts" data-testid="checkbox-email-alerts" />
            <span>Send email alerts for low stock</span>
          </label>
        </div>
        
        <button class="btn btn-primary" onclick="saveStockSettings()" data-testid="button-save-stock">
          Save Stock Settings
        </button>
      </div>
    </div>
  `;
}

export async function init(app) {
  // Load initial data
  loadMasterData();
  
  // Expose functions globally
  window.switchTab = switchTab;
  window.toggleBrandAccordion = toggleBrandAccordion;
  window.selectBrandTab = selectBrandTab;
  window.openAddCategoryModal = openAddCategoryModal;
  window.closeCategoryModal = closeCategoryModal;
  window.saveCategory = saveCategory;
  window.editCategory = editCategory;
  window.deleteCategory = deleteCategory;
  window.openAddBrandModal = openAddBrandModal;
  window.closeBrandModal = closeBrandModal;
  window.saveBrand = saveBrand;
  window.editBrand = editBrand;
  window.deleteBrand = deleteBrand;
  window.manageBrandModels = manageBrandModels;
  window.closeBrandModelsPanel = closeBrandModelsPanel;
  window.openAddBrandModelModal = openAddBrandModelModal;
  window.closeBrandModelModal = closeBrandModelModal;
  window.saveBrandModel = saveBrandModel;
  window.editBrandModel = editBrandModel;
  window.deleteBrandModel = deleteBrandModel;
  window.togglePaymentMethod = togglePaymentMethod;
  window.saveTaxSettings = saveTaxSettings;
  window.saveLoyaltySettings = saveLoyaltySettings;
  window.saveInvoiceSettings = saveInvoiceSettings;
  window.saveStockSettings = saveStockSettings;
}

function loadMasterData() {
  // Load brands from localStorage
  const savedBrands = localStorage.getItem('brands');
  if (savedBrands) {
    brands = JSON.parse(savedBrands);
  } else {
    // Initialize with common brands
    brands = [
      { id: 1, name: 'Apple', description: 'iPhone devices', active: true },
      { id: 2, name: 'Samsung', description: 'Galaxy series', active: true },
      { id: 3, name: 'OnePlus', description: 'Premium smartphones', active: true },
      { id: 4, name: 'Xiaomi', description: 'Mi and Redmi devices', active: true },
      { id: 5, name: 'Realme', description: 'Budget smartphones', active: true }
    ];
    localStorage.setItem('brands', JSON.stringify(brands));
  }
  
  // Load brand models from localStorage
  const savedModels = localStorage.getItem('brandModels');
  if (savedModels) {
    brandModels = JSON.parse(savedModels);
  } else {
    // Initialize with sample models
    brandModels = [
      { id: 1, brandId: 1, name: '14 Pro Max', description: '6.7" display, A16 chip', active: true },
      { id: 2, brandId: 1, name: '15 Pro Max', description: '6.7" display, A17 Pro chip', active: true },
      { id: 3, brandId: 2, name: 'S23 Ultra', description: 'Flagship with S Pen', active: true },
      { id: 4, brandId: 2, name: 'S24 Ultra', description: 'Latest flagship', active: true }
    ];
    localStorage.setItem('brandModels', JSON.stringify(brandModels));
  }
}

function switchTab(tab) {
  currentTab = tab;
  const content = document.getElementById('tabContent');
  if (content) {
    content.innerHTML = renderTabContent();
  }
}

function openAddCategoryModal() {
  document.getElementById('categoryModalTitle').textContent = 'Add Category';
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryId').value = '';
  document.getElementById('categoryModal').classList.remove('hidden');
}

function closeCategoryModal() {
  document.getElementById('categoryModal').classList.add('hidden');
}

function saveCategory() {
  const form = document.getElementById('categoryForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const categoryId = document.getElementById('categoryId').value;
  const categoryData = {
    id: categoryId ? parseInt(categoryId) : Date.now(),
    name: document.getElementById('categoryName').value,
    description: document.getElementById('categoryDescription').value
  };
  
  if (categoryId) {
    const index = categories.findIndex(c => c.id === parseInt(categoryId));
    categories[index] = categoryData;
    showToast('Category updated successfully', 'success');
  } else {
    categories.push(categoryData);
    showToast('Category added successfully', 'success');
  }
  
  closeCategoryModal();
  switchTab('categories');
}

function editCategory(index) {
  const category = categories[index];
  document.getElementById('categoryModalTitle').textContent = 'Edit Category';
  document.getElementById('categoryId').value = category.id;
  document.getElementById('categoryName').value = category.name;
  document.getElementById('categoryDescription').value = category.description || '';
  document.getElementById('categoryModal').classList.remove('hidden');
}

function deleteCategory(index) {
  if (confirm('Are you sure you want to delete this category?')) {
    categories.splice(index, 1);
    showToast('Category deleted successfully', 'success');
    switchTab('categories');
  }
}

function openAddBrandModal() {
  document.getElementById('brandModalTitle').textContent = 'Add Brand';
  document.getElementById('brandForm').reset();
  document.getElementById('brandId').value = '';
  document.getElementById('brandActive').checked = true;
  document.getElementById('brandModal').classList.remove('hidden');
}

function closeBrandModal() {
  document.getElementById('brandModal').classList.add('hidden');
}

function saveBrand() {
  const form = document.getElementById('brandForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const brandId = document.getElementById('brandId').value;
  const brandData = {
    id: brandId ? parseInt(brandId) : Date.now(),
    name: document.getElementById('brandName').value,
    description: document.getElementById('brandDescription').value,
    active: document.getElementById('brandActive').checked
  };
  
  if (brandId) {
    const index = brands.findIndex(b => b.id === parseInt(brandId));
    brands[index] = brandData;
    showToast('Brand updated successfully', 'success');
  } else {
    brands.push(brandData);
    showToast('Brand added successfully', 'success');
  }
  
  localStorage.setItem('brands', JSON.stringify(brands));
  closeBrandModal();
  switchTab('brands');
}

function editBrand(index) {
  const brand = brands[index];
  document.getElementById('brandModalTitle').textContent = 'Edit Brand';
  document.getElementById('brandId').value = brand.id;
  document.getElementById('brandName').value = brand.name;
  document.getElementById('brandDescription').value = brand.description || '';
  document.getElementById('brandActive').checked = brand.active;
  document.getElementById('brandModal').classList.remove('hidden');
}

function deleteBrand(index) {
  if (confirm('Are you sure you want to delete this brand?')) {
    brands.splice(index, 1);
    localStorage.setItem('brands', JSON.stringify(brands));
    showToast('Brand deleted successfully', 'success');
    switchTab('brands');
  }
}

function togglePaymentMethod(index) {
  paymentMethods[index].enabled = !paymentMethods[index].enabled;
  showToast(`${paymentMethods[index].name} ${paymentMethods[index].enabled ? 'enabled' : 'disabled'}`, 'success');
  switchTab('payment');
}

function saveTaxSettings() {
  const taxRate = document.getElementById('taxRate').value;
  localStorage.setItem('taxRate', taxRate);
  showToast('Tax settings saved successfully', 'success');
}

function saveLoyaltySettings() {
  const pointsPerRupee = document.getElementById('pointsPerRupee').value;
  const pointValue = document.getElementById('pointValue').value;
  localStorage.setItem('loyaltySettings', JSON.stringify({ pointsPerRupee, pointValue }));
  showToast('Loyalty settings saved successfully', 'success');
}

function saveInvoiceSettings() {
  const invoicePrefix = document.getElementById('invoicePrefix').value;
  const invoiceStartNumber = document.getElementById('invoiceStartNumber').value;
  localStorage.setItem('invoiceSettings', JSON.stringify({ invoicePrefix, invoiceStartNumber }));
  showToast('Invoice settings saved successfully', 'success');
}

function saveStockSettings() {
  const lowStockThreshold = document.getElementById('lowStockThreshold').value;
  const emailAlerts = document.getElementById('emailAlerts').checked;
  localStorage.setItem('stockSettings', JSON.stringify({ lowStockThreshold, emailAlerts }));
  showToast('Stock settings saved successfully', 'success');
}

function toggleBrandAccordion(brandId) {
  if (selectedBrandForModels === brandId) {
    selectedBrandForModels = null;
  } else {
    selectedBrandForModels = brandId;
  }
  switchTab('brands');
}

function selectBrandTab(brandId) {
  selectedBrandForModels = brandId;
  switchTab('models');
}

function manageBrandModels(brandId, brandName) {
  selectedBrandForModels = brandId;
  switchTab('brands');
}

function closeBrandModelsPanel() {
  selectedBrandForModels = null;
  switchTab('brands');
}

function openAddBrandModelModal(brandId) {
  if (brands.length === 0) {
    showToast('Please add brands first', 'error');
    return;
  }
  
  let targetBrandId = brandId || selectedBrandForModels;
  
  // If no brand selected and we have brands, use first brand
  if (!targetBrandId && brands.length > 0) {
    targetBrandId = brands[0].id;
    selectedBrandForModels = targetBrandId;
  }
  
  document.getElementById('brandModelModalTitle').textContent = 'Add Model';
  document.getElementById('brandModelForm').reset();
  document.getElementById('modelId').value = '';
  document.getElementById('modelBrandId').value = targetBrandId;
  document.getElementById('modelBrandSelect').value = targetBrandId;
  document.getElementById('modelActive').checked = true;
  document.getElementById('brandModelModal').classList.remove('hidden');
}

function closeBrandModelModal() {
  document.getElementById('brandModelModal').classList.add('hidden');
}

function saveBrandModel() {
  const form = document.getElementById('brandModelForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const modelId = document.getElementById('modelId').value;
  const selectedBrandId = parseInt(document.getElementById('modelBrandSelect').value);
  const modelData = {
    id: modelId ? parseInt(modelId) : Date.now(),
    brandId: selectedBrandId,
    name: document.getElementById('modelName').value,
    description: document.getElementById('modelDescription').value,
    active: document.getElementById('modelActive').checked
  };
  
  if (modelId) {
    const index = brandModels.findIndex(m => m.id === parseInt(modelId));
    brandModels[index] = modelData;
    showToast('Model updated successfully', 'success');
  } else {
    brandModels.push(modelData);
    showToast('Model added successfully', 'success');
  }
  
  // Update selected brand for models tab
  selectedBrandForModels = selectedBrandId;
  
  localStorage.setItem('brandModels', JSON.stringify(brandModels));
  closeBrandModelModal();
  switchTab('models');
}

function editBrandModel(modelId) {
  const model = brandModels.find(m => m.id === modelId);
  if (!model) return;
  
  document.getElementById('brandModelModalTitle').textContent = 'Edit Model';
  document.getElementById('modelId').value = model.id;
  document.getElementById('modelBrandId').value = model.brandId;
  document.getElementById('modelBrandSelect').value = model.brandId;
  document.getElementById('modelName').value = model.name;
  document.getElementById('modelDescription').value = model.description || '';
  document.getElementById('modelActive').checked = model.active;
  document.getElementById('brandModelModal').classList.remove('hidden');
}

function deleteBrandModel(modelId) {
  if (confirm('Are you sure you want to delete this model?')) {
    const index = brandModels.findIndex(m => m.id === modelId);
    brandModels.splice(index, 1);
    localStorage.setItem('brandModels', JSON.stringify(brandModels));
    showToast('Model deleted successfully', 'success');
    switchTab('models');
  }
}
