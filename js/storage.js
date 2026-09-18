/**
 * LocalStorage isolation layer for inventory, pre-orders, and store settings persistence
 */

export const STORAGE_KEYS = {
  INVENTORY: 'ipp_inventory',
  ORDERS: 'ipp_orders',
  SETTINGS: 'ipp_settings',
};

/**
 * Safely loads an item from localStorage with JSON parsing
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 */
function getItem(key, defaultValue) {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window) || !window.localStorage) {
      return defaultValue;
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[storage] Failed to load key "${key}" from localStorage:`, err);
    return defaultValue;
  }
}

/**
 * Safely writes an item to localStorage with JSON stringifying
 * @param {string} key
 * @param {*} value
 * @returns {boolean} Success status
 */
function setItem(key, value) {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window) || !window.localStorage) {
      return false;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[storage] Failed to persist key "${key}" to localStorage:`, err);
    return false;
  }
}

/**
 * Load inventory products from localStorage
 * @returns {Array<Object>}
 */
export function loadInventory() {
  return getItem(STORAGE_KEYS.INVENTORY, null);
}

/**
 * Save inventory products array to localStorage
 * @param {Array<Object>} inventory
 * @returns {boolean}
 */
export function saveInventory(inventory) {
  return setItem(STORAGE_KEYS.INVENTORY, inventory);
}

/**
 * Load orders from localStorage
 * @returns {Array<Object>}
 */
export function loadOrders() {
  return getItem(STORAGE_KEYS.ORDERS, null);
}

/**
 * Save orders array to localStorage
 * @param {Array<Object>} orders
 * @returns {boolean}
 */
export function saveOrders(orders) {
  return setItem(STORAGE_KEYS.ORDERS, orders);
}

/**
 * Load settings from localStorage
 * @returns {Object|null}
 */
export function loadSettings() {
  return getItem(STORAGE_KEYS.SETTINGS, null);
}

/**
 * Save settings to localStorage
 * @param {Object} settings
 * @returns {boolean}
 */
export function saveSettings(settings) {
  return setItem(STORAGE_KEYS.SETTINGS, settings);
}

/**
 * Completely clears application keys from localStorage
 */
export function clearAll() {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEYS.INVENTORY);
      window.localStorage.removeItem(STORAGE_KEYS.ORDERS);
      window.localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    }
    return true;
  } catch (err) {
    console.error('[storage] Failed to clear storage:', err);
    return false;
  }
}
