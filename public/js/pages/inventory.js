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

            <div style="display: grid; grid-template-columns: 1fr 200px; gap: 24px;">
              <!-- Left side: Form fields -->
              <div class="grid grid-cols-3 gap-4">
              <!-- Row 1: Category, Brand, Model -->
              <div class="form-group">
                <label for="productCategory" class="form-label">Category*</label>
                <select id="productCategory" class="form-select" required data-testid="select-product-category">
                  <option value="">Select category</option>
                  <option value="smartphone">Smartphone</option>
                  <option value="feature_phone">Feature Phone</option>
                  <option value="accessory">Accessory</option>
                  <option value="spare_part">Spare Part</option>
                </select>
              </div>

              <div class="form-group">
                <label for="productBrand" class="form-label">Brand*</label>
                <select id="productBrand" class="form-select" required data-testid="select-product-brand" onchange="updateModelOptions()">
                  <option value="">Select brand</option>
                </select>
              </div>

              <div class="form-group">
                <label for="productModel" class="form-label">Model*</label>
                <select id="productModel" class="form-select" required data-testid="select-product-model">
                  <option value="">Select model</option>
                </select>
              </div>

              <!-- Row 1b: Type -->
              <div class="form-group">
                <label for="productType" class="form-label">Type:</label>
                <select id="productType" class="form-select" data-testid="select-product-type">
                  <option value="">Select type</option>
                  <option value="flagship">Flagship</option>
                  <option value="mid-range">Mid-Range</option>
                  <option value="budget">Budget</option>
                  <option value="entry-level">Entry Level</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div class="form-group"></div>
              <div class="form-group"></div>

              <!-- Row 2: Product Code, Product Name (span 2) -->
              <div class="form-group">
                <label for="productCode" class="form-label">Product Code</label>
                <input type="text" id="productCode" class="form-input" data-testid="input-product-code" />
              </div>

              <div class="form-group" style="grid-column: span 2;">
                <label for="productName" class="form-label">Product Name*</label>
                <input type="text" id="productName" class="form-input" required data-testid="input-product-name" />
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
                  <input type="number" id="productCostPrice" class="form-input" step="0.01" required data-testid="input-product-cost-price" oninput="recalculateAllPrices()" />
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
                  <select id="productPurchaseUnit" class="form-select" data-testid="input-product-purchase-unit">
                    <option value="">Select Unit</option>
                    <option value="pcs">Pcs (Pieces)</option>
                    <option value="box">Box</option>
                    <option value="dozen">Dozen</option>
                    <option value="pack">Pack</option>
                    <option value="set">Set</option>
                    <option value="unit">Unit</option>
                    <option value="kg">Kg (Kilogram)</option>
                    <option value="gram">Gram</option>
                    <option value="liter">Liter</option>
                    <option value="meter">Meter</option>
                    <option value="pair">Pair</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="productSalesUnit" class="form-label">Sales Main Unit</label>
                  <select id="productSalesUnit" class="form-select" data-testid="input-product-sales-unit">
                    <option value="">Select Unit</option>
                    <option value="pcs">Pcs (Pieces)</option>
                    <option value="box">Box</option>
                    <option value="dozen">Dozen</option>
                    <option value="pack">Pack</option>
                    <option value="set">Set</option>
                    <option value="unit">Unit</option>
                    <option value="kg">Kg (Kilogram)</option>
                    <option value="gram">Gram</option>
                    <option value="liter">Liter</option>
                    <option value="meter">Meter</option>
                    <option value="pair">Pair</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="productAlterUnit" class="form-label">Alter Unit</label>
                  <select id="productAlterUnit" class="form-select" data-testid="input-product-alter-unit">
                    <option value="">Select Unit</option>
                    <option value="pcs">Pcs (Pieces)</option>
                    <option value="box">Box</option>
                    <option value="dozen">Dozen</option>
                    <option value="pack">Pack</option>
                    <option value="set">Set</option>
                    <option value="unit">Unit</option>
                    <option value="kg">Kg (Kilogram)</option>
                    <option value="gram">Gram</option>
                    <option value="liter">Liter</option>
                    <option value="meter">Meter</option>
                    <option value="pair">Pair</option>
                  </select>
                </div>
              </div>

              <!-- Right Column -->
              <div style="grid-column: span 2;">
                <div style="display: grid; grid-template-columns: auto 1fr 1fr; gap: 16px; align-items: center; margin-bottom: 16px;">
                  <label class="form-label" style="margin: 0; white-space: nowrap;"></label>
                  <div style="text-align: center; font-weight: 500; color: var(--text-secondary); font-size: 0.9rem;">Margin %:</div>
                  <div style="text-align: center; font-weight: 500; color: var(--text-secondary); font-size: 0.9rem;">Price (₹):</div>
                </div>

                <div style="display: grid; grid-template-columns: auto 1fr 1fr; gap: 16px; align-items: center; margin-bottom: 16px;">
                  <label for="productMRP" class="form-label" style="margin: 0; white-space: nowrap;">MRP:</label>
                  <input type="number" id="marginMRP" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" data-testid="input-margin-mrp-percent" oninput="calculatePriceFromMargin('mrp')" />
                  <input type="number" id="priceMRP" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #e8f5e9;" data-testid="input-margin-mrp-price" readonly />
                </div>

                <div style="display: grid; grid-template-columns: auto 1fr 1fr; gap: 16px; align-items: center; margin-bottom: 16px;">
                  <label for="productPrice" class="form-label" style="margin: 0; white-space: nowrap;">Retail Sale Price*:</label>
                  <input type="number" id="marginRetail" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" data-testid="input-margin-retail-percent" oninput="calculatePriceFromMargin('retail')" />
                  <input type="number" id="priceRetail" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #e8f5e9;" data-testid="input-margin-retail-price" readonly />
                </div>

                <div style="display: grid; grid-template-columns: auto 1fr 1fr; gap: 16px; align-items: center; margin-bottom: 16px;">
                  <label for="productWholesalePrice" class="form-label" style="margin: 0; white-space: nowrap;">Wholesale Price:</label>
                  <input type="number" id="marginWholesale" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #ffffcc;" data-testid="input-margin-wholesale-percent" oninput="calculatePriceFromMargin('wholesale')" />
                  <input type="number" id="priceWholesale" class="form-input" step="0.01" value="0.00" placeholder="0.00" style="background-color: #e8f5e9;" data-testid="input-margin-wholesale-price" readonly />
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

              <!-- Opening Stock Section -->
              <div style="grid-column: span 3; margin-top: 16px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0;">
                <h4 style="font-weight: 600; color: var(--text-primary); font-size: 1rem;">Opening Stock (Optional Except Barcode):</h4>
              </div>

              <!-- Row 1: Quantity, Barcode, Extra Info Button -->
              <div class="form-group">
                <label for="productDefaultQty" class="form-label">Quantity:</label>
                <input type="number" id="productDefaultQty" class="form-input" value="10" data-testid="input-product-default-qty" style="background-color: #ffffcc;" />
              </div>

              <div class="form-group">
                <label for="productBarcode" class="form-label">Barcode*:</label>
                <input type="text" id="productBarcode" class="form-input" data-testid="input-product-barcode" style="background-color: #ffffcc;" />
              </div>

              <div class="form-group" style="display: flex; align-items: flex-end;">
                <button type="button" class="btn" style="background: linear-gradient(180deg, #90EE90 0%, #7BC67E 100%); color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                  ✓ Extra Info
                </button>
              </div>

              <!-- Row 2: Purchase Price with inline Margin %, Size, Colour -->
              <div class="form-group" style="grid-column: span 2;">
                <label for="openingPurchasePrice" class="form-label">Purchase Price:</label>
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center;">
                  <input type="number" id="openingPurchasePrice" class="form-input" step="0.01" value="300" data-testid="input-opening-purchase-price" style="background-color: #ffffcc;" />
                  <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap;">
                    <span style="color: var(--text-secondary);">Margin %:</span>
                    <input type="number" id="openingPurchaseMargin" class="form-input" step="0.01" value="0" data-testid="input-opening-purchase-margin" readonly style="background-color: #f5f5f5; width: 80px; text-align: center;" />
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="openingSize" class="form-label">Size:</label>
                <select id="openingSize" class="form-select" data-testid="select-opening-size" style="background-color: #ffffcc;">
                  <option value="">Select Size</option>
                  <option value="32GB">32GB</option>
                  <option value="64GB">64GB</option>
                  <option value="128GB">128GB</option>
                  <option value="256GB">256GB</option>
                  <option value="512GB">512GB</option>
                  <option value="1TB">1TB</option>
                </select>
              </div>

              <!-- Row 3: MRP with inline Margin %, Colour -->
              <div class="form-group" style="grid-column: span 2;">
                <label for="openingMRP" class="form-label">MRP:</label>
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center;">
                  <input type="number" id="openingMRP" class="form-input" step="0.01" value="420" data-testid="input-opening-mrp" style="background-color: #ffffcc;" />
                  <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap;">
                    <input type="number" id="openingMRPMargin" class="form-input" step="0.01" value="40" data-testid="input-opening-mrp-margin" readonly style="background-color: #ffffcc; width: 80px; text-align: center;" />
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="productColor" class="form-label">Colour:</label>
                <select id="productColor" class="form-select" data-testid="input-product-color" style="background-color: #ffffcc;">
                  <option value="">Select Colour</option>
                  <option value="BLACK">BLACK</option>
                  <option value="WHITE">WHITE</option>
                  <option value="SILVER">SILVER</option>
                  <option value="GOLD">GOLD</option>
                  <option value="BLUE">BLUE</option>
                  <option value="RED">RED</option>
                  <option value="GREEN">GREEN</option>
                  <option value="PURPLE">PURPLE</option>
                  <option value="PINK">PINK</option>
                </select>
              </div>

              <!-- Row 4: Retail Sale Price with inline Margin %, IMEI-1 -->
              <div class="form-group" style="grid-column: span 2;">
                <label for="openingRetailPrice" class="form-label">Retail Sale Price:</label>
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center;">
                  <input type="number" id="openingRetailPrice" class="form-input" step="0.01" value="375" data-testid="input-opening-retail-price" style="background-color: #ffffcc;" />
                  <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap;">
                    <input type="number" id="openingRetailMargin" class="form-input" step="0.01" value="25" data-testid="input-opening-retail-margin" readonly style="background-color: #ffffcc; width: 80px; text-align: center;" />
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="productIMEI" class="form-label">IMEI-1:</label>
                <input type="text" id="productIMEI" class="form-input" maxlength="15" data-testid="input-product-imei" style="background-color: #ffffcc;" />
              </div>

              <!-- Row 5: Wholesale Price with inline Margin %, IMEI-2 -->
              <div class="form-group" style="grid-column: span 2;">
                <label for="openingWholesalePrice" class="form-label">Wholesale Price:</label>
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center;">
                  <input type="number" id="openingWholesalePrice" class="form-input" step="0.01" value="360" data-testid="input-opening-wholesale-price" style="background-color: #ffffcc;" />
                  <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap;">
                    <input type="number" id="openingWholesaleMargin" class="form-input" step="0.01" value="20" data-testid="input-opening-wholesale-margin" readonly style="background-color: #ffffcc; width: 80px; text-align: center;" />
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="productIMEI2" class="form-label">IMEI-2:</label>
                <input type="text" id="productIMEI2" class="form-input" maxlength="15" data-testid="input-product-imei2" style="background-color: #ffffcc;" />
              </div>

              <!-- Row 6: Batch/Serial No., RCC, WCC -->
              <div class="form-group">
                <label for="productBatchSerialNo" class="form-label">Batch/Serial No.:</label>
                <input type="text" id="productBatchSerialNo" class="form-input" data-testid="input-product-batch-serial" style="background-color: #ffffcc;" />
              </div>

              <div class="form-group">
                <label for="openingRCC" class="form-label">RCC:</label>
                <input type="text" id="openingRCC" class="form-input" data-testid="input-opening-rcc" style="background-color: #ADD8E6;" />
              </div>

              <div class="form-group">
                <label for="openingWCC" class="form-label">WCC:</label>
                <input type="text" id="openingWCC" class="form-input" data-testid="input-opening-wcc" />
              </div>

              <!-- Row 7: Mfg. Date, Expiry Date (with calendar button) -->
              <div class="form-group" style="display: flex; align-items: flex-end; gap: 8px;">
                <button type="button" style="padding: 10px; background: linear-gradient(180deg, #FFB6C1 0%, #FF69B4 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold;">
                  C
                </button>
              </div>

              <div class="form-group" style="grid-column: span 2;">
                <label for="productMfgDate" class="form-label">Mfg. Date:</label>
                <div style="display: flex; gap: 8px;">
                  <input type="date" id="productMfgDate" class="form-input" data-testid="input-product-mfg-date" style="flex: 1;" />
                </div>
              </div>

              <!-- Row 8: Expiry Date -->
              <div class="form-group"></div>
              <div class="form-group" style="grid-column: span 2;">
                <label for="productExpiryDate" class="form-label">Expiry Date:</label>
                <div style="display: flex; gap: 8px;">
                  <input type="date" id="productExpiryDate" class="form-input" data-testid="input-product-expiry-date" style="flex: 1;" />
                </div>
              </div>

              <!-- Hidden stock field for backward compatibility -->
              <input type="number" id="productStock" value="0" data-testid="input-product-stock" style="display: none;" />

              <!-- Empty row for spacing -->
              <div class="form-group"></div>
              <div class="form-group"></div>
              <div class="form-group"></div>

              <!-- Storage Section -->
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

              <!-- Tax and Sale Settings -->
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

              <!-- Order Print Section -->
              <div class="form-group">
                <label for="productRAM" class="form-label">RAM:</label>
                <input type="text" id="productRAM" class="form-input" data-testid="input-product-ram" />
              </div>

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
              </div>

              <!-- Right side: Action buttons column -->
              <div style="display: flex; flex-direction: column; gap: 16px; align-self: start; position: sticky; top: 20px;">
                <!-- Photo Upload Section -->
                <div style="border: 2px solid #e0e0e0; border-radius: 8px; overflow: hidden; background: white;">
                  <div style="background: linear-gradient(180deg, #9B59B6 0%, #8E44AD 100%); color: white; padding: 8px; text-align: center; font-weight: 600; font-size: 14px;">
                    Photo
                  </div>
                  <div style="position: relative; background: #f5f5f5; height: 160px; display: flex; align-items: center; justify-content: center;">
                    <img id="productImagePreview" src="" alt="" style="display: none; max-width: 100%; max-height: 100%; object-fit: contain;" />
                    <div id="noImagePlaceholder" style="text-align: center; color: #999;">
                      <div style="font-size: 40px; font-weight: bold; line-height: 1;">NO</div>
                      <div style="font-size: 24px; font-weight: bold; line-height: 1;">IMAGE</div>
                      <div style="font-size: 16px; font-weight: bold; line-height: 1;">AVAILABLE</div>
                    </div>
                    <button type="button" onclick="document.getElementById('productImageInput').click()" style="position: absolute; bottom: 8px; right: 8px; width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(180deg, #A4D65E 0%, #8BC34A 100%); border: 2px solid white; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <line x1="12" y1="5" x2="12" y2="19" stroke="white" stroke-width="3"/>
                        <line x1="5" y1="12" x2="19" y2="12" stroke="white" stroke-width="3"/>
                      </svg>
                    </button>
                    <button type="button" onclick="clearProductImage()" style="position: absolute; bottom: 8px; right: 56px; width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(180deg, #BDBDBD 0%, #9E9E9E 100%); border: 2px solid white; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <line x1="18" y1="6" x2="6" y2="18" stroke="white" stroke-width="3"/>
                        <line x1="6" y1="6" x2="18" y2="18" stroke="white" stroke-width="3"/>
                      </svg>
                    </button>
                  </div>
                  <div style="padding: 8px; background: white;">
                    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                      <button type="button" onclick="document.getElementById('productImageInput').click()" style="flex: 1; padding: 6px; background: linear-gradient(180deg, #FFE082 0%, #FFD54F 100%); border: 2px solid #FFC107; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#795548">
                          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                        </svg>
                      </button>
                      <button type="button" onclick="showImageLibrary()" style="flex: 1; padding: 6px; background: linear-gradient(180deg, #EF9A9A 0%, #E57373 100%); border: 2px solid #E53935; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                          <path d="M9 13h6c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm0 0"/>
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" stroke="white" stroke-width="1" fill="none"/>
                        </svg>
                      </button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #666;">
                      <a href="#" onclick="showImageLibrary(); return false;" style="color: #1976D2; text-decoration: underline; flex: 1;">Library</a>
                      <div style="display: flex; align-items: center; gap: 4px;">
                        <span>Limit:</span>
                        <input type="number" value="10" min="1" max="50" style="width: 40px; padding: 2px; border: 1px solid #ddd; border-radius: 4px; text-align: center; font-size: 12px;" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <input type="file" id="productImageInput" accept="image/*" style="display: none;" onchange="handleProductImageSelect(event)" />
                <input type="text" id="productImageUrl" style="display: none;" />
                
                <!-- Action Buttons Section -->
                <div style="border: 2px solid #e0e0e0; border-radius: 8px; overflow: hidden; background: white; padding: 16px;">
                  <div style="font-weight: 600; font-size: 16px; margin-bottom: 16px; color: #333; text-align: center; padding-bottom: 12px; border-bottom: 2px solid #e0e0e0;">
                    Actions
                  </div>
                  
                  <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button type="button" class="btn" style="width: 100%; padding: 14px; background: linear-gradient(180deg, #6B9BD1 0%, #4A7AB8 100%); color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.1s;" onclick="openAddProductModal()" data-testid="button-new" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                      New
                    </button>
                    
                    <button type="submit" class="btn" style="width: 100%; padding: 14px; background: linear-gradient(180deg, #7BC67E 0%, #5CAD5F 100%); color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.1s;" data-testid="button-save-action" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                      Save
                    </button>
                    
                    <button type="button" class="btn" style="width: 100%; padding: 14px; background: linear-gradient(180deg, #FFB74D 0%, #FFA726 100%); color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.1s;" onclick="updateProductAction()" data-testid="button-update-action" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                      Update
                    </button>
                    
                    <button type="button" class="btn" style="width: 100%; padding: 14px; background: linear-gradient(180deg, #EF5350 0%, #E53935 100%); color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.1s;" onclick="deleteProductAction()" data-testid="button-delete-action" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                      Delete
                    </button>
                    
                    <button type="button" class="btn" style="width: 100%; padding: 14px; background: linear-gradient(180deg, #9575CD 0%, #7E57C2 100%); color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.1s;" onclick="getProductData()" data-testid="button-get-data" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                      Get Data
                    </button>
                    
                    <button type="button" class="btn" style="width: 100%; padding: 14px; background: linear-gradient(180deg, #4DD0E1 0%, #26C6DA 100%); color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.1s;" onclick="generateBarcode()" data-testid="button-barcode" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                      Barcode
                    </button>
                  </div>
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
  window.updateModelOptions = updateModelOptions;
  window.calculatePriceFromMargin = calculatePriceFromMargin;
  window.recalculateAllPrices = recalculateAllPrices;
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

