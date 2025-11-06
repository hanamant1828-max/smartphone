// Simple SPA Router and State Management
const app = {
  currentPage: 'login',
  user: null,
  cart: [],
  
  init() {
    this.checkAuth();
    this.setupEventListeners();
  },
  
  async checkAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const response = await fetch('/api/auth/check', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          this.user = await response.json();
          this.navigate('dashboard');
        } else {
          this.navigate('login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        this.navigate('login');
      }
    } else {
      this.navigate('login');
    }
  },
  
  setupEventListeners() {
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      const page = e.state?.page || 'login';
      this.navigate(page, false);
    });
  },
  
  navigate(page, pushState = true) {
    this.currentPage = page;
    
    if (pushState) {
      history.pushState({ page }, '', `#${page}`);
    }
    
    this.render();
  },
  
  async render() {
    const appElement = document.getElementById('app');
    
    // Import page modules dynamically
    const pages = {
      login: () => import('./pages/login.js'),
      dashboard: () => import('./pages/dashboard.js'),
      inventory: () => import('./pages/inventory.js'),
      pos: () => import('./pages/pos.js'),
      customers: () => import('./pages/customers.js'),
      sales: () => import('./pages/sales.js'),
      reports: () => import('./pages/reports.js'),
      'master-data': () => import('./pages/master-data.js'),
    };
    
    if (pages[this.currentPage]) {
      const pageModule = await pages[this.currentPage]();
      appElement.innerHTML = pageModule.render(this);
      pageModule.init(this);
    } else {
      appElement.innerHTML = '<div class="loading-screen"><div class="spinner"></div><p>Page not found</p></div>';
    }
  },
  
  logout() {
    localStorage.removeItem('authToken');
    this.user = null;
    this.navigate('login');
  }
};

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Export for use in other modules
window.app = app;
