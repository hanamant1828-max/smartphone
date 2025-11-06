# Mobile Shop Management System - Design Guidelines

## Design Approach
**System Selected**: Material Design 3 principles with enterprise data-focused adaptations
**Rationale**: Business management tool requiring clarity, efficiency, and data density. Material Design provides established patterns for complex data interfaces while maintaining professional aesthetics.

## Typography System
**Font Family**: Roboto (via Google Fonts CDN)
- **Headers**: Roboto Medium (500 weight)
  - H1: 2rem (32px) - Page titles
  - H2: 1.5rem (24px) - Section headers
  - H3: 1.25rem (20px) - Card headers, modal titles
  - H4: 1rem (16px) - Subsection labels

- **Body Text**: Roboto Regular (400 weight)
  - Base: 0.875rem (14px) - Primary content, table cells
  - Large: 1rem (16px) - Important labels, form inputs
  - Small: 0.75rem (12px) - Metadata, timestamps

- **Data/Numbers**: Roboto Mono (monospace) for inventory counts, prices, IMEI numbers

## Layout System
**Spacing Scale**: Use Tailwind units of **2, 4, 6, 8, 12, 16** for consistent rhythm
- Micro spacing: p-2, m-2 (component internal padding)
- Standard spacing: p-4, gap-4 (cards, form fields)
- Section spacing: p-6, p-8 (containers, modals)
- Major spacing: p-12, p-16 (page layouts, between major sections)

**Grid Structure**:
- Sidebar navigation: Fixed 240px width
- Main content area: Fluid with max-w-7xl container
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Data tables: Full width within container, horizontally scrollable on mobile

## Component Library

### Navigation
**Top Bar** (fixed, full-width):
- Shop logo/name (left)
- Global search bar (center, max-w-md)
- User profile dropdown, notifications icon (right)
- Height: h-16

**Sidebar** (fixed left):
- Dashboard, Inventory, Sales/POS, Customers, Reports, Settings sections
- Icon + label for each menu item
- Active state: filled background with subtle left border indicator
- Collapsible on mobile (hamburger menu)

### Dashboard Components
**Stat Cards** (4-column grid on desktop):
- Large number display (text-3xl)
- Label beneath (text-sm)
- Small trend indicator (up/down arrow + percentage)
- Icon in top-right corner
- Padding: p-6, rounded corners

**Charts Section**:
- Sales chart: Line/area chart showing revenue over time
- Product performance: Horizontal bar chart for top sellers
- Minimum height: h-80 for charts

**Quick Actions Panel**:
- Large CTAs: "New Sale", "Add Product", "View Reports"
- Icon + text buttons in grid-cols-3 layout

### Inventory Management
**Product Table**:
- Sortable columns: Image thumbnail, Name, Brand, Model, IMEI, Stock, Price, Actions
- Row height: h-16
- Alternating row subtle background for readability
- Search/filter bar above table
- Pagination controls below

**Product Cards** (alternative view):
- Product image (square, aspect-square)
- Brand + model name
- Stock badge (distinct treatment for low stock)
- Price display
- Quick action buttons overlay on hover

**Add/Edit Product Form**:
- Two-column layout on desktop (label left, input right)
- Image upload zone with preview
- Grouped sections: Basic Info, Pricing, Stock, Specifications
- Form width: max-w-3xl

### POS (Point of Sale)
**Split Layout**:
- Left panel (60%): Product search + grid
- Right panel (40%): Shopping cart + checkout

**Product Search**:
- Large search input with instant results
- Results in card grid (2-3 columns)
- Click to add to cart

**Shopping Cart**:
- Sticky positioning
- Line items with quantity controls
- Running total display (prominent, text-xl)
- Payment method selector (radio buttons with icons)
- Checkout button (full-width, large)

### Customer Management
**Customer List**:
- Compact table or card view toggle
- Quick filters: All, VIP, Recent purchases
- Customer row: Name, phone, total purchases, last visit
- Click to expand purchase history

**Customer Detail Panel**:
- Header: Name, contact info, loyalty points
- Tabs: Purchase History, Warranties, Profile
- Purchase history: Timeline view with invoice links

### Reports Section
**Filter Controls** (top):
- Date range picker
- Report type dropdown
- Export button (Excel/PDF)

**Report Display**:
- Summary cards (total sales, profit, transactions)
- Detailed data table
- Visualization charts

### Modal Dialogs
**Standard Modal**:
- Max width: max-w-2xl
- Header with title + close button
- Content area: p-6
- Footer with action buttons (right-aligned)
- Backdrop blur

### Forms & Inputs
**Input Fields**:
- Height: h-12
- Border with focus state (thicker border)
- Labels above inputs (text-sm, mb-1)
- Helper text below (text-xs)
- Error states with red accent

**Buttons**:
- Primary: Filled, h-10 or h-12
- Secondary: Outlined
- Icon buttons: Square (w-10 h-10)
- Hover: Subtle elevation increase

**Data Tables**:
- Fixed header on scroll
- Row hover state
- Action column (right-most): Icon buttons for edit/delete/view
- Mobile: Stack into cards

### Additional Elements
**Stock Alerts**:
- Banner notification style at page top
- Dismissible
- Link to low-stock products

**Invoice Print View**:
- Clean, printer-friendly layout
- Shop header with logo
- Invoice details in structured table
- Total prominently displayed

**Loading States**:
- Skeleton screens for tables
- Spinner for actions
- Progressive loading for dashboard

## Responsive Behavior
- **Desktop (lg+)**: Full sidebar + content layout
- **Tablet (md)**: Collapsible sidebar, 2-column grids
- **Mobile (base)**: Hamburger menu, single column, bottom navigation bar for key actions

## Animations
Minimal, performance-focused:
- Smooth sidebar collapse/expand
- Fade-in for modals
- Subtle hover elevation changes
No scroll animations or decorative transitions

## Accessibility
- Minimum touch target: 44x44px
- Keyboard navigation for all interactive elements
- Focus indicators (ring offset)
- ARIA labels for icon-only buttons
- Proper heading hierarchy

This system prioritizes clarity, speed, and data density suitable for daily business operations.