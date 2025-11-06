# Mobile Shop Management System

## Overview

This is a web-based inventory and sales management system designed for mobile phone retail shops. The application handles product catalog management, point-of-sale transactions, customer relationship management, sales reporting, and business analytics. Built as a full-stack application with a React frontend and Express backend, it uses SQLite for data persistence and implements JWT-based authentication with role-based access control.

## Recent Changes

**November 6, 2025**: Successfully migrated from PostgreSQL to SQLite database
- Migrated all tables from PostgreSQL to SQLite format
- Updated timestamp handling to use millisecond precision for accurate date/time tracking
- Database file stored at `./database/shop.db`
- Configured .gitignore to exclude database files while preserving folder structure
- All packages installed: better-sqlite3, @types/better-sqlite3

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component Library**: The application uses shadcn/ui components built on top of Radix UI primitives, providing a comprehensive set of pre-built, accessible components. The design system follows Material Design 3 principles adapted for enterprise data-focused interfaces.

**Styling Approach**: Tailwind CSS with a custom design token system. The configuration defines semantic color variables (primary, secondary, destructive, etc.) that support light/dark modes through CSS custom properties. Typography uses the Roboto font family with Roboto Mono for numerical data.

**State Management**: TanStack Query (React Query) handles server state, API calls, and caching. The query client is configured with conservative defaults (no automatic refetching, infinite stale time) to minimize unnecessary network requests.

**Routing**: Wouter provides lightweight client-side routing for the single-page application.

**Form Handling**: React Hook Form with Zod validation through @hookform/resolvers for type-safe form schemas.

### Backend Architecture

**Runtime**: Node.js with Express.js framework

**Database ORM**: Drizzle ORM configured for SQLite, with schema definitions in TypeScript providing type safety across the application. Migration files are generated to `./migrations` directory.

**Authentication Strategy**: JWT (JSON Web Tokens) for stateless authentication. The system requires a `JWT_SECRET` environment variable and will exit if not configured. Token verification middleware (`authenticateToken`) protects routes, while role-based authorization middleware (`authorizeRoles`) restricts access based on user roles (admin, sales_staff, inventory_manager).

**API Structure**: RESTful endpoints organized under `/api` prefix. The application logs API requests with method, path, status code, duration, and truncated response bodies for debugging.

**Database Location**: SQLite database file stored at `./database/shop.db`

### Data Schema Design

**Users Table**: Stores authentication credentials (username, password hash), contact information, role assignments, and account status. Supports three primary roles for access control.

**Products Table**: Comprehensive inventory tracking with fields for brand, model, IMEI numbers (for individual device tracking), color, storage, RAM, pricing (cost and selling price), stock quantities, and low-stock thresholds. Categorized as smartphones, feature phones, accessories, or spare parts.

**Customers Table**: Customer relationship data including contact details, purchase history references, and metadata timestamps.

**Sales Table**: Transaction records with invoice numbers, customer references, payment methods (cash, card, UPI, EMI), amounts, and timestamps. Links to sale items through a separate junction table.

**Sale Items Table**: Line-item details for each sale, connecting products to sales with quantities and prices, enabling detailed transaction history and reporting.

**Sessions Table**: Server-side session storage with expiration tracking, indexed on expiry date for efficient cleanup.

### Key Architectural Decisions

**Database Choice**: The application uses SQLite for simplicity, portability, and ease of deployment. SQLite provides all the features needed for a mobile shop management system while keeping the database as a single file in the `./database` folder. This makes backup and deployment straightforward. The Drizzle ORM is database-agnostic, allowing future migration to PostgreSQL if scaling requirements change.

**Dual Frontend Approach**: The repository contains both a modern React SPA (`client/src`) and a legacy vanilla JavaScript implementation (`public/js`). This appears to be a migration in progress, with the React version being the target architecture while the legacy code provides a fallback or reference implementation.

**Authentication Security**: JWT tokens are stored client-side (likely in localStorage based on the legacy code). The backend strictly validates tokens on protected routes and enforces role-based permissions. The critical security requirement of JWT_SECRET being mandatory demonstrates security-first design.

**API Logging Strategy**: Request logging captures complete context (method, path, status, duration, response preview) but truncates long responses to 80 characters to prevent log bloat while maintaining debuggability.

**Development Tooling**: The project uses Replit-specific plugins for development (runtime error overlay, cartographer, dev banner) that only load in development mode, keeping production builds clean.

**Static Asset Serving**: Express serves static files from a `public` directory for the legacy implementation, while the React SPA is built to `dist/public` and served separately.

## External Dependencies

**UI Component Library**: shadcn/ui with Radix UI primitives - provides accessible, customizable React components for dialogs, dropdowns, forms, navigation, and data display.

**Database**: SQLite via better-sqlite3 driver - embedded database for local development and deployment. Schema managed through Drizzle ORM with TypeScript definitions.

**Authentication**: bcryptjs for password hashing, jsonwebtoken for JWT token generation and verification.

**Frontend Utilities**: 
- clsx and tailwind-merge for conditional className composition
- class-variance-authority for component variant management
- lucide-react for icon components

**Form Management**: React Hook Form with Zod schema validation for type-safe forms.

**Development**: TypeScript for type safety, Vite for fast development and optimized builds, tsx for running TypeScript in Node.js during development.

**Charting**: Chart.js referenced in the legacy HTML for dashboard visualizations and sales reports.

**Fonts**: Google Fonts CDN for Roboto, Roboto Mono, DM Sans, Fira Code, Geist Mono, and Architects Daughter typefaces.