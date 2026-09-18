-- ============================================================
-- Nyama Fresh Butchery — Pre-Order Hub
-- Supabase PostgreSQL Schema
-- Mirrors the client-side localStorage data model exactly.
-- Designed for future cloud-sync migration from vanilla JS SPA.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE staff_role AS ENUM ('owner', 'cashier', 'butcher', 'system');
CREATE TYPE order_status AS ENUM ('pending', 'ready', 'fulfilled', 'cancelled');
CREATE TYPE payment_method AS ENUM ('Cash', 'M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Card');
CREATE TYPE thermal_width AS ENUM ('58mm', '80mm');

-- ============================================================
-- TABLE: stores
-- The top-level business/shop entity.
-- Settings like storeName, storePhone etc. live here.
-- ============================================================
CREATE TABLE stores (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL DEFAULT 'Nyama Fresh Butchery',
  tagline               TEXT NOT NULL DEFAULT 'Kariakoo Msimbazi, Dar es Salaam',
  address               TEXT,
  phone                 TEXT,
  whatsapp              TEXT,
  email                 TEXT,
  logo_url              TEXT,
  tin_number            TEXT,
  opening_hours         TEXT,
  currency              TEXT NOT NULL DEFAULT 'TZS',
  low_stock_threshold   INTEGER NOT NULL DEFAULT 5,
  hold_time_hours       INTEGER NOT NULL DEFAULT 3,
  min_order_kg          NUMERIC(6, 2) NOT NULL DEFAULT 0.5,
  min_order_amount      NUMERIC(10, 2) NOT NULL DEFAULT 2000,
  cutoff_time           TEXT NOT NULL DEFAULT '19:30',
  auto_cancel_hours     INTEGER NOT NULL DEFAULT 3,
  whatsapp_template     TEXT,
  receipt_prefix        TEXT NOT NULL DEFAULT 'NF',
  receipt_format        TEXT NOT NULL DEFAULT 'NF-{YYYY}-{RAND}',
  thermal_width         thermal_width NOT NULL DEFAULT '80mm',
  language              TEXT NOT NULL DEFAULT 'sw',
  theme_color           TEXT NOT NULL DEFAULT '#700a12',
  snippe_api_key        TEXT,
  snippe_webhook_url    TEXT,
  snippe_live_mode      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment methods (stored as individual flags + till numbers)
CREATE TABLE store_payment_config (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id           UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  cash_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  mpesa_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  tigopesa_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  airtel_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  mpesa_till         TEXT,
  mpesa_paybill      TEXT,
  tigopesa_lipa      TEXT,
  airtel_lipa        TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id)
);

-- Operating hours per day of week
CREATE TABLE store_operating_hours (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  open_time   TEXT NOT NULL DEFAULT '06:30',
  close_time  TEXT NOT NULL DEFAULT '20:00',
  is_closed   BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (store_id, day_of_week)
);

-- ============================================================
-- TABLE: branches
-- Multi-branch / duka locations.
-- ============================================================
CREATE TABLE branches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  address     TEXT,
  phone       TEXT,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one branch can be default per store
CREATE UNIQUE INDEX branches_one_default_per_store
  ON branches (store_id)
  WHERE is_default = TRUE;

