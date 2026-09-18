/**
 * Hash-based router for client-side view switching
 */
import { dispatch } from '../store.js';

export const ROUTES = {
  SHOP: 'customer',
  ADMIN_INVENTORY: 'admin',
  ADMIN_ORDERS: 'admin-orders',
  ADMIN_SETTINGS: 'admin-settings',
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot-password',
};

/**
 * Parses the current location hash into an internal view identifier
 * @param {string} hash
 * @returns {string}
 */
export function getViewFromHash(hash) {
  const cleanHash = hash.replace(/^#\/?/, '').toLowerCase();

  if (cleanHash === 'shop' || cleanHash === 'customer' || cleanHash === 'store') {
    return ROUTES.SHOP;
  }
  if (cleanHash === 'login' || cleanHash === 'auth/login') {
    return ROUTES.LOGIN;
  }
  if (cleanHash === 'register' || cleanHash === 'auth/register') {
    return ROUTES.REGISTER;
  }
  if (cleanHash === 'forgot-password' || cleanHash === 'auth/forgot-password') {
    return ROUTES.FORGOT_PASSWORD;
  }
  if (cleanHash === 'admin' || cleanHash === 'admin/inventory') {
    return ROUTES.ADMIN_INVENTORY;
  }
  if (cleanHash === 'admin/orders') {
    return ROUTES.ADMIN_ORDERS;
  }
  if (cleanHash === 'admin/settings') {
    return ROUTES.ADMIN_SETTINGS;
  }
  return ROUTES.LOGIN;
}

/**
 * Programmatically navigate to a route
 * @param {string} route
 */
export function navigateTo(route) {
  window.location.hash = route;
}

/**
 * Initializes hashchange listener and dispatches initial view
 */
export function initRouter() {
  const handleRouting = () => {
    const view = getViewFromHash(window.location.hash);
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  window.addEventListener('hashchange', handleRouting);
  // Initial check
  handleRouting();
}
