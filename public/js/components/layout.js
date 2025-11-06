// Shared Layout Components

export function renderSidebar(currentPage) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: dashboardIcon },
    { id: 'inventory', label: 'Inventory', icon: inventoryIcon },
    { id: 'pos', label: 'Point of Sale', icon: posIcon },
    { id: 'customers', label: 'Customers', icon: customersIcon },
    { id: 'sales', label: 'Sales History', icon: salesIcon },
    { id: 'reports', label: 'Reports', icon: reportsIcon },
    { id: 'master-data', label: 'Master Data', icon: masterDataIcon }, // Added Master Data link
  ];

  return `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          ${logoIcon}
          Mobile Shop
        </div>
      </div>

      <nav class="sidebar-nav">
        ${navItems.map(item => `
          <a 
            href="#${item.id}" 
            class="nav-item ${currentPage === item.id ? 'active' : ''}"
            onclick="window.app.navigate('${item.id}'); return false;"
            data-testid="nav-${item.id}"
          >
            <span class="nav-item-icon">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        `).join('')}
      </nav>
    </div>
  `;
}

export function renderTopBar(user) {
  return `
    <div class="top-bar">
      <div class="search-bar">
        <input 
          type="search" 
          class="search-input" 
          placeholder="Search products, customers, invoices..." 
          data-testid="input-global-search"
        />
      </div>

      <div class="top-bar-actions">
        <div class="user-profile" onclick="showUserMenu(event)" data-testid="button-user-menu">
          <div class="user-avatar">${user?.fullName?.[0] || 'A'}</div>
          <span class="user-name">${user?.fullName || 'Admin'}</span>
        </div>

        <button 
          class="btn btn-outline btn-sm" 
          onclick="window.app.logout()"
          data-testid="button-logout"
        >
          Logout
        </button>
      </div>
    </div>
  `;
}

export function wrapWithLayout(content, currentPage, user) {
  return `
    <div class="app-container">
      ${renderSidebar(currentPage)}

      <div class="main-content">
        ${renderTopBar(user)}

        <div class="page-content">
          ${content}
        </div>
      </div>
    </div>
  `;
}

// Icons (SVG)
const logoIcon = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="5" y="2" width="14" height="20" rx="2"/>
    <path d="M12 18h.01"/>
  </svg>
`;

const dashboardIcon = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
`;

const inventoryIcon = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
`;

const posIcon = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
`;

const customersIcon = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
`;

const salesIcon = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
`;

const reportsIcon = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
`;

const masterDataIcon = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
`;