-- ============================================================
-- TABLE: users (Profiles linked to auth.users)
-- Stores profile info for both app staff and pre-ordering customers.
-- ============================================================
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id    UUID REFERENCES stores(id) ON DELETE SET NULL,
  branch_id   UUID REFERENCES branches(id) ON DELETE SET NULL,
  email       TEXT UNIQUE,
  phone       TEXT,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'customer',
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_store_id ON users(store_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- TABLE: staff
-- Employees: owner (Mmiliki), cashier (Mhudumu), butcher (Mchinjaji)
-- ============================================================
CREATE TABLE staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  role        staff_role NOT NULL DEFAULT 'cashier',
  phone       TEXT,
  pin_hash    TEXT NOT NULL DEFAULT '1234',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: audit_log
-- Staff activity log — mirrors settings.auditLog[]
-- ============================================================
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  staff_id    UUID REFERENCES staff(id) ON DELETE SET NULL,
  staff_name  TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'system',
  action      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_store_created ON audit_log (store_id, created_at DESC);

-- ============================================================
-- TABLE: products (inventory)
-- Mirrors: state.inventory[] / createProduct()
-- ============================================================
CREATE TABLE products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id             UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  branch_id            UUID REFERENCES branches(id) ON DELETE SET NULL,
  name                 TEXT NOT NULL,
  description          TEXT NOT NULL DEFAULT '',
  price                NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  quantity             NUMERIC(8, 3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  category             TEXT NOT NULL DEFAULT 'General',
  image_url            TEXT NOT NULL DEFAULT '',
  low_stock_threshold  INTEGER,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX products_store_id ON products (store_id);
CREATE INDEX products_category  ON products (store_id, category);
CREATE INDEX products_active    ON products (store_id, is_active);

-- Per-category stock thresholds (mirrors settings.categoryThresholds)
CREATE TABLE category_thresholds (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id  UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category  TEXT NOT NULL,
  threshold INTEGER NOT NULL DEFAULT 5,
  UNIQUE (store_id, category)
);

-- ============================================================
-- TABLE: orders
-- Mirrors: state.orders[] / createOrder()
-- ============================================================
CREATE TABLE orders (
  id               TEXT PRIMARY KEY,
  store_id         UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  branch_id        UUID REFERENCES branches(id) ON DELETE SET NULL,
  customer_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  branch_name      TEXT NOT NULL DEFAULT '',
  customer_name    TEXT NOT NULL,
  contact          TEXT NOT NULL,
  notes            TEXT NOT NULL DEFAULT '',
  total            NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  status           order_status NOT NULL DEFAULT 'pending',
  payment_method   payment_method NOT NULL DEFAULT 'Cash',
  payment_paid     BOOLEAN NOT NULL DEFAULT FALSE,
  cancel_reason    TEXT,
  is_manual_order  BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_staff UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX orders_store_id ON orders (store_id);
CREATE INDEX orders_status   ON orders (store_id, status);
CREATE INDEX orders_created  ON orders (store_id, created_at DESC);
CREATE INDEX orders_customer ON orders (store_id, customer_name);
CREATE INDEX orders_customer_id ON orders (customer_id);

-- ============================================================
-- TABLE: order_items
-- Line items — mirrors order.items[]
-- ============================================================
CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  qty           NUMERIC(8, 3) NOT NULL CHECK (qty > 0),
  price_each    NUMERIC(10, 2) NOT NULL CHECK (price_each >= 0),
  subtotal      NUMERIC(10, 2) GENERATED ALWAYS AS (qty * price_each) STORED
);

CREATE INDEX order_items_order_id   ON order_items (order_id);
CREATE INDEX order_items_product_id ON order_items (product_id);

-- ============================================================
-- VIEWS
-- ============================================================

-- Admin orders dashboard view
CREATE VIEW v_order_summary AS
SELECT
  o.id,
  o.store_id,
  o.branch_name,
  o.customer_name,
  o.contact,
  o.notes,
  o.total,
  o.status,
  o.payment_method,
  o.payment_paid,
  o.cancel_reason,
  o.is_manual_order,
  o.created_at,
  o.updated_at,
  COUNT(oi.id)::INT AS item_count
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id;

-- Inventory with computed stock status
CREATE VIEW v_low_stock_products AS
SELECT
  p.*,
  COALESCE(ct.threshold, s.low_stock_threshold) AS effective_threshold,
  CASE
    WHEN p.quantity = 0 THEN 'out_of_stock'
    WHEN p.quantity < COALESCE(ct.threshold, s.low_stock_threshold) THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status
FROM products p
JOIN stores s ON s.id = p.store_id
LEFT JOIN category_thresholds ct
       ON ct.store_id = p.store_id AND ct.category = p.category
WHERE p.is_active = TRUE;

-- Most pre-ordered products (for stretch charts feature)
CREATE VIEW v_most_ordered_products AS
SELECT
  oi.product_id,
  oi.product_name,
  SUM(oi.qty)              AS total_qty_ordered,
  COUNT(DISTINCT oi.order_id) AS order_count,
  SUM(oi.subtotal)         AS total_revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status != 'cancelled'
GROUP BY oi.product_id, oi.product_name
ORDER BY total_qty_ordered DESC;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stores_updated_at
  BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payment_config_updated_at
  BEFORE UPDATE ON store_payment_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Decrement stock when an order item is inserted
CREATE OR REPLACE FUNCTION decrement_product_stock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE products
  SET quantity = GREATEST(0, quantity - NEW.qty)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_stock_on_order_item
  AFTER INSERT ON order_items
  FOR EACH ROW
  WHEN (NEW.product_id IS NOT NULL)
  EXECUTE FUNCTION decrement_product_stock();

-- Restore stock when an order is cancelled
CREATE OR REPLACE FUNCTION restore_product_stock_on_cancel()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE products p
    SET quantity = p.quantity + oi.qty
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restore_stock_on_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION restore_product_stock_on_cancel();

-- ============================================================
-- ============================================================
-- ROW LEVEL SECURITY (RLS) & RBAC POLICIES
-- ============================================================

-- Helper function for staff authorization without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_staff_record()
RETURNS TABLE (store_id UUID, role staff_role, staff_id UUID)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT s.store_id, s.role, s.id
  FROM public.staff s
  WHERE s.user_id = auth.uid() AND s.is_active = TRUE
  LIMIT 1;
$$;

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_thresholds ENABLE ROW LEVEL SECURITY;

-- STORES
CREATE POLICY "Public can view stores"              ON stores                FOR SELECT USING (TRUE);
CREATE POLICY "Owners can update store settings"    ON stores                FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.get_user_staff_record() s WHERE s.store_id = stores.id AND s.role = 'owner')
);

