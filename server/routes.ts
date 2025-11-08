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
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      console.error('Create product error:', error);
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
