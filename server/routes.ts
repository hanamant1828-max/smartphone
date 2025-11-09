import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Ensure JWT_SECRET is set - critical for security
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. This is required for security.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = user;
    next();
  });
}

// Middleware to check user roles
function authorizeRoles(...allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access forbidden: No role assigned' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: Insufficient permissions' });
    }
    
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Disable caching for JavaScript files in development
  app.use((req, res, next) => {
    if (req.url.endsWith('.js') || req.url.endsWith('.mjs')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });
  
  // Serve static files from public directory
  app.use(express.static('public'));
  
  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log('Login attempt for username:', username);
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log('User not found:', username);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('User found, comparing password...');
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      
      if (!validPassword) {
        console.log('Password mismatch for user:', username);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('Login successful for user:', username);
      
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/auth/check', authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Product routes
  app.get('/api/products', authenticateToken, async (req: any, res) => {
    try {
      const filters: any = {};
      
      // Convert query params to proper types
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }
      
      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });
  
  app.get('/api/products/low-stock', authenticateToken, async (req, res) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      console.error('Get low stock products error:', error);
      res.status(500).json({ message: 'Failed to fetch low stock products' });
    }
  });
  
  app.get('/api/products/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ message: 'Failed to fetch product' });
    }
  });
  
  app.post('/api/products', authenticateToken, async (req, res) => {
    try {
      const productData = req.body;
      console.log('Received product data:', JSON.stringify(productData, null, 2));
      
      // Ensure required fields are present
      if (!productData.name || !productData.category || !productData.brand) {
        return res.status(400).json({ 
          message: 'Missing required fields: name, category, and brand are required' 
        });
      }
      
      // Ensure numeric fields are numbers and remove undefined values
      const cleanedData: any = {
        name: productData.name,
        category: productData.category,
        brand: productData.brand,
        costPrice: Number(productData.costPrice) || 0,
        price: Number(productData.price) || 0,
        stockQuantity: Number(productData.stockQuantity) || 0,
        minStockLevel: Number(productData.minStockLevel) || 5,
        warrantyMonths: Number(productData.warrantyMonths) || 12,
        salesDiscount: Number(productData.salesDiscount) || 0,
        isActive: productData.isActive !== undefined ? productData.isActive : true,
      };

      // Add optional fields only if they have values
      if (productData.model) cleanedData.model = productData.model;
      if (productData.productCode) cleanedData.productCode = productData.productCode;
      if (productData.imeiNumber) cleanedData.imeiNumber = productData.imeiNumber;
      if (productData.description) cleanedData.description = productData.description;
      if (productData.color) cleanedData.color = productData.color;
      if (productData.storage) cleanedData.storage = productData.storage;
      if (productData.ram) cleanedData.ram = productData.ram;
      if (productData.hsnCode) cleanedData.hsnCode = productData.hsnCode;
      if (productData.purchaseUnit) cleanedData.purchaseUnit = productData.purchaseUnit;
      if (productData.salesUnit) cleanedData.salesUnit = productData.salesUnit;
      if (productData.imageUrl) cleanedData.imageUrl = productData.imageUrl;
      if (productData.supplierId) cleanedData.supplierId = Number(productData.supplierId);
      if (productData.supplierProductCode) cleanedData.supplierProductCode = productData.supplierProductCode;
      if (productData.leadTime !== undefined && productData.leadTime !== '') {
        cleanedData.leadTime = Number(productData.leadTime);
      }
      
      console.log('Cleaned data for insertion:', JSON.stringify(cleanedData, null, 2));
      
      const product = await storage.createProduct(cleanedData);
      console.log('Product created successfully with ID:', product.id);
      res.status(201).json(product);
    } catch (error: any) {
      console.error('Create product error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: 'Failed to create product', error: error.message });
    }
  });
  
  app.put('/api/products/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = req.body;
      const product = await storage.updateProduct(id, productData);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error: any) {
      console.error('Update product error:', error);
      res.status(500).json({ message: 'Failed to update product', error: error.message });
    }
  });
  
  app.delete('/api/products/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });
  
  // Bulk operations routes
  app.post('/api/products/bulk/delete', authenticateToken, authorizeRoles('admin', 'inventory_manager'), async (req, res) => {
    try {
      const { productIds } = req.body;
      
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ message: 'Product IDs array is required' });
      }
      
      await storage.bulkDeleteProducts(productIds);
      res.json({ message: `${productIds.length} products deleted successfully` });
    } catch (error) {
      console.error('Bulk delete products error:', error);
      res.status(500).json({ message: 'Failed to delete products' });
    }
  });
  
  app.post('/api/products/bulk/update', authenticateToken, authorizeRoles('admin', 'inventory_manager'), async (req, res) => {
    try {
      const { productIds, updates } = req.body;
      
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ message: 'Product IDs array is required' });
      }
      
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ message: 'Updates object is required' });
      }
      
      await storage.bulkUpdateProducts(productIds, updates);
      res.json({ message: `${productIds.length} products updated successfully` });
    } catch (error) {
      console.error('Bulk update products error:', error);
      res.status(500).json({ message: 'Failed to update products' });
    }
  });
  
  app.post('/api/products/bulk/update-prices', authenticateToken, authorizeRoles('admin', 'inventory_manager'), async (req, res) => {
    try {
      const { productIds, priceUpdate } = req.body;
      
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ message: 'Product IDs array is required' });
      }
      
      if (!priceUpdate || typeof priceUpdate !== 'object') {
        return res.status(400).json({ message: 'Price update configuration is required' });
      }
      
      const { field, operation, value } = priceUpdate;
      
      if (!['price', 'costPrice', 'mrp', 'wholesalePrice'].includes(field)) {
        return res.status(400).json({ message: 'Invalid price field' });
      }
      
      if (!['increase', 'decrease', 'set', 'increasePercent', 'decreasePercent'].includes(operation)) {
        return res.status(400).json({ message: 'Invalid operation' });
      }
      
      if (typeof value !== 'number' || value < 0) {
        return res.status(400).json({ message: 'Invalid value' });
      }
      
      await storage.bulkUpdatePrices(productIds, field, operation, value);
      res.json({ message: `Prices updated for ${productIds.length} products` });
    } catch (error) {
      console.error('Bulk update prices error:', error);
      res.status(500).json({ message: 'Failed to update prices' });
    }
  });
  
  // Customer routes
  app.get('/api/customers', authenticateToken, async (req, res) => {
    try {
      const filters = req.query;
      const customers = await storage.getCustomers(filters);
      res.json(customers);
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({ message: 'Failed to fetch customers' });
    }
  });
  
  app.get('/api/customers/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({ message: 'Failed to fetch customer' });
    }
  });
  
  app.post('/api/customers', authenticateToken, authorizeRoles('admin', 'manager', 'cashier'), async (req, res) => {
    try {
      const customerData = req.body;
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({ message: 'Failed to create customer' });
    }
  });
  
  app.put('/api/customers/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = req.body;
      const customer = await storage.updateCustomer(id, customerData);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({ message: 'Failed to update customer' });
    }
  });
  
  app.get('/api/customers/:id/purchases', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const purchases = await storage.getCustomerPurchases(id);
      res.json(purchases);
    } catch (error) {
      console.error('Get customer purchases error:', error);
      res.status(500).json({ message: 'Failed to fetch customer purchases' });
    }
  });
  
  // Sales routes
  app.post('/api/sales', authenticateToken, async (req: any, res) => {
    try {
      const saleData = {
        ...req.body,
        userId: req.user.id,
      };
      
      const sale = await storage.createSale(saleData);
      res.status(201).json(sale);
    } catch (error) {
      console.error('Create sale error:', error);
      res.status(500).json({ message: 'Failed to create sale' });
    }
  });
  
  app.get('/api/sales', authenticateToken, async (req, res) => {
    try {
      const filters = req.query;
      const sales = await storage.getSales(filters);
      res.json(sales);
    } catch (error) {
      console.error('Get sales error:', error);
      res.status(500).json({ message: 'Failed to fetch sales' });
    }
  });
  
  app.get('/api/sales/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.getSaleWithItems(id);
      
      if (!sale) {
        return res.status(404).json({ message: 'Sale not found' });
      }
      
      res.json(sale);
    } catch (error) {
      console.error('Get sale error:', error);
      res.status(500).json({ message: 'Failed to fetch sale' });
    }
  });
  
  // Stock adjustment routes
  app.post('/api/stock/adjust', authenticateToken, authorizeRoles('admin', 'inventory_manager'), async (req: any, res) => {
    try {
      const { productId, adjustmentType, quantity, reason, notes, referenceNumber } = req.body;
      
      if (!productId || !adjustmentType || quantity === undefined || !reason) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      if (!['add', 'subtract', 'set'].includes(adjustmentType)) {
        return res.status(400).json({ message: 'Invalid adjustment type' });
      }
      
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ message: 'Quantity must be a non-negative number' });
      }
      
      const product = await storage.adjustStock(
        productId,
        req.user.id,
        adjustmentType,
        quantity,
        reason,
        notes,
        referenceNumber
      );
      
      res.json(product);
    } catch (error: any) {
      console.error('Stock adjustment error:', error);
      res.status(500).json({ message: error.message || 'Failed to adjust stock' });
    }
  });
  
  app.post('/api/stock/bulk-adjust', authenticateToken, authorizeRoles('admin', 'inventory_manager'), async (req: any, res) => {
    try {
      const { productIds, adjustmentType, quantity, reason, notes } = req.body;
      
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ message: 'Product IDs array is required' });
      }
      
      if (!adjustmentType || quantity === undefined || !reason) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      if (!['add', 'subtract', 'set'].includes(adjustmentType)) {
        return res.status(400).json({ message: 'Invalid adjustment type' });
      }
      
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ message: 'Quantity must be a non-negative number' });
      }
      
      await storage.bulkAdjustStock(
        productIds,
        req.user.id,
        adjustmentType,
        quantity,
        reason,
        notes
      );
      
      res.json({ message: `Stock adjusted for ${productIds.length} products` });
    } catch (error: any) {
      console.error('Bulk stock adjustment error:', error);
      res.status(500).json({ message: error.message || 'Failed to adjust stock' });
    }
  });
  
  // Category routes
  app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
      const filters = req.query;
      const categories = await storage.getCategories(filters);
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  app.get('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({ message: 'Failed to fetch category' });
    }
  });

  app.post('/api/categories', authenticateToken, async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ message: 'Failed to create category' });
    }
  });

  app.put('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateCategory(id, req.body);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ message: 'Failed to update category' });
    }
  });

  app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  });

  // Brand routes
  app.get('/api/brands', authenticateToken, async (req, res) => {
    try {
      const filters = req.query;
      const brands = await storage.getBrands(filters);
      res.json(brands);
    } catch (error) {
      console.error('Get brands error:', error);
      res.status(500).json({ message: 'Failed to fetch brands' });
    }
  });

  app.get('/api/brands/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const brand = await storage.getBrand(id);
      if (!brand) {
        return res.status(404).json({ message: 'Brand not found' });
      }
      res.json(brand);
    } catch (error) {
      console.error('Get brand error:', error);
      res.status(500).json({ message: 'Failed to fetch brand' });
    }
  });

  app.post('/api/brands', authenticateToken, async (req, res) => {
    try {
      const brand = await storage.createBrand(req.body);
      res.status(201).json(brand);
    } catch (error) {
      console.error('Create brand error:', error);
      res.status(500).json({ message: 'Failed to create brand' });
    }
  });

  app.put('/api/brands/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const brand = await storage.updateBrand(id, req.body);
      if (!brand) {
        return res.status(404).json({ message: 'Brand not found' });
      }
      res.json(brand);
    } catch (error) {
      console.error('Update brand error:', error);
      res.status(500).json({ message: 'Failed to update brand' });
    }
  });

  app.delete('/api/brands/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBrand(id);
      res.json({ message: 'Brand deleted successfully' });
    } catch (error) {
      console.error('Delete brand error:', error);
      res.status(500).json({ message: 'Failed to delete brand' });
    }
  });

  // Model routes
  app.get('/api/models', authenticateToken, async (req, res) => {
    try {
      const filters = req.query;
      const models = await storage.getModels(filters);
      res.json(models);
    } catch (error) {
      console.error('Get models error:', error);
      res.status(500).json({ message: 'Failed to fetch models' });
    }
  });

  app.get('/api/models/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModelWithVariants(id);
      if (!model) {
        return res.status(404).json({ message: 'Model not found' });
      }
      res.json(model);
    } catch (error) {
      console.error('Get model error:', error);
      res.status(500).json({ message: 'Failed to fetch model' });
    }
  });

  app.post('/api/models', authenticateToken, async (req, res) => {
    try {
      const model = await storage.createModel(req.body);
      res.status(201).json(model);
    } catch (error) {
      console.error('Create model error:', error);
      res.status(500).json({ message: 'Failed to create model' });
    }
  });

  app.put('/api/models/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.updateModel(id, req.body);
      if (!model) {
        return res.status(404).json({ message: 'Model not found' });
      }
      res.json(model);
    } catch (error) {
      console.error('Update model error:', error);
      res.status(500).json({ message: 'Failed to update model' });
    }
  });

  app.delete('/api/models/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteModel(id);
      res.json({ message: 'Model deleted successfully' });
    } catch (error) {
      console.error('Delete model error:', error);
      res.status(500).json({ message: 'Failed to delete model' });
    }
  });

  // Report routes
  app.get('/api/reports/dashboard', authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });
  
  app.get('/api/reports/sales', authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await storage.getSalesReport(
        startDate as string,
        endDate as string
      );
      res.json(report);
    } catch (error) {
      console.error('Get sales report error:', error);
      res.status(500).json({ message: 'Failed to fetch sales report' });
    }
  });
  
  app.get('/api/reports/inventory', authenticateToken, async (req, res) => {
    try {
      const report = await storage.getInventoryReport();
      res.json(report);
    } catch (error) {
      console.error('Get inventory report error:', error);
      res.status(500).json({ message: 'Failed to fetch inventory report' });
    }
  });
  
  app.get('/api/reports/customers', authenticateToken, async (req, res) => {
    try {
      const report = await storage.getCustomerReport();
      res.json(report);
    } catch (error) {
      console.error('Get customer report error:', error);
      res.status(500).json({ message: 'Failed to fetch customer report' });
    }
  });
  
  // Fallback to serve index.html for client-side routing
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