-- BRANCHES
CREATE POLICY "Public can view branches"            ON branches              FOR SELECT USING (TRUE);
CREATE POLICY "Owners can manage branches"          ON branches              FOR ALL USING (
  EXISTS (SELECT 1 FROM public.get_user_staff_record() s WHERE s.store_id = branches.store_id AND s.role = 'owner')
);

-- STORE OPERATING HOURS
CREATE POLICY "Public can view operating hours"     ON store_operating_hours FOR SELECT USING (TRUE);
CREATE POLICY "Owners can manage operating hours"   ON store_operating_hours FOR ALL USING (
  EXISTS (SELECT 1 FROM public.get_user_staff_record() s WHERE s.store_id = store_operating_hours.store_id AND s.role = 'owner')
);

-- STORE PAYMENT CONFIG
CREATE POLICY "Public can view payment config"      ON store_payment_config  FOR SELECT USING (TRUE);
CREATE POLICY "Owners can manage payment config"     ON store_payment_config  FOR ALL USING (
  EXISTS (SELECT 1 FROM public.get_user_staff_record() s WHERE s.store_id = store_payment_config.store_id AND s.role = 'owner')
);

-- CATEGORY THRESHOLDS
CREATE POLICY "Public can view category thresholds" ON category_thresholds   FOR SELECT USING (TRUE);
CREATE POLICY "Owners can manage category thresholds" ON category_thresholds FOR ALL USING (
  EXISTS (SELECT 1 FROM public.get_user_staff_record() s WHERE s.store_id = category_thresholds.store_id AND s.role = 'owner')
);

-- PRODUCTS
CREATE POLICY "Public can view active products"     ON products              FOR SELECT USING (
  is_active = TRUE OR EXISTS (SELECT 1 FROM public.get_user_staff_record() s WHERE s.store_id = products.store_id)
);
CREATE POLICY "Staff can manage products"           ON products              FOR ALL USING (
  EXISTS (SELECT 1 FROM public.get_user_staff_record() s WHERE s.store_id = products.store_id AND s.role IN ('owner', 'cashier'))
);

