# System Architecture
## Local Inventory & Pre-Order Portal (Vanilla HTML/CSS/JS + localStorage)

### 1. Architectural Style

This is a **client-only, single-page application (SPA)** using vanilla JavaScript with a lightweight **component + store pattern** — no framework, but structured like one so it stays maintainable as it grows.

Key principles:
- **Single source of truth**: one in-memory "store" object holds all app state (inventory, orders, current view). The UI is always a *render* of that state.
- **Unidirectional data flow**: `Action → Update Store → Persist to localStorage → Re-render UI`. Nothing mutates the DOM directly outside of render functions.
- **Separation of concerns**: data layer, business logic, and UI rendering live in separate files/modules.
- **No build tools required**: plain ES modules (`<script type="module">`), so it runs by just opening `index.html` or serving static files — no bundler needed (though you can add Vite later if you want).

### 2. Folder / File Structure

```
inventory-preorder-portal/
├── index.html
├── /css
│   ├── base.css          # resets, variables, typography
│   ├── layout.css        # grid/flex layout, nav, page structure
│   └── components.css    # cards, buttons, forms, badges, modals
├── /js
│   ├── main.js            # app entry point — initializes everything
│   ├── store.js            # central state object + pub/sub
│   ├── storage.js          # all localStorage read/write logic
│   ├── models.js           # factory functions for Product / Order objects + IDs
│   ├── /views
│   │   ├── adminView.js    # renders admin dashboard (inventory + orders)
│   │   ├── customerView.js # renders product browsing + cart
│   │   └── router.js       # simple hash-based view switching
│   ├── /components
│   │   ├── productForm.js      # add/edit product form
│   │   ├── productCard.js      # single product display (grid item)
│   │   ├── inventoryTable.js   # admin's product list/table
│   │   ├── cart.js              # cart drawer/panel logic
│   │   ├── orderList.js         # admin's incoming orders list
│   │   └── toast.js             # small notification component
│   └── /utils
│       ├── dom.js           # helper functions (qs, createEl, etc.)
│       ├── format.js        # currency/date formatting
│       └── validate.js      # form validation helpers
└── README.md
```

**Why this structure:** it mirrors how a React app would be organized (views vs. components vs. state vs. utils), so the concepts transfer directly if you move to a framework later — but everything here is plain JS.

### 3. Core Layers

```
┌─────────────────────────────────────────────┐
│                index.html                     │
│   (mounts app, loads main.js as module)        │
└───────────────────────┬───────────────────────┘
                         │
┌───────────────────────▼───────────────────────┐
│                   main.js                       │
│  - init store from localStorage                 │
│  - set up router                                 │
│  - render initial view                            │
└───────┬─────────────────────────────┬────────────┘
        │                             │
┌───────▼────────┐           ┌────────▼─────────┐
│   store.js       │◄────────►│   storage.js       │
│ - in-memory state │  reads/  │ - localStorage I/O  │
│ - subscribe()      │  writes │ - JSON parse/stringify│
│ - dispatch(action) │         │                      │
└───────┬────────┘           └──────────────────────┘
        │  notifies subscribers on change
┌───────▼─────────────────────────────────────────┐
│                    Views / Components               │
│  adminView, customerView → productCard, cart, etc.   │
│  - read from store.getState()                        │
│  - call store.dispatch() on user actions               │
└───────────────────────────────────────────────────────┘
```

### 4. State Management (`store.js`)

A minimal pub/sub store — no library needed:

```js
// store.js
const state = {
  inventory: [],
  orders: [],
  cart: [],       // customer's in-progress pre-order
  currentView: "customer", // "customer" | "admin"
};

const listeners = [];

function getState() {
  return state;
}

function subscribe(listenerFn) {
  listeners.push(listenerFn);
}

function dispatch(action) {
  reducer(action);       // mutate state based on action type
  persist();              // save relevant slice to localStorage
  listeners.forEach(fn => fn(state)); // trigger re-render
}

function reducer(action) {
  switch (action.type) {
    case "ADD_PRODUCT":
      state.inventory.push(action.payload);
      break;
    case "UPDATE_PRODUCT":
      // find by id, merge changes
      break;
    case "DELETE_PRODUCT":
      state.inventory = state.inventory.filter(p => p.id !== action.payload.id);
      break;
    case "ADD_TO_CART":
      // add or increment item in state.cart
      break;
    case "SUBMIT_ORDER":
      // build order object, push to state.orders, clear cart,
      // decrement matching inventory quantities
      break;
    case "SET_ORDER_STATUS":
      // toggle pending/fulfilled
      break;
    // ...etc
  }
}

export { getState, subscribe, dispatch };
```

This gives you a Redux-like flow at a fraction of the complexity — every state change goes through `dispatch`, which is what makes the app predictable and easy to debug (you can `console.log` every action).

### 5. Persistence Layer (`storage.js`)

Isolates all `localStorage` calls so the rest of the app never touches it directly — makes it trivial to swap for a real backend later.

```js
// storage.js
const KEYS = {
  INVENTORY: "ipp_inventory",
  ORDERS: "ipp_orders",
};

function loadInventory() {
  return JSON.parse(localStorage.getItem(KEYS.INVENTORY)) ?? [];
}

function saveInventory(inventory) {
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
}

function loadOrders() {
  return JSON.parse(localStorage.getItem(KEYS.ORDERS)) ?? [];
}

function saveOrders(orders) {
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
}

function clearAll() {
  localStorage.removeItem(KEYS.INVENTORY);
  localStorage.removeItem(KEYS.ORDERS);
}

export { loadInventory, saveInventory, loadOrders, saveOrders, clearAll };
```