function calculatePriceFromMargin(priceType) {
  const costPrice = parseFloat(document.getElementById('productCostPrice').value) || 0;
  
  let marginPercent = 0;
  let priceField = null;
  let hiddenField = null;
  
  if (priceType === 'mrp') {
    marginPercent = parseFloat(document.getElementById('marginMRP').value) || 0;
    priceField = document.getElementById('priceMRP');
    hiddenField = document.getElementById('productMRP');
  } else if (priceType === 'retail') {
    marginPercent = parseFloat(document.getElementById('marginRetail').value) || 0;
    priceField = document.getElementById('priceRetail');
    hiddenField = document.getElementById('productPrice');
  } else if (priceType === 'wholesale') {
    marginPercent = parseFloat(document.getElementById('marginWholesale').value) || 0;
    priceField = document.getElementById('priceWholesale');
    hiddenField = document.getElementById('productWholesalePrice');
  }
  
  if (priceField && hiddenField && costPrice > 0) {
    const calculatedPrice = costPrice * (1 + marginPercent / 100);
    const roundedPrice = Math.round(calculatedPrice * 100) / 100;
    priceField.value = roundedPrice.toFixed(2);
    hiddenField.value = roundedPrice.toFixed(2);
  } else if (priceField && hiddenField) {
    // If cost price is 0 or invalid, clear the fields
    priceField.value = '0.00';
    hiddenField.value = '0.00';
  }
}

function recalculateAllPrices() {
  calculatePriceFromMargin('mrp');
  calculatePriceFromMargin('retail');
  calculatePriceFromMargin('wholesale');
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