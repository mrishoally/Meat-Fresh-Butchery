/**
 * Application Entry Point
 * Initializes state from localStorage, configures router, and orchestrates UI rendering
 */
import { getState, subscribe, dispatch } from './store.js';
import { initRouter } from './views/router.js';
import { renderCustomerView } from './views/customerView.js';
import { renderAdminView } from './views/adminView.js';
import { renderLoginView, renderRegisterView, renderForgotPasswordView } from './views/authView.js';

/**
 * Top-level render dispatcher based on currentView state
 * @param {ReturnType<typeof getState>} state
 */
function render(state) {
  const view = state.currentView;

  if (view === 'login') {
    renderLoginView(state, dispatch);
  } else if (view === 'register') {
    renderRegisterView(state, dispatch);
  } else if (view === 'forgot-password') {
    renderForgotPasswordView(state, dispatch);
  } else if (view === 'customer') {
    renderCustomerView(state, dispatch);
  } else {
    // 'admin', 'admin-orders', 'admin-settings'
    renderAdminView(state, dispatch);
  }
}

// 1. Subscribe top-level render to store state changes
subscribe(render);

// 2. Initialize store data from localStorage
dispatch({ type: 'INIT_DATA' });

// 3. Initialize hash router (listens to hashchange and sets currentView)
initRouter();

// 4. Initial paint
render(getState());