-- STAFF
CREATE POLICY "Staff can view store colleagues"     ON staff                 FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.get_user_staff_record() s WHERE s.store_id = staff.store_id) OR auth.role() = 'anon'
);
CREATE POLICY "Owners can manage staff"             ON staff                 FOR ALL USING (
  EXISTS (SELECT 1 FROM public.get_user_staff_record() s WHERE s.store_id = staff.store_id AND s.role = 'owner')
);

-- AUDIT LOG
CREATE POLICY "Staff can view audit logs"           ON audit_log             FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.get_user_staff_record() s WHERE s.store_id = audit_log.store_id)
);
CREATE POLICY "Staff can insert audit logs"         ON audit_log             FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.get_user_staff_record() s WHERE s.store_id = audit_log.store_id) OR auth.role() = 'anon'
);

-- ORDERS
CREATE POLICY "Public/Customers can create orders"  ON orders                FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Customers and staff can view orders" ON orders                FOR SELECT USING (
  customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.get_user_staff_record() s WHERE s.store_id = orders.store_id) OR auth.role() = 'anon'
);
CREATE POLICY "Staff and customers can update orders" ON orders              FOR UPDATE USING (
  customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.get_user_staff_record() s WHERE s.store_id = orders.store_id) OR auth.role() = 'anon'
);

-- ORDER ITEMS
CREATE POLICY "Public/Customers can create order items" ON order_items      FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Customers and staff can view order items" ON order_items     FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
    AND (
      o.customer_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.get_user_staff_record() s WHERE s.store_id = o.store_id)
      OR auth.role() = 'anon'
    )
  )
);

-- USERS
CREATE POLICY "Users can read own profile"          ON users                 FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"        ON users                 FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Staff can view store customers"      ON users                 FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM staff s
    WHERE s.user_id = auth.uid()
    AND s.store_id = users.store_id
  )
);
CREATE POLICY "Allow system insert on user signup" ON users                 FOR INSERT WITH CHECK (TRUE);

-- Trigger to automatically create profile row when user registers via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, full_name, role, avatar_url, metadata)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED DATA — Nyama Fresh Butchery defaults
-- ============================================================

DO $$
DECLARE
  v_store_id UUID;
  v_branch_main UUID;
  v_branch_kino UUID;
