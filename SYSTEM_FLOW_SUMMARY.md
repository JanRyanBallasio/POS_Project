# SYSTEM_FLOW_SUMMARY.md

**Last Updated:** October 15, 2025
**Version:** 1.0

---

## 🗂️ 1. Project Overview

This is a **Point of Sale (POS) and Inventory Management System** designed for retail operations. The system manages:

- **Product inventory** with barcode support
- **Sales transactions** with customer tracking
- **Stock management** with supplier/purchase tracking
- **Supplier percent-based pricing** (automatic price calculation based on supplier markup)
- **Receipt printing** (both basic and professional formats)
- **Multi-unit support** (pieces, kg, etc.)
- **Negative inventory** for kg-based products during sales

### Tech Stack

**Frontend:**
- Next.js 15 (React 19) with TypeScript
- TailwindCSS v4 + Radix UI components
- SWR for data fetching and caching
- Zustand for state management
- Barcode scanning with @zxing/browser

**Backend:**
- Node.js + Express.js
- Supabase (PostgreSQL database)
- Sequelize ORM for models
- Canvas for receipt generation

---

## 📁 2. Folder & File Structure

```
POS_Project/
├── pos-backend/                    → Express.js API server
│   ├── server.js                   → Main entry point, route registration
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               → Supabase client configuration
│   │   ├── controllers/            → Business logic handlers
│   │   │   ├── stockTransactionController.js  → Manages purchases, suppliers, percent
│   │   │   ├── productController.js           → Product CRUD, barcode, soft delete
│   │   │   ├── salesController.js             → Sales creation, updates product qty
│   │   │   ├── salesItemsController.js        → Individual sale items
│   │   │   ├── customerController.js          → Customer management
│   │   │   ├── professionalPrintController.js → Enhanced receipt printing
│   │   │   ├── categoryController.js          → Product categories
│   │   │   ├── positionController.js          → User positions
│   │   │   └── userController.js              → User management
│   │   ├── models/                 → Sequelize database models
│   │   │   ├── stockTransaction.model.js      → Purchase transactions
│   │   │   ├── stockItems.model.js            → Items in purchases
│   │   │   ├── products.model.js              → Product catalog
│   │   │   ├── sales.model.js                 → Sales transactions
│   │   │   ├── salesItems.model.js            → Items in sales
│   │   │   ├── customer.model.js              → Customer records
│   │   │   ├── categories.model.js            → Product categories
│   │   │   └── positions.model.js             → User positions
│   │   ├── routes/                 → API endpoint definitions
│   │   │   ├── stockTransactionRoutes.js      → /api/stock-transactions
│   │   │   ├── productRoutes.js               → /api/products
│   │   │   ├── salesRoutes.js                 → /api/sales
│   │   │   ├── salesItemsRoutes.js            → /api/sales-items
│   │   │   ├── customerRoutes.js              → /api/customers
│   │   │   ├── printRoutes.js                 → /print (basic)
│   │   │   ├── professionalPrintRoutes.js     → /api/print (enhanced)
│   │   │   ├── categoryRoutes.js              → /api/categories
│   │   │   ├── positionRoutes.js              → /api/positions
│   │   │   └── userRoutes.js                  → /api/users
│   │   ├── middleware/
│   │   │   └── cors.js             → CORS configuration
│   │   ├── services/               → Business logic services
│   │   ├── utils/                  → Helper functions
│   │   └── lib/                    → Shared libraries
│   └── package.json                → Backend dependencies
│
├── pos-frontend/                   → Next.js frontend application
│   ├── src/
│   │   ├── app/                    → Next.js 15 app directory
│   │   │   └── dashboard/
│   │   │       └── _pages/         → Main application pages
│   │   │           ├── POS/        → Point of sale interface
│   │   │           │   └── components/
│   │   │           │       ├── leftColumn/   → Product selection, cart
│   │   │           │       └── rightColumn/  → Payment, checkout
│   │   │           ├── Products/   → Product management
│   │   │           ├── StockMovements/       → Inventory & purchases
│   │   │           │   └── components/
│   │   │           │       ├── addProductModal.tsx     → Add product to purchase
│   │   │           │       ├── addStockModal.tsx       → Create new purchase
│   │   │           │       ├── addSupplierModal.tsx    → Add/edit suppliers
│   │   │           │       ├── percentModal.tsx        → Set supplier percent
│   │   │           │       ├── purchasesView.tsx       → Purchase list view
│   │   │           │       ├── stockTable.tsx          → Stock transaction table
│   │   │           │       └── stockHead.tsx           → Header component
│   │   │           ├── Transaction/                    → Sales history
│   │   │           └── Dashboard/                      → Analytics dashboard
│   │   ├── components/             → Shared UI components
│   │   │   └── ui/                 → Radix UI primitives
│   │   ├── contexts/               → React contexts
│   │   │   ├── cart-context.tsx    → Shopping cart state
│   │   │   └── productRegister-context.tsx  → Product registration
│   │   ├── hooks/                  → Custom React hooks
│   │   │   ├── global/
│   │   │   │   └── fetching/
│   │   │   │       └── useProducts.ts      → Fetch products hook
│   │   │   ├── categories/         → Category hooks
│   │   │   ├── pos/                → POS-specific hooks
│   │   │   ├── products/           → Product hooks
│   │   │   ├── stocks/             → Stock hooks
│   │   │   ├── printing/           → Printing hooks
│   │   │   └── users/              → User hooks
│   │   ├── stores/                 → Zustand state stores
│   │   ├── types/                  → TypeScript type definitions
│   │   ├── utils/                  → Utility functions
│   │   └── lib/
│   │       └── axios.ts            → Axios instance configuration
│   └── package.json                → Frontend dependencies
│
└── YZY-POS/                        → Legacy/alternative Tauri-based app
```

