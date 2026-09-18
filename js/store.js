/**
 * Central State Store & Pub/Sub Reducer
 * Follows unidirectional data flow: Action -> Reducer -> Persist -> Notify Subscribers
 */
import {
  loadInventory,
  saveInventory,
  loadOrders,
  saveOrders,
  loadSettings,
  saveSettings,
  clearAll
} from './storage.js';
import { createProduct, createOrder, getSampleProducts, getSampleOrders } from './models.js';

export const DEFAULT_SETTINGS = {
  // 1. Business Profile
  storeName: 'Nyama Fresh Butchery',
  storeTagline: 'Kariakoo Msimbazi, Dar es Salaam',
  storeAddress: 'Plot 42, Mtaa wa Msimbazi, Kariakoo, Dar es Salaam',
  storePhone: '0712 345 678',
  storeWhatsapp: '255712345678',
  storeEmail: 'info@nyamafresh.co.tz',
  logoUrl: '',
  tinNumber: '123-456-789',
  openingHours: '06:30 Asubuhi - 20:00 Usiku (Kila Siku)',
  operatingHoursPerDay: {
    Mon: '06:30 - 20:00',
    Tue: '06:30 - 20:00',
    Wed: '06:30 - 20:00',
    Thu: '06:30 - 20:00',
    Fri: '06:30 - 20:00',
    Sat: '06:30 - 21:00',
    Sun: '07:00 - 18:00',
  },
  branches: [
    { id: 'br_1', name: 'Kariakoo Main Duka', address: 'Mtaa wa Msimbazi, Dar es Salaam', phone: '0712 345 678', isDefault: true },
    { id: 'br_2', name: 'Kinondoni Branch', address: 'Manyanya, Kinondoni, Dar es Salaam', phone: '0788 111 222', isDefault: false },
  ],
  activeBranchId: 'br_1',

  // 2. Staff & Permissions
  currentRole: 'owner', // 'owner' (Mmiliki) | 'cashier' (Mhudumu) | 'butcher' (Mchinjaji)
  currentStaffName: 'Baraka Mwangi',
  securityPin: '1234',
  staffList: [
    { id: 'st_1', name: 'Baraka Mwangi', role: 'owner', phone: '0712345678', pin: '1234' },
    { id: 'st_2', name: 'Amina Salum', role: 'cashier', phone: '0755998877', pin: '2222' },
    { id: 'st_3', name: 'Juma Mchinjaji', role: 'butcher', phone: '0714112233', pin: '3333' },
  ],
  auditLog: [
    { id: 'log_1', timestamp: new Date().toISOString(), staffName: 'Baraka Mwangi', role: 'owner', action: 'Mfumo wa Nyama Fresh Umeanzishwa na kuwekwa mipangilio ya awali' }
  ],

  // 3. Payments
  currency: 'TZS',
  acceptedPaymentMethods: {
    cash: true,
    mpesa: true,
    tigopesa: true,
    airtel: true,
  },
  paymentTills: {
    mpesaTill: '554433',
    mpesaPaybill: '400200',
    tigopesaLipa: '887766',
    airtelLipa: '991122',
  },
  snippeConfig: {
    apiKey: '',
    webhookUrl: 'https://api.nyamafresh.co.tz/webhook/snippe',
    liveMode: false,
  },

  // 4. Order & Pickup Rules
  holdTimeHours: 3,
  minOrderKg: 0.5,
  minOrderAmount: 2000,
  cutoffTime: '19:30',
  autoCancelUnclaimedHours: 3,

  // 5. Notifications
  whatsappTemplate: 'Habari {customer}, oda yako ya nyama #{orderId} kutoka {storeName} ({branch}) ipo tayari kwa ajili ya kuchukuliwa! Jumla ni {total}. Karibu sana!',
  categoryThresholds: {
    "Nyama ya Ng'ombe": 10,
    "Nyama ya Mbuzi": 8,
    "Kuku wa Kienyeji": 5,
    "Oda Maalumu": 3,
    "All": 5,
  },
  lowStockThreshold: 5,

  // 6. Receipts & Printing
  receiptPrefix: 'NF',
  receiptFormat: 'NF-{YYYY}-{RAND}',
  thermalWidth: '80mm',

  // 7. Language & Appearance
  language: 'sw',
  themeColor: '#700a12',
};

