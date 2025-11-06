// API Client
const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE;
  }
  
  getToken() {
    return localStorage.getItem('authToken');
  }
  
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
    };
    
    if (config.body && typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body);
    }
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  // Auth
  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  }
  
  async checkAuth() {
    return this.request('/auth/check');
  }
  
  // Products
  async getProducts(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/products?${params}`);
  }
  
  async getProduct(id) {
    return this.request(`/products/${id}`);
  }
  
  async createProduct(data) {
    return this.request('/products', {
      method: 'POST',
      body: data,
    });
  }
  
  async updateProduct(id, data) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: data,
    });
  }
  
  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }
  
  async getLowStockProducts() {
    return this.request('/products/low-stock');
  }
  
  // Customers
  async getCustomers(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/customers?${params}`);
  }
  
  async getCustomer(id) {
    return this.request(`/customers/${id}`);
  }
  
  async createCustomer(data) {
    return this.request('/customers', {
      method: 'POST',
      body: data,
    });
  }
  
  async updateCustomer(id, data) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: data,
    });
  }
  
  async getCustomerPurchaseHistory(id) {
    return this.request(`/customers/${id}/purchases`);
  }
  
  // Sales
  async createSale(data) {
    return this.request('/sales', {
      method: 'POST',
      body: data,
    });
  }
  
  async getSales(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/sales?${params}`);
  }
  
  async getSale(id) {
    return this.request(`/sales/${id}`);
  }
  
  // Reports
  async getDashboardStats() {
    return this.request('/reports/dashboard');
  }
  
  async getSalesReport(startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    return this.request(`/reports/sales?${params}`);
  }
  
  async getInventoryReport() {
    return this.request('/reports/inventory');
  }
  
  async getCustomerReport() {
    return this.request('/reports/customers');
  }
}

export const api = new ApiClient();