---

## 🔁 3. Data Flow Summary

### High-Level Flow

```
User Interaction (Frontend Components)
    ↓
API Request (Axios + SWR)
    ↓
Express Routes (/api/*)
    ↓
Controllers (Business Logic)
    ↓
Supabase Client (Database Operations)
    ↓
PostgreSQL Database
    ↓
Response → SWR Cache → UI Update
```

### Example: Adding a Product to a Purchase

```
1. User opens AddProductModal → selects supplier → enters product, qty, price

2. Frontend calculates:
   - Fetches supplier percent from: GET /api/stock-transactions/suppliers/:companyName/percent
   - If percent exists (e.g., 1.25), divides supplier price by percent
     Example: Supplier price ₱100 ÷ 1.25 = ₱80 (stored as product price)

3. Frontend sends:
   POST /api/stock-transactions
   {
     company_name: "ABC Supplier",
     date: "2025-10-15T10:30:00+08:00",
     total: 80,  // qty * adjusted_price
     items: [{
       product_id: 123,
       purchased_price: 80,  // adjusted price
       quantity: 1
     }]
   }

4. Backend (stockTransactionController.createStockTransaction):
   a) Creates/updates StockTransaction record
   b) Inserts StockItems records
   c) Updates Products table:
      - Increases product.quantity by purchase quantity
      - Sets product.price = purchased_price (the adjusted price)

5. Response returns to frontend → SWR revalidates cache → UI updates
```

### Example: Making a Sale (POS Flow)

```
1. User adds products to cart (cart-context.tsx manages state)

2. User completes payment → Frontend sends:
   POST /api/sales
   {
     customer_id: 456 (optional),
     total_purchase: 150,
     items: [
       { product_id: 123, quantity: 2, price: 50 },
       { product_id: 789, quantity: 1, price: 50 }
     ]
   }

3. Backend (salesController.createSale):
   a) Creates Sales record
   b) Inserts SaleItems records
   c) Updates Products table:
      - Decreases product.quantity by sale quantity
      - Allows negative quantities for kg-based products

4. Optional: Generate receipt via /api/print/enhanced

5. Response → Cart clears → Receipt prints → Transaction complete
```

---

## ⚙️ 4. Key Components and Pages

### Frontend Components

#### **StockMovements Module**