const state = {
  inventory: [],
  orders: [],
  cart: [],
  settings: { ...DEFAULT_SETTINGS },
  currentView: 'login', // 'login' | 'customer' | 'admin' | 'admin-orders' | 'admin-settings'
  searchQuery: '',
  selectedCategory: 'All',
  orderFilterStatus: 'all', // 'all' | 'pending' | 'fulfilled'
  orderSearchQuery: '',
  isCartOpen: false,
  isProductModalOpen: false,
  editingProduct: null,
  latestOrder: null, // Holds recently submitted order for customer confirmation view
  adminReceiptOrder: null, // Holds order for admin receipt preview
  isManualOrderModalOpen: false, // For phone/counter order registration
  toast: null,
};

const listeners = new Set();

/**
 * Helper to record actions in the Staff Activity Log (Audit Trail)
 */
export function addAuditLogEntry(settings, staffName, role, action) {
  if (!settings.auditLog) settings.auditLog = [];
  settings.auditLog.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    staffName: staffName || settings.currentStaffName || 'Staff',
    role: role || settings.currentRole || 'owner',
    action,
  });
  if (settings.auditLog.length > 100) {
    settings.auditLog = settings.auditLog.slice(0, 100);
  }
}

/**
 * Checks for unclaimed pre-orders that have passed the hold time (e.g. 3h)
 */
export function checkAndCancelExpiredOrders(orders, autoCancelHours, settings) {
  if (!orders || !Array.isArray(orders) || autoCancelHours <= 0) return false;
  const now = Date.now();
  const maxHoldMs = autoCancelHours * 60 * 60 * 1000;
  let hasChanges = false;

  for (const order of orders) {
    if (order.status === 'pending') {
      const orderTime = new Date(order.createdAt).getTime();
      if (!isNaN(orderTime) && (now - orderTime) > maxHoldMs) {
        order.status = 'cancelled';
        order.cancelReason = `Pre-order imepitisha muda wa kuokota (${autoCancelHours}h)`;
        hasChanges = true;
        addAuditLogEntry(settings, 'Mfumo (Auto-Cancel)', 'system', `Oda #${order.id} imeahirishwa kiotomatiki (Imevuka masaa ${autoCancelHours})`);
      }
    }
  }
  return hasChanges;
}

/**
 * Dynamic theme primary color switcher
 */
export function applyThemeColor(colorHex) {
  if (typeof document === 'undefined') return;
  const color = colorHex || '#700a12';
  document.documentElement.style.setProperty('--color-primary', color);
  document.documentElement.style.setProperty('--color-primary-hover', color);
}

/**
 * Get a snapshot of current state
 * @returns {typeof state}
 */
export function getState() {
  return state;
}

/**
 * Subscribe a listener function to store updates
 * @param {(state: typeof state) => void} listener
 * @returns {() => void} Unsubscribe function
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Notify all subscribers of state changes
 */
function notify() {
  for (const listener of listeners) {
    try {
      listener(state);
    } catch (err) {
      console.error('[store] Subscriber error:', err);
    }
  }
}

/**
 * Dispatch an action to mutate state and notify UI
 * @param {{ type: string, payload?: any }} action
 */
export function dispatch(action) {
  if (!action || !action.type) {
    console.warn('[store] Invalid action dispatched:', action);
    return;
  }

  reducer(action);
  notify();
}

/**
 * Deep merge helper for settings backward compatibility
 */
function mergeSettings(target, source) {
  if (!source) return { ...target };
  const merged = { ...target, ...source };
  // Merge nested objects safely
  merged.operatingHoursPerDay = { ...target.operatingHoursPerDay, ...(source.operatingHoursPerDay || {}) };
  merged.acceptedPaymentMethods = { ...target.acceptedPaymentMethods, ...(source.acceptedPaymentMethods || {}) };
  merged.paymentTills = { ...target.paymentTills, ...(source.paymentTills || {}) };
  merged.snippeConfig = { ...target.snippeConfig, ...(source.snippeConfig || {}) };
  merged.categoryThresholds = { ...target.categoryThresholds, ...(source.categoryThresholds || {}) };
  if (Array.isArray(source.branches) && source.branches.length > 0) {
    merged.branches = source.branches;
  } else {
    merged.branches = target.branches;
  }
  if (Array.isArray(source.staffList) && source.staffList.length > 0) {
    merged.staffList = source.staffList;
  } else {
    merged.staffList = target.staffList;
  }
  if (Array.isArray(source.auditLog)) {
    merged.auditLog = source.auditLog;
  } else {
    merged.auditLog = target.auditLog;
  }
  return merged;
}

