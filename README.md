# Meat Fresh Butchery — Local Inventory & Pre-Order Portal

A modern, client-side single-page web application (SPA) built with vanilla HTML, CSS, and JavaScript using ES modules. All inventory, pre-orders, and cart sessions persist directly in the browser's `localStorage` — with **no server, no database, and no login required**.

---

## 📂 Project Structure

```
Pre order Hub/
├── index.html                    # Root HTML mount point & font loading
├── README.md                     # Documentation & setup guide
├── prd-local-inventory-preorder.md # Product Requirements Document
├── architecture-local-inventory-preorder.md # Architecture specification
├── pages.md                      # UI Blueprints & Google Stitch prompts
├── stitch_designs/               # Reference HTML/CSS and PNG mocks from Stitch
├── /css
│   ├── base.css                  # Variables, resets, typography, and animations
│   ├── layout.css                # App containers, navbar, hero, grid, modals
│   └── components.css            # Buttons, badges, cards, table, forms, toasts
└── /js
    ├── main.js                   # Application bootstrap & render subscriber
    ├── store.js                  # In-memory centralized store & state reducer
    ├── storage.js                # localStorage read/write persistence layer
    ├── models.js                 # Entity factories (Product, Order) & demo seeds
    ├── /views
    │   ├── adminView.js          # Admin dashboard (Inventory, Orders, Settings)
    │   ├── customerView.js       # Customer storefront & pre-order checkout
    │   └── router.js             # Hash-based routing (`#/shop` vs `#/admin`)
    ├── /components
    │   ├── productForm.js        # Add / Edit product modal dialog
    │   ├── productCard.js        # Storefront product card item
    │   ├── inventoryTable.js     # Admin inventory management data table
    │   ├── cart.js               # Slide-over cart drawer & checkout form
    │   ├── orderList.js          # Admin pre-order queue with status toggles
    │   └── toast.js              # Fire-and-forget notification alerts
    └── /utils
        ├── dom.js                # Safe DOM element creation (`createEl`, `qs`)
        ├── format.js             # Currency, date, and relative time formatters
        └── validate.js           # Form and data validation rules
```

---

## 🚀 How to Run Locally

Because this project uses plain ES modules (`<script type="module">`), it can be served using any local static HTTP server:

### Option A: Using `npx serve`
```bash
npx serve .
```

### Option B: Using Python
```bash
python -m http.server 3000
```

### Option C: VS Code / Antigravity Live Server
Right-click `index.html` and select **"Open with Live Server"**.

---

## 🔑 Key Features & Architecture

1. **Unidirectional Data Flow**:
   $$\text{User Interaction} \longrightarrow \text{store.dispatch(action)} \longrightarrow \text{reducer} \longrightarrow \text{persist to localStorage} \longrightarrow \text{re-render views}$$
2. **Atomic Stock Decrement**:
   When a customer confirms a pre-order, the reducer automatically subtracts the reserved quantity from `inventory` so available stock is always accurate.
3. **Safe DOM Generation**:
   No raw `innerHTML` string interpolation. Elements are constructed using `document.createElement` via `createEl()` to avoid XSS vectors.
4. **Zero Configuration**:
   Pre-loaded with realistic demo products and sample pre-orders for Nyama Fresh Butchery. A "Reset All Data" option is available in the Admin Settings panel for clean testing.