| Component | Purpose | Key Props/State |
|-----------|---------|-----------------|
| **addProductModal.tsx** | Add individual product to a purchase order | `onAdd`, `preSelectedSupplier` |
| | - Product search with barcode support | `selected` (product ID), `qty`, `unitPrice` |
| | - Supplier selection with percent display | `selectedCompany`, `supplierPercent` |
| | - Automatic price adjustment calculation | `adjustedPrice` = `unitPrice ÷ percent` |
| | - Shows current product price/qty for comparison | |
| **addStockModal.tsx** | Create new purchase transaction | Manages list of products being added |
| **addSupplierModal.tsx** | Add/edit supplier companies | Supplier name input |
| **percentModal.tsx** | Set markup percent for suppliers | `percent` value (e.g., 1.25 = 125%) |
| **purchasesView.tsx** | Display purchase history | Lists all StockTransactions |
| **stockTable.tsx** | Table of stock transactions | Sortable, filterable transaction list |

**Key Interactions:**
- When supplier is selected, fetches percent via API
- Price calculation shown in real-time as user types
- Green banner shows: "₱100 ÷ 125% = ₱80 (saved to product)"
- Blue banner alerts if product price will change
- Yellow banner warns if no percent set for supplier

#### **POS Module**

| Component | Purpose |
|-----------|---------|
| **leftColumn/** | Product selection, cart display, quantity adjustments |
| **rightColumn/** | Payment processing, receipt generation, checkout |

**Features:**
- Barcode scanning support
- Auto-update quantity for kg items based on price input
- Negative inventory allowed for kg products during sales
- Numpad-only shortcuts for quantity +/- (mobile responsive)

#### **Products Module**

- Product CRUD operations
- Barcode management
- Soft delete functionality
- Category assignment

#### **Transaction Module**

- Sales history
- Transaction search and filtering
- Receipt reprinting

#### **Dashboard Module**

- Sales analytics and graphs
- Inventory status
- Quick stats

---

## 🧩 5. Backend Endpoints and Logic

### Stock Transaction Endpoints

```javascript
POST   /api/stock-transactions
  → createStockTransaction
  → Creates purchase transaction, adds stock items
  → Updates product quantities (INCREASE) and prices

GET    /api/stock-transactions
  → listStockTransactions
  → Returns all transactions (limited to 200, ordered by date desc)

GET    /api/stock-transactions/:id
  → getStockTransaction
  → Returns single transaction with joined product details

GET    /api/stock-transactions/suppliers/list
  → getSuppliers
  → Returns unique supplier names with latest percent values

GET    /api/stock-transactions/suppliers/:companyName/percent
  → getSupplierPercent
  → Returns current percent for a supplier

PUT    /api/stock-transactions/suppliers/:companyName/percent
  → updateSupplierPercent
  → Upserts percent value for supplier
```

**Key Logic in `createStockTransaction`:**
```javascript
// 1. Insert StockTransaction record
// 2. Batch insert StockItems
// 3. For each item:
//    - Fetch current product quantity and price
//    - Calculate new_quantity = current_quantity + purchased_quantity
//    - Update Products: { quantity: new_quantity, price: purchased_price }
// 4. purchased_price is the ADJUSTED price (already divided by percent on frontend)
```

### Product Endpoints

```javascript
GET    /api/products
  → getAllProducts (excludes soft-deleted by default)

GET    /api/products/:id
  → getProductById

POST   /api/products
  → createProduct

PUT    /api/products/:id
  → updateProduct

DELETE /api/products/:id
  → deleteProduct (soft delete: sets is_deleted = true)
```

### Sales Endpoints

```javascript
POST   /api/sales
  → createSale
  → Creates sale transaction, decreases product quantities
  → Allows negative inventory for kg-based products

GET    /api/sales
  → listSales

GET    /api/sales/:id
  → getSaleById (with joined items and product details)
```

**Key Logic in `createSale`:**
```javascript
// 1. Insert Sales record
// 2. Insert SaleItems records
// 3. For each item:
//    - Fetch current product quantity
//    - Decrease quantity: new_qty = current_qty - sold_qty
//    - Allow negative if product.unit === 'kg'
//    - Update Products: { quantity: new_qty }
```

### Printing Endpoints

```javascript
POST   /api/print/enhanced
  → generateEnhancedReceipt
  → Uses Canvas to generate professional receipts
  → Returns PDF or image
```

---

## 🧮 6. Database Structure

### Entity Relationship Diagram

```
Categories (1) ──< (M) Products (M) >─── (1) StockTransaction
                           │                       │
                           │                       └─< StockItems (many-to-one)
                           │
                           ├─< SaleItems (many-to-one)
                           │
                  (M) >────┴──── (1) Sales >──── (M) Customer
```

### Tables

#### **Products**
```sql
id              BIGINT PRIMARY KEY AUTO_INCREMENT
name            TEXT NOT NULL
category_id     INTEGER (FK → Categories.id)
price           DECIMAL (base selling price, updated on stock-in)
quantity        DECIMAL (current inventory, can be negative for kg items)
unit            TEXT (default: 'pcs', also supports 'kg')
barcode         TEXT (unique identifier for scanning)
is_deleted      BOOLEAN (default: false, for soft deletes)
deleted_at      DATE
created_at      DATE
```

#### **StockTransaction** (Purchases/Suppliers)
```sql
id              BIGINT PRIMARY KEY AUTO_INCREMENT
company_name    TEXT (supplier/company name)
date            DATE (purchase date)
total           FLOAT (total purchase amount)
percent         FLOAT (markup percent, e.g., 1.25 = 125%)
created_at      DATE
```

**Purpose:** Tracks purchases from suppliers. The `percent` field stores the markup factor used to calculate product prices.

**Percent Calculation Logic:**
- Frontend divides supplier price by percent before saving
- Example: If supplier sells at ₱100 and percent is 1.25 (125% markup)
  - Calculated base price: ₱100 ÷ 1.25 = ₱80
  - ₱80 is stored as `product.price`
  - When selling, POS uses ₱100 (or user can override)

#### **StockItems** (Purchase Line Items)
```sql
id                      BIGINT PRIMARY KEY AUTO_INCREMENT
stock_transaction_id    BIGINT (FK → StockTransaction.id)
product_id              BIGINT (FK → Products.id)
purchased_price         FLOAT (adjusted base price after percent division)
quantity                INTEGER (quantity purchased)
created_at              DATE
```

#### **Sales**
```sql
id              BIGINT PRIMARY KEY AUTO_INCREMENT
customer_id     BIGINT (FK → Customer.id, optional)
total_purchase  FLOAT (total sale amount)
created_at      DATE
```

#### **SaleItems**
```sql
id              BIGINT PRIMARY KEY AUTO_INCREMENT
sale_id         BIGINT (FK → Sales.id)
product_id      BIGINT (FK → Products.id)
quantity        DECIMAL (quantity sold, supports decimals for kg)
price           FLOAT (sale price at time of transaction)
created_at      DATE
```

#### **Customer**
```sql
id              BIGINT PRIMARY KEY
name            TEXT
contact         TEXT
address         TEXT
created_at      DATE
```

#### **Categories**
```sql
id              INTEGER PRIMARY KEY
name            TEXT
created_at      DATE
```

#### **Positions**
```sql
id              INTEGER PRIMARY KEY
name            TEXT (e.g., "Cashier", "Manager")
created_at      DATE
```

### Critical Database Relationships

1. **Stock In (Purchase) Flow:**
   ```
   StockTransaction (1) ──< (M) StockItems (M) >── (1) Products
   ```
   - One purchase can have many items
   - Each item references a product
   - Product quantity INCREASES, price UPDATES

2. **Sales Flow:**
   ```
   Sales (1) ──< (M) SaleItems (M) >── (1) Products
   ```
   - One sale can have many items
   - Each item references a product
   - Product quantity DECREASES (can go negative for kg)

---

## 🧠 7. Global State / Hooks / Utilities

### Custom Hooks

#### **Frontend Hooks**

| Hook | Location | Purpose |
|------|----------|---------|
| `useProducts(enabled)` | `hooks/global/fetching/useProducts.ts` | Fetches product list via SWR, only when enabled |
| `useSWR(key, fetcher)` | SWR library | Data fetching with caching, revalidation |
| `useSWRConfig()` | SWR library | Access to `mutate` function for cache invalidation |

### Contexts

| Context | Location | Purpose |
|---------|----------|---------|
| `cart-context.tsx` | `contexts/cart-context.tsx` | Shopping cart state for POS (items, quantities, totals) |
| `productRegister-context.tsx` | `contexts/productRegister-context.tsx` | Product registration workflow state |

### Utilities

#### **Backend Utilities**

```javascript
// stockTransactionController.js
const cleanNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
// Ensures safe number parsing for price/quantity inputs
```

#### **Frontend Utilities**

**Axios Instance** (`lib/axios.ts`):
- Configured with base URL (typically `http://localhost:5000/api`)
- Used throughout app for API calls
- Works with SWR for data fetching

**FlexSearch** (in `addProductModal.tsx`):
- Fast client-side product search
- Searches by product name AND barcode
- Supports Unicode normalization
- Limits results to 10 items for performance

### Key State Management Patterns

1. **SWR for Server State:**
   - Automatic caching and revalidation
   - `mutate('/stock-transactions')` triggers refetch after mutations
   - `enabled` flag prevents unnecessary API calls

2. **React Context for UI State:**
   - Cart items and totals
   - Product registration flow
   - Avoids prop drilling

3. **Local Component State:**
   - Form inputs (quantity, price)
   - Modal open/close state
   - Loading states

---

## 🔄 8. Update Instructions

After major updates, run this prompt to refresh the summary:

> **"Claude, update `SYSTEM_FLOW_SUMMARY.md` to reflect the new changes in logic, data flow, or component structure."**

### When to Update

- ✅ New features added (e.g., new modules, endpoints)
- ✅ Database schema changes
- ✅ Major refactoring of components or logic
- ✅ New calculation methods or business rules
- ✅ API endpoint additions/modifications

### Update Checklist

- [ ] Update version number and date at top
- [ ] Add new endpoints to section 5
- [ ] Update database structure if schema changed
- [ ] Document new components in section 4
- [ ] Update data flow diagrams if flow changed
- [ ] Add new hooks/utilities to section 7

---

## 📝 Additional Notes

### Current Branch Status

**Branch:** `fix/stock-transactions-price-update`
**Recent Changes:**
- ✅ Product price now updates from `purchased_price` during stock save
- ✅ Inventory allows negative product quantity on sales for kg items
- ✅ Decimal stock-in updates supported
- ✅ Price input auto-updates quantity for kg items in cart
- ✅ Qty +/- shortcuts restricted to numpad only
- ✅ Mobile responsiveness fixes for products tab

### Design Decisions

1. **Why divide price by percent on frontend?**
   - Gives user immediate visual feedback
   - Backend stores already-calculated base price
   - Simplifies backend logic (no need to re-calculate)

2. **Why allow negative inventory for kg products?**
   - Kg-based products (e.g., flour, sugar) can be sold in partial amounts
   - Negative inventory indicates debt/backorder to be fulfilled
   - Pieces (pcs) products maintain strict positive inventory

3. **Why soft delete products?**
   - Preserves historical sales data integrity
   - Prevents broken references in old transactions
   - Can be restored if deleted by mistake

4. **Why store percent in StockTransaction?**
   - Each purchase may have different supplier terms
   - Historical accuracy (percent may change over time)
   - Allows auditing of price calculations

---

## 🎯 Quick Reference: Common Tasks

### 1. Add a New Product
```
Frontend: Products page → Add button → Fill form
Backend: POST /api/products
Database: Insert into Products table
```

### 2. Record a Purchase
```
Frontend: Stock Movements → Add Stock → Select supplier → Add products
Backend: POST /api/stock-transactions (creates transaction + items)
Database: Insert StockTransaction, StockItems → Update Products (qty ↑, price ←)
```

### 3. Make a Sale
```
Frontend: POS → Add to cart → Checkout → Payment
Backend: POST /api/sales
Database: Insert Sales, SaleItems → Update Products (qty ↓)
```

### 4. Set Supplier Markup
```
Frontend: Stock Movements → Suppliers → Edit supplier → Set percent
Backend: PUT /api/stock-transactions/suppliers/:name/percent
Database: Update StockTransaction.percent (most recent record for supplier)
```

### 5. Print Receipt
```
Frontend: Transaction page → Select sale → Print button
Backend: POST /api/print/enhanced
Output: PDF/image receipt generated via Canvas
```

---

**End of System Flow Summary**
