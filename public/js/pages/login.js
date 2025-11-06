import { api } from '../api.js';
import { showToast } from '../utils.js';

export function render() {
  return `
    <div class="login-container">
      <div class="login-card">
        <div class="login-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto; color: var(--primary);">
            <rect x="2" y="2" width="20" height="20" rx="2"/>
            <path d="M8 2v20"/>
            <path d="M16 2v20"/>
          </svg>
          <h1>Mobile Shop Manager</h1>
          <p>Inventory & Sales Management</p>
        </div>
        
        <form id="loginForm" class="login-form">
          <div class="form-group">
            <label for="username" class="form-label">Username</label>
            <input 
              type="text" 
              id="username" 
              class="form-input" 
              placeholder="Enter your username" 
              required
              data-testid="input-username"
            />
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input 
              type="password" 
              id="password" 
              class="form-input" 
              placeholder="Enter your password" 
              required
              data-testid="input-password"
            />
          </div>
          
          <button 
            type="submit" 
            class="btn btn-primary btn-lg" 
            style="width: 100%; margin-top: var(--space-4);"
            data-testid="button-login"
          >
            Sign In
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-secondary" style="font-size: 0.75rem;">
            Default credentials: admin / admin123
          </p>
        </div>
      </div>
    </div>
  `;
}

export function init(app) {
  const form = document.getElementById('loginForm');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    
    try {
      const data = await api.login(username, password);
      app.user = data.user;
      showToast('Login successful!', 'success');
      app.navigate('dashboard');
    } catch (error) {
      showToast(error.message || 'Login failed', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
}
