# Product Requirements Document
## Local Inventory & Pre-Order Portal (Beginner Project)

### 1. Overview

A simple, client-side web app that lets a shop owner list products and lets customers browse and place pre-orders — all in the browser, with **no backend, no database, and no login**. All data (inventory + orders) lives in the browser's `localStorage`.

This is a great beginner project because it teaches core front-end skills (DOM manipulation, state management, forms, data persistence) without the complexity of servers, databases, or authentication.

### 2. Goals

- Let an "admin" (shop owner) manage a list of products (inventory).
- Let a "customer" browse products and place pre-orders.
- Persist everything locally so data survives a page refresh.
- Keep the scope small enough to finish in a few days to a couple of weeks.

### 3. Non-Goals (explicitly out of scope)

- No user accounts, login, or authentication.
- No real database or backend server.
- No payment processing.
- No multi-device sync (data is tied to one browser).
- No real-time inventory across multiple users — this is a single-browser, single-session experience.

### 4. Users / Roles

Since there's no login, roles can be handled with a simple toggle or two separate pages/tabs:

| Role | What they do |
|---|---|
| **Admin / Shop Owner** | Adds, edits, deletes products; sets stock quantity and price; views incoming pre-orders |
| **Customer** | Browses available products; adds items to a pre-order cart; submits a pre-order request |

### 5. Core Features

#### 5.1 Inventory Management (Admin side)
- **Add product**: name, description, price, quantity available, category (optional), image URL (optional).
- **Edit product**: update any field above.
- **Delete product**: remove from inventory.
- **View inventory list**: table or grid showing all products with current stock.
- **Low stock indicator**: visually flag items below a set threshold (e.g., red badge if qty < 5).

#### 5.2 Product Browsing (Customer side)
- **Product grid/list view**: shows name, price, image, and availability (in stock / out of stock).
- **Search bar**: filter products by name.
- **Category filter** (optional/stretch): filter by category if you added categories.
- **Product detail view** (optional): click a product to see full description.

#### 5.3 Pre-Order / Cart Flow
- **Add to pre-order cart**: customer selects quantity and adds a product.
- **Cart view**: shows selected items, quantities, and running total.
- **Adjust/remove items** from cart before submitting.
- **Submit pre-order**: customer enters name + contact info (just text fields, no validation against a real system) and confirms.
- **Order confirmation**: show a simple summary/receipt after submission.

#### 5.4 Order Tracking (Admin side)
- **View all submitted pre-orders**: list of orders with customer name, items, quantities, total, and timestamp.
- **Mark order as fulfilled/pending** (simple status toggle).
- **Clear/delete orders** (e.g., after fulfilling).

#### 5.5 Data Persistence
- All inventory and order data is saved to `localStorage` on every change.
- Data is loaded from `localStorage` when the app starts.
- **Reset/Clear all data** button (with confirmation) — useful for testing and for starting fresh.

### 6. Suggested Data Structure

```js
// Inventory item
{
  id: "prod_1",
  name: "Blue Ceramic Mug",
  description: "Handmade 12oz mug",
  price: 15.00,
  quantity: 8,
  category: "Kitchenware",
  imageUrl: ""
}

// Order
{
  id: "order_1",
  customerName: "Jane Doe",
  contact: "jane@email.com",
  items: [
    { productId: "prod_1", name: "Blue Ceramic Mug", qty: 2, priceEach: 15.00 }
  ],
  total: 30.00,
  status: "pending", // or "fulfilled"
  createdAt: "2026-09-17T10:00:00Z"
}
```

You'd typically store two arrays in localStorage: `inventory` and `orders`, each as a JSON string.

### 7. User Flows

**Admin flow:**
1. Open app → toggle to "Admin" view.
2. Add a few products (name, price, qty).
3. See them appear in the inventory list.
4. Later, check "Orders" tab to see what customers requested.

**Customer flow:**
1. Open app → browse products.
2. Search/filter for something specific.
3. Add items to pre-order cart, adjust quantities.
4. Fill in name + contact, submit pre-order.
5. See confirmation screen.

### 8. Suggested Tech Stack (beginner-friendly)

- **HTML + CSS + vanilla JavaScript** — simplest option, great for learning fundamentals.
- Or **React** (with `useState`) if you want to practice component-based thinking — still no backend needed.
- `localStorage.setItem()` / `localStorage.getItem()` with `JSON.stringify` / `JSON.parse` for persistence.

### 9. Stretch Features (only if the basics are working well)

- Edit/cancel a submitted pre-order before it's fulfilled.
- Export orders as a downloadable CSV.
- Simple charts (e.g., "most pre-ordered items") using a lightweight chart library.
- Dark mode toggle.
- "Admin PIN" (just a client-side prompt, not real security) to gate the admin view from casual customers.

### 10. Success Criteria

The project is "done" when:
- An admin can fully manage a product list without page reload losing data.
- A customer can complete an entire pre-order flow from browsing to confirmation.
- Refreshing the browser preserves both inventory and order data.
- The app works with zero backend — everything runs from static files.
