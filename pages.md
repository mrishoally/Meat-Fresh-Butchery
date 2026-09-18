# Nyama Fresh Butchery — Local Inventory & Pre-Order Portal — Screen Blueprints & Google Stitch UI Prompts

This document outlines all screens, views, drawers, and modal dialogs required for the **Nyama Fresh Butchery Inventory & Pre-Order Portal** — a system for a Tanzanian meat butchery dealing in **mbuzi (goat)**, **ng'ombe (beef/cow)**, and **kuku (chicken)**. Each section includes component specifications and a **Google Stitch UI Generation Prompt** optimized for generating modern, high-fidelity user interfaces. All pricing is quoted in **Tanzanian Shillings (TZS)**, stock is tracked in **kilograms (kg)** or **pieces (vipande)** depending on the cut, and payment on pickup supports **Cash, M-Pesa, Tigo Pesa, and Airtel Money**.

---

## 🎨 Global Design System & Aesthetic Foundation

When feeding prompts into Google Stitch or assembling CSS, align with these design system parameters:

* **Theme**: Warm, trustworthy, no-nonsense local butchery aesthetic — evokes a clean modern nyama shop counter rather than a supermarket (available in Crisp Light Mode with warm butcher-paper accents, and sleek Dark Mode).
* **Color Palette**:
  * **Primary / Brand**: Deep Maroon / Butcher Red (`#9F1D1D` / `#C0392B`) with Savannah Gold accent (`#D68A2C`)
  * **Background**: Soft clean canvas (`#FBF7F2` light / `#181210` dark)
  * **Surface / Cards**: Pure white / elevated charcoal (`#FFFFFF` light / `#241A17` dark) with `1px border border-stone-200 / border-stone-800`
  * **Accents / Status**:
    * Success / In Stock: Emerald (`#10B981`)
    * Low Stock Warning: Amber / Warm Ochre (`#F59E0B`)
    * Out of Stock / Danger: Crimson / Rose (`#EF4444`)
    * Neutral Text: High-contrast charcoal (`#1C1917`) and subtle stone (`#78716C`)
* **Typography**:
  * Headings: Modern Geometric Sans (Inter, Outfit, or Plus Jakarta Sans)
  * Numbers / Pricing: Tabular figures, semi-bold font, always suffixed with `TZS`
* **UI Style**: Glassmorphism touches on sticky headers (`backdrop-blur-md`), smooth rounded corners (`rounded-2xl` for cards, `rounded-xl` for buttons/inputs), subtle elevation drop shadows, clear interactive hover states.

---

## 📑 Screen Index