BEGIN
  -- Insert store
  INSERT INTO stores (
    name, tagline, address, phone, whatsapp, email,
    currency, low_stock_threshold, hold_time_hours,
    min_order_kg, min_order_amount, cutoff_time, auto_cancel_hours,
    whatsapp_template, receipt_prefix, receipt_format,
    thermal_width, language, theme_color
  ) VALUES (
    'Nyama Fresh Butchery',
    'Kariakoo Msimbazi, Dar es Salaam',
    'Plot 42, Mtaa wa Msimbazi, Kariakoo, Dar es Salaam',
    '0712 345 678', '255712345678', 'info@nyamafresh.co.tz',
    'TZS', 5, 3, 0.5, 2000, '19:30', 3,
    'Habari {customer}, oda yako ya nyama #{orderId} kutoka {storeName} ({branch}) ipo tayari kwa ajili ya kuchukuliwa! Jumla ni {total}. Karibu sana!',
    'NF', 'NF-{YYYY}-{RAND}', '80mm', 'sw', '#700a12'
  ) RETURNING id INTO v_store_id;

  -- Payment config
  INSERT INTO store_payment_config (store_id, cash_enabled, mpesa_enabled, tigopesa_enabled, airtel_enabled,
    mpesa_till, mpesa_paybill, tigopesa_lipa, airtel_lipa)
  VALUES (v_store_id, TRUE, TRUE, TRUE, TRUE, '554433', '400200', '887766', '991122');

  -- Operating hours (Mon-Sat 06:30-20:00, Sat 06:30-21:00, Sun 07:00-18:00)
  INSERT INTO store_operating_hours (store_id, day_of_week, open_time, close_time) VALUES
    (v_store_id, 'Mon', '06:30', '20:00'),
    (v_store_id, 'Tue', '06:30', '20:00'),
    (v_store_id, 'Wed', '06:30', '20:00'),
    (v_store_id, 'Thu', '06:30', '20:00'),
    (v_store_id, 'Fri', '06:30', '20:00'),
    (v_store_id, 'Sat', '06:30', '21:00'),
    (v_store_id, 'Sun', '07:00', '18:00');

  -- Category thresholds
  INSERT INTO category_thresholds (store_id, category, threshold) VALUES
    (v_store_id, 'Nyama ya Ng''ombe', 10),
    (v_store_id, 'Nyama ya Mbuzi', 8),
    (v_store_id, 'Kuku wa Kienyeji', 5),
    (v_store_id, 'Oda Maalumu', 3);

  -- Branches
  INSERT INTO branches (store_id, name, address, phone, is_default)
  VALUES (v_store_id, 'Kariakoo Main Duka', 'Mtaa wa Msimbazi, Dar es Salaam', '0712 345 678', TRUE)
  RETURNING id INTO v_branch_main;

  INSERT INTO branches (store_id, name, address, phone, is_default)
  VALUES (v_store_id, 'Kinondoni Branch', 'Manyanya, Kinondoni, Dar es Salaam', '0788 111 222', FALSE)
  RETURNING id INTO v_branch_kino;

  -- Staff
  INSERT INTO staff (store_id, name, role, phone, pin_hash) VALUES
    (v_store_id, 'Baraka Mwangi', 'owner',   '0712345678', '1234'),
    (v_store_id, 'Amina Salum',   'cashier', '0755998877', '2222'),
    (v_store_id, 'Juma Mchinjaji','butcher', '0714112233', '3333');

  -- Sample products (reflecting getSampleProducts() in models.js)
  INSERT INTO products (store_id, branch_id, name, description, price, quantity, category, image_url) VALUES
    (v_store_id, v_branch_main,
     'T-Bone Steak (Nyama ya Ng''ombe)',
     'Steki nene safi ya ng''ombe yenye mfupa wa T. Inafaa kuchoma au kukaanga.',
     18000, 12, 'Nyama ya Ng''ombe',
     'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80'),
    (v_store_id, v_branch_main,
     'Mbuzi Choma Cut (Mguu & Mbavu)',
     'Nyama laini ya mbuzi kijana, iliyokatwa tayari kwa supu au nyama choma ya wikendi.',
     22000, 4, 'Nyama ya Mbuzi',
     'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'),
    (v_store_id, v_branch_main,
     'Kuku wa Kienyeji (Mzima aliyesafishwa)',
     'Kuku safi wa kienyeji aliyekatwa na kusafishwa tayari kupikwa.',
     25000, 8, 'Kuku wa Kienyeji',
     'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80'),
    (v_store_id, v_branch_main,
     'Maini Safi ya Ng''ombe (1kg)',
     'Maini laini na yenye virutubisho vingi, fresh kutoka machinjioni asubuhi.',
     16000, 2, 'Nyama ya Ng''ombe',
     'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80'),
    (v_store_id, v_branch_main,
     'Mkia wa Ng''ombe (Oxtail)',
     'Mkia mnono wa ng''ombe uliokatwa vipande vipande kwa ajili ya supu mzito na rosti.',
     24000, 0, 'Oda Maalumu',
     'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'),
    (v_store_id, v_branch_main,
     'Nyama ya Kusaga (Beef Mince 1kg)',
     'Nyama laini iliyosagwa vizuri bila mafuta mengi kwa ajili ya sambusa, burger au pasta.',
     15000, 15, 'Nyama ya Ng''ombe',
     'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=600&q=80');

  -- Audit log seed entry
  INSERT INTO audit_log (store_id, staff_name, role, action)
  VALUES (v_store_id, 'Baraka Mwangi', 'owner', 'Mfumo wa Nyama Fresh Umeanzishwa na kuwekwa mipangilio ya awali');

END $$;