/**
 * Root reducer
 */
function reducer(action) {
  switch (action.type) {
    case 'INIT_DATA': {
      let storedInventory = loadInventory();
      let storedOrders = loadOrders();
      let storedSettings = loadSettings();

      if (!storedInventory || storedInventory.length === 0) {
        storedInventory = getSampleProducts();
        saveInventory(storedInventory);
      }
      if (!storedOrders) {
        storedOrders = getSampleOrders();
        saveOrders(storedOrders);
      }

      state.inventory = storedInventory;
      state.orders = storedOrders;
      state.settings = mergeSettings(DEFAULT_SETTINGS, storedSettings);

      // Auto-cancel expired pre-orders
      const hasExpired = checkAndCancelExpiredOrders(
        state.orders,
        state.settings.autoCancelUnclaimedHours || 3,
        state.settings
      );
      if (hasExpired) {
        saveOrders(state.orders);
        saveSettings(state.settings);
      }

      applyThemeColor(state.settings.themeColor);
      break;
    }

    case 'SET_VIEW': {
      state.currentView = action.payload || 'login';
      break;
    }

    case 'SET_SEARCH_QUERY': {
      state.searchQuery = action.payload || '';
      break;
    }

    case 'SET_CATEGORY': {
      state.selectedCategory = action.payload || 'All';
      break;
    }

    case 'SET_ORDER_FILTER_STATUS': {
      state.orderFilterStatus = action.payload || 'all';
      break;
    }

    case 'SET_ORDER_SEARCH_QUERY': {
      state.orderSearchQuery = action.payload || '';
      break;
    }

    case 'TOGGLE_CART': {
      state.isCartOpen = typeof action.payload === 'boolean' ? action.payload : !state.isCartOpen;
      break;
    }

    case 'OPEN_PRODUCT_MODAL': {
      state.isProductModalOpen = true;
      state.editingProduct = action.payload || null;
      break;
    }

    case 'CLOSE_PRODUCT_MODAL': {
      state.isProductModalOpen = false;
      state.editingProduct = null;
      break;
    }

    case 'ADD_PRODUCT': {
      const newProduct = createProduct(action.payload);
      state.inventory.unshift(newProduct);
      saveInventory(state.inventory);
      addAuditLogEntry(state.settings, state.settings.currentStaffName, state.settings.currentRole, `Ameongeza bidhaa mpya: "${newProduct.name}" (${newProduct.price} TZS, ${newProduct.quantity} kg)`);
      saveSettings(state.settings);
      triggerToast(`Bidhaa "${newProduct.name}" imeongezwa kwenye stoo!`, 'success');
      break;
    }

    case 'UPDATE_PRODUCT': {
      const idx = state.inventory.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) {
        const oldPrice = state.inventory[idx].price;
        const oldQty = state.inventory[idx].quantity;
        state.inventory[idx] = { ...state.inventory[idx], ...action.payload };
        saveInventory(state.inventory);
        
        let changeDesc = `Amehariri "${state.inventory[idx].name}"`;
        if (action.payload.price && action.payload.price !== oldPrice) {
          changeDesc += ` (Bei: ${oldPrice} -> ${action.payload.price} TZS)`;
        }
        if (action.payload.quantity !== undefined && action.payload.quantity !== oldQty) {
          changeDesc += ` (Stoo: ${oldQty} -> ${action.payload.quantity} kg)`;
        }
        addAuditLogEntry(state.settings, state.settings.currentStaffName, state.settings.currentRole, changeDesc);
        saveSettings(state.settings);

        triggerToast(`Mabadiliko ya "${state.inventory[idx].name}" yamehifadhiwa.`, 'success');
      }
      break;
    }

    case 'DELETE_PRODUCT': {
      const deleted = state.inventory.find(p => p.id === action.payload.id);
      state.inventory = state.inventory.filter(p => p.id !== action.payload.id);
      saveInventory(state.inventory);
      addAuditLogEntry(state.settings, state.settings.currentStaffName, state.settings.currentRole, `Amefuta bidhaa "${deleted ? deleted.name : 'Bidhaa'}" kutoka stoo`);
      saveSettings(state.settings);
      triggerToast(`"${deleted ? deleted.name : 'Bidhaa'}" imefutwa kutoka stoo.`, 'info');
      break;
    }

    case 'ADD_TO_CART': {
      const { productId, qty = 1 } = action.payload;
      const product = state.inventory.find(p => p.id === productId);
      if (!product || product.quantity <= 0) {
        triggerToast('Bidhaa hii imeisha stoo!', 'error');
        return;
      }

      const existingCartItem = state.cart.find(item => item.productId === productId);
      if (existingCartItem) {
        const nextQty = existingCartItem.qty + qty;
        if (nextQty > product.quantity) {
          triggerToast(`Huwezi kuweka zaidi ya kiasi kilichopo (${product.quantity})`, 'warning');
          return;
        }
        existingCartItem.qty = nextQty;
      } else {
        state.cart.push({
          productId: product.id,
          name: product.name,
          priceEach: product.price,
          imageUrl: product.imageUrl,
          qty: Math.min(qty, product.quantity),
        });
      }
      triggerToast(`Umeongeza ${product.name} kwenye kapu la pre-order`, 'success');
      break;
    }

    case 'UPDATE_CART_QTY': {
      const { productId, qty } = action.payload;
      const product = state.inventory.find(p => p.id === productId);
      const cartItem = state.cart.find(item => item.productId === productId);

      if (!cartItem) return;

      if (qty <= 0) {
        state.cart = state.cart.filter(item => item.productId !== productId);
      } else {
        const maxStock = product ? product.quantity : 9999;
        cartItem.qty = Math.min(qty, maxStock);
      }
      break;
    }

    case 'REMOVE_FROM_CART': {
      state.cart = state.cart.filter(item => item.productId !== action.payload.productId);
      break;
    }

    case 'CLEAR_CART': {
      state.cart = [];
      break;
    }

    case 'SUBMIT_ORDER': {
      const { customerName, contact, notes, paymentMethod } = action.payload;
      if (state.cart.length === 0) return;

      // Create order with active branch info
      const activeBranch = state.settings.branches?.find(b => b.id === state.settings.activeBranchId) || state.settings.branches[0];

      const newOrder = createOrder({
        customerName,
        contact,
        notes,
        paymentMethod: paymentMethod || 'Cash',
        branchName: activeBranch ? activeBranch.name : 'Kariakoo Main Duka',
        items: state.cart.map(c => ({
          productId: c.productId,
          name: c.name,
          qty: c.qty,
          priceEach: c.priceEach,
        })),
      });

      for (const cartItem of state.cart) {
        const prod = state.inventory.find(p => p.id === cartItem.productId);
        if (prod) {
          prod.quantity = Math.max(0, prod.quantity - cartItem.qty);
        }
      }

      state.orders.unshift(newOrder);

      addAuditLogEntry(state.settings, 'Mteja (Storefront)', 'customer', `Oda mpya #${newOrder.id} ya ${newOrder.customerName} imewasilishwa (${newOrder.total} TZS)`);

      saveInventory(state.inventory);
      saveOrders(state.orders);
      saveSettings(state.settings);

      state.cart = [];
      state.isCartOpen = false;
      state.latestOrder = newOrder;

      triggerToast(`Oda ya pre-order #${newOrder.id} imethibitishwa!`, 'success');
      break;
    }

    case 'DISMISS_CONFIRMATION': {
      state.latestOrder = null;
      break;
    }

    case 'VIEW_ADMIN_RECEIPT': {
      state.adminReceiptOrder = action.payload || null;
      break;
    }

    case 'CLOSE_ADMIN_RECEIPT': {
      state.adminReceiptOrder = null;
      break;
    }

    case 'OPEN_MANUAL_ORDER_MODAL': {
      state.isManualOrderModalOpen = true;
      break;
    }

    case 'CLOSE_MANUAL_ORDER_MODAL': {
      state.isManualOrderModalOpen = false;
      break;
    }

    case 'ADD_MANUAL_ORDER': {
      const { customerName, contact, notes, items, paymentMethod } = action.payload;
      if (!items || items.length === 0) {
        triggerToast('Tafadhali chagua angalau bidhaa 1', 'error');
        return;
      }
      const activeBranch = state.settings.branches?.find(b => b.id === state.settings.activeBranchId) || state.settings.branches[0];

      const newOrder = createOrder({
        customerName,
        contact,
        notes,
        paymentMethod: paymentMethod || 'Cash',
        branchName: activeBranch ? activeBranch.name : 'Kaunta',
        items,
      });

      for (const it of items) {
        const prod = state.inventory.find(p => p.id === it.productId);
        if (prod) {
          prod.quantity = Math.max(0, prod.quantity - it.qty);
        }
      }

      state.orders.unshift(newOrder);

      addAuditLogEntry(state.settings, state.settings.currentStaffName, state.settings.currentRole, `Amesajili oda ya kaunta #${newOrder.id} ya ${newOrder.customerName}`);

      saveInventory(state.inventory);
      saveOrders(state.orders);
      saveSettings(state.settings);

      state.isManualOrderModalOpen = false;
      triggerToast(`Oda ya simu #${newOrder.id} imesajiliwa kikamilifu!`, 'success');
      break;
    }

    case 'SET_ORDER_STATUS': {
      const { orderId, status } = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        order.status = status;
        saveOrders(state.orders);

        const statusText = status === 'fulfilled' ? 'Imekamilika (Fulfilled)' : status === 'ready' ? 'Ipo Tayari Kuchukua (Ready)' : 'Inasubiri (Pending)';

        addAuditLogEntry(state.settings, state.settings.currentStaffName, state.settings.currentRole, `Amebadili hali ya oda #${orderId} kuwa: ${statusText}`);
        saveSettings(state.settings);

        triggerToast(`Oda #${orderId} imewekwa kama ${statusText}.`, 'info');
      }
      break;
    }

    case 'DELETE_ORDER': {
      const deleted = state.orders.find(o => o.id === action.payload.orderId);
      state.orders = state.orders.filter(o => o.id !== action.payload.orderId);
      saveOrders(state.orders);

      addAuditLogEntry(state.settings, state.settings.currentStaffName, state.settings.currentRole, `Amefuta oda #${action.payload.orderId} (${deleted ? deleted.customerName : ''})`);
      saveSettings(state.settings);

      triggerToast('Rekodi ya oda imefutwa.', 'info');
      break;
    }

    case 'UPDATE_SETTINGS': {
      state.settings = { ...state.settings, ...action.payload };

      addAuditLogEntry(state.settings, state.settings.currentStaffName, state.settings.currentRole, 'Amesasisha mipangilio ya duka');
      saveSettings(state.settings);

      if (action.payload.themeColor) {
        applyThemeColor(action.payload.themeColor);
      }

      triggerToast('Mipangilio ya duka imehifadhiwa vizuri!', 'success');
      break;
    }

    case 'SET_STAFF_ROLE': {
      const { role, staffName } = action.payload;
      state.settings.currentRole = role;
      if (staffName) state.settings.currentStaffName = staffName;

      addAuditLogEntry(state.settings, state.settings.currentStaffName, role, `Amebadili nafasi inayofanya kazi kuwa: ${role.toUpperCase()}`);
      saveSettings(state.settings);

      triggerToast(`Umebadili nafasi ya kazi kuwa: ${role === 'owner' ? 'Mmiliki (Admin)' : role === 'cashier' ? 'Mhudumu (Cashier)' : 'Mchinjaji (Butcher)'}`, 'info');
      break;
    }

    case 'ADD_STAFF': {
      const newStaff = {
        id: `st_${Date.now()}`,
        name: action.payload.name,
        role: action.payload.role || 'cashier',
        phone: action.payload.phone || '',
        pin: action.payload.pin || '1234',
      };
      state.settings.staffList.push(newStaff);
      addAuditLogEntry(state.settings, state.settings.currentStaffName, state.settings.currentRole, `Ameongeza mfanyakazi mpya: ${newStaff.name} (${newStaff.role})`);
      saveSettings(state.settings);
      triggerToast(`Mfanyakazi "${newStaff.name}" ameongezwa kikamilifu.`, 'success');
      break;
    }

    case 'DELETE_STAFF': {
      const deletedStaff = state.settings.staffList.find(s => s.id === action.payload.staffId);
      state.settings.staffList = state.settings.staffList.filter(s => s.id !== action.payload.staffId);
      addAuditLogEntry(state.settings, state.settings.currentStaffName, state.settings.currentRole, `Amemfuta mfanyakazi: ${deletedStaff ? deletedStaff.name : ''}`);
      saveSettings(state.settings);
      triggerToast('Mfanyakazi ameondolewa.', 'info');
      break;
    }

    case 'ADD_BRANCH': {
      const newBranch = {
        id: `br_${Date.now()}`,
        name: action.payload.name,
        address: action.payload.address || '',
        phone: action.payload.phone || '',
        isDefault: false,
      };
      state.settings.branches.push(newBranch);
      addAuditLogEntry(state.settings, state.settings.currentStaffName, state.settings.currentRole, `Ameongeza tawi jipya la duka: ${newBranch.name}`);
      saveSettings(state.settings);
      triggerToast(`Tawi "${newBranch.name}" limeongezwa.`, 'success');
      break;
    }

    case 'DELETE_BRANCH': {
      state.settings.branches = state.settings.branches.filter(b => b.id !== action.payload.branchId);
      addAuditLogEntry(state.settings, state.settings.currentStaffName, state.settings.currentRole, `Amefuta tawi la duka`);
      saveSettings(state.settings);
      triggerToast('Tawi limeondolewa.', 'info');
      break;
    }

    case 'SWITCH_BRANCH': {
      state.settings.activeBranchId = action.payload.branchId;
      const b = state.settings.branches.find(br => br.id === action.payload.branchId);
      addAuditLogEntry(state.settings, state.settings.currentStaffName, state.settings.currentRole, `Amebadili duka linalofanya kazi kuwa: ${b ? b.name : 'Duka'}`);
      saveSettings(state.settings);
      triggerToast(`Duka linalotumika sasa ni: ${b ? b.name : 'Duka'}`, 'info');
      break;
    }

    case 'CHECK_EXPIRED_ORDERS': {
      const updated = checkAndCancelExpiredOrders(state.orders, state.settings.autoCancelUnclaimedHours || 3, state.settings);
      if (updated) {
        saveOrders(state.orders);
        saveSettings(state.settings);
      }
      break;
    }

    case 'IMPORT_BACKUP': {
      const { inventory, orders, settings } = action.payload;
      if (Array.isArray(inventory)) {
        state.inventory = inventory;
        saveInventory(inventory);
      }
      if (Array.isArray(orders)) {
        state.orders = orders;
        saveOrders(orders);
      }
      if (settings && typeof settings === 'object') {
        state.settings = mergeSettings(DEFAULT_SETTINGS, settings);
        saveSettings(state.settings);
        applyThemeColor(state.settings.themeColor);
      }
      triggerToast('Nakala ya data imerejeshwa kikamilifu!', 'success');
      break;
    }

    case 'RESET_ALL_DATA': {
      clearAll();
      state.inventory = [];
      state.orders = [];
      state.cart = [];
      state.latestOrder = null;
      state.settings = { ...DEFAULT_SETTINGS };
      applyThemeColor(DEFAULT_SETTINGS.themeColor);
      triggerToast('Data zote za stoo na oda zimefutwa.', 'warning');
      break;
    }

    case 'SEED_SAMPLE_DATA': {
      const sampleProds = getSampleProducts();
      const sampleOrds = getSampleOrders();
      state.inventory = sampleProds;
      state.orders = sampleOrds;
      state.settings = mergeSettings(DEFAULT_SETTINGS, state.settings);
      saveInventory(sampleProds);
      saveOrders(sampleOrds);
      saveSettings(state.settings);
      applyThemeColor(state.settings.themeColor);
      triggerToast('Data za mfano zimewekwa kikamilifu!', 'success');
      break;
    }

    case 'SHOW_TOAST': {
      state.toast = action.payload;
      break;
    }

    case 'HIDE_TOAST': {
      state.toast = null;
      break;
    }

    case 'RENDER':
      // UI-only re-render trigger without state mutation
      break;

    default:
      console.warn('[store] Unhandled action type:', action.type);
  }
}

let toastTimer = null;
function triggerToast(message, type = 'info') {
  if (toastTimer) clearTimeout(toastTimer);
  state.toast = { message, type, id: Date.now() };
  toastTimer = setTimeout(() => {
    dispatch({ type: 'HIDE_TOAST' });
  }, 4000);
}