1. [Page 1: Customer Storefront & Product Browsing](#page-1-customer-storefront--product-browsing)
2. [Page 2: Customer Pre-Order Drawer & Checkout](#page-2-customer-pre-order-drawer--checkout)
3. [Page 3: Customer Order Confirmation & Receipt](#page-3-customer-order-confirmation--receipt)
4. [Page 4: Admin Inventory Management Dashboard](#page-4-admin-inventory-management-dashboard)
5. [Page 5: Admin Add / Edit Product Modal](#page-5-admin-add--edit-product-modal)
6. [Page 6: Admin Pre-Orders Management Dashboard](#page-6-admin-pre-orders-management-dashboard)
7. [Page 7: Admin Settings & Data Reset Panel](#page-7-admin-settings--data-reset-panel)

---

### Page 1: Customer Storefront & Product Browsing

#### 1. Purpose & Flow
The primary customer landing view (`#/duka` or `#/`). Customers browse **Nyama Fresh Butchery**'s live cuts of mbuzi, ng'ombe, and kuku, check availability in kilograms, filter by animal/category, and reserve a pre-order for pickup at the butchery counter.

#### 2. Key Elements
* **Top Navigation Bar**:
  * Store logo / title: "Nyama Fresh Butchery" with a subtle badge "Chukua Dukani — Local Pickup".
  * Search input with search icon and instant clear button (placeholder: "Tafuta nyama... e.g. Mbavu za Mbuzi").
  * Role switcher pill / link: "Nenda Admin Dashboard ⚙️" ("Switch to Admin Dashboard").
  * Cart trigger button with an animated pill badge showing total items count and running subtotal in TZS.
* **Hero / Announcement Strip**:
  * Friendly greeting: "Agiza Nyama Mapema — Bila Malipo ya Awali" ("Reserve Fresh Meat Ahead of Time — No Pre-Payment Required").
  * Brief explanation badge: "Angalia mzigo wa leo • Weka oda yako • Lipa dukani wakati wa kuchukua" ("Browse today's stock • Reserve your order • Pay in-store on pickup").
* **Filter & Control Bar**:
  * Category filter chips: "Zote / All", "Nyama ya Mbuzi (Goat)", "Nyama ya Ng'ombe (Beef)", "Kuku (Chicken)".
  * Availability toggle checkbox: "Ficha Iliyoisha" ("Hide Out of Stock").
  * Sorting dropdown: "Yanayopendwa (Featured)", "Bei: Chini kwenda Juu", "Bei: Juu kwenda Chini", "Kiwango cha Mzigo (Stock Level)".
* **Product Catalog Grid**:
  * Responsive 3 to 4 column card grid.
  * Product card components:
    * Image container with aspect ratio `4:3`, subtle zoom on hover.
    * Stock status badges (stock tracked per kg or per piece):
      * Emerald badge: `Ipo Dukani (12 kg zimebaki)` ("In Stock (12 kg left)")
      * Amber badge: `Mzigo Unaisha (Kilo 2 tu!)` ("Low Stock (Only 2 kg left!)")
      * Slate/Red badge: `Imeisha / Mzigo Mpya Wiki Ijayo` ("Sold Out / Next Batch Soon")
    * Category pill tag (e.g., "Mbuzi", "Ng'ombe", "Kuku").
    * Product title and 2-line truncated description (cut, origin, whether bone-in/boneless).
    * Price in prominent bold typography, per kilogram or per piece (e.g., `TZS 12,000 / kg`).
    * Interactive "Weka Oda" / "Add to Cart" button with cart icon (disabled with "Imeisha Dukani" state if stock is 0).
* **Toast Notification**:
  * Floating bottom-right notification banner: `"[Product Name] imeongezwa kwenye kikapu chako"` ("Added [Product Name] to pre-order cart").

#### 3. Google Stitch UI Prompt
```text
A modern, trustworthy e-commerce storefront for a Tanzanian meat butchery called "Nyama Fresh Butchery" (nyama = meat, in Swahili). Clean local-market-meets-modern aesthetic with warm cream backgrounds, crisp white rounded cards, and a deep butcher-red/gold accent palette.

Layout details:
1. Top Sticky Navbar:
   - Left: Minimalist logo icon (cleaver + cow/goat outline) with brand name "Nyama Fresh Butchery" and small green pill "Chukua Dukani — Pickup Active".
   - Center: Floating search input bar with search magnifying glass icon and placeholder "Tafuta nyama ya mbuzi, ng'ombe, au kuku...".
   - Right: Link button "Admin Portal" with a subtle gear icon, and a prominent floating Cart button with shopping bag icon, badge counter "3", and price "TZS 68,000".

2. Hero Banner:
   - Subtle gradient banner with headline: "Nyama Safi Leo — Agiza Sasa, Chukua Dukani".
   - Subtitle: "Angalia mzigo wa sasa wa mbuzi, ng'ombe na kuku. Weka oda yako leo na ulipe unapokuja kuchukua."
   - Info chips: "✓ Hakuna malipo ya awali" • "✓ Nyama yako imehifadhiwa" • "✓ Chukua dukani Kariakoo".

3. Category & Filter Bar:
   - Horizontal pill selector: "Zote (22)" [Active filled pill], "Nyama ya Mbuzi", "Nyama ya Ng'ombe", "Kuku wa Kienyeji & Broiler".
   - Right side: Dropdown select "Panga kwa: Yanayopendwa" and a toggle switch "Ipo Dukani Tu".

4. Product Grid (4 columns on desktop):
   - Card 1: Whole cut of goat meat on a wooden board. Category tag "Mbuzi". Badge "Ipo Dukani (8 kg)". Price "TZS 12,000 / kg". Title "Nyama ya Mbuzi Bila Mfupa (Boneless Goat)". "Weka Oda" button.
   - Card 2: Beef ribs cut. Category tag "Ng'ombe". Amber warning badge "Mzigo Unaisha (Kilo 2 tu!)". Price "TZS 10,500 / kg". Title "Mbavu za Ng'ombe (Beef Ribs)". "Weka Oda" button.
   - Card 3: Whole free-range chicken. Grey badge "Imeisha Dukani". Price "TZS 15,000 / kilo mzima". Title "Kuku wa Kienyeji (Free-Range Chicken)". Button disabled reading "Imeisha".
   - Card 4: Chicken drumsticks tray. Green badge "Ipo Dukani (15 kg)". Price "TZS 9,000 / kg". Title "Mapaja ya Kuku Broiler (Broiler Drumsticks)". "Weka Oda" button.

Include subtle hover elevation effects, refined typography using Inter or Plus Jakarta Sans, clean 1px borders, and TZS currency formatting on every price.
```

---

### Page 2: Customer Pre-Order Drawer & Checkout

#### 1. Purpose & Flow
An interactive slide-over drawer (or modal) opening from the right when the customer clicks the cart. Allows reviewing items, stepping kilogram/piece quantities up or down (enforcing stock limits at the butchery counter), entering contact info, and confirming the pre-order.

#### 2. Key Elements
* **Drawer Header**:
  * Title: "Kikapu Chako cha Oda", item count counter `(3 bidhaa)`.
  * Close "✕" icon button.
* **Cart Items List**:
  * Scrollable list of items.
  * Thumbnail image (rounded, 64x64px).
  * Product title & unit price (per kg or per piece).
  * Quantity Stepper: `[-] [ 2 kg ] [+]` with max cap matching available stock at the butchery.
  * Subtotal per line item in TZS.
  * Trash icon button to remove item.
* **Order Summary Box**:
  * Subtotal calculation.
  * Deposit / Payment note: "Jumla ya Makadirio Utakayolipa Dukani: TZS 72,000 (Hakuna malipo leo)" ("Estimated Total Due on Pickup: TZS 72,000 — No payment required today").
  * Notice box: "📌 Nyama yako itahifadhiwa kwa jina lako kwa masaa 24 baada ya kukatwa." ("Your meat will be set aside under your name for 24 hours after being cut.")
* **Customer Contact Information Form**:
  * "Jina Kamili" text input (required, placeholder: "mfano: Juma Mwakasege").
  * "Namba ya Simu au Barua Pepe" input (required, placeholder: "mfano: 0712 345 678 au juma@example.com").
  * "Maelezo ya Kuchukua / Ombi Maalum" optional textarea (placeholder: "mfano: Nitachukua Jumamosi mchana").
* **Action Buttons**:
  * Large, high-visibility "Thibitisha Oda / Confirm & Submit Pre-Order" button with a right arrow icon.
  * Secondary "Endelea Kuangalia / Continue Browsing" button.
* **Empty Cart State**:
  * Shown when 0 items: gentle butcher-basket illustration, "Kikapu chako cha oda hakina kitu" ("Your pre-order cart is empty"), and a "Angalia Bidhaa / Browse Products" CTA.

#### 3. Google Stitch UI Prompt
```text
A sleek slide-over Cart & Checkout drawer for a Tanzanian butchery pre-order web application, opening from the right side over a dimmed backdrop blur. Warm minimalist design with refined typography, soft borders, and a maroon/gold accent.

Drawer Structure:
1. Header:
   - "Kikapu Chako cha Oda" heading with a badge "(3 bidhaa)".
   - Clean "✕" close button at top right.

2. Cart Items Container:
   - Item 1: Thumbnail of a goat meat cut (rounded-xl), item title "Nyama ya Mbuzi Bila Mfupa", price "TZS 12,000 kwa kilo". Quantity stepper pill with minus button, quantity "2 kg", plus button. Line total "TZS 24,000". Subtle red trash can delete icon.
   - Item 2: Thumbnail of chicken drumsticks, title "Mapaja ya Kuku Broiler", price "TZS 9,000 kwa kilo". Quantity stepper showing "1 kg". Line total "TZS 9,000". Delete icon.

3. Reservation Details Card (Soft warm cream or light maroon tinted card):
   - Total Items: 3
   - Total Amount: "TZS 33,000"
   - Label: "Malipo: Utalipa Dukani (Fedha Taslimu, M-Pesa, Tigo Pesa, au Airtel Money)"
   - Micro-copy: "Nyama itatolewa kwenye mzigo uliopo mara oda inapothibitishwa."

4. Customer Contact Form:
   - Field 1: Label "Jina Kamili *", input placeholder "Juma Mwakasege".
   - Field 2: Label "Namba ya Simu au Barua Pepe *", input placeholder "0712 345 678".
   - Field 3: Label "Maelezo ya Kuchukua (Si Lazima)", input placeholder "mfano: Nitachukua Jumamosi asubuhi".

5. Footer Actions:
   - Primary full-width button: "Weka Oda Yangu →" ("Place Pre-Order Reservation") in deep maroon with bold white text.
   - Secondary text button: "Endelea Kununua".
```

---

### Page 3: Customer Order Confirmation & Receipt

#### 1. Purpose & Flow
Displayed immediately after the customer submits their pre-order. Gives them a clear, reassuring receipt with an Order ID and itemized breakdown, confirming that the meat has been reserved from the butchery's live stock.

#### 2. Key Elements
* **Success Banner**:
  * Large animated/vibrant green checkmark icon inside an emerald circle.
  * Headline: "Oda Yako Imethibitishwa!" ("Pre-Order Confirmed!").
  * Sub-headline: "Tumehifadhi nyama yako. Muhtasari wa uthibitisho upo hapa chini."
* **Receipt Card**:
  * Order Reference Code badge: `ODA #NF-8492` (with copy-to-clipboard button).
  * Timestamp: `Imewekwa Septemba 17, 2026 • 12:45 mchana`.
  * Customer details block: Name, contact phone/email, and pickup notes.
  * Itemized table / list:
    * Kiasi (kg/pcs), Bidhaa, Bei kwa kipimo, Jumla.
  * Final Total bar: `TZS 33,000 Jumla ya Kulipa Dukani`.
* **Pickup Instructions Card**:
  * Step 1: "Tunakata na kuandaa nyama yako dukani." ("We prepare and cut your order at the butchery.")
  * Step 2: "Fika dukani wakati wa masaa ya kazi (Jumatatu–Jumamosi, 6:00 asubuhi – 8:00 jioni)."
  * Step 3: "Taja namba ya oda au jina lako ili kukamilisha malipo na kuchukua mzigo wako."
* **Action Buttons**:
  * "Chapisha / Hifadhi Risiti" ("Print / Save Receipt") button (secondary outline).
  * "Rudi Dukani" ("Return to Storefront") button (primary brand button).

#### 3. Google Stitch UI Prompt
```text
A delightful, trustworthy order confirmation and digital receipt page for a Tanzanian butchery pre-order system. Centered card layout with generous whitespace, crisp typography, and a warm local-market vibe.

Page Elements:
1. Centered Header:
   - Large emerald green circular badge with a crisp white checkmark icon.
   - Title: "Oda Yako Imethibitishwa!"
   - Subtitle: "Asante, Juma! Nyama yako imehifadhiwa kutoka kwenye mzigo wetu wa leo."

2. Digital Receipt Voucher Card (Elevated white card with dashed receipt divider lines):
   - Top row: Order ID chip "NF-8492" with a small "Copy ID" icon, and timestamp "Septemba 17, 2026 saa 12:45 mchana".
   - Customer block: "Imehifadhiwa kwa ajili ya: Juma Mwakasege (0712 345 678)".
   - Divider line (subtle perforated style).
   - Itemized list:
     * 2 kg Nyama ya Mbuzi Bila Mfupa — TZS 24,000 (TZS 12,000/kg)
     * 1 kg Mapaja ya Kuku Broiler — TZS 9,000 (TZS 9,000/kg)
   - Bottom summary row:
     * "Jumla ya Kulipa Dukani: TZS 33,000" (Large bold font).
     * Status tag: "Hali: Bado Kulipwa / Imehifadhiwa kwa Ajili ya Kuchukua".

3. Pickup Guide Box:
   - Light cream/amber tinted container with 3 horizontal step indicators:
     1. "Oda Imepokelewa" (Active green check)
     2. "Nyama Inakatwa na Kuandaliwa" (In Progress icon)
     3. "Kuchukua na Kulipa Dukani" (Storefront icon)
   - Store address: "Kariakoo, Barabara ya Tandamti, Dar es Salaam • Wazi Jumatatu–Jumamosi 6:00–20:00".

4. Bottom Action Buttons:
   - Primary button: "Rudi Dukani" in deep maroon.
   - Secondary button: "Chapisha Risiti" with printer icon.
```

---

### Page 4: Admin Inventory Management Dashboard

#### 1. Purpose & Flow
The main dashboard for the butchery owner/manager (`#/admin` or `#/admin/mzigo`). Provides live inventory visibility across mbuzi, ng'ombe, and kuku, quick stock adjustments in kilograms, low-stock alerts, and rapid navigation to orders and settings.

#### 2. Key Elements
* **Admin Top Navigation Bar**:
  * Brand & Admin tag: "Nyama Fresh Manager" with a maroon "Mwenye Duka Mode" ("Owner Mode") badge.
  * View navigation tabs:
    * `[Mzigo / Inventory]` (active tab with product count badge)
    * `[Oda / Pre-Orders]` (with red/amber badge indicating pending orders count)
    * `[Mipangilio / Settings & Data]`
  * Quick button: "👁️ Angalia Duka la Mteja" ("View Customer Storefront").
* **Metrics / KPI Cards**:
  * Card 1: Jumla ya Bidhaa / Total Products (e.g. `18 bidhaa`).
  * Card 2: Jumla ya Mzigo kwa Kilo / Total Stock in Kilograms (e.g. `142 kg`).
  * Card 3: Tahadhari ya Mzigo Kuisha / Low Stock Alerts (`3 bidhaa zinahitaji kuongezwa` in amber).
  * Card 4: Oda Zinazosubiri / Active Pre-Orders (`5 oda zinasubiri` in maroon).
* **Action & Search Toolbar**:
  * Search bar: "Tafuta bidhaa kwa jina au aina...".
  * Category dropdown filter: "Mbuzi", "Ng'ombe", "Kuku".
  * Stock level filter: "Zote", "Ipo Dukani", "Inaisha (< 5 kg)", "Imeisha".
  * Primary Action: `+ Ongeza Bidhaa Mpya` ("+ Add New Product") button (triggers modal).
* **Inventory Data Table / Grid**:
  * Columns:
    1. Product Thumbnail & Title (image preview, title, SKU/ID — e.g. `MB-014` for mbuzi, `NG-007` for ng'ombe, `KK-022` for kuku).
    2. Category (pill tag: Mbuzi / Ng'ombe / Kuku).
    3. Price (formatted as `TZS X,XXX / kg` or `TZS X,XXX / kipande` for whole birds).
    4. Stock Quantity:
       - Interactive number badge (in kg or vipande/pieces).
       - Visual status indicator: Green dot for healthy stock, amber badge for `< 5 kg`, red badge for `0`.
    5. Created / Updated Date (tarehe iliyokatwa — date last butchered/restocked).
    6. Actions column: "Hariri / Edit" button (pencil icon), "Futa / Delete" button (trash icon with confirmation popover).
* **Empty State**:
  * Friendly illustration if no products exist yet, with "Ongeza bidhaa yako ya kwanza dukani" ("Add your first product to inventory") CTA.

#### 3. Google Stitch UI Prompt
```text
A professional, modern Admin Inventory Dashboard for a Tanzanian meat butchery manager. Clean SaaS aesthetic with light warm-gray background, high-contrast dark charcoal headers, and deep maroon/gold accent details.

Layout Breakdown:
1. Top Navigation:
   - Brand logo "Nyama Fresh Butchery" with a pill badge "Store Manager".
   - Center Navigation Tabs: "Mzigo (18)" [Active underlined tab], "Oda (5)" [with notification dot], "Mipangilio & Data".
   - Right: "Angalia Duka Halisi ↗" ("Visit Live Storefront") button with external link icon.

2. KPI Metric Cards (Row of 4 cards):
   - Card 1: "Jumla ya Bidhaa" — "18" with subtitle "Katika aina 3: Mbuzi, Ng'ombe, Kuku".
   - Card 2: "Jumla ya Kilo Zilizopo" — "142 kg" with trend line icon.
   - Card 3: "Tahadhari ya Mzigo Kuisha" — "3 bidhaa" highlighted with an amber alert icon and pill "Zinahitaji Kuongezwa".
   - Card 4: "Oda Zinazosubiri" — "5 oda" (thamani TZS 312,000).

3. Inventory Action Bar:
   - Left: Search box with search icon "Tafuta mzigo...", and category dropdown "Aina Zote".
   - Filter chips: "Zote (18)", "Inaisha (3)", "Imeisha (1)".
   - Right: High-contrast primary button "+ Ongeza Bidhaa Mpya" in rich maroon.

4. Inventory Data Table:
   - Table Header: Bidhaa, Aina, Bei, Kiwango cha Mzigo, Hali, Vitendo.
   - Row 1: Image thumbnail of goat meat cut, "Nyama ya Mbuzi Bila Mfupa", Category "Mbuzi", Price "TZS 12,000/kg", Quantity "8 kg", Status badge "Ipo Dukani" (Green pill), Actions: Edit pencil icon, Delete trash icon.
   - Row 2: Thumbnail of beef ribs, "Mbavu za Ng'ombe", Category "Ng'ombe", Price "TZS 10,500/kg", Quantity "2 kg", Status badge "Inaisha (<5 kg)" (Amber badge), Actions: Edit, Delete.
   - Row 3: Thumbnail of whole free-range chicken, "Kuku wa Kienyeji", Category "Kuku", Price "TZS 15,000/kipande", Quantity "0 vipande", Status badge "Imeisha Dukani" (Red badge), Actions: Edit, Delete.
   - Row 4: Thumbnail of chicken drumsticks, "Mapaja ya Kuku Broiler", Category "Kuku", Price "TZS 9,000/kg", Quantity "15 kg", Status badge "Ipo Dukani", Actions: Edit, Delete.

5. Table Footer:
   - Showing 1-4 of 18 products, pagination controls.
```

---

### Page 5: Admin Add / Edit Product Modal

#### 1. Purpose & Flow
A focused modal dialog or slide-out drawer triggered when clicking "+ Ongeza Bidhaa Mpya" or "Hariri / Edit" on an existing product in the admin table. Ensures validation before updating the butchery's live stock.

#### 2. Key Elements
* **Modal Header**:
  * Title: "Ongeza Bidhaa Mpya" ("Add New Product") (or "Hariri Bidhaa: [Product Name]" / "Edit Product: [Product Name]").
  * Subtitle: "Jaza taarifa za bidhaa ili kusasisha mzigo wako."
  * Close "✕" icon.
* **Form Grid**:
  * **Jina la Bidhaa / Product Name** (Text input, required, e.g. "Nyama ya Ng'ombe Bila Mfupa").
  * **Aina / Category** (Dropdown with options: "Mbuzi (Goat)", "Ng'ombe (Beef/Cow)", "Kuku (Chicken)" — plus ability to enter a new cut).
  * **Kipimo / Unit of Sale** (Dropdown: "Kwa Kilo (per kg)" or "Kwa Kipande (per piece)" — for whole/live-weight birds).
  * **Bei (TZS) / Price** (Number input with `TZS` prefix addon, min `500`, step `500`).
  * **Kiasi Kilichopo / Initial Stock Quantity** (Number input, min `0`, decimal allowed for kg, integer for vipande).
  * **Maelezo ya Bidhaa / Product Description** (Multi-line textarea, placeholder: "Maelezo mafupi ya kipande, mfupa au bila mfupa, asili ya mnyama...").
  * **Kiungo cha Picha / Image URL** (URL text input with a real-time live thumbnail preview box next to it. If empty, displays a fallback camera placeholder).
* **Validation Messaging**:
  * Clear inline red text for required fields or invalid numeric inputs.
* **Modal Footer**:
  * "Ghairi / Cancel" (neutral outline button).
  * "Hifadhi Bidhaa / Save Product" (primary maroon button with disk/save icon).

#### 3. Google Stitch UI Prompt
```text
A modern, centered dialog modal window for "Ongeza / Hariri Bidhaa" (Add / Edit Product) in a Tanzanian butchery inventory management web app. Clean modal layout with soft drop shadow, rounded corners (rounded-2xl), and dark backdrop overlay.

Modal Structure:
1. Header:
   - Title: "Ongeza Bidhaa Mpya Dukani".
   - Subtitle: "Jaza taarifa hapa chini. Bidhaa hii itaonekana mara moja kwenye duka la mteja."
   - Top-right close "✕" icon.

2. Form Fields (2-column responsive layout):
   - Field 1 (Full width): Label "Jina la Bidhaa *", input with placeholder "mfano: Nyama ya Ng'ombe Bila Mfupa".
   - Field 2 (Left column): Label "Aina", dropdown select with "Mbuzi", "Ng'ombe", "Kuku".
   - Field 3 (Right column): Label "Kipimo", dropdown select with "Kwa Kilo (kg)", "Kwa Kipande".
   - Field 4 (Left column): Label "Bei (TZS) *", input with leading currency label "TZS", value "10,500".
   - Field 5 (Right column): Label "Kiasi Kilichopo *", numeric stepper input showing "10 kg".
   - Field 6 (Full width): Label "Maelezo", textarea showing "Nyama ya ng'ombe bila mfupa, iliyokatwa mapema leo asubuhi."
   - Field 7 (Full width): Label "Kiungo cha Picha", input with placeholder "https://images.example.com/...".
   - Below Image input: Live preview card showing a 100x100px square thumbnail of the meat cut with a subtle border and checkmark "Picha imepakiwa" ("Image loaded successfully").

3. Footer:
   - Right-aligned buttons:
     * "Ghairi" button (ghost/secondary style).
     * "Hifadhi Bidhaa Dukani" button (rich maroon filled button with checkmark icon).
```

---

### Page 6: Admin Pre-Orders Management Dashboard

#### 1. Purpose & Flow
The order fulfillment view for the butchery manager (`#/admin/oda`). Displays all customer pre-order submissions, contact info, item breakdown, and status toggle (`Inasubiri` / Pending vs `Imekamilika` / Fulfilled).

#### 2. Key Elements
* **Dashboard Sub-header**:
  * Title: "Foleni ya Oda Zinazosubiriwa" ("Pre-Order Fulfillment Queue").
  * Tab filter: "Oda Zote (8)", "Zinazosubiri (5)", "Zilizokamilika (3)".
  * Search bar: "Tafuta kwa jina la mteja, namba ya simu, au namba ya oda...".
* **Orders List / Cards**:
  * Order Card layout (or expandable data table):
    * **Header**: Order ID badge (`#NF-8492`), order timestamp (`Sept 17, 12:45 mchana`), Customer Name & Contact chip (`Juma Mwakasege • 0712 345 678`).
    * **Status Badge**:
      * Amber badge: `Inasubiri Kuchukuliwa` ("Pending Pickup")
      * Emerald badge: `Imekamilika na Kuchukuliwa` ("Fulfilled & Collected")
    * **Order Items breakdown**:
      * Mini list: `2 kg Nyama ya Mbuzi Bila Mfupa (TZS 24,000)`, `1 kg Mapaja ya Kuku Broiler (TZS 9,000)`.
    * **Total Amount**: `TZS 33,000`.
    * **Customer Notes**: `"Nitachukua Jumamosi asubuhi"`.
    * **Actions**:
      * "Weka Imekamilika" / "Rudisha Kuwa Inasubiri" toggle button.
      * "Futa Oda" ("Delete Order") button with confirmation alert.
* **Batch Actions**:
  * "Hamisha Oda kwenda CSV" ("Export Orders to CSV") (stretch feature utility).
  * "Futa Oda Zilizokamilika" ("Clear Fulfilled Orders") button.
* **Empty State**:
  * "Bado hakuna oda zinazoingia. Oda za wateja zitaonekana hapa moja kwa moja." ("No incoming pre-orders yet. Customer orders will appear here in real-time.")

#### 3. Google Stitch UI Prompt
```text
An Admin Pre-Order Management screen for a Tanzanian butchery tracking customer reservation orders. Modern, organized card-list layout with status-based color coding.

Screen Components:
1. Header Bar:
   - Title: "Oda za Nyama Zinazosubiriwa".
   - Tabs: "Oda Zote (8)", "Zinazosubiri (5)" [Active tab with amber counter badge], "Zimekamilika (3)".
   - Search bar: "Chuja kwa jina la mteja au namba ya oda...".

2. Order Queue (Card list):
   - Card 1 (Pending Order):
     * Top row: Bold Order ID "#NF-9201", placed "dakika 15 zilizopita", Amber badge "● Inasubiri Kuchukuliwa".
     * Customer Info: Customer icon, "Juma Mwakasege", phone "0712 345 678", email "juma@example.com".
     * Reserved Items Box:
       - 2 kg Nyama ya Mbuzi Bila Mfupa (TZS 12,000/kg) — TZS 24,000
       - 1 kg Mapaja ya Kuku Broiler (TZS 9,000/kg) — TZS 9,000
     * Order Total: "TZS 33,000 Jumla ya Kulipa".
     * Customer Note: "“Tafadhali hifadhi mpaka Jumamosi mchana.”"
     * Action Buttons:
       - Primary button: "✓ Weka Imekamilika" (Green outline button).
       - Secondary icon: Trash can "Futa Oda".

   - Card 2 (Fulfilled Order):
     * Top row: Order ID "#NF-9188", placed "Jana, saa 3:20 mchana", Green badge "✓ Imekamilika".
     * Customer Info: "Amina Salum • amina@example.com".
     * Items: 3 kg Nyama ya Ng'ombe Bila Mfupa (TZS 31,500).
     * Order Total: "TZS 31,500 (Imechukuliwa)".
     * Action Button: "Rudisha Kuwa Inasubiri" button.

3. Bottom utility bar:
   - "Hamisha Oda (CSV)" button with download icon.
```

---

### Page 7: Admin Settings & Data Reset Panel

#### 1. Purpose & Flow
A dedicated utility and troubleshooting panel (`#/admin/mipangilio`). Enables testing data persistence, loading realistic demo butchery inventory/orders (mbuzi, ng'ombe, kuku), downloading a backup of `localStorage`, or executing a clean wipe.

#### 2. Key Elements
* **Panel Title & Description**:
  * "Mipangilio ya Data Iliyohifadhiwa Ndani" ("Local Storage & Data Settings")
  * Explanation banner: "Data yote inahifadhiwa ndani ya kivinjari chako (`nf_mzigo` na `nf_oda`). Hakuna seva za mbali zinazotumika." ("All data is saved locally in your browser's `localStorage` (`nf_mzigo`/inventory and `nf_oda`/orders). No remote servers are used.")
* **Storage Diagnostics Card**:
  * Total Products Stored: `18 bidhaa`.
  * Total Orders Stored: `8 oda`.
  * LocalStorage Usage: `~4.2 KB / 5.0 MB zinazopatikana`.
* **Quick Data Action Tiles**:
  * **Tile 1: "Pakia Data ya Mfano (Sample Starter Data)"**
    * Description: "Inajaza haraka bidhaa 6 za mbuzi, ng'ombe na kuku zenye picha na viwango tofauti vya mzigo, pamoja na oda 2 za mfano kwa ajili ya kujaribu mfumo."
    * Action: "Pakia Data ya Mfano" ("Seed Sample Data") button.
  * **Tile 2: "Hamisha Nakala ya Data (JSON)"**
    * Description: "Pakua nakala ya mzigo wako na oda kama faili la `.json` la akiba."
    * Action: "Pakua JSON" ("Download JSON") button.
  * **Tile 3: "Rejesha Nakala ya Data"**
    * Description: "Rejesha mzigo na oda kutoka kwenye faili la JSON lililohifadhiwa awali."
    * Action: "Pakia JSON" ("Upload JSON") button.
* **Danger Zone Card**:
  * Red outline card with warning icon.
  * Title: "Futa Data Yote / Factory Reset".
  * Warning text: "Hatua hii itafuta kabisa bidhaa zote ulizoongeza, marekebisho ya mzigo, na oda za wateja kutoka kwenye kivinjari hiki." ("This will permanently delete all custom products, stock adjustments, and customer pre-orders from this browser's storage.")
  * Action button: "Futa Data Yote" ("Clear All Data") with a mandatory two-step confirmation prompt.

#### 3. Google Stitch UI Prompt
```text
A Settings & Data Management panel for a Tanzanian butchery's client-side localStorage web application. Clean settings page design with clear separation between standard management tools and a distinct red-accented Danger Zone.

Panel Structure:
1. Header:
   - Title: "Usimamizi wa Data na Hifadhi ya Ndani".
   - Subtitle: "Simamia database ya kivinjari chako, hifadhi nakala ya mzigo, au pakia data ya mfano.".

2. Storage Metrics Bar:
   - 3 metric widgets:
     * "Injini ya Database": "Browser LocalStorage (Inatumika)".
     * "Rekodi Zilizohifadhiwa": "18 Bidhaa • 8 Oda".
     * "Nafasi Inayotumika": "12.4 KB (0.2% ya 5MB inayoruhusiwa)".

3. Action Cards Grid (2 columns):
   - Card A: "Pakia Mzigo wa Mfano" with database icon. Description: "Jaza mzigo halisi wa mbuzi, ng'ombe na kuku pamoja na oda za mfano ili kujaribu mfumo na upunguzaji wa mzigo." Button: "Pakia Data ya Mfano".
   - Card B: "Hamisha Nakala ya Data" with download arrow icon. Description: "Hamisha mzigo wote na historia ya oda kwenye faili la nf-backup.json." Button: "Pakua JSON".
   - Card C: "Rejesha Nakala ya Data" with upload icon. Description: "Rejesha mzigo na oda zilizohamishwa awali kutoka kwenye faili." Button: "Chagua Faili".

4. Danger Zone (Distinct border with soft red background and red warning shield icon):
   - Title: "Futa Data Yote Iliyohifadhiwa".
   - Description: "Futa kabisa bidhaa zote za mzigo, oda, na kikapu cha ununuzi kutoka kwenye kivinjari hiki. Hatua hii haiwezi kutenduliwa."
   - Button: "Rudisha na Futa Data Yote" in crimson red with confirmation warning icon.
```

---

## 🚀 How to Use These Prompts in Google Stitch

1. Open **Google Stitch** (or use the Stitch MCP tools).
2. Select your desired aspect ratio (Desktop `16:9` for dashboards and storefront, or Mobile `9:16` for mobile viewport variants).
3. Copy the **Google Stitch UI Prompt** block from the respective page section above.
4. Paste it into the Stitch prompt input and generate the screen.
5. Save the generated screen variants for visual reference when coding the HTML/CSS components.