`store.js`'s `persist()` function calls into these after every relevant dispatch (e.g., only `saveInventory` on product actions, only `saveOrders` on order actions — avoid writing everything on every change).

### 6. Data Models (`models.js`)

Factory functions guarantee every object has a consistent shape and a unique ID:

```js
function createProduct({ name, description, price, quantity, category, imageUrl }) {
  return {
    id: crypto.randomUUID(),
    name,
    description: description ?? "",
    price: Number(price),
    quantity: Number(quantity),
    category: category ?? "General",
    imageUrl: imageUrl ?? "",
    createdAt: new Date().toISOString(),
  };
}

function createOrder({ customerName, contact, items }) {
  const total = items.reduce((sum, i) => sum + i.priceEach * i.qty, 0);
  return {
    id: crypto.randomUUID(),
    customerName,
    contact,
    items,
    total,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}
```

### 7. Rendering Approach

No virtual DOM — just **"clear and redraw"** for simplicity (fine at this scale, since inventories/orders will be small lists):

```js
// customerView.js
function renderCustomerView(state) {
  const root = document.getElementById("app");
  root.innerHTML = ""; // clear
  root.appendChild(renderNav());
  root.appendChild(renderProductGrid(state.inventory));
  root.appendChild(renderCartPanel(state.cart));
}
```

Each component file exports a function that **returns a DOM element** (built with `document.createElement` or a small `createEl` helper), rather than raw HTML strings — avoids XSS-via-innerHTML issues and keeps things composable.

`main.js` subscribes the top-level render function to the store, so any `dispatch()` anywhere in the app triggers a full re-render automatically:

```js
// main.js
import { subscribe, getState, dispatch } from "./store.js";
import { renderCustomerView } from "./views/customerView.js";
import { renderAdminView } from "./views/adminView.js";

function render(state) {
  if (state.currentView === "admin") renderAdminView(state, dispatch);
  else renderCustomerView(state, dispatch);
}

subscribe(render);
render(getState()); // initial paint
```

### 8. Routing (Admin vs. Customer view)

Since there's no login, use a simple **hash-based toggle** instead of a real router:

- `#/` or `#/shop` → customer view
- `#/admin` → admin view

`router.js` listens for `hashchange` and dispatches `SET_VIEW`. This keeps it bookmarkable/shareable and avoids needing any routing library.

### 9. Component Responsibilities (summary table)

| File | Responsibility |
|---|---|
| `productForm.js` | Renders add/edit form, validates input, dispatches `ADD_PRODUCT` / `UPDATE_PRODUCT` |
| `productCard.js` | Displays one product (image, price, stock badge, "Add to cart" button) |
| `inventoryTable.js` | Admin table view of all products with edit/delete actions |
| `cart.js` | Shows cart items, qty steppers, total, "Submit Pre-Order" button |
| `orderList.js` | Admin view of submitted orders, status toggle, delete |
| `toast.js` | Fire-and-forget success/error messages (e.g., "Product added") |

### 10. Cross-Cutting Concerns

- **Validation** (`validate.js`): shared rules — price > 0, quantity ≥ 0, required fields — used by both the product form and cart/checkout form.
- **Formatting** (`format.js`): `formatCurrency(15)` → `"$15.00"`, `formatDate(isoString)` → readable date, used anywhere prices/dates are displayed.
- **Stock sync**: when an order is submitted, `SUBMIT_ORDER` in the reducer must also decrement matching `inventory[i].quantity` — keep this logic in one place (the reducer) so stock numbers can never drift out of sync with orders.
- **Error handling**: wrap all `localStorage` calls in try/catch inside `storage.js` (private/incognito mode or storage-full errors can throw) and surface a toast if a save fails.

### 11. Data Flow Example (end-to-end)

**Customer adds an item to cart and checks out:**

1. User clicks "Add to Cart" on a `productCard` → calls `dispatch({ type: "ADD_TO_CART", payload: { productId, qty } })`.
2. Reducer updates `state.cart`.
3. `persist()` is skipped here (cart is transient/session-only — optional to persist).
4. All subscribers re-render → cart badge count updates.
5. User opens cart, fills in name/contact, clicks "Submit Pre-Order" → `dispatch({ type: "SUBMIT_ORDER", payload: { customerName, contact } })`.
6. Reducer: builds order via `createOrder()`, pushes to `state.orders`, decrements `state.inventory` quantities, clears `state.cart`.
7. `persist()` calls `saveOrders()` and `saveInventory()`.
8. Re-render shows confirmation screen; admin view (if opened later) reflects the new order and reduced stock.

### 12. Suggested Build Order (so it's never "half-broken")

1. `models.js` + `storage.js` (data layer first, test in browser console).
2. `store.js` with just `ADD_PRODUCT`/`DELETE_PRODUCT` actions.
3. `adminView.js` + `productForm.js` + `inventoryTable.js` — get product CRUD fully working.
4. `customerView.js` + `productCard.js` — read-only browsing first.
5. `cart.js` + `ADD_TO_CART`/`SUBMIT_ORDER` actions.
6. `orderList.js` on the admin side to close the loop.
7. Polish: `toast.js`, low-stock badges, search/filter, router.

### 13. Why This Architecture Scales Well for a Beginner Project

- You can build and test the data layer (`store` + `storage` + `models`) entirely from the browser console before writing any UI.
- Each component is a small, independently testable function.
- If you later want to add a real backend, only `storage.js` needs to change (swap `localStorage` calls for `fetch()` calls) — the store, reducer, and UI layers stay untouched.
- If you later want React, `store.js`'s reducer pattern maps almost directly onto `useReducer`.
